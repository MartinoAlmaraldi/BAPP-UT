'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';
import AuthHeader from '@/components/auth/AuthHeader';
import AuthFooter from '@/components/auth/AuthFooter';
import { MailIcon } from '@/components/auth/AuthIcons';
import '@/styles/pages/auth.css';
import '@/styles/components/auth/field.css';

export default function ForgotPasswordPage() {
  const supabase = createBrowserClient();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        if (resetError.message.toLowerCase().includes('rate limit')) {
          throw new Error('Terlalu banyak permintaan. Coba lagi beberapa menit lagi.');
        }
        throw resetError;
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan, coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <AuthHeader backHref="/login" />

      <main className="auth">
        <h1 className="auth__title">Lupa Password</h1>
        <p className="auth__lead">
          Masukkan email akun Anda. Kami akan mengirim link untuk mengatur ulang password.
        </p>

        {sent ? (
          <>
            <div className="auth__notice">
              Jika email <strong>{email}</strong> terdaftar, link reset password sudah dikirim.
              Cek inbox atau folder spam Anda.
            </div>

            <div className="auth__actions">
              <Link href="/login" className="btn btn-primary">
                Kembali ke Log In
              </Link>
            </div>
          </>
        ) : (
          <>
            <form className="auth__form" onSubmit={handleSubmit}>
              <div className="field">
                <span className="field__icon">
                  <MailIcon />
                </span>
                <input
                  className="field__input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  autoComplete="email"
                />
              </div>

              {error && <p className="auth__message auth__message--error">{error}</p>}

              <button type="submit" className="btn btn-primary auth__submit" disabled={loading}>
                {loading ? 'Memproses...' : 'Kirim Link Reset'}
              </button>
            </form>

            <p className="auth__switch">
              Ingat password? <Link href="/login">Log In</Link>
            </p>
          </>
        )}
      </main>

      <AuthFooter />
    </div>
  );
}