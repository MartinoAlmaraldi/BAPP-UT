import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import BottomNav from '@/components/layout/BottomNav';
import ProfileView from '@/components/profile/ProfileView';

export default async function ProfilePage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('users').select('name, role, nrp, avatar_url').eq('id', user.id).single();
  if (profile?.role === 'admin') redirect('/admin/profile');

  return (
    <div className="app-shell">
      <ProfileView
        name={profile?.name ?? ''}
        role="mekanik"
        nrp={profile?.nrp ?? null}
        avatarUrl={profile?.avatar_url ?? null}
        infoHref="/profile/info"
        securityHref="/profile/security"
      />
      <BottomNav active="profile" />
    </div>
  );
}