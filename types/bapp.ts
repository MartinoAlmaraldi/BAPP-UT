export type BappStatus = 'draft' | 'signed_mekanik' | 'completed' | 'reviewed';

export type KondisiUnit = 'baik' | 'tidak_baik';
export type KesiapanUnit = 'siap' | 'tidak_siap';
export type HasilPekerjaan = 'memuaskan' | 'tidak_memuaskan';
export type StatusPekerjaan = 'selesai' | 'tidak_selesai';
export type UserRole = 'mekanik' | 'admin';

export interface JobDescRow {
  id: string;
  bapp_id: string;
  urutan: number;
  component: string | null;
  job_desc: string | null;
  remarks: string | null;
}

export interface Bapp {
  id: string;
  nomor_form: string;
  tanggal_penyerahan: string | null;
  nama_customer: string | null;

  unit_model: string | null;
  unit_serial_no: string | null;
  unit_code: string | null;
  unit_location: string | null;
  engine_model: string | null;
  engine_serial_no: string | null;
  smr: string | null;

  kondisi_unit: KondisiUnit | null;
  kesiapan_unit: KesiapanUnit | null;
  hasil_pekerjaan: HasilPekerjaan | null;
  status_pekerjaan: StatusPekerjaan | null;

  catatan_mekanik: string | null;
  catatan_customer: string | null;

  status: BappStatus;
  mekanik_id: string;

  nama_customer_ttd: string | null;
  signature_mekanik_url: string | null;
  signature_customer_url: string | null;
  signed_mekanik_at: string | null;
  signed_customer_at: string | null;

  pdf_url: string | null;
  is_synced: boolean;

  cust_request_at: string | null;
  mech_sent_at: string | null;
  start_diagnose_at: string | null;
  start_waiting_at: string | null;
  start_job_at: string | null;
  finish_job_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface BappWithJobDesc extends Bapp {
  job_desc: JobDescRow[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}