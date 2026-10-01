type IconProps = { size?: number };

function Svg({ size = 26, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 26 26"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function HomeNavIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3.5 12.5 13 4l9.5 8.5" />
      <path d="M5.5 11v10a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V11" />
      <path d="M10.5 22v-6h5v6" />
    </Svg>
  );
}

export function HistoryNavIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3.5 13a9.5 9.5 0 1 0 3-7" />
      <path d="M3.5 4.5v5h5" />
      <path d="M13 8v5.5l3.5 2" />
    </Svg>
  );
}

export function ProfileNavIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="10.5" cy="8" r="4" />
      <path d="M3 22c0-4.2 3.4-7.5 7.5-7.5 1 0 2 .2 2.9.6" />
      <path d="M15 22l.9-3.6 6-6a1.7 1.7 0 0 1 2.4 2.4l-6 6z" />
    </Svg>
  );
}

export function UsersNavIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="9.5" cy="9" r="3.5" />
      <path d="M2.5 21c0-3.9 3.1-7 7-7s7 3.1 7 7" />
      <circle cx="18" cy="9.5" r="2.5" />
      <path d="M18.5 14.2c2.3.4 4 2.4 4 4.8" />
    </Svg>
  );
}

export function MenuIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 7h18M4 13h18M4 19h18" />
    </Svg>
  );
}

export function CollapseIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M15.5 6 8.5 13l7 7" />
    </Svg>
  );
}