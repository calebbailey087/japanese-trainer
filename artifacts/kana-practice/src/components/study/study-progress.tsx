import { useState } from 'react';
import { Copy } from 'lucide-react';
import { studyCounts, tutorSummary } from '@/learning/service';
import { dayKey } from '@/learning/srs';
import { STAGES } from '@/learning/types';
import { useStore } from '@/storage/store';
import { CatalogGate, StageChip } from './common';

export function StudyProgress() {
  const { data } = useStore();
  const [text, setText] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
  const max = Math.max(1, ...days.map((d) => data.study.activity[dayKey(d)]?.answers ?? 0));
  return (
    <section className="space-y-4 border-t pt-8" data-testid="section-study-progress">
      <h2 className="font-bold text-lg">Spaced review</h2>
      <CatalogGate>{(c) => {
        const s = studyCounts(c, data);
        const copy = async () => {
          const t = tutorSummary(c, data);
          setText(t); setCopied(null);
          try { await navigator.clipboard.writeText(t); setCopied('Copied. Paste it to your tutor.'); }
          catch { setCopied('Clipboard blocked. Select the text below and copy it manually.'); }
        };
        return (<>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {STAGES.map((st) => <div key={st} className="stat-card rounded-2xl border bg-card p-3 text-center"><div className="text-2xl sm:text-3xl font-extrabold tabular-nums" data-testid={`text-progress-stage-${st}`}>{s.stages[st]}</div><StageChip stage={st} /></div>)}
          </div>
          <div className="rounded-2xl border bg-card p-4">
            <div className="text-xs text-muted-foreground mb-3">Last 7 days (first answers)</div>
            <div className="grid grid-cols-7 gap-2 items-end h-28">
              {days.map((d) => { const a = data.study.activity[dayKey(d)]; return (
                <div key={dayKey(d)} className="flex flex-col items-center gap-1 h-full justify-end" data-testid={`bar-day-${dayKey(d)}`} title={a ? `${a.correct}/${a.answers} correct, ${a.newItems.length} new` : 'no study'}>
                  <span className="text-[10px] tabular-nums">{a?.answers ?? 0}</span>
                  <div className="w-full rounded-md bg-primary origin-bottom" style={{ height: '70%', transform: `scaleY(${(a?.answers ?? 0) / max})` }} />
                  <span className="text-[10px] text-muted-foreground">{d.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                </div>); })}
            </div>
          </div>
          <div className="space-y-2">
            <button onClick={copy} className="inline-flex items-center gap-2 rounded-xl bg-ink text-background px-5 py-3 font-bold" data-testid="button-copy-summary"><Copy className="w-4 h-4" /> Copy progress summary</button>
            {copied && <p className="text-sm" data-testid="text-copy-status">{copied}</p>}
            {text && <textarea readOnly value={text} onFocus={(e) => e.target.select()} rows={12} className="w-full rounded-xl border bg-background p-3 font-mono text-xs" data-testid="textarea-summary" />}
          </div>
        </>);
      }}</CatalogGate>
    </section>
  );
}
