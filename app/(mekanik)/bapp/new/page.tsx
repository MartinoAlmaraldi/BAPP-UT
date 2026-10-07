import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import FlowHeader from '@/components/flow/FlowHeader';
import FlowFooter from '@/components/flow/FlowFooter';
import UnitDataForm from '@/components/form/UnitDataForm';
import '@/styles/pages/flow.css';

export default async function NewBappPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <div className="app-shell">
      <FlowHeader title="BAPP baru" backHref="/dashboard" step={1} />

      <main className="flow">
        <div className="flow__inner">
          <p className="flow-step">Langkah 1 dari 3 &bull; Info umum &amp; data unit</p>
          <UnitDataForm />
        </div>
        <FlowFooter />
      </main>
    </div>
  );
}