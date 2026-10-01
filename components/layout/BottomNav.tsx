import NavBar from './NavBar';

interface BottomNavProps {
  active: 'dashboard' | 'history' | 'profile';
}

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: 'home' },
  { key: 'history', label: 'History', href: '/history', icon: 'history' },
  { key: 'profile', label: 'Profile', href: '/profile', icon: 'profile' },
] as const;

export default function BottomNav({ active }: BottomNavProps) {
  return <NavBar items={NAV_ITEMS} active={active} />;
}