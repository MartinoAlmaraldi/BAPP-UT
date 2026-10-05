'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import AuthHeader from '@/components/auth/AuthHeader';
import AuthFooter from '@/components/auth/AuthFooter';
import PasswordField from '@/components/auth/PasswordField';
import { MailIcon } from '@/components/auth/AuthIcons';
import '@/styles/pages/auth.css';
import '@/styles/components/auth/field.css';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Email not confirmed')) {
          throw new Error('Email belum dikonfirmasi. Silakan cek inbox/spam email Anda.');
        }
        throw new Error('Email atau password salah.');
      }

      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user!.id)
        .single();

      router.push(profile?.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan, coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <AuthHeader backHref="/" />

      <main className="auth">
        <h1 className="auth__title">Log In</h1>

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

          <PasswordField value={password} onChange={setPassword} />

          <Link href="/forgot-password" className="auth__forgot">
            Lupa password?
          </Link>

          {error && <p className="auth__message auth__message--error">{error}</p>}

          <button type="submit" className="btn btn-primary auth__submit" disabled={loading}>
            {loading ? 'Memproses...' : 'Log In'}
          </button>
        </form>

        <p className="auth__switch">
          Belum punya akun? <Link href="/signup">Sign Up</Link>
        </p>
      </main>

      <AuthFooter />
    </div>
  );
}