import Image from 'next/image';
import Link from 'next/link';
import '@/styles/pages/welcome.css';

export default function WelcomePage() {
  return (
    <div className="app-shell">
      <main className="welcome">
        <div className="welcome__hero">
          <picture>
            <source media="(min-width: 1024px)" srcSet="/welcome-desktop.jpg" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/welcome.jpg"
              alt="Gedung PT United Tractors Tbk"
              width={1400}
              height={876}
            />
          </picture>

          <div className="welcome__brand">
            <p className="welcome__brand-title">BAPP Digital</p>
            <p className="welcome__brand-text">
              Berita Acara Penyerahan Pekerjaan
              <br />
              PT United Tractors Tbk.
            </p>
          </div>
        </div>

        <div className="welcome__content">
          <div className="welcome__body">
            <h1 className="welcome__title">Selamat Datang</h1>
            <p className="welcome__subtitle">Masuk untuk melanjutkan</p>

            <div className="welcome__actions">
              <Link href="/login" className="btn btn-primary">
                Log In
              </Link>

              <div className="welcome__divider">
                <span>atau</span>
              </div>

              <Link href="/signup" className="btn btn-secondary">
                Sign Up
              </Link>
            </div>
          </div>

          <div className="welcome__footer">
            <Image
              src="/moving-as-one.png"
              alt="Moving as one"
              width={190}
              height={56}
            />
          </div>
        </div>
      </main>
    </div>
  );
}