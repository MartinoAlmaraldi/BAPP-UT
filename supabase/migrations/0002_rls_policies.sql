-- AKTIFKAN RLS DI SEMUA TABEL
alter table users enable row level security;
alter table bapp enable row level security;
alter table bapp_job_desc enable row level security;
alter table config enable row level security;

-- POLICY: users
create policy "users_select_own"
on users for select
using (auth.uid() = id);

create policy "users_select_admin"
on users for select
using (
  exists (
    select 1 from users u
    where u.id = auth.uid() and u.role = 'admin'
  )
);


-- POLICY: bapp
create policy "bapp_select_own"
on bapp for select
using (mekanik_id = auth.uid());

create policy "bapp_select_admin"
on bapp for select
using (
  exists (
    select 1 from users u
    where u.id = auth.uid() and u.role = 'admin'
  )
);

create policy "bapp_insert_own"
on bapp for insert
with check (mekanik_id = auth.uid());

create policy "bapp_update_own"
on bapp for update
using (mekanik_id = auth.uid());

create policy "bapp_update_admin"
on bapp for update
using (
  exists (
    select 1 from users u
    where u.id = auth.uid() and u.role = 'admin'
  )
);

-- POLICY: bapp_job_desc
create policy "jobdesc_select_own"
on bapp_job_desc for select
using (
  exists (
    select 1 from bapp b
    where b.id = bapp_job_desc.bapp_id and b.mekanik_id = auth.uid()
  )
);

create policy "jobdesc_select_admin"
on bapp_job_desc for select
using (
  exists (
    select 1 from users u
    where u.id = auth.uid() and u.role = 'admin'
  )
);

create policy "jobdesc_modify_own"
on bapp_job_desc for all
using (
  exists (
    select 1 from bapp b
    where b.id = bapp_job_desc.bapp_id and b.mekanik_id = auth.uid()
  )
);

-- POLICY: config
create policy "config_select_all"
on config for select
using (auth.uid() is not null);

create policy "config_update_admin"
on config for update
using (
  exists (select 1 from users u where u.id = auth.uid() and u.role = 'admin')
);