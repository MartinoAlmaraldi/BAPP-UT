-- ================================
-- FUNCTION: cek role admin TANPA memicu RLS tabel users lagi
-- ================================
create or replace function is_admin(uid uuid)
returns boolean as $$
  select exists (
    select 1 from public.users
    where id = uid and role = 'admin'
  );
$$ language sql security definer set search_path = public;

-- ================================
-- HAPUS POLICY LAMA YANG BERMASALAH
-- ================================
drop policy if exists "users_select_admin" on users;
drop policy if exists "bapp_select_admin" on bapp;
drop policy if exists "bapp_update_admin" on bapp;
drop policy if exists "jobdesc_select_admin" on bapp_job_desc;
drop policy if exists "config_update_admin" on config;

-- ================================
-- BUAT ULANG POLICY, PAKAI FUNCTION is_admin() BUKAN QUERY MANUAL
-- ================================
create policy "users_select_admin"
on users for select
using (is_admin(auth.uid()));

create policy "bapp_select_admin"
on bapp for select
using (is_admin(auth.uid()));

create policy "bapp_update_admin"
on bapp for update
using (is_admin(auth.uid()));

create policy "jobdesc_select_admin"
on bapp_job_desc for select
using (is_admin(auth.uid()));

create policy "config_update_admin"
on config for update
using (is_admin(auth.uid()));