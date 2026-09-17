import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import BappCard from '@/components/bapp/BappCard';
import BottomNav from '@/components/layout/BottomNav';
import type { BappStatus } from '@/types/bapp';

interface HistoryPageProps {
  searchParams: Promise<{ status?: BappStatus; q?: string }>;
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const params = await searchParams;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let query = supabase
    .from('bapp')
    .select('id, unit_model, nama_customer, status, created_at')
    .eq('mekanik_id', user.id)
    .order('created_at', { ascending: false });

  if (params.status) {
    query = query.eq('status', params.status);
  }
  if (params.q) {
    query = query.or('unit_model.ilike.%' + params.q + '%,nama_customer.ilike.%' + params.q + '%');
  }

  const { data: bappList } = await query;

  const filters: { label: string; value: BappStatus | undefined }[] = [
    { label: 'Semua', value: undefined },
    { label: 'Draft', value: 'draft' },
    { label: 'Sign mekanik', value: 'signed_mekanik' },
    { label: 'Selesai', value: 'completed' },
  ];

  return (
    <div className="flex min-h-screen flex-col pb-16">
      <div className="px-4 pt-6">
        <h1 className="text-lg font-medium">History BAPP</h1>
      </div>

      <form className="px-4 py-3" method="get">
        <input
          type="text"
          name="q"
          defaultValue={params.q}
          placeholder="Cari unit atau customer"
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
      </form>

      <div className="flex gap-2 overflow-x-auto px-4 pb-3">
        {filters.map((f) => {
          const isActive = params.status === f.value;
          const href = f.value ? '/history?status=' + f.value : '/history';
          const filterClass = isActive
            ? 'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium bg-black text-white'
            : 'whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium text-gray-600';

          return (
            <a key={f.label} href={href} className={filterClass}>
              {f.label}
            </a>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 px-4 py-2">
        {bappList?.map((bapp) => (
          <BappCard key={bapp.id} bapp={bapp} />
        ))}
        {bappList?.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">Tidak ada BAPP ditemukan</p>
        )}
      </div>

      <BottomNav active="history" />
    </div>
  );
}
