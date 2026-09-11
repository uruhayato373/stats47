import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { extractBusinessDemography } from '../ingest-business-demography.mjs';

const require = createRequire(import.meta.url);
const prefectures = require('../../../../packages/area/src/data/prefectures.json');
function sheet(kind, overrides = {}) {
  const annual = kind === 'annual';
  const headers = annual
    ? { '2:1': '都道府県労働局別適用状況〔事業所関係〕', '3:4': '2024年度', '4:2': '保険関係新規成立事業所数', '4:3': '保険関係消滅事業所数', '6:2': '所', '6:3': '所', '7:1': '全国計', '7:2': 470, '7:3': 235 }
    : { '3:4': '-令和6年3月-', '4:4': '月末適用事業所数', '5:4': '所', '6:1': '全国計', '6:4': 9400 };
  return { getRow: (row) => ({ getCell: (col) => ({ value: (() => {
    const address = `${row}:${col}`;
    if (Object.hasOwn(overrides, address)) return overrides[address];
    if (Object.hasOwn(headers, address)) return headers[address];
    const pref = prefectures[row - (annual ? 8 : 7)];
    if (!pref) return null;
    if (col === 1) return annual && pref.prefName !== '北海道' ? pref.prefName.replace(/[都府県]$/, '') : pref.prefName;
    if (annual && col === 2) return 10;
    if (annual && col === 3) return 5;
    // Annual means differ deliberately from March-end stocks.
    if (col === 4) return annual ? 999.5 : 200;
    return null;
  })() }) }) };
}

test('前年度末を分母に使い、年平均と区別した47県5系列を生成する', () => {
  const result = extractBusinessDemography(sheet('annual'), sheet('march'), 2024);
  assert.equal(result.series.size, 5);
  assert.deepEqual(result.national, [470, 235, 9400]);
  assert.deepEqual(result.nationalRates, [5, 2.5]);
  for (const rows of result.series.values()) {
    assert.equal(rows.length, 47);
    assert.equal(new Set(rows.map((r) => r.areaCode)).size, 47);
    assert.equal(rows[0].areaCode, '01000');
    assert.equal(rows[0].yearCode, '2024');
  }
  assert.equal(result.series.get('business-opening-rate')[0].value, 5);
  assert.equal(result.series.get('business-closure-rate')[0].value, 2.5);
  assert.match(result.series.get('business-opening-base-establishments')[0].yearName, /2024年3月末/);
});

test('分母の年月・列・原単位の取り違えを停止する', () => {
  assert.throws(() => extractBusinessDemography(sheet('annual'), sheet('march', { '3:4': '-令和7年3月-' }), 2024), /previous fiscal year-end/);
  assert.throws(() => extractBusinessDemography(sheet('annual'), sheet('march', { '4:4': '年度月平均適用事業所数' }), 2024), /monthly mean/);
  assert.throws(() => extractBusinessDemography(sheet('annual', { '3:4': '2023年度' }), sheet('march'), 2024), /Annual observation year/);
  assert.throws(() => extractBusinessDemography(sheet('annual'), sheet('march', { '5:4': '千所' }), 2024));
});

test('欠測・空文字・負数・小数・ゼロ分母を補間しない', () => {
  for (const bad of [null, '', -1, 10.5]) {
    assert.throws(() => extractBusinessDemography(sheet('annual', { '8:2': bad }), sheet('march'), 2024), /count/);
  }
  assert.throws(() => extractBusinessDemography(sheet('annual'), sheet('march', { '7:4': 0 }), 2024), /denominator/);
});

test('県帰属・47県範囲・全国との保存則の崩れを停止する', () => {
  assert.throws(() => extractBusinessDemography(sheet('annual', { '9:1': '北海道' }), sheet('march'), 2024), /prefecture order/);
  assert.throws(() => extractBusinessDemography(sheet('annual'), sheet('march', { '53:1': null }), 2024), /prefecture order/);
  assert.throws(() => extractBusinessDemography(sheet('annual', { '8:2': 11 }), sheet('march'), 2024), /national totals/);
  assert.throws(() => extractBusinessDemography(sheet('annual', { '55:1': 'その他' }), sheet('march'), 2024), /extra region/);
});
