create extension if not exists "uuid-ossp";
create extension if not exists vector;

create table if not exists public.users_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  description text,
  price_cents integer not null default 0,
  features jsonb not null default '[]',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.licenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  invite_code text unique,
  status text not null default 'trial' check (status in ('active', 'trial', 'expired', 'blocked')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  file_path text,
  mime_type text not null,
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'processed', 'failed')),
  summary text,
  theme text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  token_count integer not null default 0,
  embedding vector(768),
  created_at timestamptz not null default now()
);

create table if not exists public.embeddings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null,
  source_id uuid not null,
  content text not null,
  embedding vector(768),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  file_path text,
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'processed', 'failed')),
  summary text,
  created_at timestamptz not null default now()
);

create table if not exists public.video_transcripts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  transcript text not null,
  topics jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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

create policy "profiles self read or admin" on public.users_profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles self update" on public.users_profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "plans read active" on public.plans for select using (is_active = true or public.is_admin());
create policy "plans admin manage" on public.plans for all using (public.is_admin()) with check (public.is_admin());

create policy "licenses self read or admin" on public.licenses for select using (user_id = auth.uid() or public.is_admin());
create policy "licenses admin manage" on public.licenses for all using (public.is_admin()) with check (public.is_admin());

create policy "documents owner select" on public.documents for select using (user_id = auth.uid() or public.is_admin());
create policy "documents owner insert" on public.documents for insert with check (user_id = auth.uid());
create policy "documents owner update" on public.documents for update using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "documents owner delete" on public.documents for delete using (user_id = auth.uid() or public.is_admin());

create policy "document_chunks owner all" on public.document_chunks for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "embeddings owner all" on public.embeddings for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "videos owner all" on public.videos for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "video_transcripts owner all" on public.video_transcripts for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "notes owner all" on public.notes for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "study_paths owner all" on public.study_paths for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "mind_maps owner all" on public.mind_maps for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "slide_projects owner all" on public.slide_projects for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

create policy "rooms owner or member read" on public.chat_rooms for select using (
  user_id = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.room_members rm where rm.room_id = id and rm.user_id = auth.uid())
);
create policy "rooms owner create" on public.chat_rooms for insert with check (user_id = auth.uid());
create policy "rooms owner update" on public.chat_rooms for update using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

create policy "room members visible to members" on public.room_members for select using (
  user_id = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.room_members rm where rm.room_id = room_id and rm.user_id = auth.uid())
);
create policy "room members owner manage" on public.room_members for all using (
  public.is_admin()
  or exists (select 1 from public.chat_rooms cr where cr.id = room_id and cr.user_id = auth.uid())
) with check (
  public.is_admin()
  or exists (select 1 from public.chat_rooms cr where cr.id = room_id and cr.user_id = auth.uid())
);

create policy "messages room members read" on public.chat_messages for select using (
  public.is_admin()
  or exists (select 1 from public.room_members rm where rm.room_id = room_id and rm.user_id = auth.uid())
);
create policy "messages room members insert" on public.chat_messages for insert with check (
  user_id = auth.uid()
  and exists (select 1 from public.room_members rm where rm.room_id = room_id and rm.user_id = auth.uid())
);

create policy "audit self read or admin" on public.audit_logs for select using (user_id = auth.uid() or public.is_admin());
create policy "audit insert own" on public.audit_logs for insert with check (user_id = auth.uid() or public.is_admin());

create index if not exists document_chunks_embedding_idx on public.document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists embeddings_embedding_idx on public.embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists documents_user_id_idx on public.documents(user_id);
create index if not exists licenses_user_status_idx on public.licenses(user_id, status, expires_at);
