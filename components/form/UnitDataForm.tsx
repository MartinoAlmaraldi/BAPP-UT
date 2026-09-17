'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createBrowserClient } from '@/lib/supabase/client';
import { unitDataSchema, type UnitDataInput } from '@/lib/validation/bappSchema';

interface UnitDataFormProps {
  bappId?: string; // kalau ada, berarti edit draft yang sudah ada
  defaultValues?: Partial<UnitDataInput>;
}

export default function UnitDataForm({ bappId, defaultValues }: UnitDataFormProps) {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UnitDataInput>({
    resolver: zodResolver(unitDataSchema),
    defaultValues,
  });

  async function onSubmit(data: UnitDataInput) {
    setError(null);
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      if (bappId) {
        // Update draft yang sudah ada
        const { error: updateError } = await supabase
          .from('bapp')
          .update(data)
          .eq('id', bappId);

        if (updateError) throw updateError;
        router.push(`/bapp/${bappId}/jobdesc`);
      } else {
        // Buat BAPP baru sebagai draft
        const { data: newBapp, error: insertError } = await supabase
          .from('bapp')
          .insert({ ...data, mekanik_id: user.id, status: 'draft' })
          .select('id')
          .single();

        if (insertError) throw insertError;
        router.push(`/bapp/${newBapp.id}/jobdesc`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data, coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4 pb-6">
      <div>
        <label className="mb-1 block text-xs text-gray-500">Tanggal penyerahan</label>
        <input
          type="date"
          {...register('tanggal_penyerahan')}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
        {errors.tanggal_penyerahan && (
          <p className="mt-1 text-xs text-red-600">{errors.tanggal_penyerahan.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs text-gray-500">Nama customer</label>
        <input
          type="text"
          placeholder="PT Sawit Makmur"
          {...register('nama_customer')}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
        {errors.nama_customer && (
          <p className="mt-1 text-xs text-red-600">{errors.nama_customer.message}</p>
        )}
      </div>

      <p className="mt-2 text-sm font-medium">Unit</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Model</label>
          <input
            type="text"
            placeholder="PC200-8"
            {...register('unit_model')}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          {errors.unit_model && (
            <p className="mt-1 text-xs text-red-600">{errors.unit_model.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Serial no.</label>
          <input
            type="text"
            {...register('unit_serial_no')}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          {errors.unit_serial_no && (
            <p className="mt-1 text-xs text-red-600">{errors.unit_serial_no.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Code unit</label>
          <input
            type="text"
            {...register('unit_code')}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Location</label>
          <input
            type="text"
            {...register('unit_location')}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          {errors.unit_location && (
            <p className="mt-1 text-xs text-red-600">{errors.unit_location.message}</p>
          )}
        </div>
      </div>

      <p className="mt-2 text-sm font-medium">Engine</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Model</label>
          <input
            type="text"
            {...register('engine_model')}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Serial no.</label>
          <input
            type="text"
            {...register('engine_serial_no')}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-gray-500">SMR (HM/KM)</label>
        <input
          type="text"
          {...register('smr')}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 h-11 w-full rounded-lg bg-black text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? 'Menyimpan...' : 'Lanjut'}
      </button>
    </form>
  );
}