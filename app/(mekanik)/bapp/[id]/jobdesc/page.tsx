import { createServerClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import JobDescTable from '@/components/form/JobDescTable';

function toLocalInputValue(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
    'T' + pad(d.getHours()) + ':' + pad(d.getMinutes())
  );
}

export default async function JobDescPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: bapp } = await supabase
    .from('bapp')
    .select(
      'id, cust_request_at, mech_sent_at, start_diagnose_at, start_waiting_at, start_job_at, finish_job_at, job_desc:bapp_job_desc(component, job_desc, remarks, urutan)'
    )
    .eq('id', id)
    .single();

  if (!bapp) notFound();

  const sortedJobDesc = (bapp.job_desc ?? []).sort((a, b) => a.urutan - b.urutan);

  const initialWaktu = {
    cust_request_at: toLocalInputValue(bapp.cust_request_at),
    mech_sent_at: toLocalInputValue(bapp.mech_sent_at),
    start_diagnose_at: toLocalInputValue(bapp.start_diagnose_at),
    start_waiting_at: toLocalInputValue(bapp.start_waiting_at),
    start_job_at: toLocalInputValue(bapp.start_job_at),
    finish_job_at: toLocalInputValue(bapp.finish_job_at),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="px-4 pt-6">
        <h1 className="text-lg font-medium">BAPP baru</h1>
      </div>

      <div className="flex gap-1.5 px-4 py-4">
        <div className="h-1 flex-1 rounded-full bg-black" />
        <div className="h-1 flex-1 rounded-full bg-black" />
        <div className="h-1 flex-1 rounded-full bg-gray-200" />
      </div>

      <p className="px-4 pb-3 text-xs text-gray-500">Langkah 2 dari 3 &middot; Pekerjaan yang dilakukan</p>

      <JobDescTable bappId={bapp.id} initialRows={sortedJobDesc} initialWaktu={initialWaktu} />
    </div>
  );
}
