'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import SignaturePad from '@/components/signature/SignaturePad';

type HasilPekerjaan = 'memuaskan' | 'tidak_memuaskan';
type StatusPekerjaan = 'selesai' | 'tidak_selesai';

export default function CustomerPage() {
  const router = useRouter();
  const params = useParams();
  const bappId = params.id as string;
  const supabase = createBrowserClient();

  const [namaMekanik, setNamaMekanik] = useState<string | null>(null);
  const [hasilPekerjaan, setHasilPekerjaan] = useState<HasilPekerjaan>('memuaskan');
  const [statusPekerjaan, setStatusPekerjaan] = useState<StatusPekerjaan>('selesai');
  const [catatanCustomer, setCatatanCustomer] = useState('');
  const [namaCustomerTtd, setNamaCustomerTtd] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function loadBapp() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: bapp } = await supabase
        .from('bapp')
        .select('status, mekanik_id, nama_customer')
        .eq('id', bappId)
        .single();

      if (!bapp) {
        router.push('/dashboard');
        return;
      }

      if (bapp.status === 'draft') {
        router.push('/bapp/' + bappId + '/jobdesc');
        return;
      }

      const { data: mekanik } = await supabase
        .from('users')
        .select('name')
        .eq('id', bapp.mekanik_id)
        .single();

      setNamaMekanik(mekanik?.name ?? null);
      setNamaCustomerTtd(bapp.nama_customer ?? '');
      setChecking(false);
    }
    loadBapp();
  }, [bappId]);

  async function handleSaveSignature(dataUrl: string) {
    setError(null);

    if (!namaCustomerTtd.trim()) {
      setError('Nama customer wajib diisi sebelum tanda tangan.');
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const blob = await (await fetch(dataUrl)).blob();
      const filePath = user.id + '/bapp-' + bappId + '-customer.png';

      const { error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(filePath, blob, { contentType: 'image/png', upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('signatures').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('bapp')
        .update({
          hasil_pekerjaan: hasilPekerjaan,
          status_pekerjaan: statusPekerjaan,
          catatan_customer: catatanCustomer || null,
          nama_customer_ttd: namaCustomerTtd,
          signature_customer_url: urlData.publicUrl,
          signed_customer_at: new Date().toISOString(),
          status: 'completed',
        })
        .eq('id', bappId);

      if (updateError) throw updateError;

      await fetch('/api/bapp/' + bappId + '/generate-pdf', { method: 'POST' });

      router.push('/bapp/' + bappId + '/result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan, coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return <div className="px-4 pt-6 text-sm text-gray-400">Memuat...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col px-4 pt-6 pb-8">
      <h1 className="mb-4 text-lg font-medium">Bagian customer</h1>

      {namaMekanik && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2">
          <span className="text-xs text-green-700">
            Sudah ditandatangani mekanik: {namaMekanik}
          </span>
        </div>
      )}

      <p className="mb-2 text-sm font-medium">Hasil pekerjaan</p>
      <div className="mb-3 flex gap-2">
        <ToggleButton
          active={hasilPekerjaan === 'memuaskan'}
          label="Memuaskan"
          onClick={() => setHasilPekerjaan('memuaskan')}
        />
        <ToggleButton
          active={hasilPekerjaan === 'tidak_memuaskan'}
          label="Tidak memuaskan"
          onClick={() => setHasilPekerjaan('tidak_memuaskan')}
        />
      </div>
      <div className="mb-4 flex gap-2">
        <ToggleButton
          active={statusPekerjaan === 'selesai'}
          label="Selesai"
          onClick={() => setStatusPekerjaan('selesai')}
        />
        <ToggleButton
          active={statusPekerjaan === 'tidak_selesai'}
          label="Tidak selesai"
          onClick={() => setStatusPekerjaan('tidak_selesai')}
        />
      </div>

      <label className="mb-1 block text-xs text-gray-500">Catatan customer</label>
      <textarea
        value={catatanCustomer}
        onChange={(e) => setCatatanCustomer(e.target.value)}
        placeholder="Tulis catatan (opsional)"
        className="mb-4 min-h-[70px] w-full rounded-lg border px-3 py-2 text-sm"
      />

      <label className="mb-1 block text-xs text-gray-500">Nama customer</label>
      <input
        type="text"
        value={namaCustomerTtd}
        onChange={(e) => setNamaCustomerTtd(e.target.value)}
        placeholder="Nama penerima"
        className="mb-4 w-full rounded-lg border px-3 py-2 text-sm"
      />

      <p className="mb-2 text-sm font-medium">Tanda tangan customer</p>
      <SignaturePad onSave={handleSaveSignature} disabled={loading} />

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      {loading && <p className="mt-3 text-xs text-gray-400">Menyimpan...</p>}
    </div>
  );
}

function ToggleButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  const className = active
    ? 'flex-1 rounded-lg py-2 text-center text-sm font-medium bg-green-100 text-green-700'
    : 'flex-1 rounded-lg border py-2 text-center text-sm text-gray-500';

  return (
    <button type="button" onClick={onClick} className={className}>
      {label}
    </button>
  );
}
