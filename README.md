# Kana — Japanese Practice

A free, installable Japanese study website for short daily sessions. Works on
phones and computers, without accounts, API keys, paid services or a backend.
Application code is MIT licensed; dictionary/sentence data have separate licenses.

## Features

- Hiragana and katakana, selectable rows, look-alikes, starter words and combinations.
- 2,136 jōyō kanji, 5,000 dictionary words, 1,000 attributed sentence pairs and survival phrases.
- SM-2 spaced repetition, both answer directions, daily new-item limits and mastery stages.
- Keep guessing after misses, hints after two misses, reveal/retype, and same-session retry.
- Three-, five- or ten-minute sessions with Pause/Resume.
- Custom words, device Japanese speech where available, and progress summaries.
- Nineteen Japanese-scene and cozy themes, light/dark modes and reduced motion.
- Full JSON progress backups and a reminder after 14 days without an export.
- Optional **Countdown to** event name/date, off by default. Values stay in browser
  local storage, except when you deliberately include them in a downloaded backup.
- Offline production PWA after its first complete online load/cache.

## Screenshots

_Placeholder: add your own screenshots of Practice, the Kanji Library and mobile
Settings before sharing. Do not include private countdowns or progress backups._

## Run locally

Use **Node.js 24 LTS** and **pnpm 10.26.1**. Python 3 is needed only for dictionary
refreshes. In the clean public repository:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:5173`. Then:

```sh
pnpm typecheck
pnpm test
pnpm build
pnpm preview
```

The production output is `artifacts/kana-practice/dist/public`. No secrets are
required. `.env.example` contains optional, non-secret build settings; copy it to
`.env` only if needed. Never put credentials in `VITE_*` variables: they are public.

In the original Replit workspace, use the existing app workflow, or commands
such as `pnpm --filter @workspace/kana-practice run test`. The clean export
provides the short root-level commands above. See [MAINTAINING.md](MAINTAINING.md)
for beginner instructions and a feature-to-file guide.

## Deploy for free: GitHub Pages

The included `.github/workflows/pages.yml` builds and publishes on pushes to
`main`, or manually through **Actions → Deploy Kana to GitHub Pages**.

1. Create an empty **public** GitHub repository.
2. Push the clean source using the checklist below.
3. In the repository, open **Settings → Pages → Build and deployment → Source**,
   then select **GitHub Actions**.
4. Open **Actions**, select the Pages workflow and run it if the initial push
   happened before Pages was enabled.
5. Open the website URL shown by the deployment job.

The workflow uses the repository path reported by GitHub, including `/repo-name/`
for project sites, and hash routes (`#/learn`, `#/library`). This avoids GitHub
Pages' lack of single-page-app route rewrites; bookmarked routes still work.
The same workflow also handles user/organization root Pages sites. GitHub's
standard Actions permissions are used; no personal access token is needed.
See [GitHub's custom Pages workflow guide](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

### Free Netlify alternative

Import the public repository, use build command `pnpm build`, and publish
directory `artifacts/kana-practice/dist/public`. Set `BASE_PATH=/` and
`VITE_ROUTER_MODE=hash` in build settings. Hash routes need no server rewrite.
Availability and usage limits are determined by the hosting provider's free plan.

## Mobile installation and offline use

Open the HTTPS published website online and wait for its first complete load.
All app and dictionary chunks are precached by the production service worker.

- **iPhone/iPad:** Safari → Share → Add to Home Screen.
- **Android/Chrome:** browser menu → Install app / Add to Home screen.
- The manifest uses standalone display and includes 192px/512px icons.
- Development mode deliberately does not cache the app. Check offline behavior
  with a production build, not `pnpm dev`.
- Device Japanese voices may require a connection. Core text study and progress
  storage work offline; optional web fonts can fall back to system fonts.
- Installation is a browser/device action, not an App Store release.
- Each browser/domain has separate progress. Export/import JSON when moving.
  Clearing site data erases progress; GitHub does not back it up.

## How the data was built

`scripts/import-japanese.py` downloads EDRDG KANJIDIC2/JMdict and
ManyThings/Tatoeba sentence pairs plus original Tatoeba reading transcriptions.
It uses Python's standard library only. To regenerate:

```sh
python3 scripts/import-japanese.py --refresh
python3 scripts/test-importer.py
```

Without `--refresh`, cached downloads under `generated-artifacts/` are reused.
The sanitized starter list is `scripts/data/starter-kanji.txt`; no chat upload
is needed. The first 75 kanji retain their starter sequence; the rest follow
school grades 1–6, then 8 (secondary school), frequency-ranked within each grade.

Example words require priority on the **actual written form**, not a sibling
spelling or reading. Forms tagged `rK`, `iK`, `ateji`, `sK` and readings tagged
`ik`, `rk`, `sk` are rejected. Reading and sense restrictions are respected;
usually-kana-only senses are not selected as written examples. Written examples
are deduplicated and always include a source reading. Kanji without a qualifying
example stay reference-only in the Library and do not block later study groups.
Sentence readings come from source transcriptions, never guessed by joining
dictionary readings.

Generated `content.json` is about 3.7 MB, far below GitHub's 100 MB per-file limit.
**Commit both generated JSON files.** Normal builds use these files without
downloading dictionaries. Their manifest records source URLs, SHA-256 hashes,
import date and policies. Refresh data manually, review the changes, then commit
the outputs. Raw dictionaries, caches and build output must not be committed.

## DATA LICENSES

**MIT covers original app code, not the generated dictionary/sentence data.**

| Data | Attribution and license |
| --- | --- |
| KANJIDIC2 and JMdict | Electronic Dictionary Research and Development Group (EDRDG), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), [EDRDG license](https://www.edrdg.org/edrdg/licence.html) |
| Sentence pairs and Japanese transcriptions | Tatoeba Project and individual contributors, [CC BY 2.0 FR](https://creativecommons.org/licenses/by/2.0/fr/), [terms](https://tatoeba.org/en/terms_of_use); pairs via [ManyThings.org](https://www.manythings.org/anki/) |
| KanjiVG | **Not used or bundled.** If added later: KanjiVG contributors, [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |

The generated JSON is a collection of separately licensed components, not an
MIT dataset. Adapted EDRDG dictionary portions remain **CC BY-SA 4.0** and must
retain attribution and share-alike licensing. Sentence portions retain CC BY
2.0 FR, sentence IDs and contributor attribution. Combining them in one JSON
file does not remove either obligation.

Adaptations include filtering, compact fields, kana normalization, starter/grade
groups, common-form example selection, deduplication, topic/prerequisite indexes,
and conversion of source furigana markup. No endorsement by the source projects
is implied. Further attribution and source links appear in **About & sources**
and `artifacts/kana-practice/public/data-sources.txt`. Dependencies retain their
own licenses, including WanaKana (MIT).

## Public-repository checklist

### Security check scope

The prepared public source was checked for credential patterns and private
workspace paths; none were found. Static-code and privacy scanners reported no
findings. The frontend-only dependency audit has no high/critical findings;
three moderate and one low advisory remain in build-time tooling (CSS parsing,
Workbox's glob/minimatch and deepmerge). These are not an app backend or leaked
credentials. Review `pnpm audit` and upstream fixes during maintenance; this
check is not a guarantee that any software has no vulnerabilities.

**Do not push the original workspace's Git history.** It may contain older
themes, private uploads or author metadata, even after files are ignored.
From the original workspace:

```sh
node scripts/prepare-public-repo.mjs
cd generated-artifacts/public-repo
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
git init -b main
git config user.name "YOUR_PUBLIC_USERNAME"
git config user.email "YOUR_GITHUB_NOREPLY_EMAIL"
git add .
git status
git commit -m "Initial public release"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Use your public GitHub username and GitHub-provided **noreply** email in Git's
author settings if you do not want a real name/email on the commit. Authenticate
through GitHub CLI, SSH or your credential manager; never put tokens in commands,
URLs or files. Do not use a force push.

The export copies only reviewed app/source files and creates a frontend-only
lockfile. It excludes `.git`, agent notes, chat uploads, secrets, backups, build
output and unused API/database scaffolding. Existing exports are never
overwritten; pass a new path under `generated-artifacts/` for a later export.
After pushing, enable Pages as described above. No repository is created or
pushed by the preparation script.
