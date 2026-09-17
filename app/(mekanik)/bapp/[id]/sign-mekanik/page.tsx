'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import SignaturePad from '@/components/signature/SignaturePad';

export default function SignMekanikPage() {
  const router = useRouter();
  const params = useParams();
  const bappId = params.id as string;
  const supabase = createBrowserClient();

  const [namaMekanik, setNamaMekanik] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadName() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      const { data: profile } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single();
      setNamaMekanik(profile?.name ?? '');
    }
    loadName();
  }, []);

  async function handleSaveSignature(dataUrl: string) {
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

      const blob = await (await fetch(dataUrl)).blob();
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
      setError(err instanceof Error ? err.message : 'Gagal menyimpan tanda tangan, coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col px-4 pt-6">
      <h1 className="mb-1 text-lg font-medium">Tanda tangan mekanik</h1>
      <p className="mb-4 text-sm text-gray-500">
        Silakan tanda tangan di area di bawah menggunakan jari atau stylus.
      </p>

      <SignaturePad onSave={handleSaveSignature} disabled={loading} />

      <div className="mt-4">
        <label className="mb-1 block text-xs text-gray-500">Nama mekanik</label>
        <input
          type="text"
          value={namaMekanik}
          onChange={(e) => setNamaMekanik(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      {loading && <p className="mt-3 text-xs text-gray-400">Menyimpan...</p>}
    </div>
  );
}
