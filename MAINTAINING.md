# Maintaining Kana

This is an installable website (a PWA), not a separate iPhone/Android codebase.
The app runs in the browser. There is no account or server-side progress database.
You can make small changes with a text editor and the commands below.

## 1. Before making a change

1. In the app, open **Settings → Backup → Export JSON**. Keep that file safe.
2. Keep a copy of the project before editing. Git history protects code; it does
   **not** protect the progress stored in your browser.
3. Make one small change, save the file, and check the affected screen.
4. Never put a personal progress backup into a public repository.

## 2. Run it on your computer

Install **Node.js 24 LTS**, **pnpm 10**, and **Python 3**. Python is only needed
to refresh the dictionaries. The importer uses Python's standard library, so
there is no Python package or virtual environment to install.

Open a terminal in the project's top-level folder (the folder containing
`pnpm-workspace.yaml`, not just the app folder), then run:

```sh
pnpm install
```

Start the app on macOS/Linux:

```sh
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/kana-practice run dev
```

On Windows PowerShell:

```powershell
$env:PORT="5173"
$env:BASE_PATH="/"
pnpm --filter @workspace/kana-practice run dev
```

Open `http://localhost:5173`. Keep the terminal open. Press **Ctrl+C** to stop.
Saved edits appear automatically. No API server, database, secrets, or paid
service is needed for Kana. In Replit, use the existing
**artifacts/kana-practice: web** workflow instead.

### Check for mistakes

```sh
pnpm --filter @workspace/kana-practice run typecheck
```

No error messages means the TypeScript check passed. This does not replace
trying the changed feature.

Build and preview the production version on macOS/Linux:

```sh
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/kana-practice run build
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/kana-practice run serve
```

On Windows, set the two environment variables as above, then run the same
`pnpm ... run build` and `pnpm ... run serve` commands without their prefixes.
The output goes into `artifacts/kana-practice/dist/public`.

**Offline caching is enabled in production builds only.** Do not use the
development server to judge whether offline mode works. To return to editing,
stop the preview server, clear its service worker/cache in the browser's
developer tools (Application → Service Workers/Storage), then run `dev`.
Export progress first; clearing all site data also erases local progress.

## 3. Refresh dictionary and sentence data

From the top-level folder:

```sh
python3 scripts/import-japanese.py --refresh
```

On Windows, `py -3 scripts/import-japanese.py --refresh` may be the equivalent.

This downloads KANJIDIC2, JMdict, Tatoeba sentence pairs and Tatoeba Japanese
reading transcriptions. Downloads can be large and take several minutes.
If a source fails, read the error and retry later; do not invent substitute
readings or meanings.

- Downloads are cached under `generated-artifacts/japanese-sources/`. This
  folder is ignored by Git and Replit publishing.
- Without `--refresh`, the script reuses existing downloads.
- The script reads the sanitized 75-character starter list in
  `scripts/data/starter-kanji.txt`. No original chat attachment is required.
- Output is `artifacts/kana-practice/src/data/generated/content.json` and
  `manifest.json`. These are the files the app uses; do not edit them by hand.
- Verify the importer reports 2,136 kanji, 5,000 vocabulary entries and
  1,000 sentences. Open **Learn → Library** and check a few examples.
- Sentence readings must come from source transcriptions, not readings
  stitched together from separate dictionary words.
- Run the type check and production build afterward, then deploy the update.
  Refresh at least monthly before redistributing a fresh dictionary.
- Examples require spelling-level priority and exclude rare, irregular, ateji
  and search-only spelling/reading tags. Written examples are deduplicated.
  The order after the starter set is grade 1–6, then 8, frequency within grade.
  Characters without a safe common example stay reference-only in the Library.
- Run `python3 scripts/test-importer.py` to check these rules.

The app exposes source dates, licenses, contributors and attribution under
**About & sources**. Keep these intact. License notes also live in
`artifacts/kana-practice/public/data-sources.txt`.

## 4. Deploy an update

### Replit

1. Check the changed screens in Preview, then run the type check and build.
2. Open Replit's **Publishing** tool. Publish the app (or republish/update
   an existing deployment) to apply the new code. Saving code alone does not
   update a published website.
3. The existing artifact configuration uses a static build with output
   `artifacts/kana-practice/dist/public`. Its build command is
   `pnpm --filter @workspace/kana-practice run build`.
4. Open the published website online and allow it to finish loading/caching.
   Close all its tabs and home-screen windows, then reopen to pick up a
   waiting update. Do not interrupt an active study session.
5. Check a practice question and the Library. Test offline by disconnecting
   only after the first complete online load.

The configuration lives in
`artifacts/kana-practice/.replit-artifact/artifact.toml`. It is managed by
Replit; ordinary content changes do not require editing it.

Official references:
- https://docs.replit.com/features/publishing/overview
- https://docs.replit.com/features/deployment-customization/static-deployments-advanced

### Another static website host, later

Upload the contents of `dist/public` after a production build, use HTTPS,
and configure every app route (for example `/learn`) to return `index.html`.
For a subfolder deployment, build with `BASE_PATH=/your-folder/`, including
the trailing slash. Never upload only the source files and expect them to run.

GitHub Pages and Netlify instructions are in README.md. In the clean public
export, `pnpm dev`, `pnpm test`, `pnpm build` and `pnpm preview` are shortcuts.
The Pages workflow uses hash routing so refreshed URLs do not need rewrites.
Use `scripts/prepare-public-repo.mjs` to export safe source with fresh Git
history; do not push the workspace's existing history. No upload is performed
by this script.
A new domain or localhost has separate browser storage: export from the old
site and import on the new one if you want to move progress.

## 5. Find the feature you want to change

Paths below are relative to `artifacts/kana-practice/` unless stated otherwise.

| Feature | Main files |
| --- | --- |
| Page URLs and navigation | `src/App.tsx`, `src/components/shell.tsx` |
| Home, kana row selection, session length, countdown display | `src/pages/setup.tsx` |
| Free kana drill, wrong guesses, reveal and repeat | `src/pages/practice.tsx` |
| Romaji answer variants and weighted kana selection | `src/practice/engine.ts`, `src/data/kana.ts` |
| Row hints, “you typed…” feedback, retry queue placement | `src/practice/feedback.ts` |
| Spaced-review setup | `src/pages/learn.tsx` |
| Review timer, first-attempt scoring and retry queue | `src/pages/review.tsx` |
| Pause/resume and active-time countdown (both session types) | `src/practice/session-clock.ts`, `src/practice/use-session-timer.ts`, `src/components/session-paused.tsx` |
| Review question, guesses, feedback and “I don’t know” | `src/components/study/task-card.tsx` |
| SM-2 intervals and mastery stages | `src/learning/srs.ts` |
| Unlock rules, review queue, answer checking, progress-summary text | `src/learning/service.ts` |
| Content loading and item IDs | `src/learning/catalog.ts`, `src/learning/types.ts` |
| Source-backed kanji, vocabulary and sentences | `src/data/generated/`; regenerate with the root `scripts/import-japanese.py` |
| Base hiragana, katakana and starter words | `src/data/kana.ts` |
| Combination sets and survival phrases | `src/learning/combos.ts`, `src/learning/phrases.ts` |
| Library and kanji details | `src/pages/library.tsx` |
| Custom word editor | `src/pages/custom.tsx` |
| Device text-to-speech | `src/learning/audio.ts` |
| Progress screen, backup reminder | `src/pages/progress.tsx` |
| Copy progress summary | `src/components/study/study-progress.tsx`, `src/learning/service.ts` |
| Settings, optional countdown editor, JSON export/import | `src/pages/settings.tsx` |
| Defaults, local storage, backup validation and migrations | `src/storage/store.ts`, `src/learning/validation.ts` |
| Theme names, palettes and subtle animations | `src/themes/`, `src/components/theme-picker.tsx`, `src/index.css` |
| Install manifest, icons, offline cache rules | `vite.config.ts`, `public/`, `src/pwa.ts` |
| Source/license screen | `src/pages/about.tsx`, `public/data-sources.txt` |
| Regression tests | `tests/` |

### Small-change examples

- **Change the starting session length:** edit `settings.minutes` in
  `emptyData()` in `src/storage/store.ts`. Existing users keep their selected
  length; change it in Settings to update your device.
- **Rename your event:** use Settings → Optional countdown. No code editing
  is needed. Turning it off hides it entirely.
- **Change a starter word:** edit `src/data/kana.ts`, preserving its stable
  ID and row prerequisites. Check the answer and spelling variants.
- **Adjust a theme:** find its ID in `src/themes/`, then edit its palette.
  Do not change answer-checking or progress data to change an appearance.

## 6. Protect progress and check updates

- Storage key `kana-practice:v1` is deliberately stable; the JSON inside has
  its own version. Do not rename the key or remove migration support casually.
- Never count correction guesses or same-session remedial repeats as fresh
  SRS attempts. Only the first submitted answer for that scored question counts.
- A blank answer is not an attempt. “I don’t know” is a miss if no answer has
  been scored yet; otherwise the earlier first result stays unchanged.
- A backup reminder appears after 14 days since the last export request
  (or the first tracked day if none). A browser cannot prove you kept a
  downloaded file, so make sure it actually saved.
- Test at a narrow phone width, including the keyboard, long words, wrong
  guesses, two-miss hint, reveal/retype, retry, and End session.
- Both drill and review sessions offer Pause/Resume. Paused time does not count;
  the current question and typed input stay mounted. This is an in-page pause,
  not a saved session you can restore after refreshing or leaving the page.
- Test production offline after the cache finishes. Device Japanese voices
  may need a network connection; missing voices disable listening practice.
- Home-screen installation is a browser action: Safari → Share → Add to
  Home Screen on iPhone, or Install app in the Android/Chrome browser menu.
  This does not automatically sync or protect progress.

If a change breaks something, restore your saved project copy, run the checks,
and republish the repaired version if necessary. Import your JSON backup only
if the browser's learning data also needs restoring.
