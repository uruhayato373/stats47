import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderAll47TileSvg } from '../../../../apps/remotion/src/features/data-cards/all47-svg';
const rows = Array.from({ length: 47 }, (_, i) => ({
  areaCode: `${String(i + 1).padStart(2, '0')}000`,
  areaName: `県${i + 1}`,
  value: i - 23,
}));
const opts = {
  title: '<script>&"',
  year: '2024年',
  unit: '人',
  source: '出典',
};
test('端の10県だけに絞らず47地域すべての符号付き値を描く', () => {
  const svg = renderAll47TileSvg(rows, opts);
  assert.equal((svg.match(/data-area=/g) || []).length, 47);
  for (const r of rows)
    assert.ok(
      svg.includes(`data-area="${r.areaCode}" data-value="${r.value}"`)
    );
  assert.ok(svg.includes('&lt;script&gt;&amp;&quot;'));
  assert.ok(!svg.includes('<script>'));
});
test('欠測・重複・非有限値は描画を止める', () => {
  assert.throws(() => renderAll47TileSvg(rows.slice(0, 46), opts));
  assert.throws(() =>
    renderAll47TileSvg(
      rows.map((r, i) => (i === 1 ? rows[0] : r)),
      opts
    )
  );
  assert.throws(() =>
    renderAll47TileSvg(
      rows.map((r, i) => (i === 1 ? { ...r, value: NaN } : r)),
      opts
    )
  );
});

test('県庁所在市の値を県全体と誤認させず都市名で表示する', () => {
  const svg = renderAll47TileSvg(rows, { ...opts, capitalCities: true });
  for (const city of ['札幌市', 'さいたま市', '東京区部', '横浜市', '那覇市']) assert.ok(svg.includes(city));
  assert.ok(svg.includes('47都市を見比べる'));
  assert.ok(!svg.includes('全47都道府県を見比べる'));
});
