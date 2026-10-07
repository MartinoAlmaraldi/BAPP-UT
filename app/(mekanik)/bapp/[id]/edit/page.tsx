import { createServerClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import FlowHeader from '@/components/flow/FlowHeader';
import FlowFooter from '@/components/flow/FlowFooter';
import UnitDataForm from '@/components/form/UnitDataForm';
import '@/styles/pages/flow.css';

export default async function EditBappPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: bapp } = await supabase
    .from('bapp')
    .select(
      'id, status, tanggal_penyerahan, nama_customer, unit_model, unit_serial_no, unit_code, unit_location, engine_model, engine_serial_no, smr'
    )
    .eq('id', id)
    .single();

  if (!bapp) notFound();

  // Data unit hanya boleh diubah selama masih draft
  if (bapp.status === 'signed_mekanik') redirect('/bapp/' + id + '/customer');
  if (bapp.status !== 'draft') redirect('/bapp/' + id + '/result');

  return (
    <div className="app-shell">
      <FlowHeader title="BAPP baru" backHref="/dashboard" step={1} />

      <main className="flow">
        <div className="flow__inner">
          <p className="flow-step">Langkah 1 dari 3 &bull; Info umum &amp; data unit</p>
          <UnitDataForm
            bappId={bapp.id}
            defaultValues={{
              tanggal_penyerahan: bapp.tanggal_penyerahan ?? '',
              nama_customer: bapp.nama_customer ?? '',
              unit_model: bapp.unit_model ?? '',
              unit_serial_no: bapp.unit_serial_no ?? '',
              unit_code: bapp.unit_code ?? '',
              unit_location: bapp.unit_location ?? '',
              engine_model: bapp.engine_model ?? '',
              engine_serial_no: bapp.engine_serial_no ?? '',
              smr: bapp.smr ?? '',
            }}
          />
        </div>
        <FlowFooter />
      </main>
    </div>
  );
}