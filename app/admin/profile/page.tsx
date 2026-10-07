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

  const { data: profile } = await supabase.from('users').select('name, role, nrp, branch, avatar_url').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/profile');

  return (
    <div className="app-shell">
      <ProfileView
        name={profile?.name ?? ''}
        role="admin"
        nrp={profile?.nrp ?? null}
        branch={profile?.branch ?? null}
        avatarUrl={profile?.avatar_url ?? null}
        infoHref="/admin/profile/info"
        securityHref="/admin/profile/security"
      />
      <AdminBottomNav active="profile" />
    </div>
  );
}