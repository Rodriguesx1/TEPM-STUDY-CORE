"use client";

import { useEffect, useState } from "react";
import { Bell, Boxes, Check, CloudOff, MessageSquare, Radio, Send, Share2, Store, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type MarketplaceItem = { id: string; item_type: string; title: string; description: string | null; visibility: string; downloads_count: number };
type CollaborationPayload = {
  sessions: Array<{ id: string; title: string; status: string; created_at: string }>;
  comments: Array<{ id: string; body: string; created_at: string; documents?: { title?: string } | Array<{ title?: string }> }>;
  documents: Array<{ id: string; title: string; theme: string | null }>;
};
type NotificationItem = { id: string; title: string; body: string; status: string; action_url: string | null };
type OfflineItem = { id: string; operation: string; status: string; created_at: string };

export function EcosystemPanel() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [collab, setCollab] = useState<CollaborationPayload>({ sessions: [], comments: [], documents: [] });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [offline, setOffline] = useState<OfflineItem[]>([]);
  const [streamQuestion, setStreamQuestion] = useState("O que devo revisar agora com base nos meus materiais?");
  const [streamAnswer, setStreamAnswer] = useState("");
  const [title, setTitle] = useState("Template terapeutico premium");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const [marketplace, collaboration, notificationResponse, offlineResponse] = await Promise.all([
      fetch("/api/marketplace", { cache: "no-store" }),
      fetch("/api/collaboration", { cache: "no-store" }),
      fetch("/api/notifications", { cache: "no-store" }),
      fetch("/api/offline/sync", { cache: "no-store" }),
    ]);
    if (marketplace.ok) setItems(((await marketplace.json()) as { items?: MarketplaceItem[] }).items ?? []);
    if (collaboration.ok) setCollab((await collaboration.json()) as CollaborationPayload);
    if (notificationResponse.ok) setNotifications(((await notificationResponse.json()) as { notifications?: NotificationItem[] }).notifications ?? []);
    if (offlineResponse.ok) setOffline(((await offlineResponse.json()) as { queue?: OfflineItem[] }).queue ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createTemplate() {
    setLoading(true);
    try {
      const response = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType: "template", title, description: "Template privado para estudos terapeuticos.", markdown: `# ${title}\n\n- Objetivo\n- Aplicacao\n- Perguntas de revisao`, visibility: "tenant" }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Falha ao criar template.");
      setMessage("Template salvo no marketplace privado.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao criar template.");
    } finally {
      setLoading(false);
    }
  }

  async function createCollaboration() {
    const documentId = collab.documents[0]?.id;
    if (!documentId) return setMessage("Processe um PDF antes de criar colaboracao.");
    setLoading(true);
    try {
      const response = await fetch("/api/collaboration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Revisao coletiva", documentId }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Falha ao criar colaboracao.");
      setMessage("Sessao colaborativa criada.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao criar colaboracao.");
    } finally {
      setLoading(false);
    }
  }

  async function addComment() {
    const documentId = collab.documents[0]?.id;
    if (!documentId || !comment.trim()) return setMessage("Documento e comentario sao obrigatorios.");
    const response = await fetch("/api/collaboration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "comment", documentId, body: comment }),
    });
    const payload = (await response.json()) as { error?: string };
    setMessage(response.ok ? "Comentario salvo no documento." : payload.error ?? "Falha ao comentar.");
    setComment("");
    await load();
  }

  async function createNotifications() {
    const response = await fetch("/api/notifications", { method: "POST" });
    const payload = (await response.json()) as { error?: string };
    setMessage(response.ok ? "Notificacoes inteligentes criadas." : payload.error ?? "Falha ao criar notificacoes.");
    await load();
  }

  async function queueOffline() {
    const response = await fetch("/api/offline/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: "web-pwa", operations: [{ operation: "productivity_session", payload: { title: "Sessao offline", durationMinutes: 25 } }] }),
    });
    const payload = (await response.json()) as { error?: string };
    setMessage(response.ok ? "Operacao offline enfileirada para sincronizacao." : payload.error ?? "Falha no offline sync.");
    await load();
  }

  async function streamAI() {
    setLoading(true);
    setStreamAnswer("");
    setMessage(null);
    try {
      const response = await fetch("/api/realtime/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: streamQuestion }),
      });
      if (!response.body) throw new Error("Streaming indisponivel.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const packets = buffer.split("\n\n");
        buffer = packets.pop() ?? "";
        for (const packet of packets) {
          const line = packet.replace(/^data:\s*/, "");
          if (!line) continue;
          const event = JSON.parse(line) as { type: string; content?: string; error?: string; agent?: string };
          if (event.type === "agent") setStreamAnswer((current) => `${current}Agente: ${event.agent}\n\n`);
          if (event.type === "chunk") setStreamAnswer((current) => `${current}${event.content}`);
          if (event.type === "error") throw new Error(event.error ?? "Falha no streaming.");
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha no streaming IA.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {message ? <p className="rounded-[16px] border bg-[#eef8f2] p-3 text-sm text-[#14352f]">{message}</p> : null}
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="premium-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Radio className="h-5 w-5 text-[#2f7d69]" />IA em tempo real</CardTitle>
            <CardDescription>Streaming real por rota `text/event-stream`, com agente escolhido por intencao.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={streamQuestion} onChange={(event) => setStreamQuestion(event.target.value)} />
            <Button disabled={loading || !streamQuestion.trim()} onClick={streamAI}><Send className="h-4 w-4" />Transmitir resposta</Button>
            {streamAnswer ? <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-[16px] bg-[#14352f] p-4 text-sm leading-6 text-white">{streamAnswer}</pre> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Boxes className="h-5 w-5 text-[#c7a64b]" />Enterprise scale</CardTitle>
            <CardDescription>Base multi-tenant, jobs assíncronos, eventos realtime e tenant privado.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <p className="rounded-[14px] bg-[#eef8f2] p-3">Templates: {items.length}</p>
            <p className="rounded-[14px] bg-[#eef8f2] p-3">Sessões: {collab.sessions.length}</p>
            <p className="rounded-[14px] bg-[#eef8f2] p-3">Avisos: {notifications.length}</p>
            <p className="rounded-[14px] bg-[#eef8f2] p-3">Offline: {offline.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Store className="h-5 w-5 text-[#2f7d69]" />Marketplace interno</CardTitle>
            <CardDescription>Templates privados, duplicáveis e controlados por tenant.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            <Button disabled={loading} onClick={createTemplate}><Wand2 className="h-4 w-4" />Salvar template</Button>
            {items.slice(0, 4).map((item) => <p key={item.id} className="break-words rounded-[14px] border bg-white p-3 text-sm">{item.title} - {item.item_type}</p>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Share2 className="h-5 w-5 text-[#2f7d69]" />Colaboração</CardTitle>
            <CardDescription>Sessões e comentários em documentos processados.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button disabled={loading} onClick={createCollaboration}>Criar revisão coletiva</Button>
            <Textarea placeholder="Comentario no primeiro PDF processado" value={comment} onChange={(event) => setComment(event.target.value)} />
            <Button variant="outline" onClick={addComment}><MessageSquare className="h-4 w-4" />Comentar</Button>
            {collab.sessions.slice(0, 3).map((item) => <p key={item.id} className="break-words rounded-[14px] border bg-white p-3 text-sm">{item.title} - {item.status}</p>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CloudOff className="h-5 w-5 text-[#2f7d69]" />Offline e notificações</CardTitle>
            <CardDescription>Fila de sync parcial e avisos inteligentes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={queueOffline}><Check className="h-4 w-4" />Fila offline</Button>
              <Button variant="outline" onClick={createNotifications}><Bell className="h-4 w-4" />Criar avisos</Button>
            </div>
            {notifications.slice(0, 3).map((item) => <p key={item.id} className="break-words rounded-[14px] border bg-white p-3 text-sm">{item.title}: {item.body}</p>)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
