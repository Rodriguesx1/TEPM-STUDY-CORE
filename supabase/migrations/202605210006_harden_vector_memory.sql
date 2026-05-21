create unique index if not exists document_chunks_document_idx_unique
  on public.document_chunks(document_id, chunk_index);

create index if not exists document_chunks_user_created_idx
  on public.document_chunks(user_id, created_at desc);

create index if not exists document_chunks_embedding_hnsw_idx
  on public.document_chunks using hnsw (embedding vector_cosine_ops);

create or replace function public.match_document_chunks(
  query_embedding vector(768),
  match_user_id uuid,
  match_count integer default 8,
  min_similarity double precision default 0.25
)
returns table (
  id uuid,
  document_id uuid,
  document_title text,
  document_theme text,
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
    d.title as document_title,
    d.theme as document_theme,
    dc.user_id,
    dc.chunk_index,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  join public.documents d on d.id = dc.document_id
  where dc.user_id = match_user_id
    and d.user_id = match_user_id
    and dc.embedding is not null
    and 1 - (dc.embedding <=> query_embedding) >= min_similarity
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;

grant execute on function public.match_document_chunks(vector, uuid, integer, double precision) to authenticated;

drop policy if exists "ai_messages owner all" on public.ai_messages;
create policy "ai_messages owner all" on public.ai_messages
  for all using (
    (
      user_id = auth.uid()
      and exists (
        select 1 from public.ai_chats c
        where c.id = ai_messages.chat_id
          and c.user_id = auth.uid()
      )
    )
    or public.is_admin()
  )
  with check (
    (
      user_id = auth.uid()
      and exists (
        select 1 from public.ai_chats c
        where c.id = ai_messages.chat_id
          and c.user_id = auth.uid()
      )
    )
    or public.is_admin()
  );
