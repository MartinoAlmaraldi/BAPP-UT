import Image from 'next/image';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppHeader from '@/components/layout/AppHeader';
import BappCard from '@/components/bapp/BappCard';
import StatusBadge from '@/components/bapp/StatusBadge';
import AdminBottomNav from '@/components/layout/AdminBottomNav';
import '@/styles/pages/admin.css';
import '@/styles/pages/admin-dashboard.css';

interface RecentDoc {
  id: string;
  kind: 'bapp' | 'mar';
  unit_model: string | null;
  nama_customer: string | null;
  status: string;
  created_at: string;
  mekanik_id: string;
}

export default async function AdminDashboardPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('users').select('name, role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/dashboard');

  const [{ data: allBapp }, { data: allMar }, { data: allMekanik }] = await Promise.all([
    supabase.from('bapp').select('id, status, created_at'),
    supabase.from('mar').select('id, status, created_at'),
    supabase.from('users').select('id').eq('role', 'mekanik'),
  ]);

  const now = new Date();
  const hitung = (rows: { status: string; created_at: string }[] | null) => ({
    selesaiBulanIni:
      rows?.filter((r) => {
        const d = new Date(r.created_at);
        return (
          (r.status === 'completed' || r.status === 'reviewed') &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }).length ?? 0,
    menunggu: rows?.filter((r) => r.status === 'signed_mekanik').length ?? 0,
    total: rows?.length ?? 0,
  });
  const bappCount = hitung(allBapp);
  const marCount = hitung(allMar);
  const mekanikAktif = allMekanik?.length ?? 0;

  // 10 dokumen terbaru gabungan BAPP dan MAR
  const kolom = 'id, unit_model, nama_customer, status, created_at, mekanik_id';
  const [{ data: recentBapp }, { data: recentMar }] = await Promise.all([
    supabase.from('bapp').select(kolom).order('created_at', { ascending: false }).limit(10),
    supabase.from('mar').select(kolom).order('created_at', { ascending: false }).limit(10),
  ]);

  const recent: RecentDoc[] = [
    ...(recentBapp ?? []).map((d) => ({ ...d, kind: 'bapp' as const })),
    ...(recentMar ?? []).map((d) => ({ ...d, kind: 'mar' as const })),
  ]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 10);

  const mekanikIds = Array.from(new Set(recent.map((d) => d.mekanik_id)));
  const { data: mekanikList } = mekanikIds.length
    ? await supabase.from('users').select('id, name').in('id', mekanikIds)
    : { data: [] as { id: string; name: string }[] };
  const mekanikMap = new Map((mekanikList ?? []).map((m) => [m.id, m.name]));

  const detailHref = (d: RecentDoc) => (d.kind === 'mar' ? '/admin/mar/' : '/admin/bapp/') + d.id;
  const rincian = (bapp: number, mar: number) => 'BAPP ' + bapp + ' \u2022 MAR ' + mar;

  return (
    <div className="app-shell">
      <AppHeader>
        <p className="admin-bar__label">Admin</p>
        <p className="admin-bar__title">Semua BAPP &amp; MAR</p>
      </AppHeader>

      <main className="admin">
        <div className="admin__inner">
          <div className="admin__summary">
            <SummaryCard
              label="Selesai bulan ini"
              value={bappCount.selesaiBulanIni + marCount.selesaiBulanIni}
              split={rincian(bappCount.selesaiBulanIni, marCount.selesaiBulanIni)}
            />
            <SummaryCard
              label="Menunggu TTD"
              value={bappCount.menunggu + marCount.menunggu}
              split={rincian(bappCount.menunggu, marCount.menunggu)}
            />
            <SummaryCard label="Mekanik aktif" value={mekanikAktif} />
            <SummaryCard
              label="Total dokumen"
              value={bappCount.total + marCount.total}
              split={rincian(bappCount.total, marCount.total)}
            />
          </div>

          <div className="admin__section-head">
            <p className="admin__section-title">Terbaru</p>
            <a href="/admin/history" className="admin__section-link">
              Lihat semua
            </a>
          </div>

          {/* Mobile dan tablet: kartu */}
          <div className="admin__list admin__list--cards">
            {recent.map((doc) => (
              <BappCard
                key={doc.kind + doc.id}
                bapp={doc}
                kind={doc.kind}
                showKind
                href={detailHref(doc)}
                by={mekanikMap.get(doc.mekanik_id) ?? 'Mekanik'}
              />
            ))}
          </div>

          {/* Desktop: tabel */}
          {recent.length > 0 && (
            <div className="admin-table admin-table--jenis">
              <div className="admin-table__head">
                <span>Jenis</span>
                <span>Unit</span>
                <span>Customer</span>
                <span>Mekanik</span>
                <span>Tanggal</span>
                <span className="admin-table__status">Status</span>
              </div>
              {recent.map((doc) => (
                <a key={doc.kind + doc.id} href={detailHref(doc)} className="admin-table__row">
                  <span>
                    <span className={'doc-tag doc-tag--' + doc.kind}>{doc.kind === 'mar' ? 'MAR' : 'BAPP'}</span>
                  </span>
                  <span className="admin-table__unit">{doc.unit_model ?? '(belum diisi)'}</span>
                  <span>{doc.nama_customer ?? '(belum diisi)'}</span>
                  <span className="admin-table__muted">{mekanikMap.get(doc.mekanik_id) ?? 'Mekanik'}</span>
                  <span className="admin-table__muted">
                    {new Date(doc.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="admin-table__status">
                    <StatusBadge status={doc.status} />
                  </span>
                </a>
              ))}
            </div>
          )}
          {recent.length === 0 && <p className="admin__empty">Belum ada BAPP atau MAR dibuat</p>}
        </div>

        <div className="admin__footer">
          <Image src="/moving-as-one.png" alt="Moving as one" width={190} height={56} />
        </div>
      </main>

      <AdminBottomNav active="dashboard" />
    </div>
  );
}

function SummaryCard({ label, value, split }: { label: string; value: number; split?: string }) {
  return (
    <div className="admin-card">
      <p className="admin-card__label">{label}</p>
      <p className="admin-card__value">{value}</p>
      {split && <p className="admin-card__split">{split}</p>}
    </div>
  );
}