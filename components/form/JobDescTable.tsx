'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { errorMessage } from '@/lib/errorMessage';
import '@/styles/pages/flow.css';

interface JobDescRow {
  component: string;
  job_desc: string;
  remarks: string;
}

interface WaktuProses {
  cust_request_at: string;
  mech_sent_at: string;
  start_diagnose_at: string;
  start_waiting_at: string;
  start_job_at: string;
  finish_job_at: string;
}

interface JobDescTableProps {
  bappId: string;
  initialRows?: { component: string | null; job_desc: string | null; remarks: string | null }[];
  initialWaktu?: Partial<WaktuProses>;
  initialKondisi?: 'baik' | 'tidak_baik' | null;
  initialKesiapan?: 'siap' | 'tidak_siap' | null;
}

const MAX_ROWS = 10;
const EMPTY_ROW: JobDescRow = { component: '', job_desc: '', remarks: '' };

const WAKTU_FIELDS: { key: keyof WaktuProses; label: string }[] = [
  { key: 'cust_request_at', label: 'Cust Request' },
  { key: 'mech_sent_at', label: 'Mech Sent' },
  { key: 'start_diagnose_at', label: 'Start Diagnose' },
  { key: 'start_waiting_at', label: 'Start Waiting' },
  { key: 'start_job_at', label: 'Start Job' },
  { key: 'finish_job_at', label: 'Finish Job' },
];

type Action = 'draft' | 'next' | null;

export default function JobDescTable({
  bappId,
  initialRows,
  initialWaktu,
  initialKondisi,
  initialKesiapan,
}: JobDescTableProps) {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [rows, setRows] = useState<JobDescRow[]>(
    initialRows && initialRows.length > 0
      ? initialRows.map((r) => ({ component: r.component ?? '', job_desc: r.job_desc ?? '', remarks: r.remarks ?? '' }))
      : [{ ...EMPTY_ROW }]
  );
  const [kondisiUnit, setKondisiUnit] = useState<'baik' | 'tidak_baik'>(initialKondisi ?? 'baik');
  const [kesiapanUnit, setKesiapanUnit] = useState<'siap' | 'tidak_siap'>(initialKesiapan ?? 'siap');
  const [waktu, setWaktu] = useState<WaktuProses>({
    cust_request_at: initialWaktu?.cust_request_at ?? '',
    mech_sent_at: initialWaktu?.mech_sent_at ?? '',
    start_diagnose_at: initialWaktu?.start_diagnose_at ?? '',
    start_waiting_at: initialWaktu?.start_waiting_at ?? '',
    start_job_at: initialWaktu?.start_job_at ?? '',
    finish_job_at: initialWaktu?.finish_job_at ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Action>(null);

  function updateRow(index: number, field: keyof JobDescRow, value: string) {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function updateWaktu(key: keyof WaktuProses, value: string) {
    setWaktu((prev) => ({ ...prev, [key]: value }));
  }

  function addRow() {
    if (rows.length >= MAX_ROWS) return;
    setRows((prev) => [...prev, { ...EMPTY_ROW }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave(goToPreview: boolean) {
    setError(null);

    const validRows = rows.filter((r) => r.component.trim() || r.job_desc.trim());
    if (goToPreview && validRows.length === 0) {
      setError('Minimal isi 1 baris pekerjaan.');
      return;
    }

    setBusy(goToPreview ? 'next' : 'draft');
    try {
      const { error: deleteError } = await supabase.from('bapp_job_desc').delete().eq('bapp_id', bappId);
      if (deleteError) throw deleteError;

      if (validRows.length > 0) {
        const { error: insertError } = await supabase.from('bapp_job_desc').insert(
          validRows.map((row, i) => ({
            bapp_id: bappId,
            urutan: i + 1,
            component: row.component,
            job_desc: row.job_desc,
            remarks: row.remarks || null,
          }))
        );
        if (insertError) throw insertError;
      }

      const waktuPayload: Record<string, string | null> = {};
      WAKTU_FIELDS.forEach(({ key }) => {
        waktuPayload[key] = waktu[key] ? new Date(waktu[key]).toISOString() : null;
      });

      const { error: updateError } = await supabase
        .from('bapp')
        .update({ kondisi_unit: kondisiUnit, kesiapan_unit: kesiapanUnit, ...waktuPayload })
        .eq('id', bappId);
      if (updateError) throw updateError;

      router.push(goToPreview ? '/bapp/' + bappId + '/preview' : '/dashboard');
    } catch (err) {
      setError(errorMessage(err, 'Gagal menyimpan data, coba lagi.'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fform">
      {rows.map((row, index) => (
        <div key={index} className="jrow">
          <div className="jrow__head">
            <span>Baris {index + 1}</span>
            {rows.length > 1 && (
              <button type="button" className="jrow__delete" onClick={() => removeRow(index)} aria-label={`Hapus baris ${index + 1}`}>
                <TrashIcon />
              </button>
            )}
          </div>
          <input
            type="text"
            className="finput"
            placeholder="Component"
            value={row.component}
            onChange={(e) => updateRow(index, 'component', e.target.value)}
          />
          <textarea
            className="finput"
            rows={1}
            placeholder="Job desk"
            value={row.job_desc}
            onChange={(e) => updateRow(index, 'job_desc', e.target.value)}
          />
          <input
            type="text"
            className="finput"
            placeholder="Remarks"
            value={row.remarks}
            onChange={(e) => updateRow(index, 'remarks', e.target.value)}
          />
        </div>
      ))}

      <button type="button" className="fbtn fbtn--block" onClick={addRow} disabled={rows.length >= MAX_ROWS}>
        {rows.length >= MAX_ROWS ? (
          'Maksimal 10 baris'
        ) : (
          <>
            <PlusIcon /> Tambah baris (maks.{MAX_ROWS})
          </>
        )}
      </button>

      <p className="flabel flabel--muted" style={{ marginTop: 20 }}>
        Kesimpulan uji coba
      </p>
      <div className="ftoggle-grid" style={{ marginBottom: 10 }}>
        <Toggle active={kondisiUnit === 'baik'} label="Baik" onClick={() => setKondisiUnit('baik')} />
        <Toggle active={kondisiUnit === 'tidak_baik'} label="Tidak baik" onClick={() => setKondisiUnit('tidak_baik')} />
        <Toggle active={kesiapanUnit === 'siap'} label="Siap" onClick={() => setKesiapanUnit('siap')} />
        <Toggle active={kesiapanUnit === 'tidak_siap'} label="Tidak siap" onClick={() => setKesiapanUnit('tidak_siap')} />
      </div>

      <p className="flabel flabel--muted" style={{ marginTop: 14 }}>
        Waktu proses
      </p>
      <p className="flow-note" style={{ marginTop: -2, fontWeight: 500 }}>
        Isi tanggal &amp; jam tiap tahapan (opsional, boleh dikosongkan)
      </p>
      {WAKTU_FIELDS.map(({ key, label }) => (
        <div key={key} className="wrow">
          <span className="wrow__label">{label}</span>
          <input type="datetime-local" className="finput" value={waktu[key]} onChange={(e) => updateWaktu(key, e.target.value)} />
        </div>
      ))}

      {error && <p className="fmessage">{error}</p>}

      <div className="factions">
        <button type="button" className="fbtn" onClick={() => handleSave(false)} disabled={busy !== null}>
          {busy === 'draft' ? 'Menyimpan...' : 'Simpan draft'}
        </button>
        <button type="button" className="fbtn fbtn--primary" onClick={() => handleSave(true)} disabled={busy !== null}>
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