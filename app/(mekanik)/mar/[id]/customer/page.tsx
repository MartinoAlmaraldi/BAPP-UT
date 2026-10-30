import { createServerClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import FlowHeader from '@/components/flow/FlowHeader';
import FlowFooter from '@/components/flow/FlowFooter';
import MarCustomerSignForm from '@/components/mar/MarCustomerSignForm';
import '@/styles/pages/flow.css';

export default async function MarCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: mar } = await supabase.from('mar').select('id, status, nama_customer').eq('id', id).single();
  if (!mar) notFound();

  // Customer baru boleh tanda tangan setelah mekanik
  if (mar.status === 'draft') redirect('/mar/' + id + '/detail');
  if (mar.status !== 'signed_mekanik') redirect('/mar/' + id + '/result');

  return (
    <div className="app-shell">
      <FlowHeader title="Tanda tangan customer" backHref="/dashboard" />

      <main className="flow">
        <div className="flow__inner">
          <MarCustomerSignForm marId={id} defaultNamaCustomer={mar.nama_customer ?? ''} />
        </div>
        <FlowFooter />
      </main>
    </div>
  );
}