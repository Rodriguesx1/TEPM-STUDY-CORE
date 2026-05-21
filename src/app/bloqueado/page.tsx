import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/guards";

export default async function BlockedPage() {
  const context = await requireUser();

  return (
    <AppShell context={context}>
      <Card className="mx-auto max-w-2xl border-[#d7bb5f]/50 bg-white">
        <CardHeader>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#211326] text-[#e2c875]">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <CardTitle>Acesso premium bloqueado</CardTitle>
          <CardDescription>
            Sua conta esta autenticada, mas ainda nao possui licenca ativa, trial valido ou permissao de admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">
            Solicite uma licenca ao administrador da organizacao. O sistema nao usa localStorage nem liberacao falsa:
            o desbloqueio depende de registro real no Supabase.
          </p>
          <Link href="/dashboard">
            <Button variant="outline">Voltar ao dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </AppShell>
  );
}
