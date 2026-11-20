/**
 * `.claude/scripts` が packages の契約 (県の特徴の 1 系統・都道府県の短縮名・地図の投影の土台) を守っているかの検査。
 * packages 側のテストは `.claude` を読まない決まりなので、`.claude/scripts` を走査する部分だけをここに置く
 * (SCRIPTS-TO-PACKAGES-01)。packages 側の同名の契約は packages のテストが `apps` と `packages` について検査する。
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('../../../../', import.meta.url));

// --- 県の「特徴」の 1 系統契約 (packages/area-profile の area-highlights-contract と同じ検査) ---
const CONSUMER_FILES = [
  'packages/ops/src/sns/lib/ig-area-props.ts',
  '.claude/scripts/sns/build-ig-area-props.ts',
];

/** コメントの説明文に反応しないよう、コメントを除いて検査する。 */
const stripComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const consumers = CONSUMER_FILES.map((path) => ({ path, text: stripComments(readFileSync(join(REPO, path), 'utf8')) }));
const offenders = (pattern) => consumers.filter((f) => pattern.test(f.text)).map((f) => f.path);

describe('県の「特徴」の 1 系統契約 (SNS の素材)', () => {
  it('対象ファイルを読めている (パス変更で検査が空振りしない)', () => {
    assert.equal(consumers.length, CONSUMER_FILES.length);
    assert.ok(consumers.every((f) => f.text.length > 0));
  });

  it('strengths / weaknesses を選定関数以外で切り出さない', () => {
    assert.deepEqual(offenders(/\b(strengths|weaknesses)\s*(\??\.\s*(slice|filter|sort|find|at)\b|\[\d)/), []);
    assert.deepEqual(offenders(/\.weaknesses\b/), []);
  });

  it('databook.json の highlight メタを選定関数以外で直接読まない', () => {
    assert.deepEqual(offenders(/\.highlight\??\./), []);
  });

  it('順位のしきい値を直書きしない', () => {
    assert.deepEqual(offenders(/\brank\w*\s*[<>]=?\s*\d+/i), []);
  });

  it('Web は県の profile.json を読まない', () => {
    assert.deepEqual(offenders(/readAreaProfileFromR2|getAreaProfileAction|areaProfileKeyPath|profile\.json`/), []);
  });

  it('順位・決定力を values.json から再計算しない (databook.json の焼き込み値だけを使う)', () => {
    assert.deepEqual(offenders(/values\.json|computeMargin|classifyRank|detectRankDirection/), []);
  });

  it('市区町村の型と R2 パスを Web で独自定義しない', () => {
    assert.deepEqual(offenders(/interface CityProfileData|cities\/\$\{[^}]+\}\/profile\.json/), []);
  });
});

// --- 都道府県の短縮名は単一実装 (packages/area の prefecture-short-name-single-impl と同じ検査) ---
const SKIP_DIRS = new Set(['node_modules', 'dist', '.next', '.open-next', '__tests__', 'public', 'out', '.turbo']);
const LOCAL_SHORT_NAME_RE = /replace\(\s*\/(?:\[都道?府県\]|\(都\|(?:道\|)?府\|県\))\$\//;
// 素の node で動く .mjs は TS を import できず、移行が済んでいない既存箇所 (縮小専用。移行したら行を消す)。
const KNOWN_LOCAL_IMPLEMENTATIONS = [
  '.claude/scripts/blog/generate-article-charts.ts',
  '.claude/scripts/blog/regenerate-tile-maps.ts',
];

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|mts)$/.test(name) && !/\.test\.|\.spec\./.test(name)) out.push(full);
  }
}

describe('都道府県の短縮名は単一実装 (.claude/scripts)', () => {
  it('prefectureShortName 以外に .replace(/[都府県]$/) 形の局所実装が増えていない (縮小専用)', { timeout: 60_000 }, () => {
    const files = [];
    walk(join(REPO, '.claude/scripts'), files);
    const found = files
      .filter((f) => LOCAL_SHORT_NAME_RE.test(readFileSync(f, 'utf8')))
      .map((f) => relative(REPO, f).split('\\').join('/'))
      .sort();
    assert.deepEqual(found, [...KNOWN_LOCAL_IMPLEMENTATIONS].sort());
  });
});

// --- 静止画と動画の地図は投影を土台からだけ作る (packages/gis の geometry.test と同じ検査) ---
const SKIPPED_DIRECTORIES = new Set(['node_modules', '.local', '__tests__', 'dist']);

function sourceFiles(directory) {
  return readdirSync(join(REPO, directory), { withFileTypes: true }).flatMap((entry) => {
    const rel = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return SKIPPED_DIRECTORIES.has(entry.name) ? [] : sourceFiles(rel);
    return /\.(ts|tsx|mjs|cjs|js)$/.test(entry.name) ? [rel] : [];
  });
}

describe('地図の土台 (.claude/scripts)', () => {
  it('静止画と動画の地図は投影を土台からだけ作る', () => {
    const own = sourceFiles('.claude/scripts').filter((file) => readFileSync(join(REPO, file), 'utf8').includes('geoMercator'));
    assert.deepEqual(own, []);
  });

  it('対象の検索が実際に地図の処理を見ている', () => {
    const files = new Set(sourceFiles('.claude/scripts'));
    assert.ok(files.has('.claude/scripts/note/lib/cover-visuals.ts'));
  });
});
