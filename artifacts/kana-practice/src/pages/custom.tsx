import { useState } from 'react';
import { Link } from 'wouter';
import { toKana } from 'wanakana';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { stageOf } from '@/learning/srs';
import { deleteCustom, saveCustom, useStore } from '@/storage/store';
import { PageHead, SpeakButton, StageChip } from '@/components/study/common';

const EMPTY = { japanese: '', reading: '', meaning: '', note: '' };

export default function Custom() {
  const { data } = useStore();
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const list = data.study.custom;

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setMsg(null);
    try {
      saveCustom({ japanese: form.japanese, reading: form.reading, meaning: form.meaning, note: form.note || undefined }, editId ?? undefined);
      setMsg(editId ? 'Word updated.' : 'Word added to your review queue.');
      setForm(EMPTY); setEditId(null);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save.'); }
  };
  const field = (k: keyof typeof EMPTY, label: string, opts: { kana?: boolean; ph?: string; req?: boolean } = {}) => (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-muted-foreground">{label}{opts.req ? '' : ' (optional)'}</span>
      <input value={form[k]} required={opts.req} maxLength={k === 'note' ? 1000 : k === 'meaning' ? 300 : k === 'reading' ? 240 : 160} placeholder={opts.ph} lang={opts.kana ? 'ja' : undefined}
        onChange={(e) => setForm({ ...form, [k]: opts.kana ? toKana(e.target.value, { IMEMode: true }) : e.target.value })}
        className={`w-full rounded-xl border-2 bg-background px-3 py-2.5 focus:outline-none focus:border-primary ${opts.kana || k === 'japanese' ? 'font-kana text-xl' : ''}`} data-testid={`input-custom-${k}`} />
    </label>
  );

  return (
    <div className="space-y-8 max-w-3xl">
      <Link href="/learn" className="inline-flex items-center gap-1 text-sm text-muted-foreground" data-testid="link-back-learn"><ArrowLeft className="w-4 h-4" /> Learn</Link>
      <PageHead kicker="自分の言葉 / my words" title="My words">Words from your tutor, a show, a menu. They join the same spaced-review queue and count toward the daily new limit.</PageHead>
      <form onSubmit={submit} className="rise rounded-3xl border bg-card p-5 space-y-3" data-testid="form-custom">
        <h2 className="font-bold">{editId ? 'Edit word' : 'Add a word'}</h2>
        {editId && <p className="text-sm text-muted-foreground">Changing the Japanese, reading or meaning restarts only this word's review schedule and mastery. A note-only change keeps its progress.</p>}
        <div className="grid sm:grid-cols-2 gap-3">
          {field('japanese', 'Japanese (as written)', { req: true, ph: '海賊' })}
          {field('reading', 'Reading in kana (type romaji)', { kana: true, req: true, ph: 'かいぞく' })}
          {field('meaning', 'Meaning', { req: true, ph: 'pirate' })}
          {field('note', 'Note', { ph: 'from One Piece' })}
        </div>
        {error && <p role="alert" className="text-sm rounded-xl bg-destructive/12 text-destructive px-3 py-2" data-testid="text-custom-error">{error}</p>}
        {msg && <p className="text-sm rounded-xl bg-matcha/15 px-3 py-2" data-testid="text-custom-success">{msg}</p>}
        <div className="flex gap-2">
          <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 font-bold" data-testid="button-save-custom"><Plus className="w-4 h-4" /> {editId ? 'Save changes' : 'Add word'}</button>
          {editId && <button type="button" onClick={() => { setEditId(null); setForm(EMPTY); }} className="rounded-xl border px-4 py-2.5 font-bold" data-testid="button-cancel-edit">Cancel</button>}
        </div>
      </form>
      {list.length === 0 ? (
        <div className="text-center py-10 rounded-3xl border border-dashed"><div className="font-kana text-6xl text-primary/25">ことば</div><p className="text-muted-foreground mt-2">No words of your own yet.</p></div>
      ) : (
        <ul className="divide-y rounded-2xl border bg-card">
          {list.map((w) => (
            <li key={w.id} className="px-4 py-3 space-y-2" data-testid={`row-custom-${w.id}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-kana text-2xl font-bold break-words">{w.japanese} <span className="text-base font-normal text-muted-foreground">{w.reading}</span></div>
                  <div className="text-sm">{w.meanings.join('; ')}</div>
                  {w.note && <div className="text-xs italic text-muted-foreground">{w.note}</div>}
                </div>
                <StageChip stage={stageOf(data.study.cards[w.id])} />
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <SpeakButton text={w.japanese} id={w.id} />
                <button onClick={() => { setEditId(w.id); setForm({ japanese: w.japanese, reading: w.reading, meaning: w.meanings.join('; '), note: w.note ?? '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold" data-testid={`button-edit-${w.id}`}><Pencil className="w-3 h-3" /> Edit</button>
                <button onClick={() => setConfirmId(w.id)} className="inline-flex items-center gap-1 rounded-full border border-destructive/50 text-destructive px-3 py-1 text-xs font-semibold" data-testid={`button-delete-${w.id}`}><Trash2 className="w-3 h-3" /> Delete</button>
              </div>
              {confirmId === w.id && (
                <div className="rounded-xl border-2 border-destructive/50 p-3 text-sm space-y-2" data-testid="panel-confirm-delete">
                  <p>Delete this word? Its review history is removed too. Other progress is not affected.</p>
                  <div className="flex gap-2">
                    <button onClick={() => { try { deleteCustom(w.id); setConfirmId(null); if (editId === w.id) { setEditId(null); setForm(EMPTY); } } catch (err) { setError(err instanceof Error ? err.message : 'Delete failed.'); } }} className="rounded-xl bg-destructive text-destructive-foreground px-3 py-1.5 font-bold" data-testid="button-confirm-delete">Delete</button>
                    <button onClick={() => setConfirmId(null)} className="rounded-xl border px-3 py-1.5 font-bold" data-testid="button-cancel-delete">Keep</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
