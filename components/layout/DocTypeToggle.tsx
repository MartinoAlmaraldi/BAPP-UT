import '@/styles/components/layout/doc-type-toggle.css';

export type DocType = 'bapp' | 'mar';

export function parseDocType(value: string | string[] | undefined): DocType {
  const v = Array.isArray(value) ? value[0] : value;
  return v === 'mar' ? 'mar' : 'bapp';
}

interface DocTypeToggleProps {
  active: DocType;
  /** Membuat href untuk tiap pilihan, supaya parameter lain (filter, pencarian) tetap terbawa. */
  hrefFor: (type: DocType) => string;
}

export default function DocTypeToggle({ active, hrefFor }: DocTypeToggleProps) {
  const options: { value: DocType; label: string }[] = [
    { value: 'bapp', label: 'BAPP' },
    { value: 'mar', label: 'MAR' },
  ];
  return (
    <div className="doc-toggle" role="tablist" aria-label="Jenis dokumen">
      {options.map((o) => (
        <a
          key={o.value}
          href={hrefFor(o.value)}
          role="tab"
          aria-selected={active === o.value}
          className={active === o.value ? 'doc-toggle__opt doc-toggle__opt--active' : 'doc-toggle__opt'}
        >
          {o.label}
        </a>
      ))}
    </div>
  );
}