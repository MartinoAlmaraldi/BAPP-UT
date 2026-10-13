import StatusBadge from '@/components/bapp/StatusBadge';
import '@/styles/pages/admin.css';

export interface AdminBappRow {
  id: string;
  unit_model: string | null;
  nama_customer: string | null;
  status: string;
  created_at: string;
  mekanikName: string;
}

// Tabel BAPP untuk layar desktop (disembunyikan lewat CSS di mobile dan tablet)
export default function AdminBappTable({ rows }: { rows: AdminBappRow[] }) {
  if (rows.length === 0) return null;

  return (
    <div className="admin-table">
      <div className="admin-table__head">
        <span>Unit</span>
        <span>Customer</span>
        <span>Mekanik</span>
        <span>Tanggal</span>
        <span className="admin-table__status">Status</span>
      </div>
      {rows.map((row) => (
        <a key={row.id} href={'/admin/bapp/' + row.id} className="admin-table__row">
          <span className="admin-table__unit">{row.unit_model ?? '(belum diisi)'}</span>
          <span>{row.nama_customer ?? '(belum diisi)'}</span>
          <span className="admin-table__muted">{row.mekanikName}</span>
          <span className="admin-table__muted">
            {new Date(row.created_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          <span className="admin-table__status">
            <StatusBadge status={row.status} />
          </span>
        </a>
      ))}
    </div>
  );
}