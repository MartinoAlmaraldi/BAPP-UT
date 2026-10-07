import AppHeader from '@/components/layout/AppHeader';
import { BackIcon } from '@/components/auth/AuthIcons';
import '@/styles/pages/flow.css';

interface FlowHeaderProps {
  title: string;
  backHref?: string;
  /** Langkah aktif (1 sampai 3). Kosongkan kalau halaman tidak punya indikator langkah. */
  step?: 1 | 2 | 3;
}

export default function FlowHeader({ title, backHref, step }: FlowHeaderProps) {
  return (
    <AppHeader>
      <div className="flow-bar">
        {backHref && (
          <a href={backHref} className="flow-bar__back" aria-label="Kembali">
            <BackIcon size={22} />
          </a>
        )}
        <p className="flow-bar__title">{title}</p>
      </div>

      {step && (
        <div className="flow-progress" aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <span key={n} className={n === step ? 'flow-progress__seg flow-progress__seg--on' : 'flow-progress__seg'} />
          ))}
        </div>
      )}
    </AppHeader>
  );
}