-- Super administradores nao dependem de licenca.
-- A permissao ilimitada vem de public.users_profiles.role = 'admin'.

delete from public.licenses
where user_id in (
  select id
  from public.users_profiles
  where role = 'admin'
);
