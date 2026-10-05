import Image from 'next/image';
import Link from 'next/link';
import { BackIcon } from './AuthIcons';
import '@/styles/components/auth/auth-header.css';

type Props = {
  backHref?: string;
  showBack?: boolean;
  showLogo?: boolean;
};

export default function AuthHeader({ backHref = '/', showBack = true, showLogo = true }: Props) {
  return (
    <div className="auth-header">
      <svg
        className="auth-header__wave"
        viewBox="0 0 393 212"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 0H393V209C360 214 320 212 270 200C220 188 180 160 120 142C80 130 40 118 0 112Z"
          fill="currentColor"
        />
      </svg>

      {showBack && (
        <Link href={backHref} className="auth-header__back" aria-label="Kembali">
          <BackIcon />
        </Link>
      )}

      {showLogo && (
        <Image
          className="auth-header__logo"
          src="/logo-ut.png"
          alt="United Tractors"
          width={274}
          height={55}
          priority
        />
      )}
    </div>
  );
}