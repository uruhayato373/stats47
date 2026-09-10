import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { extractTsunamiPrefectures, verifyTsunamiMunicipalities, NON_APPLICABLE } from '../ingest-tsunami-evacuation.mjs';

const require = createRequire(import.meta.url);
const prefectures = require('../../../../packages/area/src/data/prefectures.json');
function fixture() {
  const lines = ['都道府県別（令和5年4月時点）', '都道府県 津波避難ビル（棟） 津波避難タワー等（棟）'];
  for (const [i, p] of prefectures.entries()) {
    const values = NON_APPLICABLE.includes(p.prefCode) ? '対象外 対象外' : p.prefCode === '21000' ? '0 0' : '10 2';
    lines.push(`${i + 1} ${p.prefName} ${values}`);
  }
  lines.push('計 390 78');
  return lines.join('\n');
}

test('対象外はnull、公表0は0として47県を保持する', () => {
  const { rows, national } = extractTsunamiPrefectures(fixture(), 2023);
  assert.equal(rows.length, 47);
  assert.deepEqual(national, [390, 78]);
  assert.deepEqual(rows.filter((r) => r.values[0] === null).map((r) => r.areaCode), NON_APPLICABLE);
  assert.deepEqual(rows.find((r) => r.areaCode === '21000').values, [0, 0]);
  assert.equal(rows[0].yearCode, '2023');
  assert.equal(rows[0].yearName, '2023年4月1日現在');
});

test('内陸県を一律0や一律対象外にせず、原表の集合と厳密照合する', () => {
  assert.throws(() => extractTsunamiPrefectures(fixture().replace('9 栃木県 対象外 対象外', '9 栃木県 0 0'), 2023), /Non-applicable/);
  assert.throws(() => extractTsunamiPrefectures(fixture().replace('21 岐阜県 0 0', '21 岐阜県 対象外 対象外'), 2023), /Non-applicable/);
});

test('年度・単位・県順・欠測・全国計の不整合を停止する', () => {
  assert.throws(() => extractTsunamiPrefectures(fixture(), 2021), /observation date/);
  assert.throws(() => extractTsunamiPrefectures(fixture().replace('ビル（棟）', 'ビル（千棟）'), 2023), /unit/);
  assert.throws(() => extractTsunamiPrefectures(fixture().replace('2 青森県', '2 北海道'), 2023), /attribution/);
  assert.throws(() => extractTsunamiPrefectures(fixture().replace('1 北海道 10 2', '1 北海道 10'), 2023), /Missing/);
  assert.throws(() => extractTsunamiPrefectures(fixture().replace('1 北海道 10 2', '1 北海道 - 2'), 2023), /non-integer/);
  assert.throws(() => extractTsunamiPrefectures(fixture().replace('計 390 78', '計 391 78'), 2023), /national totals/);
});

function municipalities(rows) {
  const lines = ['市区町村別（令和5年4月時点）'];
  let count = 0;
  for (const r of rows.filter((r) => r.values[0] !== null)) {
    lines.push(`${r.areaName} 確認市 ${r.values.join(' ')}`);
    count++;
  }
  for (let i = count; i < 678; i++) lines.push(`北海道 追加${i}町 0 0`);
  for (let i = 678; i < 1456; i++) lines.push(`北海道 対象外${i}町 - -`);
  return lines.join('\n');
}

test('市区町村表との合算を県別に照合し、重複や片側欠測を停止する', () => {
  const { rows } = extractTsunamiPrefectures(fixture(), 2023);
  const text = municipalities(rows);
  assert.deepEqual(verifyTsunamiMunicipalities(text, rows, 2023, 678), { applicable: 678, nonApplicable: 778, listed: 1456, prefectureMatches: 47 });
  assert.throws(() => verifyTsunamiMunicipalities(text.replace('北海道 確認市 10 2', '北海道 確認市 11 2'), rows, 2023, 678), /sum differs/);
  assert.throws(() => verifyTsunamiMunicipalities(text + '\n北海道 確認市 10 2', rows, 2023, 678), /Duplicate/);
  assert.throws(() => verifyTsunamiMunicipalities(text.replace('北海道 確認市 10 2', '北海道 確認市 - 2'), rows, 2023, 678), /Partial/);
});
