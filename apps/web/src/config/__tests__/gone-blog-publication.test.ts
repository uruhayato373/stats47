import { spawnSync } from 'node:child_process';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../../../../..');
const gate = path.join(root, '.claude/scripts/blog/quality-gate.mjs');

describe('恒久終了ブログの公開前ゲート', () => {
  it.each([
    'airport-count-vs-wind-power-plant-count-facility',
    'dam-count-prefecture-gap',
    'dam-count-vs-road-expressway-length',
  ])('%s はslug指定でも旧原稿path指定でも再公開を拒否する', (slug) => {
    for (const arg of [slug, path.join(root, 'docs/21_ブログ記事原稿', slug, 'article.md')]) {
      const result = spawnSync(process.execPath, [gate, arg], { cwd: root, encoding: 'utf8' });
      expect(result.status, result.stderr).toBe(1);
      const report = JSON.parse(result.stdout);
      expect(report.pass).toBe(false);
      expect(report.checks.publicationAllowed).toBe(false);
      expect(report.blockers.join(' ')).toContain('再公開不可');
    }
  });
});
