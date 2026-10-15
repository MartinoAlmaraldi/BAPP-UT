import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import MekanikBoardView, {
  type BoardRow,
  type RoleFilter,
  type SortDir,
  type SortKey,
} from '@/components/admin/MekanikBoardView';
import { buildStatsMap, emptyStats, type BappStatRow } from '@/lib/mekanikStats';

interface AdminMekanikPageProps {
  searchParams: Promise<{
    q?: string | string[];
    branch?: string | string[];
    role?: string | string[];
    sort?: string | string[];
    dir?: string | string[];
  }>;
}

const ROLES: RoleFilter[] = ['mekanik', 'admin', 'semua'];
const SORTS: SortKey[] = ['nama', 'draft', 'menunggu', 'selesai', 'total', 'aktivitas'];

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export default async function AdminMekanikPage({ searchParams }: AdminMekanikPageProps) {
  const params = await searchParams;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/dashboard');

  const q = first(params.q).trim().slice(0, 100);
  const branch = first(params.branch).trim().slice(0, 100);
  const role = ROLES.find((r) => r === first(params.role)) ?? 'mekanik';
  const sort = SORTS.find((s) => s === first(params.sort)) ?? 'nama';
  const dir: SortDir = first(params.dir) === 'desc' ? 'desc' : sort === 'nama' ? 'asc' : first(params.dir) === 'asc' ? 'asc' : 'desc';

  const { data: users } = await supabase.from('users').select('id, name, email, role, nrp, branch, avatar_url').order('name');

  const { data: bappRows } = await supabase
    .from('bapp')
    .select('mekanik_id, status, created_at, updated_at, signed_customer_at');

  const statsMap = buildStatsMap((bappRows ?? []) as BappStatRow[]);

  const allUsers = users ?? [];
  const branches = Array.from(new Set(allUsers.map((u) => u.branch).filter((b): b is string => !!b))).sort();

  const needle = q.toLowerCase();
  let rows: BoardRow[] = allUsers
    .filter((u) => role === 'semua' || u.role === role)
    .filter((u) => !branch || u.branch === branch)
    .filter(
      (u) =>
        !needle ||
        (u.name ?? '').toLowerCase().includes(needle) ||
        (u.nrp ?? '').toLowerCase().includes(needle) ||
        (u.email ?? '').toLowerCase().includes(needle)
    )
    .map((u) => ({
      id: u.id,
      name: u.name ?? '',
      role: u.role === 'admin' ? 'admin' : 'mekanik',
      nrp: u.nrp ?? null,
      branch: u.branch ?? null,
      avatarUrl: u.avatar_url ?? null,
      stats: statsMap.get(u.id) ?? emptyStats(),
    }));

  const factor = dir === 'asc' ? 1 : -1;
  rows = rows.sort((a, b) => {
    switch (sort) {
      case 'draft':
        return (a.stats.draft - b.stats.draft) * factor;
      case 'menunggu':
        return (a.stats.menunggu - b.stats.menunggu) * factor;
      case 'selesai':
        return (a.stats.selesaiBulanIni - b.stats.selesaiBulanIni) * factor;
      case 'total':
        return (a.stats.total - b.stats.total) * factor;
      case 'aktivitas':
        return ((a.stats.lastActivity ?? '').localeCompare(b.stats.lastActivity ?? '')) * factor;
      default:
        return a.name.localeCompare(b.name, 'id') * factor;
    }
  });

  return <MekanikBoardView rows={rows} q={q} branch={branch} role={role} sort={sort} dir={dir} branches={branches} />;
}