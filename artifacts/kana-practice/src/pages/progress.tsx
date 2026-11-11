import { useState } from 'react';
import { Link } from 'wouter';
import { StudyProgress } from '@/components/study/study-progress';
import { ScriptSwitch } from '@/components/script-switch';
import { getRows, getWords, type KanaScript } from '@/data/kana';
import { backupOverdue, streakInfo, useStore, type ItemStat } from '@/storage/store';

function acc(s?: ItemStat) {
  return s && s.seen ? s.correct / s.seen : null;
}

function tone(a: number | null) {
  if (a === null) return 'bg-muted/50 text-muted-foreground';
  if (a >= 0.85) return 'bg-matcha/15 text-foreground';
  if (a >= 0.6) return 'bg-chart-5/20 text-foreground';
  return 'bg-destructive/15 text-foreground';
}

export default function Progress() {
  const { data } = useStore();
  const st = streakInfo(data.practiceDays);
  const [script, setScript] = useState<KanaScript>(data.settings.script ?? 'hiragana');
  const rows = getRows(script);
  const words = getWords(script);
  const scriptKana = rows.flatMap((r) => r.kana);
  const charSet = new Set(scriptKana.map((k) => k.char));
  const wordIds = new Set(words.map((w) => w.id));
  const kanaEntries = Object.entries(data.kana).filter(([id]) => charSet.has(id));
  const wordEntries = Object.entries(data.words).filter(([id]) => wordIds.has(id));
  const allSeen = Object.values(data.kana).reduce((a, s) => a + s.seen, 0) + Object.values(data.words).reduce((a, s) => a + s.seen, 0);
  const totalSeen = kanaEntries.reduce((a, [, s]) => a + s.seen, 0) + wordEntries.reduce((a, [, s]) => a + s.seen, 0);
  const missed = [
    ...kanaEntries.map(([id, s]) => ({ id, label: id, sub: scriptKana.find((k) => k.char === id)?.romaji ?? '', s })),
    ...wordEntries.map(([id, s]) => { const w = words.find((x) => x.id === id); return { id, label: w?.kana ?? id, sub: w?.romaji ?? '', s }; }),
  ].filter((x) => x.s.seen > x.s.correct)
    .sort((a, b) => (b.s.seen - b.s.correct) - (a.s.seen - a.s.correct) || (acc(a.s) ?? 0) - (acc(b.s) ?? 0))
    .slice(0, 10);

  // last 14 days
  const days: { key: string; on: boolean; label: string }[] = [];
  const set = new Set(data.practiceDays);
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const p = (n: number) => String(n).padStart(2, '0');
    const key = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    days.push({ key, on: set.has(key), label: String(d.getDate()) });
  }

  if (allSeen === 0 && Object.keys(data.study.activity).length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-16 rise">
        <div className="font-kana text-8xl text-primary/30">まだ</div>
        <h1 className="text-2xl font-extrabold mt-4">No practice recorded yet</h1>
        <p className="text-muted-foreground mt-2">Your accuracy, streak and most-missed characters appear here after your first answer.</p>
        <div className="mt-6"><StudyProgress /></div>
        {backupOverdue(data) && <BackupReminder />}
        <Link href="/" className="inline-flex mt-6 rounded-xl bg-primary text-primary-foreground px-6 py-3 font-bold" data-testid="link-start-first">Start a session</Link>
      </div>
    );
  }

  return (
    <div className="space-y-10 rise">
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Progress</h1>
      <p className="text-xs text-muted-foreground -mt-8">Streaks count every practice day, whichever script you used.</p>
      {backupOverdue(data) && <BackupReminder />}
      <section className="grid sm:grid-cols-[auto_1fr] gap-4">
        <div className="flex gap-3">
          <div className="rounded-2xl bg-primary text-primary-foreground p-5 min-w-32">
            <div className="text-4xl font-extrabold tabular-nums" data-testid="text-current-streak">{st.current}</div>
            <div className="text-xs opacity-80">current streak (days)</div>
          </div>
          <div className="stat-card rounded-2xl bg-card border p-5 min-w-32">
            <div className="text-4xl font-extrabold tabular-nums" data-testid="text-best-streak">{st.best}</div>
            <div className="text-xs text-muted-foreground">best streak · {data.practiceDays.length} days total</div>
          </div>
        </div>
        <div className="stat-card rounded-2xl bg-card border p-4">
          <div className="text-xs text-muted-foreground mb-2">Last 14 days{st.practicedToday ? '' : ' · not practiced today yet'}</div>
          <div className="grid grid-cols-14 gap-1.5" style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}>
            {days.map((d) => (
              <div key={d.key} title={d.key} className="flex flex-col items-center gap-1">
                <div className={`w-full aspect-square rounded-md ${d.on ? 'bg-primary' : 'bg-muted'}`} />
                <span className="text-[10px] text-muted-foreground tabular-nums">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StudyProgress />

      <section className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between border-t pt-8">
        <div>
          <h2 className="font-bold text-lg">By script</h2>
          <p className="text-sm text-muted-foreground" data-testid="text-script-total">{totalSeen} first answers in {script}.</p>
        </div>
        <ScriptSwitch value={script} onChange={setScript} testPrefix="button-progress-script" />
      </section>

      <section>
        <h2 className="font-bold text-lg mb-1">Most missed</h2>
        <p className="text-sm text-muted-foreground mb-3">Counts are first answers only. Word misses are kept separate from individual kana.</p>
        {missed.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-5 text-muted-foreground">No {script} misses recorded.</p>
        ) : (
          <ol className="divide-y rounded-2xl border bg-card">
            {missed.map((m, i) => (
              <li key={m.id} className="flex items-center gap-4 px-4 py-3" data-testid={`row-missed-${m.id}`}>
                <span className="font-mono text-xs text-muted-foreground w-5">{i + 1}</span>
                <span className="font-kana text-2xl w-24 sm:w-32 min-w-0 break-all leading-tight">{m.label}</span>
                <span className="font-mono text-sm flex-1 min-w-0 truncate">{m.sub}</span>
                <span className="text-xs sm:text-sm tabular-nums text-right">{m.s.seen - m.s.correct} missed of {m.s.seen}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section>
        <h2 className="font-bold text-lg mb-3">Every kana</h2>
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="grid grid-cols-[3rem_1fr] items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground uppercase">{r.id.replace(/^kata-/, '')}</span>
              <div className="grid grid-cols-5 gap-1.5">
                {r.kana.map((k) => {
                  const s = data.kana[k.char];
                  const a = acc(s);
                  return (
                    <div key={k.char} className={`rounded-xl px-2 py-2 text-center ${tone(a)}`} data-testid={`cell-kana-${k.char}`}>
                      <div className="font-kana text-2xl leading-none">{k.char}</div>
                      <div className="text-[11px] mt-1 tabular-nums">{s ? `${s.correct}/${s.seen} · ${Math.round((a ?? 0) * 100)}%` : 'unseen'}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-bold text-lg mb-3">Words</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {words.map((w) => {
            const s = data.words[w.id];
            return (
              <div key={w.id} className={`rounded-xl px-3 py-2 ${tone(acc(s))}`} data-testid={`cell-word-${w.id}`}>
                <div className="font-kana text-lg break-all leading-snug">{w.kana} <span className="font-mono text-xs opacity-70">{w.romaji}</span></div>
                <div className="text-[11px] tabular-nums">{s ? `${s.correct}/${s.seen} first-try correct` : 'unseen'}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function BackupReminder() {
  return <aside className="rounded-2xl border-2 border-primary bg-card p-4 text-left space-y-2" data-testid="backup-reminder"><h2 className="font-bold">Time to back up your progress</h2><p className="text-sm">It has been at least 14 days without an export. Progress lives only in this browser.</p><Link href="/settings" className="inline-block rounded-xl bg-primary text-primary-foreground px-4 py-2 font-bold">Export a JSON backup</Link></aside>;
}
