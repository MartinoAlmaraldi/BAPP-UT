const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600' },
  signed_mekanik: { label: 'Sign mekanik', className: 'bg-amber-100 text-amber-800' },
  completed: { label: 'Selesai', className: 'bg-green-100 text-green-700' },
  reviewed: { label: 'Direview', className: 'bg-blue-100 text-blue-700' },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}