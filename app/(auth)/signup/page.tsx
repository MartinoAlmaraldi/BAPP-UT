'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import AuthHeader from '@/components/auth/AuthHeader';
import PasswordField from '@/components/auth/PasswordField';
import { UserIcon, MailIcon, ShieldIcon } from '@/components/auth/AuthIcons';
import '@/styles/pages/auth.css';
import '@/styles/components/auth/field.css';

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [nrp, setNrp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, nrp } },
      });
      if (signUpError) throw signUpError;

      // Frame 4 meminta user "Silakan Log In", jadi session otomatis dibuang dulu.
      await supabase.auth.signOut();

      router.push('/signup/success');
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
        <h1 className="auth__title">Sign Up</h1>

        <form className="auth__form" onSubmit={handleSubmit}>
          <div className="field">
            <span className="field__icon">
              <UserIcon />
            </span>
            <input
              className="field__input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama"
              required
              autoComplete="name"
            />
          </div>

          <PasswordField value={password} onChange={setPassword} />

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

          <div className="field">
            <span className="field__icon">
              <ShieldIcon />
            </span>
            <input
              className="field__input"
              type="text"
              inputMode="numeric"
              value={nrp}
              onChange={(e) => setNrp(e.target.value)}
              placeholder="NRP"
              required
            />
          </div>

          {error && <p className="auth__message auth__message--error">{error}</p>}

          <button type="submit" className="btn btn-primary auth__submit" disabled={loading}>
            {loading ? 'Memproses...' : 'Sign Up'}
          </button>
        </form>

        <p className="auth__switch">
          Sudah punya akun? <Link href="/login">Log In</Link>
        </p>
      </main>
    </div>
  );
}