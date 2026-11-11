import { useEffect, useRef, useState } from 'react';
import { toKana, toKatakana } from 'wanakana';
import { ArrowRight, Check, Volume2, X } from 'lucide-react';
import { checkStudyAnswer } from '@/learning/service';
import { speakJapanese } from '@/learning/audio';
import type { ReviewTask } from '@/learning/types';
import { KIND_LABEL, SpeakButton } from './common';
import { getData } from '@/storage/store';
import { rowHint, typedFeedback } from '@/practice/feedback';

const PARTICLES = ['は', 'が', 'を', 'に', 'で', 'へ'];

/** One task. Calls onFirst exactly once with the first submitted answer. */
export function TaskCard({ task, onFirst, onNext, onDontKnow, retry = false }: { task: ReviewTask; onFirst: (correct: boolean) => boolean; onNext: () => void; onDontKnow: () => void; retry?: boolean }) {
  const { item, direction, mode } = task;
  const [value, setValue] = useState('');
  const [result, setResult] = useState<null | boolean>(null);
  const [fixed, setFixed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [misses, setMisses] = useState(0);
  const [given, setGiven] = useState('');
  const [speakErr, setSpeakErr] = useState<string | null>(null);
  const [introducing, setIntroducing] = useState(() => !getData().study.cards[item.id] && !retry);
  const inputRef = useRef<HTMLInputElement>(null);
  const pIdx = item.particleIndices?.[0] ?? -1;
  const kanaInput = mode === 'listening' || (mode === 'particle' && revealed) || (mode === 'text' && direction === 'production');
  const katakanaInput = kanaInput && ['kana', 'combo', 'word'].includes(item.kind) && /^[ァ-ヶー]+$/u.test(item.japanese);
  const romajiExpected = mode === 'text' && direction === 'recognition' && (item.kind === 'kana' || item.kind === 'combo');
  const done = result === true || fixed;
  const showAnswer = done || revealed;

  const play = async () => { setSpeakErr(null); try { await speakJapanese(item.japanese); } catch (e) { setSpeakErr(e instanceof Error ? e.message : 'Could not play audio.'); } };
  useEffect(() => { if (mode === 'listening') void play(); inputRef.current?.focus(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const check = (v: string) => mode === 'particle' ? checkStudyAnswer(item, direction, v, 'particle', pIdx) : checkStudyAnswer(item, direction, v, mode);
  const submit = (v: string) => {
    if (!v.trim()) return;
    const ok = check(v);
    if (result === null && !onFirst(ok)) return;
    if (result === null) setResult(ok);
    setGiven(v.trim());
    setValue('');
    if (ok) setFixed(true); else setMisses((n) => n + 1);
  };
  const dontKnow = () => {
    if (result === null && !onFirst(false)) return;
    if (result === null) setResult(false);
    setRevealed(true);
    setValue('');
    onDontKnow();
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  if (introducing) return (
    <div className="rise rounded-3xl border bg-card p-5 sm:p-8 space-y-5" data-testid="panel-new-lesson">
      <p className="text-xs font-mono uppercase tracking-wider text-primary">New · learn it first</p>
      {item.character && <div className="font-kana text-8xl font-black text-center">{item.character}</div>}
      <div className="font-kana text-4xl sm:text-5xl font-black text-center break-words">{item.japanese}</div>
      <div className="font-kana text-xl text-center">{item.reading}</div>
      <div className="text-xl font-semibold text-center">{item.meanings.join('; ')}</div>
      {item.note && <p className="text-sm text-muted-foreground">{item.note}</p>}
      <SpeakButton text={item.japanese} id="lesson" />
      <p className="text-xs text-muted-foreground">Study this example, then recall it. Opening the lesson does not count as a correct answer.</p>
      <button onClick={() => { setIntroducing(false); dontKnow(); }} className="w-full rounded-2xl border py-3 font-bold" data-testid="button-dont-know">I don’t know</button>
      <button onClick={() => { setIntroducing(false); requestAnimationFrame(() => inputRef.current?.focus()); }} className="w-full rounded-2xl bg-primary text-primary-foreground py-4 text-lg font-bold" data-testid="button-start-recall">Ready to recall</button>
    </div>
  );
  let prompt: React.ReactNode;
  if (mode === 'particle') prompt = <div className="font-kana text-3xl sm:text-5xl font-bold leading-snug break-words">{item.japanese.slice(0, pIdx)}<span className="inline-block min-w-[1.2em] border-b-4 border-primary text-primary">{showAnswer ? item.japanese[pIdx] : '？'}</span>{item.japanese.slice(pIdx + 1)}</div>;
  else if (mode === 'listening') prompt = <button onClick={play} className="lift inline-flex items-center gap-3 rounded-2xl bg-primary text-primary-foreground px-6 py-4 text-lg font-bold" data-testid="button-replay"><Volume2 className="w-6 h-6" /> Play again</button>;
  else if (direction === 'recognition') prompt = <div className="font-kana text-6xl sm:text-8xl font-black leading-tight break-words" data-testid="text-prompt">{item.japanese}</div>;
  else prompt = <div className="text-2xl sm:text-4xl font-extrabold leading-tight" data-testid="text-prompt">{item.meanings.join('; ')}</div>;

  const instruction = mode === 'particle' ? 'Pick the missing particle.' : mode === 'listening' ? 'Listen, then type what you hear in kana.' : direction === 'production' ? 'Type the Japanese (romaji converts to kana).' : romajiExpected ? 'Type the romaji reading.' : 'Type the English meaning.';

  return (
    <div className="rise rounded-3xl border bg-card p-5 sm:p-8 space-y-5" data-testid="card-task">
      <div className="flex justify-between text-xs font-mono uppercase tracking-wider text-muted-foreground">
        <span>{KIND_LABEL[item.kind] ?? item.kind}{item.character && mode !== 'listening' ? ` · ${item.character}` : ''}</span>
        <span>{mode === 'text' ? direction : mode}</span>
      </div>
      {retry && <p className="text-sm font-bold text-primary">Practice again · no extra SRS score</p>}
      <div className="min-h-32 grid place-items-center text-center">{prompt}</div>
      {speakErr && <p role="alert" className="text-sm text-destructive text-center">{speakErr}</p>}
      <p className="text-sm text-muted-foreground text-center">{revealed && !done ? 'Answer revealed. Type the correct answer once to continue.' : instruction}</p>
      {result !== null && <div role="status" aria-live="polite" className={`rounded-2xl border-2 p-4 ${done ? 'border-green-600 bg-green-50 text-green-950' : 'border-red-600 bg-red-50 text-red-950'}`} data-testid="text-feedback">
        <div className="flex items-center gap-3 text-2xl font-extrabold">{done ? <><Check className="w-8 h-8 shrink-0" /> Correct{result === false ? ' · recovered' : ''}</> : <><X className="w-8 h-8 shrink-0" /> {revealed ? 'Answer revealed · missed' : 'Not quite · try again'}</>}</div>
        {!done && given && <p className="mt-2 break-words">{typedFeedback(given, romajiExpected, /^[ァ-ヶー]+$/u.test(item.japanese))}</p>}
        {!done && misses >= 2 && !revealed && <p className="mt-2 font-bold" data-testid="text-hint">{rowHint(item.japanese, item.reading)}</p>}
        <p className="mt-2 text-xs">{retry ? 'Extra practice only; your SRS score is unchanged.' : 'Only your first answer is scored. Further guesses and corrections don’t change it.'}</p>
      </div>}

      {!done && (mode === 'particle' && !revealed ? (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {PARTICLES.map((p) => <button key={p} onClick={() => submit(p)} className="lift font-kana text-3xl font-bold rounded-2xl border-2 py-3 hover:border-primary" data-testid={`button-particle-${p}`}>{p}</button>)}
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); submit(value); }} className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground" htmlFor="answer">{kanaInput ? 'Kana answer' : romajiExpected ? 'Romaji' : 'English'}</label>
          <div className="flex gap-2">
            <input id="answer" ref={inputRef} value={value} autoComplete="off" autoCapitalize="off" spellCheck={false} lang={kanaInput ? 'ja' : 'en'}
              onChange={(e) => setValue(kanaInput ? (katakanaInput ? toKatakana(e.target.value, { IMEMode: true }) : toKana(e.target.value, { IMEMode: true })) : e.target.value)}
              className={`flex-1 min-w-0 rounded-2xl border-2 bg-background px-4 py-3 ${kanaInput ? 'font-kana text-2xl' : 'text-lg'} focus:outline-none focus:border-primary`} data-testid="input-answer" />
            <button type="submit" className="rounded-2xl bg-ink text-background px-5 font-bold" data-testid="button-submit-answer">Check</button>
          </div>
        </form>
      ))}
      {!done && !revealed && <button type="button" onClick={dontKnow} className="w-full rounded-2xl border-2 py-3 font-bold" data-testid="button-dont-know">I don’t know</button>}

      {showAnswer && (
        <div className={`rounded-2xl p-4 space-y-2 ${result ? 'bg-matcha/15' : 'bg-destructive/10'}`} data-testid="panel-reveal">
          <div className="font-bold" data-testid="text-result">{done ? 'Answer' : 'Type this answer to continue'}</div>
          {mode === 'particle' && <div className="font-kana text-4xl font-bold">{item.japanese[pIdx]}</div>}
          <div className="font-kana text-3xl font-bold break-words">{item.japanese}</div>
          <div className="font-kana text-lg text-muted-foreground">{item.reading}</div>
          <div>{item.meanings.join('; ')}</div>
          {item.note && <div className="text-sm italic">{item.note}</div>}
          {item.attribution && <div className="text-xs text-muted-foreground">{item.attribution}</div>}
          <SpeakButton text={item.japanese} id="reveal" />
        </div>
      )}
      {done && <button autoFocus onClick={onNext} className="lift w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground py-4 text-lg font-bold" data-testid="button-next">Next <ArrowRight className="w-5 h-5" /></button>}
    </div>
  );
}
