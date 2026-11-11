import { useMemo } from 'react';
import { useLocation } from 'wouter';
import { ArrowRight, Check } from 'lucide-react';
import { getRows, ROW_IDS, type KanaScript } from '@/data/kana';
import { ScriptSwitch } from '@/components/script-switch';
import { StudyHero } from '@/components/study/study-hero';
import { ShinkansenTrack } from '@/components/shinkansen-track';
import { buildPool, eligibleGroups, eligibleWords, type Mode } from '@/practice/engine';
import { streakInfo, updateSettings, useStore } from '@/storage/store';

const MODES: { id: Mode; title: string; jp: Record<KanaScript, string>; desc: string }[] = [
  { id: 'kana', title: 'Single kana', jp: { hiragana: 'あ', katakana: 'ア' }, desc: 'One character at a time from your rows.' },
  { id: 'confusable', title: 'Look-alikes', jp: { hiragana: 'ぬめ', katakana: 'シツ' }, desc: 'Shapes that trip you up, side by side in rotation.' },
  { id: 'words', title: 'Words', jp: { hiragana: 'ねこ', katakana: 'トイレ' }, desc: 'Starter words built only from your rows.' },
];

function daysUntil(date: string) {
  const now = new Date();
  const [year, month, day] = date.split('-').map(Number);
  return Math.max(0, Math.round((Date.UTC(year, month - 1, day) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000));
}

export default function Setup() {
  const { data } = useStore();
  const s = data.settings;
  const [, nav] = useLocation();
  const script: KanaScript = s.script ?? 'hiragana';
  const rowsDef = useMemo(() => getRows(script), [script]);
  const scriptRowIds = useMemo(() => rowsDef.map((r) => r.id), [rowsDef]);
  const activeRows = s.rows.filter((r) => scriptRowIds.includes(r));
  const groups = useMemo(() => eligibleGroups(s.rows, script), [s.rows, script]);
  const words = useMemo(() => eligibleWords(s.rows, script), [s.rows, script]);
  const pool = useMemo(() => buildPool(s.mode, s.rows, s.groupId, script), [s.mode, s.rows, s.groupId, script]);
  const scriptLabel = script === 'katakana' ? 'katakana' : 'hiragana';
  const streak = streakInfo(data.practiceDays);
  const groupValid = s.groupId === 'all' || groups.some((g) => g.group.id === s.groupId);

  let problem: string | null = null;
  if (activeRows.length === 0) problem = `Pick at least one ${scriptLabel} row to practice.`;
  else if (s.mode === 'confusable' && groups.length === 0) problem = 'No look-alike group has two members in your rows yet. Add rows such as a + ka + sa, or try another mode.';
  else if (s.mode === 'confusable' && !groupValid) problem = 'The chosen look-alike group is not available with these rows. Pick another group.';
  else if (s.mode === 'words' && words.length === 0) problem = 'No starter words use only your selected rows. Add more rows (a + ka is a good start).';
  else if (pool.length === 0) problem = 'Nothing to practice with this setup.';

  const toggleRow = (id: string) => {
    const rows = s.rows.includes(id) ? s.rows.filter((r) => r !== id) : ROW_IDS.filter((r) => r === id || s.rows.includes(r));
    updateSettings({ rows });
  };

  return (
    <div className="space-y-10">
      <section className="rise grid md:grid-cols-[1.4fr_1fr] gap-6 items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">今日の練習 / today's practice</p>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[0.95] mt-3">
            A few quiet minutes<br />with the {script === 'katakana' ? 'katakana' : 'kana'}.
          </h1>
        </div>
        <div className="flex gap-3 md:justify-end">
          <div className="stat-card rounded-2xl bg-card border px-4 py-3" data-testid="text-streak">
            <div className="text-3xl font-extrabold tabular-nums">{streak.current}</div>
            <div className="text-xs text-muted-foreground">day streak{streak.practicedToday ? ' · done today' : ''}</div>
          </div>
          {s.countdown && <div className="stat-card rounded-2xl bg-ink text-background px-4 py-3 min-w-0" data-testid="text-countdown">
            <div className="text-3xl font-extrabold tabular-nums">{daysUntil(s.countdown.date)}</div>
            <div className="text-xs opacity-70 break-words">days to {s.countdown.name}</div>
          </div>}
        </div>
      </section>
      {s.theme === 'shinkansen' && s.countdown && <ShinkansenTrack countdown={s.countdown} />}
      <StudyHero />
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground -mb-4">Free kana drill</p>

      <section className="rise flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between" style={{ animationDelay: '30ms' }}>
        <div>
          <h2 className="font-bold text-lg">Script</h2>
          <p className="text-sm text-muted-foreground">Row choices are remembered separately for each.</p>
        </div>
        <ScriptSwitch value={script} onChange={(sc) => sc !== script && updateSettings({ script: sc, groupId: 'all' })} />
      </section>

      <section className="rise" style={{ animationDelay: '60ms' }}>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-bold text-lg">1. Your {scriptLabel} rows <span className="font-mono text-xs text-muted-foreground font-normal" data-testid="text-active-rows">{activeRows.length}/{rowsDef.length}</span></h2>
          <div className="flex gap-3 text-sm">
            <button className="text-muted-foreground hover:text-primary" onClick={() => updateSettings({ rows: ROW_IDS.filter((r) => s.rows.includes(r) || scriptRowIds.includes(r)) })} data-testid="button-rows-all">Select all</button>
            <button className="text-muted-foreground hover:text-primary" onClick={() => updateSettings({ rows: s.rows.filter((r) => !scriptRowIds.includes(r)) })} data-testid="button-rows-none">Clear</button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {rowsDef.map((r) => {
            const on = s.rows.includes(r.id);
            return (
              <button key={r.id} onClick={() => toggleRow(r.id)} aria-pressed={on} data-testid={`button-row-${r.id}`}
                className={`lift relative text-left rounded-2xl border-2 p-3 ${on ? 'border-primary bg-primary/8 shadow-md' : 'border-border bg-card hover:border-foreground/30'}`}>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs uppercase text-muted-foreground">{r.id.replace(/^kata-/, '')}-row</span>
                  <span className={`w-5 h-5 rounded-full grid place-items-center transition-all ${on ? 'bg-primary text-primary-foreground scale-100' : 'border scale-90'}`}>
                    {on && <Check className="w-3 h-3" strokeWidth={3} />}
                  </span>
                </div>
                <div className="font-kana text-2xl mt-1.5 tracking-wider break-all">{r.kana.map((k) => k.char).join('')}</div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rise" style={{ animationDelay: '120ms' }}>
        <h2 className="font-bold text-lg mb-3">2. Mode</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {MODES.map((m) => {
            const on = s.mode === m.id;
            const count = m.id === 'kana' ? buildPool('kana', s.rows, 'all', script).length : m.id === 'words' ? words.length : groups.length;
            const unit = m.id === 'kana' ? 'kana' : m.id === 'words' ? 'words' : 'groups';
            return (
              <button key={m.id} onClick={() => updateSettings({ mode: m.id })} aria-pressed={on} data-testid={`button-mode-${m.id}`}
                className={`lift text-left rounded-2xl p-4 border-2 ${on ? 'bg-ink text-background border-ink' : 'bg-card hover:border-foreground/30'}`}>
                <div className="flex justify-between items-start">
                  <span className="font-kana text-3xl font-bold">{m.jp[script]}</span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${count === 0 ? 'bg-destructive/15 text-destructive' : on ? 'bg-background/15' : 'bg-muted'}`}>{count} {unit}</span>
                </div>
                <div className="font-bold mt-3">{m.title}</div>
                <div className={`text-sm ${on ? 'opacity-70' : 'text-muted-foreground'}`}>{m.desc}</div>
              </button>
            );
          })}
        </div>

        {s.mode === 'confusable' && groups.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => updateSettings({ groupId: 'all' })} data-testid="button-group-all"
              className={`px-4 py-2 rounded-full border text-sm font-semibold ${s.groupId === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card'}`}>All groups</button>
            {groups.map((g) => (
              <button key={g.group.id} onClick={() => updateSettings({ groupId: g.group.id })} data-testid={`button-group-${g.group.id}`}
                className={`px-4 py-2 rounded-full border font-kana text-lg ${s.groupId === g.group.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card'}`}>
                {g.chars.join(' / ')}
              </button>
            ))}
          </div>
        )}
        {s.mode === 'words' && words.length > 0 && (
          <p className="mt-3 text-sm text-muted-foreground font-kana break-words" data-testid="text-word-list">{words.map((w) => w.kana).join('・')}</p>
        )}
        {s.mode === 'words' && script === 'katakana' && (
          <p className="mt-3 text-sm rounded-xl border border-dashed px-4 py-3 bg-card/60" data-testid="text-long-vowel-note">
            <span className="font-kana font-bold text-primary text-lg mr-1">ー</span> stretches the vowel before it: <span className="font-kana">コーヒー</span> = <span className="font-mono">koohii</span>. Type the doubled vowel.
          </p>
        )}
      </section>

      <section className="rise" style={{ animationDelay: '180ms' }}>
        <h2 className="font-bold text-lg mb-3">3. Length</h2>
        <div className="inline-flex rounded-full border bg-card p-1">
          {([3, 5, 10] as const).map((m) => (
            <button key={m} onClick={() => updateSettings({ minutes: m })} data-testid={`button-minutes-${m}`}
              className={`px-5 py-2 rounded-full font-semibold transition-colors ${s.minutes === m ? 'bg-ink text-background' : 'text-muted-foreground'}`}>
              {m} min
            </button>
          ))}
        </div>
      </section>

      <section className="rise" style={{ animationDelay: '240ms' }}>
        {problem && <p className="mb-3 text-sm rounded-xl bg-accent text-accent-foreground px-4 py-3" data-testid="text-setup-problem">{problem}</p>}
        <button disabled={!!problem} onClick={() => nav('/practice')} data-testid="button-start"
          className="lift w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-primary text-primary-foreground px-8 py-4 text-lg font-bold shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:pointer-events-none">
          Begin {s.minutes}-minute {scriptLabel} session <ArrowRight className="w-5 h-5" />
        </button>
      </section>
    </div>
  );
}
