create extension if not exists vector;

alter table public.videos
  add column if not exists description text,
  add column if not exists file_name text,
  add column if not exists file_size bigint,
  add column if not exists mime_type text,
  add column if not exists duration_seconds integer,
  add column if not exists transcript_status text not null default 'uploaded',
  add column if not exists topics jsonb not null default '[]'::jsonb,
  add column if not exists fixation_questions jsonb not null default '[]'::jsonb,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.video_chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  chunk_index integer not null,
  start_seconds integer,
  end_seconds integer,
  content text not null,
  token_count integer not null default 0,
  embedding vector(768),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(video_id, chunk_index)
);

alter table public.video_transcripts
  add column if not exists summary text,
  add column if not exists segments jsonb not null default '[]'::jsonb,
  add column if not exists fixation_questions jsonb not null default '[]'::jsonb,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.slide_projects
  add column if not exists source_type text,
  add column if not exists source_id uuid,
  add column if not exists markdown text,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.slide_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.slide_projects(id) on delete cascade,
  page_index integer not null,
  title text not null,
  body text not null,
  speaker_notes text,
  layout text not null default 'content',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, page_index)
);

alter table public.chat_rooms
  add column if not exists is_locked boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

alter table public.chat_messages
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.room_invites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  access_code text not null,
  status text not null default 'active' check (status in ('active', 'revoked')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique(access_code)
);

alter table public.video_chunks enable row level security;
alter table public.slide_pages enable row level security;
alter table public.room_invites enable row level security;
alter table public.videos enable row level security;
alter table public.video_transcripts enable row level security;
alter table public.slide_projects enable row level security;
alter table public.chat_rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.chat_messages enable row level security;

grant select, insert, update, delete on public.videos to authenticated;
grant select, insert, update, delete on public.video_transcripts to authenticated;
grant select, insert, update, delete on public.video_chunks to authenticated;
grant select, insert, update, delete on public.slide_projects to authenticated;
grant select, insert, update, delete on public.slide_pages to authenticated;
grant select, insert, update, delete on public.chat_rooms to authenticated;
grant select, insert, update, delete on public.room_members to authenticated;
grant select, insert, update, delete on public.chat_messages to authenticated;
grant select, insert, update, delete on public.room_invites to authenticated;

drop policy if exists "videos owner all" on public.videos;
create policy "videos owner all" on public.videos
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "video_chunks owner all" on public.video_chunks;
create policy "video_chunks owner all" on public.video_chunks
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "slide_pages owner all" on public.slide_pages;
create policy "slide_pages owner all" on public.slide_pages
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "room_invites owner all" on public.room_invites;
create policy "room_invites owner all" on public.room_invites
  for all using (
    public.is_admin()
    or exists (select 1 from public.room_members rm where rm.room_id = room_invites.room_id and rm.user_id = auth.uid() and rm.role in ('owner','moderator'))
  )
  with check (
    public.is_admin()
    or exists (select 1 from public.room_members rm where rm.room_id = room_invites.room_id and rm.user_id = auth.uid() and rm.role in ('owner','moderator'))
  );

drop policy if exists "messages room members insert" on public.chat_messages;
create policy "messages room members insert" on public.chat_messages for insert with check (
  user_id = auth.uid()
  and exists (select 1 from public.room_members rm where rm.room_id = chat_messages.room_id and rm.user_id = auth.uid())
  and not exists (select 1 from public.chat_rooms cr where cr.id = chat_messages.room_id and cr.is_locked = true)
);

drop policy if exists "rooms owner or member read" on public.chat_rooms;
create policy "rooms owner or member read" on public.chat_rooms for select using (
  user_id = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.room_members rm where rm.room_id = chat_rooms.id and rm.user_id = auth.uid())
);

create index if not exists videos_user_status_idx on public.videos(user_id, status, created_at desc);
create index if not exists video_chunks_user_video_idx on public.video_chunks(user_id, video_id, chunk_index);
create index if not exists video_chunks_embedding_hnsw_idx on public.video_chunks using hnsw (embedding vector_cosine_ops);
create index if not exists slide_pages_project_idx on public.slide_pages(project_id, page_index);
create index if not exists room_invites_code_idx on public.room_invites(access_code);

insert into storage.buckets (id, name, public)
values ('study-videos', 'study-videos', false)
on conflict (id) do nothing;

update storage.buckets
set public = false,
    file_size_limit = 83886080,
    allowed_mime_types = array['video/mp4','video/webm','video/quicktime','video/x-m4v']
where id = 'study-videos';

drop policy if exists "study videos owner insert" on storage.objects;
create policy "study videos owner insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'study-videos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "study videos owner read" on storage.objects;
create policy "study videos owner read" on storage.objects
  for select to authenticated
  using (bucket_id = 'study-videos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

drop policy if exists "study videos owner delete" on storage.objects;
create policy "study videos owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'study-videos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

create or replace function public.match_video_chunks(
  query_embedding vector(768),
  match_user_id uuid,
  match_count integer default 8,
  min_similarity double precision default 0.25
)
returns table (
  id uuid,
  video_id uuid,
  video_title text,
  user_id uuid,
  chunk_index integer,
  start_seconds integer,
  end_seconds integer,
  content text,
  similarity double precision
)
language sql
stable
as $$
  select
    vc.id,
    vc.video_id,
    v.title as video_title,
    vc.user_id,
    vc.chunk_index,
    vc.start_seconds,
    vc.end_seconds,
    vc.content,
    1 - (vc.embedding <=> query_embedding) as similarity
  from public.video_chunks vc
  join public.videos v on v.id = vc.video_id
  where vc.user_id = match_user_id
    and v.user_id = match_user_id
    and vc.embedding is not null
    and 1 - (vc.embedding <=> query_embedding) >= min_similarity
  order by vc.embedding <=> query_embedding
  limit match_count;
$$;

grant execute on function public.match_video_chunks(vector, uuid, integer, double precision) to authenticated;
