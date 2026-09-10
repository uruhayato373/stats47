import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import {
  extractSettlementTable,
  validateReportBytes,
} from './ingest-depopulated-settlements.mjs';
const require = createRequire(import.meta.url);
const {
  depopulatedSettlementsFixture,
} = require('../../../apps/web/src/features/depopulated-settlements/__tests__/depopulated-settlements-fixture.ts');
const rowNumbers = (row) =>
  [
    ...row.categories.map((category) => category.count),
    row.total,
    row.age65ShareUnder50,
    row.age65Share50plus,
    row.age65Share100,
  ].join(' ');
function table() {
  const fixture = depopulatedSettlementsFixture();
  return `図表2-93\n${fixture.rows.map((row) => `${Number(row.blockCode)} ${row.blockName} ${rowNumbers(row)}`).join('\n')}\n${rowNumbers(fixture.national)}\n合計\n前回調査\n1 北海道 0 0 0 0 0 0 0 0 0 0 0\n図表2-94\n過疎地域 1 2 3`;
}
test('図表2-93だけを抽出し前回調査/指定重複表を除く', () => {
  const result = extractSettlementTable(table(), '2026-09-10T00:00:00.000Z');
  assert.equal(result.rows.length, 10);
  assert.equal(result.national.total, 78485);
  assert.equal(result.national.categories[6].count, 1388);
});
for (const [name, change] of [
  ['図表欠落', (text) => text.replace('図表2-93', '図表2-92')],
  [
    '無回答欠測記号',
    (text) =>
      text.replace(/^1 北海道 (.+)$/m, (line) => line.replace(/ \d+$/, ' -')),
  ],
  ['ブロック行欠落', (text) => text.replace(/^1 北海道 .+\n/m, '')],
  ['ブロック行重複', (text) => text.replace(/^(1 北海道 .+)$/m, '$1\n$1')],
  ['全国行欠落', (text) => text.replace('\n合計\n', '\n集計なし\n')],
  ['母集団相違', (text) => text.replace('78485', '68506')],
])
  test(`${name}を拒否しゼロ補完しない`, () =>
    assert.throws(() => extractSettlementTable(change(table()))));
test('PDF以外の本文/長さ不一致を拒否する', () =>
  assert.throws(() =>
    validateReportBytes(Buffer.from('<html>unavailable</html>'))
  ));
test('同一サイズの改変PDFもSHAで拒否する', () => {
  const bytes = Buffer.alloc(10647905);
  bytes.write('%PDF-');
  assert.throws(() => validateReportBytes(bytes), /SHA/);
});
