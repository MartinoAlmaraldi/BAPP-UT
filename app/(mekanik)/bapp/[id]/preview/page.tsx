import { createServerClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import FlowHeader from '@/components/flow/FlowHeader';
import FlowFooter from '@/components/flow/FlowFooter';
import BappPreview from '@/components/bapp/BappPreview';
import type { BappWithJobDesc } from '@/types/bapp';
import '@/styles/pages/flow.css';

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: bapp } = await supabase
    .from('bapp')
    .select('*, job_desc:bapp_job_desc(*)')
    .eq('id', id)
    .single();

  if (!bapp) notFound();

  if (bapp.status === 'signed_mekanik') redirect('/bapp/' + id + '/customer');
  if (bapp.status !== 'draft') redirect('/bapp/' + id + '/result');

  const sortedBapp: BappWithJobDesc = {
    ...bapp,
    job_desc: (bapp.job_desc ?? []).sort((a: { urutan: number }, b: { urutan: number }) => a.urutan - b.urutan),
  };

  return (
    <div className="app-shell">
      <FlowHeader title="Preview BAPP" backHref={'/bapp/' + id + '/jobdesc'} step={3} />

      <main className="flow">
        <div className="flow__inner">
          <p className="flow-step">Langkah 3 dari 3 &bull; Preview</p>
          <BappPreview bapp={sortedBapp} />
        </div>
        <FlowFooter />
      </main>
    </div>
  );
}