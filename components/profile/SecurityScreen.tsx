import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import SubPageHeader from './SubPageHeader';
import PasswordForm from './PasswordForm';
import '@/styles/pages/profile.css';

interface SecurityScreenProps {
  expectRole: 'admin' | 'mekanik';
}

export default async function SecurityScreen({ expectRole }: SecurityScreenProps) {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('users').select('email, role').eq('id', user.id).single();

  const isAdmin = profile?.role === 'admin';
  if (expectRole === 'admin' && !isAdmin) redirect('/profile');
  if (expectRole === 'mekanik' && isAdmin) redirect('/admin/profile');

  return (
    <div className="app-shell">
      <SubPageHeader title="Kata sandi dan keamanan" backHref={isAdmin ? '/admin/profile' : '/profile'} />

      <main className="psub">
        <div className="psub__inner">
          <PasswordForm email={user.email ?? profile?.email ?? ''} />
        </div>

        <div className="psub__footer">
          <Image src="/moving-as-one.png" alt="Moving as one" width={250} height={89} />
        </div>
      </main>
    </div>
  );
}