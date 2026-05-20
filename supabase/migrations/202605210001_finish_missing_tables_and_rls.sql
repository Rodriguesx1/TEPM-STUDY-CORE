create extension if not exists vector;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users_profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create table if not exists public.study_paths (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  modules jsonb not null default '[]',
  progress numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mind_maps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  nodes jsonb not null default '[]',
  edges jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists public.slide_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  theme jsonb not null default '{}',
  slides jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  access_code text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.room_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'moderator', 'member')),
  created_at timestamptz not null default now(),
  unique (user_id, room_id)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  ip_address inet,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.users_profiles enable row level security;
alter table public.plans enable row level security;
alter table public.licenses enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.embeddings enable row level security;
alter table public.videos enable row level security;
alter table public.video_transcripts enable row level security;
alter table public.notes enable row level security;
alter table public.study_paths enable row level security;
alter table public.mind_maps enable row level security;
alter table public.slide_projects enable row level security;
alter table public.chat_rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.chat_messages enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "profiles self read or admin" on public.users_profiles;
create policy "profiles self read or admin" on public.users_profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles self update" on public.users_profiles;
create policy "profiles self update" on public.users_profiles for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "plans read active" on public.plans;
create policy "plans read active" on public.plans for select using (is_active = true or public.is_admin());
drop policy if exists "plans admin manage" on public.plans;
create policy "plans admin manage" on public.plans for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "licenses self read or admin" on public.licenses;
create policy "licenses self read or admin" on public.licenses for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "licenses admin manage" on public.licenses;
create policy "licenses admin manage" on public.licenses for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "documents owner select" on public.documents;
create policy "documents owner select" on public.documents for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "documents owner insert" on public.documents;
create policy "documents owner insert" on public.documents for insert with check (user_id = auth.uid());
drop policy if exists "documents owner update" on public.documents;
create policy "documents owner update" on public.documents for update using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "documents owner delete" on public.documents;
create policy "documents owner delete" on public.documents for delete using (user_id = auth.uid() or public.is_admin());

drop policy if exists "document_chunks owner all" on public.document_chunks;
create policy "document_chunks owner all" on public.document_chunks for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "embeddings owner all" on public.embeddings;
create policy "embeddings owner all" on public.embeddings for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "videos owner all" on public.videos;
create policy "videos owner all" on public.videos for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "video_transcripts owner all" on public.video_transcripts;
create policy "video_transcripts owner all" on public.video_transcripts for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "notes owner all" on public.notes;
create policy "notes owner all" on public.notes for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "study_paths owner all" on public.study_paths;
create policy "study_paths owner all" on public.study_paths for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "mind_maps owner all" on public.mind_maps;
create policy "mind_maps owner all" on public.mind_maps for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "slide_projects owner all" on public.slide_projects;
create policy "slide_projects owner all" on public.slide_projects for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "rooms owner or member read" on public.chat_rooms;
create policy "rooms owner or member read" on public.chat_rooms for select using (
  user_id = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.room_members rm where rm.room_id = id and rm.user_id = auth.uid())
);
drop policy if exists "rooms owner create" on public.chat_rooms;
create policy "rooms owner create" on public.chat_rooms for insert with check (user_id = auth.uid());
drop policy if exists "rooms owner update" on public.chat_rooms;
create policy "rooms owner update" on public.chat_rooms for update using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "room members visible to members" on public.room_members;
create policy "room members visible to members" on public.room_members for select using (
  user_id = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.room_members rm where rm.room_id = room_members.room_id and rm.user_id = auth.uid())
);
drop policy if exists "room members owner manage" on public.room_members;
create policy "room members owner manage" on public.room_members for all using (
  public.is_admin()
  or exists (select 1 from public.chat_rooms cr where cr.id = room_id and cr.user_id = auth.uid())
) with check (
  public.is_admin()
  or exists (select 1 from public.chat_rooms cr where cr.id = room_id and cr.user_id = auth.uid())
);

drop policy if exists "messages room members read" on public.chat_messages;
create policy "messages room members read" on public.chat_messages for select using (
  public.is_admin()
  or exists (select 1 from public.room_members rm where rm.room_id = chat_messages.room_id and rm.user_id = auth.uid())
);
drop policy if exists "messages room members insert" on public.chat_messages;
create policy "messages room members insert" on public.chat_messages for insert with check (
  user_id = auth.uid()
  and exists (select 1 from public.room_members rm where rm.room_id = chat_messages.room_id and rm.user_id = auth.uid())
);

drop policy if exists "audit self read or admin" on public.audit_logs;
create policy "audit self read or admin" on public.audit_logs for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "audit insert own" on public.audit_logs;
create policy "audit insert own" on public.audit_logs for insert with check (user_id = auth.uid() or public.is_admin());

create index if not exists documents_user_id_idx on public.documents(user_id);
create index if not exists licenses_user_status_idx on public.licenses(user_id, status, expires_at);
