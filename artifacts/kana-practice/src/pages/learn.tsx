import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowRight, BookOpen, Info, PenLine, Timer } from 'lucide-react';
import { studyCounts } from '@/learning/service';
import { useJapaneseVoice } from '@/learning/audio';
import { STAGES } from '@/learning/types';
import { useStore } from '@/storage/store';
import { CatalogGate, KIND_LABEL, PageHead, StageChip } from '@/components/study/common';

const KINDS = ['all', 'kana', 'word', 'combo', 'kanji', 'vocab', 'sentence', 'phrase', 'custom'];

function Opt({ on, onClick, children, id, disabled }: { on: boolean; onClick: () => void; children: React.ReactNode; id: string; disabled?: boolean }) {
  return <button disabled={disabled} aria-pressed={on} onClick={onClick} data-testid={id}
    className={`px-4 py-2 rounded-full border text-sm font-semibold disabled:opacity-40 ${on ? 'bg-ink text-background border-ink' : 'bg-card hover:border-foreground/30'}`}>{children}</button>;
}

export default function Learn() {
  const { data } = useStore();
  const [, nav] = useLocation();
  const voice = useJapaneseVoice();
  const [kind, setKind] = useState('all');
  const [direction, setDirection] = useState('mixed');
  const [mode, setMode] = useState<'text' | 'listening' | 'particle'>('text');
  const start = () => nav(`/review?${new URLSearchParams({ kind: mode === 'particle' ? 'sentence' : kind, direction, mode })}`);

  return (
    <div className="space-y-8">
      <PageHead kicker="学ぶ / learn" title="Learn">Everything you study is scheduled with spaced repetition. Reviews that are due come first, then up to {data.settings.newPerDay} new items per day.</PageHead>
      <CatalogGate>{(catalog) => {
        const c = studyCounts(catalog, data);
        return (<>
          <section className="rise grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat n={c.due} l="due now" id="due" strong />
            <Stat n={c.newRemaining} l={`new left today (${c.introducedToday} introduced)`} id="new" />
            <Stat n={c.unlocked} l={`unlocked of ${c.total}`} id="unlocked" />
            <div className="stat-card rounded-2xl border bg-card p-4 col-span-2 sm:col-span-1 flex flex-wrap gap-1.5 content-start">
              {STAGES.map((s) => <span key={s} className="flex items-center gap-1" data-testid={`text-stage-${s}`}><StageChip stage={s} /><span className="text-sm tabular-nums">{c.stages[s]}</span></span>)}
            </div>
          </section>

          <section className="rise space-y-5 rounded-3xl border bg-card p-5 sm:p-6" style={{ animationDelay: '60ms' }}>
            <div><h2 className="font-bold mb-2">What</h2><div className="flex flex-wrap gap-2">{KINDS.map((k) => <Opt key={k} id={`button-kind-${k}`} on={kind === k} disabled={mode === 'particle' && k !== 'sentence'} onClick={() => setKind(k)}>{KIND_LABEL[k]}</Opt>)}</div></div>
            <div><h2 className="font-bold mb-2">Direction</h2><div className="flex flex-wrap gap-2">
              <Opt id="button-dir-mixed" on={direction === 'mixed'} onClick={() => setDirection('mixed')}>Both</Opt>
              <Opt id="button-dir-recognition" on={direction === 'recognition'} onClick={() => setDirection('recognition')}>Japanese to English</Opt>
              <Opt id="button-dir-production" on={direction === 'production'} onClick={() => setDirection('production')}>English to Japanese</Opt>
            </div></div>
            <div><h2 className="font-bold mb-2">Study mode</h2><div className="flex flex-wrap gap-2">
              <Opt id="button-mode-text" on={mode === 'text'} onClick={() => setMode('text')}>Read and type</Opt>
              <Opt id="button-mode-listening" on={mode === 'listening'} disabled={!voice.available} onClick={() => setMode('listening')}>Listening</Opt>
              <Opt id="button-mode-particle" on={mode === 'particle'} onClick={() => setMode('particle')}>Particles</Opt>
            </div>
              {!voice.available && <p className="text-xs text-muted-foreground mt-2" data-testid="text-voice-unavailable">{voice.loading ? 'Checking for a Japanese voice…' : 'Listening is disabled: this browser has no Japanese (ja-JP) speech voice. Install one in your system settings to enable it.'}</p>}
              {mode === 'particle' && <p className="text-xs text-muted-foreground mt-2">Particle drills use sentences only; one particle is hidden.</p>}
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={start} className="lift inline-flex items-center gap-2 rounded-2xl bg-primary text-primary-foreground px-6 py-4 font-bold text-lg" data-testid="button-start-session">Start {data.settings.minutes}-min session <ArrowRight className="w-5 h-5" /></button>
              <button onClick={() => nav('/review?quick=1')} className="inline-flex items-center gap-2 rounded-2xl border px-6 py-4 font-bold" data-testid="button-learn-quick"><Timer className="w-5 h-5" /> Quick 3-min</button>
            </div>
          </section>
        </>);
      }}</CatalogGate>

      <section className="grid sm:grid-cols-3 gap-3">
        <Card href="/library" icon={<BookOpen className="w-5 h-5" />} title="Library" sub="Kanji, vocabulary, sentences, phrases, combinations" id="library" />
        <Card href="/custom" icon={<PenLine className="w-5 h-5" />} title="My words" sub="Add your own words to the same queue" id="custom" />
        <Card href="/about" icon={<Info className="w-5 h-5" />} title="Sources" sub="Data counts, licenses and updates" id="about" />
      </section>

      <section className="rounded-2xl border border-dashed p-5 text-sm space-y-2" data-testid="section-progression">
        <h2 className="font-bold text-base">How progression works</h2>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
          <li>Only your first answer to each prompt counts. Keep guessing after a miss; a hint appears after two misses. “I don’t know” reveals the answer, requires a correct retype, and brings it back soon as unscored practice.</li>
          <li>Correct answers stretch the interval (1 day, 6 days, then multiplied by ease). Several correct answers on the same day do not promote.</li>
          <li>Stages: Learning, Familiar (2 days correct), Strong (4 days and both directions), Mastered (8 days with 3+ in each direction).</li>
          <li>Kanji arrive in groups. The next group opens once every earlier character is Strong, with 90% or better accuracy across at least two sessions.</li>
          <li>Words and sentences open when the kana and kanji they use are unlocked. The Library shows the exact reason for anything locked.</li>
          <li>The daily new limit applies to scheduled learning; optional free drills remain available. Free starter-word drills test pronunciation, so they keep their reading stats but do not advance English-meaning mastery.</li>
        </ul>
      </section>
    </div>
  );
}

function Stat({ n, l, id, strong }: { n: number; l: string; id: string; strong?: boolean }) {
  return <div className={`stat-card rounded-2xl p-4 ${strong ? 'bg-ink text-background' : 'bg-card border'}`}><div className="text-4xl font-extrabold tabular-nums" data-testid={`text-learn-${id}`}>{n}</div><div className="text-xs opacity-70">{l}</div></div>;
}
function Card({ href, icon, title, sub, id }: { href: string; icon: React.ReactNode; title: string; sub: string; id: string }) {
  return <Link href={href} className="lift rounded-2xl border bg-card p-4 block" data-testid={`link-learn-${id}`}><div className="text-primary">{icon}</div><div className="font-bold mt-2">{title}</div><div className="text-sm text-muted-foreground">{sub}</div></Link>;
}
