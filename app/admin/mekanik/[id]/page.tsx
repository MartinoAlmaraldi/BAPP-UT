import { createServerClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import MekanikDetailView from '@/components/admin/MekanikDetailView';
import { buildStatsMap, emptyStats, type BappStatRow } from '@/lib/mekanikStats';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminMekanikDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (me?.role !== 'admin') redirect('/dashboard');

  const { data: target } = await supabase
    .from('users')
    .select('id, name, email, role, nrp, branch, avatar_url')
    .eq('id', id)
    .single();
  if (!target) notFound();

  const { data: bappRows } = await supabase
    .from('bapp')
    .select('id, unit_model, nama_customer, status, created_at, updated_at, signed_customer_at, mekanik_id')
    .eq('mekanik_id', id)
    .order('created_at', { ascending: false });

  const rows = bappRows ?? [];
  const stats = buildStatsMap(rows as BappStatRow[]).get(id) ?? emptyStats();

  return (
    <MekanikDetailView
      id={target.id}
      name={target.name ?? ''}
      email={target.email ?? ''}
      role={target.role === 'admin' ? 'admin' : 'mekanik'}
      nrp={target.nrp ?? null}
      branch={target.branch ?? null}
      avatarUrl={target.avatar_url ?? null}
      stats={stats}
      recent={rows.slice(0, 10).map((b) => ({
        id: b.id,
        unit_model: b.unit_model,
        nama_customer: b.nama_customer,
        status: b.status,
        created_at: b.created_at,
      }))}
    />
  );
}