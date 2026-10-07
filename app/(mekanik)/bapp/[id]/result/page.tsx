import { createServerClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import FlowHeader from '@/components/flow/FlowHeader';
import FlowFooter from '@/components/flow/FlowFooter';
import DoneIllustration from '@/components/bapp/DoneIllustration';
import ShareButton from '@/components/bapp/ShareButton';
import GeneratePdfButton from '@/components/bapp/GeneratePdfButton';
import '@/styles/pages/flow.css';
import '@/styles/pages/result.css';

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: bapp } = await supabase
    .from('bapp')
    .select('id, unit_model, nama_customer, status, pdf_url')
    .eq('id', id)
    .single();

  if (!bapp) notFound();

  if (bapp.status === 'draft') redirect('/bapp/' + id + '/jobdesc');
  if (bapp.status === 'signed_mekanik') redirect('/bapp/' + id + '/customer');

  return (
    <div className="app-shell">
      <FlowHeader title="BAPP selesai" />

      <main className="result">
        <div className="result__inner">
          <DoneIllustration className="result__illustration" />

          <h1 className="result__title">BAPP Selesai</h1>
          <p className="result__sub">
            {bapp.unit_model ?? '-'} &bull; {bapp.nama_customer ?? '-'}
          </p>

          {bapp.pdf_url ? (
            <div className="result-card">
              <p className="result-card__title">PDF sudah tersedia</p>
              <a
                href={bapp.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="fbtn fbtn--primary fbtn--block"
              >
                Download PDF
              </a>
              <ShareButton url={bapp.pdf_url} title={'BAPP ' + (bapp.unit_model ?? '')} />
            </div>
          ) : (
            <div className="result-card result-card--empty">
              <p className="result-card__title">PDF belum dibuat untuk BAPP ini.</p>
              <GeneratePdfButton bappId={bapp.id} />
            </div>
          )}

          <a href="/dashboard" className="fbtn fbtn--block">
            Kembali ke dashboard
          </a>
        </div>

        <FlowFooter />
      </main>
    </div>
  );
}