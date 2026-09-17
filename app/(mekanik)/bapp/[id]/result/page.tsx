import { createServerClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: bapp } = await supabase
    .from('bapp')
    .select('id, unit_model, nama_customer, status, pdf_url')
    .eq('id', id)
    .single();

  if (!bapp) notFound();

  return (
    <div className="flex min-h-screen flex-col items-center px-4 pt-10 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
        <span className="text-2xl text-green-600">&#10003;</span>
      </div>

      <p className="mb-1 text-base font-medium">BAPP selesai</p>
      <p className="mb-6 text-sm text-gray-500">
        {bapp.unit_model ?? '-'} &middot; {bapp.nama_customer ?? '-'}
      </p>

      {bapp.pdf_url ? (
        <div className="mb-6 flex w-full max-w-sm flex-col items-center gap-2 rounded-lg border p-6">
          <span className="text-sm text-gray-500">PDF sudah tersedia</span>
          <a
            href={bapp.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-black text-sm font-medium text-white"
          >
            Buka / Unduh PDF
          </a>
        </div>
      ) : (
        <div className="mb-6 w-full max-w-sm rounded-lg border border-dashed p-6 text-sm text-gray-400">
          PDF belum digenerate untuk BAPP ini.
        </div>
      )}

      <a
        href="/dashboard"
        className="flex h-11 w-full max-w-sm items-center justify-center rounded-lg border text-sm font-medium"
      >
        Kembali ke dashboard
      </a>
    </div>
  );
}
