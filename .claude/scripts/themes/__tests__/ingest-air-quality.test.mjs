import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { extractAirQualityTable, verifyAirSource } from '../ingest-air-quality.mjs';

const require = createRequire(import.meta.url);
const prefectures = require('../../../../packages/area/src/data/prefectures.json');

// Synthetic distribution with the independently published national margins.
// Deliberately make total/valid/compliant different so swapped columns cannot pass.
function fixture() {
  const national = [[878, 855, 854], [879, 867, 867], [880, 874, 870]];
  const blocks = national.map(([total, valid, compliant]) => prefectures.map((_, i) => {
    const denominator = Math.floor(valid / 47) + (i < valid % 47 ? 1 : 0);
    const measured = denominator + (i === 0 ? total - valid : 0);
    const attained = denominator - (i === 0 ? valid - compliant : 0);
    return `${measured} ${denominator} ${attained} ${(100 * attained / denominator).toFixed(1)}%`;
  }));
  const rows = prefectures.map((p, i) => `${p.prefName} ${blocks.map((b) => b[i]).join(' ')} 自排局なし`);
  rows.push(`全国 ${national.map(([t, v, c]) => `${t} ${v} ${c} ${(100 * c / v).toFixed(1)}%`).join(' ')} 自排局なし`);
  const header = `参考２ 微小粒子状物質（PM2.5）の都道府県別の環境基準達成状況
一般局 自排局
令和４年度 令和５年度 令和６年度 令和４年度 令和５年度 令和６年度
${Array(6).fill('総測 有効 達成局数 達成率').join(' ')}`;
  return `${header}\n${rows.join('\n')}`;
}

test('keeps station counts distinct and calculates the rate using valid stations', () => {
  const result = extractAirQualityTable(fixture());
  const row = result.rows[0].values[0];
  assert.deepEqual([row.total, row.valid, row.compliant], [42, 19, 18]);
  assert.equal(row.rate, 100 * 18 / 19);
  assert.notEqual(row.rate, 100 * 18 / 42);
  assert.equal(result.checks.rateMatches, 141);
  assert.equal(result.rows.length, 47);
});

test('rejects year and station-scope changes before extracting values', () => {
  assert.throws(() => extractAirQualityTable(fixture().replace('令和４年度', '令和３年度')), /Fiscal year/);
  assert.throws(() => extractAirQualityTable(fixture().replace('一般局 自排局', '自排局 一般局')), /scope/);
  assert.throws(() => extractAirQualityTable(fixture().replace('総測 有効', '総測 不明')), /Valid station/);
});

test('does not treat missing, duplicate or unknown prefectures as zero', () => {
  assert.throws(() => extractAirQualityTable(fixture().replace(/^沖縄県.*\n/m, '')), /47 prefectures/);
  assert.throws(() => extractAirQualityTable(fixture().replace('沖縄県', '鹿児島県')), /47 prefectures/);
  assert.throws(() => extractAirQualityTable(fixture().replace('沖縄県', '不明県')), /Unexpected source row/);
  assert.throws(() => extractAirQualityTable(fixture().replace('北海道 42 19 18', '北海道 42 ― 18')), /station count/);
});

test('rejects an inconsistent rounded rate or numerator greater than denominator', () => {
  assert.throws(() => extractAirQualityTable(fixture().replace('42 19 18 94.7%', '42 19 18 100%')), /Published rate/);
  assert.throws(() => extractAirQualityTable(fixture().replace('42 19 18', '42 19 20')), /numerator\/denominator/);
});

test('rejects changed prefecture totals even when every rate still matches', () => {
  assert.throws(() => extractAirQualityTable(fixture().replace('北海道 42 19 18', '北海道 43 19 18')), /Prefecture sums/);
  assert.throws(() => extractAirQualityTable(fixture().replace('全国 878', '全国 879')), /Official national/);
});

test('rejects unverified PDF bytes before parsing or writing canonical data', () => {
  assert.throws(() => verifyAirSource(Buffer.from('%PDF-1.7 modified')), /Official PDF changed/);
});
