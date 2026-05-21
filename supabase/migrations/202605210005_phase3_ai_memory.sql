create extension if not exists vector;

alter table public.documents
  add column if not exists file_url text,
  add column if not exists file_name text,
  add column if not exists file_size bigint,
  add column if not exists themes jsonb not null default '[]'::jsonb,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.document_chunks
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.ai_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.ai_chats(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.study_paths
  add column if not exists modules jsonb not null default '[]'::jsonb,
  add column if not exists status text not null default 'draft';

alter table public.mind_maps
  add column if not exists markdown text;

alter table public.notes
  add column if not exists document_id uuid references public.documents(id) on delete set null,
  add column if not exists content text,
  add column if not exists tags jsonb not null default '[]'::jsonb;

create index if not exists documents_user_status_idx on public.documents(user_id, status, created_at desc);
create index if not exists document_chunks_user_document_idx on public.document_chunks(user_id, document_id, chunk_index);
create index if not exists ai_chats_user_created_idx on public.ai_chats(user_id, created_at desc);
create index if not exists ai_messages_chat_created_idx on public.ai_messages(chat_id, created_at);

create or replace function public.match_document_chunks(
  query_embedding vector(768),
  match_user_id uuid,
  match_count integer default 8
)
returns table (
  id uuid,
  document_id uuid,
  user_id uuid,
  chunk_index integer,
  content text,
  similarity double precision
)
language sql
stable
as $$
  select
    dc.id,
    dc.document_id,
    dc.user_id,
    dc.chunk_index,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  where dc.user_id = match_user_id
    and dc.embedding is not null
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;

alter table public.ai_chats enable row level security;
alter table public.ai_messages enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.notes enable row level security;
alter table public.study_paths enable row level security;
alter table public.mind_maps enable row level security;

grant select, insert, update, delete on public.documents to authenticated;
grant select, insert, update, delete on public.document_chunks to authenticated;
grant select, insert, update, delete on public.ai_chats to authenticated;
grant select, insert, update, delete on public.ai_messages to authenticated;
grant select, insert, update, delete on public.notes to authenticated;
grant select, insert, update, delete on public.study_paths to authenticated;
grant select, insert, update, delete on public.mind_maps to authenticated;
grant execute on function public.match_document_chunks(vector, uuid, integer) to authenticated;

drop policy if exists "ai_chats owner all" on public.ai_chats;
create policy "ai_chats owner all" on public.ai_chats
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "ai_messages owner all" on public.ai_messages;
create policy "ai_messages owner all" on public.ai_messages
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "notes owner all" on public.notes;
create policy "notes owner all" on public.notes
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "study_paths owner all" on public.study_paths;
create policy "study_paths owner all" on public.study_paths
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "mind_maps owner all" on public.mind_maps;
create policy "mind_maps owner all" on public.mind_maps
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
