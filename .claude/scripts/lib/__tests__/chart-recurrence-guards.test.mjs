// 2026-11-04 の散布図の移行で人が見つけた問題を、機械が止めることを固定する。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';

import { CHART_SOURCE_KIND_SPECS } from '../chart-provenance.mjs';
import { CHART_SOURCE_SCHEMA, chartSourceShapeErrors } from '../chart-source-schema.mjs';
import { lintImageTypeSvg } from '../svg-lint.mjs';
import { chartDataFilesOf, chartDataKey } from '../../blog/archive-blog-articles.mjs';
import { compareAsset } from '../../blog/verify-published-assets.mjs';
import { buildRepair, yearValues } from '../../blog/rebuild-scatter-data.mjs';
import { isOutdatedChart } from '../../blog/drop-outdated-outbox-charts.mjs';

const svg = ({ theme = 'light', name = '東京都', title = '年間収入と支出', fill = '#0f579f', paper = '#F8FAFC' } = {}) =>
  `<svg width="1080" height="1350" viewBox="0 0 1080 1350" data-theme="${theme}" data-image-template="scatter"><rect width="1080" height="1350" fill="${paper}"/><text y="120" font-size="64">${title}</text><circle data-pref="13000" r="10" fill="${fill}"/><text font-size="32" font-weight="700">${name}</text></svg>`;
const errors = (s) => lintImageTypeSvg('a-scatter.svg', s).errors;

test('source.json の kind の語彙はスキーマとコードで同じ', () => {
  assert.deepEqual([...CHART_SOURCE_SCHEMA.properties.kind.enum].sort(), Object.keys(CHART_SOURCE_KIND_SPECS).sort());
});

test('axes の形を止める', () => {
  const axis = { metricKey: 'a-key', year: '2024年', proof: 'values' };
  assert.deepEqual(chartSourceShapeErrors({ kind: 'scatter', axes: { x: axis, y: { year: '2022年度', proof: 'manifest' } } }), []);
  assert.ok(chartSourceShapeErrors({ kind: 'scatter', axes: { x: axis } }).length, '片方の軸が無い');
  assert.ok(chartSourceShapeErrors({ kind: 'scatter', axes: { x: { year: '2024年', proof: 'values' }, y: axis } }).length, '値で確かめた軸に指標が無い');
  assert.ok(chartSourceShapeErrors({ kind: 'unknown' }).length, '語彙外の kind');
});

test('一時ファイルで作った source.json を見分ける', () => {
  assert.ok(chartSourceShapeErrors({ kind: 'derived', generatedBy: '/tmp/backfill.mjs' }).length);
  assert.deepEqual(chartSourceShapeErrors({ kind: 'derived', generatedBy: '.claude/scripts/blog/x.mjs' }), []);
});

test('型の画像の文字化け・矢印・短い県名を止める', () => {
  assert.deepEqual(errors(svg()), []);
  assert.match(errors(svg({ title: '佐賀��' })).join(), /文字化け/);
  assert.match(errors(svg({ title: '年間降水量 (mm) →' })).join(), /矢印/);
  assert.match(errors(svg({ name: '東京' })).join(), /正式名/);
});

test('暗い版の点が地に沈む色を止め、明るくした色は通す', () => {
  assert.match(errors(svg({ theme: 'dark', paper: '#262626', fill: '#0f579f' })).join(), /地に沈む/);
  assert.deepEqual(errors(svg({ theme: 'dark', paper: '#262626', fill: '#5789bc' })), []);
});

test('本文が参照する図の点データと出典を版の保管の対象にする', () => {
  assert.deepEqual(chartDataFilesOf('![a](data/x-scatter.svg) ![b](data/y-ranking.svg)'), ['x-scatter.json', 'x-scatter.source.json', 'y-ranking.json', 'y-ranking.source.json']);
  assert.equal(chartDataKey('s', 'x.json', 'abc'), 'blog-archive/s/data/x.json/abc');
});

test('公開版が手元と違うときだけ問題にする', async () => {
  const same = await compareAsset('k', Buffer.from('a'), async () => new Response('a'));
  assert.equal(same, null);
  assert.match(await compareAsset('k', Buffer.from('a'), async () => new Response('b')), /違う/);
  assert.match(await compareAsset('k', Buffer.from('a'), async () => new Response('', { status: 404 })), /404/);
});

test('点データの復元は 47 県そろわない年を止め、一時ファイルの記録を残さない', () => {
  const rows = Array.from({ length: 47 }, (_, i) => ({ yearCode: '2020', areaCode: `${String(i + 1).padStart(2, '0')}000`, areaName: `県${i + 1}`, value: i, unit: '％' }));
  assert.throws(() => yearValues(rows.slice(1), 'a', '2020'), /46 県/);
  const v = yearValues(rows, 'a', '2020');
  const { manifest, data } = buildRepair({ base: 'b', x: ['a', '2020'], y: ['a', '2020'] }, { kind: 'derived', rankingKeys: ['a'], generatedBy: '/tmp/x.mjs' }, v, v);
  assert.equal(data.points.length, 47);
  assert.equal(manifest.kind, 'scatter');
  assert.equal(manifest.rankingKeys, undefined);
  assert.deepEqual(chartSourceShapeErrors(manifest), []);
});

test('送り箱の古い図は公開中の型の図を上書きしない。点データが違えば別の図として公開する', () => {
  const typed = '<svg data-image-template="scatter">', old = '<svg>';
  assert.equal(isOutdatedChart({ outboxSvg: old, liveSvg: typed, outboxData: 'a', liveData: 'a' }), true);
  assert.equal(isOutdatedChart({ outboxSvg: old, liveSvg: typed, outboxData: 'b', liveData: 'a' }), false);
  assert.equal(isOutdatedChart({ outboxSvg: typed, liveSvg: typed, outboxData: 'a', liveData: 'a' }), false);
  assert.equal(isOutdatedChart({ outboxSvg: old, liveSvg: null, outboxData: 'a', liveData: null }), false);
});

test('送り箱の除外は同期より前に走り、描き直しの反映は公開 URL で確かめる', () => {
  const publish = fs.readFileSync('.github/workflows/blog-auto-publish.yml', 'utf8');
  assert.ok(publish.indexOf('drop-outdated-outbox-charts.mjs') < publish.indexOf('cp -R "contents/blog/$SLUG/."'));
  const regen = fs.readFileSync('.github/workflows/regenerate-blog-svgs.yml', 'utf8');
  assert.ok(regen.indexOf('verify-published-assets.mjs') > regen.indexOf('Push regenerated/repaired assets'));
});
