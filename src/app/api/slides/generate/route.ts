import { NextResponse } from "next/server";
import { answerWithFallback, parseAiJson } from "@/lib/ai/providers";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";

type SlidePayload = {
  title?: string;
  slides?: Array<{ title?: string; body?: string; speaker_notes?: string; layout?: string }>;
  markdown?: string;
};

export async function POST(request: Request) {
  try {
    const supabase = await getServerSupabase();
    const admin = getSupabaseAdmin();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });

    const { sourceType, sourceId, topic } = (await request.json()) as { sourceType?: "document" | "video" | "topic"; sourceId?: string; topic?: string };
    if (!sourceType) return NextResponse.json({ error: "sourceType obrigatorio." }, { status: 400 });

    let context = "";
    let title = topic || "Apresentacao TEPM";
    if (sourceType === "document" && sourceId) {
      const doc = await admin.from("documents").select("id,title,summary").eq("id", sourceId).eq("user_id", auth.user.id).maybeSingle();
      if (doc.error) throw doc.error;
      if (!doc.data) return NextResponse.json({ error: "PDF nao encontrado." }, { status: 404 });
      title = doc.data.title;
      const chunks = await admin.from("document_chunks").select("content").eq("document_id", sourceId).eq("user_id", auth.user.id).order("chunk_index");
      context = `PDF: ${doc.data.title}\nResumo: ${doc.data.summary ?? ""}\n${(chunks.data ?? []).map((row) => row.content).join("\n\n")}`;
    } else if (sourceType === "video" && sourceId) {
      const video = await admin.from("videos").select("id,title,summary").eq("id", sourceId).eq("user_id", auth.user.id).maybeSingle();
      if (video.error) throw video.error;
      if (!video.data) return NextResponse.json({ error: "Video nao encontrado." }, { status: 404 });
      title = video.data.title;
      const chunks = await admin.from("video_chunks").select("content").eq("video_id", sourceId).eq("user_id", auth.user.id).order("chunk_index");
      context = `Video: ${video.data.title}\nResumo: ${video.data.summary ?? ""}\n${(chunks.data ?? []).map((row) => row.content).join("\n\n")}`;
    } else {
      context = topic || "";
    }
    if (!context.trim()) return NextResponse.json({ error: "Nao ha conteudo suficiente para gerar slides." }, { status: 400 });

    const prompt = [
      "Gere uma apresentacao editavel em portugues com tema feminino classico premium.",
      "Visual: rosa queimado, vinho, dourado, creme, lilas e azul noite.",
      "Retorne apenas JSON valido com: title, markdown, slides.",
      "slides deve ter 6 a 10 itens com title, body, speaker_notes e layout.",
      `Conteudo base:\n${context.slice(0, 24000)}`,
    ].join("\n\n");
    const result = await answerWithFallback(prompt);
    const parsed = parseAiJson<SlidePayload>(result.answer, { title, slides: [], markdown: result.answer });
    const slides = parsed.slides?.length ? parsed.slides : [{ title, body: result.answer, speaker_notes: "", layout: "content" }];

    const project = await admin
      .from("slide_projects")
      .insert({
        user_id: auth.user.id,
        title: parsed.title ?? title,
        source_type: sourceType,
        source_id: sourceId ?? null,
        theme: { palette: ["rosa queimado", "vinho", "dourado", "creme", "lilas", "azul noite"] },
        slides,
        markdown: parsed.markdown ?? result.answer,
      })
      .select("id")
      .single();
    if (project.error) throw project.error;

    for (const [index, slide] of slides.entries()) {
      const inserted = await admin.from("slide_pages").insert({
        user_id: auth.user.id,
        project_id: project.data.id,
        page_index: index,
        title: slide.title ?? `Slide ${index + 1}`,
        body: slide.body ?? "",
        speaker_notes: slide.speaker_notes ?? "",
        layout: slide.layout ?? "content",
      });
      if (inserted.error) throw inserted.error;
    }

    await admin.from("audit_logs").insert({ user_id: auth.user.id, action: `slides.${result.provider}`, entity_type: "slide_projects", entity_id: project.data.id });
    return NextResponse.json({ projectId: project.data.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao gerar slides." }, { status: 500 });
  }
}
