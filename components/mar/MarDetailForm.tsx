'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { errorMessage } from '@/lib/errorMessage';
import { formatDurasiPanjang, hitungDurasiMenit, jamInput } from '@/lib/mar';
import { MAX_MAR_ROWS, marDetailSchema } from '@/lib/validation/marSchema';
import '@/styles/pages/flow.css';
import '@/styles/pages/mar.css';

type RowField = 'job_description' | 'start_time' | 'finish_time' | 'status_job';
type MarRow = Record<RowField, string>;
type RowErrors = Partial<Record<RowField, string>>;
type Action = 'draft' | 'next' | null;

const ROW_FIELDS: RowField[] = ['job_description', 'start_time', 'finish_time', 'status_job'];
const EMPTY_ROW: MarRow = { job_description: '', start_time: '', finish_time: '', status_job: '' };

interface MarDetailFormProps {
  marId: string;
  initial: { wo_number: string | null; no_operation: string | null; smr: string | null };
  initialRows: {
    job_description: string | null;
    start_time: string | null;
    finish_time: string | null;
    status_job: string | null;
  }[];
}

function orNull(value: string): string | null {
  const text = value.trim();
  return text ? text : null;
}

function hasContent(row: MarRow): boolean {
  return Boolean(row.job_description.trim() || row.start_time || row.finish_time || row.status_job);
}

export default function MarDetailForm({ marId, initial, initialRows }: MarDetailFormProps) {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [woNumber, setWoNumber] = useState(initial.wo_number ?? '');
  const [noOperation, setNoOperation] = useState(initial.no_operation ?? '');
  const [smr, setSmr] = useState(initial.smr ?? '');
  const [rows, setRows] = useState<MarRow[]>(
    initialRows.length > 0
      ? initialRows.map((r) => ({
          job_description: r.job_description ?? '',
          start_time: jamInput(r.start_time),
          finish_time: jamInput(r.finish_time),
          status_job: r.status_job ?? '',
        }))
      : [{ ...EMPTY_ROW }]
  );
  const [rowErrors, setRowErrors] = useState<Record<number, RowErrors>>({});
  const [smrError, setSmrError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Action>(null);

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

  // Cek kolom wajib. Mengembalikan true kalau semua lengkap.
  function validate(): boolean {
    const parsed = marDetailSchema.safeParse({ wo_number: woNumber, no_operation: noOperation, smr, rows });
    if (parsed.success) {
      setRowErrors({});
      setSmrError(null);
      return true;
    }

    const nextRowErrors: Record<number, RowErrors> = {};
    let nextSmr: string | null = null;
    let general: string | null = null;

    for (const issue of parsed.error.issues) {
      const [root, index, field] = issue.path;
      if (root === 'rows' && typeof index === 'number' && typeof field === 'string') {
        if (ROW_FIELDS.includes(field as RowField)) {
          const bucket = nextRowErrors[index] ?? {};
          if (!bucket[field as RowField]) bucket[field as RowField] = issue.message;
          nextRowErrors[index] = bucket;
        }
      } else if (root === 'smr') {
        if (!nextSmr) nextSmr = issue.message;
      } else if (!general) {
        general = issue.message;
      }
    }

    setRowErrors(nextRowErrors);
    setSmrError(nextSmr);
    setError(general ?? 'Ada kolom yang belum lengkap. Periksa bagian yang bertanda merah.');

    const firstIndex = Object.keys(nextRowErrors)
      .map(Number)
      .sort((a, b) => a - b)[0];
    const targetId = firstIndex !== undefined ? 'mar-row-' + firstIndex : nextSmr ? 'smr' : null;
    if (targetId) {
      requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
    return false;
  }

  async function save(goNext: boolean) {
    setError(null);

    if (goNext) {
      if (!validate()) return;
    } else {
      setRowErrors({});
      setSmrError(null);
      const adaIsiHeader = woNumber.trim() || noOperation.trim() || smr.trim();
      if (!adaIsiHeader && !rows.some(hasContent)) {
        setError('Isi minimal satu kolom untuk menyimpan draft.');
        return;
      }
    }

    setBusy(goNext ? 'next' : 'draft');
    try {
      const keep = goNext ? rows : rows.filter(hasContent);

      const { error: deleteError } = await supabase.from('mar_rows').delete().eq('mar_id', marId);
      if (deleteError) throw deleteError;

      if (keep.length > 0) {
        const { error: insertError } = await supabase.from('mar_rows').insert(
          keep.map((row, i) => ({
            mar_id: marId,
            urutan: i + 1,
            job_description: orNull(row.job_description),
            start_time: row.start_time || null,
            finish_time: row.finish_time || null,
            status_job: row.status_job || null,
          }))
        );
        if (insertError) throw insertError;
      }

      const { error: updateError } = await supabase
        .from('mar')
        .update({ wo_number: orNull(woNumber), no_operation: orNull(noOperation), smr: orNull(smr) })
        .eq('id', marId);
      if (updateError) throw updateError;

      router.push(goNext ? '/mar/' + marId + '/preview' : '/dashboard');
    } catch (err) {
      setError(errorMessage(err, 'Gagal menyimpan data, coba lagi.'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fform">
      <div className="fgroup">
        <label className="flabel flabel--strong" htmlFor="wo_number">
          WO number
        </label>
        <input id="wo_number" type="text" className="finput" value={woNumber} onChange={(e) => setWoNumber(e.target.value)} />
      </div>

      <div className="fgroup">
        <label className="flabel flabel--strong" htmlFor="no_operation">
          NO operation
        </label>
        <input
          id="no_operation"
          type="text"
          className="finput"
          value={noOperation}
          onChange={(e) => setNoOperation(e.target.value)}
        />
      </div>

      <div className="fgroup" id="smr">
        <label className="flabel flabel--strong" htmlFor="smr_input">
          SMR (HM/KM)
        </label>
        <input id="smr_input" type="text" inputMode="decimal" className="finput" value={smr} onChange={(e) => {
          setSmr(e.target.value);
          if (smrError) setSmrError(null);
        }} />
        {smrError && <p className="ferror">{smrError}</p>}
      </div>

      <p className="fheading">
        Rincian pekerjaan ({rows.length}/{MAX_MAR_ROWS})
      </p>

      {rows.map((row, index) => {
        const errs = rowErrors[index] ?? {};
        const invalid = Object.keys(errs).length > 0;
        const menit = hitungDurasiMenit(row.start_time, row.finish_time);
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

            <div className="fgroup">
              <label className="flabel flabel--strong" htmlFor={idp + 'job_description'}>
                Job description
              </label>
              <textarea
                id={idp + 'job_description'}
                className="finput"
                rows={3}
                value={row.job_description}
                onChange={(e) => updateRow(index, 'job_description', e.target.value)}
              />
              {errs.job_description && <p className="ferror">{errs.job_description}</p>}
            </div>

            <div className="fgrid">
              <div className="fgroup">
                <label className="flabel" htmlFor={idp + 'start_time'}>
                  Start
                </label>
                <input
                  id={idp + 'start_time'}
                  type="time"
                  className="finput"
                  value={row.start_time}
                  onChange={(e) => updateRow(index, 'start_time', e.target.value)}
                />
                {errs.start_time && <p className="ferror">{errs.start_time}</p>}
              </div>
              <div className="fgroup">
                <label className="flabel" htmlFor={idp + 'finish_time'}>
                  Finish
                </label>
                <input
                  id={idp + 'finish_time'}
                  type="time"
                  className="finput"
                  value={row.finish_time}
                  onChange={(e) => updateRow(index, 'finish_time', e.target.value)}
                />
                {errs.finish_time && <p className="ferror">{errs.finish_time}</p>}
              </div>
            </div>

            <div className="mdur">
              <div>
                <span className="mdur__title">
                  <TimerIcon /> Durasi Pekerjaan
                </span>
                <span className="mdur__hint">Dihitung otomatis dari waktu mulai dan selesai.</span>
              </div>
              <span className="mdur__value">{formatDurasiPanjang(menit)}</span>
            </div>

            <div className="fgroup">
              <p className="flabel flabel--strong">Status Job</p>
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
              {errs.status_job && <p className="ferror">{errs.status_job}</p>}
            </div>
          </div>
        );
      })}

      <button type="button" className="fbtn fbtn--block" onClick={addRow} disabled={rows.length >= MAX_MAR_ROWS}>
        {rows.length >= MAX_MAR_ROWS ? (
          'Maksimal ' + MAX_MAR_ROWS + ' baris'
        ) : (
          <>
            <PlusIcon /> Tambah baris (maks.{MAX_MAR_ROWS})
          </>
        )}
      </button>

      {error && <p className="fmessage">{error}</p>}

      <div className="factions">
        <button type="button" className="fbtn" onClick={() => save(false)} disabled={busy !== null}>
          {busy === 'draft' ? 'Menyimpan...' : 'Simpan draft'}
        </button>
        <button type="button" className="fbtn fbtn--primary" onClick={() => save(true)} disabled={busy !== null}>
          {busy === 'next' ? 'Menyimpan...' : 'Lanjut'}
        </button>
      </div>
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M6 6l1 14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-14" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function TimerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2" />
      <path d="M9.5 2.5h5" />
    </svg>
  );
}