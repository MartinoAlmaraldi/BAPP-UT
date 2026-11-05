import { z } from 'zod';

export const MAX_MAR_ROWS = 46;

const wajib = (pesan: string) => z.string().trim().min(1, pesan);

// Langkah 1: informasi mekanik dan unit
export const marInfoSchema = z.object({
  nama: z.string().optional(),
  nrp: z.string().optional(),
  tanggal: z.string().optional(),
  nama_customer: z.string().optional(),
  unit_model: wajib('Model wajib diisi'),
  unit_serial_no: wajib('Serial no. wajib diisi'),
});

// Langkah 2: WO, NO operation, SMR, dan rincian pekerjaan
export const marRowSchema = z
  .object({
    job_description: wajib('Job description wajib diisi'),
    start_time: wajib('Start wajib diisi'),
    finish_time: wajib('Finish wajib diisi'),
    status_job: z.enum(['F', 'NF'], { error: 'Status Job wajib dipilih' }),
    // Opsional: unit / SN berbeda untuk baris ini (kasus langka)
    ganti_unit: z.boolean().optional(),
    // Opsional: Start/Finish sama dengan baris sebelumnya
    gabung_waktu: z.boolean().optional(),
    unit_model: z.string().optional(),
    unit_serial_no: z.string().optional(),
  })
  .superRefine((row, ctx) => {
    if (!row.ganti_unit) return;
    if (!row.unit_model?.trim()) ctx.addIssue({ code: 'custom', path: ['unit_model'], message: 'Model wajib diisi' });
    if (!row.unit_serial_no?.trim())
      ctx.addIssue({ code: 'custom', path: ['unit_serial_no'], message: 'Serial no. wajib diisi' });
  });

export const marDetailSchema = z.object({
  wo_number: z.string().optional(),
  no_operation: z.string().optional(),
  smr: z.string().optional(),
  rows: z
    .array(marRowSchema)
    .min(1, 'Minimal 1 rincian pekerjaan')
    .max(MAX_MAR_ROWS, 'Maksimal ' + MAX_MAR_ROWS + ' baris'),
});

export type MarInfoInput = z.infer<typeof marInfoSchema>;