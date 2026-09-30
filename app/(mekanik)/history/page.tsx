import Image from 'next/image';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppHeader from '@/components/layout/AppHeader';
import BappCard from '@/components/bapp/BappCard';
import BottomNav from '@/components/layout/BottomNav';
import type { BappStatus } from '@/types/bapp';
import '@/styles/pages/history.css';

interface HistoryPageProps {
  searchParams: Promise<{ status?: string | string[]; q?: string | string[] }>;
}

const VALID_STATUS: BappStatus[] = ['draft', 'signed_mekanik', 'completed', 'reviewed'];

const FILTERS: { label: string; value: BappStatus | undefined }[] = [
  { label: 'Semua', value: undefined },
  { label: 'Draft', value: 'draft' },
  { label: 'Sign mekanik', value: 'signed_mekanik' },
  { label: 'Selesai', value: 'completed' },
];

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

function buildHref(status: BappStatus | undefined, q: string): string {
  const search = new URLSearchParams();
  if (status) search.set('status', status);
  if (q) search.set('q', q);
  const qs = search.toString();
  return qs ? `/history?${qs}` : '/history';
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const params = await searchParams;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Status hanya boleh salah satu nilai yang dikenal
  const rawStatus = first(params.status);
  const status = VALID_STATUS.find((s) => s === rawStatus);

  // Buang karakter yang punya arti khusus di filter PostgREST supaya input tidak bisa menyisipkan kondisi lain
  const q = first(params.q).replace(/[%*,()"'\\]/g, ' ').trim().slice(0, 100);

  let query = supabase
    .from('bapp')
    .select('id, unit_model, nama_customer, status, created_at')
    .eq('mekanik_id', user.id)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }
  if (q) {
    query = query.or(`unit_model.ilike.%${q}%,nama_customer.ilike.%${q}%`);
  }

  const { data: bappList } = await query;

  return (
    <div className="app-shell">
      <AppHeader>
        <h1 className="history__title">History BAPP</h1>

        <form className="history__search" method="get" action="/history">
          {status && <input type="hidden" name="status" value={status} />}
          <button type="submit" className="history__search-btn" aria-label="Cari">
            <SearchIcon />
          </button>
          <input
            className="history__search-input"
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Cari berdasarkan unit atau vendor"
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

          <div className="history__list">
            {bappList?.map((bapp) => (
              <BappCard key={bapp.id} bapp={bapp} />
            ))}
          </div>
          {bappList?.length === 0 && <p className="history__empty">Tidak ada BAPP ditemukan</p>}
        </div>

        <div className="history__footer">
          <Image src="/moving-as-one.png" alt="Moving as one" width={190} height={56} />
        </div>
      </main>

      <BottomNav active="history" />
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </svg>
  );
}