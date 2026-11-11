import { build } from 'esbuild';
import { readdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const output = await mkdtemp(path.join(tmpdir(), 'kana-tests-'));
try {
  const tests = (await readdir(here)).filter((f) => f.endsWith('.test.ts'));
  await build({
    entryPoints: tests.map((f) => path.join(here, f)),
    outdir: output, bundle: true, platform: 'node', format: 'esm',
    outExtension: { '.js': '.mjs' }, tsconfig: path.join(here, '../tsconfig.json'),
  });
  const result = spawnSync(process.execPath, ['--test', ...tests.map((f) => path.join(output, f.replace(/\.ts$/, '.mjs')))], { stdio: 'inherit' });
  process.exitCode = result.status ?? 1;
} finally { await rm(output, { recursive: true, force: true }); }
