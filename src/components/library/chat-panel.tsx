"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { AiChat, AiMessage, RagSource } from "@/types/database";

export function ChatPanel() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<RagSource[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<AiChat[]>([]);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/chat")
      .then((response) => response.json())
      .then((payload: { chats?: AiChat[] }) => setChats(payload.chats ?? []))
      .catch(() => setChats([]));
  }, []);

  async function loadChat(id: string) {
    const response = await fetch(`/api/chat?chatId=${id}`);
    const payload = (await response.json()) as { messages?: AiMessage[]; error?: string };
    if (!response.ok) throw new Error(payload.error ?? "Falha ao carregar conversa.");
    setChatId(id);
    setMessages(payload.messages ?? []);
    const lastAssistant = [...(payload.messages ?? [])].reverse().find((message) => message.role === "assistant");
    setAnswer(lastAssistant?.content ?? null);
    setSources(lastAssistant?.sources ?? []);
  }

  async function ask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setAnswer(null);
    setSources([]);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, chatId }),
      });
      const payload = (await response.json()) as { answer?: string; error?: string; sources?: RagSource[]; chatId?: string };
      if (!response.ok) throw new Error(payload.error ?? "Falha no chat.");
      setAnswer(payload.answer ?? "Sem resposta.");
      setSources(payload.sources ?? []);
      setChatId(payload.chatId ?? null);
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), chat_id: payload.chatId ?? "", user_id: "", role: "user", content: question, sources: [], created_at: new Date().toISOString() },
        {
          id: crypto.randomUUID(),
          chat_id: payload.chatId ?? "",
          user_id: "",
          role: "assistant",
          content: payload.answer ?? "Sem resposta.",
          sources: payload.sources ?? [],
          created_at: new Date().toISOString(),
        },
      ]);
      if (payload.chatId && !chats.some((chat) => chat.id === payload.chatId)) {
        setChats((current) => [{ id: payload.chatId!, user_id: "", title: question.slice(0, 80), created_at: new Date().toISOString() }, ...current]);
      }
      setQuestion("");
    } catch (error) {
      setAnswer(error instanceof Error ? error.message : "Nao foi possivel consultar a IA.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mentora IA</CardTitle>
        <CardDescription>Consulta seus chunks e usa Gemini com fallback OpenRouter quando configurado.</CardDescription>
      </CardHeader>
      <CardContent>
        {chats.length ? (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {chats.map((chat) => (
              <Button key={chat.id} type="button" variant={chat.id === chatId ? "primary" : "outline"} size="sm" onClick={() => loadChat(chat.id)}>
                {chat.title}
              </Button>
            ))}
          </div>
        ) : null}
        <form onSubmit={ask} className="space-y-4">
          <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Pergunte sobre seus materiais..." required />
          <Button type="submit" disabled={loading}>
            {loading ? "Consultando..." : "Perguntar"}
          </Button>
        </form>
        {answer ? (
          <div className="mt-5 space-y-4">
            {messages.length ? (
              <div className="rounded-[18px] border bg-white/80 p-4">
                <h3 className="text-sm font-semibold text-[#183c35]">Historico da conversa</h3>
                <div className="mt-3 space-y-2">
                  {messages.slice(-6).map((message) => (
                    <p key={message.id} className="rounded-[12px] bg-[#eef8f2] p-3 text-sm text-muted-foreground">
                      <span className="font-semibold text-[#183c35]">{message.role === "user" ? "Voce" : "Mentora IA"}: </span>
                      {message.content}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="rounded-[18px] bg-[#14352f] p-5 text-sm leading-7 text-white">{answer}</div>
            <div className="rounded-[18px] border bg-[#eef8f2] p-4">
              <h3 className="text-sm font-semibold text-[#183c35]">Fontes usadas</h3>
              {sources.length ? (
                <div className="mt-3 space-y-3">
                  {sources.map((source) => (
                    <article key={source.chunk_id} className="rounded-[14px] bg-white/80 p-3 text-sm">
                      <p className="font-semibold text-[#183c35]">
                        {source.document_title} - {source.source_type === "video" ? "trecho" : "chunk"} {source.chunk_index + 1}
                      </p>
                      {source.source_type === "video" ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Timestamp: {source.start_seconds ?? "?"}s - {source.end_seconds ?? "?"}s
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-muted-foreground">
                        Similaridade: {source.similarity === null ? "fallback" : `${Math.round(source.similarity * 100)}%`}
                      </p>
                      <p className="mt-2 leading-6 text-muted-foreground">{source.excerpt}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Nenhuma fonte encontrada nos PDFs processados.</p>
              )}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
