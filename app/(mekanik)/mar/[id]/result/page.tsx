import { createServerClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import FlowHeader from '@/components/flow/FlowHeader';
import FlowFooter from '@/components/flow/FlowFooter';
import DoneIllustration from '@/components/bapp/DoneIllustration';
import MarShareButton from '@/components/mar/MarShareButton';
import '@/styles/pages/flow.css';
import '@/styles/pages/result.css';

export default async function MarResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: mar } = await supabase.from('mar').select('id, nama, nrp, status').eq('id', id).single();
  if (!mar) notFound();

  if (mar.status === 'draft') redirect('/mar/' + id + '/detail');
  if (mar.status === 'signed_mekanik') redirect('/mar/' + id + '/customer');

  return (
    <div className="app-shell">
      <FlowHeader title="MAR selesai" />

      <main className="result">
        <div className="result__inner">
          <DoneIllustration className="result__illustration" />

          <h1 className="result__title">MAR Selesai</h1>
          <p className="result__sub">
            {mar.nama ?? '-'} &bull; {mar.nrp ?? '-'}
          </p>

          <div className="result-card">
            <p className="result-card__title">PDF sudah tersedia</p>
            <a href={'/api/mar/' + mar.id + '/pdf?download=1'} className="fbtn fbtn--primary fbtn--block">
              Download PDF
            </a>
            <MarShareButton marId={mar.id} title={'MAR ' + (mar.nama ?? '')} />
          </div>

          <a href="/dashboard" className="fbtn fbtn--block">
            Kembali ke dashboard
          </a>
        </div>

        <FlowFooter />
      </main>
    </div>
  );
}