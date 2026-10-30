import { createServerClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import FlowHeader from '@/components/flow/FlowHeader';
import FlowFooter from '@/components/flow/FlowFooter';
import MarInfoForm from '@/components/mar/MarInfoForm';
import '@/styles/pages/flow.css';

export default async function EditMarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: mar } = await supabase
    .from('mar')
    .select('id, status, nama, nrp, tanggal, nama_customer, unit_model, unit_serial_no')
    .eq('id', id)
    .single();

  if (!mar) notFound();

  // Data hanya boleh diubah selama masih draft
  if (mar.status === 'signed_mekanik') redirect('/mar/' + id + '/customer');
  if (mar.status !== 'draft') redirect('/mar/' + id + '/result');

  return (
    <div className="app-shell">
      <FlowHeader title="MAR baru" backHref="/dashboard" step={1} />

      <main className="flow">
        <div className="flow__inner">
          <p className="flow-step">Langkah 1 dari 3 &bull; Informasi mekanik &amp; unit</p>
          <MarInfoForm
            marId={mar.id}
            defaultValues={{
              nama: mar.nama ?? '',
              nrp: mar.nrp ?? '',
              tanggal: mar.tanggal ?? '',
              nama_customer: mar.nama_customer ?? '',
              unit_model: mar.unit_model ?? '',
              unit_serial_no: mar.unit_serial_no ?? '',
            }}
          />
        </div>
        <FlowFooter />
      </main>
    </div>
  );
}