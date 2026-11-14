// テーマの台帳のうち、カタログが 1 ファイルを 1 行で持つもの (themes.portfolio・themes.experiments・themes.quality など) は、
// 読み手が datasetPath("themes.<id>") で引く。ディレクトリを引いてファイル名を足す書き方だと、カタログの行を
// 動かしても読み手が古い名前を読み続け、置き場の正本がコードに二重に残る (THEMES-DATASET-ID-CALLSITES-01)。
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { DATASETS } from '../../../../config/datasets.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const fixedThemeFiles = DATASETS.filter((ds) => ds.id.startsWith('themes.') && !ds.path.includes('{'));
const fixedIds = new Set(fixedThemeFiles.map((ds) => ds.id));

test('可変部分の無いテーマの台帳を datasetDir で引く読み手が無い', () => {
  let out = '';
  try {
    out = execFileSync(
      'git',
      ['grep', '-n', '-E', 'datasetDir\\(\\s*["\'`]themes\\.', '--', '.claude/scripts', '.claude/hooks', 'apps', 'packages', 'scripts', 'config'],
      { cwd: ROOT, encoding: 'utf8' },
    );
  } catch (error) {
    if (error.status !== 1) throw error; // 1 = 一致なし
  }
  const offenders = out.split('\n').filter((line) =>
    [...line.matchAll(/datasetDir\(\s*["'`](themes\.[^"'`]+)["'`]/g)].some((m) => fixedIds.has(m[1])),
  );
  assert.deepEqual(offenders, []);
});

test('テーマの台帳を読むコードに、カタログが持つファイル名の直書きが無い', () => {
  // data/themes/ の直下に置かれる 1 ファイル 1 行の台帳だけを対象にする (catalogs/・sources/ などは <名前> が可変)
  const names = fixedThemeFiles.filter((ds) => dirname(ds.path) === 'data/themes').map((ds) => basename(ds.path));
  assert.ok(names.includes('portfolio.json') && names.includes('viewpoint-history.csv'), `対象のファイル名が引けていない: ${names}`);
  const literal = new RegExp(`["'\`/](?:${names.map((n) => n.replace(/\./g, '\\.')).join('|')})["'\`#]`);
  const dir = join(ROOT, '.claude/scripts/themes');
  const files = [
    ...readdirSync(dir).filter((f) => /\.(?:mjs|ts)$/.test(f)).map((f) => join(dir, f)),
    join(ROOT, 'apps/admin/lib/server/theme-viewpoints.ts'),
  ];
  const offenders = files.flatMap((file) =>
    readFileSync(file, 'utf8').split('\n').flatMap((line, i) =>
      // 説明のコメントが置き場を名指しするのは構わない。止めるのはコードの文字列だけ
      !/^\s*(?:\/\/|\/?\*)/.test(line) && literal.test(line) ? [`${file.slice(ROOT.length + 1)}:${i + 1}: ${line.trim()}`] : [],
    ),
  );
  assert.deepEqual(offenders, []);
});
