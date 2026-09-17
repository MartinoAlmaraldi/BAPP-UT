'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';

interface JobDescRow {
  component: string;
  job_desc: string;
  remarks: string;
}

interface JobDescTableProps {
  bappId: string;
  initialRows?: JobDescRow[];
}

const MAX_ROWS = 10;
const EMPTY_ROW: JobDescRow = { component: '', job_desc: '', remarks: '' };

export default function JobDescTable({ bappId, initialRows }: JobDescTableProps) {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [rows, setRows] = useState<JobDescRow[]>(
    initialRows && initialRows.length > 0 ? initialRows : [{ ...EMPTY_ROW }]
  );
  const [kondisiUnit, setKondisiUnit] = useState<'baik' | 'tidak_baik'>('baik');
  const [kesiapanUnit, setKesiapanUnit] = useState<'siap' | 'tidak_siap'>('siap');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateRow(index: number, field: keyof JobDescRow, value: string) {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
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
    setLoading(true);

    try {
      const validRows = rows.filter((r) => r.component.trim() || r.job_desc.trim());

      if (goToPreview && validRows.length === 0) {
        setError('Minimal isi 1 baris pekerjaan.');
        setLoading(false);
        return;
      }

      // Hapus dulu job desc lama untuk BAPP ini, lalu insert ulang (cara paling sederhana untuk sinkronisasi baris dinamis)
      const { error: deleteError } = await supabase
        .from('bapp_job_desc')
        .delete()
        .eq('bapp_id', bappId);

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

      const { error: updateError } = await supabase
        .from('bapp')
        .update({ kondisi_unit: kondisiUnit, kesiapan_unit: kesiapanUnit })
        .eq('id', bappId);

      if (updateError) throw updateError;

      if (goToPreview) {
        router.push(`/bapp/${bappId}/preview`);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data, coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 px-4 pb-6">
      <p className="text-xs text-gray-500">
        Pekerjaan ({rows.length}/{MAX_ROWS} baris)
      </p>

      <div className="flex flex-col gap-2">
        {rows.map((row, index) => (
          <div key={index} className="rounded-lg border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-gray-400">Baris {index + 1}</span>
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="text-xs text-red-500"
                >
                  Hapus
                </button>
              )}
            </div>
            <input
              type="text"
              placeholder="Component"
              value={row.component}
              onChange={(e) => updateRow(index, 'component', e.target.value)}
              className="mb-2 w-full rounded-lg border px-3 py-2 text-sm"
            />
            <textarea
              placeholder="Job desc"
              value={row.job_desc}
              onChange={(e) => updateRow(index, 'job_desc', e.target.value)}
              className="mb-2 min-h-[60px] w-full rounded-lg border px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Remarks"
              value={row.remarks}
              onChange={(e) => updateRow(index, 'remarks', e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        disabled={rows.length >= MAX_ROWS}
        className="h-10 w-full rounded-lg border text-sm font-medium disabled:opacity-40"
      >
        {rows.length >= MAX_ROWS ? 'Maksimal 10 baris' : '+ Tambah baris'}
      </button>

      <p className="mt-2 text-sm font-medium">Kesimpulan uji coba</p>
      <div className="flex gap-2">
        <ToggleButton
          active={kondisiUnit === 'baik'}
          label="Baik"
          onClick={() => setKondisiUnit('baik')}
        />
        <ToggleButton
          active={kondisiUnit === 'tidak_baik'}
          label="Tidak baik"
          onClick={() => setKondisiUnit('tidak_baik')}
        />
      </div>
      <div className="flex gap-2">
        <ToggleButton
          active={kesiapanUnit === 'siap'}
          label="Siap"
          onClick={() => setKesiapanUnit('siap')}
        />
        <ToggleButton
          active={kesiapanUnit === 'tidak_siap'}
          label="Tidak siap"
          onClick={() => setKesiapanUnit('tidak_siap')}
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={() => handleSave(false)}
          disabled={loading}
          className="h-11 flex-1 rounded-lg border text-sm font-medium disabled:opacity-50"
        >
          Simpan draft
        </button>
        <button
          type="button"
          onClick={() => handleSave(true)}
          disabled={loading}
          className="h-11 flex-1 rounded-lg bg-black text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : 'Lanjut'}
        </button>
      </div>
    </div>
  );
}

function ToggleButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  const className = active
    ? 'flex-1 rounded-lg py-2 text-center text-sm font-medium bg-green-100 text-green-700'
    : 'flex-1 rounded-lg border py-2 text-center text-sm text-gray-500';

  return (
    <button type="button" onClick={onClick} className={className}>
      {label}
    </button>
  );
}