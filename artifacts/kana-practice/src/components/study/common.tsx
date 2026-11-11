import type { ReactNode } from 'react';
import { AlertTriangle, RotateCw, Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';
import { useCatalog } from '@/learning/catalog';
import { speakJapanese, useJapaneseVoice } from '@/learning/audio';
import type { Catalog, Stage } from '@/learning/types';

export function CatalogGate({ children }: { children: (catalog: Catalog) => ReactNode }) {
  const { catalog, loading, error, retry } = useCatalog();
  if (error) return (
    <div role="alert" className="rounded-2xl border-2 border-destructive/50 bg-card p-5 space-y-3" data-testid="status-catalog-error">
      <div className="flex gap-2 font-bold text-destructive"><AlertTriangle className="w-4 h-4 mt-1" /> Study data could not load</div>
      <p className="text-sm text-muted-foreground">{error}</p>
      <button onClick={retry} className="inline-flex items-center gap-2 rounded-xl bg-ink text-background px-4 py-2 font-bold" data-testid="button-catalog-retry"><RotateCw className="w-4 h-4" /> Try again</button>
    </div>
  );
  if (loading || !catalog) return (
    <div className="space-y-3" data-testid="status-catalog-loading" aria-busy="true">
      <div className="h-8 w-1/2 rounded-xl bg-muted animate-pulse" />
      <div className="h-24 rounded-2xl bg-muted animate-pulse" />
      <div className="h-24 rounded-2xl bg-muted/70 animate-pulse" />
      <p className="text-xs text-muted-foreground">Loading kanji, dictionary and sentences…</p>
    </div>
  );
  return <>{children(catalog)}</>;
}

export function SpeakButton({ text, label = 'Listen', id }: { text: string; label?: string; id: string }) {
  const { available, loading } = useJapaneseVoice();
  const [err, setErr] = useState<string | null>(null);
  const off = !available || loading;
  return (
    <span className="inline-flex flex-col items-start">
      <button type="button" disabled={off} aria-label={off ? 'Japanese voice unavailable' : `Listen to ${text}`} title={off ? 'No Japanese (ja-JP) voice in this browser' : label || 'Listen'}
        onClick={async () => { setErr(null); try { await speakJapanese(text); } catch (e) { setErr(e instanceof Error ? e.message : 'Speech failed'); } }}
        className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-semibold hover:border-primary disabled:opacity-50" data-testid={`button-speak-${id}`}>
        {off ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        {loading ? 'Checking voice' : available ? label : 'No voice'}
      </button>
      {err && <span className="text-[11px] text-destructive mt-1">{err}</span>}
    </span>
  );
}

const STAGE_TONE: Record<Stage, string> = {
  New: 'bg-muted text-muted-foreground', Learning: 'bg-chart-5/20', Familiar: 'bg-accent text-accent-foreground',
  Strong: 'bg-primary/15 text-primary', Mastered: 'bg-ink text-background',
};
export function StageChip({ stage }: { stage: Stage }) {
  return <span className={`text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${STAGE_TONE[stage]}`}>{stage}</span>;
}

export function PageHead({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <header className="rise">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">{kicker}</p>
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mt-2">{title}</h1>
      {children && <div className="text-muted-foreground mt-2 max-w-2xl">{children}</div>}
    </header>
  );
}

export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      <button disabled={page === 0} onClick={() => onPage(page - 1)} className="rounded-xl border px-4 py-2 font-semibold disabled:opacity-40" data-testid="button-page-prev">Previous</button>
      <span className="text-sm tabular-nums" data-testid="text-page">{page + 1} / {pages}</span>
      <button disabled={page >= pages - 1} onClick={() => onPage(page + 1)} className="rounded-xl border px-4 py-2 font-semibold disabled:opacity-40" data-testid="button-page-next">Next</button>
    </div>
  );
}

export const KIND_LABEL: Record<string, string> = { all: 'Everything', kana: 'Kana', word: 'Starter words', combo: 'Combinations', kanji: 'Kanji', vocab: 'Vocabulary', sentence: 'Sentences', phrase: 'Survival phrases', custom: 'My words' };
