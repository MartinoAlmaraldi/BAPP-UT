import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminBottomNav from '@/components/layout/AdminBottomNav';
import ProfileView from '@/components/profile/ProfileView';

export default async function AdminProfilePage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('users').select('name, email, role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/dashboard');

  const { count } = await supabase.from('bapp').select('*', { count: 'exact', head: true });

  return (
    <div className="app-shell">
      <ProfileView
        name={profile?.name ?? ''}
        email={profile?.email ?? ''}
        role="admin"
        statLabel="Total BAPP (semua mekanik)"
        statValue={count ?? 0}
      />
      <AdminBottomNav active="profile" />
    </div>
  );
}