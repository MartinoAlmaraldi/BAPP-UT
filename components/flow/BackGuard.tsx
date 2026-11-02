'use client';

import { useEffect } from 'react';

// Mencegah tombol kembali browser / tombol back HP di halaman tanda tangan.
// Caranya: tambah satu entri riwayat untuk URL yang sama, lalu setiap kali user menekan kembali,
// entri itu ditambahkan lagi sehingga user tetap di halaman ini.
export default function BackGuard() {
  useEffect(() => {
    const stay = () => window.history.pushState(window.history.state, '', window.location.href);
    stay();
    window.addEventListener('popstate', stay);
    return () => window.removeEventListener('popstate', stay);
  }, []);

  return null;
}