import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import BottomNav from '@/components/layout/BottomNav';
import LogoutButton from '@/components/auth/LogoutButton';

export default async function ProfilePage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('users').select('name, email, role').eq('id', user.id).single();

  const { data: allBapp } = await supabase.from('bapp').select('id').eq('mekanik_id', user.id);

  return (
    <div className="flex min-h-screen flex-col pb-16">
      <div className="px-4 pt-6">
        <h1 className="text-lg font-medium">Akun</h1>
      </div>

      <div className="mx-4 mt-4 flex items-center gap-3 rounded-lg border p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-sm font-medium">
          {(profile?.name ?? 'U').slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium">{profile?.name}</p>
          <p className="text-xs text-gray-500">{profile?.email}</p>
          <span className="mt-1 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            Mekanik
          </span>
        </div>
      </div>

      <div className="mx-4 mt-4 rounded-lg border p-4">
        <p className="text-xs text-gray-500">Total BAPP dibuat</p>
        <p className="text-xl font-medium">{allBapp?.length ?? 0}</p>
      </div>

      <div className="mx-4 mt-6">
        <LogoutButton />
      </div>

      <BottomNav active="profile" />
    </div>
  );
}
