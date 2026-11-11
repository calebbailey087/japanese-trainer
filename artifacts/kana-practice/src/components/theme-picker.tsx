import { useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { updateSettings, useStore } from '@/storage/store';
import { GROUPS, THEMES, isDarkFor, type ThemeGroup, type ThemeId } from '@/themes/themes';
import { generateTokens } from '@/themes/palettes';

export function ThemePicker() {
  const { data } = useStore();
  const current = (data.settings.theme ?? 'paper') as ThemeId;
  const appearance = data.settings.appearance ?? 'theme';
  const [group, setGroup] = useState<ThemeGroup | 'all'>('all');
  const [q, setQ] = useState('');
  const list = useMemo(() => THEMES.filter((t) => (group === 'all' || t.group === group)
    && (!q.trim() || `${t.name} ${t.jp} ${t.tagline}`.toLowerCase().includes(q.trim().toLowerCase()))), [group, q]);
  const cur = THEMES.find((t) => t.id === current);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center mb-3">
        <label className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${THEMES.length} themes`} data-testid="input-theme-search"
            className="w-full rounded-full border bg-background pl-9 pr-4 py-2 text-sm outline-none focus:border-primary" />
        </label>
        <span className="text-xs text-muted-foreground" data-testid="text-current-theme">Current: <b className="text-foreground">{cur?.name}</b></span>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 -mx-1 px-1">
        {[{ id: 'all' as const, label: 'All' }, ...GROUPS].map((g) => (
          <button key={g.id} onClick={() => setGroup(g.id)} data-testid={`button-theme-group-${g.id}`}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold border ${group === g.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground'}`}>
            {g.label}
          </button>
        ))}
      </div>
      {list.length === 0 && <p className="text-sm text-muted-foreground rounded-xl border border-dashed p-4">No theme matches "{q}".</p>}
      <div role="radiogroup" aria-label="Theme" className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[34rem] overflow-y-auto p-0.5">
        {list.map((t) => {
          const on = current === t.id;
          const s = generateTokens(t.spec, isDarkFor(t, appearance));
          const c = (k: string) => `hsl(${s[k]})`;
          return (
            <button key={t.id} role="radio" aria-checked={on} data-testid={`button-theme-${t.id}`}
              onClick={() => updateSettings({ theme: t.id })}
              className={`lift group text-left rounded-2xl border-2 p-2.5 flex gap-3 items-stretch ${on ? 'border-primary shadow-md' : 'border-border hover:border-foreground/30'}`}>
              <div className="w-20 shrink-0 rounded-xl p-2 relative overflow-hidden" style={{ background: c('background') }}>
                <div className="rounded-md h-full p-1.5 flex flex-col justify-between gap-2" style={{ background: c('card') }}>
                  <span className="font-kana font-black text-xl leading-none" style={{ color: c('foreground') }}>{t.jp.slice(0, 1)}</span>
                  <div className="flex gap-1">
                    <span className="h-2 flex-1 rounded-full" style={{ background: c('primary') }} />
                    <span className="h-2 w-3 rounded-full" style={{ background: c('accent') }} />
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0 py-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold truncate">{t.name} <span className="font-kana text-sm text-muted-foreground font-normal">{t.jp}</span></span>
                  <span className={`w-5 h-5 shrink-0 rounded-full grid place-items-center transition-all ${on ? 'bg-primary text-primary-foreground scale-100' : 'border scale-90'}`}>
                    {on && <Check className="w-3 h-3" strokeWidth={3} />}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">{t.tagline}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
