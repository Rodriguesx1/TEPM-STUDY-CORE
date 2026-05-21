import { buildAgentPrefix, decideAgent, safeRecordAiCost, safeRecordAgentRun } from "@/lib/ai/orchestrator";
import { answerWithFallback } from "@/lib/ai/providers";
import { retrieveRelevantContext } from "@/lib/ai/rag";
import { getSessionContext } from "@/lib/auth/guards";
import { safeCaptureMemoryEvent } from "@/lib/intelligence/memory";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function streamText(payload: Record<string, unknown>) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export async function POST(request: Request) {
  const context = await getSessionContext();
  if (!context) return new Response(streamText({ type: "error", error: "Login obrigatorio." }), { status: 401 });
  if (!context.hasPremiumAccess) return new Response(streamText({ type: "error", error: "Licenca ativa obrigatoria." }), { status: 403 });

  const admin = getSupabaseAdmin();
  const { question } = (await request.json().catch(() => ({}))) as { question?: string };
  if (!question?.trim()) return new Response(streamText({ type: "error", error: "Pergunta obrigatoria." }), { status: 400 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const decision = decideAgent(question);
        controller.enqueue(encoder.encode(streamText({ type: "agent", agent: decision.agent, taskType: decision.taskType })));
        const retrieved = await retrieveRelevantContext({ admin, userId: context.userId, question, limit: 8 });
        controller.enqueue(encoder.encode(streamText({ type: "context", sources: retrieved.sources.length, semantic: retrieved.usedSemanticSearch })));
        const prompt = [
          "Voce e a Mentora IA em tempo real do TEPM Study.",
          buildAgentPrefix(decision),
          "Responda com base no contexto autorizado. Se nao houver contexto, diga isso claramente.",
          `Contexto:\n${retrieved.context || "Nenhum contexto encontrado."}`,
          `Pergunta:\n${question}`,
        ].join("\n\n");
        const result = retrieved.context.trim()
          ? await answerWithFallback(prompt)
          : { provider: "system", answer: "Nao encontrei conteudo processado para responder em modo RAG. Envie e processe materiais primeiro." };

        const parts = result.answer.match(/[\s\S]{1,220}/g) ?? [result.answer];
        for (const part of parts) {
          controller.enqueue(encoder.encode(streamText({ type: "chunk", content: part })));
        }
        await safeCaptureMemoryEvent({ admin, userId: context.userId, question, answer: result.answer, sourcesCount: retrieved.sources.length });
        await safeRecordAgentRun({ admin, userId: context.userId, decision, provider: result.provider, input: question, output: result.answer });
        await safeRecordAiCost({ admin, userId: context.userId, provider: result.provider, route: "/api/realtime/chat", operation: decision.taskType, prompt, answer: result.answer, cached: false, metadata: { streaming: true } });
        await admin.from("realtime_events").insert({ user_id: context.userId, channel: `user:${context.userId}:ai`, event_type: "ai_stream.completed", payload: { agent: decision.agent, provider: result.provider, sources: retrieved.sources.length } });
        controller.enqueue(encoder.encode(streamText({ type: "done", provider: result.provider, sources: retrieved.sources })));
      } catch (error) {
        controller.enqueue(encoder.encode(streamText({ type: "error", error: error instanceof Error ? error.message : "Falha no streaming IA." })));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
