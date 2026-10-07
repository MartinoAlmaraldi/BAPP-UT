import { createServerClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import FlowHeader from '@/components/flow/FlowHeader';
import FlowFooter from '@/components/flow/FlowFooter';
import JobDescTable from '@/components/form/JobDescTable';
import '@/styles/pages/flow.css';

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
      'id, status, kondisi_unit, kesiapan_unit, cust_request_at, mech_sent_at, start_diagnose_at, start_waiting_at, start_job_at, finish_job_at, job_desc:bapp_job_desc(component, job_desc, remarks, urutan)'
    )
    .eq('id', id)
    .single();

  if (!bapp) notFound();

  // Pekerjaan hanya boleh diubah selama masih draft
  if (bapp.status === 'signed_mekanik') redirect('/bapp/' + id + '/customer');
  if (bapp.status !== 'draft') redirect('/bapp/' + id + '/result');

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
    <div className="app-shell">
      <FlowHeader title="BAPP baru" backHref={'/bapp/' + bapp.id + '/edit'} step={2} />

      <main className="flow">
        <div className="flow__inner">
          <p className="flow-step">Langkah 2 dari 3 &bull; Pekerjaan yang dilakukan</p>
          <JobDescTable
            bappId={bapp.id}
            initialRows={sortedJobDesc}
            initialWaktu={initialWaktu}
            initialKondisi={bapp.kondisi_unit}
            initialKesiapan={bapp.kesiapan_unit}
          />
        </div>
        <FlowFooter />
      </main>
    </div>
  );
}