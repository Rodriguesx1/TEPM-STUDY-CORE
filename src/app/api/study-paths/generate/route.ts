import { NextResponse } from "next/server";
import { answerWithFallback } from "@/lib/ai/providers";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";

type ChunkWithDocument = {
  content: string;
  documents?: { title?: string | null; theme?: string | null } | Array<{ title?: string | null; theme?: string | null }>;
};

function firstDocument(documents: ChunkWithDocument["documents"]) {
  return Array.isArray(documents) ? documents[0] : documents;
}

function parseJsonObject(answer: string) {
  const cleaned = answer
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
  }
  return JSON.parse(cleaned) as Record<string, unknown>;
}

function buildFallbackPlan(chunks: ChunkWithDocument[]) {
  const byTheme = new Map<string, { title: string; theme: string; goals: string[]; documents: Set<string> }>();

  for (const chunk of chunks) {
    const document = firstDocument(chunk.documents);
    const theme = document?.theme?.trim() || "Fundamentos terapeuticos";
    const title = document?.title?.trim() || "Material processado";
    const current = byTheme.get(theme) ?? {
      title: theme,
      theme,
      goals: [],
      documents: new Set<string>(),
    };
    current.documents.add(title);
    const excerpt = chunk.content.replace(/\s+/g, " ").slice(0, 140);
    if (excerpt && current.goals.length < 3) current.goals.push(`Estudar e resumir: ${excerpt}...`);
    byTheme.set(theme, current);
  }

  const modules = Array.from(byTheme.values()).slice(0, 6).map((module, index) => ({
    title: `${index + 1}. ${module.title}`,
    priority: index < 2 ? "alta" : "media",
    difficulty: index === 0 ? "iniciante" : index < 3 ? "intermediaria" : "avancada",
    documents: Array.from(module.documents),
    goals: module.goals.length ? module.goals : [`Revisar os principais pontos de ${module.title}.`],
    review: "Revisar em 24h, 7 dias e 30 dias.",
  }));

  return {
    title: "Trilha personalizada dos seus materiais",
    description: "Plano gerado a partir dos PDFs processados na sua biblioteca, organizado por tema e prioridade.",
    modules,
    seven_day_plan: modules.slice(0, 5).map((module, index) => ({
      day: index + 1,
      focus: module.title,
      action: "Ler o resumo, revisar os chunks principais e criar 3 perguntas de fixacao.",
    })),
    thirty_day_plan: modules.map((module, index) => ({
      week: Math.floor(index / 2) + 1,
      focus: module.title,
    })),
    review: "Use revisao espacada: dia 1, dia 7 e dia 30.",
    fixation_questions: modules.slice(0, 4).map((module) => `Como aplicar ${module.title.replace(/^\d+\.\s*/, "")} na pratica terapeutica?`),
    gaps: modules.length ? [] : ["Nao ha material suficiente para identificar lacunas."],
  };
}

export async function POST() {
  try {
    const supabase = await getServerSupabase();
    const admin = getSupabaseAdmin();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });

    const { data: chunks, error } = await admin
      .from("document_chunks")
      .select("content,chunk_index,documents!inner(title,theme)")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw error;
    if (!chunks?.length) return NextResponse.json({ error: "Envie e processe PDFs antes de gerar trilha." }, { status: 400 });

    const context = (chunks as ChunkWithDocument[])
      .map((chunk) => {
        const document = firstDocument(chunk.documents);
        return `PDF: ${document?.title ?? "Documento"}\nCategoria: ${document?.theme ?? "Sem categoria"}\n${chunk.content}`;
      })
      .join("\n\n---\n\n");
    const prompt = [
      "Crie uma trilha de estudos terapeuticos com base apenas nos materiais abaixo.",
      "Retorne em JSON valido com as chaves: title, description, modules, seven_day_plan, thirty_day_plan, review, fixation_questions, gaps.",
      "modules deve ser uma lista com title, priority, difficulty, documents e goals.",
      `Materiais:\n${context}`,
    ].join("\n\n");

    const result = await answerWithFallback(prompt);
    let parsed: Record<string, unknown> = {};
    try {
      parsed = parseJsonObject(result.answer);
    } catch {
      parsed = buildFallbackPlan(chunks as ChunkWithDocument[]);
    }
    if (!Array.isArray(parsed.modules) || parsed.modules.length === 0) {
      parsed = buildFallbackPlan(chunks as ChunkWithDocument[]);
    }

    const modules = Array.isArray(parsed.modules) ? parsed.modules : [];
    const fullPlan = {
      modules,
      seven_day_plan: parsed.seven_day_plan ?? [],
      thirty_day_plan: parsed.thirty_day_plan ?? [],
      review: parsed.review ?? null,
      fixation_questions: parsed.fixation_questions ?? [],
      gaps: parsed.gaps ?? [],
      generated_by: result.provider,
    };

    const created = await admin
      .from("study_paths")
      .insert({
        user_id: auth.user.id,
        title: String(parsed.title ?? "Trilha gerada com IA"),
        description: String(parsed.description ?? "Plano criado com base nos PDFs processados."),
        modules: fullPlan,
        status: "active",
      })
      .select("*")
      .single();
    if (created.error) throw created.error;

    await admin.from("audit_logs").insert({ user_id: auth.user.id, action: `study_path.${result.provider}`, entity_type: "study_paths", entity_id: created.data.id });
    return NextResponse.json({ path: created.data, plan: parsed, provider: result.provider });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao gerar trilha." }, { status: 500 });
  }
}
