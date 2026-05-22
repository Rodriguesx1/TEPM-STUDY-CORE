"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Volume2 } from "lucide-react";
import { SensitiveConsentGate } from "@/components/sensitive/sensitive-consent-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LuxuryBadge, PremiumCard, SoftPanel } from "@/components/ui/premium";

type Preferences = {
  enable_internal: boolean;
  enable_push: boolean;
  enable_sound: boolean;
  hide_sensitive_on_lock_screen: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  allowed_types: string[];
  sound_volume: number;
} | null;

type NotificationItem = {
  id: string;
  notification_type: string;
  title: string;
  body: string;
  is_sensitive: boolean;
  status: string;
  created_at: string;
};

export function NotificationsPanel() {
  const [preferences, setPreferences] = useState<Preferences>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [enablePush, setEnablePush] = useState(false);
  const [enableSound, setEnableSound] = useState(false);
  const [quietStart, setQuietStart] = useState("");
  const [quietEnd, setQuietEnd] = useState("");
  const [hideSensitive, setHideSensitive] = useState(true);
  const [volume, setVolume] = useState(0.25);
  const types = useMemo(() => ["revision", "study", "cycle", "journal", "community", "license", "ai", "progress", "privacy"], []);
  const [allowedTypes, setAllowedTypes] = useState<string[]>(["revision", "study", "license", "ai", "progress", "privacy"]);

  async function load() {
    const response = await fetch("/api/notifications/preferences", { cache: "no-store" });
    const payload = (await response.json()) as { preferences?: Preferences; notifications?: NotificationItem[]; error?: string };
    if (!response.ok) {
      setMessage(payload.error ?? "Falha ao carregar notificacoes.");
      return;
    }
    setPreferences(payload.preferences ?? null);
    setNotifications(payload.notifications ?? []);
    if (payload.preferences) {
      setEnablePush(payload.preferences.enable_push);
      setEnableSound(payload.preferences.enable_sound);
      setQuietStart(payload.preferences.quiet_hours_start ?? "");
      setQuietEnd(payload.preferences.quiet_hours_end ?? "");
      setHideSensitive(payload.preferences.hide_sensitive_on_lock_screen);
      setVolume(payload.preferences.sound_volume);
      setAllowedTypes(payload.preferences.allowed_types ?? []);
    }
  }

  async function save() {
    setMessage(null);
    const response = await fetch("/api/notifications/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enableInternal: true, enablePush, enableSound, hideSensitiveOnLockScreen: hideSensitive, quietHoursStart: quietStart || null, quietHoursEnd: quietEnd || null, allowedTypes, soundVolume: volume }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(payload.error ?? "Falha ao salvar preferencias.");
      return;
    }
    setMessage("Preferencias salvas.");
    await load();
  }

  function testSound() {
    if (!enableSound) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 528;
    gain.gain.value = volume * 0.08;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.22);
  }

  async function requestBrowserPush() {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setMessage("Este navegador nao suporta Web Push completo.");
      return;
    }
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      setMessage("Permissao do navegador pode ser testada, mas a assinatura push exige NEXT_PUBLIC_VAPID_PUBLIC_KEY.");
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setMessage("Permissao de push negada pelo navegador. Notificacoes internas continuam disponiveis.");
      return;
    }
    if (!vapidPublicKey) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
    const response = await fetch("/api/notifications/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...subscription.toJSON(), userAgent: navigator.userAgent }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(payload.error ?? "Nao foi possivel salvar assinatura push.");
      return;
    }
    setMessage("Push ativado neste navegador.");
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6">
      {message ? <p className="rounded-[16px] bg-[#0d2b26] p-3 text-sm text-[#f2eadf]">{message}</p> : null}
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <PremiumCard>
          <LuxuryBadge>Preferencias</LuxuryBadge>
          <div className="mt-5 space-y-4">
            <label className="flex items-center gap-3 text-sm text-[#f2eadf]">
              <input type="checkbox" checked={hideSensitive} onChange={(event) => setHideSensitive(event.target.checked)} />
              Ocultar conteudo sensivel em notificacoes
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input type="time" value={quietStart} onChange={(event) => setQuietStart(event.target.value)} />
              <Input type="time" value={quietEnd} onChange={(event) => setQuietEnd(event.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              {types.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`rounded-full border px-3 py-2 text-xs font-bold ${allowedTypes.includes(type) ? "border-[#6fae9b] bg-[#6fae9b] text-[#071412]" : "border-[#6fae9b]/25 text-[#f2eadf]"}`}
                  onClick={() => setAllowedTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type])}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <Button className="mt-5" onClick={save}>Salvar preferencias</Button>
        </PremiumCard>

        <PremiumCard>
          <LuxuryBadge>Push e sons</LuxuryBadge>
          <div className="mt-5 space-y-4">
            <SensitiveConsentGate featureName="push_notifications">
              <label className="flex items-center gap-3 text-sm text-[#f2eadf]">
                <input type="checkbox" checked={enablePush} onChange={(event) => setEnablePush(event.target.checked)} />
                Ativar Web Push quando suportado
              </label>
              <Button variant="outline" onClick={requestBrowserPush}><Bell className="h-4 w-4" /> Pedir permissao do navegador</Button>
            </SensitiveConsentGate>
            <SensitiveConsentGate featureName="sound_experience">
              <label className="flex items-center gap-3 text-sm text-[#f2eadf]">
                <input type="checkbox" checked={enableSound} onChange={(event) => setEnableSound(event.target.checked)} />
                Ativar sons suaves
              </label>
              <Input type="number" min={0} max={1} step={0.05} value={volume} onChange={(event) => setVolume(Number(event.target.value))} />
              <Button variant="outline" onClick={testSound}><Volume2 className="h-4 w-4" /> Testar som suave</Button>
            </SensitiveConsentGate>
          </div>
        </PremiumCard>
      </div>

      <PremiumCard>
        <LuxuryBadge>Central interna</LuxuryBadge>
        <div className="mt-4 space-y-3">
          {notifications.map((item) => (
            <SoftPanel key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-[#f2eadf]">{item.title}</h3>
                <span className="text-xs text-[#b79a6b]">{item.notification_type}</span>
              </div>
              <p className="mt-2 text-sm text-[#cbbfb1]">{item.is_sensitive && preferences?.hide_sensitive_on_lock_screen ? "Conteudo sensivel ocultado por preferencia." : item.body}</p>
            </SoftPanel>
          ))}
          {!notifications.length ? <p className="text-sm text-[#cbbfb1]">Nenhuma notificacao interna ainda.</p> : null}
        </div>
      </PremiumCard>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
