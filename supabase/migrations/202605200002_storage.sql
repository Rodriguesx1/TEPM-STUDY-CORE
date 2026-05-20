insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('study-documents', 'study-documents', false, 26214400, array['application/pdf'])
on conflict (id) do nothing;

create policy "storage owner read documents"
on storage.objects for select
using (
  bucket_id = 'study-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "storage owner upload documents"
on storage.objects for insert
with check (
  bucket_id = 'study-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "storage owner delete documents"
on storage.objects for delete
using (
  bucket_id = 'study-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);
