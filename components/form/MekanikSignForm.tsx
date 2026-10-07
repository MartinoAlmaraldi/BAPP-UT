'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { errorMessage } from '@/lib/errorMessage';
import SignaturePad from '@/components/signature/SignaturePad';
import '@/styles/pages/flow.css';

interface MekanikSignFormProps {
  bappId: string;
  namaMekanik: string;
}

export default function MekanikSignForm({ bappId, namaMekanik }: MekanikSignFormProps) {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!signature) {
      setError('Tanda tangan dulu di kotak di atas.');
      return;
    }

    setError(null);
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
      const filePath = user.id + '/bapp-' + bappId + '-mekanik.png';

      const { error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(filePath, blob, { contentType: 'image/png', upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('signatures').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('bapp')
        .update({
          signature_mekanik_url: urlData.publicUrl,
          signed_mekanik_at: new Date().toISOString(),
          status: 'signed_mekanik',
        })
        .eq('id', bappId);
      if (updateError) throw updateError;

      router.push('/bapp/' + bappId + '/customer');
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
        <label className="flabel flabel--muted" htmlFor="nama_mekanik">
          Nama mekanik
        </label>
        <input id="nama_mekanik" type="text" className="finput" value={namaMekanik} readOnly />
      </div>

      {error && <p className="fmessage">{error}</p>}

      <button type="button" className="fbtn fbtn--primary fbtn--block" style={{ marginTop: 6 }} onClick={handleSave} disabled={!signature || loading}>
        {loading ? 'Menyimpan...' : 'Simpan tanda tangan'}
      </button>
    </div>
  );
}