'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { errorMessage } from '@/lib/errorMessage';
import SignaturePad from '@/components/signature/SignaturePad';
import '@/styles/pages/flow.css';

type HasilPekerjaan = 'memuaskan' | 'tidak_memuaskan';
type StatusPekerjaan = 'selesai' | 'tidak_selesai';

interface CustomerSignFormProps {
  bappId: string;
  defaultNamaCustomer: string;
}

export default function CustomerSignForm({ bappId, defaultNamaCustomer }: CustomerSignFormProps) {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [hasilPekerjaan, setHasilPekerjaan] = useState<HasilPekerjaan>('memuaskan');
  const [statusPekerjaan, setStatusPekerjaan] = useState<StatusPekerjaan>('selesai');
  const [catatanCustomer, setCatatanCustomer] = useState('');
  const [namaCustomerTtd, setNamaCustomerTtd] = useState(defaultNamaCustomer);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setError(null);

    if (!namaCustomerTtd.trim()) {
      setError('Nama customer wajib diisi sebelum tanda tangan.');
      return;
    }
    if (!signature) {
      setError('Tanda tangan customer dulu di kotak di atas.');
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

      const blob = await (await fetch(signature)).blob();
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
          catatan_customer: catatanCustomer.trim() || null,
          nama_customer_ttd: namaCustomerTtd.trim(),
          signature_customer_url: urlData.publicUrl,
          signed_customer_at: new Date().toISOString(),
          status: 'completed',
        })
        .eq('id', bappId);
      if (updateError) throw updateError;

      // Kalau pembuatan PDF gagal, halaman hasil menyediakan tombol untuk mencoba lagi
      await fetch('/api/bapp/' + bappId + '/generate-pdf', { method: 'POST' }).catch(() => null);

      router.push('/bapp/' + bappId + '/result');
    } catch (err) {
      setError(errorMessage(err, 'Gagal menyimpan, coba lagi.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fform">
      <p className="flabel flabel--strong" style={{ marginBottom: 8 }}>
        Hasil pekerjaan
      </p>
      <div className="ftoggle-grid">
        <Toggle active={hasilPekerjaan === 'memuaskan'} label="Memuaskan" onClick={() => setHasilPekerjaan('memuaskan')} />
        <Toggle active={hasilPekerjaan === 'tidak_memuaskan'} label="Tidak memuaskan" onClick={() => setHasilPekerjaan('tidak_memuaskan')} />
        <Toggle active={statusPekerjaan === 'selesai'} label="Selesai" onClick={() => setStatusPekerjaan('selesai')} />
        <Toggle active={statusPekerjaan === 'tidak_selesai'} label="Tidak selesai" onClick={() => setStatusPekerjaan('tidak_selesai')} />
      </div>

      <div className="fgroup">
        <label className="flabel flabel--muted" htmlFor="catatan_customer">
          Catatan customer
        </label>
        <textarea
          id="catatan_customer"
          className="finput finput--area"
          value={catatanCustomer}
          onChange={(e) => setCatatanCustomer(e.target.value)}
        />
      </div>

      <div className="fgroup">
        <label className="flabel flabel--muted" htmlFor="nama_customer_ttd">
          Nama customer
        </label>
        <input
          id="nama_customer_ttd"
          type="text"
          className="finput"
          value={namaCustomerTtd}
          onChange={(e) => setNamaCustomerTtd(e.target.value)}
        />
      </div>

      <p className="flabel flabel--muted">Tanda tangan customer</p>
      <SignaturePad onChange={setSignature} disabled={loading} />

      {error && <p className="fmessage">{error}</p>}

      <div className="factions">
        <button type="button" className="fbtn fbtn--primary fbtn--block" onClick={handleSave} disabled={!signature || loading}>
          {loading ? 'Menyimpan...' : 'Simpan tanda tangan'}
        </button>
      </div>
    </div>
  );
}

function Toggle({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={active ? 'ftoggle ftoggle--on' : 'ftoggle'} aria-pressed={active}>
      {label}
    </button>
  );
}