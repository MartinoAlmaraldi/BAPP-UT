import Image from 'next/image';
import AppHeader from '@/components/layout/AppHeader';
import LogoutButton from '@/components/auth/LogoutButton';
import '@/styles/pages/profile.css';

interface ProfileViewProps {
  name: string;
  email: string;
  role: 'admin' | 'mekanik';
  statLabel: string;
  statValue: number;
}

export default function ProfileView({ name, email, role, statLabel, statValue }: ProfileViewProps) {
  const initials = (name || 'U').trim().slice(0, 2).toUpperCase();

  return (
    <>
      <AppHeader>
        <p className="profile-bar__title">Akun</p>
      </AppHeader>

      <main className="profile">
        <div className="profile__inner">
          <div className="profile-card">
            <div className="profile-card__avatar">{initials}</div>
            <div>
              <p className="profile-card__name">{name}</p>
              <p className="profile-card__email">{email}</p>
              <span className={role === 'admin' ? 'profile-badge profile-badge--admin' : 'profile-badge'}>
                {role === 'admin' ? 'Admin' : 'Mekanik'}
              </span>
            </div>
          </div>

          <div className="profile-stat">
            <p className="profile-stat__label">{statLabel}</p>
            <p className="profile-stat__value">{statValue}</p>
          </div>

          <LogoutButton />
        </div>

        <div className="profile__footer">
          <Image src="/moving-as-one.png" alt="Moving as one" width={190} height={56} />
        </div>
      </main>
    </>
  );
}