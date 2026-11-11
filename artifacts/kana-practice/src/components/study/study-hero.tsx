import { Link, useLocation } from 'wouter';
import { ArrowRight, Timer } from 'lucide-react';
import { useCatalog } from '@/learning/catalog';
import { studyCounts } from '@/learning/service';
import { useStore } from '@/storage/store';

export function StudyHero() {
  const { catalog, loading, error, retry } = useCatalog();
  const { data } = useStore();
  const [, nav] = useLocation();
  const c = catalog ? studyCounts(catalog, data) : null;
  return (
    <section className="rise rounded-3xl bg-ink text-background p-5 sm:p-7 grid md:grid-cols-[1fr_auto] gap-5 items-center" data-testid="section-study-hero">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] opacity-70">復習 / spaced review</p>
        {error ? (
          <div className="mt-2 text-sm"><p>Study data failed to load: {error}</p><button onClick={retry} className="underline font-bold mt-1" data-testid="button-hero-retry">Retry</button></div>
        ) : loading || !c ? (
          <div className="mt-3 flex gap-6"><div className="h-14 w-24 rounded-xl bg-background/15 animate-pulse" /><div className="h-14 w-24 rounded-xl bg-background/15 animate-pulse" /></div>
        ) : (
          <div className="mt-2 flex flex-wrap gap-x-8 gap-y-2">
            <div><div className="text-5xl font-extrabold tabular-nums" data-testid="text-due-count">{c.due}</div><div className="text-xs opacity-70">reviews due today</div></div>
            <div><div className="text-5xl font-extrabold tabular-nums" data-testid="text-new-count">{Math.min(c.newRemaining, c.newAvailable)}</div><div className="text-xs opacity-70">new items left ({c.introducedToday}/{data.settings.newPerDay} today)</div></div>
          </div>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-sm opacity-80">
          <Link href="/learn" className="underline-offset-4 hover:underline" data-testid="link-hero-learn">Full Learn options</Link>
          <Link href="/library" className="underline-offset-4 hover:underline" data-testid="link-hero-library">Library</Link>
          <Link href="/custom" className="underline-offset-4 hover:underline" data-testid="link-hero-custom">My words</Link>
          <Link href="/about" className="underline-offset-4 hover:underline" data-testid="link-hero-about">Sources</Link>
        </div>
      </div>
      <button disabled={!c || (c.due === 0 && c.newRemaining === 0)} onClick={() => nav('/review?quick=1')} data-testid="button-start-quick"
        className="lift inline-flex items-center justify-center gap-3 rounded-2xl bg-primary text-primary-foreground px-7 py-5 text-xl font-extrabold shadow-lg disabled:opacity-40">
        <Timer className="w-6 h-6" /> Start 3-min session <ArrowRight className="w-5 h-5" />
      </button>
    </section>
  );
}
