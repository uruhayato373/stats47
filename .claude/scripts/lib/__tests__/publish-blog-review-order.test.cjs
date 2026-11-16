'use strict';
// 手動公開 (publish-blog.yml) は、品質ゲートが写した先の review.md (blog-critic の PASS) を読んでから作業ファイルを消す。
// 2026-11-14 に消す処理を写しの直後へ置き、審査済みの記事も「critic レビュー未通過」で必ず止まった (2026-11-16 run 43860072376)。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../../../..');
const wf = fs.readFileSync(path.join(ROOT, '.github/workflows/publish-blog.yml'), 'utf8');

test('publish-blog: review.md を消すのは品質ゲートの後', () => {
  const gate = wf.indexOf('node .claude/scripts/blog/quality-gate.mjs');
  const removeReview = wf.indexOf('/review.md"');
  assert.ok(gate > 0, '品質ゲートの呼び出しがある');
  assert.ok(removeReview > 0, '公開物から review.md を外す処理がある (審査結果を公開 R2 へ上げない)');
  assert.ok(removeReview > gate, 'review.md を消す処理が品質ゲートより前にあると、ゲートが審査記録を見つけられない');
});

test('publish-blog: 公開物を push する前に review.md を消している', () => {
  const removeReview = wf.indexOf('/review.md"');
  const push = wf.indexOf('diff-push-r2.ts --allow-authoritative-overwrite --prefix "app/blog/$SLUG"');
  assert.ok(push > 0, '記事の push がある');
  assert.ok(removeReview < push, 'review.md を消す前に push すると、審査結果が公開 R2 に上がる');
});
