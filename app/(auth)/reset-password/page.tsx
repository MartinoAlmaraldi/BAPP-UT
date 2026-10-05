'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';
import AuthHeader from '@/components/auth/AuthHeader';
import AuthFooter from '@/components/auth/AuthFooter';
import PasswordField from '@/components/auth/PasswordField';
import '@/styles/pages/auth.css';
import '@/styles/components/auth/field.css';

export default function ResetPasswordPage() {
  const supabase = createBrowserClient();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setExpired(false);

    if (password !== confirm) {
      setError('Konfirmasi password tidak sama.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        const message = updateError.message.toLowerCase();
        if (message.includes('session')) {
          setExpired(true);
          return;
        }
        if (message.includes('different from the old')) {
          throw new Error('Password baru harus berbeda dari password lama.');
        }
        throw updateError;
      }

      // Link reset membuat session sementara. Dibuang supaya user Log In dengan password baru.
      await supabase.auth.signOut();
      setDone(true);
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
        <h1 className="auth__title">Password Baru</h1>
        <p className="auth__lead">Masukkan password baru untuk akun Anda.</p>

        {done ? (
          <>
            <div className="auth__notice">Password berhasil diubah. Silakan Log In dengan password baru.</div>

            <div className="auth__actions">
              <Link href="/login" className="btn btn-primary">
                Log In
              </Link>
            </div>
          </>
        ) : (
          <form className="auth__form" onSubmit={handleSubmit}>
            <PasswordField value={password} onChange={setPassword} placeholder="Password baru" />
            <PasswordField value={confirm} onChange={setConfirm} placeholder="Konfirmasi password" />

            {error && <p className="auth__message auth__message--error">{error}</p>}

            {expired && (
              <p className="auth__message auth__message--error">
                Link reset tidak valid atau sudah kedaluwarsa. <Link href="/forgot-password">Minta link baru</Link>
              </p>
            )}

            <button type="submit" className="btn btn-primary auth__submit" disabled={loading}>
              {loading ? 'Memproses...' : 'Simpan Password'}
            </button>
          </form>
        )}
      </main>

      <AuthFooter />
    </div>
  );
}