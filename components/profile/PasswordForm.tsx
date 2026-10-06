'use client';

import { useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import '@/styles/pages/profile.css';

interface PasswordFormProps {
  email: string;
}

type Message = { type: 'success' | 'error'; text: string } | null;

export default function PasswordForm({ email }: PasswordFormProps) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!current) return setMessage({ type: 'error', text: 'Isi kata sandi saat ini.' });
    if (next.length < 6) return setMessage({ type: 'error', text: 'Kata sandi baru minimal 6 karakter.' });
    if (next !== confirm) return setMessage({ type: 'error', text: 'Konfirmasi kata sandi tidak sama.' });
    if (next === current) return setMessage({ type: 'error', text: 'Kata sandi baru harus berbeda dari yang lama.' });

    setSaving(true);
    try {
      const supabase = createBrowserClient();

      // Verifikasi kata sandi saat ini
      const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: current });
      if (verifyError) throw new Error('Kata sandi saat ini salah.');

      const { error: updateError } = await supabase.auth.updateUser({ password: next });
      if (updateError) {
        if (updateError.message.toLowerCase().includes('different from the old')) {
          throw new Error('Kata sandi baru harus berbeda dari yang lama.');
        }
        throw updateError;
      }

      setCurrent('');
      setNext('');
      setConfirm('');
      setMessage({ type: 'success', text: 'Kata sandi berhasil diubah.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Terjadi kesalahan, coba lagi.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="pform" onSubmit={handleSubmit}>
      <label className="pfield">
        <span className="pfield__label">Kata sandi saat ini</span>
        <input
          className="pfield__input"
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>

      <label className="pfield">
        <span className="pfield__label">Kata sandi baru</span>
        <input
          className="pfield__input"
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
          minLength={6}
          required
        />
      </label>

      <label className="pfield">
        <span className="pfield__label">Konfirmasi kata sandi</span>
        <input
          className="pfield__input"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          minLength={6}
          required
        />
      </label>

      <a href="/forgot-password" className="pform__link">
        Lupa password?
      </a>

      {message && (
        <p className={message.type === 'error' ? 'pform__message pform__message--error' : 'pform__message pform__message--success'}>
          {message.text}
        </p>
      )}

      <button type="submit" className="pbtn pbtn--spaced" disabled={saving}>
        {saving ? 'Memproses...' : 'Ubah kata sandi'}
      </button>
    </form>
  );
}