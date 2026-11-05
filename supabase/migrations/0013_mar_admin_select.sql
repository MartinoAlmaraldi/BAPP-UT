-- Admin boleh melihat semua MAR dan rinciannya (hanya baca), sama seperti BAPP
drop policy if exists "mar_select_admin" on public.mar;
drop policy if exists "mar_rows_select_admin" on public.mar_rows;

create policy "mar_select_admin"
on public.mar for select
using (public.is_admin(auth.uid()));

create policy "mar_rows_select_admin"
on public.mar_rows for select
using (public.is_admin(auth.uid()));