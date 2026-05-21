import type { SupabaseClient } from "@supabase/supabase-js";
import { estimateTokens } from "@/lib/observability/logger";

export type AgentName =
  | "memory_core"
  | "therapeutic_specialist"
  | "study_path"
  | "summary_specialist"
  | "presentation_premium"
  | "cognitive_automation"
  | "recommendation_engine"
  | "voice_foundation";

export type AgentDecision = {
  agent: AgentName;
  taskType: string;
  instructions: string;
};

const agentInstructions: Record<AgentName, string> = {
  memory_core: "Atualize continuidade contextual, preferencias, dificuldades e temas recorrentes do usuario.",
  therapeutic_specialist: "Responda com organizacao emocional, didatica terapeutica e cuidado para nao diagnosticar.",
  study_path: "Organize a resposta como plano de estudo, prioridade, dificuldade, revisao e proximos passos.",
  summary_specialist: "Sintetize o material em resumo premium, topicos, lacunas e perguntas de fixacao.",
  presentation_premium: "Estruture roteiro, capitulos, slides editaveis, imagens sugeridas e versao para aula.",
  cognitive_automation: "Aplique revisao espacada, score de retencao, foco e automacao de aprendizado.",
  recommendation_engine: "Recomende o proximo estudo com base em dados reais, revisoes pendentes e lacunas.",
  voice_foundation: "Prepare resposta para leitura em voz, com frases claras, blocos curtos e ritmo natural.",
};

export function decideAgent(input: string): AgentDecision {
  const lower = input.toLowerCase();
  if (/(slide|apresenta|aula|roteiro|cap[ií]tulo|imagem)/i.test(lower)) {
    return { agent: "presentation_premium", taskType: "presentation", instructions: agentInstructions.presentation_premium };
  }
  if (/(trilha|plano|cronograma|ordem de estudo|7 dias|30 dias)/i.test(lower)) {
    return { agent: "study_path", taskType: "study_path", instructions: agentInstructions.study_path };
  }
  if (/(resum|sintetiz|apostila|simulado|quiz|flashcard|exerc[ií]cio)/i.test(lower)) {
    return { agent: "summary_specialist", taskType: "material_generation", instructions: agentInstructions.summary_specialist };
  }
  if (/(revis|reten[cç][aã]o|esquec|memor|pomodoro|foco)/i.test(lower)) {
    return { agent: "cognitive_automation", taskType: "revision", instructions: agentInstructions.cognitive_automation };
  }
  if (/(recomend|o que estudar|lacuna|dificuldade|abandono|evolu[cç][aã]o)/i.test(lower)) {
    return { agent: "recommendation_engine", taskType: "recommendation", instructions: agentInstructions.recommendation_engine };
  }
  if (/(voz|escuta|ler em voz|audio|avatar)/i.test(lower)) {
    return { agent: "voice_foundation", taskType: "voice_ready", instructions: agentInstructions.voice_foundation };
  }
  if (/(emoc|terapeut|paciente|sess[aã]o|acolh|clinica)/i.test(lower)) {
    return { agent: "therapeutic_specialist", taskType: "therapeutic_study", instructions: agentInstructions.therapeutic_specialist };
  }
  return { agent: "memory_core", taskType: "rag_answer", instructions: agentInstructions.memory_core };
}

export function buildAgentPrefix(decision: AgentDecision) {
  return [
    `Agente selecionado: ${decision.agent}.`,
    `Tipo de tarefa: ${decision.taskType}.`,
    decision.instructions,
    "Use memoria evolutiva e contexto RAG quando disponiveis, mas nao invente fatos ausentes.",
  ].join("\n");
}

export async function safeRecordAgentRun({
  admin,
  userId,
  decision,
  provider,
  input,
  output,
}: {
  admin: SupabaseClient;
  userId: string;
  decision: AgentDecision;
  provider: string;
  input: string;
  output: string;
}) {
  const tokenEstimate = estimateTokens(input) + estimateTokens(output);
  await admin
    .from("agent_runs")
    .insert({
      user_id: userId,
      agent_name: decision.agent,
      task_type: decision.taskType,
      input_summary: input.slice(0, 300),
      output_summary: output.slice(0, 500),
      status: "completed",
      provider,
      token_estimate: tokenEstimate,
      cost_estimate_cents: estimateAiCostCents(provider, tokenEstimate),
      finished_at: new Date().toISOString(),
    })
    .then(() => undefined);
}

export async function safeRecordAiCost({
  admin,
  userId,
  provider,
  route,
  operation,
  prompt,
  answer,
  cached,
  metadata = {},
}: {
  admin: SupabaseClient;
  userId: string;
  provider: string;
  route: string;
  operation: string;
  prompt: string;
  answer: string;
  cached: boolean;
  metadata?: Record<string, unknown>;
}) {
  const promptTokens = estimateTokens(prompt);
  const completionTokens = estimateTokens(answer);
  await admin
    .from("ai_cost_ledger")
    .insert({
      user_id: userId,
      provider,
      route,
      operation,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      estimated_cost_cents: estimateAiCostCents(provider, promptTokens + completionTokens),
      cached,
      metadata,
    })
    .then(() => undefined);
}

export function estimateAiCostCents(provider: string, tokens: number) {
  if (provider.includes("cache") || provider === "system") return 0;
  if (provider.includes("gemini")) return Number(((tokens / 1000) * 0.012).toFixed(4));
  if (provider.includes("openrouter")) return Number(((tokens / 1000) * 0.04).toFixed(4));
  return Number(((tokens / 1000) * 0.02).toFixed(4));
}
