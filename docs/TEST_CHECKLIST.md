# Checklist QA Anti-Fake Fix

## Local sem Supabase

- `npm install`
- `npm run typecheck`
- `npm run build`
- `/` carrega.
- `/login` carrega.
- Login sem env Supabase mostra erro controlado.
- `/dashboard` nao libera acesso fake.
- Nenhuma chave aparece no front-end.

## Com Supabase configurado

- Aplicar migrations sem erro.
- Criar conta real via Supabase Auth.
- Confirmar criação de `users_profiles`.
- Criar licença ativa via rota admin ou SQL controlado.
- Login redireciona para `/dashboard`.
- Upload de PDF cria arquivo no bucket `study-documents`.
- Upload cria linha em `documents`.
- Upload cria chunks em `document_chunks`.
- Chat IA responde apenas depois de licença ativa.
- Usuario A nao le dados do Usuario B.
- Admin le usuarios e licencas.
- Sala privada aparece apenas para membro autorizado.
- Layout funciona em mobile e desktop.

## Nunca aceitar como pronto

- Botao que apenas mostra toast sem persistir.
- Dados mockados tratados como produção.
- RLS desligado.
- Service role no navegador.
- Build verde sem teste de fluxo.
