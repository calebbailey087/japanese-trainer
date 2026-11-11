import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { AlertTriangle, BarChart3, BookOpen, Play, Settings2, Sprout } from 'lucide-react';
import { useStore } from '@/storage/store';

const NAV = [
  { href: '/', label: 'Practice', icon: Sprout },
  { href: '/learn', label: 'Learn', icon: BookOpen },
  { href: '/progress', label: 'Progress', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings2 },
];

export function Shell({ children }: { children: ReactNode }) {
  const [loc] = useLocation();
  const { loadError, saveError } = useStore();
  const inSession = loc === '/practice' || loc === '/review';
  const isActive = (h: string) => loc === h || (h === '/' && inSession) || (h === '/learn' && ['/library', '/custom', '/about'].includes(loc));
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group" data-testid="link-home">
            <span className="grid place-items-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-kana font-black text-lg -rotate-6 group-hover:rotate-0 transition-transform">か</span>
            <span className="font-extrabold tracking-tight text-lg">Kana</span>
          </Link>
          <nav className="hidden sm:flex gap-1">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} data-testid={`link-nav-${n.label.toLowerCase()}`}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${isActive(n.href) ? 'bg-ink text-background' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {(loadError || saveError) && (
        <div role="alert" data-testid="status-storage-error" className="bg-destructive text-destructive-foreground">
          <div className="max-w-5xl mx-auto px-4 py-2.5 flex gap-2 text-sm items-start">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{loadError ?? saveError}</span>
          </div>
        </div>
      )}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 sm:py-10 pb-28 sm:pb-12">{children}</main>
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
        {NAV.map((n) => {
          const active = isActive(n.href);
          const Icon = inSession && n.href === '/' ? Play : n.icon;
          return (
            <Link key={n.href} href={n.href} data-testid={`link-tab-${n.label.toLowerCase()}`}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-semibold ${active ? 'text-primary' : 'text-muted-foreground'}`}>
              <Icon className="w-5 h-5" />
              {n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
