'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createBrowserClient } from '@/lib/supabase/client';
import { errorMessage } from '@/lib/errorMessage';
import { marInfoSchema, type MarInfoInput } from '@/lib/validation/marSchema';
import '@/styles/pages/flow.css';

interface MarInfoFormProps {
  marId?: string; // kalau ada, berarti edit draft yang sudah ada
  defaultValues?: Partial<MarInfoInput>;
}

type Action = 'draft' | 'next' | null;

// Teks kosong disimpan sebagai null supaya kolom tanggal tidak error
function toDb(values: Partial<MarInfoInput>) {
  const clean = (v?: string) => {
    const t = (v ?? '').trim();
    return t ? t : null;
  };
  return {
    nama: clean(values.nama),
    nrp: clean(values.nrp),
    tanggal: clean(values.tanggal),
    nama_customer: clean(values.nama_customer),
    unit_model: clean(values.unit_model),
    unit_serial_no: clean(values.unit_serial_no),
  };
}

export default function MarInfoForm({ marId, defaultValues }: MarInfoFormProps) {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Action>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<MarInfoInput>({
    resolver: zodResolver(marInfoSchema),
    defaultValues,
  });

  // Simpan ke database. Mengembalikan id MAR, atau null kalau user belum login.
  async function save(data: ReturnType<typeof toDb>): Promise<string | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return null;
    }

    if (marId) {
      const { error: updateError } = await supabase.from('mar').update(data).eq('id', marId);
      if (updateError) throw updateError;
      return marId;
    }

    const { data: created, error: insertError } = await supabase
      .from('mar')
      .insert({ ...data, mekanik_id: user.id, status: 'draft' })
      .select('id')
      .single();
    if (insertError) throw insertError;
    return created.id;
  }

  async function onNext(values: MarInfoInput) {
    setError(null);
    setBusy('next');
    try {
      const id = await save(toDb(values));
      if (id) router.push('/mar/' + id + '/detail');
    } catch (err) {
      setError(errorMessage(err, 'Gagal menyimpan data, coba lagi.'));
    } finally {
      setBusy(null);
    }
  }

  async function onDraft() {
    setError(null);
    const data = toDb(getValues());

    // Nama dan NRP terisi otomatis dari profil, jadi tidak dihitung
    if ([data.tanggal, data.nama_customer, data.unit_model, data.unit_serial_no].every((v) => v === null)) {
      setError('Isi minimal satu kolom (tanggal, customer, atau unit) untuk menyimpan draft.');
      return;
    }

    setBusy('draft');
    try {
      const id = await save(data);
      if (id) router.push('/dashboard');
    } catch (err) {
      setError(errorMessage(err, 'Gagal menyimpan draft, coba lagi.'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <form onSubmit={handleSubmit(onNext)} className="fform" noValidate>
      <div className="fgroup">
        <label className="flabel flabel--strong" htmlFor="nama">
          Nama mekanik
        </label>
        <input id="nama" type="text" className="finput" {...register('nama')} />
      </div>

      <div className="fgroup">
        <label className="flabel flabel--strong" htmlFor="nrp">
          NRP mekanik
        </label>
        <input id="nrp" type="text" className="finput" {...register('nrp')} />
      </div>

      <div className="fgroup">
        <label className="flabel flabel--strong" htmlFor="tanggal">
          Tanggal pekerjaan
        </label>
        <input id="tanggal" type="date" className="finput" {...register('tanggal')} />
      </div>

      <div className="fgroup">
        <label className="flabel flabel--strong" htmlFor="nama_customer">
          Nama Customer
        </label>
        <input id="nama_customer" type="text" className="finput" {...register('nama_customer')} />
      </div>

      <p className="fheading">Unit</p>
      <div className="fgrid">
        <div className="fgroup">
          <label className="flabel" htmlFor="unit_model">
            Model
          </label>
          <input id="unit_model" type="text" className="finput" {...register('unit_model')} />
          {errors.unit_model && <p className="ferror">{errors.unit_model.message}</p>}
        </div>
        <div className="fgroup">
          <label className="flabel" htmlFor="unit_serial_no">
            Serial no.
          </label>
          <input id="unit_serial_no" type="text" className="finput" {...register('unit_serial_no')} />
          {errors.unit_serial_no && <p className="ferror">{errors.unit_serial_no.message}</p>}
        </div>
      </div>

      {error && <p className="fmessage">{error}</p>}

      <div className="factions">
        <button type="button" className="fbtn" onClick={onDraft} disabled={busy !== null}>
          {busy === 'draft' ? 'Menyimpan...' : 'Simpan draft'}
        </button>
        <button type="submit" className="fbtn fbtn--primary" disabled={busy !== null}>
          {busy === 'next' ? 'Menyimpan...' : 'Lanjut'}
        </button>
      </div>
    </form>
  );
}