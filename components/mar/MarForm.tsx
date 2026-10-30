'use client';

import { useState } from 'react';
import { errorMessage } from '@/lib/errorMessage';
import { hitungDurasiMenit } from '@/lib/mar';
import { MAX_MAR_ROWS, marInfoSchema } from '@/lib/validation/marSchema';
import '@/styles/pages/flow.css';
import '@/styles/pages/mar.css';

type RowField =
  | 'tanggal'
  | 'unit_model_sn'
  | 'wo_number'
  | 'no_operation'
  | 'job_description'
  | 'start_time'
  | 'finish_time'
  | 'hm_km'
  | 'status_job';

type MarRow = Record<RowField, string>;
type RowErrors = Partial<Record<RowField, string>>;

const ROW_FIELDS: RowField[] = [
  'tanggal',
  'unit_model_sn',
  'wo_number',
  'no_operation',
  'job_description',
  'start_time',
  'finish_time',
  'hm_km',
  'status_job',
];

const EMPTY_ROW: MarRow = {
  tanggal: '',
  unit_model_sn: '',
  wo_number: '',
  no_operation: '',
  job_description: '',
  start_time: '',
  finish_time: '',
  hm_km: '',
  status_job: '',
};

interface MarFormProps {
  defaultNama: string;
  defaultNrp: string;
}

export default function MarForm({ defaultNama, defaultNrp }: MarFormProps) {
  const [nama, setNama] = useState(defaultNama);
  const [nrp, setNrp] = useState(defaultNrp);
  const [mengetahuiNama, setMengetahuiNama] = useState('');
  const [mengetahuiJabatan, setMengetahuiJabatan] = useState('');
  const [dibuatNama, setDibuatNama] = useState(defaultNama);
  const [dibuatJabatan, setDibuatJabatan] = useState('');
  const [rows, setRows] = useState<MarRow[]>([{ ...EMPTY_ROW }]);
  const [rowErrors, setRowErrors] = useState<Record<number, RowErrors>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  function updateRow(index: number, field: RowField, value: string) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
    setRowErrors((prev) => {
      if (!prev[index] || !prev[index][field]) return prev;
      const next = { ...prev, [index]: { ...prev[index] } };
      delete next[index][field];
      return next;
    });
  }

  function addRow() {
    if (rows.length >= MAX_MAR_ROWS) return;
    setRows((prev) => [...prev, { ...EMPTY_ROW }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
    setRowErrors({});
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = {
      nama,
      nrp,
      mengetahui_nama: mengetahuiNama,
      mengetahui_jabatan: mengetahuiJabatan,
      dibuat_nama: dibuatNama,
      dibuat_jabatan: dibuatJabatan,
    };
    const parsed = marInfoSchema.safeParse(formData);

    if (!parsed.success) {
      const nextErrors: Record<number, RowErrors> = {};
      let general: string | null = null;

      for (const issue of parsed.error.issues) {
        const [root, index, field] = issue.path;
        if (root === 'rows' && typeof index === 'number' && typeof field === 'string') {
          if (ROW_FIELDS.includes(field as RowField)) {
            const bucket = nextErrors[index] ?? {};
            if (!bucket[field as RowField]) bucket[field as RowField] = issue.message;
            nextErrors[index] = bucket;
          }
        } else if (!general) {
          general = issue.message;
        }
      }

      setRowErrors(nextErrors);
      setError(general ?? 'Ada kolom wajib (*) yang belum diisi. Periksa baris yang bertanda merah.');

      const firstIndex = Object.keys(nextErrors)
        .map(Number)
        .sort((a, b) => a - b)[0];
      if (firstIndex !== undefined) {
        requestAnimationFrame(() => {
          document.getElementById('mar-row-' + firstIndex)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      }
      return;
    }

    setRowErrors({});
    setBusy(true);
    try {
      const res = await fetch('/api/mar/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...parsed.data, rows }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Gagal membuat PDF MAR.');
      }

      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const match = /filename="([^"]+)"/.exec(disposition);

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = match ? match[1] : 'MAR.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);

      setSuccess(true);
    } catch (err) {
      setError(errorMessage(err, 'Gagal membuat PDF MAR, coba lagi.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="fform" noValidate>
      <p className="flow-note">
        Kolom bertanda <span className="freq">*</span> wajib diisi.
      </p>

      <div className="fgroup">
        <label className="flabel flabel--strong" htmlFor="mar-nama">
          Name
        </label>
        <input id="mar-nama" type="text" className="finput" value={nama} onChange={(e) => setNama(e.target.value)} />
      </div>

      <div className="fgroup">
        <label className="flabel flabel--strong" htmlFor="mar-nrp">
          NRP
        </label>
        <input id="mar-nrp" type="text" className="finput" value={nrp} onChange={(e) => setNrp(e.target.value)} />
      </div>

      <p className="fheading">Aktivitas ({rows.length}/{MAX_MAR_ROWS} baris)</p>

      {rows.map((row, index) => {
        const errs = rowErrors[index] ?? {};
        const invalid = Object.keys(errs).length > 0;
        const durasi = hitungDurasiMenit(row.start_time, row.finish_time);
        const idp = 'mar-' + index + '-';

        return (
          <div key={index} id={'mar-row-' + index} className={invalid ? 'mrow mrow--invalid' : 'mrow'}>
            <div className="mrow__head">
              <span>Baris {index + 1}</span>
              {rows.length > 1 && (
                <button
                  type="button"
                  className="mrow__delete"
                  onClick={() => removeRow(index)}
                  aria-label={'Hapus baris ' + (index + 1)}
                >
                  <TrashIcon />
                </button>
              )}
            </div>

            <Field id={idp + 'tanggal'} label="Date">
              <input
                id={idp + 'tanggal'}
                type="date"
                className="finput"
                value={row.tanggal}
                onChange={(e) => updateRow(index, 'tanggal', e.target.value)}
              />
            </Field>

            <Field id={idp + 'unit_model_sn'} label="Unit Model SN" required error={errs.unit_model_sn}>
              <input
                id={idp + 'unit_model_sn'}
                type="text"
                className="finput"
                value={row.unit_model_sn}
                onChange={(e) => updateRow(index, 'unit_model_sn', e.target.value)}
              />
            </Field>

            <div className="fgrid">
              <Field id={idp + 'wo_number'} label="WO Number">
                <input
                  id={idp + 'wo_number'}
                  type="text"
                  className="finput"
                  value={row.wo_number}
                  onChange={(e) => updateRow(index, 'wo_number', e.target.value)}
                />
              </Field>
              <Field id={idp + 'no_operation'} label="NO Operation">
                <input
                  id={idp + 'no_operation'}
                  type="text"
                  className="finput"
                  value={row.no_operation}
                  onChange={(e) => updateRow(index, 'no_operation', e.target.value)}
                />
              </Field>
            </div>

            <Field id={idp + 'job_description'} label="Job Description" required error={errs.job_description}>
              <textarea
                id={idp + 'job_description'}
                className="finput"
                rows={2}
                value={row.job_description}
                onChange={(e) => updateRow(index, 'job_description', e.target.value)}
              />
            </Field>

            <div className="fgrid">
              <Field id={idp + 'start_time'} label="Start" required error={errs.start_time}>
                <input
                  id={idp + 'start_time'}
                  type="time"
                  className="finput"
                  value={row.start_time}
                  onChange={(e) => updateRow(index, 'start_time', e.target.value)}
                />
              </Field>
              <Field id={idp + 'finish_time'} label="Finish" required error={errs.finish_time}>
                <input
                  id={idp + 'finish_time'}
                  type="time"
                  className="finput"
                  value={row.finish_time}
                  onChange={(e) => updateRow(index, 'finish_time', e.target.value)}
                />
              </Field>
            </div>

            <div className="fgrid">
              <Field id={idp + 'durasi'} label="Durasi Hour" required>
                <input
                  id={idp + 'durasi'}
                  type="text"
                  className="finput"
                  value={durasi == null ? '' : (durasi / 60).toFixed(2)}
                  placeholder="Otomatis"
                  readOnly
                />
              </Field>
              <Field id={idp + 'hm_km'} label="HM/KM" required error={errs.hm_km}>
                <input
                  id={idp + 'hm_km'}
                  type="text"
                  inputMode="decimal"
                  className="finput"
                  value={row.hm_km}
                  onChange={(e) => updateRow(index, 'hm_km', e.target.value)}
                />
              </Field>
            </div>

            <Field label="Status Job (F/NF)" required error={errs.status_job}>
              <div className="ftoggle-grid">
                <Toggle
                  active={row.status_job === 'F'}
                  label="F (Finish)"
                  onClick={() => updateRow(index, 'status_job', 'F')}
                />
                <Toggle
                  active={row.status_job === 'NF'}
                  label="NF (Not Finish)"
                  onClick={() => updateRow(index, 'status_job', 'NF')}
                />
              </div>
            </Field>
          </div>
        );
      })}

      <button type="button" className="fbtn fbtn--block mar-add" onClick={addRow} disabled={rows.length >= MAX_MAR_ROWS}>
        {rows.length >= MAX_MAR_ROWS ? (
          'Maksimal ' + MAX_MAR_ROWS + ' baris'
        ) : (
          <>
            <PlusIcon /> Tambah baris (maks. {MAX_MAR_ROWS})
          </>
        )}
      </button>

      <p className="fheading">Mengetahui</p>
      <div className="fgrid">
        <div className="fgroup">
          <label className="flabel" htmlFor="mar-mengetahui-nama">
            Nama
          </label>
          <input
            id="mar-mengetahui-nama"
            type="text"
            className="finput"
            value={mengetahuiNama}
            onChange={(e) => setMengetahuiNama(e.target.value)}
          />
        </div>
        <div className="fgroup">
          <label className="flabel" htmlFor="mar-mengetahui-jabatan">
            Jabatan
          </label>
          <input
            id="mar-mengetahui-jabatan"
            type="text"
            className="finput"
            value={mengetahuiJabatan}
            onChange={(e) => setMengetahuiJabatan(e.target.value)}
          />
        </div>
      </div>

      <p className="fheading">Dibuat Oleh</p>
      <div className="fgrid">
        <div className="fgroup">
          <label className="flabel" htmlFor="mar-dibuat-nama">
            Nama
          </label>
          <input
            id="mar-dibuat-nama"
            type="text"
            className="finput"
            value={dibuatNama}
            onChange={(e) => setDibuatNama(e.target.value)}
          />
        </div>
        <div className="fgroup">
          <label className="flabel" htmlFor="mar-dibuat-jabatan">
            Jabatan
          </label>
          <input
            id="mar-dibuat-jabatan"
            type="text"
            className="finput"
            value={dibuatJabatan}
            onChange={(e) => setDibuatJabatan(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="fmessage">{error}</p>}
      {success && <p className="fsuccess">PDF MAR sudah diunduh.</p>}

      <div className="factions">
        <button type="submit" className="fbtn fbtn--primary" disabled={busy}>
          {busy ? 'Membuat PDF...' : 'Buat PDF MAR'}
        </button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id?: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  const text = (
    <>
      {label}
      {required && (
        <span className="freq" title="Wajib diisi">
          *
        </span>
      )}
    </>
  );

  return (
    <div className="fgroup">
      {id ? (
        <label className="flabel" htmlFor={id}>
          {text}
        </label>
      ) : (
        <p className="flabel">{text}</p>
      )}
      {children}
      {error && <p className="ferror">{error}</p>}
    </div>
  );
}

function Toggle({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={active ? 'ftoggle ftoggle--on' : 'ftoggle'} aria-pressed={active}>
      {label}
    </button>
  );
}

function TrashIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M6 6l1 14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-14" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}