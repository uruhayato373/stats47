import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const gate = path.join(root, '.claude/scripts/blog/quality-gate.mjs');

describe('恒久終了ブログの公開前ゲート', () => {
  for (const slug of [
    'airport-count-vs-wind-power-plant-count-facility',
    'dam-count-prefecture-gap',
    'dam-count-vs-road-expressway-length',
  ]) {
    it(`${slug} はslug指定でも旧原稿path指定でも再公開を拒否する`, () => {
      for (const arg of [slug, path.join(root, 'contents/blog', slug, 'article.md')]) {
        const result = spawnSync(process.execPath, [gate, arg], { cwd: root, encoding: 'utf8' });
        assert.equal(result.status, 1, result.stderr);
        const report = JSON.parse(result.stdout);
        assert.equal(report.pass, false);
        assert.equal(report.checks.publicationAllowed, false);
        assert.ok(report.blockers.join(' ').includes('再公開不可'));
      }
    });
  }
});
