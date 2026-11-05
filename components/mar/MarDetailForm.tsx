'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { errorMessage } from '@/lib/errorMessage';
import { formatDurasiPanjang, hitungDurasiMenit, jamInput, kelompokWaktu } from '@/lib/mar';
import { MAX_MAR_ROWS, marDetailSchema } from '@/lib/validation/marSchema';
import '@/styles/pages/flow.css';
import '@/styles/pages/mar.css';

type RowField = 'job_description' | 'start_time' | 'finish_time' | 'status_job' | 'unit_model' | 'unit_serial_no';
type MarRow = Record<RowField, string> & { ganti_unit: boolean; gabung_waktu: boolean };
type RowErrors = Partial<Record<RowField, string>>;
type Action = 'draft' | 'next' | null;

const ROW_FIELDS: RowField[] = ['job_description', 'start_time', 'finish_time', 'status_job', 'unit_model', 'unit_serial_no'];
const EMPTY_ROW: MarRow = {
  job_description: '',
  start_time: '',
  finish_time: '',
  status_job: '',
  ganti_unit: false,
  gabung_waktu: false,
  unit_model: '',
  unit_serial_no: '',
};

interface MarDetailFormProps {
  marId: string;
  initial: { wo_number: string | null; no_operation: string | null; smr: string | null };
  initialRows: {
    job_description: string | null;
    start_time: string | null;
    finish_time: string | null;
    status_job: string | null;
    unit_model?: string | null;
    unit_serial_no?: string | null;
    gabung_waktu?: boolean | null;
  }[];
}

// Baris yang digabung memakai Start/Finish dari baris pertama kelompoknya.
// Baris pertama tidak bisa digabung karena tidak ada baris sebelumnya.
function terapkanGabung(rows: MarRow[]): MarRow[] {
  const list = rows.map((r, i) => (i === 0 ? { ...r, gabung_waktu: false } : r));
  for (const [awal, akhir] of kelompokWaktu(list)) {
    for (let i = awal + 1; i <= akhir; i++) {
      list[i] = { ...list[i], start_time: list[awal].start_time, finish_time: list[awal].finish_time };
    }
  }
  return list;
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
          ganti_unit: Boolean(r.unit_model || r.unit_serial_no),
          gabung_waktu: Boolean(r.gabung_waktu),
          unit_model: r.unit_model ?? '',
          unit_serial_no: r.unit_serial_no ?? '',
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

  function toggleGabungWaktu(index: number, on: boolean) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, gabung_waktu: on } : row)));
    setRowErrors((prev) => {
      if (!prev[index]) return prev;
      const next = { ...prev, [index]: { ...prev[index] } };
      delete next[index].start_time;
      delete next[index].finish_time;
      return next;
    });
  }

  function toggleGantiUnit(index: number, on: boolean) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ganti_unit: on } : row)));
    if (!on) {
      setRowErrors((prev) => {
        if (!prev[index]) return prev;
        const next = { ...prev, [index]: { ...prev[index] } };
        delete next[index].unit_model;
        delete next[index].unit_serial_no;
        return next;
      });
    }
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
    const parsed = marDetailSchema.safeParse({
      wo_number: woNumber,
      no_operation: noOperation,
      smr,
      rows: terapkanGabung(rows).map((r, i) => (i === 0 ? { ...r, ganti_unit: false } : r)),
    });
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
      const keep = terapkanGabung(goNext ? rows : rows.filter(hasContent));

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
            gabung_waktu: i > 0 && row.gabung_waktu,
            // Baris pertama selalu memakai unit utama MAR (dari langkah 1)
            unit_model: i > 0 && row.ganti_unit ? orNull(row.unit_model) : null,
            unit_serial_no: i > 0 && row.ganti_unit ? orNull(row.unit_serial_no) : null,
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

  const groups = kelompokWaktu(rows.map((r, i) => (i === 0 ? { gabung_waktu: false } : r)));

  return (
    <div className="fform">
      <div className="fgroup">
        <label className="flabel flabel--strong" htmlFor="wo_number">
          WO number <span className="fopt">(opsional)</span>
        </label>
        <input id="wo_number" type="text" className="finput" value={woNumber} onChange={(e) => setWoNumber(e.target.value)} />
      </div>

      <div className="fgroup">
        <label className="flabel flabel--strong" htmlFor="no_operation">
          NO operation <span className="fopt">(opsional)</span>
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
          SMR (HM/KM) <span className="fopt">(opsional)</span>
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
        const idp = 'mar-' + index + '-';

        // Kelompok waktu baris ini: baris yang digabung mengikuti baris pertama kelompoknya
        const gabung = index > 0 && row.gabung_waktu;
        const kelompok = groups.find(([awal, akhir]) => index >= awal && index <= akhir) ?? [index, index];
        const lead = rows[kelompok[0]];
        const menit = hitungDurasiMenit(lead.start_time, lead.finish_time);
        const barisKelompok = kelompok[1] > kelompok[0] ? 'Baris ' + (kelompok[0] + 1) + '\u2013' + (kelompok[1] + 1) : null;

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

            {index > 0 && (
              <label className="munit-check">
                <input
                  type="checkbox"
                  checked={row.gabung_waktu}
                  onChange={(e) => toggleGabungWaktu(index, e.target.checked)}
                />
                Samakan Start/Finish dengan baris sebelumnya <span className="fopt">(opsional)</span>
              </label>
            )}

            {gabung ? (
              <p className="mgabung">
                Start/Finish mengikuti baris {kelompok[0] + 1} ({lead.start_time || '--:--'} - {lead.finish_time || '--:--'})
              </p>
            ) : (
              <>
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
                    <span className="mdur__hint">
                      {barisKelompok
                        ? 'Satu durasi untuk ' + barisKelompok + '.'
                        : 'Dihitung otomatis dari waktu mulai dan selesai.'}
                    </span>
                  </div>
                  <span className="mdur__value">{formatDurasiPanjang(menit)}</span>
                </div>
              </>
            )}

            {index > 0 && (
              <label className="munit-check">
                <input
                  type="checkbox"
                  checked={row.ganti_unit}
                  onChange={(e) => toggleGantiUnit(index, e.target.checked)}
                />
                Unit / SN berbeda mulai baris ini <span className="fopt">(opsional)</span>
              </label>
            )}

            {index > 0 && row.ganti_unit && (
              <div className="fgrid">
                <div className="fgroup">
                  <label className="flabel" htmlFor={idp + 'unit_model'}>
                    Model
                  </label>
                  <input
                    id={idp + 'unit_model'}
                    type="text"
                    className="finput"
                    value={row.unit_model}
                    onChange={(e) => updateRow(index, 'unit_model', e.target.value)}
                  />
                  {errs.unit_model && <p className="ferror">{errs.unit_model}</p>}
                </div>
                <div className="fgroup">
                  <label className="flabel" htmlFor={idp + 'unit_serial_no'}>
                    Serial no.
                  </label>
                  <input
                    id={idp + 'unit_serial_no'}
                    type="text"
                    className="finput"
                    value={row.unit_serial_no}
                    onChange={(e) => updateRow(index, 'unit_serial_no', e.target.value)}
                  />
                  {errs.unit_serial_no && <p className="ferror">{errs.unit_serial_no}</p>}
                </div>
              </div>
            )}

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