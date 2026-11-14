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
  // 5 文字の「さいたま市」はタイルの幅に収まらないので「市」を省く (見出しと凡例が「市」と書く。CONTENT-FOLLOWUP-01)
  for (const city of ['札幌市', '>さいたま<', '東京区部', '横浜市', '那覇市']) assert.ok(svg.includes(city), city);
  assert.ok(svg.includes('県庁所在市'));
});
test('発行元・宣伝文・読み方の注記を画像に入れない (chart-image-copy.md)', async () => {
  const { assertMinimalChartCopy } = await import('../../media/lib/image-copy.mjs');
  for (const capitalCities of [false, true]) {
    const svg = renderAll47TileSvg(rows, { ...opts, capitalCities });
    assertMinimalChartCopy(svg);
    for (const text of ['stats47', '見比べる', '一枚で', '色が濃いほど', '模式図']) assert.ok(!svg.includes(text), text);
    for (const text of ['2024年', '単位：人', '出典：出典']) assert.ok(svg.includes(text), text);
  }
});
