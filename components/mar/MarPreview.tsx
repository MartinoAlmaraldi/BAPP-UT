import { formatDurasiRingkas, hitungDurasiMenit, jamTampil } from '@/lib/mar';
import '@/styles/pages/flow.css';

interface MarPreviewProps {
  mar: {
    id: string;
    nama: string | null;
    nrp: string | null;
    tanggal: string | null;
    nama_customer: string | null;
    unit_model: string | null;
    unit_serial_no: string | null;
    wo_number: string | null;
    no_operation: string | null;
    smr: string | null;
    rows: {
      id: string;
      job_description: string | null;
      start_time: string | null;
      finish_time: string | null;
      status_job: string | null;
    }[];
  };
}

export default function MarPreview({ mar }: MarPreviewProps) {
  const signHref = '/mar/' + mar.id + '/sign-mekanik';

  const tanggal = mar.tanggal
    ? new Date(mar.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="fform">
      <div className="pcard">
        <p className="pcard__label">Nama mekanik</p>
        <p className="pcard__value">{mar.nama ?? '-'}</p>

        <p className="pcard__label">NRP</p>
        <p className="pcard__value">{mar.nrp ?? '-'}</p>

        <p className="pcard__label">Customer</p>
        <p className="pcard__value">
          {mar.nama_customer ?? '-'}
          {tanggal ? ' \u2022 ' + tanggal : ''}
        </p>

        <p className="pcard__label">Unit</p>
        <p className="pcard__value">
          {mar.unit_model ?? '-'} / {mar.unit_serial_no ?? '-'} &bull; SMR {mar.smr ?? '-'}
        </p>

        <p className="pcard__label">WO number</p>
        <p className="pcard__value">{mar.wo_number ?? '-'}</p>

        <p className="pcard__label">NO operation</p>
        <p className="pcard__value">{mar.no_operation ?? '-'}</p>

        <p className="pcard__label">Detail pekerjaan ({mar.rows.length})</p>
        <hr className="pcard__rule" />
        {mar.rows.length === 0 && <p className="pcard__empty">Belum ada rincian pekerjaan</p>}
        {mar.rows.map((row) => {
          const menit = hitungDurasiMenit(row.start_time, row.finish_time);
          const status = row.status_job === 'F' ? ' \u2022 Finish' : row.status_job === 'NF' ? ' \u2022 Not Finish' : '';
          return (
            <div key={row.id} className="pjob">
              <p className="pjob__title">{row.job_description ?? '-'}</p>
              <p className="pjob__remarks">
                {jamTampil(row.start_time) + ' - ' + jamTampil(row.finish_time) + ' \u2022 ' + formatDurasiRingkas(menit) + status}
              </p>
            </div>
          );
        })}
      </div>

      <p className="pinfo">
        <InfoIcon />
        <span>Pastikan data sudah benar. Setelah tanda tangan mekanik, data unit dan pekerjaan akan terkunci.</span>
      </p>

      <div className="factions factions--split">
        <a href="/dashboard" className="fbtn">
          Simpan draft
        </a>
        <a href={signHref} className="fbtn fbtn--primary">
          Lanjut tanda tangan
        </a>
      </div>
    </div>
  );
}

function InfoIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}