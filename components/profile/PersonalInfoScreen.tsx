import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import SubPageHeader from './SubPageHeader';
import PersonalInfoForm from './PersonalInfoForm';
import '@/styles/pages/profile.css';

interface PersonalInfoScreenProps {
  expectRole: 'admin' | 'mekanik';
}

export default async function PersonalInfoScreen({ expectRole }: PersonalInfoScreenProps) {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('name, email, role, nrp, branch, avatar_url')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';
  if (expectRole === 'admin' && !isAdmin) redirect('/profile');
  if (expectRole === 'mekanik' && isAdmin) redirect('/admin/profile');

  return (
    <div className="app-shell">
      <SubPageHeader title="Informasi Pribadi" backHref={isAdmin ? '/admin/profile' : '/profile'} />

      <main className="psub">
        <div className="psub__inner">
          <PersonalInfoForm
            userId={user.id}
            initial={{
              name: profile?.name ?? '',
              email: user.email ?? profile?.email ?? '',
              nrp: profile?.nrp ?? '',
              branch: profile?.branch ?? '',
              avatarUrl: profile?.avatar_url ?? null,
            }}
          />
        </div>

        <div className="psub__footer">
          <Image src="/moving-as-one.png" alt="Moving as one" width={250} height={89} />
        </div>
      </main>
    </div>
  );
}