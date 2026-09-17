-- POLICY: bucket "signatures" (private)
create policy "signatures_select_own"
on storage.objects for select
using (
  bucket_id = 'signatures'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1 from users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  )
);

create policy "signatures_insert_own"
on storage.objects for insert
with check (
  bucket_id = 'signatures'
  and (storage.foldername(name))[1] = auth.uid()::text
);


-- POLICY: bucket "pdf-hasil" (private)
create policy "pdf_select_own"
on storage.objects for select
using (
  bucket_id = 'pdf-hasil'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1 from users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  )
);

create policy "pdf_insert_own"
on storage.objects for insert
with check (
  bucket_id = 'pdf-hasil'
  and (storage.foldername(name))[1] = auth.uid()::text
);
