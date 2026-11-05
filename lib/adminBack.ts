import { headers } from 'next/headers';

// Tujuan tombol kembali di halaman detail admin: halaman admin sebelumnya (Dashboard, History, atau
// detail Mekanik) kalau user datang dari sana, selain itu ke halaman bawaan.
export async function adminBackHref(fallback: string, currentPath: string): Promise<string> {
  const h = await headers();
  const referer = h.get('referer');
  const host = h.get('host');
  if (!referer || !host) return fallback;

  try {
    const url = new URL(referer);
    if (url.host !== host) return fallback;
    if (!url.pathname.startsWith('/admin') || url.pathname === currentPath) return fallback;
    return url.pathname + url.search;
  } catch {
    return fallback;
  }
}