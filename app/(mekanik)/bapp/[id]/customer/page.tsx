import { createServerClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import FlowHeader from '@/components/flow/FlowHeader';
import FlowFooter from '@/components/flow/FlowFooter';
import CustomerSignForm from '@/components/form/CustomerSignForm';
import '@/styles/pages/flow.css';

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: bapp } = await supabase.from('bapp').select('id, status, nama_customer').eq('id', id).single();
  if (!bapp) notFound();

  // Customer baru boleh tanda tangan setelah mekanik
  if (bapp.status === 'draft') redirect('/bapp/' + id + '/jobdesc');
  if (bapp.status !== 'signed_mekanik') redirect('/bapp/' + id + '/result');

  return (
    <div className="app-shell">
      <FlowHeader title="Customer" backHref="/dashboard" />

      <main className="flow">
        <div className="flow__inner">
          <CustomerSignForm bappId={id} defaultNamaCustomer={bapp.nama_customer ?? ''} />
        </div>
        <FlowFooter />
      </main>
    </div>
  );
}