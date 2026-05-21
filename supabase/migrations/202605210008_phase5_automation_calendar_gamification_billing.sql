create table if not exists public.study_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  event_type text not null default 'study' check (event_type in ('study','review','weekly_goal','therapy_session','license_alert')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled')),
  source_type text,
  source_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid references public.study_events(id) on delete set null,
  document_id uuid references public.documents(id) on delete set null,
  video_id uuid references public.videos(id) on delete set null,
  title text not null,
  description text,
  task_type text not null default 'study' check (task_type in ('study','review','goal','therapy_session','automation')),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  due_at timestamptz,
  status text not null default 'pending' check (status in ('pending','completed','cancelled')),
  completed_at timestamptz,
  points_awarded integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  target_count integer not null default 1,
  current_count integer not null default 0,
  period_start date not null default current_date,
  period_end date not null default (current_date + interval '7 days')::date,
  status text not null default 'active' check (status in ('active','completed','paused','cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_points (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_points integer not null default 0,
  level integer not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null,
  points_required integer not null default 0,
  rule jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  earned_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique(user_id, achievement_id)
);

create table if not exists public.study_streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_activity_date date,
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price_cents integer not null default 0,
  currency text not null default 'BRL',
  interval text not null default 'month' check (interval in ('free','month','year','lifetime')),
  features jsonb not null default '[]'::jsonb,
  limits jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.license_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  license_id uuid references public.licenses(id) on delete set null,
  changed_by uuid references auth.users(id) on delete set null,
  action text not null,
  from_status text,
  to_status text,
  from_expires_at timestamptz,
  to_expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_percent integer not null default 0 check (discount_percent >= 0 and discount_percent <= 100),
  bonus_days integer not null default 0,
  status text not null default 'active' check (status in ('active','expired','disabled')),
  expires_at timestamptz,
  max_redemptions integer,
  redeemed_count integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  license_id uuid references public.licenses(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.onboarding_checklists (
  user_id uuid primary key references auth.users(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.study_events enable row level security;
alter table public.study_tasks enable row level security;
alter table public.study_goals enable row level security;
alter table public.user_points enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.study_streaks enable row level security;
alter table public.billing_plans enable row level security;
alter table public.license_history enable row level security;
alter table public.coupons enable row level security;
alter table public.subscription_events enable row level security;
alter table public.onboarding_checklists enable row level security;

grant select, insert, update, delete on public.study_events to authenticated;
grant select, insert, update, delete on public.study_tasks to authenticated;
grant select, insert, update, delete on public.study_goals to authenticated;
grant select on public.user_points to authenticated;
grant select on public.achievements to authenticated;
grant select on public.user_achievements to authenticated;
grant select on public.study_streaks to authenticated;
grant select on public.billing_plans to authenticated;
grant select on public.license_history to authenticated;
grant select on public.coupons to authenticated;
grant select on public.subscription_events to authenticated;
grant select, insert, update on public.onboarding_checklists to authenticated;

drop policy if exists "study_events owner all" on public.study_events;
create policy "study_events owner all" on public.study_events
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "study_tasks owner all" on public.study_tasks;
create policy "study_tasks owner all" on public.study_tasks
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "study_goals owner all" on public.study_goals;
create policy "study_goals owner all" on public.study_goals
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "user_points owner read" on public.user_points;
create policy "user_points owner read" on public.user_points
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "achievements read" on public.achievements;
create policy "achievements read" on public.achievements for select using (true);

drop policy if exists "achievements admin manage" on public.achievements;
create policy "achievements admin manage" on public.achievements
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "user_achievements owner read" on public.user_achievements;
create policy "user_achievements owner read" on public.user_achievements
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "study_streaks owner read" on public.study_streaks;
create policy "study_streaks owner read" on public.study_streaks
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "billing_plans active read" on public.billing_plans;
create policy "billing_plans active read" on public.billing_plans
  for select using (is_active = true or public.is_admin());

drop policy if exists "billing_plans admin manage" on public.billing_plans;
create policy "billing_plans admin manage" on public.billing_plans
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "license_history self read or admin" on public.license_history;
create policy "license_history self read or admin" on public.license_history
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "coupons admin read" on public.coupons;
create policy "coupons admin read" on public.coupons for select using (public.is_admin());

drop policy if exists "coupons admin manage" on public.coupons;
create policy "coupons admin manage" on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "subscription_events self read or admin" on public.subscription_events;
create policy "subscription_events self read or admin" on public.subscription_events
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "onboarding owner all" on public.onboarding_checklists;
create policy "onboarding owner all" on public.onboarding_checklists
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create index if not exists study_events_user_start_idx on public.study_events(user_id, starts_at);
create index if not exists study_tasks_user_status_due_idx on public.study_tasks(user_id, status, due_at);
create index if not exists study_goals_user_period_idx on public.study_goals(user_id, period_start, period_end);
create index if not exists license_history_user_idx on public.license_history(user_id, created_at desc);
create index if not exists subscription_events_user_idx on public.subscription_events(user_id, created_at desc);

insert into public.achievements (code, title, description, points_required, rule)
values
  ('first_pdf', 'Primeiro material processado', 'Processou o primeiro PDF na biblioteca inteligente.', 20, '{"kind":"document_processed","count":1}'::jsonb),
  ('first_review', 'Primeira revisao concluida', 'Concluiu a primeira revisao programada.', 10, '{"kind":"task_completed","task_type":"review","count":1}'::jsonb),
  ('seven_day_focus', 'Sequencia de 7 dias', 'Manteve uma rotina de estudo por 7 dias.', 140, '{"kind":"streak","days":7}'::jsonb),
  ('mentor_active', 'Mentoria ativa', 'Usou a Mentora IA com materiais da memoria.', 50, '{"kind":"chat_messages","count":3}'::jsonb),
  ('premium_builder', 'Construtora premium', 'Criou trilhas, slides ou salas de estudo.', 100, '{"kind":"creator","count":1}'::jsonb)
on conflict (code) do update set
  title = excluded.title,
  description = excluded.description,
  points_required = excluded.points_required,
  rule = excluded.rule;

insert into public.billing_plans (name, slug, description, price_cents, interval, features, limits, sort_order)
values
  ('Free', 'free', 'Organizacao inicial com limites reduzidos.', 0, 'free', '["biblioteca basica","caderno","dashboard"]'::jsonb, '{"pdfs":3,"videos":0,"ai_chats":10,"slides":0,"rooms":0}'::jsonb, 1),
  ('Estudante', 'student', 'Estudo guiado com IA e revisoes.', 3900, 'month', '["PDFs com IA","chat RAG","trilhas","calendario"]'::jsonb, '{"pdfs":50,"videos":2,"ai_chats":300,"slides":10,"rooms":1}'::jsonb, 2),
  ('Premium', 'premium', 'Memoria inteligente, videos e relatorios.', 7900, 'month', '["videos","slides","relatorios","gamificacao"]'::jsonb, '{"pdfs":200,"videos":20,"ai_chats":1500,"slides":100,"rooms":5}'::jsonb, 3),
  ('Profissional', 'professional', 'Comunidade, equipe e gestao avancada.', 14900, 'month', '["comunidade premium","billing avancado","relatorios completos"]'::jsonb, '{"pdfs":1000,"videos":100,"ai_chats":5000,"slides":500,"rooms":50}'::jsonb, 4),
  ('Vitalicio', 'lifetime', 'Acesso permanente para administracao e licencas especiais.', 99700, 'lifetime', '["acesso vitalicio","recursos premium","suporte prioritario"]'::jsonb, '{"pdfs":-1,"videos":-1,"ai_chats":-1,"slides":-1,"rooms":-1}'::jsonb, 5)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents,
  interval = excluded.interval,
  features = excluded.features,
  limits = excluded.limits,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

create or replace function public.refresh_expired_licenses()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.licenses
  set status = 'expired'
  where status in ('active','trial')
    and expires_at is not null
    and expires_at < now();
  get diagnostics affected = row_count;
  return affected;
end;
$$;

grant execute on function public.refresh_expired_licenses() to authenticated;
