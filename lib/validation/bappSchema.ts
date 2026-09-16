import { z } from 'zod';

export const jobDescRowSchema = z.object({
  component: z.string().min(1, 'Component wajib diisi'),
  job_desc: z.string().min(1, 'Job desc wajib diisi'),
  remarks: z.string().optional(),
});

export const unitDataSchema = z.object({
  tanggal_penyerahan: z.string().min(1, 'Tanggal wajib diisi'),
  nama_customer: z.string().min(1, 'Nama customer wajib diisi'),
  unit_model: z.string().min(1),
  unit_serial_no: z.string().min(1),
  unit_code: z.string().optional(),
  unit_location: z.string().min(1),
  engine_model: z.string().optional(),
  engine_serial_no: z.string().optional(),
  smr: z.string().optional(),
});

export const jobDescFormSchema = z.object({
  job_desc: z.array(jobDescRowSchema).min(1, 'Minimal 1 baris pekerjaan').max(10, 'Maksimal 10 baris'),
  kondisi_unit: z.enum(['baik', 'tidak_baik']),
  kesiapan_unit: z.enum(['siap', 'tidak_siap']),
});

export const customerSectionSchema = z.object({
  hasil_pekerjaan: z.enum(['memuaskan', 'tidak_memuaskan']),
  status_pekerjaan: z.enum(['selesai', 'tidak_selesai']),
  catatan_customer: z.string().optional(),
  nama_customer_ttd: z.string().min(1, 'Nama customer wajib diisi'),
});

export type UnitDataInput = z.infer<typeof unitDataSchema>;
export type JobDescFormInput = z.infer<typeof jobDescFormSchema>;
export type CustomerSectionInput = z.infer<typeof customerSectionSchema>;