'use client';

import { useEffect, useState } from 'react';
import '@/styles/pages/flow.css';

interface MarShareButtonProps {
  marId: string;
  title: string;
}

type Status = 'loading' | 'ready' | 'error';

export default function MarShareButton({ marId, title }: MarShareButtonProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState<string | null>(null);

  // PDF disiapkan di latar belakang sejak halaman dibuka, supaya saat tombol ditekan bisa langsung dibagikan
  useEffect(() => {
    let cancelled = false;

    async function prepare() {
      try {
        const res = await fetch('/api/mar/' + marId + '/pdf');
        if (!res.ok) throw new Error('Gagal menyiapkan PDF.');

        const blob = await res.blob();
        const disposition = res.headers.get('Content-Disposition') ?? '';
        const fileName = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'MAR.pdf';

        if (!cancelled) {
          setFile(new File([blob], fileName, { type: 'application/pdf' }));
          setStatus('ready');
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    prepare();
    return () => {
      cancelled = true;
    };
  }, [marId]);

  async function handleShare() {
    if (!file) return;
    setMessage(null);

    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title });
        return;
      }

      // Perangkat tidak mendukung berbagi file: unduh saja
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage('Perangkat ini belum mendukung berbagi file, jadi PDF diunduh.');
    } catch (err) {
      // Pengguna menutup menu bagikan: abaikan
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setMessage('Gagal membagikan PDF.');
    }
  }

  return (
    <>
      <button type="button" className="fbtn fbtn--block" onClick={handleShare} disabled={status !== 'ready'}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
          <path d="M16 6l-4-4-4 4" />
          <path d="M12 2v13" />
        </svg>
        {status === 'loading' ? 'Menyiapkan PDF...' : status === 'error' ? 'Bagikan (gagal)' : 'Bagikan'}
      </button>
      {message && <p className="fmessage">{message}</p>}
    </>
  );
}