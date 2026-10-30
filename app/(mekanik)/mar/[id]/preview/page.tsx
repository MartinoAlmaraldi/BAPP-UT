import { createServerClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import FlowHeader from '@/components/flow/FlowHeader';
import FlowFooter from '@/components/flow/FlowFooter';
import MarPreview from '@/components/mar/MarPreview';
import '@/styles/pages/flow.css';

export default async function MarPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: mar } = await supabase.from('mar').select('*, rows:mar_rows(*)').eq('id', id).single();

  if (!mar) notFound();

  if (mar.status === 'signed_mekanik') redirect('/mar/' + id + '/customer');
  if (mar.status !== 'draft') redirect('/mar/' + id + '/result');

  const sortedMar = {
    ...mar,
    rows: (mar.rows ?? []).sort((a: { urutan: number }, b: { urutan: number }) => a.urutan - b.urutan),
  };

  return (
    <div className="app-shell">
      <FlowHeader title="Preview MAR" backHref={'/mar/' + id + '/detail'} step={3} />

      <main className="flow">
        <div className="flow__inner">
          <p className="flow-step">Langkah 3 dari 3 &bull; Preview</p>
          <MarPreview mar={sortedMar} />
        </div>
        <FlowFooter />
      </main>
    </div>
  );
}