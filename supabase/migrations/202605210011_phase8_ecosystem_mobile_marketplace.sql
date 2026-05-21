create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  plan text not null default 'standard' check (plan in ('standard','professional','enterprise','white_label')),
  status text not null default 'active' check (status in ('active','paused','blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member','viewer')),
  status text not null default 'active' check (status in ('active','invited','blocked')),
  created_at timestamptz not null default now(),
  unique(tenant_id, user_id)
);

create table if not exists public.tenant_settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  platform_name text not null default 'TEPM Study',
  custom_domain text,
  onboarding_copy text,
  locale text not null default 'pt-BR',
  feature_flags jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id)
);

create table if not exists public.custom_branding (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  logo_url text,
  primary_color text not null default '#2f7d68',
  accent_color text not null default '#c7a64b',
  background_color text not null default '#f3fbf6',
  font_family text not null default 'Cormorant Garamond',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id)
);

create table if not exists public.shared_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  shared_with_user_id uuid references auth.users(id) on delete cascade,
  room_id uuid references public.chat_rooms(id) on delete set null,
  permission text not null default 'read' check (permission in ('read','comment','review','edit_future')),
  status text not null default 'active' check (status in ('active','revoked')),
  created_at timestamptz not null default now()
);

create table if not exists public.collaborative_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  source_type text not null check (source_type in ('document','video','slide','study_path','room')),
  source_id uuid,
  status text not null default 'active' check (status in ('active','locked','archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_comments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.document_comments(id) on delete cascade,
  body text not null,
  status text not null default 'visible' check (status in ('visible','hidden','deleted')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('template','mind_map','slide_deck','apostila','therapeutic_model','premium_library')),
  title text not null,
  description text,
  content jsonb not null default '{}'::jsonb,
  markdown text,
  visibility text not null default 'private' check (visibility in ('private','tenant','public_catalog')),
  price_cents integer not null default 0,
  downloads_count integer not null default 0,
  status text not null default 'published' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.marketplace_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, item_id)
);

create table if not exists public.marketplace_downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.marketplace_items(id) on delete cascade,
  duplicated_material_id uuid references public.generated_materials(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.smart_notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_type text not null check (notification_type in ('study_reminder','revision_reminder','license_alert','ai_notice','progress_alert','security_alert')),
  title text not null,
  body text not null,
  action_url text,
  status text not null default 'unread' check (status in ('unread','read','archived')),
  scheduled_for timestamptz,
  delivered_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.offline_sync_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null,
  operation text not null check (operation in ('note_create','note_update','comment_create','productivity_session','revision_complete')),
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending','processing','synced','failed')),
  error_message text,
  created_at timestamptz not null default now(),
  synced_at timestamptz
);

create table if not exists public.realtime_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  channel text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.processing_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  job_type text not null check (job_type in ('pdf_chunking','video_transcription','embedding','ai_generation','marketplace_publish','offline_sync')),
  status text not null default 'queued' check (status in ('queued','running','completed','failed','cancelled')),
  priority integer not null default 5,
  payload jsonb not null default '{}'::jsonb,
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  scheduled_for timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;
alter table public.tenant_settings enable row level security;
alter table public.custom_branding enable row level security;
alter table public.shared_documents enable row level security;
alter table public.collaborative_sessions enable row level security;
alter table public.document_comments enable row level security;
alter table public.marketplace_items enable row level security;
alter table public.marketplace_favorites enable row level security;
alter table public.marketplace_downloads enable row level security;
alter table public.smart_notifications enable row level security;
alter table public.offline_sync_queue enable row level security;
alter table public.realtime_events enable row level security;
alter table public.processing_jobs enable row level security;

grant select, insert, update on public.tenants to authenticated;
grant select, insert, update on public.tenant_members to authenticated;
grant select, insert, update on public.tenant_settings to authenticated;
grant select, insert, update on public.custom_branding to authenticated;
grant select, insert, update on public.shared_documents to authenticated;
grant select, insert, update on public.collaborative_sessions to authenticated;
grant select, insert, update on public.document_comments to authenticated;
grant select, insert, update on public.marketplace_items to authenticated;
grant select, insert, delete on public.marketplace_favorites to authenticated;
grant select, insert on public.marketplace_downloads to authenticated;
grant select, insert, update on public.smart_notifications to authenticated;
grant select, insert, update on public.offline_sync_queue to authenticated;
grant select, insert on public.realtime_events to authenticated;
grant select, insert, update on public.processing_jobs to authenticated;

grant select, insert, update, delete on all tables in schema public to service_role;

create or replace function public.is_tenant_member(check_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = check_tenant_id
      and tm.user_id = auth.uid()
      and tm.status = 'active'
  ) or public.is_admin();
$$;

drop policy if exists "tenants owner or member read" on public.tenants;
create policy "tenants owner or member read" on public.tenants for select using (owner_user_id = auth.uid() or public.is_tenant_member(id));
drop policy if exists "tenants owner insert" on public.tenants;
create policy "tenants owner insert" on public.tenants for insert with check (owner_user_id = auth.uid() or public.is_admin());
drop policy if exists "tenants owner update" on public.tenants;
create policy "tenants owner update" on public.tenants for update using (owner_user_id = auth.uid() or public.is_admin()) with check (owner_user_id = auth.uid() or public.is_admin());

drop policy if exists "tenant_members member read" on public.tenant_members;
create policy "tenant_members member read" on public.tenant_members for select using (user_id = auth.uid() or public.is_tenant_member(tenant_id));
drop policy if exists "tenant_members owner manage" on public.tenant_members;
create policy "tenant_members owner manage" on public.tenant_members for all using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));

drop policy if exists "tenant_settings member all" on public.tenant_settings;
create policy "tenant_settings member all" on public.tenant_settings for all using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));
drop policy if exists "custom_branding member all" on public.custom_branding;
create policy "custom_branding member all" on public.custom_branding for all using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));

drop policy if exists "shared_documents owner or target" on public.shared_documents;
create policy "shared_documents owner or target" on public.shared_documents for all using (owner_user_id = auth.uid() or shared_with_user_id = auth.uid() or public.is_tenant_member(tenant_id)) with check (owner_user_id = auth.uid() or public.is_tenant_member(tenant_id));

drop policy if exists "collaborative_sessions owner or tenant" on public.collaborative_sessions;
create policy "collaborative_sessions owner or tenant" on public.collaborative_sessions for all using (owner_user_id = auth.uid() or public.is_tenant_member(tenant_id)) with check (owner_user_id = auth.uid() or public.is_tenant_member(tenant_id));

drop policy if exists "document_comments document owner or tenant" on public.document_comments;
create policy "document_comments document owner or tenant" on public.document_comments for all using (user_id = auth.uid() or public.is_tenant_member(tenant_id) or exists (select 1 from public.documents d where d.id = document_id and d.user_id = auth.uid())) with check (user_id = auth.uid() or public.is_tenant_member(tenant_id));

drop policy if exists "marketplace_items scoped read" on public.marketplace_items;
create policy "marketplace_items scoped read" on public.marketplace_items for select using (visibility = 'public_catalog' or user_id = auth.uid() or public.is_tenant_member(tenant_id));
drop policy if exists "marketplace_items owner all" on public.marketplace_items;
create policy "marketplace_items owner all" on public.marketplace_items for all using (user_id = auth.uid() or public.is_tenant_member(tenant_id)) with check (user_id = auth.uid() or public.is_tenant_member(tenant_id));

drop policy if exists "marketplace_favorites owner all" on public.marketplace_favorites;
create policy "marketplace_favorites owner all" on public.marketplace_favorites for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "marketplace_downloads owner all" on public.marketplace_downloads;
create policy "marketplace_downloads owner all" on public.marketplace_downloads for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "smart_notifications owner all" on public.smart_notifications;
create policy "smart_notifications owner all" on public.smart_notifications for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "offline_sync owner all" on public.offline_sync_queue;
create policy "offline_sync owner all" on public.offline_sync_queue for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "realtime_events owner or tenant" on public.realtime_events;
create policy "realtime_events owner or tenant" on public.realtime_events for all using (user_id = auth.uid() or public.is_tenant_member(tenant_id)) with check (user_id = auth.uid() or public.is_tenant_member(tenant_id));
drop policy if exists "processing_jobs owner or tenant" on public.processing_jobs;
create policy "processing_jobs owner or tenant" on public.processing_jobs for all using (user_id = auth.uid() or public.is_tenant_member(tenant_id)) with check (user_id = auth.uid() or public.is_tenant_member(tenant_id));

create index if not exists tenant_members_user_idx on public.tenant_members(user_id, tenant_id);
create index if not exists shared_documents_target_idx on public.shared_documents(shared_with_user_id, document_id);
create index if not exists document_comments_doc_created_idx on public.document_comments(document_id, created_at desc);
create index if not exists marketplace_items_scope_idx on public.marketplace_items(visibility, item_type, created_at desc);
create index if not exists notifications_user_status_idx on public.smart_notifications(user_id, status, created_at desc);
create index if not exists offline_sync_user_status_idx on public.offline_sync_queue(user_id, status, created_at asc);
create index if not exists realtime_events_channel_idx on public.realtime_events(channel, created_at desc);
create index if not exists processing_jobs_status_idx on public.processing_jobs(status, priority, scheduled_for asc);
