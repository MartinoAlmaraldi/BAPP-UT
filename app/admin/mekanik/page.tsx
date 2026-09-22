import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminBottomNav from '@/components/layout/AdminBottomNav';

export default async function AdminMekanikPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/dashboard');

  const { data: users } = await supabase.from('users').select('id, name, email, role').order('name');

  const { data: bappCounts } = await supabase.from('bapp').select('mekanik_id');
  const countMap = new Map<string, number>();
  (bappCounts ?? []).forEach((b) => {
    countMap.set(b.mekanik_id, (countMap.get(b.mekanik_id) ?? 0) + 1);
  });

  return (
    <div className="flex min-h-screen flex-col pb-16">
      <div className="px-4 pt-6">
        <h1 className="text-lg font-medium">Kelola Mekanik</h1>
      </div>

      <div className="flex flex-col gap-2 px-4 py-4">
        {users?.map((u) => {
          const roleBadgeClass =
            u.role === 'admin'
              ? 'rounded-full bg-purple-100 px-3 py-1.5 text-xs font-medium text-purple-700'
              : 'rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600';

          return (
            <div key={u.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{u.name}</p>
                <p className="text-xs text-gray-500">{u.email}</p>
                <p className="mt-0.5 text-xs text-gray-400">{countMap.get(u.id) ?? 0} BAPP dibuat</p>
              </div>
              <span className={roleBadgeClass}>{u.role === 'admin' ? 'Admin' : 'Mekanik'}</span>
            </div>
          );
        })}
        {users?.length === 0 && <p className="py-8 text-center text-sm text-gray-400">Belum ada user</p>}
      </div>

      <p className="px-4 text-xs text-gray-400">
        Untuk mengubah role, ubah kolom &quot;role&quot; di tabel users lewat Supabase Table Editor.
      </p>

      <AdminBottomNav active="mekanik" />
    </div>
  );
}
