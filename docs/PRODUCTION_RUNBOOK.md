# TEPM Study Core - Runbook de Producao

## Ambientes

- `development`: uso local com `.env.local`, Supabase de desenvolvimento e `NEXT_PUBLIC_APP_URL=http://localhost:3000`.
- `staging`: projeto Vercel separado ou branch preview, Supabase staging, chaves separadas e dados anonimizados.
- `production`: Vercel production, Supabase production, buckets privados e variaveis protegidas.

## Variaveis obrigatorias

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `MAX_UPLOAD_MB`
- `MAX_VIDEO_UPLOAD_MB`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_ENVIRONMENT`
- `AI_RATE_LIMIT_PER_HOUR`

## Deploy e rollback

1. Aplicar migrations no Supabase antes do deploy.
2. Rodar `npm run lint`, `npm run typecheck` e `npm run build`.
3. Publicar com `vercel --prod`.
4. Validar `/`, `/login`, `/dashboard`, upload, chat e admin.
5. Rollback: usar `vercel rollback` para o deployment anterior e pausar novas migrations destrutivas.

## Observabilidade

- `system_logs`: erros, IA, upload, rate limit e eventos criticos.
- `audit_logs`: eventos de dominio do usuario.
- `/admin`: metricas globais.

## Backup e recuperacao

- Ativar PITR/backup diario no Supabase.
- Exportar `public` e storage privado periodicamente.
- Registrar testes de restauracao em `backup_jobs`.
- Nunca remover dados de usuario sem registro em `privacy_logs` e `deletion_requests`.

## LGPD

- Consentimentos ficam em `user_consents`.
- Exportacao de dados em `/dashboard/privacy`.
- Solicitacao de exclusao usa janela de seguranca de 7 dias.
- Conteudos protegidos devem ser enviados apenas com autorizacao do usuario/organizacao.
