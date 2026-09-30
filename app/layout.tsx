import type { Metadata } from 'next';
import './globals.css';
import '@/styles/theme.css';

export const metadata: Metadata = {
  title: 'BAPP Digital - PT United Tractors',
  description: 'Aplikasi digital Berita Acara Penyerahan Pekerjaan',
};

const sidebarInit = `try{if(localStorage.getItem('bapp-sidebar-open')==='false'){document.documentElement.dataset.sidebar='closed'}}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: sidebarInit }} />
      </head>
      <body>{children}</body>
    </html>
  );
}