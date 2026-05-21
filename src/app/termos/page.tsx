import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <main className="min-h-screen px-5 py-10 md:px-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link href="/">
          <Button variant="outline" size="sm">Voltar</Button>
        </Link>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#2f7d69]">Termos de uso</p>
          <h1 className="mt-2 font-serif text-4xl font-bold text-[#2b1428]">TEPM Study Core</h1>
          <p className="mt-3 text-sm text-muted-foreground">Versao 2026-05. Plataforma privada para estudo pessoal ou organizacional autorizado.</p>
        </div>
        <Card>
          <CardHeader><CardTitle>Uso autorizado</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
            <p>O TEPM Study Core organiza materiais enviados pelo usuario para estudo, revisao, memoria vetorial, IA mentora e produtividade terapeutica.</p>
            <p>O usuario declara possuir direito, autorizacao ou base legal para enviar PDFs, videos, textos e demais arquivos. A plataforma nao deve ser usada para expor, redistribuir ou comercializar conteudo protegido sem autorizacao.</p>
            <p>Respostas de IA servem como apoio educacional. Elas nao substituem avaliacao profissional, diagnostico medico, conduta clinica individualizada ou supervisao tecnica.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Seguranca e conta</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
            <p>O acesso depende de autenticacao e licenca valida, exceto administradores autorizados. O usuario deve proteger suas credenciais e comunicar acessos suspeitos.</p>
            <p>Uploads, chats, notas, salas e memorias sao isolados por usuario e por politicas RLS no banco.</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
