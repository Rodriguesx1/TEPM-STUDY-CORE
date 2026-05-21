"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgePercent, CreditCard, History, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type BillingPlan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  interval: string;
  features: string[];
  limits: Record<string, number>;
};

type Profile = { id: string; email: string; role: string };
type License = { id: string; user_id: string; status: string; expires_at: string | null };
type Coupon = { id: string; code: string; discount_percent: number; bonus_days: number; status: string };
type HistoryRow = { id: string; user_id: string; action: string; from_status: string | null; to_status: string | null; created_at: string };

type BillingPayload = {
  plans: BillingPlan[];
  coupons: Coupon[];
  history: HistoryRow[];
  profiles: Profile[];
  licenses: License[];
};

export function BillingPanel() {
  const [data, setData] = useState<BillingPayload>({ plans: [], coupons: [], history: [], profiles: [], licenses: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [planName, setPlanName] = useState("");
  const [planSlug, setPlanSlug] = useState("");
  const [planPrice, setPlanPrice] = useState("7900");
  const [planFeatures, setPlanFeatures] = useState("PDFs com IA\nChat RAG\nRelatorios");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState("20");
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState("active");
  const [expiresAt, setExpiresAt] = useState("");

  async function load() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/billing", { cache: "no-store" });
      const payload = (await response.json()) as BillingPayload & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Falha ao carregar financeiro.");
      setData(payload);
      setUserId((current) => current || payload.profiles.find((profile) => profile.role !== "admin")?.id || "");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao carregar financeiro.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const licenseByUser = useMemo(() => new Map(data.licenses.map((license) => [license.user_id, license])), [data.licenses]);

  async function post(body: Record<string, unknown>, success: string) {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Falha ao salvar financeiro.");
      setMessage(success);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao salvar financeiro.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {message ? <div className="rounded-[16px] border border-[#cfe5dc] bg-[#e8f4ef] p-3 text-sm text-[#14352f]">{message}</div> : null}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><CreditCard className="h-4 w-4 text-[#2f7d69]" />Planos</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-[#14352f]">{loading ? "..." : data.plans.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><BadgePercent className="h-4 w-4 text-[#9b2f5f]" />Cupons</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-[#14352f]">{data.coupons.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><History className="h-4 w-4 text-[#b79a45]" />Historico</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-[#14352f]">{data.history.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><RefreshCw className="h-4 w-4 text-[#2f7d69]" />Vencidas</CardTitle></CardHeader><CardContent><Button size="sm" disabled={saving} onClick={() => post({ action: "expire_now" }, "Licencas vencidas atualizadas.")}>Atualizar</Button></CardContent></Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Plano editavel</CardTitle>
            <CardDescription>Cria ou atualiza plano real por slug.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={(event) => {
              event.preventDefault();
              void post({ action: "plan", name: planName, slug: planSlug, priceCents: Number(planPrice), features: planFeatures }, "Plano salvo.");
              setPlanName("");
              setPlanSlug("");
            }}>
              <Input value={planName} onChange={(event) => setPlanName(event.target.value)} placeholder="Nome do plano" required />
              <Input value={planSlug} onChange={(event) => setPlanSlug(event.target.value)} placeholder="slug-do-plano" required />
              <Input type="number" value={planPrice} onChange={(event) => setPlanPrice(event.target.value)} placeholder="Preco em centavos" />
              <Textarea value={planFeatures} onChange={(event) => setPlanFeatures(event.target.value)} />
              <Button disabled={saving}>Salvar plano</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cupom</CardTitle>
            <CardDescription>Cria cupom de desconto rastreavel.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={(event) => {
              event.preventDefault();
              void post({ action: "coupon", code: couponCode, discountPercent: Number(discount) }, "Cupom criado.");
              setCouponCode("");
            }}>
              <Input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="CODIGO" required />
              <Input type="number" value={discount} onChange={(event) => setDiscount(event.target.value)} placeholder="% desconto" />
              <Button disabled={saving}>Criar cupom</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upgrade manual</CardTitle>
            <CardDescription>Altera licenca e grava historico.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={(event) => {
              event.preventDefault();
              void post({ action: "license", userId, status, expiresAt }, "Licenca atualizada.");
            }}>
              <select className="h-11 w-full rounded-[14px] border border-input bg-white px-3 text-sm" value={userId} onChange={(event) => setUserId(event.target.value)} required>
                {data.profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>{profile.email} {profile.role === "admin" ? "(admin ilimitado)" : ""}</option>
                ))}
              </select>
              <select className="h-11 w-full rounded-[14px] border border-input bg-white px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="trial">Trial</option>
                <option value="active">Ativa</option>
                <option value="expired">Expirada</option>
                <option value="blocked">Bloqueada</option>
                <option value="lifetime">Vitalicia</option>
              </select>
              {status !== "lifetime" ? <Input type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} required /> : null}
              <Button disabled={saving || !userId}>Aplicar licenca</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Planos ativos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.plans.map((plan) => (
              <article key={plan.id} className="rounded-[16px] border bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-[#14352f]">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <Badge>{(plan.price_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</Badge>
                </div>
              </article>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Licencas e historico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.profiles.map((profile) => {
              const license = licenseByUser.get(profile.id);
              return (
                <article key={profile.id} className="rounded-[16px] border bg-white p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-[#14352f]">{profile.email}</span>
                    <Badge>{profile.role === "admin" ? "admin ilimitado" : license?.status ?? "sem licenca"}</Badge>
                  </div>
                  {license?.expires_at ? <p className="mt-1 text-muted-foreground">Expira em {new Date(license.expires_at).toLocaleString("pt-BR")}</p> : null}
                </article>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
