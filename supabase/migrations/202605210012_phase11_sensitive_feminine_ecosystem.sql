-- Fase 11: recursos femininos sensiveis, LGPD-first e opt-in.
-- Dados de ciclo, humor e diario ficam isolados por user_id e nao sao liberados para admin por RLS.

create table if not exists public.sensitive_feature_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature_name text not null check (feature_name in ('cycle_tracking','emotional_journal','ai_sensitive_adaptation','push_notifications','sound_experience')),
  consent_given boolean not null default false,
  consent_version text not null default '2026-05-sensitive-v1',
  granted_at timestamptz,
  revoked_at timestamptz,
  legal_basis text not null default 'consent',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, feature_name, consent_version)
);

create table if not exists public.privacy_exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  export_scope text not null default 'sensitive' check (export_scope in ('sensitive','cycle','journal','notifications','all')),
  status text not null default 'generated' check (status in ('requested','generated','failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.sensitive_data_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deletion_scope text not null check (deletion_scope in ('all_sensitive','cycle','journal','notifications','sound_preferences')),
  reason text,
  status text not null default 'requested' check (status in ('requested','processing','completed','cancelled','failed')),
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.cycle_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  is_enabled boolean not null default true,
  last_period_start date,
  average_cycle_length integer not null default 28 check (average_cycle_length between 15 and 60),
  average_period_length integer not null default 5 check (average_period_length between 1 and 15),
  tracking_preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cycle_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  phase text check (phase in ('menstrual','folicular','ovulatoria','lutea','indefinida')),
  mood text,
  energy_level integer check (energy_level between 1 and 5),
  symptoms text[] not null default '{}',
  private_notes text,
  use_for_ai boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, entry_date)
);

create table if not exists public.cycle_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  predicted_date date not null,
  predicted_phase text not null check (predicted_phase in ('menstrual','folicular','ovulatoria','lutea','indefinida')),
  confidence text not null default 'estimate' check (confidence in ('estimate','manual','low')),
  basis jsonb not null default '{}'::jsonb,
  disclaimer text not null default 'Estimativa baseada nos dados informados. Nao substitui orientacao medica.',
  created_at timestamptz not null default now(),
  unique(user_id, predicted_date)
);

create table if not exists public.emotional_journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null default current_date,
  title text,
  mood text,
  energy_level integer check (energy_level between 1 and 5),
  tags text[] not null default '{}',
  content text not null,
  dreams text,
  insights text,
  use_for_ai boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.journal_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

create table if not exists public.journal_ai_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  journal_entry_id uuid not null references public.emotional_journal_entries(id) on delete cascade,
  insight text not null,
  provider text not null default 'system',
  safety_note text not null default 'Reflexao de estudo e organizacao emocional. Nao e diagnostico medico.',
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_type text not null check (notification_type in ('revision','study','cycle','journal','community','license','ai','progress','privacy')),
  title text not null,
  body text not null,
  action_url text,
  is_sensitive boolean not null default false,
  status text not null default 'unread' check (status in ('unread','read','archived')),
  scheduled_for timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enable_internal boolean not null default true,
  enable_push boolean not null default false,
  enable_sound boolean not null default false,
  hide_sensitive_on_lock_screen boolean not null default true,
  quiet_hours_start time,
  quiet_hours_end time,
  allowed_types text[] not null default array['revision','study','license','ai','progress','privacy']::text[],
  sound_volume numeric(3,2) not null default 0.25 check (sound_volume between 0 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, endpoint)
);

alter table public.sensitive_feature_consents enable row level security;
alter table public.privacy_exports enable row level security;
alter table public.sensitive_data_deletion_requests enable row level security;
alter table public.cycle_profiles enable row level security;
alter table public.cycle_entries enable row level security;
alter table public.cycle_predictions enable row level security;
alter table public.emotional_journal_entries enable row level security;
alter table public.journal_tags enable row level security;
alter table public.journal_ai_insights enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.push_subscriptions enable row level security;

grant select, insert, update, delete on public.sensitive_feature_consents to authenticated;
grant select, insert on public.privacy_exports to authenticated;
grant select, insert, update on public.sensitive_data_deletion_requests to authenticated;
grant select, insert, update, delete on public.cycle_profiles to authenticated;
grant select, insert, update, delete on public.cycle_entries to authenticated;
grant select, insert, update, delete on public.cycle_predictions to authenticated;
grant select, insert, update, delete on public.emotional_journal_entries to authenticated;
grant select, insert, update, delete on public.journal_tags to authenticated;
grant select, insert, update, delete on public.journal_ai_insights to authenticated;
grant select, insert, update, delete on public.notifications to authenticated;
grant select, insert, update, delete on public.notification_preferences to authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;

grant select, insert, update, delete on all tables in schema public to service_role;

drop policy if exists "sensitive_consents owner all" on public.sensitive_feature_consents;
create policy "sensitive_consents owner all" on public.sensitive_feature_consents for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "privacy_exports owner read insert" on public.privacy_exports;
create policy "privacy_exports owner read insert" on public.privacy_exports for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "sensitive_delete_requests owner all" on public.sensitive_data_deletion_requests;
create policy "sensitive_delete_requests owner all" on public.sensitive_data_deletion_requests for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "cycle_profiles owner all" on public.cycle_profiles;
create policy "cycle_profiles owner all" on public.cycle_profiles for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "cycle_entries owner all" on public.cycle_entries;
create policy "cycle_entries owner all" on public.cycle_entries for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "cycle_predictions owner all" on public.cycle_predictions;
create policy "cycle_predictions owner all" on public.cycle_predictions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "journal_entries owner all" on public.emotional_journal_entries;
create policy "journal_entries owner all" on public.emotional_journal_entries for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "journal_tags owner all" on public.journal_tags;
create policy "journal_tags owner all" on public.journal_tags for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "journal_ai_insights owner all" on public.journal_ai_insights;
create policy "journal_ai_insights owner all" on public.journal_ai_insights for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "notifications owner all" on public.notifications;
create policy "notifications owner all" on public.notifications for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "notification_preferences owner all" on public.notification_preferences;
create policy "notification_preferences owner all" on public.notification_preferences for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "push_subscriptions owner all" on public.push_subscriptions;
create policy "push_subscriptions owner all" on public.push_subscriptions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists sensitive_consents_user_feature_idx on public.sensitive_feature_consents(user_id, feature_name, consent_given);
create index if not exists cycle_entries_user_date_idx on public.cycle_entries(user_id, entry_date desc);
create index if not exists cycle_predictions_user_date_idx on public.cycle_predictions(user_id, predicted_date);
create index if not exists journal_entries_user_date_idx on public.emotional_journal_entries(user_id, entry_date desc, created_at desc);
create index if not exists notifications_user_status_idx on public.notifications(user_id, status, created_at desc);
create index if not exists push_subscriptions_user_enabled_idx on public.push_subscriptions(user_id, enabled);
