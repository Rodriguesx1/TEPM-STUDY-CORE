"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LicenseStatus } from "@/types/database";

type AdminProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
};

type AdminLicense = {
  id: string;
  user_id: string;
  status: LicenseStatus;
  expires_at: string | null;
};

export function LicenseManager({ profiles, licenses }: { profiles: AdminProfile[]; licenses: AdminLicense[] }) {
  const [userId, setUserId] = useState(profiles.find((profile) => profile.role !== "admin")?.id ?? profiles[0]?.id ?? "");
  const [status, setStatus] = useState<LicenseStatus>("active");
  const [expiresAt, setExpiresAt] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const licenseByUser = new Map(licenses.map((license) => [license.user_id, license]));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status, expiresAt: status === "lifetime" ? null : expiresAt }),
      });
      const payload = (await response.json()) as { error?: string; id?: string };
      if (!response.ok) throw new Error(payload.error ?? "Falha ao salvar licenca.");
      setMessage(`Licenca salva: ${payload.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao salvar licenca.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={submit} className="space-y-4 rounded-[18px] border bg-white p-5">
        <div>
          <label className="text-sm font-semibold text-[#183c35]">Usuario</label>
          <select className="mt-2 h-11 w-full rounded-[14px] border border-input bg-white px-3 text-sm" value={userId} onChange={(event) => setUserId(event.target.value)} required>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.email} {profile.role === "admin" ? "(admin ilimitado)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-[#183c35]">Status</label>
          <select className="mt-2 h-11 w-full rounded-[14px] border border-input bg-white px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value as LicenseStatus)}>
            <option value="trial">Trial</option>
            <option value="active">Premium ativo</option>
            <option value="expired">Expirada</option>
            <option value="blocked">Bloqueada</option>
            <option value="lifetime">Vitalicia</option>
          </select>
        </div>
        {status !== "lifetime" ? <Input type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} required /> : null}
        {message ? <p className="rounded-[14px] bg-secondary p-3 text-sm text-secondary-foreground">{message}</p> : null}
        <Button type="submit" disabled={loading || !userId}>
          {loading ? "Salvando..." : "Criar ou atualizar licenca"}
        </Button>
      </form>
      <div className="space-y-3">
        {profiles.map((profile) => {
          const license = licenseByUser.get(profile.id);
          return (
            <article key={profile.id} className="rounded-[16px] border bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-[#183c35]">{profile.email}</h3>
                  <p className="text-sm text-muted-foreground">{profile.role === "admin" ? "Admin ilimitado" : "Usuario comum"}</p>
                </div>
                <span className="rounded-full bg-[#f4d9df] px-3 py-1 text-xs font-semibold text-[#67213d]">
                  {profile.role === "admin" ? "sem licenca" : license?.status ?? "sem licenca"}
                </span>
              </div>
              {license?.expires_at ? <p className="mt-2 text-xs text-muted-foreground">Expira em {new Date(license.expires_at).toLocaleString("pt-BR")}</p> : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}

