import { NextResponse } from "next/server";
import { answerWithFallback } from "@/lib/ai/providers";
import { retrieveRelevantContext } from "@/lib/ai/rag";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await getServerSupabase();
    const admin = getSupabaseAdmin();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });

    const url = new URL(request.url);
    const chatId = url.searchParams.get("chatId");
    if (chatId) {
      const chat = await admin.from("ai_chats").select("id,title,created_at").eq("id", chatId).eq("user_id", auth.user.id).maybeSingle();
      if (chat.error) throw chat.error;
      if (!chat.data) return NextResponse.json({ error: "Conversa nao encontrada." }, { status: 404 });

      const messages = await admin
        .from("ai_messages")
        .select("id,chat_id,user_id,role,content,sources,created_at")
        .eq("chat_id", chatId)
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: true });
      if (messages.error) throw messages.error;
      return NextResponse.json({ chat: chat.data, messages: messages.data ?? [] });
    }

    const chats = await admin
      .from("ai_chats")
      .select("id,title,created_at")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(12);
    if (chats.error) throw chats.error;
    return NextResponse.json({ chats: chats.data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao carregar conversas IA." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await getServerSupabase();
    const admin = getSupabaseAdmin();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });

    const { question, chatId } = (await request.json()) as { question?: string; chatId?: string };
    if (!question?.trim()) return NextResponse.json({ error: "Pergunta obrigatoria." }, { status: 400 });

    const profileResult = await supabase
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
      .maybeSingle();
    const { data: profile } = profileResult.data
      ? profileResult
      : await supabase
      .from("users_profiles")
      .select("role")
      .eq("id", auth.user.id)
      .maybeSingle();
    const isAdmin = profile?.role === "admin";

    if (!isAdmin) {
      const { data: license } = await supabase
        .from("licenses")
        .select("id")
        .eq("user_id", auth.user.id)
        .in("status", ["active", "trial", "lifetime"])
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .maybeSingle();
      if (!license) return NextResponse.json({ error: "Licenca ativa obrigatoria para usar IA." }, { status: 403 });
    }

    const { context, sources, usedSemanticSearch } = await retrieveRelevantContext({
      admin,
      userId: auth.user.id,
      question,
      limit: 10,
    });
    const hasContext = Boolean(context.trim());
    const prompt = [
      "Voce e a Mentora IA do TEPM Study Core.",
      "Responda em portugues, com cuidado terapeutico, sem prometer diagnostico medico.",
      "Modo RAG estrito: use somente o contexto autorizado do usuario para responder sobre os materiais enviados.",
      "Se o contexto nao responder a pergunta, diga claramente que esse conteudo nao foi encontrado nos PDFs processados.",
      "Diferencie material enviado de orientacao geral. Nao invente titulos, paginas ou trechos.",
      "Organize a resposta por topicos, sugira proximos estudos, perguntas de fixacao e lacunas quando fizer sentido.",
      `Contexto autorizado:\n${hasContext ? context : "Nenhum material processado encontrado."}`,
      `Pergunta:\n${question}`,
    ].join("\n\n");

    let activeChatId = chatId ?? null;
    if (activeChatId) {
      const chatCheck = await admin.from("ai_chats").select("id").eq("id", activeChatId).eq("user_id", auth.user.id).maybeSingle();
      if (chatCheck.error) throw chatCheck.error;
      if (!chatCheck.data) return NextResponse.json({ error: "Conversa IA nao pertence ao usuario autenticado." }, { status: 403 });
    } else {
      const createdChat = await admin
        .from("ai_chats")
        .insert({ user_id: auth.user.id, title: question.trim().slice(0, 80) })
        .select("id")
        .single();
      if (createdChat.error) throw createdChat.error;
      activeChatId = createdChat.data.id;
    }
    if (!activeChatId) throw new Error("Nao foi possivel criar conversa IA.");

    const userMessage = await admin.from("ai_messages").insert({
      chat_id: activeChatId,
      user_id: auth.user.id,
      role: "user",
      content: question,
      sources: [],
    });
    if (userMessage.error) throw userMessage.error;

    const result = hasContext
      ? await answerWithFallback(prompt)
      : {
          provider: "system",
          answer:
            "Ainda nao encontrei conteudo processado nos seus PDFs para responder com base nos materiais. Envie e processe um PDF na Biblioteca antes de usar o modo RAG.",
        };

    const assistantMessage = await admin.from("ai_messages").insert({
      chat_id: activeChatId,
      user_id: auth.user.id,
      role: "assistant",
      content: result.answer,
      sources,
    });
    if (assistantMessage.error) throw assistantMessage.error;

    await admin.from("audit_logs").insert({
      user_id: auth.user.id,
      action: isAdmin ? `chat.${result.provider}.admin_unlimited` : `chat.${result.provider}`,
      entity_type: "ai",
    });
    return NextResponse.json({ answer: result.answer, provider: result.provider, chatId: activeChatId, sources, usedSemanticSearch });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha no chat IA." }, { status: 500 });
  }
}
