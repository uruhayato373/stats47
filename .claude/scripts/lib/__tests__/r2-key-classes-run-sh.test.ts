/**
 * sync-snapshots の run.sh が diff-push-r2 / push-exact-r2-assets で書く prefix が、R2 の区分表のどれかの行に当たること。
 * packages/r2-storage のテストは `.claude` を読まない決まりなので、run.sh を読む部分だけをここに置く (SCRIPTS-TO-PACKAGES-01)。
 * workflow 側の同じ検査は packages/r2-storage の r2-key-classes.test.ts にある。
 * 実行: node --import tsx --test (区分表が TS のため)。
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { classifyR2Key, R2_PUBLIC_BUCKET } from '../../../../packages/r2-storage/src/scripts/r2-key-classes';

const REPO_ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
const RUN_SH = join(REPO_ROOT, '.claude', 'skills', 'db', 'sync-snapshots', 'run.sh');

function collectWritePrefixes(file: string): { source: string; value: string }[] {
  const found: { source: string; value: string }[] = [];
  const text = readFileSync(file, 'utf8').replace(/\\\n\s*/g, ' ');
  for (const line of text.split('\n')) {
    if (!/(diff-push-r2|push-exact-r2-assets)\.ts/.test(line)) continue;
    for (const m of line.matchAll(/--(prefix|key)[ =]("([^"]*)"|'([^']*)'|([^\s;)]+))/g)) {
      const value = m[3] ?? m[4] ?? m[5] ?? '';
      // キーをファイルから読むもの ($(cat ...)・配列) は静的に拾えない。報告の棚卸しで扱う
      if (value.startsWith('$(') || value === '$KEY' || value === '') continue;
      found.push({ source: file.slice(REPO_ROOT.length), value });
    }
  }
  return found;
}

function sampleKeyFor(value: string): string {
  const concrete = value.replace(/\$\{\{[^}]*\}\}/g, 'sample').replace(/\$\{?[A-Za-z_][A-Za-z0-9_]*\}?/g, 'sample');
  if (concrete.endsWith('/')) return `${concrete}sample.json`;
  const last = concrete.split('/').pop() ?? '';
  return /\.[a-z]+$/.test(last) ? concrete : `${concrete}/sample.json`;
}

describe('sync-snapshots の run.sh が書く prefix は区分表のどれかの行に当たる', () => {
  const prefixes = collectWritePrefixes(RUN_SH);

  it('拾えた prefix がある (正規表現の劣化を検出する)', () => {
    assert.ok(prefixes.length >= 2);
  });

  for (const { source, value } of prefixes) {
    it(`${source}: ${value}`, () => {
      const key = sampleKeyFor(value);
      assert.equal(classifyR2Key(R2_PUBLIC_BUCKET, key).registered, true, key);
    });
  }
});
