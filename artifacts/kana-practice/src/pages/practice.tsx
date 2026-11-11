import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Check, CornerDownLeft, Pause, RotateCcw, Square, X } from 'lucide-react';
import { buildPool, eligibleGroups, isCorrect, pickNext, type QuizItem } from '@/practice/engine';
import { getData, recordAnswer, useStore } from '@/storage/store';
import { Hanko, KoiSwim } from '@/themes/session-fx';
import { rowHint, typedFeedback } from '@/practice/feedback';
import { useSessionTimer } from '@/practice/use-session-timer';
import { SessionPaused } from '@/components/session-paused';

type Phase = 'answer' | 'wrong' | 'right';
interface Result { item: QuizItem; correct: boolean; given: string }

export default function Practice() {
  const { data } = useStore();
  const [config] = useState(() => data.settings);
  const script = config.script ?? 'hiragana';
  const pool = useMemo(() => buildPool(config.mode, config.rows, config.groupId, script), [config, script]);
  const groupOk = config.mode !== 'confusable' || config.groupId === 'all' || eligibleGroups(config.rows, script).some((g) => g.group.id === config.groupId);
  const valid = pool.length > 0 && groupOk;

  const { remaining, paused, pause, resume, readRemaining } = useSessionTimer(config.minutes);
  const [done, setDone] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [item, setItem] = useState<QuizItem | null>(() => (valid ? pick(pool, null) : null));
  const [phase, setPhase] = useState<Phase>('answer');
  const [input, setInput] = useState('');
  const [firstGiven, setFirstGiven] = useState('');
  const [shake, setShake] = useState(0);
  const [misses, setMisses] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [isRetry, setIsRetry] = useState(false);
  const [scoredCorrect, setScoredCorrect] = useState(false);
  const retries = useRef<{ item: QuizItem; after: number }[]>([]);
  const retried = useRef(new Set<string>());
  const completed = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const theme = data.settings.theme;

  useEffect(() => {
    if (valid && remaining === 0) setDone(true);
  }, [remaining, valid]);

  useEffect(() => { if (!paused) inputRef.current?.focus(); }, [item, phase, paused]);

  const next = useCallback(() => {
    if (paused) return;
    if (readRemaining() === 0) { setDone(true); return; }
    completed.current++;
    const dueRetry = retries.current[0];
    if (dueRetry && completed.current >= dueRetry.after) {
      retries.current.shift();
      setItem(dueRetry.item);
      setIsRetry(true);
    } else {
      const pendingIds = new Set(retries.current.map((r) => r.item.id));
      const other = pool.filter((p) => !pendingIds.has(p.id));
      if (!other.length && dueRetry) {
        retries.current.shift();
        setItem(dueRetry.item);
        setIsRetry(true);
      } else {
        setItem((cur) => pick(other.length ? other : pool, cur?.id ?? null));
        setIsRetry(false);
      }
    }
    setPhase('answer');
    setInput('');
    setMisses(0);
    setRevealed(false);
    setFirstGiven('');
    setScoredCorrect(false);
  }, [paused, readRemaining, pool]);

  const submit = () => {
    if (!item || done || paused) return;
    if (phase === 'right') { next(); return; }
    if (!input.trim()) return;
    const ok = isCorrect(item.prompt, input);
    if (phase === 'answer') {
      if (!isRetry) {
        recordAnswer(item.kind, item.id, ok);
        setResults((r) => [...r, { item, correct: ok, given: input.trim() }]);
      }
      setScoredCorrect(ok);
      setFirstGiven(input.trim());
      if (ok) setPhase('right');
      else { setPhase('wrong'); setMisses(1); setInput(''); setShake((s) => s + 1); }
    } else if (phase === 'wrong') {
      setFirstGiven(input.trim());
      if (ok) setPhase('right');
      else { setMisses((n) => n + 1); setShake((s) => s + 1); setInput(''); }
    }
  };
  const dontKnow = () => {
    if (!item || done || paused || phase === 'right') return;
    if (phase === 'answer' && !isRetry) {
      recordAnswer(item.kind, item.id, false);
      setResults((r) => [...r, { item, correct: false, given: 'I don’t know' }]);
    }
    setPhase('wrong');
    setRevealed(true);
    setInput('');
    if (!retried.current.has(item.id)) {
      retried.current.add(item.id);
      retries.current.push({ item, after: completed.current + 3 });
    }
    inputRef.current?.focus();
  };

  if (!valid) {
    return (
      <div className="max-w-md mx-auto text-center py-16 rise">
        <div className="font-kana text-7xl text-muted-foreground/40">？</div>
        <h1 className="text-2xl font-extrabold mt-4">Nothing to practice yet</h1>
        <p className="text-muted-foreground mt-2">Your current rows and mode do not produce any questions. Adjust them on the setup screen.</p>
        <Link href="/" className="inline-flex mt-6 rounded-xl bg-primary text-primary-foreground px-6 py-3 font-bold" data-testid="link-back-setup">Back to setup</Link>
      </div>
    );
  }

  if (done) return <Summary results={results} minutes={config.minutes} script={script} theme={theme} />;

  const frac = remaining / (config.minutes * 60000);
  const mm = Math.floor(remaining / 60000);
  const ss = Math.floor((remaining % 60000) / 1000);
  const correctCount = results.filter((r) => r.correct).length;
  const isWord = item?.kind === 'word';
  const plen = [...(item?.prompt ?? '')].length;
  const promptSize = !isWord ? 'text-[8rem] sm:text-[11rem]' : plen <= 3 ? 'text-7xl sm:text-8xl' : plen <= 5 ? 'text-5xl sm:text-7xl' : 'text-4xl sm:text-6xl';
  const lastOk = scoredCorrect;

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <span className="font-kana text-xs font-bold px-2 py-1 rounded-full bg-primary/12 text-primary" data-testid="text-active-script">{script === 'katakana' ? 'カタカナ' : 'ひらがな'}</span>
        <div className="font-mono text-sm tabular-nums" data-testid="text-timer">{mm}:{String(ss).padStart(2, '0')}</div>
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary origin-left transition-transform duration-300 ease-linear" style={{ transform: `scaleX(${frac})` }} />
        </div>
        <div className="text-xs sm:text-sm tabular-nums text-muted-foreground text-right" data-testid="text-score">{correctCount} correct · {results.length} answered</div>
      </div>
      {!paused && <div className="flex justify-end mt-3"><button onClick={pause} className="inline-flex items-center gap-2 rounded-xl border-2 bg-card px-4 py-2 font-bold" data-testid="button-pause"><Pause className="w-4 h-4" /> Pause</button></div>}
      {paused && <SessionPaused onResume={resume} />}
      <div hidden={paused} inert={paused}>
      {isRetry && <p className="mt-3 text-sm font-bold text-center text-primary">Practice again · no extra SRS score</p>}

      <div key={item?.id + String(results.length)} className={`pop mt-8 relative rounded-[2rem] border bg-card shadow-xl px-4 sm:px-6 pt-10 pb-8 text-center overflow-hidden ${phase === 'right' && lastOk ? 'glow-ok' : ''}`}>
        <div className={`font-kana font-bold leading-tight break-all ${promptSize}`} data-testid="text-prompt">{item?.prompt}</div>
        {phase !== 'answer' && (
          <div className="mt-6 rise" data-testid="text-feedback">
            <div role="status" aria-live="polite" className={`rounded-2xl border-2 p-4 ${phase === 'right' ? 'border-green-600 bg-green-50 text-green-950' : 'border-red-600 bg-red-50 text-red-950'}`}>
              <div className="flex items-center justify-center gap-2 text-2xl font-extrabold">
                {phase === 'right' ? <Check className="w-8 h-8 shrink-0" /> : <X className="w-8 h-8 shrink-0" />}
                {phase === 'right' ? `Correct${!scoredCorrect ? ' · recovered' : ''}` : revealed ? 'Answer revealed · missed' : 'Not quite · try again'}
              </div>
              {phase === 'wrong' && firstGiven && <p className="mt-2 break-words">{typedFeedback(firstGiven, true, script === 'katakana')}</p>}
              {phase === 'wrong' && misses >= 2 && !revealed && <p className="mt-2 font-bold" data-testid="text-hint">{rowHint(item?.prompt ?? '')}</p>}
              <p className="mt-2 text-xs">{isRetry ? 'Extra practice only; your SRS score is unchanged.' : 'Only your first answer is scored.'}</p>
            </div>
            {(revealed || phase === 'right') && <div className="mt-3 font-mono text-2xl font-semibold" data-testid="text-correct-answer">{item?.answer}</div>}
            {isWord && (revealed || phase === 'right') && <div className="mt-1 text-muted-foreground" data-testid="text-meaning">“{item?.meaning}”</div>}
            {isWord && (revealed || phase === 'right') && item?.prompt.includes('ー') && (
              <div className="mt-2 text-xs text-muted-foreground" data-testid="text-long-vowel-hint"><span className="font-kana font-bold text-primary">ー</span> repeats the previous vowel: <span className="font-kana">コーヒー</span> = koohii</div>
            )}
          </div>
        )}
        {phase === 'right' && lastOk && theme === 'washi' && <Hanko />}
        {phase === 'right' && lastOk && theme !== 'washi' && (
          <span className="stamp absolute top-5 right-5 font-kana font-black text-primary border-2 border-primary rounded-lg px-2 py-1 text-sm">正解</span>
        )}
      </div>

      <form className="mt-6" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        {phase === 'wrong' && <p className="text-sm text-center mb-2 text-muted-foreground">{revealed ? 'Type the revealed reading once to continue.' : 'Keep guessing, or choose “I don’t know” to reveal it.'}</p>}
        <div key={shake} className={`flex gap-2 ${shake ? 'shake' : ''}`}>
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} readOnly={phase === 'right'}
            autoCapitalize="none" autoCorrect="off" autoComplete="off" spellCheck={false} enterKeyHint="go"
            placeholder={phase === 'right' ? 'Press Enter to continue' : revealed ? `type ${item?.answer}` : 'romaji'}
            data-testid="input-answer"
            className={`flex-1 min-w-0 rounded-2xl border-2 bg-card px-5 py-4 font-mono text-xl outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/15 ${phase === 'wrong' ? 'border-destructive/60' : phase === 'right' ? 'border-matcha' : 'border-input'}`} />
          <button type="submit" data-testid="button-submit"
            className="rounded-2xl bg-ink text-background px-5 font-bold inline-flex items-center gap-2 active:scale-95 transition-transform">
            {phase === 'right' ? <>Next <ArrowRight className="w-4 h-4" /></> : <>Check <CornerDownLeft className="w-4 h-4" /></>}
          </button>
        </div>
      </form>
      {phase !== 'right' && !revealed && <button onClick={dontKnow} className="mt-3 w-full rounded-2xl border-2 bg-card py-3 font-bold" data-testid="button-dont-know">I don’t know</button>}
      </div>

      <div className="mt-8 text-center">
        <button onClick={() => setDone(true)} data-testid="button-end-session"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive">
          <Square className="w-3.5 h-3.5" /> End session early
        </button>
      </div>
    </div>
  );
}

function pick(pool: QuizItem[], last: string | null) {
  const d = getData();
  return pickNext(pool, (it) => (it.kind === 'kana' ? d.kana[it.id] : d.words[it.id]), last);
}

function Summary({ results, minutes, script, theme }: { results: Result[]; minutes: number; script: string; theme: string }) {
  const correct = results.filter((r) => r.correct).length;
  const missed = new Map<string, Result>();
  results.filter((r) => !r.correct).forEach((r) => missed.set(r.item.id, r));
  const pct = results.length ? Math.round((correct / results.length) * 1000) / 10 : 0;
  return (
    <div className="max-w-2xl mx-auto rise">
      {theme === 'koi' && <KoiSwim />}
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">おつかれさま / {script} session complete</p>
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mt-2">
        {results.length === 0 ? 'No answers this time.' : `${correct} of ${results.length} on the first try.`}
      </h1>
      <div className="grid grid-cols-3 gap-3 mt-8">
        <Stat label="Answered" value={String(results.length)} id="answered" />
        <Stat label="First-try correct" value={String(correct)} id="correct" />
        <Stat label="Accuracy" value={results.length ? `${pct}%` : '—'} id="accuracy" />
      </div>
      <h2 className="font-bold mt-10 mb-3">To revisit</h2>
      {missed.size === 0 ? (
        <p className="text-muted-foreground rounded-2xl border border-dashed p-5">{results.length ? 'Nothing missed. Clean run.' : `The ${minutes}-minute session ended before any answer was submitted.`}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {[...missed.values()].map((r) => (
            <div key={r.item.id} className="rounded-xl border bg-card px-4 py-2 flex items-baseline gap-3" data-testid={`card-missed-${r.item.id}`}>
              <span className="font-kana text-2xl">{r.item.prompt}</span>
              <span className="font-mono text-sm">{r.item.answer}</span>
              {r.item.meaning && <span className="text-xs text-muted-foreground">{r.item.meaning}</span>}
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-3 mt-10">
        <button onClick={() => window.location.reload()} data-testid="button-again"
          className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 font-bold"><RotateCcw className="w-4 h-4" /> Same again</button>
        <Link href="/" className="rounded-xl border bg-card px-6 py-3 font-bold" data-testid="link-setup">Change setup</Link>
        <Link href="/progress" className="rounded-xl border bg-card px-6 py-3 font-bold" data-testid="link-progress">See progress</Link>
      </div>
    </div>
  );
}

function Stat({ label, value, id }: { label: string; value: string; id: string }) {
  return (
    <div className="stat-card rounded-2xl bg-card border p-4">
      <div className="text-3xl font-extrabold tabular-nums" data-testid={`text-summary-${id}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
