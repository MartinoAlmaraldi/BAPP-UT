import Image from 'next/image';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppHeader from '@/components/layout/AppHeader';
import BappCard from '@/components/bapp/BappCard';
import BottomNav from '@/components/layout/BottomNav';
import DocTypeToggle, { parseDocType } from '@/components/layout/DocTypeToggle';
import { UserIcon } from '@/components/auth/AuthIcons';
import '@/styles/pages/dashboard.css';

interface DashboardPageProps {
  searchParams: Promise<{ type?: string | string[] }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const type = parseDocType((await searchParams).type);
  const table = type === 'mar' ? 'mar' : 'bapp';
  const label = type === 'mar' ? 'MAR' : 'BAPP';
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('name, role, avatar_url')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'admin') redirect('/admin/dashboard');

  const { data: allBapp } = await supabase
    .from(table)
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
    .from(table)
    .select('id, unit_model, nama_customer, status, created_at')
    .eq('mekanik_id', user.id)
    .order('created_at', { ascending: false })
    .limit(6);

  return (
    <div className="app-shell">
      <AppHeader>
        <div className="greeting">
          <div>
            <p className="greeting__hello">Selamat datang,</p>
            <p className="greeting__name">{profile?.name ?? 'Nama karyawan'}</p>
          </div>
          <a href="/profile" className="greeting__avatar" aria-label="Profil">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" />
            ) : (
              <UserIcon />
            )}
          </a>
        </div>
      </AppHeader>

      <main className="dashboard">
        <div className="dashboard__inner">
          <div className="dashboard__summary">
            <SummaryCard label="Draft" value={counts.draft} />
            <SummaryCard label="Menunggu TTD" value={counts.signedMekanik} />
            <SummaryCard label="Selesai bulan ini" value={counts.completedThisMonth} />
            <SummaryCard label={`Total ${label}`} value={counts.total} />
          </div>

          <a href="/bapp/new" className="btn btn-primary dashboard__create">
            <PlusIcon />
            Buat BAPP baru
          </a>

          <a href="/mar/new" className="btn btn-primary dashboard__create">
            <PlusIcon />
            Buat MAR baru
          </a>

          <DocTypeToggle active={type} hrefFor={(t) => (t === 'mar' ? '/dashboard?type=mar' : '/dashboard')} />

          <div className="dashboard__recent-head">
            <p className="dashboard__recent-title">Terbaru</p>
            <a href={type === 'mar' ? '/history?type=mar' : '/history'} className="dashboard__recent-link">
              Lihat semua
            </a>
          </div>

          <div className="dashboard__list">
            {recentBapp?.map((bapp) => (
              <BappCard key={bapp.id} bapp={bapp} kind={type} />
            ))}
          </div>
          {recentBapp?.length === 0 && <p className="dashboard__empty">Belum ada {label} dibuat</p>}
        </div>

        <div className="dashboard__footer">
          <Image src="/moving-as-one.png" alt="Moving as one" width={190} height={56} />
        </div>
      </main>

      <BottomNav active="dashboard" />
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="summary-card">
      <p className="summary-card__label">{label}</p>
      <p className="summary-card__value">{value}</p>
    </div>
  );
}