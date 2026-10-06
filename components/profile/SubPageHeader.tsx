import AppHeader from '@/components/layout/AppHeader';
import { BackIcon } from '@/components/auth/AuthIcons';
import '@/styles/pages/profile.css';

interface SubPageHeaderProps {
  title: string;
  backHref: string;
}

export default function SubPageHeader({ title, backHref }: SubPageHeaderProps) {
  return (
    <AppHeader>
      <div className="psub-bar">
        <a href={backHref} className="psub-bar__back" aria-label="Kembali">
          <BackIcon size={22} />
        </a>
        <p className="psub-bar__title">{title}</p>
      </div>
    </AppHeader>
  );
}