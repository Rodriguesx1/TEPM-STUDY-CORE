create table if not exists public.user_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  memory_type text not null check (memory_type in ('theme','difficulty','preference','study_frequency','summary','goal')),
  title text not null,
  content text not null,
  confidence numeric(4,3) not null default 0.650,
  source_type text,
  source_id uuid,
  last_seen_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, memory_type, title)
);

create table if not exists public.memory_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  source_type text not null default 'system',
  source_id uuid,
  title text,
  content text not null,
  weight numeric(4,3) not null default 0.500,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tone text not null default 'acolhedor_e_didatico',
  depth text not null default 'intermediario',
  preferred_format text not null default 'topicos',
  review_style text not null default 'perguntas_de_fixacao',
  voice_enabled boolean not null default false,
  avatar_enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.cognitive_patterns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pattern_type text not null check (pattern_type in ('abandonment','overload','low_retention','repeated_theme','recurring_difficulty','ideal_time','engagement')),
  title text not null,
  description text not null,
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  evidence jsonb not null default '{}'::jsonb,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.study_patterns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  total_sessions integer not null default 0,
  completed_reviews integer not null default 0,
  ai_questions integer not null default 0,
  uploaded_materials integer not null default 0,
  strongest_theme text,
  weakest_theme text,
  ideal_study_hour integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(user_id, period_start, period_end)
);

create table if not exists public.retention_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null check (source_type in ('document','video','note','theme')),
  source_id uuid,
  theme text,
  score numeric(5,2) not null default 50.00,
  last_reviewed_at timestamptz,
  next_review_at timestamptz,
  review_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, source_type, source_id, theme)
);

create table if not exists public.revision_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null check (source_type in ('document','video','note','theme')),
  source_id uuid,
  title text not null,
  theme text,
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  due_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending','completed','snoozed','cancelled')),
  retention_score numeric(5,2) not null default 50.00,
  interval_days integer not null default 1,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generated_materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  material_type text not null check (material_type in ('apostila','resumo_premium','simulado','perguntas_terapeuticas','quiz','exercicios','flashcards','apresentacao','roteiro_aula')),
  title text not null,
  source_type text,
  source_id uuid,
  content jsonb not null default '{}'::jsonb,
  markdown text,
  status text not null default 'ready' check (status in ('generating','ready','failed')),
  agent_name text not null default 'presentation_premium',
  token_estimate integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_name text not null,
  task_type text not null,
  input_summary text,
  output_summary text,
  status text not null default 'completed' check (status in ('queued','running','completed','failed')),
  provider text,
  token_estimate integer not null default 0,
  cost_estimate_cents numeric(10,4) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.productivity_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null default 'focus' check (mode in ('focus','pomodoro','review','deep_work','listen')),
  title text not null,
  duration_minutes integer not null default 25,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  status text not null default 'completed' check (status in ('running','completed','cancelled')),
  distractions_blocked integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_cost_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  route text not null,
  operation text not null,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  embedding_tokens integer not null default 0,
  estimated_cost_cents numeric(10,4) not null default 0,
  cached boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.user_memory enable row level security;
alter table public.memory_events enable row level security;
alter table public.ai_preferences enable row level security;
alter table public.cognitive_patterns enable row level security;
alter table public.study_patterns enable row level security;
alter table public.retention_scores enable row level security;
alter table public.revision_queue enable row level security;
alter table public.generated_materials enable row level security;
alter table public.agent_runs enable row level security;
alter table public.productivity_sessions enable row level security;
alter table public.ai_cost_ledger enable row level security;

grant select, insert, update, delete on public.user_memory to authenticated;
grant select, insert on public.memory_events to authenticated;
grant select, insert, update on public.ai_preferences to authenticated;
grant select on public.cognitive_patterns to authenticated;
grant select on public.study_patterns to authenticated;
grant select, insert, update, delete on public.retention_scores to authenticated;
grant select, insert, update, delete on public.revision_queue to authenticated;
grant select, insert, update, delete on public.generated_materials to authenticated;
grant select on public.agent_runs to authenticated;
grant select, insert, update on public.productivity_sessions to authenticated;
grant select on public.ai_cost_ledger to authenticated;

grant select, insert, update, delete on public.user_memory to service_role;
grant select, insert, update, delete on public.memory_events to service_role;
grant select, insert, update, delete on public.ai_preferences to service_role;
grant select, insert, update, delete on public.cognitive_patterns to service_role;
grant select, insert, update, delete on public.study_patterns to service_role;
grant select, insert, update, delete on public.retention_scores to service_role;
grant select, insert, update, delete on public.revision_queue to service_role;
grant select, insert, update, delete on public.generated_materials to service_role;
grant select, insert, update, delete on public.agent_runs to service_role;
grant select, insert, update, delete on public.productivity_sessions to service_role;
grant select, insert, update, delete on public.ai_cost_ledger to service_role;

drop policy if exists "user_memory owner all" on public.user_memory;
create policy "user_memory owner all" on public.user_memory for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "memory_events owner all" on public.memory_events;
create policy "memory_events owner all" on public.memory_events for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "ai_preferences owner all" on public.ai_preferences;
create policy "ai_preferences owner all" on public.ai_preferences for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "cognitive_patterns owner read" on public.cognitive_patterns;
create policy "cognitive_patterns owner read" on public.cognitive_patterns for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "study_patterns owner read" on public.study_patterns;
create policy "study_patterns owner read" on public.study_patterns for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "retention_scores owner all" on public.retention_scores;
create policy "retention_scores owner all" on public.retention_scores for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "revision_queue owner all" on public.revision_queue;
create policy "revision_queue owner all" on public.revision_queue for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "generated_materials owner all" on public.generated_materials;
create policy "generated_materials owner all" on public.generated_materials for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "agent_runs owner read" on public.agent_runs;
create policy "agent_runs owner read" on public.agent_runs for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "productivity_sessions owner all" on public.productivity_sessions;
create policy "productivity_sessions owner all" on public.productivity_sessions for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "ai_cost_ledger owner read" on public.ai_cost_ledger;
create policy "ai_cost_ledger owner read" on public.ai_cost_ledger for select using (user_id = auth.uid() or public.is_admin());

create index if not exists user_memory_user_type_idx on public.user_memory(user_id, memory_type, last_seen_at desc);
create index if not exists memory_events_user_created_idx on public.memory_events(user_id, created_at desc);
create index if not exists cognitive_patterns_user_detected_idx on public.cognitive_patterns(user_id, detected_at desc);
create index if not exists revision_queue_user_due_idx on public.revision_queue(user_id, status, due_at asc);
create index if not exists retention_scores_user_score_idx on public.retention_scores(user_id, score asc);
create index if not exists generated_materials_user_created_idx on public.generated_materials(user_id, created_at desc);
create index if not exists agent_runs_user_started_idx on public.agent_runs(user_id, started_at desc);
create index if not exists productivity_sessions_user_started_idx on public.productivity_sessions(user_id, started_at desc);
create index if not exists ai_cost_ledger_user_created_idx on public.ai_cost_ledger(user_id, created_at desc);
