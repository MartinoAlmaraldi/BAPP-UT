import Image from 'next/image';
import '@/styles/components/layout/app-header.css';

export default function AppHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <div className="app-header__inner app-header__brand-inner">
          <Image
            className="app-header__logo-ut"
            src="/logo-ut.png"
            alt="United Tractors"
            width={192}
            height={38}
            priority
          />
          <div className="app-header__partners">
            <Image src="/logo-ulm.png" alt="Universitas Lambung Mangkurat" width={60} height={60} priority />
            <Image src="/logo-hima.png" alt="HIMA" width={60} height={60} priority />
          </div>
        </div>
      </div>

      {children && (
        <div className="app-header__bar">
          <div className="app-header__inner">{children}</div>
        </div>
      )}
    </header>
  );
}