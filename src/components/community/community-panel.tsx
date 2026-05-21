"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { RoomMessage } from "@/types/database";

type RoomRow = {
  role: string;
  chat_rooms: { id: string; user_id: string; name: string; description: string | null; access_code: string; is_locked: boolean } | Array<{ id: string; user_id: string; name: string; description: string | null; access_code: string; is_locked: boolean }>;
};

function getRoom(row: RoomRow) {
  return Array.isArray(row.chat_rooms) ? row.chat_rooms[0] : row.chat_rooms;
}

export function CommunityPanel({ initialRooms }: { initialRooms: RoomRow[] }) {
  const [rooms, setRooms] = useState(initialRooms);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(initialRooms[0] ? getRoom(initialRooms[0])?.id : null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  async function refreshRooms() {
    const response = await fetch("/api/rooms");
    const payload = (await response.json()) as { rooms?: RoomRow[] };
    setRooms(payload.rooms ?? []);
  }

  async function loadMessages(roomId: string) {
    setActiveRoomId(roomId);
    const response = await fetch(`/api/rooms/${roomId}/messages`);
    const payload = (await response.json()) as { messages?: RoomMessage[]; error?: string };
    if (!response.ok) return setNotice(payload.error ?? "Falha ao carregar mensagens.");
    setMessages(payload.messages ?? []);
  }

  useEffect(() => {
    if (activeRoomId) void loadMessages(activeRoomId);
  }, []);

  async function createRoom() {
    const response = await fetch("/api/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description }) });
    const payload = (await response.json()) as { error?: string; accessCode?: string };
    setNotice(response.ok ? `Sala criada. Codigo: ${payload.accessCode}` : payload.error ?? "Falha ao criar sala.");
    setName("");
    setDescription("");
    await refreshRooms();
  }

  async function joinRoom() {
    const response = await fetch("/api/rooms/join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
    const payload = (await response.json()) as { error?: string; roomId?: string };
    setNotice(response.ok ? "Entrada liberada." : payload.error ?? "Falha ao entrar.");
    setCode("");
    await refreshRooms();
    if (payload.roomId) await loadMessages(payload.roomId);
  }

  async function sendMessage() {
    if (!activeRoomId) return;
    const response = await fetch(`/api/rooms/${activeRoomId}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) });
    const payload = (await response.json()) as { error?: string };
    setNotice(response.ok ? "Mensagem enviada." : payload.error ?? "Falha ao enviar.");
    setBody("");
    await loadMessages(activeRoomId);
  }

  const activeRoom = rooms.map(getRoom).find((room) => room?.id === activeRoomId);

  return (
    <div className="grid gap-4 sm:gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="space-y-4">
        <div className="rounded-[18px] border bg-white p-4">
          <h3 className="font-semibold text-[#183c35]">Criar sala</h3>
          <div className="mt-3 space-y-3">
            <Input placeholder="Nome da sala" value={name} onChange={(event) => setName(event.target.value)} />
            <Textarea placeholder="Descricao" value={description} onChange={(event) => setDescription(event.target.value)} />
            <Button type="button" onClick={createRoom}>Criar sala</Button>
          </div>
        </div>
        <div className="rounded-[18px] border bg-white p-4">
          <h3 className="font-semibold text-[#183c35]">Entrar por codigo</h3>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input placeholder="CODIGO" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} />
            <Button type="button" onClick={joinRoom} className="sm:w-auto">Entrar</Button>
          </div>
        </div>
        {notice ? <p className="rounded-[14px] bg-secondary p-3 text-sm text-secondary-foreground">{notice}</p> : null}
        <div className="space-y-2">
          {rooms.map((row) => {
            const room = getRoom(row);
            return room ? (
              <button key={room.id} type="button" onClick={() => loadMessages(room.id)} className="block w-full min-w-0 rounded-[16px] border bg-white p-4 text-left">
                <span className="break-words font-semibold text-[#183c35]">{room.name}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{row.role} {room.is_locked ? "- bloqueada" : ""}</span>
              </button>
            ) : null;
          })}
        </div>
      </div>
      <div className="rounded-[18px] border bg-white p-4">
        <h3 className="font-semibold text-[#183c35]">{activeRoom?.name ?? "Selecione uma sala"}</h3>
        <div className="mt-4 min-h-64 space-y-3 rounded-[14px] bg-[#eef8f2] p-4">
          {messages.map((message) => (
            <p key={message.id} className="break-words rounded-[12px] bg-white/80 p-3 text-sm text-muted-foreground">{message.body}</p>
          ))}
          {!messages.length ? <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p> : null}
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input placeholder="Mensagem" value={body} onChange={(event) => setBody(event.target.value)} />
          <Button type="button" onClick={sendMessage} disabled={!activeRoomId} className="sm:w-auto">Enviar</Button>
        </div>
      </div>
    </div>
  );
}
