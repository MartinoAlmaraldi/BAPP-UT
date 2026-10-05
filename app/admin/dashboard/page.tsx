import Image from 'next/image';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppHeader from '@/components/layout/AppHeader';
import BappCard from '@/components/bapp/BappCard';
import StatusBadge from '@/components/bapp/StatusBadge';
import AdminBottomNav from '@/components/layout/AdminBottomNav';
import '@/styles/pages/admin.css';

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
    <div className="app-shell">
      <AppHeader>
        <p className="admin-bar__label">Admin</p>
        <p className="admin-bar__title">Semua BAPP</p>
      </AppHeader>

      <main className="admin">
        <div className="admin__inner">
          <div className="admin__summary">
            <SummaryCard label="Selesai bulan ini" value={counts.completedThisMonth} />
            <SummaryCard label="Menunggu TTD" value={counts.signedMekanik} />
            <SummaryCard label="Mekanik aktif" value={counts.mekanikAktif} />
            <SummaryCard label="Total BAPP" value={counts.total} />
          </div>

          <p className="admin__section-title">Terbaru</p>

          {/* Mobile dan tablet: kartu */}
          <div className="admin__list admin__list--cards">
            {recentBapp?.map((bapp) => (
              <BappCard
                key={bapp.id}
                bapp={bapp}
                href={'/admin/bapp/' + bapp.id}
                by={mekanikMap.get(bapp.mekanik_id) ?? 'Mekanik'}
              />
            ))}
          </div>

          {/* Desktop: tabel */}
          {recentBapp && recentBapp.length > 0 && (
            <div className="admin-table">
              <div className="admin-table__head">
                <span>Unit</span>
                <span>Customer</span>
                <span>Mekanik</span>
                <span>Tanggal</span>
                <span className="admin-table__status">Status</span>
              </div>
              {recentBapp.map((bapp) => (
                <a key={bapp.id} href={'/admin/bapp/' + bapp.id} className="admin-table__row">
                  <span className="admin-table__unit">{bapp.unit_model ?? '(belum diisi)'}</span>
                  <span>{bapp.nama_customer ?? '(belum diisi)'}</span>
                  <span className="admin-table__muted">{mekanikMap.get(bapp.mekanik_id) ?? 'Mekanik'}</span>
                  <span className="admin-table__muted">
                    {new Date(bapp.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="admin-table__status">
                    <StatusBadge status={bapp.status} />
                  </span>
                </a>
              ))}
            </div>
          )}
          {recentBapp?.length === 0 && <p className="admin__empty">Belum ada BAPP dibuat</p>}
        </div>

        <div className="admin__footer">
          <Image src="/moving-as-one.png" alt="Moving as one" width={190} height={56} />
        </div>
      </main>

      <AdminBottomNav active="dashboard" />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-card">
      <p className="admin-card__label">{label}</p>
      <p className="admin-card__value">{value}</p>
    </div>
  );
}