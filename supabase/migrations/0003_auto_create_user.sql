-- FUNCTION: auto-create baris di tabel users saat ada sign up baru
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.email,
    'mekanik'
  );
  return new;
end;
$$ language plpgsql security definer;

-- TRIGGER: dipasang di tabel auth.users bawaan Supabase
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function handle_new_user();