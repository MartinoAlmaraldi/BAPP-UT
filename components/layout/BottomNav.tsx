interface BottomNavProps {
  active: 'dashboard' | 'history' | 'profile';
}

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { key: 'history', label: 'History', href: '/history' },
  { key: 'profile', label: 'Akun', href: '/profile' },
] as const;

export default function BottomNav({ active }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 flex justify-around border-t bg-white py-2">
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.key;
        const linkClass = isActive
          ? 'flex flex-col items-center gap-0.5 text-xs text-black'
          : 'flex flex-col items-center gap-0.5 text-xs text-gray-400';

        return (
          <a key={item.key} href={item.href} className={linkClass}>
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
