import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { extractDesignations, verifySourceBytes } from '../ingest-perinatal-heritage.mjs';

const require = createRequire(import.meta.url);
const prefectures = require('../../../../packages/area/src/data/prefectures.json');

test('API envelope dates can change while observations and metadata stay pinned', () => {
  const data = { GET_STATS_DATA: { RESULT: { STATUS: 0, DATE: 'first request' }, STATISTICAL_DATA: { CLASS_INF: { unit: '施設' }, DATA_INF: { VALUE: [{ $: '12' }] } } } };
  const spec = { filename: 'source.json', contentSha256: createHash('sha256').update(JSON.stringify(data.GET_STATS_DATA.STATISTICAL_DATA)).digest('hex') };
  data.GET_STATS_DATA.RESULT.DATE = 'later request';
  verifySourceBytes(spec, Buffer.from(JSON.stringify(data)));
  for (const mutate of [
    (copy) => { copy.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE[0].$ = '13'; },
    (copy) => { copy.GET_STATS_DATA.STATISTICAL_DATA.CLASS_INF.unit = '人'; },
    (copy) => { copy.GET_STATS_DATA.RESULT.STATUS = 100; },
  ]) {
    const copy = structuredClone(data); mutate(copy);
    assert.throws(() => verifySourceBytes(spec, Buffer.from(JSON.stringify(copy))));
  }
});

function designationFixture() {
  const rows = prefectures.map((pref, index) => {
    const amount = Math.floor(22545 / 47) + Number(index < 22545 % 47);
    // Building structures are a subcount and must not be added to designated properties.
    const counts = [amount, 12, ...Array(13).fill(0), amount];
    const cells = [index + 1, pref.prefName, ...counts].map((value) => `<td>${value}</td>`).join('');
    return `${index === 0 ? '' : '<tr>'}${cells}</tr>`;
  });
  return `令和7年5月1日 都道府県別指定等文化財件数<table>${rows.join('')}<tr><td>合計</td><td>22545</td></tr></table>`;
}
test('the published missing Hokkaido opening row does not drop its observations', () => {
  const html = designationFixture();
  const result = extractDesignations(html, '令和7 22,545');
  assert.equal(result.rows.length, 47);
  assert.equal(result.rows[0].areaName, '北海道');
  assert.equal(result.checks.categorySubtotals, 47);
  assert.throws(() => extractDesignations(html.replace('<td>北海道</td>', '<td>青森県</td>'), '令和7 22,545'));
  assert.throws(() => extractDesignations(html.replace('<td>12</td>', '<td>欠測</td>'), '令和7 22,545'));
});
