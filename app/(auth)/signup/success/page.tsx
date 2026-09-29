import Image from 'next/image';
import Link from 'next/link';
import '@/styles/pages/signup-success.css';

export default function SignUpSuccessPage() {
  return (
    <div className="app-shell">
      <main className="success">
        <Image
          className="success__illustration"
          src="/signup-success.png"
          alt="Sign Up berhasil"
          width={240}
          height={240}
          priority
        />

        <h1 className="success__title">Sign Up berhasil!</h1>
        <p className="success__text">Silakan Log In.</p>

        <Link href="/login" className="btn btn-primary success__action">
          Log In
        </Link>
      </main>
    </div>
  );
}