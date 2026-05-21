import { AppShell } from "@/components/layout/app-shell";
import { PrivacyCenter } from "@/components/privacy/privacy-center";
import { requireUser } from "@/lib/auth/guards";

export default async function PrivacyPage() {
  const context = await requireUser();

  return (
    <AppShell context={context}>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#2f7d69]">LGPD avancada</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-[#14352f]">Privacidade e dados</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Gerencie consentimentos, exporte dados e solicite exclusao com registro auditavel.
          </p>
        </div>
        <PrivacyCenter />
      </div>
    </AppShell>
  );
}
