'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createBrowserClient } from '@/lib/supabase/client';
import { errorMessage } from '@/lib/errorMessage';
import { unitDataSchema, type UnitDataInput } from '@/lib/validation/bappSchema';
import '@/styles/pages/flow.css';

interface UnitDataFormProps {
  bappId?: string; // kalau ada, berarti edit draft yang sudah ada
  defaultValues?: Partial<UnitDataInput>;
}

type Action = 'draft' | 'next' | null;

// Teks kosong disimpan sebagai null supaya kolom tanggal tidak error
function toDb(values: Partial<UnitDataInput>) {
  const clean = (v?: string) => {
    const t = (v ?? '').trim();
    return t ? t : null;
  };
  return {
    tanggal_penyerahan: clean(values.tanggal_penyerahan),
    nama_customer: clean(values.nama_customer),
    unit_model: clean(values.unit_model),
    unit_serial_no: clean(values.unit_serial_no),
    unit_code: clean(values.unit_code),
    unit_location: clean(values.unit_location),
    engine_model: clean(values.engine_model),
    engine_serial_no: clean(values.engine_serial_no),
    smr: clean(values.smr),
  };
}

export default function UnitDataForm({ bappId, defaultValues }: UnitDataFormProps) {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Action>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<UnitDataInput>({
    resolver: zodResolver(unitDataSchema),
    defaultValues,
  });

  // Simpan ke database. Mengembalikan id BAPP, atau null kalau user belum login.
  async function save(data: ReturnType<typeof toDb>): Promise<string | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return null;
    }

    if (bappId) {
      const { error: updateError } = await supabase.from('bapp').update(data).eq('id', bappId);
      if (updateError) throw updateError;
      return bappId;
    }

    const { data: created, error: insertError } = await supabase
      .from('bapp')
      .insert({ ...data, mekanik_id: user.id, status: 'draft' })
      .select('id')
      .single();
    if (insertError) throw insertError;
    return created.id;
  }

  async function onNext(values: UnitDataInput) {
    setError(null);
    setBusy('next');
    try {
      const id = await save(toDb(values));
      if (id) router.push(`/bapp/${id}/jobdesc`);
    } catch (err) {
      setError(errorMessage(err, 'Gagal menyimpan data, coba lagi.'));
    } finally {
      setBusy(null);
    }
  }

  async function onDraft() {
    setError(null);
    const data = toDb(getValues());

    if (Object.values(data).every((v) => v === null)) {
      setError('Isi minimal satu kolom untuk menyimpan draft.');
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
        <label className="flabel flabel--strong" htmlFor="tanggal_penyerahan">
          Tanggal penyerahan
        </label>
        <input id="tanggal_penyerahan" type="date" className="finput" {...register('tanggal_penyerahan')} />
        {errors.tanggal_penyerahan && <p className="ferror">{errors.tanggal_penyerahan.message}</p>}
      </div>

      <div className="fgroup">
        <label className="flabel flabel--strong" htmlFor="nama_customer">
          Nama Customer
        </label>
        <input id="nama_customer" type="text" className="finput" {...register('nama_customer')} />
        {errors.nama_customer && <p className="ferror">{errors.nama_customer.message}</p>}
      </div>

      <p className="fheading">Unit</p>
      <div className="fgrid">
        <div className="fgroup">
          <label className="flabel" htmlFor="unit_model">
            Model
          </label>
          <input id="unit_model" type="text" className="finput" {...register('unit_model')} />
          {errors.unit_model && <p className="ferror">Model wajib diisi</p>}
        </div>
        <div className="fgroup">
          <label className="flabel" htmlFor="unit_serial_no">
            Serial no.
          </label>
          <input id="unit_serial_no" type="text" className="finput" {...register('unit_serial_no')} />
          {errors.unit_serial_no && <p className="ferror">Serial no. wajib diisi</p>}
        </div>
        <div className="fgroup">
          <label className="flabel" htmlFor="unit_code">
            Code unit
          </label>
          <input id="unit_code" type="text" className="finput" {...register('unit_code')} />
        </div>
        <div className="fgroup">
          <label className="flabel" htmlFor="unit_location">
            Location
          </label>
          <input id="unit_location" type="text" className="finput" {...register('unit_location')} />
          {errors.unit_location && <p className="ferror">Location wajib diisi</p>}
        </div>
      </div>

      <p className="fheading">Engine</p>
      <div className="fgrid">
        <div className="fgroup">
          <label className="flabel" htmlFor="engine_model">
            Model
          </label>
          <input id="engine_model" type="text" className="finput" {...register('engine_model')} />
        </div>
        <div className="fgroup">
          <label className="flabel" htmlFor="engine_serial_no">
            Serial no.
          </label>
          <input id="engine_serial_no" type="text" className="finput" {...register('engine_serial_no')} />
        </div>
      </div>

      <div className="fgroup">
        <label className="flabel" htmlFor="smr">
          SMR (HM/KM)
        </label>
        <input id="smr" type="text" className="finput" {...register('smr')} />
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