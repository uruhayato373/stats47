'use strict';

/**
 * バックログパーサの契約。
 *
 * ここが壊れると backlog-loop は「完了したつもりで別のエントリを消す」か
 * 「エントリを取りこぼして永久に処理しない」のどちらかをやる。実データ相手の
 * 件数だけでなく、**削除が対象 1 件にしか効かないこと**を両方向で固定する。
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
const FEATURE = path.join(ROOT, 'docs/todo/05_機能バックログ.md');
const INBOX = path.join(ROOT, 'docs/todo/01_未整理タスク.md');

const SAMPLE = [
  '# バックログ',
  '',
  '## P1 今月',
  '',
  '### [ALPHA-01] 一つ目',
  '',
  '- **status**: pending',
  '- **tier**: 1',
  '- **次**: 何かする',
  '',
  '### [BETA-02] 二つ目',
  '',
  '- **status**: in-progress',
  '- **次**: 別のことをする',
  '',
  '## P2 あとで',
  '',
  '### [GAMMA-03] 三つ目',
  '',
  '- **status**: deferred',
  '',
].join('\n');

test('見出し型エントリを ID・セクション・フィールド・行範囲つきで拾う', () => {
  const { entries } = parseHeadingEntries(SAMPLE, 'sample.md');
  assert.deepEqual(
    entries.map((e) => e.id),
    ['ALPHA-01', 'BETA-02', 'GAMMA-03'],
  );
  const alpha = entries[0];
  assert.equal(alpha.section, 'P1 今月');
  assert.equal(alpha.fields.status, 'pending');
  assert.equal(alpha.fields.tier, '1');
  assert.equal(alpha.fields['次'], '何かする');
  // 末尾の空行を含めない (削除しても段落の区切りが壊れないように)
  assert.equal(SAMPLE.split('\n')[alpha.endLine - 1].trim(), '- **次**: 何かする');
  assert.equal(entries[2].section, 'P2 あとで');
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
  assert.ok(after.includes('## P1 今月') && after.includes('## P2 あとで'));
});

test('削除範囲が空なら元テキストとバイト一致する (往復で壊さない)', () => {
  assert.equal(removeLineRanges(SAMPLE, []), SAMPLE);
  const real = fs.readFileSync(FEATURE, 'utf8');
  assert.equal(removeLineRanges(real, []), real);
});

test('表の途中に空行があっても行を取りこぼさない', () => {
  // 実データ (01_未整理タスク.md) が実際にこの形をしている。空行で header を捨てる実装だと
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
  const { entries } = parseHeadingEntries(fs.readFileSync(FEATURE, 'utf8'), FEATURE);
  assert.ok(entries.length >= 20, `05 のエントリが少なすぎる: ${entries.length}`);
  // ID は docs-governance の idPattern に適合していること
  for (const e of entries) {
    assert.match(e.id, /^[A-Z0-9]+(?:-[A-Z0-9]+)+$/, `不正な ID: ${e.id}`);
  }
  // status はほぼ全件が持つ (DG055 が必須化している)
  const withStatus = entries.filter((e) => e.fields.status).length;
  assert.ok(withStatus >= entries.length - 1, `status 欠落が多すぎる: ${entries.length - withStatus}`);

  const { rows } = parseTableRows(fs.readFileSync(INBOX, 'utf8'), INBOX);
  assert.ok(rows.length >= 5, `01 の行が少なすぎる: ${rows.length}`);
});
