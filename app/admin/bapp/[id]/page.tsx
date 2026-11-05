import Image from 'next/image';
import { createServerClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import SubPageHeader from '@/components/profile/SubPageHeader';
import StatusBadge from '@/components/bapp/StatusBadge';
import AdminBottomNav from '@/components/layout/AdminBottomNav';
import { adminBackHref } from '@/lib/adminBack';
import '@/styles/pages/admin.css';
import '@/styles/pages/admin-mekanik.css';
import '@/styles/pages/admin-detail.css';

interface JobDescRow {
  id: string;
  urutan: number;
  component: string | null;
  job_desc: string | null;
}

export default async function AdminBappDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/dashboard');

  const { data: bapp } = await supabase
    .from('bapp')
    .select('*, job_desc:bapp_job_desc(*)')
    .eq('id', id)
    .single();

  if (!bapp) {
    // Link lama yang mengarah ke /admin/bapp/<id MAR>: alihkan ke halaman detail MAR
    const { data: mar } = await supabase.from('mar').select('id').eq('id', id).maybeSingle();
    if (mar) redirect('/admin/mar/' + id);
    notFound();
  }

  const { data: mekanik } = await supabase.from('users').select('name, email').eq('id', bapp.mekanik_id).single();

  const jobs: JobDescRow[] = (bapp.job_desc ?? []).sort((a: JobDescRow, b: JobDescRow) => a.urutan - b.urutan);
  const backHref = await adminBackHref('/admin/dashboard', '/admin/bapp/' + id);
  const selesai = bapp.status === 'completed' || bapp.status === 'reviewed';

  const info: { label: string; value: string }[] = [
    { label: 'Dibuat oleh', value: (mekanik?.name ?? '-') + (mekanik?.email ? ' (' + mekanik.email + ')' : '') },
    { label: 'Dibuat', value: new Date(bapp.created_at).toLocaleString('id-ID') },
    { label: 'Model', value: bapp.unit_model ?? '-' },
    { label: 'Serial no.', value: bapp.unit_serial_no ?? '-' },
    { label: 'SMR', value: bapp.smr ?? '-' },
    { label: 'Lokasi unit', value: bapp.unit_location ?? '-' },
  ];

  return (
    <div className="app-shell">
      <SubPageHeader title="Detail BAPP" backHref={backHref} />

      <main className="mk-page">
        <div className="mk-inner mk-inner--narrow">
          <section className="ad-head">
            <div>
              <p className="ad-head__kind">BAPP</p>
              <p className="ad-head__title">{bapp.unit_model ?? '(belum diisi)'}</p>
              <p className="ad-head__sub">{bapp.nama_customer ?? '-'}</p>
            </div>
            <StatusBadge status={bapp.status} />
          </section>

          <section className="mkd-info">
            {info.map((item) => (
              <div key={item.label} className="mkd-info__row">
                <span className="mkd-info__label">{item.label}</span>
                <span className="mkd-info__value">{item.value}</span>
              </div>
            ))}
          </section>

          <p className="mkd-title">Pekerjaan ({jobs.length})</p>
          <div className="ad-card">
            {jobs.length === 0 && <p className="ad-empty">Belum ada pekerjaan diisi</p>}
            {jobs.map((row, index) => (
              <div key={row.id} className="ad-job">
                <p className="ad-job__title">
                  {index + 1}. {row.component ?? '-'}
                </p>
                {row.job_desc && <p className="ad-job__meta">{row.job_desc}</p>}
              </div>
            ))}
          </div>

          {bapp.catatan_mekanik && (
            <>
              <p className="mkd-title">Catatan mekanik</p>
              <div className="ad-card">
                <p className="ad-note">{bapp.catatan_mekanik}</p>
              </div>
            </>
          )}

          {bapp.catatan_customer && (
            <>
              <p className="mkd-title">Catatan customer</p>
              <div className="ad-card">
                <p className="ad-note">{bapp.catatan_customer}</p>
              </div>
            </>
          )}

          {selesai ? (
            <a href={'/api/bapp/' + bapp.id + '/pdf'} target="_blank" rel="noopener noreferrer" className="mkd-btn">
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