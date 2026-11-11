import { useRef, useState } from 'react';
import { Pause } from 'lucide-react';
import { Link, useSearch } from 'wouter';
import { makeQueue } from '@/learning/service';
import { getData, recordReview } from '@/storage/store';
import type { Catalog, Direction, ItemKind, ReviewTask } from '@/learning/types';
import { CatalogGate } from '@/components/study/common';
import { TaskCard } from '@/components/study/task-card';
import { insertRetry } from '@/practice/feedback';
import { useSessionTimer } from '@/practice/use-session-timer';
import { SessionPaused } from '@/components/session-paused';

interface Answer { task: ReviewTask; correct: boolean }

export default function Review() {
  return <div className="max-w-2xl mx-auto"><CatalogGate>{(catalog) => <Session catalog={catalog} />}</CatalogGate></div>;
}

function Session({ catalog }: { catalog: Catalog }) {
  const search = useSearch();
  const [cfg] = useState(() => {
    const q = new URLSearchParams(search);
    const quick = q.get('quick') === '1';
    return {
      quick,
      kind: (q.get('kind') ?? 'all') as ItemKind | 'all',
      direction: (q.get('direction') ?? 'mixed') as Direction | 'mixed',
      mode: (q.get('mode') ?? 'text') as 'text' | 'listening' | 'particle',
      minutes: quick ? 3 : getData().settings.minutes,
    };
  });
  const [sessionId] = useState(() => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `s-${Date.now()}-${Math.random()}`));
  const [queue, setQueue] = useState<ReviewTask[]>(() => catalog ? makeQueue(catalog, getData(), { quick: cfg.quick, kind: cfg.kind, direction: cfg.direction, mode: cfg.mode }) : []);
  const scored = useRef(new Set<string>());
  const retried = useRef(new Set<string>());
  const retryTasks = useRef(new WeakSet<ReviewTask>());
  const { remaining: left, paused, pause, resume } = useSessionTimer(cfg.minutes);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [ended, setEnded] = useState(false);
  const [recErr, setRecErr] = useState<string | null>(null);
  const answeredIdx = useRef(-1);

  const timeUp = left === 0;
  const finished = ended || idx >= queue.length || (timeUp && answeredIdx.current !== idx);

  if (queue.length === 0) return (
    <div className="text-center py-14 rise">
      <div className="font-kana text-7xl text-primary/30">おわり</div>
      <h1 className="text-2xl font-extrabold mt-3">Nothing due right now</h1>
      <p className="text-muted-foreground mt-2">No reviews are due and today's new-item allowance is used or nothing is unlocked for this filter. Come back later or adjust options.</p>
      <Link href="/learn" className="inline-flex mt-6 rounded-xl bg-primary text-primary-foreground px-6 py-3 font-bold" data-testid="link-back-learn">Learn options</Link>
    </div>
  );

  if (finished) return <Results answers={answers} />;

  const task = queue[idx];
  const taskKey = `${task.item.id}:${task.direction}`;
  const retry = retryTasks.current.has(task);
  const mm = Math.floor(left / 60000), ss = Math.floor((left % 60000) / 1000);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-sm tabular-nums" data-testid="text-timer">{mm}:{String(ss).padStart(2, '0')}</span>
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary origin-left transition-transform" style={{ transform: `scaleX(${idx / queue.length})` }} /></div>
        <span className="text-xs tabular-nums text-muted-foreground" data-testid="text-queue-pos">{idx + 1}/{queue.length}</span>
        {!paused && <button onClick={pause} className="inline-flex items-center gap-1 rounded-xl border-2 px-3 py-2 text-sm font-bold" data-testid="button-pause"><Pause className="w-4 h-4" /> Pause</button>}
        <button onClick={() => setEnded(true)} className="text-sm font-semibold text-muted-foreground hover:text-foreground" data-testid="button-end-session">End</button>
      </div>
      {recErr && <p role="alert" className="text-sm text-destructive">{recErr}</p>}
      <p className="font-bold text-center tabular-nums" data-testid="text-score">{answers.filter((a) => a.correct).length} correct · {answers.length} answered</p>
      {paused && <SessionPaused onResume={resume} />}
      <div hidden={paused} inert={paused}>
      <TaskCard key={idx} task={task} retry={retry}
        onFirst={(correct) => {
          if (paused) return false;
          if (scored.current.has(taskKey)) { answeredIdx.current = idx; return true; }
          try { recordReview(task.item, task.direction, correct, sessionId); } catch (e) { setRecErr(`Answer could not be recorded: ${e instanceof Error ? e.message : 'unknown error'}`); return false; }
          answeredIdx.current = idx;
          scored.current.add(taskKey);
          setRecErr(null);
          setAnswers((a) => [...a, { task, correct }]);
          return true;
        }}
        onDontKnow={() => {
          if (!retried.current.has(taskKey)) {
            retried.current.add(taskKey);
            const repeated = { ...task };
            retryTasks.current.add(repeated);
            setQueue((q) => insertRetry(q, idx, repeated));
          }
        }}
        onNext={() => { if (!paused) setIdx((i) => i + 1); }} />
      </div>
    </div>
  );
}

function Results({ answers }: { answers: Answer[] }) {
  const data = getData();
  const right = answers.filter((a) => a.correct).length;
  return (
    <div className="space-y-6 rise" data-testid="panel-results">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">お疲れさま / session done</p>
        <h1 className="text-4xl font-extrabold mt-2"><span data-testid="text-results-accuracy">{answers.length ? Math.round((right / answers.length) * 100) : 0}%</span> first-try</h1>
        <p className="text-muted-foreground">{right} of {answers.length} first answers correct. Corrections are not counted.</p>
      </div>
      {answers.length > 0 && (
        <ol className="divide-y rounded-2xl border bg-card">
          {answers.map((a, i) => {
            const due = data.study.cards[a.task.item.id]?.[a.task.direction]?.due;
            return (
              <li key={i} className="flex items-center gap-3 px-4 py-3" data-testid={`row-result-${i}`}>
                <span className={`w-2 h-2 rounded-full shrink-0 ${a.correct ? 'bg-matcha' : 'bg-destructive'}`} />
                <span className="font-kana text-xl flex-1 min-w-0 truncate">{a.task.item.japanese}</span>
                <span className="text-xs text-muted-foreground text-right">{a.task.direction}<br />next {due ? new Date(due).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</span>
              </li>
            );
          })}
        </ol>
      )}
      <div className="flex flex-wrap gap-3">
        <Link href="/" className="rounded-xl bg-primary text-primary-foreground px-6 py-3 font-bold" data-testid="link-results-home">Home</Link>
        <Link href="/learn" className="rounded-xl border px-6 py-3 font-bold" data-testid="link-results-learn">Learn</Link>
        <Link href="/progress" className="rounded-xl border px-6 py-3 font-bold" data-testid="link-results-progress">Progress</Link>
      </div>
    </div>
  );
}
