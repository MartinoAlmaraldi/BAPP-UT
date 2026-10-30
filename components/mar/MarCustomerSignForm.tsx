'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { errorMessage } from '@/lib/errorMessage';
import SignaturePad from '@/components/signature/SignaturePad';
import '@/styles/pages/flow.css';

interface MarCustomerSignFormProps {
  marId: string;
  defaultNamaCustomer: string;
}

export default function MarCustomerSignForm({ marId, defaultNamaCustomer }: MarCustomerSignFormProps) {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [namaCustomer, setNamaCustomer] = useState(defaultNamaCustomer);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setError(null);

    if (!namaCustomer.trim()) {
      setError('Nama customer wajib diisi sebelum tanda tangan.');
      return;
    }
    if (!signature) {
      setError('Tanda tangan dulu di kotak di atas.');
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
      const filePath = user.id + '/mar-' + marId + '-customer.png';

      const { error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(filePath, blob, { contentType: 'image/png', upsert: true });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('mar')
        .update({
          nama_customer_ttd: namaCustomer.trim(),
          signature_customer_url: filePath,
          signed_customer_at: new Date().toISOString(),
          status: 'completed',
        })
        .eq('id', marId);
      if (updateError) throw updateError;

      router.push('/mar/' + marId + '/result');
    } catch (err) {
      setError(errorMessage(err, 'Gagal menyimpan tanda tangan, coba lagi.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fform">
      <p className="flow-note">Silakan tanda tangan di area di bawah menggunakan jari atau stylus.</p>

      <SignaturePad onChange={setSignature} disabled={loading} clearStyle="block" />

      <div className="fgroup" style={{ marginTop: 16 }}>
        <label className="flabel flabel--muted" htmlFor="nama_customer_ttd">
          Nama customer
        </label>
        <input
          id="nama_customer_ttd"
          type="text"
          className="finput"
          value={namaCustomer}
          onChange={(e) => setNamaCustomer(e.target.value)}
        />
      </div>

      {error && <p className="fmessage">{error}</p>}

      <button
        type="button"
        className="fbtn fbtn--primary fbtn--block"
        style={{ marginTop: 6 }}
        onClick={handleSave}
        disabled={!signature || loading}
      >
        {loading ? 'Menyimpan...' : 'Simpan tanda tangan'}
      </button>
    </div>
  );
}