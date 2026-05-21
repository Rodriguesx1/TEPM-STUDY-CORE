create table if not exists public.system_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  level text not null default 'info' check (level in ('debug','info','warn','error','critical')),
  event text not null,
  source text not null default 'app',
  request_id text,
  route text,
  ip_hash text,
  user_agent text,
  duration_ms integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_response_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cache_key text not null,
  provider text not null,
  prompt_hash text not null,
  answer text not null,
  sources jsonb not null default '[]'::jsonb,
  token_estimate integer not null default 0,
  expires_at timestamptz not null default (now() + interval '12 hours'),
  created_at timestamptz not null default now(),
  unique(user_id, cache_key)
);

create table if not exists public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  key text not null,
  route text not null,
  window_start timestamptz not null default now(),
  count integer not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique(key, route, window_start)
);

create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null check (consent_type in ('terms','privacy','upload_processing','ai_processing','marketing')),
  status text not null default 'accepted' check (status in ('accepted','revoked')),
  version text not null default '2026-05',
  ip_hash text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(user_id, consent_type, version)
);

create table if not exists public.privacy_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  status text not null default 'completed' check (status in ('requested','processing','completed','failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text,
  status text not null default 'requested' check (status in ('requested','approved','processing','completed','cancelled','rejected')),
  requested_at timestamptz not null default now(),
  scheduled_for timestamptz not null default (now() + interval '7 days'),
  processed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.backup_jobs (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  job_type text not null default 'manual_export' check (job_type in ('manual_export','scheduled_backup','restore_test')),
  status text not null default 'requested' check (status in ('requested','running','completed','failed')),
  storage_path text,
  checksum text,
  started_at timestamptz,
  finished_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.lead_captures (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  source text not null default 'landing',
  status text not null default 'new' check (status in ('new','contacted','converted','unsubscribed')),
  consent_marketing boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(email, source)
);

alter table public.system_logs enable row level security;
alter table public.ai_response_cache enable row level security;
alter table public.rate_limits enable row level security;
alter table public.user_consents enable row level security;
alter table public.privacy_logs enable row level security;
alter table public.deletion_requests enable row level security;
alter table public.backup_jobs enable row level security;
alter table public.lead_captures enable row level security;

grant select on public.system_logs to authenticated;
grant select, insert, delete on public.ai_response_cache to authenticated;
grant select, insert, update on public.user_consents to authenticated;
grant select, insert on public.privacy_logs to authenticated;
grant select, insert, update on public.deletion_requests to authenticated;
grant select on public.backup_jobs to authenticated;
grant insert on public.lead_captures to anon, authenticated;
grant select, insert, update, delete on public.system_logs to service_role;
grant select, insert, update, delete on public.rate_limits to service_role;
grant select, insert, update, delete on public.backup_jobs to service_role;
grant select, insert, update, delete on public.lead_captures to service_role;

drop policy if exists "system_logs admin read" on public.system_logs;
create policy "system_logs admin read" on public.system_logs for select using (public.is_admin());

drop policy if exists "ai_cache owner all" on public.ai_response_cache;
create policy "ai_cache owner all" on public.ai_response_cache
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "rate_limits admin read" on public.rate_limits;
create policy "rate_limits admin read" on public.rate_limits for select using (public.is_admin());

drop policy if exists "consents owner all" on public.user_consents;
create policy "consents owner all" on public.user_consents
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "privacy_logs owner read" on public.privacy_logs;
create policy "privacy_logs owner read" on public.privacy_logs for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "privacy_logs owner insert" on public.privacy_logs;
create policy "privacy_logs owner insert" on public.privacy_logs for insert with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "deletion_requests owner all" on public.deletion_requests;
create policy "deletion_requests owner all" on public.deletion_requests
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "backup_jobs admin read" on public.backup_jobs;
create policy "backup_jobs admin read" on public.backup_jobs for select using (public.is_admin());

drop policy if exists "lead_captures insert public" on public.lead_captures;
create policy "lead_captures insert public" on public.lead_captures for insert with check (true);

drop policy if exists "lead_captures admin read" on public.lead_captures;
create policy "lead_captures admin read" on public.lead_captures for select using (public.is_admin());

create index if not exists system_logs_event_created_idx on public.system_logs(event, created_at desc);
create index if not exists system_logs_user_created_idx on public.system_logs(user_id, created_at desc);
create index if not exists ai_cache_user_key_idx on public.ai_response_cache(user_id, cache_key);
create index if not exists rate_limits_key_route_idx on public.rate_limits(key, route, window_start desc);
create index if not exists user_consents_user_type_idx on public.user_consents(user_id, consent_type, created_at desc);
create index if not exists privacy_logs_user_created_idx on public.privacy_logs(user_id, created_at desc);
create index if not exists deletion_requests_user_status_idx on public.deletion_requests(user_id, status);
create index if not exists lead_captures_created_idx on public.lead_captures(created_at desc);

create or replace function public.log_system_event(
  log_user_id uuid,
  log_level text,
  log_event text,
  log_source text,
  log_route text,
  log_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  insert into public.system_logs(user_id, level, event, source, route, metadata)
  values (log_user_id, coalesce(log_level, 'info'), log_event, coalesce(log_source, 'app'), log_route, coalesce(log_metadata, '{}'::jsonb))
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.check_rate_limit(
  limit_key text,
  limit_route text,
  max_requests integer,
  window_seconds integer,
  limit_user_id uuid default null
)
returns table(allowed boolean, current_count integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  bucket_start timestamptz;
  row_count integer;
begin
  bucket_start := to_timestamp(floor(extract(epoch from now()) / window_seconds) * window_seconds);
  insert into public.rate_limits(key, route, user_id, window_start, count, updated_at)
  values (limit_key, limit_route, limit_user_id, bucket_start, 1, now())
  on conflict (key, route, window_start)
  do update set count = public.rate_limits.count + 1, updated_at = now()
  returning count into row_count;

  allowed := row_count <= max_requests;
  current_count := row_count;
  reset_at := bucket_start + make_interval(secs => window_seconds);
  return next;
end;
$$;

grant execute on function public.log_system_event(uuid, text, text, text, text, jsonb) to authenticated;
grant execute on function public.check_rate_limit(text, text, integer, integer, uuid) to authenticated;
