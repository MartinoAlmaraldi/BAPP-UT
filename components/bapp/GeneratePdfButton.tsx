'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import '@/styles/pages/flow.css';

export default function GeneratePdfButton({ bappId }: { bappId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/bapp/' + bappId + '/generate-pdf', { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Gagal membuat PDF.');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat PDF.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" className="fbtn fbtn--primary fbtn--block" onClick={handleGenerate} disabled={loading}>
        {loading ? 'Membuat PDF...' : 'Buat PDF'}
      </button>
      {error && <p className="fmessage">{error}</p>}
    </>
  );
}