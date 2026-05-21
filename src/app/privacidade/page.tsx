import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen px-5 py-10 md:px-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link href="/">
          <Button variant="outline" size="sm">Voltar</Button>
        </Link>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#2f7d69]">Politica de privacidade</p>
          <h1 className="mt-2 font-serif text-4xl font-bold text-[#2b1428]">Privacidade e LGPD</h1>
          <p className="mt-3 text-sm text-muted-foreground">Versao 2026-05. Politica voltada a dados de estudo, uploads, IA e licencas.</p>
        </div>
        <Card>
          <CardHeader><CardTitle>Dados tratados</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
            <p>Tratamos dados de conta, licencas, arquivos enviados, transcricoes, chunks, embeddings, notas, mensagens, eventos de estudo, logs tecnicos e consentimentos.</p>
            <p>Chaves de API e service role permanecem apenas no servidor. O navegador usa somente configuracoes publicas necessarias para autenticacao Supabase.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Direitos do titular</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
            <p>Usuarios autenticados podem exportar seus dados e solicitar exclusao pelo centro de privacidade em `/dashboard/privacy`.</p>
            <p>Solicitacoes de exclusao ficam registradas em logs de privacidade e usam janela de seguranca para evitar perda acidental.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Seguranca</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
            <p>Usamos RLS, buckets privados, validacao server-side, rate limit, logs estruturados e isolamento por `user_id`.</p>
            <p>Dados podem ser processados por provedores de IA configurados no servidor para gerar embeddings, transcricoes e respostas baseadas nos materiais autorizados.</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
