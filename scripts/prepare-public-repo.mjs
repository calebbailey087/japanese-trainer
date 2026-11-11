// Export only reviewed public inputs, never the workspace's Git history.
import { cp, mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(root, process.argv[2] ?? 'generated-artifacts/public-repo');
if (!output.startsWith(path.join(root, 'generated-artifacts') + path.sep)) throw new Error('Choose a new folder inside generated-artifacts/.');
try { await stat(output); throw new Error(`Destination exists; choose a new output folder. Nothing overwritten: ${output}`); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
await mkdir(output, { recursive: true });
const files = [
  'README.md', 'LICENSE', 'MAINTAINING.md', '.env.example', '.gitignore', '.npmrc',
  'tsconfig.base.json', '.github/workflows/pages.yml',
  'scripts/import-japanese.py', 'scripts/test-importer.py', 'scripts/data/starter-kanji.txt', 'scripts/prepare-public-repo.mjs',
];
for (const file of files) {
  await mkdir(path.dirname(path.join(output, file)), { recursive: true });
  await cp(path.join(root, file), path.join(output, file));
}
const app = 'artifacts/kana-practice';
await mkdir(path.join(output, app), { recursive: true });
for (const file of ['src', 'public', 'tests', 'package.json', 'tsconfig.json', 'vite.config.ts', 'index.html', 'components.json']) {
  await cp(path.join(root, app, file), path.join(output, app, file), { recursive: true });
}
const originalWorkspace = await readFile(path.join(root, 'pnpm-workspace.yaml'), 'utf8');
const catalog = originalWorkspace.match(/^catalog:\n(?:[ \t].*\n|\n)+/m)?.[0];
if (!catalog) throw new Error('Cannot find dependency catalog.');
// Do not copy Replit-only OS exclusions: public installs must work on macOS/Windows too.
const workspace = `minimumReleaseAge: 1440
minimumReleaseAgeExclude:
  - '@replit/*'
packages:
  - artifacts/kana-practice
${catalog}
onlyBuiltDependencies:
  - '@tailwindcss/oxide'
  - esbuild
  - unrs-resolver
overrides:
  'undici@7': ^7.30.1
  'fast-uri@3': ^3.1.9
  js-yaml: ^4.3.2
`;
await writeFile(path.join(output, 'pnpm-workspace.yaml'), workspace);
await writeFile(path.join(output, 'package.json'), JSON.stringify({
  name: 'kana-japanese-practice', version: '1.0.0', private: true, license: 'MIT',
  packageManager: 'pnpm@10.26.1', engines: { node: '>=24' },
  scripts: {
    dev: 'pnpm --filter @workspace/kana-practice run dev',
    build: 'pnpm --filter @workspace/kana-practice run build',
    preview: 'pnpm --filter @workspace/kana-practice run serve',
    typecheck: 'pnpm --filter @workspace/kana-practice run typecheck',
    test: 'pnpm --filter @workspace/kana-practice run test',
    'data:refresh': 'python3 scripts/import-japanese.py --refresh',
  },
}, null, 2) + '\n');
// A fresh frontend-only lockfile excludes unrelated server dependencies.
const lock = spawnSync('pnpm', ['install', '--lockfile-only', '--ignore-scripts'], { cwd: output, stdio: 'inherit' });
if (lock.status !== 0) throw new Error('Public lockfile generation failed; do not publish this incomplete folder.');
console.log(`Clean public source prepared at ${output}\nNo .git, local data, private uploads, server/database scaffold, or agent files were copied.\nInitialize a NEW Git repository here; do not push the workspace history.`);
