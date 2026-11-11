import { Moon, Palette, Sun } from 'lucide-react';
import { updateSettings, useStore } from '@/storage/store';
import { useSystemReducedMotion } from '@/themes/reduced-motion';
import type { Appearance } from '@/themes/ids';

const OPTS: { id: Appearance; label: string; Icon: typeof Sun }[] = [
  { id: 'theme', label: 'Theme default', Icon: Palette }, { id: 'light', label: 'Light', Icon: Sun }, { id: 'dark', label: 'Dark', Icon: Moon },
];

export function AppearanceControls() {
  const { data } = useStore();
  const ap = data.settings.appearance ?? 'theme';
  const userReduce = data.settings.reduceMotion === true;
  const sys = useSystemReducedMotion();
  const on = userReduce || sys;
  return (
    <div className="grid sm:grid-cols-2 gap-4 mb-5">
      <div>
        <div className="text-sm font-semibold mb-2">Light / dark</div>
        <div role="radiogroup" aria-label="Appearance" className="inline-flex rounded-full border bg-background p-1">
          {OPTS.map(({ id, label, Icon }) => (
            <button key={id} role="radio" aria-checked={ap === id} onClick={() => updateSettings({ appearance: id })} data-testid={`button-appearance-${id}`}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold inline-flex items-center gap-1.5 transition-colors ${ap === id ? 'bg-ink text-background' : 'text-muted-foreground'}`}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-sm font-semibold mb-2">Reduce motion</div>
        <button role="switch" aria-checked={on} disabled={sys} onClick={() => updateSettings({ reduceMotion: !userReduce })} data-testid="switch-reduce-motion"
          className="inline-flex items-center gap-3 disabled:cursor-not-allowed">
          <span className={`w-11 h-6 rounded-full p-0.5 transition-colors ${on ? 'bg-primary' : 'bg-muted border'}`}>
            <span className={`block w-5 h-5 rounded-full bg-card shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
          </span>
          <span className="text-sm">{on ? 'On: static motifs only' : 'Off: subtle animations'}</span>
        </button>
        {sys && <p className="text-xs text-muted-foreground mt-1.5" data-testid="text-system-reduced">Your device asks for reduced motion, so it stays on.</p>}
      </div>
    </div>
  );
}
