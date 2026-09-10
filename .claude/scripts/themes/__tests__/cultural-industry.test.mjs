import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

import { parseSource, SOURCES } from '../ingest-cultural-industry.mjs';

const require = createRequire(import.meta.url);
const prefectures = require('../../../../packages/area/src/data/prefectures.json');

function fixture() {
  const source = SOURCES.find(s => s.id === '0004005665');
  const rows = [];
  for (const area of ['00000', ...prefectures.map(p => p.prefCode), '01100']) {
    for (const industry of ['41', '80']) for (const tab of source.parameters.cdTab.split(',')) {
      rows.push({ '@area': area, '@cat01': industry, '@cat02': '0', '@tab': tab,
        '@time': '2021000000', '@unit': tab === '102-2021' ? '事業所' : '人',
        $: String(area === '00000' ? 470 : 10) });
    }
  }
  const cls = (id, entries) => ({ '@id': id, CLASS: entries.map(([code, name]) => ({ '@code': code, '@name': name })) });
  return { GET_STATS_DATA: { RESULT: { STATUS: 0 }, STATISTICAL_DATA: {
    TABLE_INF: { '@id': source.id, SURVEY_DATE: 202106 },
    CLASS_INF: { CLASS_OBJ: [cls('area', prefectures.map(p => [p.prefCode, p.prefName])),
      cls('cat01', [['41', '映像・音声・文字情報制作業'], ['80', '娯楽業']]), cls('cat02', [['0', '総数']])] },
    RESULT_INF: { TOTAL_NUMBER: rows.length }, DATA_INF: { VALUE: rows },
  } } };
}

test('prefecture sums exclude reprinted cities, and do not count them twice', () => {
  const result = parseSource(fixture(), SOURCES[0]);
  assert.equal(result.checks.prefectures, 47);
  assert.equal(result.checks.excludedCityRows, 8);
  assert.ok(result.checks.nationalDifferences.every(row => row.difference === 0));
  assert.equal(result.get('01000', '41', '102-2021'), 10);
});

test('suppression, duplicated rows, missing responses and changed periods fail closed', () => {
  for (const mutate of [
    data => { data.DATA_INF.VALUE[0].$ = 'X'; },
    data => { data.DATA_INF.VALUE.push({ ...data.DATA_INF.VALUE[0] }); data.RESULT_INF.TOTAL_NUMBER++; },
    data => { data.DATA_INF.VALUE.pop(); },
    data => { data.DATA_INF.VALUE[0]['@time'] = '2020000000'; },
    data => { data.DATA_INF.VALUE[0]['@unit'] = '企業等'; },
    data => { data.CLASS_INF.CLASS_OBJ[0].CLASS[0]['@name'] = '青森県'; },
  ]) {
    const raw = fixture(); mutate(raw.GET_STATS_DATA.STATISTICAL_DATA);
    assert.throws(() => parseSource(raw, SOURCES[0]));
  }
});
