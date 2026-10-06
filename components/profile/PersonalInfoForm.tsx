'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { BRANCH_OPTIONS } from '@/lib/branches';
import { resizeImageToJpeg } from '@/lib/image';
import { UserIcon } from '@/components/auth/AuthIcons';
import '@/styles/pages/profile.css';

interface PersonalInfoFormProps {
  userId: string;
  initial: {
    name: string;
    email: string;
    nrp: string;
    branch: string;
    avatarUrl: string | null;
  };
}

type Message = { type: 'success' | 'error'; text: string } | null;

const MAX_FILE_SIZE = 8 * 1024 * 1024;

export default function PersonalInfoForm({ userId, initial }: PersonalInfoFormProps) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [nrp, setNrp] = useState(initial.nrp);
  const [branch, setBranch] = useState(initial.branch);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  // Kalau cabang tersimpan tidak ada di daftar, tetap ditampilkan supaya tidak hilang
  const branchOptions: string[] = [...BRANCH_OPTIONS];
  if (branch && !branchOptions.includes(branch)) branchOptions.unshift(branch);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setMessage(null);
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'File harus berupa gambar.' });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setMessage({ type: 'error', text: 'Ukuran gambar maksimal 8 MB.' });
      return;
    }

    setUploading(true);
    try {
      const supabase = createBrowserClient();
      const blob = await resizeImageToJpeg(file);
      const path = `${userId}/avatar-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(path);
      const newUrl = publicData.publicUrl;

      const { data: rows, error: dbError } = await supabase
        .from('users')
        .update({ avatar_url: newUrl })
        .eq('id', userId)
        .select('id');
      if (dbError) throw dbError;
      if (!rows || rows.length === 0) throw new Error('Foto tidak tersimpan. Pastikan migration 0007 sudah dijalankan.');

      // Hapus foto lama (kalau gagal, abaikan)
      const oldPath = avatarUrl?.split('/avatars/')[1];
      if (oldPath && oldPath.startsWith(`${userId}/`)) {
        await supabase.storage.from('avatars').remove([oldPath]);
      }

      setAvatarUrl(newUrl);
      setMessage({ type: 'success', text: 'Foto profil diperbarui.' });
      router.refresh();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal mengunggah foto.' });
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const cleanName = name.trim();
    const cleanNrp = nrp.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) return setMessage({ type: 'error', text: 'Nama wajib diisi.' });
    if (cleanName.length > 100) return setMessage({ type: 'error', text: 'Nama maksimal 100 karakter.' });
    if (!/^[A-Za-z0-9-]{3,30}$/.test(cleanNrp)) {
      return setMessage({ type: 'error', text: 'NRP hanya boleh huruf, angka, atau tanda hubung (3 sampai 30 karakter).' });
    }
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      return setMessage({ type: 'error', text: 'Format email tidak valid.' });
    }

    setSaving(true);
    try {
      const supabase = createBrowserClient();

      const { data: rows, error: updateError } = await supabase
        .from('users')
        .update({ name: cleanName, nrp: cleanNrp, branch: branch || null })
        .eq('id', userId)
        .select('id');
      if (updateError) throw updateError;
      if (!rows || rows.length === 0) throw new Error('Gagal menyimpan. Pastikan migration 0007 sudah dijalankan.');

      let text = 'Perubahan disimpan.';

      if (cleanEmail !== initial.email.toLowerCase()) {
        const { error: emailError } = await supabase.auth.updateUser({ email: cleanEmail });
        if (emailError) {
          setMessage({ type: 'error', text: `Data lain sudah disimpan, tetapi email gagal diubah: ${emailError.message}` });
          router.refresh();
          return;
        }
        text = 'Perubahan disimpan. Link konfirmasi dikirim ke email baru, email berubah setelah dikonfirmasi.';
      }

      setName(cleanName);
      setNrp(cleanNrp);
      setMessage({ type: 'success', text });
      router.refresh();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Terjadi kesalahan, coba lagi.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="pform" onSubmit={handleSubmit}>
      <div className="avatar-edit">
        <div className="profile-avatar">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Foto profil" />
          ) : (
            <UserIcon size={64} />
          )}
        </div>
        <button
          type="button"
          className="avatar-edit__btn"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          aria-label="Ganti foto profil"
        >
          <CameraIcon />
        </button>
        <input ref={fileInput} type="file" accept="image/*" className="avatar-edit__input" onChange={handleAvatarChange} />
      </div>
      {uploading && <p className="pform__hint">Mengunggah foto...</p>}

      <label className="pfield">
        <span className="pfield__label">Nama</span>
        <input className="pfield__input" type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
      </label>

      <label className="pfield">
        <span className="pfield__label">Email</span>
        <input className="pfield__input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
      </label>

      <label className="pfield">
        <span className="pfield__label">NRP</span>
        <input className="pfield__input" type="text" value={nrp} onChange={(e) => setNrp(e.target.value)} required />
      </label>

      <label className="pfield pfield--select">
        <span className="pfield__label">Wilayah cabang/site</span>
        <select className="pfield__input" value={branch} onChange={(e) => setBranch(e.target.value)}>
          <option value="">Pilih wilayah</option>
          {branchOptions.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <ListIcon />
      </label>

      {message && (
        <p className={message.type === 'error' ? 'pform__message pform__message--error' : 'pform__message pform__message--success'}>
          {message.text}
        </p>
      )}

      <div className="pform__fill" />

      <button type="submit" className="pbtn" disabled={saving || uploading}>
        {saving ? 'Menyimpan...' : 'Simpan'}
      </button>
    </form>
  );
}

function CameraIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg className="pfield__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  );
}