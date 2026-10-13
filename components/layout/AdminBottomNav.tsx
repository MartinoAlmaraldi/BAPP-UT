import NavBar from './NavBar';

interface AdminBottomNavProps {
  active: 'dashboard' | 'history' | 'mekanik' | 'profile';
}

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', href: '/admin/dashboard', icon: 'home' },
  { key: 'history', label: 'History', href: '/admin/history', icon: 'history' },
  { key: 'mekanik', label: 'Mekanik', href: '/admin/mekanik', icon: 'users' },
  { key: 'profile', label: 'Akun', href: '/admin/profile', icon: 'profile' },
] as const;

export default function AdminBottomNav({ active }: AdminBottomNavProps) {
  return <NavBar items={NAV_ITEMS} active={active} />;
}