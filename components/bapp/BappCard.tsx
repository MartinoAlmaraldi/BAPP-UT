import StatusBadge from './StatusBadge';

interface BappCardProps {
  bapp: {
    id: string;
    unit_model: string | null;
    nama_customer: string | null;
    status: string;
    created_at: string;
  };
}

export default function BappCard({ bapp }: BappCardProps) {
  const href = getHrefByStatus(bapp.id, bapp.status);

  return (
    <a href={href} className="flex items-center justify-between rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">
          {bapp.unit_model ?? '(belum diisi)'} &middot; {bapp.nama_customer ?? '(belum diisi)'}
        </p>
        <p className="mt-0.5 text-xs text-gray-500">
          {new Date(bapp.created_at).toLocaleDateString('id-ID')}
        </p>
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