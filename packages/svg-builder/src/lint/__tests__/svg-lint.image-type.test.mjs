import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  findTemplateFontFloorDefects,
  imageTemplateOf,
  lintDarkPair,
  lintImageTypeSvg,
  lintScatterData,
  lintScatterParity,
  lintScatterQuality,
  lintSvgContent,
  lintSvgSize,
  lintTileGridQuality,
} from '../svg-lint.mjs';

// The shared 4:5 image types (bars / tile map) are marked on the root <svg> by their renderers.
const typeSvg = (template, theme, size = '1080 1350') => {
  const [w, h] = size.split(' ');
  return `<!-- data-source: x.json | generated: 2026-11-03T00:00:00.000Z -->\n<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${size}" data-image-template="${template}" data-theme="${theme}"><rect width="${w}" height="${h}" fill="#F8FAFC"/><text>上位3県</text></svg>`;
};

test('a type image is recognised by its marker and held to 1080×1350, not the old blog sizes', () => {
  assert.equal(imageTemplateOf(typeSvg('bar', 'light')), 'bar');
  assert.equal(imageTemplateOf('<svg viewBox="0 0 960 404"></svg>'), null);
  assert.deepEqual(lintSvgSize('sales-prefecture-rankings.svg', typeSvg('bar', 'light')).errors, []);
  assert.deepEqual(lintSvgSize('sales-map.svg', typeSvg('tile-map', 'light')).errors, []);
  assert.equal(lintSvgSize('sales-map.svg', typeSvg('tile-map', 'light', '720 720')).errors.length, 1);
  // The old tile-map invariants (720×720, no paper) and the dark-mode warning do not apply.
  assert.deepEqual(lintTileGridQuality('sales-map.svg', typeSvg('tile-map', 'light')).errors, []);
  assert.equal(lintSvgContent(typeSvg('bar', 'light'), 'sales-ranking.svg').warnings.some((w) => w.includes('dark mode')), false);
});

test('an unmarked old chart is still held to the old sizes', () => {
  const old = '<svg width="1080" height="1350" viewBox="0 0 1080 1350"></svg>';
  assert.equal(lintSvgSize('sales-map.svg', old).errors.length, 1);
});

test('a light type image needs its dark pair of the same type', () => {
  const light = typeSvg('tile-map', 'light');
  assert.deepEqual(lintDarkPair('sales-map.svg', light, typeSvg('tile-map', 'dark')).errors, []);
  assert.match(lintDarkPair('sales-map.svg', light, null).errors[0], /sales-map-dark\.svg/);
  assert.equal(lintDarkPair('sales-map.svg', light, typeSvg('bar', 'dark')).errors.length, 1);
  assert.equal(lintDarkPair('sales-map.svg', light, typeSvg('tile-map', 'light')).errors.length, 1);
  // Old charts and the dark file itself are not asked for a pair.
  assert.deepEqual(lintDarkPair('sales-map.svg', '<svg viewBox="0 0 720 720"></svg>', null).errors, []);
  assert.deepEqual(lintDarkPair('sales-map-dark.svg', typeSvg('tile-map', 'dark'), null).errors, []);
});

test('a scatter type image is held to 1080×1350 and its points are counted by data-pref', () => {
  const json = { points: Array.from({ length: 47 }, (_, i) => ({ label: `県${i + 1}`, x: i, y: i })) };
  const dots = (n) => Array.from({ length: n }, (_, i) => `<circle data-pref="${String(i + 1).padStart(2, '0')}000" r="10"/>`).join('');
  const svg = typeSvg('scatter', 'light').replace('</svg>', `${dots(47)}</svg>`);
  assert.deepEqual(lintSvgSize('a--b-scatter.svg', svg).errors, []);
  // The 720×720 svg-builder invariants do not apply to the type image.
  assert.deepEqual(lintScatterQuality('a--b-scatter.svg', svg, json).errors, []);
  assert.deepEqual(lintScatterParity('a--b-scatter.svg', svg, json).errors, []);
  const missing = typeSvg('scatter', 'light').replace('</svg>', `${dots(46)}</svg>`);
  assert.match(lintScatterParity('a--b-scatter.svg', missing, json).errors[0], /JSON=47 件 \/ SVG=46 件/);
});

test('市区町村の散布図は町名を許し、都道府県の散布図の略称は止め続ける', () => {
  const svg = (attributes, name) =>
    typeSvg('scatter', 'light')
      .replace('data-image-template="scatter"', `data-image-template="scatter" ${attributes}`)
      .replace('</svg>', `<text x="1" y="1" text-anchor="start" font-size="32" font-weight="700">${name}</text></svg>`);
  const named = (content) => lintImageTypeSvg('a-scatter.svg', content).errors.filter((error) => error.includes('正式名'));
  assert.equal(named(svg('data-level="municipality"', '田原市')).length, 0);
  assert.equal(named(svg('data-points="47"', '東京')).length, 1);
});

test('市区町村の散布図だけ 47 を超える点数を宣言できる', () => {
  const points = Array.from({ length: 48 }, (_, i) => ({ code: String(i), name: 'a', x: i, y: i }));
  const bound = (level) => lintScatterData('a--b-scatter.json', { chartType: 'scatter', level, points }, { expectedPointCount: 48 }).errors.filter((error) => error.includes('expectedPointCount'));
  assert.equal(bound('municipality').length, 0);
  assert.equal(bound(undefined).length, 1);
});

// 2026-11-03 の全記事の描き直しで出た型の不具合 (BLOG-FIGURE-REDRAW-REGRESSION-01)
test('型の画像の「出典：」だけの行と、枠の右端を越える題を数える', () => {
  const withText = (text) => typeSvg('bar', 'light').replace('</svg>', `${text}</svg>`);
  const title = (size, text) => `<text x="64" y="120" font-size="${size}" font-weight="700">${text}</text>`;
  const warned = (svg) => lintImageTypeSvg('sales-ranking.svg', svg).warnings;
  // 出典名の無い行 (タイル地図の型は座標を小数で書く)
  assert.match(warned(withText('<text x="64.0" y="1310.0" font-size="26.0" font-weight="400" fill="#475569">出典：</text>'))[0], /出典名が無い/);
  assert.deepEqual(warned(withText('<text x="64" y="1310" font-size="26">出典：家計調査</text>')), []);
  // 72px の題は全角 13 字 (936px) まで。18 字は 51px なら収まる
  assert.match(warned(withText(title(72, '外国人延べ宿泊者数 都道府県ランキング')))[0], /題が枠の右端を越える/);
  assert.deepEqual(warned(withText(title(51, '外国人延べ宿泊者数 都道府県ランキング'))), []);
  assert.deepEqual(warned(withText(title('72.0', '大人用サンダル消費支出額'))), []);
  // 公開中の図に残っている間は数えるだけで、公開は止めない
  assert.deepEqual(lintImageTypeSvg('sales-ranking.svg', withText(title(72, '外国人延べ宿泊者数 都道府県ランキング'))).errors, []);
});

// CHART-AXIS-READABILITY-01: 型の画像はスマホの本文で 1/3 に縮むので、30 未満の文字は画面上 10px を切る
test('findTemplateFontFloorDefects: 型の画像の 30 未満の文字 (text と tspan) を返し、型でない SVG は見ない', () => {
  const svg = '<svg data-image-template="bar"><text font-size="30">東京</text><text x="1" font-size="26">出典：x</text><text font-size="40">36.0<tspan font-size="24" dx="4">°C</tspan></text></svg>';
  assert.deepEqual(findTemplateFontFloorDefects(svg), ['26 出典：x', '24 °C']);
  assert.deepEqual(findTemplateFontFloorDefects(svg.replace(' data-image-template="bar"', '')), []);
  assert.deepEqual(findTemplateFontFloorDefects(svg, 24), []);
});
