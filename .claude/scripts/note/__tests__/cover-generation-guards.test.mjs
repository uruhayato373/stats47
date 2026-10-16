import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { COVER_ROOT } from '../lib/cover-assets.mjs';
import { NOTE_RANKING_IMAGES, buildRenderSpec, validateRenderSpec } from '../lib/note-render-spec.mjs';

for (const file of ['.claude/scripts/note/generate-note-covers.mjs', '.claude/scripts/note/generate-koumuin-covers.cjs',
  '.claude/scripts/note/generate-cover-refresh.ts', '.claude/skills/note/generate-note-charts/scripts/cover-template.js']) {
  test(`旧生成口はファイルを書かず停止する: ${path.basename(file)}`, () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'note-cover-guard-'));
    try {
      const args = [...(file.endsWith('.ts') ? ['--import', pathToFileURL(path.join(COVER_ROOT, 'node_modules/tsx/dist/loader.mjs')).href] : []), path.join(COVER_ROOT, file), '--output', directory, '--version', 'guard-test'];
      const result = spawnSync(process.execPath, args, { cwd: directory, encoding: 'utf8', timeout: 30000 });
      assert.equal(result.status, 1, result.stderr);
      assert.match(result.stderr, /Codex imagegen/);
      assert.deepEqual(readdirSync(directory), []);
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
}

test('ランキング本文を作り直しても採用済みカバーを上書きせず、旧specは読める', () => {
  assert.equal(NOTE_RANKING_IMAGES.length, 3);
  assert.ok(NOTE_RANKING_IMAGES.every(image => !/cover/i.test(image.file + image.composition)));
  const source = JSON.stringify({ _meta: { rankingKey: 'test', year: 2024 } });
  const spec = buildRenderSpec('a-test', source);
  const legacy = { ...spec, images: [{ file: 'images/cover-1280x670.png', composition: 'RankingNote-Cover', width: 1280, height: 670 }, ...spec.images] };
  assert.deepEqual(validateRenderSpec('a-test', legacy, source), []);
});
