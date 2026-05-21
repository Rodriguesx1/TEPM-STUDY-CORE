create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.profiles (id, email, full_name, role, created_at, updated_at)
select id, email, full_name, role, created_at, updated_at
from public.users_profiles
on conflict (id) do update
set email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role,
    updated_at = now();

alter table public.licenses alter column expires_at drop not null;

do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'public.licenses'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%status%';

  if constraint_name is not null then
    execute format('alter table public.licenses drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.licenses
add constraint licenses_status_check
check (status in ('active', 'trial', 'expired', 'blocked', 'lifetime'));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
  or exists (
    select 1 from public.users_profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;

  insert into public.users_profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.plans (name, description, price_cents, features, is_active)
values
  ('Gratuito', 'Acesso inicial ao dashboard e conta privada.', 0, '["dashboard", "perfil"]', true),
  ('Premium', 'PDFs, biblioteca, chat IA, trilhas, caderno e comunidade.', 9900, '["pdf", "rag", "trilhas", "caderno", "comunidade"]', true)
on conflict do nothing;

alter table public.profiles enable row level security;

drop policy if exists "profiles self read or admin" on public.profiles;
create policy "profiles self read or admin" on public.profiles
for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "profiles admin manage" on public.profiles;
create policy "profiles admin manage" on public.profiles
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "licenses self read or admin" on public.licenses;
create policy "licenses self read or admin" on public.licenses
for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "licenses admin manage" on public.licenses;
create policy "licenses admin manage" on public.licenses
for all using (public.is_admin()) with check (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.profiles to service_role;
grant select, insert, update, delete on public.licenses to service_role;
grant select on public.licenses to authenticated;
