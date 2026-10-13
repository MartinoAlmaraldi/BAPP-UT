import Image from 'next/image';
import AppHeader from '@/components/layout/AppHeader';
import BappCard from '@/components/bapp/BappCard';
import AdminBappTable, { type AdminBappRow } from '@/components/bapp/AdminBappTable';
import AdminBottomNav from '@/components/layout/AdminBottomNav';
import type { BappStatus } from '@/types/bapp';
import '@/styles/pages/history.css';
import '@/styles/pages/admin.css';
import '@/styles/pages/admin-history.css';

interface AdminHistoryViewProps {
  status?: BappStatus;
  q: string;
  rows: AdminBappRow[];
  /** true kalau hasil dipotong oleh batas jumlah baris */
  truncated: boolean;
}

const FILTERS: { label: string; value: BappStatus | undefined }[] = [
  { label: 'Semua', value: undefined },
  { label: 'Draft', value: 'draft' },
  { label: 'Sign mekanik', value: 'signed_mekanik' },
  { label: 'Selesai', value: 'completed' },
];

function buildHref(status: BappStatus | undefined, q: string): string {
  const search = new URLSearchParams();
  if (status) search.set('status', status);
  if (q) search.set('q', q);
  const qs = search.toString();
  return qs ? `/admin/history?${qs}` : '/admin/history';
}

export default function AdminHistoryView({ status, q, rows, truncated }: AdminHistoryViewProps) {
  return (
    <div className="app-shell">
      <AppHeader>
        <h1 className="history__title">History BAPP</h1>

        <form className="history__search" method="get" action="/admin/history">
          {status && <input type="hidden" name="status" value={status} />}
          <button type="submit" className="history__search-btn" aria-label="Cari">
            <SearchIcon />
          </button>
          <input
            className="history__search-input"
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Cari berdasarkan unit, vendor, atau mekanik"
            maxLength={100}
          />
        </form>
      </AppHeader>

      <main className="history">
        <div className="history__inner">
          <div className="history__filters">
            {FILTERS.map((f) => {
              const isActive = status === f.value;
              return (
                <a
                  key={f.label}
                  href={buildHref(f.value, q)}
                  className={isActive ? 'filter-pill filter-pill--active' : 'filter-pill'}
                >
                  {f.label}
                </a>
              );
            })}
          </div>

          {/* Mobile dan tablet: kartu */}
          <div className="admin__list admin__list--cards">
            {rows.map((row) => (
              <BappCard key={row.id} bapp={row} href={'/admin/bapp/' + row.id} by={row.mekanikName} />
            ))}
          </div>

          {/* Desktop: tabel */}
          <AdminBappTable rows={rows} />

          {rows.length === 0 && <p className="history__empty">Tidak ada BAPP ditemukan</p>}
          {truncated && <p className="history__note">Menampilkan 200 BAPP terbaru. Persempit dengan pencarian atau filter.</p>}
        </div>

        <div className="history__footer">
          <Image src="/moving-as-one.png" alt="Moving as one" width={250} height={89} />
        </div>
      </main>

      <AdminBottomNav active="history" />
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </svg>
  );
}