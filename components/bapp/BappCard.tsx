import StatusBadge from './StatusBadge';
import '@/styles/components/bapp/bapp-card.css';

interface BappCardProps {
  bapp: {
    id: string;
    unit_model: string | null;
    nama_customer: string | null;
    status: string;
    created_at: string;
  };
  /** Tujuan link. Kalau kosong, ditentukan dari status (alur mekanik). */
  href?: string;
  /** Teks tambahan sebelum tanggal, misalnya nama mekanik (dipakai admin). */
  by?: string;
}

export default function BappCard({ bapp, href, by }: BappCardProps) {
  const link = href ?? getHrefByStatus(bapp.id, bapp.status);
  const tanggal = new Date(bapp.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <a href={link} className="bapp-card">
      <div>
        <p className="bapp-card__title">
          {bapp.unit_model ?? '(belum diisi)'} &bull; {bapp.nama_customer ?? '(belum diisi)'}
        </p>
        <p className="bapp-card__date">{by ? `${by} \u2022 ${tanggal}` : tanggal}</p>
      </div>
      <StatusBadge status={bapp.status} />
    </a>
  );
}

function getHrefByStatus(id: string, status: string): string {
  switch (status) {
    case 'draft':
      return `/bapp/${id}/jobdesc`;
    case 'signed_mekanik':
      return `/bapp/${id}/customer`;
    case 'completed':
    case 'reviewed':
      return `/bapp/${id}/result`;
    default:
      return `/bapp/${id}/preview`;
  }
}