# TEPM Study

SaaS privado de estudos terapêuticos com IA, biblioteca de PDFs, memória vetorial, licenças, comunidade interna e painel admin.

## Stack

- Next.js App Router
- TypeScript
- TailwindCSS
- Componentes UI internos inspirados em Shadcn/UI
- Autenticação, banco relacional, storage privado e políticas de acesso
- pgvector
- Gemini API com fallback OpenRouter

## Instalação local

1. Instale dependências:

```bash
npm install
```

2. Copie `.env.example` para `.env.local` e preencha:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
OPENROUTER_API_KEY=
```

3. Aplique as migrations no banco PostgreSQL com suporte vetorial:

```bash
supabase db push
```

4. Crie o bucket privado `study-documents` ou use a migration `202605200002_storage.sql`.

5. Rode o app:

```bash
npm run dev
```

## Segurança e LGPD

- Dados de usuário ficam isolados por `user_id`.
- Tabelas sensíveis usam políticas de isolamento por usuário.
- Chave service role fica somente no servidor.
- Upload de PDF exige consentimento operacional e bucket privado.
- Chat IA exige licença ativa e usa apenas chunks do usuário autenticado.
- Logs de auditoria registram eventos relevantes sem gravar chaves.

## Checklist funcional

- Home e login carregam sem o ambiente de dados configurado.
- Login real exige o provedor de autenticação configurado.
- Dashboard, biblioteca, chat, caderno, trilhas, comunidade e admin exigem sessão.
- Upload aceita somente PDF e respeita `MAX_UPLOAD_MB`.
- PDF é salvo em storage privado, extraído com `pdf-parse`, dividido em chunks e gravado em `document_chunks`.
- Embeddings usam Gemini quando `GEMINI_API_KEY` existe.
- Chat consulta chunks do usuário e responde via Gemini, com fallback OpenRouter.
- Licenças bloqueiam recursos premium quando expiradas ou ausentes para usuários comuns.
- Super administradores com `role = 'admin'` têm acesso ilimitado sem licença.
- Admin exige role `admin`.
[![Perf](https://devfix.uk/api/badge.php?url=https%3A%2F%2Ftepmstudy.vercel.app&metric=performance)](https://devfix.uk/)
[![A11y](https://devfix.uk/api/badge.php?url=https%3A%2F%2Ftepmstudy.vercel.app&metric=accessibility)](https://devfix.uk/)
[![Seo](https://devfix.uk/api/badge.php?url=https%3A%2F%2Ftepmstudy.vercel.app&metric=seo)](https://devfix.uk/)
[![Bp](https://devfix.uk/api/badge.php?url=https%3A%2F%2Ftepmstudy.vercel.app&metric=best-practices)](https://devfix.uk/)
## Pendências para produção
- Configurar banco remoto e aplicar migrations.
- Criar usuário admin inicial com SQL controlado.
- Validar políticas de isolamento diretamente no banco com usuários reais.
- Publicar Edge Functions para processamento pesado de video/transcricao.
- Adicionar Playwright e testes automatizados depois da infra real estar conectada.
