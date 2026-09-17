-- TABEL: users (profil tambahan, terhubung ke Supabase Auth)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('mekanik', 'admin')),
  created_at timestamptz not null default now()
);

-- TABEL: bapp (tabel utama)
create table bapp (
  id uuid primary key default gen_random_uuid(),
  nomor_form text not null default 'F-01/BAPP/NFMC/Rev-2/XI/2013/SVD',

  tanggal_penyerahan date,
  nama_customer text,

  unit_model text,
  unit_serial_no text,
  unit_code text,
  unit_location text,

  engine_model text,
  engine_serial_no text,

  smr text,

  kondisi_unit text check (kondisi_unit in ('baik', 'tidak_baik')),
  kesiapan_unit text check (kesiapan_unit in ('siap', 'tidak_siap')),

  hasil_pekerjaan text check (hasil_pekerjaan in ('memuaskan', 'tidak_memuaskan')),
  status_pekerjaan text check (status_pekerjaan in ('selesai', 'tidak_selesai')),

  catatan_mekanik text,
  catatan_customer text,

  status text not null default 'draft'
    check (status in ('draft', 'signed_mekanik', 'completed', 'reviewed')),

  mekanik_id uuid references users(id),

  nama_customer_ttd text,
  signature_mekanik_url text,
  signature_customer_url text,
  signed_mekanik_at timestamptz,
  signed_customer_at timestamptz,

  pdf_url text,
  is_synced boolean not null default true,

  cust_request_at timestamptz,
  mech_sent_at timestamptz,
  start_diagnose_at timestamptz,
  start_waiting_at timestamptz,
  start_job_at timestamptz,
  finish_job_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- TABEL: bapp_job_desc (tabel anak - baris pekerjaan, maks 10 per BAPP divalidasi di aplikasi)
create table bapp_job_desc (
  id uuid primary key default gen_random_uuid(),
  bapp_id uuid not null references bapp(id) on delete cascade,
  urutan integer not null,
  component text,
  job_desc text,
  remarks text
);


-- TABEL: config (nilai yang bisa diubah tanpa redeploy — nomor form, logo, dll)
create table config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- INDEX (untuk query yang sering dipakai)
create index idx_bapp_mekanik_id on bapp(mekanik_id);
create index idx_bapp_status on bapp(status);
create index idx_bapp_job_desc_bapp_id on bapp_job_desc(bapp_id);

-- TRIGGER: auto-update updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_bapp_updated_at
before update on bapp
for each row
execute function set_updated_at();

-- DATA AWAL: config
insert into config (key, value) values
  ('nomor_form', 'F-01/BAPP/NFMC/Rev-2/XI/2013/SVD');
-- 'logo_url' ditambahkan manual setelah logo diupload ke Storage bucket "assets"