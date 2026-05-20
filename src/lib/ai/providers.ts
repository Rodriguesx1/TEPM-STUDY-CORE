import { GoogleGenerativeAI } from "@google/generative-ai";
import { getEnv } from "@/lib/utils";

export async function generateEmbedding(text: string) {
  const key = getEnv("GEMINI_API_KEY");
  if (!key) return null;
  const client = new GoogleGenerativeAI(key);
  const model = client.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

export async function answerWithFallback(prompt: string) {
  const geminiKey = getEnv("GEMINI_API_KEY");
  if (geminiKey) {
    try {
      const client = new GoogleGenerativeAI(geminiKey);
      const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      return { provider: "gemini", answer: result.response.text() };
    } catch {
      // Falls through to OpenRouter without leaking provider errors to users.
    }
  }

  const openRouterKey = getEnv("OPENROUTER_API_KEY");
  if (openRouterKey) {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": getEnv("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000",
        "X-Title": "TEPM Study Core",
      },
      body: JSON.stringify({
        model: getEnv("OPENROUTER_MODEL") ?? "google/gemini-2.0-flash-001",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!response.ok) throw new Error("OpenRouter indisponivel ou credencial invalida.");
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return { provider: "openrouter", answer: payload.choices?.[0]?.message?.content ?? "Sem resposta do provedor." };
  }

  throw new Error("Nenhum provedor de IA configurado no servidor.");
}
