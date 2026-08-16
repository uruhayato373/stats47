'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  findViolations,
  inspect,
  isTestFile,
} = require('../check-import-meta-dirname-guard.cjs');

// ── 検出する (発火の実測) ────────────────────────────────────────────────

test('[mutation] bare な import.meta.dirname を検出する', () => {
  const src = 'config({ path: path.resolve(import.meta.dirname, "..", ".env") });\n';
  const found = findViolations(src);
  assert.equal(found.length, 1);
  assert.equal(found[0].line, 1);
});

test('[mutation] 実際に落ちたコード (purge-worker-cache の修正前) を検出する', () => {
  const src = [
    'import path from "node:path";',
    'config({ path: path.resolve(import.meta.dirname, "..", "..", "..", "..", ".env.local") });',
  ].join('\n');
  const found = findViolations(src);
  assert.equal(found.length, 1);
  assert.equal(found[0].line, 2, '行番号が正しく出る');
});

test('[mutation] 複数行にまたがる違反をすべて拾う', () => {
  const src = [
    'const a = import.meta.dirname;',
    'const b = join(import.meta.dirname, "x");',
  ].join('\n');
  assert.equal(findViolations(src).length, 2);
});

// ── 検出しない (誤検知ゼロの実測) ────────────────────────────────────────

test('?? __dirname のフォールバックがあれば違反にしない', () => {
  const src = 'const ROOT = join(import.meta.dirname ?? __dirname, "../../..");\n';
  assert.equal(findViolations(src).length, 0);
});

test('|| __dirname のフォールバックも認める', () => {
  const src = 'const ROOT = join(import.meta.dirname || __dirname, "..");\n';
  assert.equal(findViolations(src).length, 0);
});

test('import.meta.url は別物なので対象外', () => {
  const src = 'const HERE = path.dirname(fileURLToPath(import.meta.url));\n';
  assert.equal(findViolations(src).length, 0);
});

test('コメント内の言及は違反にしない (このガード自身の説明文が引っかからない)', () => {
  const src = [
    '// import.meta.dirname は CJS 解決だと undefined',
    ' * bare な import.meta.dirname を検出する',
    'const ok = import.meta.dirname ?? __dirname;',
  ].join('\n');
  assert.equal(findViolations(src).length, 0);
});

// ── 対象ファイルの選別 ──────────────────────────────────────────────────

test('テストファイルは対象外 (vitest / node --test は ESM 解決するので bare が正)', () => {
  assert.equal(isTestFile('apps/web/scripts/lib/__tests__/foo.test.ts'), true);
  assert.equal(isTestFile('apps/web/src/features/ads/__tests__/bar.ts'), true);
  assert.equal(isTestFile('packages/x/src/y.spec.ts'), true);
  assert.equal(isTestFile('packages/r2-storage/src/scripts/purge-worker-cache.ts'), false);
});

// ── 実リポジトリ (baseline なし = 違反ゼロを維持する) ────────────────────

test('リポジトリ全体に bare な import.meta.dirname が無い', () => {
  const findings = inspect();
  assert.deepEqual(
    findings,
    [],
    `bare な import.meta.dirname は tsx の CJS 解決で undefined になる:\n${findings
      .map((f) => `  ${f.file}:${f.line} ${f.text}`)
      .join('\n')}`
  );
});
