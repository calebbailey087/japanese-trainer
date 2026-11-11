import { useEffect, useRef, useState } from 'react';
import { Download, Gauge, HardDrive, Palette, Smartphone, Trash2, Upload } from 'lucide-react';
import { ThemePicker } from '@/components/theme-picker';
import { AppearanceControls } from '@/components/appearance-controls';
import { DATA_VERSION, localDay, markBackupExported, replaceData, resetData, updateSettings, useStore, validateData, type AppData } from '@/storage/store';

export default function Settings() {
  const { data, loadError } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [pending, setPending] = useState<AppData | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [eventName, setEventName] = useState(data.settings.countdown?.name ?? '');
  const [eventDate, setEventDate] = useState(data.settings.countdown?.date ?? '');
  useEffect(() => {
    setEventName(data.settings.countdown?.name ?? '');
    setEventDate(data.settings.countdown?.date ?? '');
  }, [data.settings.countdown?.name, data.settings.countdown?.date]);

  const exportBackup = () => {
    try {
      const exportedAt = new Date().toISOString();
      const blob = new Blob([JSON.stringify({ ...data, backup: { ...data.backup, lastExportAt: exportedAt } }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kana-backup-${localDay()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      markBackupExported(exportedAt);
      setMessage('Backup download started. Keep the JSON file somewhere safe.');
    } catch (e) {
      setImportError(`Export failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    }
  };

  const onFile = async (f: File | undefined) => {
    setImportError(null); setMessage(null); setPending(null);
    if (!f) return;
    try {
      const text = await f.text();
      let parsed: unknown;
      try { parsed = JSON.parse(text); } catch { throw new Error('File is not valid JSON.'); }
      setPending(validateData(parsed));
    } catch (e) {
      setImportError(`Import rejected: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const summary = (d: AppData) => {
    const n = Object.values(d.kana).reduce((a, s) => a + s.seen, 0) + Object.values(d.words).reduce((a, s) => a + s.seen, 0);
    const st = Object.keys(d.study?.cards ?? {}).length;
    return `${n} kana drill answers, ${st} review cards, ${d.study?.custom.length ?? 0} custom words, ${d.practiceDays.length} practice days, ${d.settings.rows.length} rows selected`;
  };

  return (
    <div className="space-y-8 max-w-2xl rise">
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Settings</h1>

      <section className="rounded-2xl border bg-card p-5 sm:p-6 space-y-3">
        <h2 className="font-bold">Session length</h2>
        <p className="text-sm text-muted-foreground">New installations start at 3 minutes. Your chosen length is remembered.</p>
        <div className="flex gap-2">{([3, 5, 10] as const).map((minutes) => <button key={minutes} onClick={() => updateSettings({ minutes })} aria-pressed={data.settings.minutes === minutes} className={`rounded-xl border px-4 py-2 font-bold ${data.settings.minutes === minutes ? 'bg-ink text-background' : ''}`}>{minutes} min</button>)}</div>
      </section>

      <section className="rounded-2xl border bg-card p-5 sm:p-6 space-y-3">
        <h2 className="font-bold">Countdown to</h2>
        <p className="text-sm text-muted-foreground">Show your own event on the home page, or leave it off.</p>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); updateSettings({ countdown: { name: eventName.trim(), date: eventDate } }); }}>
          <label className="block text-sm font-semibold">Event name<input required maxLength={80} value={eventName} onChange={(e) => setEventName(e.target.value)} className="mt-1 block w-full rounded-xl border bg-background px-3 py-2" /></label>
          <label className="block text-sm font-semibold">Event date<input required type="date" min="0001-01-01" max="9999-12-31" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="mt-1 block w-full min-w-0 rounded-xl border bg-background px-3 py-2" /></label>
          <div className="flex flex-wrap gap-2"><button disabled={!eventName.trim() || !eventDate} className="rounded-xl bg-primary text-primary-foreground px-4 py-2 font-bold disabled:opacity-50">Save countdown</button><button type="button" onClick={() => { updateSettings({ countdown: null }); setEventName(''); setEventDate(''); }} className="rounded-xl border px-4 py-2 font-bold">Turn countdown off</button></div>
          <p role="status" className="text-sm text-muted-foreground">{data.settings.countdown ? `Saved: ${data.settings.countdown.name} · ${data.settings.countdown.date}` : 'Countdown is off.'}</p>
        </form>
      </section>

      <section className="rounded-2xl border bg-card p-5 sm:p-6" data-testid="section-theme">
        <div className="flex items-center gap-2 font-bold"><Palette className="w-4 h-4 text-primary" /> Theme</div>
        <p className="text-sm text-muted-foreground mt-1 mb-4">Applies instantly on every screen. Theme, light/dark and reduce motion are saved with your settings and backups. Palettes are loosely inspired by Japanese scenes, not claims of authenticity.</p>
        <AppearanceControls />
        <ThemePicker />
      </section>

      <section className="rounded-2xl border bg-card p-5 sm:p-6" data-testid="section-new-per-day">
        <div className="flex items-center gap-2 font-bold"><Gauge className="w-4 h-4 text-primary" /> New items per day</div>
        <p className="text-sm text-muted-foreground mt-1 mb-3">How many never-seen items spaced review may introduce each day. Lowering it takes effect immediately; items already introduced today stay.</p>
        <div className="flex flex-wrap gap-2">
          {[0, 3, 5, 8, 10, 15, 20].map((n) => (
            <button key={n} onClick={() => updateSettings({ newPerDay: n })} aria-pressed={data.settings.newPerDay === n} data-testid={`button-newcap-${n}`}
              className={`w-12 py-2 rounded-xl border font-bold tabular-nums ${data.settings.newPerDay === n ? 'bg-ink text-background border-ink' : 'bg-background'}`}>{n}</button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <div className="flex items-center gap-2 font-bold"><HardDrive className="w-4 h-4 text-primary" /> Stored only on this device</div>
        <p className="text-sm text-muted-foreground mt-2">
          Kana keeps your rows, settings and answer history in this browser's local storage. There are no accounts and no automatic sync: another phone, another browser, or clearing site data will not have your progress. Export a backup to move or protect it.
        </p>
        <p className="text-sm mt-2" data-testid="text-data-summary">Currently: {summary(data)}.</p>
      </section>

      <section className="rounded-2xl border bg-card p-5 sm:p-6 space-y-4">
        <h2 className="font-bold">Backup</h2>
        <p className="text-sm text-muted-foreground">{data.backup.lastExportAt ? `Last export requested: ${new Date(data.backup.lastExportAt).toLocaleDateString()}.` : 'No backup exported yet.'} The Progress page reminds you after 14 days. Your browser controls whether the download is saved.</p>
        <div className="flex flex-wrap gap-3">
          <button onClick={exportBackup} data-testid="button-export" className="inline-flex items-center gap-2 rounded-xl bg-ink text-background px-5 py-3 font-bold"><Download className="w-4 h-4" /> Export JSON</button>
          <button onClick={() => fileRef.current?.click()} data-testid="button-import" className="inline-flex items-center gap-2 rounded-xl border bg-background px-5 py-3 font-bold"><Upload className="w-4 h-4" /> Import backup</button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} data-testid="input-import-file" />
        </div>
        <p className="text-xs text-muted-foreground">Backup format version {DATA_VERSION}, including reviews, mastery, custom words and activity. Legacy version 1 backups still import without losing kana history, rows or themes; their SRS schedules start due now, without inventing past mastery. Unsupported versions, unknown basic kana, or invalid counts are rejected.</p>
        {importError && <p role="alert" className="text-sm rounded-xl bg-destructive/12 text-destructive px-4 py-3" data-testid="text-import-error">{importError}</p>}
        {message && <p className="text-sm rounded-xl bg-matcha/15 px-4 py-3" data-testid="text-import-success">{message}</p>}
        {pending && (
          <div className="rounded-xl border-2 border-primary p-4 space-y-3" data-testid="panel-import-confirm">
            <p className="font-semibold">Replace all progress on this device?</p>
            <p className="text-sm">Backup contains: {summary(pending)}.</p>
            <p className="text-sm text-muted-foreground">This replaces: {summary(data)}. It cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => { replaceData(pending); setPending(null); setMessage('Backup imported. Your progress has been replaced.'); }} data-testid="button-confirm-import" className="rounded-xl bg-primary text-primary-foreground px-4 py-2 font-bold">Replace progress</button>
              <button onClick={() => setPending(null)} data-testid="button-cancel-import" className="rounded-xl border px-4 py-2 font-bold">Cancel</button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <div className="flex items-center gap-2 font-bold"><Smartphone className="w-4 h-4 text-primary" /> Install and offline use</div>
        <ul className="text-sm text-muted-foreground mt-3 space-y-2 list-disc pl-5">
          <li>Once the published website has loaded online at least once, Kana keeps working offline.</li>
          <li>iPhone or iPad: open in Safari, tap Share, then Add to Home Screen.</li>
          <li>Chrome, Edge or Android: use the Install option in the browser menu or address bar.</li>
          <li>An installed app still stores progress only on that device. Export a backup before switching phones.</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-destructive/40 bg-card p-5 sm:p-6">
        <h2 className="font-bold">Reset</h2>
        <p className="text-sm text-muted-foreground mt-1">{loadError ? 'Saved data is unreadable. Resetting will overwrite it with a fresh start.' : 'Erase all rows, answers and streak history on this device.'}</p>
        {confirmReset ? (
          <div className="flex gap-2 mt-3">
            <button onClick={() => { resetData(); setConfirmReset(false); setMessage('Progress reset.'); }} data-testid="button-confirm-reset" className="rounded-xl bg-destructive text-destructive-foreground px-4 py-2 font-bold">Yes, erase everything</button>
            <button onClick={() => setConfirmReset(false)} data-testid="button-cancel-reset" className="rounded-xl border px-4 py-2 font-bold">Keep it</button>
          </div>
        ) : (
          <button onClick={() => setConfirmReset(true)} data-testid="button-reset" className="mt-3 inline-flex items-center gap-2 rounded-xl border border-destructive/50 text-destructive px-4 py-2 font-bold"><Trash2 className="w-4 h-4" /> Reset progress</button>
        )}
      </section>
    </div>
  );
}
