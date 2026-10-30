import { createServerClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import FlowHeader from '@/components/flow/FlowHeader';
import FlowFooter from '@/components/flow/FlowFooter';
import MarMekanikSignForm from '@/components/mar/MarMekanikSignForm';
import '@/styles/pages/flow.css';

export default async function MarSignMekanikPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: mar } = await supabase.from('mar').select('id, status, nama').eq('id', id).single();
  if (!mar) notFound();

  if (mar.status === 'signed_mekanik') redirect('/mar/' + id + '/customer');
  if (mar.status !== 'draft') redirect('/mar/' + id + '/result');

  const { data: profile } = await supabase.from('users').select('name').eq('id', user.id).single();

  return (
    <div className="app-shell">
      <FlowHeader title="Tanda tangan mekanik" backHref={'/mar/' + id + '/preview'} />

      <main className="flow">
        <div className="flow__inner">
          <MarMekanikSignForm marId={id} namaMekanik={mar.nama ?? profile?.name ?? ''} />
        </div>
        <FlowFooter />
      </main>
    </div>
  );
}