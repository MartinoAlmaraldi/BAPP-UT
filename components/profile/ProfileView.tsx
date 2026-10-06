import Image from 'next/image';
import AppHeader from '@/components/layout/AppHeader';
import LogoutButton from '@/components/auth/LogoutButton';
import { UserIcon } from '@/components/auth/AuthIcons';
import '@/styles/pages/profile.css';

interface ProfileViewProps {
  name: string;
  role: 'admin' | 'mekanik';
  nrp?: string | null;
  avatarUrl?: string | null;
  infoHref: string;
  securityHref: string;
}

export default function ProfileView({ name, role, nrp, avatarUrl, infoHref, securityHref }: ProfileViewProps) {
  return (
    <>
      <AppHeader>
        <p className="profile-bar__title">Profile</p>
      </AppHeader>

      <main className="profile">
        <div className="profile__inner">
          <section className="profile-card">
            <div className="profile-avatar">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Foto profil" />
              ) : (
                <UserIcon size={64} />
              )}
            </div>
            <p className="profile-card__name">{name || '-'}</p>
            <p className="profile-card__role">{role === 'admin' ? 'Admin' : 'Mekanik'}</p>
            {nrp && <p className="profile-card__nrp">{nrp}</p>}
          </section>

          <section className="profile-card profile-card--nav">
            <p className="profile-nav__title">Navigasi akun</p>

            <a href={infoHref} className="profile-nav__item">
              <span className="profile-nav__icon">
                <UserIcon size={22} />
              </span>
              <span className="profile-nav__label">Informasi pribadi</span>
              <ChevronRight />
            </a>

            <a href={securityHref} className="profile-nav__item">
              <span className="profile-nav__icon">
                <LockOutlineIcon />
              </span>
              <span className="profile-nav__label">Kata sandi dan keamanan</span>
              <ChevronRight />
            </a>

            <div className="profile-nav__logout">
              <LogoutButton />
            </div>
          </section>
        </div>

        <div className="profile__footer">
          <Image src="/moving-as-one.png" alt="Moving as one" width={250} height={89} />
        </div>
      </main>
    </>
  );
}

function ChevronRight() {
  return (
    <svg
      className="profile-nav__chevron"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

function LockOutlineIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}