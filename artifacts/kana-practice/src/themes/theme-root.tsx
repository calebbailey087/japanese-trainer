import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/storage/store';
import { applyTheme, type ThemeId } from './themes';
import { useEffectiveReducedMotion } from './reduced-motion';
import { createActiveClock, SHOOTING_STAR_INTERVAL } from './motion-clock';
import { ClassicMotif } from './motifs-classic';
import { JapanMotif } from './motifs-japan';
import { MoreMotif } from './motifs-more';
import './motifs.css';

export function ThemeRoot() {
  const { data } = useStore();
  const theme = (data.settings.theme ?? 'paper') as ThemeId;
  const appearance = data.settings.appearance ?? 'theme';
  const reduced = useEffectiveReducedMotion();
  useEffect(() => { applyTheme(theme, appearance, reduced); }, [theme, appearance, reduced]);

  // Yoru shooting star: one per 30 minutes of active, visible Yoru time. The clock
  // lives for the whole app so switching themes keeps accumulated active time.
  const clock = useRef(createActiveClock(SHOOTING_STAR_INTERVAL));
  const yoruActive = useRef(false);
  yoruActive.current = theme === 'yoru' && !reduced;
  const checkRef = useRef<() => void>(() => {});
  const [star, setStar] = useState(0);
  checkRef.current = () => {
    const active = document.visibilityState === 'visible' && yoruActive.current;
    if (clock.current.tick(performance.now(), active)) setStar((k) => k + 1);
  };
  useEffect(() => {
    const check = () => checkRef.current();
    check();
    const iv = window.setInterval(check, 5000);
    document.addEventListener('visibilitychange', check);
    return () => { window.clearInterval(iv); document.removeEventListener('visibilitychange', check); };
  }, []);
  useEffect(() => { checkRef.current(); }, [theme, reduced]);
  const [showStar, setShowStar] = useState(false);
  useEffect(() => {
    if (!star) return;
    setShowStar(true);
    const t = window.setTimeout(() => setShowStar(false), 2600);
    return () => window.clearTimeout(t);
  }, [star]);

  return <ThemeMotif theme={theme} star={showStar && theme === 'yoru' && !reduced ? star : 0} />;
}

export function ThemeMotif({ theme, star = 0 }: { theme: ThemeId; star?: number }) {
  if (theme === 'paper') return null;
  return (
    <div aria-hidden="true" className="motif" data-testid={`motif-${theme}`}>
      <ClassicMotif theme={theme} />
      <JapanMotif theme={theme} />
      <MoreMotif theme={theme} />
      {star > 0 && <span key={star} className="shooting-star" data-testid="motif-shooting-star" />}
    </div>
  );
}
