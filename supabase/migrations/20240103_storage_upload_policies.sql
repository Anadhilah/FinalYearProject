-- Allow signed-in users to upload and read files in the uploads bucket.
-- Keep storage RLS enabled; do not disable it globally.

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', false)
on conflict (id) do nothing;

drop policy if exists "Authenticated users upload files" on storage.objects;
create policy "Authenticated users upload files"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'uploads');

drop policy if exists "Authenticated users read uploads" on storage.objects;
create policy "Authenticated users read uploads"
on storage.objects
for select
to authenticated
using (bucket_id = 'uploads');
