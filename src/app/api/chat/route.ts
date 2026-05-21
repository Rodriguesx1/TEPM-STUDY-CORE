import { NextResponse } from "next/server";
import { buildAiCacheKey, getCachedAiAnswer, storeCachedAiAnswer } from "@/lib/ai/cache";
import { buildAgentPrefix, decideAgent, safeRecordAgentRun, safeRecordAiCost } from "@/lib/ai/orchestrator";
import { answerWithFallback } from "@/lib/ai/providers";
import { retrieveRelevantContext } from "@/lib/ai/rag";
import { safeCaptureMemoryEvent } from "@/lib/intelligence/memory";
import { estimateTokens, logSystemEvent } from "@/lib/observability/logger";
import { checkRateLimit, ipKey } from "@/lib/security/rate-limit";
import { validateSameOrigin } from "@/lib/security/request-guard";
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
  const startedAt = Date.now();
  let logUserId: string | null = null;
  try {
    const originError = validateSameOrigin(request);
    if (originError) return originError;
    const supabase = await getServerSupabase();
    const admin = getSupabaseAdmin();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
    logUserId = auth.user.id;

    const { question, chatId } = (await request.json()) as { question?: string; chatId?: string };
    if (!question?.trim()) return NextResponse.json({ error: "Pergunta obrigatoria." }, { status: 400 });
    if (question.length > 4000) return NextResponse.json({ error: "Pergunta excede o limite de 4000 caracteres." }, { status: 413 });

    const rate = await checkRateLimit({
      admin,
      userId: auth.user.id,
      route: "/api/chat",
      key: ipKey(request, auth.user.id),
      maxRequests: 30,
      windowSeconds: 3600,
    });
    if (!rate.allowed) {
      await logSystemEvent(admin, { userId: auth.user.id, level: "warn", event: "rate_limit.blocked", source: "security", route: "/api/chat", metadata: { current_count: rate.currentCount, reset_at: rate.resetAt } });
      return NextResponse.json({ error: "Limite de perguntas por hora atingido. Tente novamente mais tarde.", resetAt: rate.resetAt }, { status: 429 });
    }

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
    const cacheKey = buildAiCacheKey(auth.user.id, question, sources);
    const cached = hasContext ? await getCachedAiAnswer(admin, auth.user.id, cacheKey) : null;
    const agentDecision = decideAgent(question);
    const prompt = [
      "Voce e a Mentora IA do TEPM Study.",
      buildAgentPrefix(agentDecision),
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

    const result = cached
      ? { provider: `${cached.provider}:cache`, answer: cached.answer }
      : hasContext
      ? await answerWithFallback(prompt)
      : {
          provider: "system",
          answer:
            "Ainda nao encontrei conteudo processado nos seus PDFs para responder com base nos materiais. Envie e processe um PDF na Biblioteca antes de usar o modo RAG.",
        };

    if (hasContext && !cached) {
      await storeCachedAiAnswer(admin, { userId: auth.user.id, cacheKey, provider: result.provider, prompt, answer: result.answer, sources });
    }

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
      action: isAdmin ? `chat.${agentDecision.agent}.${result.provider}.admin_unlimited` : `chat.${agentDecision.agent}.${result.provider}`,
      entity_type: "ai",
    });
    await safeCaptureMemoryEvent({ admin, userId: auth.user.id, question, answer: result.answer, sourcesCount: sources.length });
    await safeRecordAgentRun({ admin, userId: auth.user.id, decision: agentDecision, provider: result.provider, input: question, output: result.answer });
    await safeRecordAiCost({
      admin,
      userId: auth.user.id,
      provider: result.provider,
      route: "/api/chat",
      operation: agentDecision.taskType,
      prompt,
      answer: result.answer,
      cached: Boolean(cached),
      metadata: { agent: agentDecision.agent, source_count: sources.length },
    });
    await logSystemEvent(admin, {
      userId: auth.user.id,
      level: "info",
      event: "ai.chat.completed",
      source: "ai",
      route: "/api/chat",
      durationMs: Date.now() - startedAt,
      metadata: {
        provider: result.provider,
        agent: agentDecision.agent,
        cached: Boolean(cached),
        used_semantic_search: usedSemanticSearch,
        source_count: sources.length,
        token_estimate: estimateTokens(prompt) + estimateTokens(result.answer),
      },
    });
    return NextResponse.json({ answer: result.answer, provider: result.provider, chatId: activeChatId, sources, usedSemanticSearch });
  } catch (error) {
    await logSystemEvent(getSupabaseAdmin(), {
      userId: logUserId,
      level: "error",
      event: "ai.chat.failed",
      source: "ai",
      route: "/api/chat",
      durationMs: Date.now() - startedAt,
      metadata: { message: error instanceof Error ? error.message : "Falha no chat IA." },
    });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha no chat IA." }, { status: 500 });
  }
}
