# TEPM Study

SaaS privado de estudos terapeuticos com IA, biblioteca de PDFs, memoria vetorial, licencas, comunidade interna e painel admin.

## Stack

- Next.js App Router
- TypeScript
- TailwindCSS
- Componentes UI internos inspirados em Shadcn/UI
- Autenticacao, banco relacional, storage privado e politicas de acesso
- pgvector
- Gemini API com fallback OpenRouter

## Instalação local

1. Instale dependencias:

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

- Dados de usuario ficam isolados por `user_id`.
- Tabelas sensiveis usam politicas de isolamento por usuario.
- Chave service role fica somente no servidor.
- Upload de PDF exige consentimento operacional e bucket privado.
- Chat IA exige licenca ativa e usa apenas chunks do usuario autenticado.
- Logs de auditoria registram eventos relevantes sem gravar chaves.

## Checklist funcional

- Home e login carregam sem o ambiente de dados configurado.
- Login real exige o provedor de autenticacao configurado.
- Dashboard, biblioteca, chat, caderno, trilhas, comunidade e admin exigem sessão.
- Upload aceita somente PDF e respeita `MAX_UPLOAD_MB`.
- PDF e salvo em storage privado, extraido com `pdf-parse`, dividido em chunks e gravado em `document_chunks`.
- Embeddings usam Gemini quando `GEMINI_API_KEY` existe.
- Chat consulta chunks do usuario e responde via Gemini, com fallback OpenRouter.
- Licencas bloqueiam recursos premium quando expiradas ou ausentes para usuarios comuns.
- Super administradores com `role = 'admin'` tem acesso ilimitado sem licenca.
- Admin exige role `admin`.

## Pendencias para produção

- Configurar banco remoto e aplicar migrations.
- Criar usuario admin inicial com SQL controlado.
- Validar politicas de isolamento diretamente no banco com usuarios reais.
- Publicar Edge Functions para processamento pesado de video/transcricao.
- Adicionar Playwright e testes automatizados depois da infra real estar conectada.
