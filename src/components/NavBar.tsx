'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const ITEMS = [
  { href: '/', label: 'Piano', icon: PlanIcon },
  { href: '/coach', label: 'Coach', icon: CoachIcon },
  { href: '/profile', label: 'Profilo', icon: ProfileIcon },
  { href: '/settings', label: 'Impostazioni', icon: SettingsIcon },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden w-64 shrink-0 flex-col gap-2 border-r border-line/60 bg-white/75 p-6 backdrop-blur-xl md:flex md:min-h-screen">
        <div className="mb-8 px-2">
          <p className="font-display text-2xl font-extrabold tracking-tight text-ink">RIPARTENZA</p>
          <p className="mt-0.5 font-stat text-xs font-semibold text-ink-faint">Corri con metodo</p>
        </div>
        <nav className="flex flex-col gap-1.5">
          {ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'ios-btn-active flex items-center gap-3 rounded-ios px-3.5 py-2.5 text-sm font-semibold transition-all',
                  active ? 'bg-track-soft text-track-dark shadow-sm' : 'text-ink-soft hover:bg-surfaceSunken/60 hover:text-ink'
                )}
              >
                <item.icon className="h-5 w-5" active={active} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <nav className="fixed bottom-4 inset-x-4 z-40 mx-auto max-w-sm rounded-full liquid-glass-dock p-2 md:hidden">
        <div className="flex items-center justify-around">
          {ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'ios-btn-active flex flex-1 flex-col items-center gap-1 py-1 text-[10px] font-medium transition-colors',
                  active ? 'font-semibold text-track' : 'text-ink-faint hover:text-ink-soft'
                )}
              >
                <item.icon className={clsx('h-5 w-5 transition-transform', active && 'scale-110')} active={active} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

function iconProps(className?: string) {
  return { className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 } as const;
}

function PlanIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg {...iconProps(className)}>
      <rect x="4" y="5" width="16" height="15" rx="3" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
      <path d="M8 3v4M16 3v4M4 10h16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CoachIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg {...iconProps(className)}>
      <path
        d="M4 12a8 8 0 1 1 3.2 6.4L4 20l1.2-3.4A7.96 7.96 0 0 1 4 12Z"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.15 : 0}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProfileIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg {...iconProps(className)}>
      <circle cx="12" cy="8" r="3.5" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
      <path d="M5 20c1.2-3.6 4-5.4 7-5.4s5.8 1.8 7 5.4" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg {...iconProps(className)}>
      <circle cx="12" cy="12" r="3" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
      <path
        d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-1.9-3.3-2.4.6a7 7 0 0 0-2-1.2L14.2 3H9.8l-.4 2.4a7 7 0 0 0-2 1.2l-2.4-.6L3.1 9.3l2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 1.9 3.3 2.4-.6a7 7 0 0 0 2 1.2l.4 2.4h4.4l.4-2.4a7 7 0 0 0 2-1.2l2.4.6 1.9-3.3-2-1.5c.1-.4.1-.8.1-1.2Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}


