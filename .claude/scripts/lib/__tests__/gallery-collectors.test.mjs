import assert from 'node:assert/strict';
import test from 'node:test';

import { buildTab } from '../gallery-collectors.mjs';

test('blog-card は640×336の約1.91:1として列挙する', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        articles: [{ slug: 'sample-article', published: true }],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );

  try {
    const tab = await buildTab('blog-card', {
      site: 'https://stats47.example',
      r2: 'https://storage.stats47.example',
      projectRoot: process.cwd(),
    });

    assert.equal(tab.aspect, '1.91:1');
    assert.deepEqual(
      tab.entries[0].images.map((image) => image.url),
      [
        'https://storage.stats47.example/app/blog/sample-article/thumbnail-light.webp',
        'https://storage.stats47.example/app/blog/sample-article/thumbnail-dark.webp',
      ]
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// 意図: 公開 R2 にカバーが無いのが正しい記事 (有料・専用デザイン) を「欠落」と数えない。生成側と除外範囲がずれると
// 生成しないものを監査が欠落として毎週落とす (2026-09 に 79 件で発生) ので、生成側の集合との一致も固定する
test('note カバーの監査対象は有料記事と専用デザインのシリーズを除き、生成側と同じ集合で除外する', async () => {
  const { mkdtempSync, mkdirSync, writeFileSync, readFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join, resolve, dirname } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { enumerateNoteCovers, BESPOKE_COVER_VERTICALS } = await import('../gallery-collectors.mjs');
  const root = mkdtempSync(join(tmpdir(), 'note-covers-'));
  mkdirSync(join(root, '.claude/state'), { recursive: true });
  writeFileSync(join(root, '.claude/state/note-draft-index.json'), JSON.stringify({ drafts: {
    pub: { r2_path: 'note/stats47-note/pub', vertical: 'stats47-note' },
    paid: { r2_path: 'note/stats47-note/paid', vertical: 'stats47-note', r2_access: 'private' },
    bespoke: { r2_path: 'note/koumuin-claude-code/bespoke', vertical: 'koumuin-claude-code' },
    'became-paid': { r2_path: 'note/stats47-note/became-paid', vertical: 'stats47-note' },
  } }));
  writeFileSync(join(root, '.claude/state/note-published-urls.json'), JSON.stringify({ articles: {
    'became-paid': { r2_path: 'note/stats47-note/became-paid', vertical: 'stats47-note', r2_access: 'private' },
  } }));
  assert.deepEqual(enumerateNoteCovers(root).map((c) => c.slug), ['pub']);

  const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
  const generator = readFileSync(join(repo, 'apps/web/scripts/generate-ogp-images.ts'), 'utf8');
  const literal = generator.match(/const BESPOKE_COVER_VERTICALS = new Set\(\[([\s\S]*?)\]\)/)?.[1] ?? '';
  const generatorSet = [...literal.matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
  assert.deepEqual(generatorSet, [...BESPOKE_COVER_VERTICALS].sort());
  assert.match(generator, /!n\.isPrivate/, '生成側も有料記事を除外する');
});
