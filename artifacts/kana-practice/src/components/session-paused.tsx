import { Play } from 'lucide-react';

export function SessionPaused({ onResume }: { onResume: () => void }) {
  return <section aria-label="Session paused" className="my-6 rounded-3xl border-2 border-primary bg-card p-6 text-center space-y-4" data-testid="panel-paused">
    <h2 className="text-3xl font-extrabold">Session paused</h2>
    <p className="text-muted-foreground">Take your time. The timer is stopped, and your current question, typed answer and score are kept.</p>
    <button autoFocus onClick={onResume} className="inline-flex items-center justify-center gap-2 w-full rounded-2xl bg-primary text-primary-foreground px-6 py-4 text-lg font-bold" data-testid="button-resume"><Play className="w-5 h-5" /> Resume session</button>
    <p className="text-xs text-muted-foreground">Keep this session open. Leaving the page or refreshing starts a new session.</p>
  </section>;
}
