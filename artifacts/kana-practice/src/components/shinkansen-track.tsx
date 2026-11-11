// Time-based journey: the train advances day by day across the year before the user's countdown date.
// Rendered only when a countdown is set in Settings.
const DAY = 86400000;

function utcDay(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function shortMonth(ms: number) {
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function ShinkansenTrack({ countdown }: { countdown: { name: string; date: string } }) {
  const end = utcDay(countdown.date);
  const endDate = new Date(end);
  const start = Date.UTC(endDate.getUTCFullYear() - 1, endDate.getUTCMonth(), endDate.getUTCDate());
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const frac = Math.min(1, Math.max(0, (today - start) / (end - start)));
  const days = Math.max(0, Math.round((end - today) / DAY));
  return (
    <section className="rise rounded-2xl border bg-card p-4 sm:p-5" data-testid="card-shinkansen">
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="font-mono uppercase tracking-[0.18em] text-muted-foreground">Departure countdown</span>
        <span className="font-bold break-words" data-testid="text-train-days">{days} days to {countdown.name}</span>
      </div>
      <div className="relative mt-5 h-10">
        <div className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 bg-muted" />
        <div className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 bg-primary" style={{ width: `${frac * 100}%` }} />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
          <span className="w-3 h-3 rounded-full border-2 border-primary bg-card" />
        </div>
        <div className="train-car absolute top-1/2" style={{ left: `${frac * 100}%`, width: 72, transform: `translate(-${frac * 100}%, -50%)` }}>
          <svg viewBox="0 0 72 22" width="72" height="22" aria-hidden="true">
            <path d="M0 4 H44 Q66 6 72 18 V20 H0 Z" fill="hsl(var(--card))" stroke="hsl(var(--foreground) / .5)" strokeWidth="1.5" />
            <path d="M0 14 H68" stroke="hsl(var(--primary))" strokeWidth="3" />
            {[6, 18, 30].map((x) => <rect key={x} x={x} y="7" width="8" height="4" rx="1" fill="hsl(var(--foreground) / .45)" />)}
          </svg>
        </div>
      </div>
      <div className="flex justify-between gap-3 text-[11px] text-muted-foreground mt-1">
        <span>{shortMonth(start)}</span><span className="font-bold text-foreground break-words text-right">{countdown.name} · {shortMonth(end)}</span>
      </div>
      <p className="text-[11px] text-muted-foreground mt-2">Illustrative one-year countdown, not quiz progress: the train moves with the calendar toward the date set in Settings.</p>
    </section>
  );
}
