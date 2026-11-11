import type { KanaScript } from '@/data/kana';

const OPTS: { id: KanaScript; label: string; jp: string }[] = [
  { id: 'hiragana', label: 'Hiragana', jp: 'ひらがな' },
  { id: 'katakana', label: 'Katakana', jp: 'カタカナ' },
];

export function ScriptSwitch({ value, onChange, testPrefix = 'button-script' }: { value: KanaScript; onChange: (s: KanaScript) => void; testPrefix?: string }) {
  return (
    <div role="radiogroup" aria-label="Script" className="relative inline-grid grid-cols-2 rounded-2xl border bg-card p-1 w-full sm:w-auto">
      <span aria-hidden className="absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-xl bg-ink transition-transform duration-300 ease-[cubic-bezier(.2,.9,.3,1.2)]"
        style={{ transform: value === 'katakana' ? 'translateX(100%)' : 'none' }} />
      {OPTS.map((o) => (
        <button key={o.id} role="radio" aria-checked={value === o.id} onClick={() => onChange(o.id)} data-testid={`${testPrefix}-${o.id}`}
          className={`relative z-10 px-5 py-2 rounded-xl text-left transition-colors ${value === o.id ? 'text-background' : 'text-muted-foreground hover:text-foreground'}`}>
          <span className="block font-kana font-bold text-lg leading-tight">{o.jp}</span>
          <span className="block text-xs font-semibold opacity-80">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
