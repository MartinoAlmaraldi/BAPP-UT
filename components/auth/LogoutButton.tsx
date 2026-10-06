'use client';

import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
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
      Log Out
    </button>
  );
}