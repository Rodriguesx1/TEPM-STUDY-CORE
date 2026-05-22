"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ConsentState = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  savedAt: string;
  version: string;
};

const cookieName = "tepm_lgpd_consent";
const version = "2026-05";

function setConsentCookie(consent: ConsentState) {
  const value = encodeURIComponent(JSON.stringify(consent));
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${cookieName}=${value}; Max-Age=${60 * 60 * 24 * 180}; Path=/; SameSite=Lax${secure}`;
}

function hasConsentCookie() {
  return document.cookie.split(";").some((item) => item.trim().startsWith(`${cookieName}=`));
}

export function LgpdConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    setVisible(!hasConsentCookie());
  }, []);

  function saveConsent(next: { analytics: boolean; marketing: boolean }) {
    setConsentCookie({
      necessary: true,
      analytics: next.analytics,
      marketing: next.marketing,
      savedAt: new Date().toISOString(),
      version,
    });
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-6 sm:bottom-6">
      <section className="mx-auto max-w-5xl rounded-[20px] border border-[#cfe2d8] bg-white/96 p-4 shadow-[0_22px_80px_rgba(20,53,47,0.22)] backdrop-blur md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#14352f] text-[#e2c875]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-[#14352f]">Preferencias de privacidade</h2>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Usamos recursos necessarios para login, seguranca e funcionamento da plataforma. Cookies ou tecnologias
                  opcionais de analise e comunicacao so devem ser ativados com sua escolha.
                </p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <Link href="/privacidade" className="font-semibold text-[#2f7d69] hover:underline">Politica de privacidade</Link>
                  <Link href="/termos" className="font-semibold text-[#2f7d69] hover:underline">Termos de uso</Link>
                </div>
              </div>
            </div>

            {preferencesOpen ? (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <label className="rounded-[14px] border bg-[#eef8f2] p-3 text-sm">
                  <span className="block font-semibold text-[#14352f]">Necessarios</span>
                  <span className="mt-1 block text-xs text-muted-foreground">Login, seguranca e preferencias essenciais.</span>
                  <span className="mt-3 inline-flex rounded-full bg-white px-2 py-1 text-xs font-semibold text-[#2f7d69]">Sempre ativo</span>
                </label>
                <label className="rounded-[14px] border bg-white p-3 text-sm">
                  <span className="block font-semibold text-[#14352f]">Analise</span>
                  <span className="mt-1 block text-xs text-muted-foreground">Ajuda a medir uso e melhorar desempenho.</span>
                  <input className="mt-3 h-4 w-4" type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} />
                </label>
                <label className="rounded-[14px] border bg-white p-3 text-sm">
                  <span className="block font-semibold text-[#14352f]">Comunicacao</span>
                  <span className="mt-1 block text-xs text-muted-foreground">Permite contato sobre planos e novidades.</span>
                  <input className="mt-3 h-4 w-4" type="checkbox" checked={marketing} onChange={(event) => setMarketing(event.target.checked)} />
                </label>
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:w-72 lg:flex-col">
            <Button type="button" onClick={() => saveConsent({ analytics: true, marketing: true })}>
              Aceitar todos
            </Button>
            <Button type="button" variant="outline" onClick={() => saveConsent({ analytics: false, marketing: false })}>
              Rejeitar opcionais
            </Button>
            <Button type="button" variant="secondary" onClick={() => setPreferencesOpen((current) => !current)}>
              <SlidersHorizontal className="h-4 w-4" />
              Preferencias
            </Button>
            {preferencesOpen ? (
              <Button type="button" variant="outline" onClick={() => saveConsent({ analytics, marketing })}>
                Salvar escolhas
              </Button>
            ) : null}
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-[14px] px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-[#eef8f2]"
              onClick={() => saveConsent({ analytics: false, marketing: false })}
            >
              <X className="h-4 w-4" />
              Continuar so com necessarios
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
