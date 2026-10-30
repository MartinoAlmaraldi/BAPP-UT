import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import FlowHeader from '@/components/flow/FlowHeader';
import FlowFooter from '@/components/flow/FlowFooter';
import MarInfoForm from '@/components/mar/MarInfoForm';
import '@/styles/pages/flow.css';

export default async function NewMarPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('users').select('name, nrp').eq('id', user.id).single();

  return (
    <div className="app-shell">
      <FlowHeader title="MAR baru" backHref="/dashboard" step={1} />

      <main className="flow">
        <div className="flow__inner">
          <p className="flow-step">Langkah 1 dari 3 &bull; Informasi mekanik &amp; unit</p>
          <MarInfoForm defaultValues={{ nama: profile?.name ?? '', nrp: profile?.nrp ?? '' }} />
        </div>
        <FlowFooter />
      </main>
    </div>
  );
}