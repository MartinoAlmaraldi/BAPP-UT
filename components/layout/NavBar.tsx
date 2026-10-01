'use client';

import { useEffect, useState } from 'react';
import { HomeNavIcon, HistoryNavIcon, ProfileNavIcon, UsersNavIcon, MenuIcon, CollapseIcon } from './NavIcons';
import '@/styles/components/layout/bottom-nav.css';

export type NavItem = {
  key: string;
  label: string;
  href: string;
  icon: 'home' | 'history' | 'profile' | 'users';
};

interface NavBarProps {
  items: readonly NavItem[];
  active: string;
}

const ICONS = {
  home: HomeNavIcon,
  history: HistoryNavIcon,
  profile: ProfileNavIcon,
  users: UsersNavIcon,
} as const;

const STORAGE_KEY = 'bapp-sidebar-open';

export default function NavBar({ items, active }: NavBarProps) {
  const [open, setOpen] = useState(true);
  const [ready, setReady] = useState(false);

  // Baca pilihan terakhir dari browser
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'false') setOpen(false);
    } catch {
      // abaikan kalau storage tidak tersedia
    }
    setReady(true);
  }, []);

  // Terapkan ke halaman dan simpan pilihan
  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.sidebar = open ? 'open' : 'closed';
    try {
      localStorage.setItem(STORAGE_KEY, String(open));
    } catch {
      // abaikan
    }
  }, [open, ready]);

  return (
    <nav className="bottom-nav">
      {/* Tombol buka/tutup: hanya tampil di desktop */}
      <button
        type="button"
        className="bottom-nav__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Kecilkan menu' : 'Lebarkan menu'}
      >
        {open ? <CollapseIcon size={22} /> : <MenuIcon size={22} />}
      </button>

      {items.map(({ key, label, href, icon }) => {
        const Icon = ICONS[icon];
        const isActive = active === key;
        return (
          <a
            key={key}
            href={href}
            title={label}
            className={isActive ? 'bottom-nav__item bottom-nav__item--active' : 'bottom-nav__item'}
          >
            <Icon />
            <span className="bottom-nav__label">{label}</span>
          </a>
        );
      })}
    </nav>
  );
}