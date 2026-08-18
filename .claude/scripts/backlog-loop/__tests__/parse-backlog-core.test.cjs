'use strict';

/**
 * バックログパーサ (backlog-loop adapter) の契約。
 *
 * ここが壊れると backlog-loop は「完了したつもりで別のカードを消す」か
 * 「カードを取りこぼして永久に処理しない」のどちらかをやる。実データ相手の
 * 件数だけでなく、**削除が対象 1 件にしか効かないこと**を両方向で固定する。
 *
 * カード構文そのもののテストは `.claude/scripts/lib/__tests__/backlog-lib.test.cjs`
 * (単一実装)。ここは adapter (sourceFile 付与・表・行削除) を見る。
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  parseHeadingEntries,
  parseTableRows,
  removeLineRanges,
} = require('../parse-backlog-core.cjs');

const ROOT = path.resolve(__dirname, '../../../..');
const BACKLOG = path.join(ROOT, '.claude/todo/backlog.md');

const SAMPLE = [
  '# バックログ',
  '',
  '## 🔴 高',
  '',
  '### [ALPHA-01] 一つ目',
  'タグ: [実行:sweep] [起票:2026-08-01]',
  '',
  '- **次**: 何かする',
  '',
  '### [BETA-02] 二つ目',
  'タグ: [進行中]',
  '',
  '- **次**: 別のことをする',
  '',
  '## 🟢 低',
  '',
  '### [GAMMA-03] 三つ目',
  '',
  '本文だけがある。',
  '',
].join('\n');

test('カードを ID・tier・タグ・行範囲つきで拾う', () => {
  const { entries } = parseHeadingEntries(SAMPLE, 'sample.md');
  assert.deepEqual(
    entries.map((e) => e.id),
    ['ALPHA-01', 'BETA-02', 'GAMMA-03'],
  );
  const alpha = entries[0];
  assert.equal(alpha.tier, 'high');
  assert.equal(alpha.section, 'high'); // 旧 API 互換の別名
  assert.equal(alpha.executor, 'sweep');
  assert.equal(alpha.filed, '2026-08-01');
  assert.equal(alpha.sourceFile, 'sample.md');
  // 末尾の空行を含めない (削除しても段落の区切りが壊れないように)
  assert.equal(SAMPLE.split('\n')[alpha.endLine - 1].trim(), '- **次**: 何かする');
  assert.equal(entries[1].wip, true);
  assert.equal(entries[2].tier, 'low');
});

test('削除は対象 1 件にしか効かない (行番号で消す・文字列一致で消さない)', () => {
  const { entries } = parseHeadingEntries(SAMPLE, 'sample.md');
  const target = entries.find((e) => e.id === 'BETA-02');
  const after = removeLineRanges(SAMPLE, [target]);
  const { entries: rest } = parseHeadingEntries(after, 'sample.md');
  assert.deepEqual(
    rest.map((e) => e.id),
    ['ALPHA-01', 'GAMMA-03'],
  );
  assert.ok(!after.includes('BETA-02'));
  // 見出し構造は残る
  assert.ok(after.includes('## 🔴 高') && after.includes('## 🟢 低'));
});

test('削除範囲が空なら元テキストとバイト一致する (往復で壊さない)', () => {
  assert.equal(removeLineRanges(SAMPLE, []), SAMPLE);
  const real = fs.readFileSync(BACKLOG, 'utf8');
  assert.equal(removeLineRanges(real, []), real);
});

test('表の途中に空行があっても行を取りこぼさない', () => {
  // 実データ (旧 01_未整理タスク.md) が実際にこの形をしていた。空行で header を捨てる実装だと
  // 後続行が「新しい表のヘッダ」に化けて 1 行まるごと消えた。
  const withGap = [
    '| 日付 | 内容 |',
    '|---|---|',
    '| 2026-08-01 | 一つ目 |',
    '',
    '| 2026-08-02 | 二つ目 |',
  ].join('\n');
  const { rows } = parseTableRows(withGap, 'sample.md');
  assert.equal(rows.length, 2);
  assert.equal(rows[1].values['内容'], '二つ目');
});

test('ヘッダが再掲されたら別の表として数える', () => {
  const twoTables = [
    '| 日付 | 内容 |',
    '|---|---|',
    '| 2026-08-01 | 一つ目 |',
    '',
    '| 日付 | 内容 |',
    '|---|---|',
    '| 2026-08-02 | 二つ目 |',
  ].join('\n');
  const { rows } = parseTableRows(twoTables, 'sample.md');
  assert.equal(rows.length, 2);
  assert.notEqual(rows[0].id, rows[1].id);
  assert.ok(rows[1].id.includes('t1'), '2 つ目の表として採番される');
});

test('実データを解析できる (件数が 0 に落ちたら配線が壊れている)', () => {
  const text = fs.readFileSync(BACKLOG, 'utf8');
  const { entries } = parseHeadingEntries(text, BACKLOG);
  assert.ok(entries.length >= 20, `backlog のカードが少なすぎる: ${entries.length}`);
  // ID を持つカードは docs-governance の idPattern に適合していること
  for (const e of entries) {
    if (e.id) assert.match(e.id, /^[A-Z0-9]+(?:-[A-Z0-9]+)+$/, `不正な ID: ${e.id}`);
  }
  // stats47 の backlog は backlog-loop の対象なので ID がほぼ全件に要る
  const withId = entries.filter((e) => e.id).length;
  assert.ok(withId >= entries.length - 3, `ID 欠落が多すぎる: ${entries.length - withId}`);

  // 指標候補テーブル (旧 06) はカード本文として温存され、表として読める
  const { rows } = parseTableRows(text, BACKLOG);
  assert.ok(rows.length >= 5, `候補テーブルの行が少なすぎる: ${rows.length}`);
});
