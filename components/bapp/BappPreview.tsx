import type { BappWithJobDesc } from '@/types/bapp';

interface BappPreviewProps {
  bapp: BappWithJobDesc;
}

export default function BappPreview({ bapp }: BappPreviewProps) {
  const editHref = '/bapp/' + bapp.id + '/jobdesc';
  const signHref = '/bapp/' + bapp.id + '/sign-mekanik';

  return (
    <div className="flex flex-col gap-4 px-4 pb-6">
      <div className="rounded-lg border p-4">
        <p className="mb-0.5 text-xs text-gray-500">Customer</p>
        <p className="mb-3 text-sm font-medium">
          {bapp.nama_customer ?? '-'} &middot;{' '}
          {bapp.tanggal_penyerahan
            ? new Date(bapp.tanggal_penyerahan).toLocaleDateString('id-ID')
            : '-'}
        </p>

        <p className="mb-0.5 text-xs text-gray-500">Unit</p>
        <p className="mb-3 text-sm">
          {bapp.unit_model ?? '-'} / {bapp.unit_serial_no ?? '-'} &middot; SMR {bapp.smr ?? '-'}
        </p>

        <p className="mb-1.5 text-xs text-gray-500">Pekerjaan ({bapp.job_desc.length})</p>
        <div className="flex flex-col gap-1.5 border-t pt-2">
          {bapp.job_desc.length === 0 && (
            <p className="text-xs text-gray-400">Belum ada pekerjaan diisi</p>
          )}
          {bapp.job_desc.map((row) => (
            <p key={row.id} className="text-sm">
              <span className="font-medium">{row.component}</span>
              {row.job_desc ? ' - ' + row.job_desc : ''}
            </p>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3">
        <span className="text-sm font-medium text-green-700">
          Kondisi unit: {bapp.kondisi_unit === 'baik' ? 'Baik' : 'Tidak baik'} &middot;{' '}
          {bapp.kesiapan_unit === 'siap' ? 'Siap operasi' : 'Tidak siap operasi'}
        </span>
      </div>

      <div className="rounded-lg bg-blue-50 px-4 py-3 text-xs text-blue-700">
        Pastikan data sudah benar. Setelah TTD mekanik, data unit dan pekerjaan akan terkunci.
      </div>

      <div className="flex gap-3">
        <a href={editHref} className="flex h-11 flex-1 items-center justify-center rounded-lg border text-sm font-medium">
          Edit
        </a>
        <a href={signHref} className="flex h-11 flex-1 items-center justify-center rounded-lg bg-black text-sm font-medium text-white">
          Lanjut TTD
        </a>
      </div>
    </div>
  );
}
