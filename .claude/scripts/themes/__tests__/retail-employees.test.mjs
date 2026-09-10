import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import {
  buildRetailPayload,
  NATIONAL,
  parseRetailEmployees,
  verifyRetailSourceBytes,
} from '../ingest-retail-employees.mjs';

const require = createRequire(import.meta.url);
const prefectures = require('../../../../packages/area/src/data/prefectures.json');
const {
  retailEmployees,
} = require('../../../../packages/data-configs/src/metrics/retail-employees.ts');
const time = '2021100000';
function fixture() {
  const areas = [{ prefCode: '00000', prefName: '全国' }, ...prefectures];
  const values = areas.map((p, index) => ({
    '@tab': '00001',
    '@cat01': 'C350302',
    '@area': p.prefCode,
    '@time': time,
    '@unit': '人',
    $: String(index === 0 ? NATIONAL : index === 47 ? NATIONAL - 46000 : 1000),
  }));
  return {
    GET_STATS_DATA: {
      RESULT: { STATUS: 0 },
      STATISTICAL_DATA: {
        TABLE_INF: {
          '@id': '0000010103',
          STAT_NAME: { '@code': '00200502' },
          CYCLE: '年度次',
        },
        CLASS_INF: {
          CLASS_OBJ: [
            { '@id': 'tab', CLASS: { '@code': '00001' } },
            {
              '@id': 'cat01',
              CLASS: {
                '@code': 'C350302',
                '@name': 'C350302_小売業従業者数',
                '@unit': '人',
              },
            },
            {
              '@id': 'area',
              CLASS: areas.map((p) => ({
                '@code': p.prefCode,
                '@name': p.prefName,
              })),
            },
            {
              '@id': 'time',
              CLASS: [
                { '@code': time, '@name': '2021年度' },
                { '@code': '2016100000', '@name': '2016年度' },
              ],
            },
          ],
        },
        RESULT_INF: { TOTAL_NUMBER: 48, FROM_NUMBER: 1, TO_NUMBER: 48 },
        DATA_INF: { VALUE: values },
      },
    },
  };
}
const data = (d) => d.GET_STATS_DATA.STATISTICAL_DATA;
const row = (d, index = 1) => data(d).DATA_INF.VALUE[index];
const axis = (d, id) =>
  data(d).CLASS_INF.CLASS_OBJ.find((a) => a['@id'] === id);
const resizePage = (d) => {
  const count = data(d).DATA_INF.VALUE.length;
  data(d).RESULT_INF = {
    TOTAL_NUMBER: count,
    FROM_NUMBER: 1,
    TO_NUMBER: count,
  };
};

test('47 prefectures retain raw counts, fiscal year and canonical recipe', () => {
  const source = parseRetailEmployees(fixture());
  const payload = buildRetailPayload(
    source,
    retailEmployees,
    '2026-09-11T00:00:00.000Z'
  );
  assert.equal(payload.rows.length, 47);
  assert.equal(new Set(payload.rows.map((r) => r.areaCode)).size, 47);
  assert.equal(
    payload.rows.reduce((sum, r) => sum + r.value, 0),
    NATIONAL
  );
  assert.ok(
    payload.rows.every(
      (r) =>
        r.yearCode === '2021' && r.yearName === '2021年度' && r.unit === '人'
    )
  );
  assert.deepEqual(
    payload.rows.map(({ areaCode, areaName, value }) => ({
      areaCode,
      areaName,
      value,
    })),
    source.rows
  );
  assert.equal(payload.meta.recipe.estatParams.cdCat01, 'C350302');
});

test('historical missing data cannot be imputed into the adopted 2021 series', () => {
  const d = fixture();
  data(d).DATA_INF.VALUE.push({ ...row(d), '@time': '2016100000', $: 'X' });
  resizePage(d);
  const result = parseRetailEmployees(d);
  assert.equal(result.rows.length, 47);
  assert.equal(result.excludedHistoricalRows, 1);
  assert.equal(result.national, NATIONAL);
});

const badSources = [
  [
    'combined commercial C3503 metadata',
    (d) => {
      axis(d, 'cat01').CLASS['@code'] = 'C3503';
    },
    /retail-only cohort/,
  ],
  [
    'combined commercial C3503 row contamination',
    (d) => {
      row(d)['@cat01'] = 'C3503';
    },
    /retail-only row/,
  ],
  [
    'wrong table',
    (d) => {
      data(d).TABLE_INF['@id'] = '0000010102';
    },
    /source table/,
  ],
  [
    'wrong source unit',
    (d) => {
      axis(d, 'cat01').CLASS['@unit'] = '千人';
    },
    /retail-only cohort and unit/,
  ],
  [
    'wrong row unit',
    (d) => {
      row(d)['@unit'] = '千人';
    },
    /persons unit/,
  ],
  [
    'year substitution',
    (d) => {
      row(d)['@time'] = '2016100000';
    },
    /47 prefectures plus national/,
  ],
  [
    'calendar label substituted for fiscal year',
    (d) => {
      axis(d, 'time').CLASS[0]['@name'] = '2021年';
    },
    /selected year definition/,
  ],
  [
    'missing prefecture',
    (d) => {
      data(d).DATA_INF.VALUE.splice(1, 1);
      resizePage(d);
    },
    /47 prefectures plus national/,
  ],
  [
    'duplicate prefecture replacing another',
    (d) => {
      data(d).DATA_INF.VALUE[2] = { ...row(d) };
    },
    /duplicate selected prefecture/,
  ],
  [
    'municipal row mixed in',
    (d) => {
      row(d)['@area'] = '01100';
    },
    /prefecture or national row only/,
  ],
  [
    'prefecture code-name mismatch',
    (d) => {
      axis(d, 'area').CLASS[1]['@name'] = '青森県';
    },
    /prefecture metadata identity/,
  ],
  [
    'uncollected or suppressed adopted value',
    (d) => {
      row(d).$ = 'X';
    },
    /numeric count/,
  ],
  [
    'negative employee count',
    (d) => {
      row(d).$ = '-1';
    },
    /numeric count/,
  ],
  [
    'fractional employee count',
    (d) => {
      row(d).$ = '1.5';
    },
    /numeric count/,
  ],
  [
    'altered official national',
    (d) => {
      row(d, 0).$ = String(NATIONAL + 1);
    },
    /pinned official national/,
  ],
  [
    'prefecture does not conserve national',
    (d) => {
      row(d).$ = '1001';
    },
    /47 prefectures conserve official national/,
  ],
  [
    'partial API page',
    (d) => {
      data(d).RESULT_INF.TOTAL_NUMBER = 49;
    },
    /complete API page/,
  ],
  [
    'extra duplicate source axis',
    (d) => {
      data(d).CLASS_INF.CLASS_OBJ.push(structuredClone(axis(d, 'cat01')));
    },
    /exactly four source axes/,
  ],
];
for (const [name, mutate, expected] of badSources) {
  test(`rejects ${name}`, () => {
    const d = fixture();
    mutate(d);
    assert.throws(() => parseRetailEmployees(d), expected);
  });
}

const badConfigs = [
  [
    'combined C3503 recipe',
    (c) => {
      c.source.cdCat01 = 'C3503';
    },
    /exact retail recipe/,
  ],
  [
    'unit conversion',
    (c) => {
      c.display.conversionFactor = 1000;
    },
    /no value conversion/,
  ],
  [
    'wrong output unit',
    (c) => {
      c.unit = '千人';
    },
    /config unit/,
  ],
  [
    'historical years enabled',
    (c) => {
      c.years.from = 2016;
    },
    /only adopted 2021 year/,
  ],
  [
    'municipality enabled',
    (c) => {
      c.entities.push('municipality');
    },
    /prefecture only/,
  ],
];
for (const [name, mutate, expected] of badConfigs) {
  test(`rejects config ${name}`, () => {
    const c = structuredClone(retailEmployees);
    mutate(c);
    assert.throws(
      () =>
        buildRetailPayload(
          parseRetailEmployees(fixture()),
          c,
          '2026-09-11T00:00:00.000Z'
        ),
      expected
    );
  });
}

test('rejects unpinned original bytes before parsing', () => {
  assert.throws(
    () => verifyRetailSourceBytes(Buffer.from(JSON.stringify(fixture()))),
    /pinned original SHA/
  );
});
