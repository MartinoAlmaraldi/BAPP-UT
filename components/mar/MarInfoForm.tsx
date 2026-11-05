'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createBrowserClient } from '@/lib/supabase/client';
import { errorMessage } from '@/lib/errorMessage';
import { marInfoSchema, type MarInfoInput } from '@/lib/validation/marSchema';
import { gabungNama, pisahNama } from '@/lib/mar';
import '@/styles/pages/flow.css';
import '@/styles/pages/mar.css';

interface MarInfoFormProps {
  marId?: string; // kalau ada, berarti edit draft yang sudah ada
  defaultValues?: Partial<MarInfoInput>;
}

type Action = 'draft' | 'next' | null;

interface MekanikLain {
  nama: string;
  nrp: string;
}

// Teks kosong disimpan sebagai null supaya kolom tanggal tidak error.
// Mekanik tambahan (opsional) digabung dengan yang pertama: "Nama 1 / Nama 2" dan "NRP 1 / NRP 2".
// Supaya pasangan nama dan NRP tidak bergeser, isian yang kosong diganti "-".
function toDb(values: Partial<MarInfoInput>, mekanikLain: MekanikLain[] = []) {
  const clean = (v?: string) => {
    const t = (v ?? '').trim();
    return t ? t : null;
  };

  const lain = mekanikLain
    .map((m) => ({ nama: m.nama.trim(), nrp: m.nrp.trim() }))
    .filter((m) => m.nama || m.nrp);
  const semua = [{ nama: (values.nama ?? '').trim(), nrp: (values.nrp ?? '').trim() }, ...lain];
  const gabung = (list: string[]) => (list.some(Boolean) ? gabungNama(list.map((v) => v || '-')) : '');

  return {
    nama: clean(lain.length > 0 ? gabung(semua.map((m) => m.nama)) : semua[0].nama),
    nrp: clean(lain.length > 0 ? gabung(semua.map((m) => m.nrp)) : semua[0].nrp),
    tanggal: clean(values.tanggal),
    nama_customer: clean(values.nama_customer),
    unit_model: clean(values.unit_model),
    unit_serial_no: clean(values.unit_serial_no),
  };
}

// Kebalikan toDb: pisahkan "Nama 1 / Nama 2" dan "NRP 1 / NRP 2" jadi pasangan per mekanik
function pisahMekanik(nama: string | undefined, nrp: string | undefined): MekanikLain[] {
  const daftarNama = pisahNama(nama);
  const daftarNrp = pisahNama(nrp);
  const jumlah = Math.max(daftarNama.length, daftarNrp.length, 1);
  const kosong = (v?: string) => (!v || v === '-' ? '' : v);
  return Array.from({ length: jumlah }, (_, i) => ({ nama: kosong(daftarNama[i]), nrp: kosong(daftarNrp[i]) }));
}

export default function MarInfoForm({ marId, defaultValues }: MarInfoFormProps) {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Action>(null);

  // Mekanik pertama ada di form, mekanik tambahan (nama + NRP berpasangan) disimpan terpisah
  const semuaMekanik = pisahMekanik(defaultValues?.nama, defaultValues?.nrp);
  const [mekanikLain, setMekanikLain] = useState<MekanikLain[]>(semuaMekanik.slice(1));

  function ubahMekanik(index: number, field: keyof MekanikLain, value: string) {
    setMekanikLain((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  }

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<MarInfoInput>({
    resolver: zodResolver(marInfoSchema),
    defaultValues: { ...defaultValues, nama: semuaMekanik[0].nama, nrp: semuaMekanik[0].nrp },
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
      const id = await save(toDb(values, mekanikLain));
      if (id) router.push('/mar/' + id + '/detail');
    } catch (err) {
      setError(errorMessage(err, 'Gagal menyimpan data, coba lagi.'));
    } finally {
      setBusy(null);
    }
  }

  async function onDraft() {
    setError(null);
    const data = toDb(getValues(), mekanikLain);

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
          Nama mekanik <span className="fopt">(opsional)</span>
        </label>
        <input id="nama" type="text" className="finput" {...register('nama')} />
      </div>

      <div className="fgroup">
        <label className="flabel flabel--strong" htmlFor="nrp">
          NRP mekanik <span className="fopt">(opsional)</span>
        </label>
        <input id="nrp" type="text" className="finput" {...register('nrp')} />
      </div>

      {mekanikLain.map((m, i) => (
        <div className="mrow" key={i}>
          <div className="mrow__head">
            <span>
              Mekanik {i + 2} <span className="fopt">(opsional)</span>
            </span>
            <button
              type="button"
              className="mrow__delete"
              onClick={() => setMekanikLain((prev) => prev.filter((_, j) => j !== i))}
              aria-label={'Hapus mekanik ' + (i + 2)}
            >
              <TrashIcon />
            </button>
          </div>

          <div className="fgroup">
            <label className="flabel" htmlFor={'mekanik-nama-' + i}>
              Nama
            </label>
            <input
              id={'mekanik-nama-' + i}
              type="text"
              className="finput"
              value={m.nama}
              onChange={(e) => ubahMekanik(i, 'nama', e.target.value)}
            />
          </div>

          <div className="fgroup">
            <label className="flabel" htmlFor={'mekanik-nrp-' + i}>
              NRP
            </label>
            <input
              id={'mekanik-nrp-' + i}
              type="text"
              className="finput"
              value={m.nrp}
              onChange={(e) => ubahMekanik(i, 'nrp', e.target.value)}
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        className="flink-btn"
        onClick={() => setMekanikLain((prev) => [...prev, { nama: '', nrp: '' }])}
      >
        + Tambah mekanik <span className="fopt">(opsional)</span>
      </button>

      <div className="fgroup">
        <label className="flabel flabel--strong" htmlFor="tanggal">
          Tanggal pekerjaan <span className="fopt">(opsional)</span>
        </label>
        <input id="tanggal" type="date" className="finput" {...register('tanggal')} />
      </div>

      <div className="fgroup">
        <label className="flabel flabel--strong" htmlFor="nama_customer">
          Nama Customer <span className="fopt">(opsional)</span>
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

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M6 6l1 14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-14" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}