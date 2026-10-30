-- MAR (Mechanic Activity Report)
-- Satu MAR = satu unit/WO dengan banyak rincian pekerjaan (maks. 46 baris).
-- Alurnya sama seperti BAPP: draft -> signed_mekanik -> completed.
-- PDF dibuat saat diminta dan tidak disimpan.

-- Hapus versi lama (kalau 0009 sebelumnya sudah sempat dijalankan)
drop function if exists public.create_mar(jsonb, jsonb);
drop table if exists public.mar_rows;
drop table if exists public.mar;

create table public.mar (
  id uuid primary key default gen_random_uuid(),
  mekanik_id uuid not null references public.users(id),
  status text not null default 'draft'
    check (status in ('draft', 'signed_mekanik', 'completed')),

  nama text,
  nrp text,
  tanggal date,
  nama_customer text,
  unit_model text,
  unit_serial_no text,
  wo_number text,
  no_operation text,
  smr text,

  signature_mekanik_url text,
  signed_mekanik_at timestamptz,
  nama_customer_ttd text,
  signature_customer_url text,
  signed_customer_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Rincian pekerjaan. Durasi tidak disimpan, dihitung dari start dan finish.
create table public.mar_rows (
  id uuid primary key default gen_random_uuid(),
  mar_id uuid not null references public.mar(id) on delete cascade,
  urutan integer not null check (urutan between 1 and 46),
  job_description text,
  start_time time,
  finish_time time,
  status_job text check (status_job in ('F', 'NF')),
  unique (mar_id, urutan)
);

create index idx_mar_mekanik_id on public.mar(mekanik_id);
create index idx_mar_rows_mar_id on public.mar_rows(mar_id);

create trigger trg_mar_updated_at
before update on public.mar
for each row
execute function public.set_updated_at();

-- Penjaga di database: urutan status, kunci data setelah TTD mekanik, dan syarat kolom wajib
create or replace function public.mar_guard_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    if not (
      (old.status = 'draft' and new.status = 'signed_mekanik')
      or (old.status = 'signed_mekanik' and new.status = 'completed')
    ) then
      raise exception 'Perubahan status MAR tidak valid';
    end if;
  end if;

  -- Setelah TTD mekanik, data MAR tidak boleh diubah
  if old.status <> 'draft' then
    if new.nama is distinct from old.nama
       or new.nrp is distinct from old.nrp
       or new.tanggal is distinct from old.tanggal
       or new.nama_customer is distinct from old.nama_customer
       or new.unit_model is distinct from old.unit_model
       or new.unit_serial_no is distinct from old.unit_serial_no
       or new.wo_number is distinct from old.wo_number
       or new.no_operation is distinct from old.no_operation
       or new.smr is distinct from old.smr then
      raise exception 'MAR sudah ditandatangani, data tidak bisa diubah';
    end if;
  end if;

  -- Syarat TTD mekanik: kolom wajib lengkap
  if old.status = 'draft' and new.status = 'signed_mekanik' then
    if coalesce(btrim(new.unit_model), '') = ''
       or coalesce(btrim(new.unit_serial_no), '') = ''
       or coalesce(btrim(new.smr), '') = '' then
      raise exception 'Model, serial no., dan SMR wajib diisi';
    end if;

    if not exists (select 1 from public.mar_rows r where r.mar_id = new.id) then
      raise exception 'Minimal 1 rincian pekerjaan';
    end if;

    if exists (
      select 1 from public.mar_rows r
      where r.mar_id = new.id
        and (
          coalesce(btrim(r.job_description), '') = ''
          or r.start_time is null
          or r.finish_time is null
          or r.status_job is null
        )
    ) then
      raise exception 'Ada rincian pekerjaan yang belum lengkap';
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_mar_guard
before update on public.mar
for each row
execute function public.mar_guard_update();

-- RLS: mekanik hanya mengakses MAR miliknya. Rincian hanya bisa diubah selama MAR masih draft.
alter table public.mar enable row level security;
alter table public.mar_rows enable row level security;

create policy "mar_select_own"
on public.mar for select
using (mekanik_id = auth.uid());

create policy "mar_insert_own"
on public.mar for insert
with check (mekanik_id = auth.uid() and status = 'draft');

create policy "mar_update_own"
on public.mar for update
using (mekanik_id = auth.uid())
with check (mekanik_id = auth.uid());

create policy "mar_rows_select_own"
on public.mar_rows for select
using (
  exists (
    select 1 from public.mar m
    where m.id = mar_rows.mar_id and m.mekanik_id = auth.uid()
  )
);

create policy "mar_rows_insert_own_draft"
on public.mar_rows for insert
with check (
  exists (
    select 1 from public.mar m
    where m.id = mar_rows.mar_id and m.mekanik_id = auth.uid() and m.status = 'draft'
  )
);

create policy "mar_rows_update_own_draft"
on public.mar_rows for update
using (
  exists (
    select 1 from public.mar m
    where m.id = mar_rows.mar_id and m.mekanik_id = auth.uid() and m.status = 'draft'
  )
)
with check (
  exists (
    select 1 from public.mar m
    where m.id = mar_rows.mar_id and m.mekanik_id = auth.uid() and m.status = 'draft'
  )
);

create policy "mar_rows_delete_own_draft"
on public.mar_rows for delete
using (
  exists (
    select 1 from public.mar m
    where m.id = mar_rows.mar_id and m.mekanik_id = auth.uid() and m.status = 'draft'
  )
);