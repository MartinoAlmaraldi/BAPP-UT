import Image from 'next/image';
import AppHeader from '@/components/layout/AppHeader';
import AdminBottomNav from '@/components/layout/AdminBottomNav';
import { UserIcon } from '@/components/auth/AuthIcons';
import { formatRelative, STUCK_DAYS, type MekanikStats } from '@/lib/mekanikStats';
import '@/styles/pages/history.css';
import '@/styles/pages/admin-mekanik.css';

export type RoleFilter = 'mekanik' | 'admin' | 'semua';
export type SortKey = 'nama' | 'draft' | 'menunggu' | 'selesai' | 'total' | 'aktivitas';
export type SortDir = 'asc' | 'desc';

export interface BoardRow {
  id: string;
  name: string;
  role: 'admin' | 'mekanik';
  nrp: string | null;
  branch: string | null;
  avatarUrl: string | null;
  stats: MekanikStats;
}

interface MekanikBoardViewProps {
  rows: BoardRow[];
  q: string;
  branch: string;
  role: RoleFilter;
  sort: SortKey;
  dir: SortDir;
  branches: string[];
}

export const SORT_LABELS: Record<SortKey, string> = {
  nama: 'Nama (A-Z)',
  draft: 'Draft terbanyak',
  menunggu: 'TTD terbanyak',
  selesai: 'Selesai terbanyak',
  total: 'Total terbanyak',
  aktivitas: 'Aktivitas terbaru',
};

const ROLE_PILLS: { label: string; value: RoleFilter }[] = [
  { label: 'Mekanik', value: 'mekanik' },
  { label: 'Admin', value: 'admin' },
  { label: 'Semua', value: 'semua' },
];

function href(params: { q?: string; branch?: string; role?: RoleFilter; sort?: SortKey; dir?: SortDir }): string {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.branch) search.set('branch', params.branch);
  if (params.role && params.role !== 'mekanik') search.set('role', params.role);
  if (params.sort && params.sort !== 'nama') search.set('sort', params.sort);
  if (params.dir && params.dir !== 'asc') search.set('dir', params.dir);
  const qs = search.toString();
  return qs ? `/admin/mekanik?${qs}` : '/admin/mekanik';
}

export default function MekanikBoardView({ rows, q, branch, role, sort, dir, branches }: MekanikBoardViewProps) {
  // Klik judul kolom: urutan pertama menurun (terbanyak dulu), klik lagi membalik
  function sortHref(key: SortKey): string {
    const nextDir: SortDir = sort === key ? (dir === 'asc' ? 'desc' : 'asc') : key === 'nama' ? 'asc' : 'desc';
    return href({ q, branch, role, sort: key, dir: nextDir });
  }

  function arrow(key: SortKey): string {
    if (sort !== key) return '';
    return dir === 'asc' ? ' \u25B2' : ' \u25BC';
  }

  return (
    <div className="app-shell">
      <AppHeader>
        <h1 className="history__title">Kelola Mekanik</h1>

        <form className="history__search" method="get" action="/admin/mekanik">
          {branch && <input type="hidden" name="branch" value={branch} />}
          {role !== 'mekanik' && <input type="hidden" name="role" value={role} />}
          {sort !== 'nama' && <input type="hidden" name="sort" value={sort} />}
          {dir !== 'asc' && <input type="hidden" name="dir" value={dir} />}
          <button type="submit" className="history__search-btn" aria-label="Cari">
            <SearchIcon />
          </button>
          <input
            className="history__search-input"
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Cari berdasarkan nama, NRP, atau email"
            maxLength={100}
          />
        </form>
      </AppHeader>

      <main className="mk-page">
        <div className="mk-inner">
          <div className="history__filters">
            {ROLE_PILLS.map((p) => (
              <a
                key={p.value}
                href={href({ q, branch, role: p.value, sort, dir })}
                className={role === p.value ? 'filter-pill filter-pill--active' : 'filter-pill'}
              >
                {p.label}
              </a>
            ))}
          </div>

          <form className="mk-toolbar" method="get" action="/admin/mekanik">
            {q && <input type="hidden" name="q" value={q} />}
            {role !== 'mekanik' && <input type="hidden" name="role" value={role} />}
            <select className="mk-select" name="branch" defaultValue={branch} aria-label="Filter cabang">
              <option value="">Semua cabang</option>
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <select className="mk-select" name="sort" defaultValue={sort} aria-label="Urutkan">
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABELS[key]}
                </option>
              ))}
            </select>
            <button type="submit" className="mk-apply">
              Terapkan
            </button>
          </form>

          <p className="mk-count">
            {rows.length} {role === 'admin' ? 'admin' : role === 'semua' ? 'pengguna' : 'mekanik'}
            {' \u2022 '}
            Menggantung = draft atau menunggu TTD tanpa perubahan lebih dari {STUCK_DAYS} hari
          </p>

          {/* Mobile dan tablet: kartu */}
          <div className="mk-cards">
            {rows.map((row) => (
              <div key={row.id} className="mk-card">
                <div className="mk-card__top">
                  <Avatar url={row.avatarUrl} />
                  <div className="mk-card__who">
                    <a href={'/admin/mekanik/' + row.id} className="mk-link">
                      {row.name || '-'}
                    </a>
                    <p className="mk-meta">
                      {row.nrp ?? '-'} &bull; {row.branch ?? 'Cabang belum diisi'}
                    </p>
                  </div>
                  {row.stats.menggantung > 0 && <span className="mk-flag">{row.stats.menggantung} menggantung</span>}
                </div>

                <div className="mk-card__stats">
                  <Stat label="Draft" value={row.stats.draft} />
                  <Stat label="Menunggu TTD" value={row.stats.menunggu} />
                  <Stat label="Selesai bln ini" value={row.stats.selesaiBulanIni} />
                  <Stat label="Total" value={row.stats.total} />
                </div>

                <div className="mk-card__foot">
                  <span>Aktivitas: {formatRelative(row.stats.lastActivity)}</span>
                  <a href={'/admin/history?mekanik=' + row.id} className="mk-action">
                    Lihat BAPP
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: tabel */}
          {rows.length > 0 && (
            <div className="mk-table">
              <div className="mk-thead">
                <a href={sortHref('nama')}>Mekanik{arrow('nama')}</a>
                <span>Cabang</span>
                <a href={sortHref('draft')} className="mk-num">
                  Draft{arrow('draft')}
                </a>
                <a href={sortHref('menunggu')} className="mk-num">
                  Menunggu TTD{arrow('menunggu')}
                </a>
                <a href={sortHref('selesai')} className="mk-num">
                  Selesai bln ini{arrow('selesai')}
                </a>
                <a href={sortHref('total')} className="mk-num">
                  Total{arrow('total')}
                </a>
                <a href={sortHref('aktivitas')}>Aktivitas terakhir{arrow('aktivitas')}</a>
                <span />
              </div>

              {rows.map((row) => (
                <div key={row.id} className="mk-row">
                  <div className="mk-who">
                    <Avatar url={row.avatarUrl} />
                    <div style={{ minWidth: 0 }}>
                      <a href={'/admin/mekanik/' + row.id} className="mk-link">
                        {row.name || '-'}
                      </a>
                      <p className="mk-meta">
                        {row.nrp ?? '-'}
                        {row.stats.menggantung > 0 && (
                          <>
                            {' \u2022 '}
                            <span style={{ color: '#c0121f', fontWeight: 600 }}>{row.stats.menggantung} menggantung</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="mk-muted">{row.branch ?? '-'}</span>
                  <span className="mk-num">{row.stats.draft}</span>
                  <span className="mk-num">{row.stats.menunggu}</span>
                  <span className="mk-num">{row.stats.selesaiBulanIni}</span>
                  <span className="mk-num">
                    <strong>{row.stats.total}</strong>
                  </span>
                  <span className="mk-muted">{formatRelative(row.stats.lastActivity)}</span>
                  <a href={'/admin/history?mekanik=' + row.id} className="mk-action">
                    Lihat BAPP
                  </a>
                </div>
              ))}
            </div>
          )}

          {rows.length === 0 && <p className="mk-empty">Tidak ada pengguna yang cocok</p>}
        </div>

        <div className="history__footer">
          <Image src="/moving-as-one.png" alt="Moving as one" width={250} height={89} />
        </div>
      </main>

      <AdminBottomNav active="mekanik" />
    </div>
  );
}

function Avatar({ url }: { url: string | null }) {
  return (
    <span className="mk-avatar">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" />
      ) : (
        <UserIcon size={24} />
      )}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="mk-stat__value">{value}</p>
      <p className="mk-stat__label">{label}</p>
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