import { GoogleGenerativeAI } from "@google/generative-ai";
import { getEnv } from "@/lib/utils";

export async function generateEmbedding(text: string) {
  const key = getEnv("GEMINI_API_KEY");
  if (!key) return null;
  const client = new GoogleGenerativeAI(key);
  const models = ["embedding-001", "text-embedding-004"];

  for (const modelName of models) {
    try {
      const model = client.getGenerativeModel({ model: modelName });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch {
      // Keep PDF processing functional even when a provider/model is unavailable.
    }
  }

  return null;
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
        "X-Title": "TEPM Study",
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

export async function transcribeVideoWithGemini(bytes: ArrayBuffer, mimeType: string) {
  const geminiKey = getEnv("GEMINI_API_KEY");
  if (!geminiKey) throw new Error("GEMINI_API_KEY nao configurada para transcricao de video.");

  const client = new GoogleGenerativeAI(geminiKey);
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
  const base64 = Buffer.from(bytes).toString("base64");
  const prompt = [
    "Transcreva esta aula em video em portugues.",
    "Retorne apenas JSON valido com as chaves:",
    "transcript: texto completo,",
    "summary: resumo objetivo,",
    "topics: lista de topicos,",
    "segments: lista com start_seconds, end_seconds, title e text,",
    "fixation_questions: lista de perguntas de fixacao.",
    "Se nao conseguir entender o video, retorne JSON com transcript vazio e um resumo explicando a falha.",
  ].join("\n");

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: base64,
        mimeType,
      },
    },
  ]);
  return result.response.text();
}

export function parseAiJson<T extends Record<string, unknown>>(value: string, fallback: T): T {
  try {
    return JSON.parse(value.replace(/^```json/i, "").replace(/```$/i, "").trim()) as T;
  } catch {
    return fallback;
  }
}

const allowedCategories = [
  "Terapia e clinica",
  "Apostila e estudo",
  "Resumo e anotacao",
  "Caso pratico",
  "Documento administrativo",
  "Financeiro",
  "Comunidade",
  "Outros",
];

export async function classifyDocumentCategory(text: string) {
  const sample = text.replace(/\s+/g, " ").trim().slice(0, 5000);
  if (!sample) return "Outros";

  try {
    const result = await answerWithFallback(
      [
        "Classifique o conteudo do PDF em uma unica categoria.",
        `Categorias permitidas: ${allowedCategories.join(", ")}.`,
        "Responda somente com o nome exato de uma categoria permitida, sem explicacao.",
        `Conteudo: ${sample}`,
      ].join("\n\n"),
    );
    const normalized = result.answer.trim().replace(/^["']|["']$/g, "");
    const match = allowedCategories.find((category) => category.toLowerCase() === normalized.toLowerCase());
    if (match) return match;
  } catch {
    // Local fallback below keeps processing reliable.
  }

  const lower = sample.toLowerCase();
  if (/(ordem de servi[cç]o|cnpj|cpf|valor|pagamento|cliente|dispositivo|reparo|nota fiscal)/i.test(lower)) {
    return "Documento administrativo";
  }
  if (/(r\$|financeiro|custo|receita|despesa|boleto|fatura)/i.test(lower)) return "Financeiro";
  if (/(terapia|terapeutic|paciente|sess[aã]o|clinica|diagn[oó]stico|interven[cç][aã]o)/i.test(lower)) return "Terapia e clinica";
  if (/(apostila|m[oó]dulo|aula|cap[ií]tulo|exerc[ií]cio|avalia[cç][aã]o)/i.test(lower)) return "Apostila e estudo";
  if (/(resumo|anota[cç][aã]o|insight|observa[cç][aã]o)/i.test(lower)) return "Resumo e anotacao";
  if (/(caso pr[aá]tico|estudo de caso|exemplo cl[ií]nico)/i.test(lower)) return "Caso pratico";
  if (/(grupo|comunidade|sala|membro|codigo)/i.test(lower)) return "Comunidade";
  return "Outros";
}
