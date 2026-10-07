import type { BappWithJobDesc } from '@/types/bapp';
import '@/styles/pages/flow.css';

interface BappPreviewProps {
  bapp: BappWithJobDesc;
}

export default function BappPreview({ bapp }: BappPreviewProps) {
  const signHref = '/bapp/' + bapp.id + '/sign-mekanik';

  const tanggal = bapp.tanggal_penyerahan
    ? new Date(bapp.tanggal_penyerahan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : '-';

  return (
    <div className="fform">
      <div className="pcard">
        <p className="pcard__label">Customer</p>
        <p className="pcard__value">
          {bapp.nama_customer ?? '-'} &bull; {tanggal}
        </p>

        <p className="pcard__label">Unit</p>
        <p className="pcard__value">
          {bapp.unit_model ?? '-'} / {bapp.unit_serial_no ?? '-'} &bull; SMR {bapp.smr ?? '-'}
        </p>

        <p className="pcard__label">Pekerjaan ({bapp.job_desc.length})</p>
        <hr className="pcard__rule" />
        {bapp.job_desc.length === 0 && <p className="pcard__empty">Belum ada pekerjaan diisi</p>}
        {bapp.job_desc.map((row) => (
          <div key={row.id} className="pjob">
            <p className="pjob__title">
              {row.component}
              {row.job_desc ? ' \u2022 ' + row.job_desc : ''}
            </p>
            {row.remarks && <p className="pjob__remarks">{row.remarks}</p>}
          </div>
        ))}
      </div>

      <div className="pbanner">
        <CheckIcon />
        <span>
          Kondisi unit: {bapp.kondisi_unit === 'tidak_baik' ? 'Tidak baik' : 'Baik'} &bull;{' '}
          {bapp.kesiapan_unit === 'tidak_siap' ? 'Tidak siap operasi' : 'Siap operasi'}
        </span>
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

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
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