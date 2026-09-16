import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BAPP Digital - PT United Tractors',
  description: 'Aplikasi digital Berita Acara Penyerahan Pekerjaan',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}