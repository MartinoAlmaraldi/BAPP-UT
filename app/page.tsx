import Image from 'next/image';
import Link from 'next/link';
import '@/styles/pages/welcome.css';

export default function WelcomePage() {
  return (
    <div className="app-shell">
      <main className="welcome">
        <div className="welcome__hero">
          <Image
            src="/welcome.jpg"
            alt="Gedung PT United Tractors Tbk"
            width={1400}
            height={876}
            sizes="(min-width: 768px) 720px, 100vw"
            priority
          />
        </div>

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
      </main>
    </div>
  );
}