-- 1. Kolom baru di tabel users: wilayah cabang/site dan foto profil
alter table public.users add column if not exists branch text;
alter table public.users add column if not exists avatar_url text;

-- 2. User boleh mengubah profilnya sendiri, tapi HANYA kolom yang aman.
--    Kolom role, email, dan id tidak bisa diubah dari aplikasi (mencegah user menjadikan dirinya admin).
revoke update on table public.users from authenticated;
grant update (name, nrp, branch, avatar_url) on table public.users to authenticated;

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
on public.users for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- 3. Saat email di Supabase Auth berubah (setelah user mengonfirmasi), salin ke tabel users
create or replace function public.handle_user_email_change()
returns trigger as $$
begin
  update public.users set email = new.email where id = new.id;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute function public.handle_user_email_change();

-- 4. Bucket foto profil (public supaya URL bisa langsung dipakai di <img>)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_select_all" on storage.objects;
create policy "avatars_select_all"
on storage.objects for select
using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
on storage.objects for delete
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);