import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import BappCard from '@/components/bapp/BappCard';
import BottomNav from '@/components/layout/BottomNav';

export default async function DashboardPage() {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('name, role')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'admin') redirect('/admin/dashboard');

  const { data: allBapp } = await supabase
    .from('bapp')
    .select('id, status, created_at')
    .eq('mekanik_id', user.id);

  const counts = {
    draft: allBapp?.filter((b) => b.status === 'draft').length ?? 0,
    signedMekanik: allBapp?.filter((b) => b.status === 'signed_mekanik').length ?? 0,
    completedThisMonth:
      allBapp?.filter((b) => {
        const d = new Date(b.created_at);
        const now = new Date();
        return (
          b.status === 'completed' &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }).length ?? 0,
    total: allBapp?.length ?? 0,
  };

  const { data: recentBapp } = await supabase
    .from('bapp')
    .select('id, unit_model, nama_customer, status, created_at')
    .eq('mekanik_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="flex min-h-screen flex-col pb-16">
      <div className="px-4 pt-6">
        <p className="text-sm text-gray-500">Halo, {profile?.name}</p>
        <h1 className="text-lg font-medium">Dashboard BAPP</h1>
      </div>

      <div className="grid grid-cols-2 gap-2 px-4 py-4">
        <SummaryCard label="Draft" value={counts.draft} />
        <SummaryCard label="Menunggu TTD" value={counts.signedMekanik} />
        <SummaryCard label="Selesai bulan ini" value={counts.completedThisMonth} />
        <SummaryCard label="Total BAPP" value={counts.total} />
      </div>

      <div className="px-4">
        <a
          href="/bapp/new"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-black text-sm font-medium text-white"
        >
          Buat BAPP baru
        </a>
      </div>

      <div className="mt-6 flex items-center justify-between px-4">
        <p className="text-sm font-medium">Terbaru</p>
        <a href="/history" className="text-xs text-blue-600">
          Lihat semua
        </a>
      </div>

      <div className="flex flex-col gap-2 px-4 py-2">
        {recentBapp?.map((bapp) => (
          <BappCard key={bapp.id} bapp={bapp} />
        ))}
        {recentBapp?.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">Belum ada BAPP dibuat</p>
        )}
      </div>

      <BottomNav active="dashboard" />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="mb-1 text-xs text-gray-500">{label}</p>
      <p className="text-xl font-medium">{value}</p>
    </div>
  );
}
