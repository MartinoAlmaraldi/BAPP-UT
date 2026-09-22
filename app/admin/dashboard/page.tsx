import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import StatusBadge from '@/components/bapp/StatusBadge';
import AdminBottomNav from '@/components/layout/AdminBottomNav';

export default async function AdminDashboardPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('users').select('name, role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/dashboard');

  const { data: allBapp } = await supabase.from('bapp').select('id, status, created_at, mekanik_id');

  const { data: allMekanik } = await supabase.from('users').select('id').eq('role', 'mekanik');

  const now = new Date();
  const counts = {
    completedThisMonth:
      allBapp?.filter((b) => {
        const d = new Date(b.created_at);
        return b.status === 'completed' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length ?? 0,
    signedMekanik: allBapp?.filter((b) => b.status === 'signed_mekanik').length ?? 0,
    mekanikAktif: allMekanik?.length ?? 0,
    total: allBapp?.length ?? 0,
  };

  const { data: recentBapp } = await supabase
    .from('bapp')
    .select('id, unit_model, nama_customer, status, created_at, mekanik_id')
    .order('created_at', { ascending: false })
    .limit(10);

  const mekanikIds = Array.from(new Set((recentBapp ?? []).map((b) => b.mekanik_id)));
  const { data: mekanikList } = mekanikIds.length
    ? await supabase.from('users').select('id, name').in('id', mekanikIds)
    : { data: [] as { id: string; name: string }[] };
  const mekanikMap = new Map((mekanikList ?? []).map((m) => [m.id, m.name]));

  return (
    <div className="flex min-h-screen flex-col pb-16">
      <div className="px-4 pt-6">
        <p className="text-sm text-gray-500">Admin</p>
        <h1 className="text-lg font-medium">Semua BAPP</h1>
      </div>

      <div className="grid grid-cols-2 gap-2 px-4 py-4">
        <SummaryCard label="Selesai bulan ini" value={counts.completedThisMonth} />
        <SummaryCard label="Menunggu TTD" value={counts.signedMekanik} />
        <SummaryCard label="Mekanik aktif" value={counts.mekanikAktif} />
        <SummaryCard label="Total BAPP" value={counts.total} />
      </div>

      <div className="mt-2 flex items-center justify-between px-4">
        <p className="text-sm font-medium">Terbaru</p>
      </div>

      <div className="flex flex-col gap-2 px-4 py-2">
        {recentBapp?.map((bapp) => (
          <a
            key={bapp.id}
            href={'/admin/bapp/' + bapp.id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div>
              <p className="text-sm font-medium">
                {bapp.unit_model ?? '(belum diisi)'} &middot; {bapp.nama_customer ?? '(belum diisi)'}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {mekanikMap.get(bapp.mekanik_id) ?? 'Mekanik'} &middot;{' '}
                {new Date(bapp.created_at).toLocaleDateString('id-ID')}
              </p>
            </div>
            <StatusBadge status={bapp.status} />
          </a>
        ))}
        {recentBapp?.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">Belum ada BAPP dibuat</p>
        )}
      </div>

      <AdminBottomNav active="dashboard" />
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
