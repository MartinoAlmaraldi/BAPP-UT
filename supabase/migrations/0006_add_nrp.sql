-- Tambah kolom NRP di tabel users
alter table users add column if not exists nrp text;

-- Update trigger supaya NRP dari form sign up ikut tersimpan
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email, role, nrp)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.email,
    'mekanik',
    new.raw_user_meta_data->>'nrp'
  );
  return new;
end;
$$ language plpgsql security definer;