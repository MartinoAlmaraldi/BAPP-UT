import { createServerClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import FlowHeader from '@/components/flow/FlowHeader';
import FlowFooter from '@/components/flow/FlowFooter';
import MekanikSignForm from '@/components/form/MekanikSignForm';
import '@/styles/pages/flow.css';

export default async function SignMekanikPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: bapp } = await supabase.from('bapp').select('id, status').eq('id', id).single();
  if (!bapp) notFound();

  if (bapp.status === 'signed_mekanik') redirect('/bapp/' + id + '/customer');
  if (bapp.status !== 'draft') redirect('/bapp/' + id + '/result');

  const { data: profile } = await supabase.from('users').select('name').eq('id', user.id).single();

  return (
    <div className="app-shell">
      <FlowHeader title="Tanda tangan mekanik" backHref={'/bapp/' + id + '/preview'} />

      <main className="flow">
        <div className="flow__inner">
          <MekanikSignForm bappId={id} namaMekanik={profile?.name ?? ''} />
        </div>
        <FlowFooter />
      </main>
    </div>
  );
}