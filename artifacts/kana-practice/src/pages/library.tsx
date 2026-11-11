import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Lock, Search } from 'lucide-react';
import { COMBINATION_GROUPS } from '@/learning/catalog';
import { groupUnlocked, unlockReason } from '@/learning/service';
import { stageOf } from '@/learning/srs';
import { setCombination, useStore, type AppData } from '@/storage/store';
import type { Catalog, StudyItem } from '@/learning/types';
import { CatalogGate, PageHead, Pager, SpeakButton, StageChip } from '@/components/study/common';

const TABS = [['kanji', 'Kanji'], ['vocab', 'Vocabulary'], ['sentence', 'Sentences'], ['phrase', 'Survival phrases'], ['combo', 'Combinations']] as const;
type Tab = typeof TABS[number][0];
const PER = 60;

export default function Library() {
  const [tab, setTab] = useState<Tab>('kanji');
  return (
    <div className="space-y-6">
      <Link href="/learn" className="inline-flex items-center gap-1 text-sm text-muted-foreground" data-testid="link-back-learn"><ArrowLeft className="w-4 h-4" /> Learn</Link>
      <PageHead kicker="書庫 / library" title="Library" />
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {TABS.map(([id, l]) => <button key={id} onClick={() => setTab(id)} aria-pressed={tab === id} data-testid={`tab-${id}`}
          className={`shrink-0 px-4 py-2 rounded-full border text-sm font-semibold ${tab === id ? 'bg-ink text-background border-ink' : 'bg-card'}`}>{l}</button>)}
      </div>
      <CatalogGate>{(c) => tab === 'kanji' ? <KanjiTab c={c} /> : tab === 'combo' ? <ComboTab c={c} /> : <ItemList key={tab} c={c} kind={tab} />}</CatalogGate>
    </div>
  );
}

function ItemRow({ item, c, data }: { item: StudyItem; c: Catalog; data: AppData }) {
  const [open, setOpen] = useState(false);
  const reason = unlockReason(item, c, data);
  return (
    <li className="px-4 py-3" data-testid={`row-item-${item.id}`}>
      <button onClick={() => setOpen(!open)} className="w-full text-left flex items-start gap-3" data-testid={`button-open-${item.id}`}>
        <div className="flex-1 min-w-0">
          <div className="font-kana text-2xl font-bold break-words leading-snug">{item.japanese}</div>
          <div className="text-sm text-muted-foreground truncate">{item.meanings.join('; ')}</div>
        </div>
        {reason ? <Lock className="w-4 h-4 text-muted-foreground mt-2 shrink-0" /> : <StageChip stage={stageOf(data.study.cards[item.id])} />}
      </button>
      {open && (
        <div className="mt-3 rounded-xl bg-muted/50 p-3 space-y-1.5 text-sm">
          <div className="font-kana text-lg">{item.reading}</div>
          <div>{item.meanings.join('; ')}</div>
          {item.topic && <div className="text-xs">Topic: {item.topic}</div>}
          {item.note && <div className="italic">{item.note}</div>}
          {item.attribution && <div className="text-xs text-muted-foreground">{item.attribution}</div>}
          {item.source && !item.attribution && <div className="text-xs text-muted-foreground">Source: {item.source}</div>}
          {reason && <div className="text-xs rounded-lg bg-accent text-accent-foreground px-2 py-1" data-testid={`text-lock-${item.id}`}>Locked: {reason}</div>}
          <SpeakButton text={item.japanese} id={item.id} />
        </div>
      )}
    </li>
  );
}

function ItemList({ c, kind }: { c: Catalog; kind: string }) {
  const { data } = useStore();
  const [q, setQ] = useState('');
  const [topic, setTopic] = useState('all');
  const [page, setPage] = useState(0);
  const all = useMemo(() => c.items.filter((i) => i.kind === kind), [c, kind]);
  const topics = useMemo(() => [...new Set(all.map((i) => i.topic).filter(Boolean) as string[])].sort(), [all]);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return all.filter((i) => (topic === 'all' || i.topic === topic) && (!s || i.japanese.includes(s) || i.reading.includes(s) || i.meanings.some((m) => m.toLowerCase().includes(s))));
  }, [all, q, topic]);
  const pages = Math.ceil(list.length / PER);
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <label className="flex-1 flex items-center gap-2 rounded-2xl border bg-card px-3"><Search className="w-4 h-4 text-muted-foreground" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search Japanese, reading or English" className="flex-1 bg-transparent py-2.5 outline-none" data-testid="input-library-search" /></label>
        {topics.length > 0 && <select value={topic} onChange={(e) => { setTopic(e.target.value); setPage(0); }} className="rounded-2xl border bg-card px-3 py-2.5" data-testid="select-topic">
          <option value="all">All topics</option>{topics.map((t) => <option key={t} value={t}>{t}</option>)}</select>}
      </div>
      <p className="text-xs text-muted-foreground" data-testid="text-library-count">{list.length.toLocaleString()} of {all.length.toLocaleString()}</p>
      {list.length === 0 ? <p className="rounded-2xl border border-dashed p-6 text-center text-muted-foreground">Nothing matches.</p> :
        <ul className="divide-y rounded-2xl border bg-card">{list.slice(page * PER, page * PER + PER).map((i) => <ItemRow key={i.id} item={i} c={c} data={data} />)}</ul>}
      <Pager page={page} pages={pages} onPage={setPage} />
    </div>
  );
}

function KanjiTab({ c }: { c: Catalog }) {
  const { data } = useStore();
  const [gid, setGid] = useState(c.groups[0]?.id ?? '');
  const [char, setChar] = useState<string | null>(null);
  const [gPage, setGPage] = useState(0);
  const group = c.groups.find((g) => g.id === gid);
  const byChar = useMemo(() => new Map(c.kanji.map((k) => [k.char, k])), [c]);
  const kItems = useMemo(() => c.items.filter((i) => i.kind === 'kanji'), [c]);
  const groupPages = Math.ceil(c.groups.length / PER);
  const entry = char ? byChar.get(char) : null;
  const firstItem = group ? kItems.find((i) => i.groupId === group.id) : undefined;
  const open = group ? groupUnlocked(group.id, c, data) : false;
  const reason = !open && firstItem ? unlockReason(firstItem, c, data) : null;
  return (
    <div className="grid md:grid-cols-[16rem_1fr] gap-4">
      <div className="space-y-2">
        <ul className="rounded-2xl border bg-card divide-y max-h-80 md:max-h-[34rem] overflow-y-auto">
          {c.groups.slice(gPage * PER, gPage * PER + PER).map((g) => (
            <li key={g.id}><button onClick={() => { setGid(g.id); setChar(null); }} className={`w-full text-left px-3 py-2 flex justify-between items-center gap-2 ${g.id === gid ? 'bg-primary/10' : ''}`} data-testid={`button-group-${g.id}`}>
              <span className="text-sm font-semibold truncate">{g.name}</span>
              <span className="font-kana text-sm text-muted-foreground shrink-0 flex items-center gap-1">{g.characters.slice(0, 3).join('')}{!groupUnlocked(g.id, c, data) && <Lock className="w-3 h-3" />}</span>
            </button></li>
          ))}
        </ul>
        <Pager page={gPage} pages={groupPages} onPage={setGPage} />
      </div>
      <div className="space-y-4">
        {group && <>
          <div className="flex items-baseline justify-between gap-2"><h2 className="font-bold text-lg">{group.name}</h2><span className="text-xs text-muted-foreground">{group.characters.length} kanji</span></div>
          {reason && <p className="text-sm rounded-xl bg-accent text-accent-foreground px-4 py-3" data-testid="text-group-lock">Locked: {reason}</p>}
          <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
            {group.characters.map((ch) => {
              const it = kItems.find((i) => i.character === ch);
              return <button key={ch} onClick={() => setChar(ch)} data-testid={`button-kanji-${ch}`}
                className={`lift rounded-xl border-2 aspect-square grid place-items-center font-kana text-3xl font-black ${char === ch ? 'border-primary bg-primary/10' : 'bg-card'} ${it && stageOf(data.study.cards[it.id]) !== 'New' ? 'text-primary' : ''}`}>{ch}</button>;
            })}
          </div>
        </>}
        {entry && (
          <div className="rise rounded-3xl border bg-card p-5 space-y-4" data-testid="panel-kanji-detail">
            <div className="flex gap-5 items-start">
              <div className="font-kana text-8xl font-black leading-none">{entry.char}</div>
              <div className="space-y-1 text-sm min-w-0">
                <div className="font-bold text-base">{entry.meanings.join(', ')}</div>
                <div><span className="text-muted-foreground">On </span><span className="font-kana">{entry.on.join('、') || '-'}</span></div>
                <div><span className="text-muted-foreground">Kun </span><span className="font-kana">{entry.kun.join('、') || '-'}</span></div>
                <div className="text-xs text-muted-foreground">{entry.strokes} strokes · grade {entry.grade}{entry.jlpt ? ` · legacy JLPT ${entry.jlpt}` : ''}{entry.frequency ? ` · freq #${entry.frequency}` : ''}</div>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-sm mb-2">Examples</h3>
              {entry.examples.length === 0 && <p className="text-sm text-muted-foreground rounded-xl border p-3">Reference only: {entry.exampleStatus} This character is not quizzed and does not block the next group.</p>}
              <ul className="space-y-2">{entry.examples.map((e, i) => (
                <li key={i} className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2">
                  <div className="flex-1 min-w-0"><div className="font-kana text-xl font-bold">{e.japanese} <span className="text-sm font-normal text-muted-foreground">{e.reading}</span></div><div className="text-sm">{e.meaning}</div></div>
                  <SpeakButton text={e.japanese} id={`ex-${i}`} label="" />
                </li>))}</ul>
            </div>
            <ul className="divide-y rounded-xl border">{kItems.filter((i) => i.character === entry.char).map((i) => <ItemRow key={i.id} item={i} c={c} data={data} />)}</ul>
          </div>
        )}
      </div>
    </div>
  );
}

function ComboTab({ c }: { c: Catalog }) {
  const { data } = useStore();
  const on = new Set(data.study.combinations);
  const combos = c.items.filter((i) => i.kind === 'combo');
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Combination sets (small ya/yu/yo, voiced marks and more) join your queue when you switch them on. Basic kana rows remain selected separately on the Practice screen.</p>
      {COMBINATION_GROUPS.map((g) => {
        const items = combos.filter((i) => i.comboGroup === g.id);
        const locked = items.map((i) => unlockReason(i, c, data)).find(Boolean);
        const active = on.has(g.id);
        return (
          <div key={g.id} className="rounded-2xl border bg-card p-4 space-y-2" data-testid={`card-combo-${g.id}`}>
            <div className="flex items-center justify-between gap-3">
              <div><div className="font-bold">{g.label}</div><div className="font-kana text-lg break-all">{items.slice(0, 20).map((i) => i.japanese).join(' ')}</div></div>
              <button onClick={() => setCombination(g.id, !active)} aria-pressed={active} data-testid={`button-combo-${g.id}`}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${active ? 'bg-primary text-primary-foreground' : 'border'}`}>{active ? 'On' : 'Turn on'}</button>
            </div>
            {active && locked && <p className="text-xs rounded-lg bg-accent text-accent-foreground px-2 py-1">Waiting: {locked}</p>}
          </div>
        );
      })}
    </div>
  );
}
