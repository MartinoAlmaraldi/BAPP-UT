import { createServerClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import FlowHeader from '@/components/flow/FlowHeader';
import FlowFooter from '@/components/flow/FlowFooter';
import MarDetailForm from '@/components/mar/MarDetailForm';
import '@/styles/pages/flow.css';

export default async function MarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: mar } = await supabase
    .from('mar')
    .select('id, status, wo_number, no_operation, smr, rows:mar_rows(job_description, start_time, finish_time, status_job, urutan)')
    .eq('id', id)
    .single();

  if (!mar) notFound();

  // Rincian hanya boleh diubah selama masih draft
  if (mar.status === 'signed_mekanik') redirect('/mar/' + id + '/customer');
  if (mar.status !== 'draft') redirect('/mar/' + id + '/result');

  const sortedRows = (mar.rows ?? []).sort((a: { urutan: number }, b: { urutan: number }) => a.urutan - b.urutan);

  return (
    <div className="app-shell">
      <FlowHeader title="MAR baru" backHref={'/mar/' + mar.id + '/edit'} step={2} />

      <main className="flow">
        <div className="flow__inner">
          <p className="flow-step">Langkah 2 dari 3 &bull; Detail aktivitas pekerjaan</p>
          <MarDetailForm
            marId={mar.id}
            initial={{ wo_number: mar.wo_number, no_operation: mar.no_operation, smr: mar.smr }}
            initialRows={sortedRows}
          />
        </div>
        <FlowFooter />
      </main>
    </div>
  );
}