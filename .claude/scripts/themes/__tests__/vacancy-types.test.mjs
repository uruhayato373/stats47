import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { FIELDS, parseVacancy } from '../ingest-vacancy-types.mjs';
const require = createRequire(import.meta.url);
const prefs = require('../../../../packages/area/src/data/prefectures.json');
function fixture() {
  const areas = [{ prefCode: '00000', prefName: '全国' }, ...prefs];
  const axis = (id, values) => ({ '@id': id, CLASS: values });
  const cls = (code, name, rest = {}) => ({
    '@code': code,
    '@name': name,
    ...rest,
  });
  const data = {
    RESULT_INF: { TOTAL_NUMBER: 240, FROM_NUMBER: 1, TO_NUMBER: 240 },
    TABLE_INF: {
      '@id': '0004021660',
      STAT_NAME: { '@code': '00200522' },
      SURVEY_DATE: 202310,
      TITLE: { '@no': '34-1' },
      STATISTICS_NAME: '住宅及び世帯に関する基本集計',
    },
    CLASS_INF: {
      CLASS_OBJ: [
        axis('tab', cls('03-2023', '空き家数', { '@unit': '戸' })),
        ...['cat01', 'cat02', 'cat03'].map((id) => axis(id, cls('0', '総数'))),
        axis('cat04', [
          cls('0', '総数'),
          ...FIELDS.map((f) => cls(f.code, f.title)),
        ]),
        axis(
          'area',
          areas.map((p) =>
            cls(p.prefCode, p.prefName, {
              '@level': p.prefCode === '00000' ? '1' : '2',
            })
          )
        ),
        axis('time', cls('2023000000', '2023年')),
      ],
    },
    DATA_INF: {
      VALUE: areas.flatMap((p, i) =>
        Array.from({ length: 5 }, (_, cat) => ({
          '@tab': '03-2023',
          '@cat01': '0',
          '@cat02': '0',
          '@cat03': '0',
          '@cat04': String(cat),
          '@area': p.prefCode,
          '@time': '2023000000',
          '@unit': '戸',
          $: String((cat === 0 ? 400 : 100) * (i === 0 ? 47 : 1)),
        }))
      ),
    },
  };
  return {
    GET_STATS_DATA: {
      RESULT: { STATUS: 0 },
      PARAMETER: { STATS_DATA_ID: '0004021660' },
      STATISTICAL_DATA: data,
    },
  };
}
test('keeps legitimate rounding differences without reallocating estimates', () => {
  const f = fixture();
  f.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE[5].$ = '600';
  const r = parseVacancy(f);
  assert.equal(r.rows.length, 47);
  assert.equal(r.rows[0].values[0], 600);
  assert.deepEqual(r.rows[0].values.slice(1), [100, 100, 100, 100]);
  assert.equal(r.checks.differences[1].difference, -200);
  assert.equal(r.checks.nationalDifferences[0], 200);
});
for (const [label, mutate] of [
  ['pagination', (d) => (d.RESULT_INF.NEXT_KEY = 241)],
  ['missing cell', (d) => d.DATA_INF.VALUE.pop()],
  ['duplicate cell', (d) => (d.DATA_INF.VALUE[239] = d.DATA_INF.VALUE[238])],
  ['wrong year', (d) => (d.DATA_INF.VALUE[0]['@time'] = '2018000000')],
  ['city contamination', (d) => (d.DATA_INF.VALUE[0]['@area'] = '01100')],
  [
    'wrong type label',
    (d) => (d.CLASS_INF.CLASS_OBJ[4].CLASS[1]['@name'] = '特定空家'),
  ],
  ['wrong unit', (d) => (d.DATA_INF.VALUE[0]['@unit'] = '千戸')],
  ['suppressed value', (d) => (d.DATA_INF.VALUE[0].$ = '-')],
  ['wrong subgroup', (d) => (d.DATA_INF.VALUE[0]['@cat01'] = '1')],
  ['nested second-home bin', (d) => (d.DATA_INF.VALUE[0]['@cat04'] = '401')],
  ['nonrounded estimate', (d) => (d.DATA_INF.VALUE[0].$ = '18801')],
  [
    'excess within-prefecture discrepancy',
    (d) => (d.DATA_INF.VALUE[5].$ = '700'),
  ],
  [
    'excess national discrepancy',
    (d) => {
      for (let i = 5; i < 240; i += 5) {
        d.DATA_INF.VALUE[i].$ = '500';
        d.DATA_INF.VALUE[i + 1].$ = '200';
      }
    },
  ],
])
  test(`rejects ${label}`, () => {
    const f = fixture();
    mutate(f.GET_STATS_DATA.STATISTICAL_DATA);
    assert.throws(() => parseVacancy(f));
  });
