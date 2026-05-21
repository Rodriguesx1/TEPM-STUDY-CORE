import type { SupabaseClient } from "@supabase/supabase-js";

function compactTitle(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 90) || "Interacao IA";
}

function inferMemoryType(text: string) {
  if (/(dificuldade|nao entendi|confuso|duvida|travado)/i.test(text)) return "difficulty";
  if (/(prefiro|gosto|formato|tom|estilo)/i.test(text)) return "preference";
  if (/(meta|objetivo|quero estudar|preciso estudar)/i.test(text)) return "goal";
  return "theme";
}

export async function safeCaptureMemoryEvent({
  admin,
  userId,
  question,
  answer,
  sourcesCount,
}: {
  admin: SupabaseClient;
  userId: string;
  question: string;
  answer: string;
  sourcesCount: number;
}) {
  const memoryType = inferMemoryType(question);
  const title = compactTitle(question);
  const content = `Pergunta: ${question.slice(0, 600)}\nResposta: ${answer.slice(0, 900)}`;
  await admin
    .from("memory_events")
    .insert({
      user_id: userId,
      event_type: `chat.${memoryType}`,
      source_type: "ai_chat",
      title,
      content,
      weight: sourcesCount ? 0.75 : 0.45,
      metadata: { sources_count: sourcesCount },
    })
    .then(() => undefined);

  await admin
    .from("user_memory")
    .upsert(
      {
        user_id: userId,
        memory_type: memoryType,
        title,
        content,
        confidence: sourcesCount ? 0.76 : 0.58,
        source_type: "ai_chat",
        last_seen_at: new Date().toISOString(),
        metadata: { sources_count: sourcesCount },
      },
      { onConflict: "user_id,memory_type,title" },
    )
    .then(() => undefined);
}

export function buildLocalRecommendations(input: {
  documents: Array<{ id: string; title: string; theme: string | null; created_at?: string }>;
  revisions: Array<{ title: string; priority: string; due_at: string; theme: string | null }>;
  memories: Array<{ memory_type: string; title: string; confidence: number }>;
}) {
  const recommendations: Array<{ title: string; reason: string; priority: string; action: string }> = [];
  for (const revision of input.revisions.slice(0, 3)) {
    recommendations.push({
      title: `Revisar: ${revision.title}`,
      reason: `Fila de revisao marcada como ${revision.priority}.`,
      priority: revision.priority,
      action: "Abrir material, responder 3 perguntas e marcar revisao concluida.",
    });
  }
  for (const document of input.documents.slice(0, 3)) {
    recommendations.push({
      title: `Consolidar ${document.theme ?? "material recente"}`,
      reason: `PDF processado: ${document.title}.`,
      priority: "medium",
      action: "Criar resumo premium, flashcards e uma pergunta para a Mentora IA.",
    });
  }
  for (const memory of input.memories.filter((item) => item.memory_type === "difficulty").slice(0, 2)) {
    recommendations.push({
      title: `Reforcar dificuldade: ${memory.title}`,
      reason: `Memoria evolutiva registrou dificuldade com confianca ${(memory.confidence * 100).toFixed(0)}%.`,
      priority: "high",
      action: "Gerar explicacao em passos e revisar em 24 horas.",
    });
  }
  return recommendations.slice(0, 8);
}
