// Ilustrasi amplop dengan tanda centang (dibuat sebagai SVG, tidak butuh file gambar)
export default function DoneIllustration({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 112" fill="none" aria-hidden="true">
      {/* belakang amplop */}
      <path d="M6 44 60 8l54 36v58a8 8 0 0 1-8 8H14a8 8 0 0 1-8-8z" fill="#FFB224" />
      {/* surat */}
      <rect x="22" y="22" width="76" height="64" rx="6" fill="#F4EEE6" />
      {/* centang */}
      <circle cx="60" cy="42" r="15" fill="#00BF00" />
      <path d="M52 42.5l6 6 11-12" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* bagian depan amplop */}
      <path d="M6 46l54 36 54-36v56a8 8 0 0 1-8 8H14a8 8 0 0 1-8-8z" fill="#FFE000" />
      <path d="M6 46l54 36 54-36" stroke="#FFB224" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}