import { createServerClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import StatusBadge from '@/components/bapp/StatusBadge';

export default async function AdminBappDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/dashboard');

  const { data: bapp } = await supabase
    .from('bapp')
    .select('*, job_desc:bapp_job_desc(*)')
    .eq('id', id)
    .single();

  if (!bapp) notFound();

  const { data: mekanik } = await supabase.from('users').select('name, email').eq('id', bapp.mekanik_id).single();

  const sortedJobDesc = (bapp.job_desc ?? []).sort(
    (a: { urutan: number }, b: { urutan: number }) => a.urutan - b.urutan
  );

  return (
    <div className="flex min-h-screen flex-col px-4 pt-6 pb-10">
      <a href="/admin/dashboard" className="mb-3 text-xs text-blue-600">
        &larr; Kembali
      </a>

      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-medium">{bapp.unit_model ?? '(belum diisi)'}</h1>
          <p className="text-sm text-gray-500">{bapp.nama_customer ?? '-'}</p>
        </div>
        <StatusBadge status={bapp.status} />
      </div>

      <div className="mb-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
        Dibuat oleh <span className="font-medium">{mekanik?.name}</span> ({mekanik?.email})
        <br />
        {new Date(bapp.created_at).toLocaleString('id-ID')}
      </div>

      <div className="mb-4 rounded-lg border p-4">
        <p className="mb-0.5 text-xs text-gray-500">Unit</p>
        <p className="mb-3 text-sm">
          {bapp.unit_model ?? '-'} / {bapp.unit_serial_no ?? '-'} &middot; SMR {bapp.smr ?? '-'} &middot;{' '}
          {bapp.unit_location ?? '-'}
        </p>

        <p className="mb-1.5 text-xs text-gray-500">Pekerjaan ({sortedJobDesc.length})</p>
        <div className="flex flex-col gap-1.5 border-t pt-2">
          {sortedJobDesc.length === 0 && <p className="text-xs text-gray-400">Belum ada pekerjaan diisi</p>}
          {sortedJobDesc.map((row: { id: string; component: string | null; job_desc: string | null }) => (
            <p key={row.id} className="text-sm">
              <span className="font-medium">{row.component}</span>
              {row.job_desc ? ' - ' + row.job_desc : ''}
            </p>
          ))}
        </div>
      </div>

      {bapp.catatan_mekanik && (
        <div className="mb-3 rounded-lg border p-3">
          <p className="mb-1 text-xs font-medium text-gray-500">Catatan Mekanik</p>
          <p className="text-sm">{bapp.catatan_mekanik}</p>
        </div>
      )}

      {bapp.catatan_customer && (
        <div className="mb-4 rounded-lg border p-3">
          <p className="mb-1 text-xs font-medium text-gray-500">Catatan Customer</p>
          <p className="text-sm">{bapp.catatan_customer}</p>
        </div>
      )}

      {bapp.pdf_url ? (
        <a
          href={bapp.pdf_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 w-full items-center justify-center rounded-lg bg-black text-sm font-medium text-white"
        >
          Buka PDF
        </a>
      ) : (
        <p className="text-center text-sm text-gray-400">PDF belum digenerate</p>
      )}
    </div>
  );
}
