'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (signUpError) throw signUpError;

        // Kalau session null, berarti Supabase menunggu konfirmasi email dulu
        if (!data.session) {
          setSuccessMessage('Pendaftaran berhasil. Silakan cek email Anda dan klik link konfirmasi sebelum bisa login.');
          setIsSignUp(false); // pindah balik ke form login
          setLoading(false);
          return;
        }

        // Kalau session langsung ada (berarti email confirmation dimatikan), lanjut redirect seperti biasa
        await redirectByRole(data.user!.id);
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

        if (signInError) {
          // Pesan error spesifik kalau memang belum konfirmasi email
          if (signInError.message.includes('Email not confirmed')) {
            throw new Error('Email belum dikonfirmasi. Silakan cek inbox/spam email Anda.');
          }
          throw signInError;
        }

        await redirectByRole(data.user!.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan, coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  async function redirectByRole(userId: string) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    router.push(profile?.role === 'admin' ? '/admin/dashboard' : '/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-medium">BAPP Digital</h1>
        <p className="mb-6 text-sm text-gray-500">PT United Tractors Tbk.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignUp && (
            <div>
              <label className="mb-1 block text-xs text-gray-500">Nama lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs text-gray-500">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          {successMessage && <p className="text-xs text-green-600">{successMessage}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 h-11 rounded-lg bg-black text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? 'Memproses...' : isSignUp ? 'Daftar' : 'Masuk'}
          </button>
        </form>

        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
            setSuccessMessage(null);
          }}
          className="mt-4 w-full text-center text-xs text-gray-500"
        >
          {isSignUp ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
        </button>
      </div>
    </div>
  );
}