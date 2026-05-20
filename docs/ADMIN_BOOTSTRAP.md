# Bootstrap do Admin Master

1. Crie o usuario no Supabase Auth pelo painel ou pelo fluxo `/login`.
2. Depois que o usuario existir, promova o perfil pelo SQL Editor:

```sql
update public.users_profiles
set role = 'admin', updated_at = now()
where email = 'deborallan1212@gmail.com';
```

3. Nao crie licenca para o super administrador. Admin e ilimitado por `role = 'admin'`, sem data de expiracao.

Nao salve senha em migration, README, commit ou frontend. Senhas devem ficar apenas no Supabase Auth.
