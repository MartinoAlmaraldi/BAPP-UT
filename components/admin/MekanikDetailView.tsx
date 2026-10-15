import Image from 'next/image';
import SubPageHeader from '@/components/profile/SubPageHeader';
import BappCard from '@/components/bapp/BappCard';
import AdminBottomNav from '@/components/layout/AdminBottomNav';
import { UserIcon } from '@/components/auth/AuthIcons';
import { formatDuration, formatRelative, STUCK_DAYS, type MekanikStats } from '@/lib/mekanikStats';
import '@/styles/pages/admin.css';
import '@/styles/pages/admin-mekanik.css';

export interface DetailBapp {
  id: string;
  unit_model: string | null;
  nama_customer: string | null;
  status: string;
  created_at: string;
}

interface MekanikDetailViewProps {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'mekanik';
  nrp: string | null;
  branch: string | null;
  avatarUrl: string | null;
  stats: MekanikStats;
  recent: DetailBapp[];
}

export default function MekanikDetailView({
  id,
  name,
  email,
  role,
  nrp,
  branch,
  avatarUrl,
  stats,
  recent,
}: MekanikDetailViewProps) {
  return (
    <div className="app-shell">
      <SubPageHeader title="Detail mekanik" backHref="/admin/mekanik" />

      <main className="mk-page">
        <div className="mk-inner mk-inner--narrow">
          <section className="mkd-card">
            <span className="mk-avatar">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" />
              ) : (
                <UserIcon size={40} />
              )}
            </span>
            <div>
              <p className="mkd-name">{name || '-'}</p>
              <span className={role === 'admin' ? 'mkd-role mkd-role--admin' : 'mkd-role'}>
                {role === 'admin' ? 'Admin' : 'Mekanik'}
              </span>
            </div>
          </section>

          <div className="admin__summary" style={{ marginTop: 16 }}>
            <Tile label="Draft" value={stats.draft} />
            <Tile label="Menunggu TTD" value={stats.menunggu} />
            <Tile label="Selesai bulan ini" value={stats.selesaiBulanIni} />
            <Tile label="Total BAPP" value={stats.total} />
          </div>

          <section className="mkd-info">
            <InfoRow label="NRP" value={nrp ?? '-'} />
            <InfoRow label="Cabang" value={branch ?? '-'} />
            <InfoRow label="Email" value={email || '-'} />
            <InfoRow label="Rata-rata waktu selesai" value={formatDuration(stats.avgDoneHours)} />
            <InfoRow label="Aktivitas terakhir" value={formatRelative(stats.lastActivity)} />
            <InfoRow
              label={`Menggantung (> ${STUCK_DAYS} hari)`}
              value={stats.menggantung > 0 ? `${stats.menggantung} BAPP` : 'Tidak ada'}
              danger={stats.menggantung > 0}
            />
          </section>

          <p className="mkd-title">BAPP terbaru</p>
          <div className="mkd-list">
            {recent.map((bapp) => (
              <BappCard key={bapp.id} bapp={bapp} href={'/admin/bapp/' + bapp.id} />
            ))}
            {recent.length === 0 && <p className="mk-empty">Belum ada BAPP dibuat</p>}
          </div>

          {stats.total > 0 && (
            <a href={'/admin/history?mekanik=' + id} className="mkd-btn">
              Lihat semua BAPP ({stats.total})
            </a>
          )}
        </div>

        <div className="mkd-footer">
          <Image src="/moving-as-one.png" alt="Moving as one" width={250} height={89} />
        </div>
      </main>

      <AdminBottomNav active="mekanik" />
    </div>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-card">
      <p className="admin-card__label">{label}</p>
      <p className="admin-card__value">{value}</p>
    </div>
  );
}

function InfoRow({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="mkd-info__row">
      <span className="mkd-info__label">{label}</span>
      <span className="mkd-info__value" style={danger ? { color: '#c0121f', fontWeight: 600 } : undefined}>
        {value}
      </span>
    </div>
  );
}