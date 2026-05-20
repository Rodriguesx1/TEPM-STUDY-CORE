grant usage on schema public to anon, authenticated;

grant select on public.plans to anon, authenticated;

grant select, update on public.users_profiles to authenticated;
grant select on public.licenses to authenticated;
grant select, insert, update, delete on public.documents to authenticated;
grant select, insert, update, delete on public.document_chunks to authenticated;
grant select, insert, update, delete on public.embeddings to authenticated;
grant select, insert, update, delete on public.videos to authenticated;
grant select, insert, update, delete on public.video_transcripts to authenticated;
grant select, insert, update, delete on public.notes to authenticated;
grant select, insert, update, delete on public.study_paths to authenticated;
grant select, insert, update, delete on public.mind_maps to authenticated;
grant select, insert, update, delete on public.slide_projects to authenticated;
grant select, insert, update, delete on public.chat_rooms to authenticated;
grant select, insert, update, delete on public.room_members to authenticated;
grant select, insert on public.chat_messages to authenticated;
grant select, insert on public.audit_logs to authenticated;

grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
