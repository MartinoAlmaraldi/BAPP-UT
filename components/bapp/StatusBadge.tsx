import '@/styles/components/bapp/status-badge.css';

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  signed_mekanik: 'Sign mekanik',
  completed: 'Selesai',
  reviewed: 'Direview',
};

export default function StatusBadge({ status }: { status: string }) {
  const key = STATUS_LABEL[status] ? status : 'draft';
  return <span className={`status-badge status-badge--${key}`}>{STATUS_LABEL[key]}</span>;
}