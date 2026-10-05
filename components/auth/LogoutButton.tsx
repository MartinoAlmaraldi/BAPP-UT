'use client';

import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { LogoutIcon } from '@/components/layout/NavIcons';
import '@/styles/pages/profile.css';

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createBrowserClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button type="button" onClick={handleLogout} className="logout-btn">
      <LogoutIcon size={22} />
      Log out
    </button>
  );
}