import Image from 'next/image';
import { createServerClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import SubPageHeader from '@/components/profile/SubPageHeader';
import StatusBadge from '@/components/bapp/StatusBadge';
import AdminBottomNav from '@/components/layout/AdminBottomNav';
import { adminBackHref } from '@/lib/adminBack';
import { formatDurasiRingkas, hitungDurasiMenit, jamTampil, kelompokWaktu } from '@/lib/mar';
import '@/styles/pages/admin.css';
import '@/styles/pages/admin-mekanik.css';
import '@/styles/pages/admin-detail.css';

interface MarRow {
  id: string;
  urutan: number;
  job_description: string | null;
  start_time: string | null;
  finish_time: string | null;
  status_job: string | null;
  unit_model?: string | null;
  unit_serial_no?: string | null;
  gabung_waktu?: boolean | null;
}

// Detail MAR untuk admin (hanya lihat), tampilannya sama dengan detail BAPP admin
export default async function AdminMarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/dashboard');

  const { data: mar } = await supabase.from('mar').select('*, rows:mar_rows(*)').eq('id', id).single();
  if (!mar) notFound();

  const { data: mekanik } = await supabase.from('users').select('name, email').eq('id', mar.mekanik_id).single();

  const rows: MarRow[] = (mar.rows ?? []).sort((a: MarRow, b: MarRow) => a.urutan - b.urutan);
  const akhirKelompok = new Map(kelompokWaktu(rows).map(([awal, akhir]) => [awal, akhir]));
  const backHref = await adminBackHref('/admin/history?type=mar', '/admin/mar/' + id);

  const tanggal = mar.tanggal
    ? new Date(mar.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : '-';

  const info: { label: string; value: string }[] = [
    { label: 'Dibuat oleh', value: (mekanik?.name ?? '-') + (mekanik?.email ? ' (' + mekanik.email + ')' : '') },
    { label: 'Dibuat', value: new Date(mar.created_at).toLocaleString('id-ID') },
    { label: 'Nama mekanik', value: mar.nama ?? '-' },
    { label: 'NRP', value: mar.nrp ?? '-' },
    { label: 'Tanggal pekerjaan', value: tanggal },
    { label: 'Model', value: mar.unit_model ?? '-' },
    { label: 'Serial no.', value: mar.unit_serial_no ?? '-' },
    { label: 'WO number', value: mar.wo_number ?? '-' },
    { label: 'NO operation', value: mar.no_operation ?? '-' },
    { label: 'SMR (HM/KM)', value: mar.smr ?? '-' },
  ];

  if (mar.status === 'completed') {
    info.push({
      label: 'Tanda tangan customer',
      value: (mar.nama_customer_ttd ?? '-') + ' \u2022 ' + (mar.jabatan_customer || 'Customer'),
    });
  }

  return (
    <div className="app-shell">
      <SubPageHeader title="Detail MAR" backHref={backHref} />

      <main className="mk-page">
        <div className="mk-inner mk-inner--narrow">
          <section className="ad-head">
            <div>
              <p className="ad-head__kind">MAR</p>
              <p className="ad-head__title">{mar.unit_model ?? '(belum diisi)'}</p>
              <p className="ad-head__sub">{mar.nama_customer ?? '-'}</p>
            </div>
            <StatusBadge status={mar.status} />
          </section>

          <section className="mkd-info">
            {info.map((item) => (
              <div key={item.label} className="mkd-info__row">
                <span className="mkd-info__label">{item.label}</span>
                <span className="mkd-info__value">{item.value}</span>
              </div>
            ))}
          </section>

          <p className="mkd-title">Rincian pekerjaan ({rows.length})</p>
          <div className="ad-card">
            {rows.length === 0 && <p className="ad-empty">Belum ada rincian pekerjaan</p>}
            {rows.map((row, index) => {
              const akhir = akhirKelompok.get(index);
              const menit = hitungDurasiMenit(row.start_time, row.finish_time);
              const status = row.status_job === 'F' ? 'Finish' : row.status_job === 'NF' ? 'Not Finish' : '-';
              const waktu =
                jamTampil(row.start_time) +
                ' - ' +
                jamTampil(row.finish_time) +
                (akhir === undefined
                  ? ' (sama dengan baris di atas)'
                  : ' \u2022 ' +
                    formatDurasiRingkas(menit) +
                    (akhir > index ? ' (baris ' + (index + 1) + '\u2013' + (akhir + 1) + ')' : ''));

              return (
                <div key={row.id} className="ad-job">
                  {(row.unit_model || row.unit_serial_no) && (
                    <p className="ad-job__unit">
                      Unit baru: {row.unit_model ?? '-'} / {row.unit_serial_no ?? '-'}
                    </p>
                  )}
                  <p className="ad-job__title">
                    {index + 1}. {row.job_description ?? '-'}
                  </p>
                  <p className="ad-job__meta">
                    {waktu} &bull; {status}
                  </p>
                </div>
              );
            })}
          </div>

          {mar.status === 'completed' ? (
            <a href={'/api/mar/' + mar.id + '/pdf'} target="_blank" rel="noopener noreferrer" className="mkd-btn">
              Buka PDF
            </a>
          ) : (
            <p className="ad-hint">PDF tersedia setelah customer menandatangani</p>
          )}
        </div>

        <div className="mkd-footer">
          <Image src="/moving-as-one.png" alt="Moving as one" width={250} height={89} />
        </div>
      </main>

      <AdminBottomNav active="history" />
    </div>
  );
}