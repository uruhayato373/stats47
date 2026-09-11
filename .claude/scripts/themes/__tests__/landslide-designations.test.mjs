import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { extractLandslideDesignations } from '../ingest-landslide-designations.mjs';

const require = createRequire(import.meta.url);
const prefectures = require('../../../../packages/area/src/data/prefectures.json');
function fixture() {
  const header = '全国における土砂災害警戒区域等の指定状況 2026/6/30時点 土石流 急傾斜地の崩壊 地滑り うち土砂災害特別 基礎調査';
  const rows = [...prefectures].reverse().map((pref) => `${pref.prefName} 10 1 20 2 30 3 60 6 60 10 20 30`);
  return [header, ...rows, '合計 470 47 940 94 1410 141 2820 282 2820 470 940 1410'].join('\n');
}
test('原表がJIS順でなくても県名で解決し、参考調査の列を混ぜない', () => {
  const data = extractLandslideDesignations(fixture());
  assert.equal(data.rows[0].areaCode, '01000');
  assert.equal(data.rows[46].areaCode, '47000');
  assert.equal(data.rows[0].values['landslide-special-warning-zone-count'], 6);
  assert.equal(data.rows[0].values['debris-flow-special-warning-zone-count'], 1);
});
test('欠測・重複・全国合計不一致で取り込みを拒否する', () => {
  assert.throws(() => extractLandslideDesignations(fixture().replace(/^北海道.*\n/m, '')), /Missing prefecture/);
  assert.throws(() => extractLandslideDesignations(fixture() + '\n北海道 10 1 20 2 30 3 60 6 60 10 20 30'), /Duplicate/);
  assert.throws(() => extractLandslideDesignations(fixture().replace('合計 470 47', '合計 470 48')));
});
test('別日付や特別警戒を外数にした系列を受け入れない', () => {
  assert.throws(() => extractLandslideDesignations(fixture().replace('2026/6/30時点', '2026/3/31時点')));
  assert.throws(() => extractLandslideDesignations(fixture().replace('北海道 10 1 20 2 30 3 60 6', '北海道 10 11 20 2 30 3 60 16')), /subset/);
});
