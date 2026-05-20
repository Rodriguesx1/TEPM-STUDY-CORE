# Bootstrap do Admin Master

1. Crie o usuario no Supabase Auth pelo painel ou pelo fluxo `/login`.
2. Depois que o usuario existir, promova o perfil pelo SQL Editor:

```sql
update public.users_profiles
set role = 'admin', updated_at = now()
where email = 'deborallan1212@gmail.com';
```

3. Crie uma licenca ativa para o admin:

```sql
insert into public.licenses (user_id, status, starts_at, expires_at)
select id, 'active', now(), now() + interval '365 days'
from public.users_profiles
where email = 'deborallan1212@gmail.com';
```

Nao salve senha em migration, README, commit ou frontend. Senhas devem ficar apenas no Supabase Auth.
