import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rankingChartFromNoteData, rasterSafeSvg } from '../build-ranking-type-images';

// 県コードは 1 桁・2 桁でも入力に使える (型の入力が 2 桁へ正規化する)
const codes = [...Array(47).keys()].map((i) => String(i + 1));
const noteData = (valueOf: (code: string, i: number) => number = (_, i) => 20 + i / 10) => ({
  _meta: { rankingKey: 'maximum-temperature', year: 2024 },
  copy: { canonicalTitle: '最高気温' },
  unit: '℃',
  data: codes.map((code, i) => ({ rank: i + 1, area_code: code, area_name: `県${code}`, value: valueOf(code, i) })),
});

test('固定コピーの通し番号ではなく、同値を同順位にする', () => {
  const chart = rankingChartFromNoteData(noteData((_, i) => (i < 2 ? 40 : 30 - i / 10)));
  assert.deepEqual(chart.rows.slice(0, 3).map((row) => row.rank), [1, 1, 3]);
});

test('47 県がそろわない指標は止める', () => {
  const data = noteData();
  assert.throws(() => rankingChartFromNoteData({ ...data, data: data.data.slice(0, 46) }), /47都道府県/);
});

test('PNG に焼くときだけ °C を 1 文字にする', () => {
  assert.equal(rasterSafeSvg('<text>36.2°C</text>'), '<text>36.2℃</text>');
});
