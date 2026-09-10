import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { extractInboundVisits } from '../ingest-tourism-consumption.mjs';

const require = createRequire(import.meta.url);
const ExcelJS = require('exceljs');
const prefectures = require('../../../../packages/area/src/data/prefectures.json');

function fixture() {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet('表1-1');
  const labels = {
    A1: '【訪日外国人】', A5: '2025年（令和7年）暦年',
    B3: '都道府県（47区分）別　訪問者数および消費単価　【全目的】',
    E5: '（単位：万人）', C8: '標本サイズ（人）', E8: '訪問者数',
    B56: '標本サイズ（人）', C56: 101316,
  };
  for (const [cell, value] of Object.entries(labels)) sheet.getCell(cell).value = value;
  prefectures.forEach((pref, i) => {
    const row = i + 9;
    for (const [col, value] of Object.entries({ A: i + 1, B: pref.prefName, C: 100 + i, D: 0.1, E: 345.6789 + i, F: 20 + i })) {
      sheet.getCell(`${col}${row}`).value = value;
    }
  });
  return { book, sheet };
}

test('keeps weighted visitor estimates and unweighted visit samples separate', () => {
  const { book } = fixture();
  const result = extractInboundVisits(book);
  assert.equal(result.outputs[0].rows.length, 47);
  assert.equal(result.outputs[0].rows[0].value, 345.6789);
  assert.equal(result.outputs[0].unit, '万人');
  assert.equal(result.outputs[1].rows[0].value, 100); // C, not expenditure sample F=20
  assert.equal(result.outputs[1].unit, '人');
  assert.equal(result.nationalUnweightedSample, 101316);
  assert.notEqual(result.rows[0].sample / result.nationalUnweightedSample, result.rows[0].rate);
});

for (const [name, cell, value] of [
  ['different population', 'A1', '【日本人】'],
  ['different year', 'A5', '2024年（令和6年）暦年'],
  ['different unit', 'E5', '（単位：人）'],
  ['changed national sample', 'C56', 101315],
  ['missing visit sample even though F exists', 'C9', null],
  ['fractional sample', 'C9', 100.5],
  ['sample larger than national', 'C9', 101317],
  ['negative visitors', 'E9', -1],
  ['rate above one', 'D9', 1.1],
  ['duplicate prefecture', 'A10', 1],
  ['wrong prefecture name', 'B9', '東京都'],
]) {
  test(`rejects ${name}`, () => {
    const { book, sheet } = fixture();
    sheet.getCell(cell).value = value;
    assert.throws(() => extractInboundVisits(book));
  });
}
