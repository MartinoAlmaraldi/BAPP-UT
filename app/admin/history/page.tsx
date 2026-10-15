import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminHistoryView from '@/components/bapp/AdminHistoryView';
import type { AdminBappRow } from '@/components/bapp/AdminBappTable';
import type { BappStatus } from '@/types/bapp';

interface AdminHistoryPageProps {
  searchParams: Promise<{ status?: string | string[]; q?: string | string[]; mekanik?: string | string[] }>;
}

const VALID_STATUS: BappStatus[] = ['draft', 'signed_mekanik', 'completed', 'reviewed'];
const MAX_ROWS = 200;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export default async function AdminHistoryPage({ searchParams }: AdminHistoryPageProps) {
  const params = await searchParams;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/history');

  // Status hanya boleh salah satu nilai yang dikenal
  const rawStatus = first(params.status);
  const status = VALID_STATUS.find((s) => s === rawStatus);

  // Buang karakter yang punya arti khusus di filter PostgREST supaya input tidak bisa menyisipkan kondisi lain
  const q = first(params.q).replace(/[%*,()"'\\]/g, ' ').trim().slice(0, 100);

  // Filter satu mekanik (dari halaman Mekanik)
  const rawMekanik = first(params.mekanik);
  const mekanikId = UUID.test(rawMekanik) ? rawMekanik : '';
  let mekanikFilter: { id: string; name: string } | null = null;
  if (mekanikId) {
    const { data: m } = await supabase.from('users').select('id, name').eq('id', mekanikId).single();
    mekanikFilter = m ? { id: m.id, name: m.name ?? '-' } : null;
  }

  let query = supabase
    .from('bapp')
    .select('id, unit_model, nama_customer, status, created_at, mekanik_id')
    .order('created_at', { ascending: false })
    .limit(MAX_ROWS);

  if (status) {
    query = query.eq('status', status);
  }

  if (mekanikFilter) {
    query = query.eq('mekanik_id', mekanikFilter.id);
  }

  if (q) {
    // Cari di unit, customer, dan nama mekanik
    const { data: matchedUsers } = await supabase.from('users').select('id').ilike('name', `%${q}%`).limit(50);
    const matchedIds = (matchedUsers ?? []).map((u) => u.id);

    const conditions = [`unit_model.ilike.%${q}%`, `nama_customer.ilike.%${q}%`];
    if (matchedIds.length > 0) conditions.push(`mekanik_id.in.(${matchedIds.join(',')})`);
    query = query.or(conditions.join(','));
  }

  const { data: bappList } = await query;

  const mekanikIds = Array.from(new Set((bappList ?? []).map((b) => b.mekanik_id)));
  const { data: mekanikList } = mekanikIds.length
    ? await supabase.from('users').select('id, name').in('id', mekanikIds)
    : { data: [] as { id: string; name: string }[] };
  const mekanikMap = new Map((mekanikList ?? []).map((m) => [m.id, m.name]));

  const rows: AdminBappRow[] = (bappList ?? []).map((b) => ({
    id: b.id,
    unit_model: b.unit_model,
    nama_customer: b.nama_customer,
    status: b.status,
    created_at: b.created_at,
    mekanikName: mekanikMap.get(b.mekanik_id) ?? 'Mekanik',
  }));

  return (
    <AdminHistoryView status={status} q={q} rows={rows} truncated={rows.length >= MAX_ROWS} mekanikFilter={mekanikFilter} />
  );
}