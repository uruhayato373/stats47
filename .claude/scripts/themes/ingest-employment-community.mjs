#!/usr/bin/env node
/** Pinned official e-Stat sources -> six canonical metrics. Run from repository root. No remote writes. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
const root = process.cwd(),
  requireRepo = createRequire(resolve(root, 'package.json'));
const prefs = requireRepo('./packages/area/src/data/prefectures.json');
const { extractYearCode } = requireRepo(
  './packages/estat-api/src/stats-data/utils/extract-year-code.ts'
);
const AREAS = ['00000', ...prefs.map((p) => p.prefCode)];
const names = {
  ...Object.fromEntries(prefs.map((p) => [p.prefCode, p.prefName])),
  '00000': '全国',
};
const sum = (values) => values.reduce((a, b) => a + b, 0);
export const sha = (body) => createHash('sha256').update(body).digest('hex');
export const SOURCES = [
  {
    id: 'nonregular-intentions',
    filename: 'nonregular-intentions.json',
    tableId: '0004008518',
    parameters: {
      statsDataId: '0004008518',
      cdTab: '001-2022',
      cdCat01: '0',
      cdCat02: '00',
      cdCat03: '0,1,2,3,4',
      cdCat04: '222',
      limit: '100000',
    },
    url: 'https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?lang=J&statsDataId=0004008518&cdTab=001-2022&cdCat01=0&cdCat02=00&cdCat03=0%2C1%2C2%2C3%2C4&cdCat04=222&limit=100000',
    rawSha256:
      'e6488df1a52f42254e877cc1457b82261e6a30c2dea1338090515d04bcc837e6',
    statisticalDataSha256:
      '83b9dab1b53041099adaa1597ca7833ed6a341d4f95d25780e43b737ef1effd3',
    capturedAt: '2026-09-10T13:24:57.002Z',
    rowCount: 670,
    dimensionCounts: {
      tab: 1,
      cat01: 1,
      cat02: 1,
      cat03: 5,
      cat04: 1,
      area: 134,
      time: 1,
    },
    labels: {
      cat01: {
        0: '総数',
      },
      cat02: {
        '00': '総数',
      },
      cat03: {
        0: '総数',
        1: '継続就業希望者',
        2: '追加就業希望者',
        3: '転職希望者',
        4: '就業休止希望者',
      },
      cat04: {
        222: '非正規の職員・従業員',
      },
    },
  },
  {
    id: 'weekly-hours',
    filename: 'weekly-hours.json',
    tableId: '0004008493',
    parameters: {
      statsDataId: '0004008493',
      cdTab: '001-2022',
      cdCat01: '0',
      cdCat03: '0',
      cdCat04: '22',
      limit: '100000',
    },
    url: 'https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?lang=J&statsDataId=0004008493&cdTab=001-2022&cdCat01=0&cdCat03=0&cdCat04=22&limit=100000',
    rawSha256:
      'c92b8565efed320b72d5025427b25ee68e502c8d93b730830c70126fa215925f',
    statisticalDataSha256:
      '5f08a23ec6284261eec40d48c4ea4ec7f1e8d72e9f96bbaf9654a319ca4663d2',
    capturedAt: '2026-09-10T13:25:01.751Z',
    rowCount: 15544,
    dimensionCounts: {
      tab: 1,
      cat01: 1,
      cat02: 116,
      cat03: 1,
      cat04: 1,
      area: 134,
      time: 1,
    },
    labels: {
      cat01: {
        0: '総数',
      },
      cat02: {
        2: '200～249日',
        3: '250～299日',
        4: '300日以上',
        201: '15時間未満（200～249日）',
        202: '15～19時間（200～249日）',
        203: '20～24時間（200～249日）',
        204: '25～29時間（200～249日）',
        205: '30～34時間（200～249日）',
        206: '35～39時間（200～249日）',
        207: '40～44時間（200～249日）',
        208: '45～49時間（200～249日）',
        209: '50～54時間（200～249日）',
        210: '55～59時間（200～249日）',
        211: '60～64時間（200～249日）',
        212: '65～69時間（200～249日）',
        213: '70～74時間（200～249日）',
        214: '75時間以上（200～249日）',
        301: '15時間未満（250～299日）',
        302: '15～19時間（250～299日）',
        303: '20～24時間（250～299日）',
        304: '25～29時間（250～299日）',
        305: '30～34時間（250～299日）',
        306: '35～39時間（250～299日）',
        307: '40～44時間（250～299日）',
        308: '45～49時間（250～299日）',
        309: '50～54時間（250～299日）',
        310: '55～59時間（250～299日）',
        311: '60～64時間（250～299日）',
        312: '65～69時間（250～299日）',
        313: '70～74時間（250～299日）',
        314: '75時間以上（250～299日）',
        401: '15時間未満（300日以上）',
        402: '15～19時間（300日以上）',
        403: '20～24時間（300日以上）',
        404: '25～29時間（300日以上）',
        405: '30～34時間（300日以上）',
        406: '35～39時間（300日以上）',
        407: '40～44時間（300日以上）',
        408: '45～49時間（300日以上）',
        409: '50～54時間（300日以上）',
        410: '55～59時間（300日以上）',
        411: '60～64時間（300日以上）',
        412: '65～69時間（300日以上）',
        413: '70～74時間（300日以上）',
        414: '75時間以上（300日以上）',
      },
      cat03: {
        0: '総数',
      },
      cat04: {
        22: '会社などの役員を除く雇用者',
      },
    },
  },
  {
    id: 'community-rates',
    filename: 'community-rates.json',
    tableId: '0003455937',
    parameters: {
      statsDataId: '0003455937',
      cdTab: '202110A09B08',
      cdCat01: '0',
      cdCat02: '99000',
      cdCat03: '0',
      cdCat04: '00,06',
      limit: '10000',
    },
    url: 'https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?lang=J&statsDataId=0003455937&cdTab=202110A09B08&cdCat01=0&cdCat02=99000&cdCat03=0&cdCat04=00%2C06&limit=10000',
    rawSha256:
      '5f4d706269ad2054afff30e8e1684d2967043bc0342ea593e8baf5ff95607029',
    statisticalDataSha256:
      '9e7e9b752b68256146e8cb33ed908622b6f4b1cc0afa2eaab1d642bac037341d',
    capturedAt: '2026-09-10T13:28:30.073Z',
    rowCount: 96,
    dimensionCounts: {
      tab: 1,
      cat01: 1,
      cat02: 1,
      cat03: 1,
      cat04: 2,
      area: 48,
      time: 1,
    },
    labels: {
      cat01: {
        0: '0_総数',
      },
      cat02: {
        99000: '総数',
      },
      cat03: {
        0: '0_総数',
      },
      cat04: {
        '00': '00_総数',
        '06': '06_まちづくりのための活動',
      },
    },
  },
  {
    id: 'community-population',
    filename: 'community-population.json',
    tableId: '0003455936',
    parameters: {
      statsDataId: '0003455936',
      cdCat01: '0',
      cdCat02: '99000',
      cdCat03: '0',
      limit: '10000',
    },
    url: 'https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?lang=J&statsDataId=0003455936&cdCat01=0&cdCat02=99000&cdCat03=0&limit=10000',
    rawSha256:
      'b3aba69e44d54f503a53d17c5e7565b74b075b66f437a021582c2fbebcc918d8',
    statisticalDataSha256:
      '37ce0e5844711d00eca8565d0a6c6176de81513bd3b82f9013a428ded90377ad',
    capturedAt: '2026-09-10T13:28:38.036Z',
    rowCount: 96,
    dimensionCounts: {
      tab: 2,
      cat01: 1,
      cat02: 1,
      cat03: 1,
      area: 48,
      time: 1,
    },
    labels: {
      cat01: {
        0: '0_総数',
      },
      cat02: {
        99000: '総数',
      },
      cat03: {
        0: '0_総数',
      },
    },
  },
  {
    id: 'community-counts',
    filename: 'community-counts.json',
    tableId: '0003455935',
    parameters: {
      statsDataId: '0003455935',
      cdTab: '202112A11',
      cdCat01: '0',
      cdCat02: '99000',
      cdCat03: '0',
      cdCat04: '00,06',
      limit: '10000',
    },
    url: 'https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?lang=J&statsDataId=0003455935&cdTab=202112A11&cdCat01=0&cdCat02=99000&cdCat03=0&cdCat04=00%2C06&limit=10000',
    rawSha256:
      'bbe8e9398223fd0a9b50cc10055779947266f86b93ac5aea2a31573b4dab2a0d',
    statisticalDataSha256:
      '0c8a18e188aa233f2461e915919ae2fe1868cd1d41b5d396717ef81c1f8aca2f',
    capturedAt: '2026-09-10T13:29:56.296Z',
    rowCount: 96,
    dimensionCounts: {
      tab: 1,
      cat01: 1,
      cat02: 1,
      cat03: 1,
      cat04: 2,
      area: 48,
      time: 1,
    },
    labels: {
      cat01: {
        0: '0_総数',
      },
      cat02: {
        99000: '総数',
      },
      cat03: {
        0: '0_総数',
      },
      cat04: {
        '00': '00_総数',
        '06': '06_まちづくりのための活動',
      },
    },
  },
];
export const FILE_SOURCES = [
  {
    filename: 'employment-definitions.pdf',
    url: 'https://www.stat.go.jp/data/shugyou/2022/pdf/yougo.pdf',
    sha256: '79f74803f540115fe73e9a8008aab38803a48debb9c4dd34479635d6b9ed3982',
    bytes: 433883,
    fetchedAt: '2026-09-10T13:28:39.332Z',
  },
  {
    filename: 'employment-ratio-definitions.pdf',
    url: 'https://www.stat.go.jp/data/shugyou/2022/pdf/hiritsu.pdf',
    sha256: 'cb1e454a49457cf7522c97f49c666d6be05bb513711c1276760f5e6a8e607294',
    bytes: 204271,
    fetchedAt: '2026-09-10T13:28:39.531Z',
  },
  {
    filename: 'community-definitions.pdf',
    url: 'https://www.stat.go.jp/data/shakai/2021/pdf/kaisetsua.pdf',
    sha256: '77f097f568e1c83ad48a5b6a35e1abc04758369d3bc42e3658e51295ed2b7703',
    bytes: 716762,
    fetchedAt: '2026-09-10T13:28:39.794Z',
  },
];
export const FIELDS = [
  {
    key: 'nonregular-employees-count',
    exportName: 'nonregularEmployeesCount',
    family: 'intent',
    valueField: 'total',
    unit: '人',
    year: 2022,
    yearName: '2022年10月1日現在',
  },
  {
    key: 'nonregular-continuation-wish-rate',
    exportName: 'nonregularContinuationWishRate',
    family: 'intent',
    valueField: 'continuationRate',
    unit: '％',
    year: 2022,
    yearName: '2022年10月1日現在',
  },
  {
    key: 'nonregular-job-change-wish-rate',
    exportName: 'nonregularJobChangeWishRate',
    family: 'intent',
    valueField: 'jobChangeRate',
    unit: '％',
    year: 2022,
    yearName: '2022年10月1日現在',
  },
  {
    key: 'employees-weekly-hours-60plus-count',
    exportName: 'employeesWeeklyHours60plusCount',
    family: 'hours',
    valueField: 'longHours',
    unit: '人',
    year: 2022,
    yearName: '2022年10月1日現在',
  },
  {
    key: 'employees-weekly-hours-60plus-rate',
    exportName: 'employeesWeeklyHours60plusRate',
    family: 'hours',
    valueField: 'longHoursRate',
    unit: '％',
    year: 2022,
    yearName: '2022年10月1日現在',
  },
  {
    key: 'community-building-volunteer-participation-rate-10plus',
    exportName: 'communityBuildingVolunteerParticipationRate10plus',
    family: 'community',
    valueField: 'rate',
    unit: '％',
    year: 2021,
    yearName: '2021年調査（過去1年間）',
  },
];
export const EXPECTED_CONFIGS = [
  {
    key: 'nonregular-employees-count',
    unit: '人',
    source: {
      kind: 'estat',
      statsDataId: '0004008518',
      cdTab: '001-2022',
      cdCat01: '0',
      cdCat02: '00',
      cdCat04: '222',
      displayName: '就業構造基本調査',
      url: 'https://www.e-stat.go.jp/dbview?sid=0004008518',
      cdCat03: '0',
    },
    entities: ['prefecture'],
    years: {
      from: 2022,
      to: 2022,
    },
    yearFormat: 'calendar',
    display: {
      conversionFactor: 1,
      decimalPlaces: 0,
    },
    isActive: true,
  },
  {
    key: 'nonregular-continuation-wish-rate',
    unit: '％',
    source: {
      kind: 'estat',
      statsDataId: '0004008518',
      cdTab: '001-2022',
      cdCat01: '0',
      cdCat02: '00',
      cdCat04: '222',
      displayName: '就業構造基本調査',
      url: 'https://www.e-stat.go.jp/dbview?sid=0004008518',
      axisRatio: {
        axis: 'cat03',
        numeratorCodes: ['1'],
        denominatorCodes: ['0'],
      },
    },
    entities: ['prefecture'],
    years: {
      from: 2022,
      to: 2022,
    },
    yearFormat: 'calendar',
    display: {
      conversionFactor: 1,
      decimalPlaces: 1,
    },
    isActive: true,
  },
  {
    key: 'nonregular-job-change-wish-rate',
    unit: '％',
    source: {
      kind: 'estat',
      statsDataId: '0004008518',
      cdTab: '001-2022',
      cdCat01: '0',
      cdCat02: '00',
      cdCat04: '222',
      displayName: '就業構造基本調査',
      url: 'https://www.e-stat.go.jp/dbview?sid=0004008518',
      axisRatio: {
        axis: 'cat03',
        numeratorCodes: ['3'],
        denominatorCodes: ['0'],
      },
    },
    entities: ['prefecture'],
    years: {
      from: 2022,
      to: 2022,
    },
    yearFormat: 'calendar',
    display: {
      conversionFactor: 1,
      decimalPlaces: 1,
    },
    isActive: true,
  },
  {
    key: 'employees-weekly-hours-60plus-count',
    unit: '人',
    source: {
      kind: 'estat',
      statsDataId: '0004008493',
      cdTab: '001-2022',
      cdCat01: '0',
      cdCat03: '0',
      cdCat04: '22',
      displayName: '就業構造基本調査',
      url: 'https://www.e-stat.go.jp/dbview?sid=0004008493',
      axisSum: {
        axis: 'cat02',
        codes: [
          '211',
          '212',
          '213',
          '214',
          '311',
          '312',
          '313',
          '314',
          '411',
          '412',
          '413',
          '414',
        ],
      },
    },
    entities: ['prefecture'],
    years: {
      from: 2022,
      to: 2022,
    },
    yearFormat: 'calendar',
    display: {
      conversionFactor: 1,
      decimalPlaces: 0,
    },
    isActive: true,
  },
  {
    key: 'employees-weekly-hours-60plus-rate',
    unit: '％',
    source: {
      kind: 'estat',
      statsDataId: '0004008493',
      cdTab: '001-2022',
      cdCat01: '0',
      cdCat03: '0',
      cdCat04: '22',
      displayName: '就業構造基本調査',
      url: 'https://www.e-stat.go.jp/dbview?sid=0004008493',
      axisRatio: {
        axis: 'cat02',
        numeratorCodes: [
          '211',
          '212',
          '213',
          '214',
          '311',
          '312',
          '313',
          '314',
          '411',
          '412',
          '413',
          '414',
        ],
        denominatorCodes: ['2', '3', '4'],
      },
    },
    entities: ['prefecture'],
    years: {
      from: 2022,
      to: 2022,
    },
    yearFormat: 'calendar',
    display: {
      conversionFactor: 1,
      decimalPlaces: 1,
    },
    isActive: true,
  },
  {
    key: 'community-building-volunteer-participation-rate-10plus',
    unit: '％',
    source: {
      kind: 'estat',
      statsDataId: '0003455937',
      cdTab: '202110A09B08',
      cdCat01: '0',
      cdCat02: '99000',
      cdCat03: '0',
      cdCat04: '06',
      displayName: '社会生活基本調査',
      url: 'https://www.e-stat.go.jp/dbview?sid=0003455937',
    },
    entities: ['prefecture'],
    years: {
      from: 2021,
      to: 2021,
    },
    yearFormat: 'calendar',
    display: {
      conversionFactor: 1,
      decimalPlaces: 1,
    },
    isActive: true,
  },
];

export function validateApiSource(parsed, source) {
  assert.equal(parsed.GET_STATS_DATA?.RESULT?.STATUS, 0, 'API success');
  assert.equal(
    sha(JSON.stringify(parsed.GET_STATS_DATA.STATISTICAL_DATA)),
    source.statisticalDataSha256,
    'statistical source SHA ' + source.id
  );
}

export function decodeDataset(parsed, source) {
  const envelope = parsed.GET_STATS_DATA;
  assert.equal(envelope?.RESULT?.STATUS, 0, 'API status');
  const data = envelope.STATISTICAL_DATA;
  assert.equal(data.TABLE_INF?.['@id'], source.tableId, 'table identity');
  const axes = data.CLASS_INF.CLASS_OBJ;
  assert.ok(Array.isArray(axes));
  const classes = {};
  for (const axis of axes) {
    const id = axis['@id'];
    assert.ok(!classes[id], 'duplicate metadata axis');
    const list = Array.isArray(axis.CLASS) ? axis.CLASS : [axis.CLASS];
    assert.equal(
      list.length,
      source.dimensionCounts[id],
      'axis cardinality ' + id
    );
    assert.equal(
      new Set(list.map((c) => c['@code'])).size,
      list.length,
      'duplicate metadata class'
    );
    classes[id] = new Map(list.map((c) => [c['@code'], c]));
  }
  assert.deepEqual(
    Object.keys(classes).sort(),
    Object.keys(source.dimensionCounts).sort(),
    'exact dimensions'
  );
  for (const [id, pins] of Object.entries(source.labels))
    for (const [code, label] of Object.entries(pins))
      assert.equal(
        classes[id].get(code)?.['@name'],
        label,
        'classification identity ' + id + '/' + code
      );
  for (const area of AREAS)
    assert.equal(
      classes.area.get(area)?.['@name'],
      names[area],
      'county identity ' + area
    );
  const values = data.DATA_INF.VALUE;
  assert.ok(Array.isArray(values));
  assert.equal(values.length, source.rowCount, 'complete source rows');
  assert.equal(
    data.RESULT_INF.TOTAL_NUMBER,
    values.length,
    'complete API response'
  );
  assert.equal(data.RESULT_INF.FROM_NUMBER, 1);
  assert.equal(data.RESULT_INF.TO_NUMBER, values.length);
  assert.equal(
    values.length,
    Object.values(source.dimensionCounts).reduce((a, b) => a * b, 1),
    'complete rectangular source'
  );
  const ids = axes.map((a) => a['@id']);
  const index = new Map(),
    dashCells = [];
  const year = source.id.startsWith('community') ? '2021' : '2022';
  const isEmployment = year === '2022';
  const note = Array.isArray(data.DATA_INF.NOTE)
    ? data.DATA_INF.NOTE
    : [data.DATA_INF.NOTE];
  if (isEmployment)
    assert.ok(
      note.some(
        (n) => n?.['@char'] === '-' && n.$.startsWith('該当数値のないもの')
      ),
      'documented absent-count symbol'
    );
  for (const row of values) {
    assert.deepEqual(
      Object.keys(row)
        .filter(
          (k) => k.startsWith('@') && !['@unit', '@annotation'].includes(k)
        )
        .sort(),
      ids.map((id) => '@' + id).sort(),
      'no omitted or extra dimensions'
    );
    for (const id of ids)
      assert.ok(
        classes[id].has(row['@' + id]),
        'unknown row classification ' + id
      );
    assert.equal(extractYearCode(row['@time']), year, 'source year');
    const unit = classes.tab.get(row['@tab'])['@unit'];
    assert.equal(row['@unit'], unit, 'source unit');
    const key = ids.map((id) => row['@' + id]).join('|');
    assert.ok(!index.has(key), 'duplicate observation');
    const raw = row.$;
    let value;
    if (
      raw === '-' &&
      isEmployment &&
      row['@tab'] === '001-2022' &&
      unit === '人'
    ) {
      value = 0;
      dashCells.push({
        areaCode: row['@area'],
        categoryCode: row['@cat02'],
        raw,
        reason:
          'official count-table symbol: no applicable value; not an unavailable estimate',
      });
    } else {
      assert.equal(typeof raw, 'string', 'raw numeric string');
      assert.match(
        raw,
        /^\d+(?:\.\d+)?$/,
        'missing/suppressed/non-numeric value'
      );
      value = Number(raw);
      assert.ok(
        Number.isFinite(value) && value >= 0,
        'finite nonnegative value'
      );
    }
    if (isEmployment)
      assert.ok(
        Number.isSafeInteger(value) && value % 100 === 0,
        'observed published count grid 100 persons'
      );
    index.set(key, { value, raw });
  }
  const cell = (area, selectors = {}) => {
    for (const id of Object.keys(selectors))
      assert.ok(ids.includes(id), 'unknown selector axis');
    const key = ids
      .map((id) =>
        id === 'area'
          ? area
          : Object.prototype.hasOwnProperty.call(selectors, id)
            ? selectors[id]
            : classes[id].size === 1
              ? [...classes[id].keys()][0]
              : (() => {
                  throw Error('explicit varying selector required ' + id);
                })()
      )
      .join('|');
    const item = index.get(key);
    assert.ok(item, 'missing selected observation ' + key);
    return item;
  };
  return {
    cell,
    classes,
    dashCells,
    sourceRows: values.length,
    prefectures: 47,
    year,
    discardedGeographies: classes.area.size - AREAS.length,
  };
}

export function reconcileRoundedCounts(rows, keys, quantum) {
  const national = rows.find((r) => r.areaCode === '00000');
  assert.ok(national);
  const counties = rows.filter((r) => r.areaCode !== '00000');
  assert.equal(counties.length, 47);
  const budget = ((47 + 1) * quantum) / 2;
  return keys.map((key) => {
    const countySum = sum(counties.map((r) => r[key])),
      difference = countySum - national[key];
    assert.ok(
      Math.abs(difference) <= budget,
      'county/national rounded count discrepancy ' + key
    );
    return {
      key,
      countySum,
      national: national[key],
      difference,
      budget,
      interpretation:
        'rounding arithmetic check; not survey sampling-error tolerance',
    };
  });
}

export function parseIntentions(dataset) {
  const rows = AREAS.map((areaCode) => {
    const cells = Object.fromEntries(
      ['0', '1', '2', '3', '4'].map((code) => [
        code,
        dataset.cell(areaCode, { cat03: code }).value,
      ])
    );
    const total = cells['0'],
      continuation = cells['1'],
      additional = cells['2'],
      jobChange = cells['3'],
      stop = cells['4'];
    assert.ok(total > 0);
    const residual = total - continuation - additional - jobChange - stop;
    assert.ok(residual >= -250, 'intention partition exceeds rounding budget');
    for (const value of [continuation, additional, jobChange, stop])
      assert.ok(value <= total);
    return {
      areaCode,
      areaName: names[areaCode],
      total,
      continuation,
      additional,
      jobChange,
      stop,
      unclassifiedAndRoundingResidual: residual,
      continuationRate: (continuation / total) * 100,
      jobChangeRate: (jobChange / total) * 100,
    };
  });
  const national = rows[0];
  assert.deepEqual(
    [
      national.total,
      national.continuation,
      national.additional,
      national.jobChange,
      national.stop,
    ],
    [21110300, 15388700, 1772800, 2501700, 1135800],
    'official national intentions'
  );
  return {
    rows,
    national,
    checks: {
      prefectures: 47,
      sourceCells: 48 * 5,
      missing: 0,
      sourceRows: dataset.sourceRows,
      discardedGeographies: dataset.discardedGeographies,
      countyNational: reconcileRoundedCounts(
        rows,
        ['total', 'continuation', 'additional', 'jobChange', 'stop'],
        100
      ),
      residualDefinition:
        'unclassified intention plus published rounding; not exact unknown-person count',
      residualRange: [
        Math.min(...rows.map((r) => r.unclassifiedAndRoundingResidual)),
        Math.max(...rows.map((r) => r.unclassifiedAndRoundingResidual)),
      ],
    },
  };
}

const HOURS_GROUPS = ['2', '3', '4'];
const hourCode = (group, bin) => group + String(bin).padStart(2, '0');
export function parseHours(dataset) {
  const rows = AREAS.map((areaCode) => {
    const groups = HOURS_GROUPS.map((code) => {
      const total = dataset.cell(areaCode, { cat02: code }).value;
      const bins = Array.from({ length: 14 }, (_, i) => ({
        code: hourCode(code, i + 1),
        ...dataset.cell(areaCode, { cat02: hourCode(code, i + 1) }),
      }));
      const known = sum(bins.map((b) => b.value)),
        longHours = sum(bins.slice(10).map((b) => b.value)),
        residual = total - known;
      assert.ok(
        total > 0 && longHours <= known && known <= total + 750,
        'weekly-hour count bounds'
      );
      return {
        code,
        total,
        known,
        longHours,
        unclassifiedAndRoundingResidual: residual,
        bins,
      };
    });
    const denominator = sum(groups.map((g) => g.total)),
      longHours = sum(groups.map((g) => g.longHours)),
      known = sum(groups.map((g) => g.known));
    return {
      areaCode,
      areaName: names[areaCode],
      denominator,
      longHours,
      known,
      unclassifiedAndRoundingResidual: denominator - known,
      longHoursRate: (longHours / denominator) * 100,
      groups,
    };
  });
  const national = rows[0];
  assert.deepEqual(
    [national.denominator, national.longHours, national.known],
    [43903600, 2495500, 43450600],
    'official national annual200+ hour cohort'
  );
  const flattened = rows.map((r) => ({
    areaCode: r.areaCode,
    ...Object.fromEntries(
      r.groups.flatMap((g) => [
        [g.code, g.total],
        ...g.bins.map((b) => [b.code, b.value]),
      ])
    ),
  }));
  return {
    rows,
    national,
    checks: {
      prefectures: 47,
      selectedCountCells: 48 * 45,
      sourceRows: dataset.sourceRows,
      discardedGeographies: dataset.discardedGeographies,
      selectedAbsentCountSymbols: rows.flatMap((r) =>
        r.groups.flatMap((g) =>
          g.bins
            .filter((b) => b.raw === '-')
            .map((b) => ({ areaCode: r.areaCode, code: b.code, raw: b.raw }))
        )
      ),
      countyNational: reconcileRoundedCounts(
        flattened,
        [
          '2',
          '3',
          '4',
          ...HOURS_GROUPS.flatMap((g) =>
            Array.from({ length: 14 }, (_, i) => hourCode(g, i + 1))
          ),
        ],
        100
      ),
      denominator:
        'roles22; annual days200+ totals2+3+4, including unknown weekly hours',
      excluded:
        'annual days<200 (including regular workers), directors, self-employed',
      residualDefinition:
        'unclassified weekly hours plus rounding; no forced equality',
      residualRange: [
        Math.min(...rows.map((r) => r.unclassifiedAndRoundingResidual)),
        Math.max(...rows.map((r) => r.unclassifiedAndRoundingResidual)),
      ],
    },
  };
}

export function parseCommunity(rates, counts, populations) {
  const rows = AREAS.map((areaCode) => {
    const population = populations.cell(areaCode, { tab: '202101A02' }).value,
      sampleSize = populations.cell(areaCode, { tab: '202126A99B99' }).value;
    assert.ok(
      population > 0 &&
        Number.isSafeInteger(population) &&
        Number.isSafeInteger(sampleSize) &&
        sampleSize >= 10,
      'population/sample coverage'
    );
    const observed = {};
    for (const code of ['00', '06']) {
      const count = counts.cell(areaCode, { cat04: code }).value,
        rate = rates.cell(areaCode, { cat04: code }).value;
      assert.ok(
        Number.isSafeInteger(count) &&
          count >= 0 &&
          count <= population &&
          rate >= 0 &&
          rate <= 100
      );
      const minimum =
          (100 * Math.max(0, count - 0.5)) / (population + 0.5) - 0.05,
        maximum = (100 * (count + 0.5)) / (population - 0.5) + 0.05;
      assert.ok(
        rate >= minimum - 1e-10 && rate <= maximum + 1e-10,
        'published rate agrees with separately rounded count and denominator ' +
          areaCode +
          '/' +
          code
      );
      observed[code] = { count, rate, roundingInterval: [minimum, maximum] };
    }
    assert.ok(
      observed['06'].count <= observed['00'].count &&
        observed['06'].rate <= observed['00'].rate,
      'specific activity is subset, not exclusive partition'
    );
    return {
      areaCode,
      areaName: names[areaCode],
      populationThousands: population,
      sampleSize,
      countThousands: observed['06'].count,
      rate: observed['06'].rate,
      allVolunteerCountThousands: observed['00'].count,
      allVolunteerRate: observed['00'].rate,
      roundingChecks: observed,
    };
  });
  const national = rows[0];
  assert.deepEqual(
    [
      national.populationThousands,
      national.sampleSize,
      national.countThousands,
      national.rate,
    ],
    [112462, 171360, 8317, 7.4],
    'official national community activity'
  );
  assert.equal(
    sum(rows.slice(1).map((r) => r.sampleSize)),
    national.sampleSize,
    'sample count conservation'
  );
  return {
    rows,
    national,
    checks: {
      prefectures: 47,
      rateCountPopulationChecks: 96,
      nationalRateAggregation:
        'use published national estimate, not county sum or arithmetic mean',
      sampleConservation: true,
      minimumCountySample: Math.min(...rows.slice(1).map((r) => r.sampleSize)),
      countyNational: reconcileRoundedCounts(
        rows,
        ['populationThousands', 'countThousands', 'allVolunteerCountThousands'],
        1
      ),
      period: ['2020-10-20', '2021-10-19'],
      overlappingCategories: true,
      missing: 0,
    },
  };
}

export function validateConfig(config, expected) {
  assert.ok(config);
  for (const [key, value] of Object.entries(expected))
    assert.deepEqual(config[key], value, 'config contract ' + key);
  assert.equal(config.calculation?.isCalculated ?? false, false);
  assert.deepEqual(
    config.calculation?.normalizationOptions ?? [],
    [],
    'no unrelated normalization'
  );
}

async function acquireApi(source, directory) {
  const file = resolve(directory, source.filename);
  let raw,
    fetchedAt = source.capturedAt,
    downloaded = false;
  try {
    raw = await readFile(file);
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    const appId =
      process.env.NEXT_PUBLIC_ESTAT_APP_ID ?? process.env.ESTAT_APP_ID;
    assert.ok(appId, 'e-Stat credential required');
    const url = new URL(
      'https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData'
    );
    url.search = new URLSearchParams({
      appId,
      lang: 'J',
      ...source.parameters,
    });
    let response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(60000) });
    } catch {
      throw Error('official source GET failed ' + source.id);
    }
    assert.ok(response.ok, 'official source HTTP ' + response.status);
    raw = Buffer.from(await response.arrayBuffer());
    fetchedAt = new Date().toISOString();
    downloaded = true;
  }
  const parsed = JSON.parse(raw);
  validateApiSource(parsed, source);
  if (!downloaded && sha(raw) !== source.rawSha256) {
    fetchedAt = null;
    try {
      const receipt = JSON.parse(await readFile(file + '.source.json', 'utf8'));
      if (receipt.rawSha256 === sha(raw)) fetchedAt = receipt.fetchedAt;
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
  }
  const observed = {
    id: source.id,
    tableId: source.tableId,
    url: source.url,
    parameters: source.parameters,
    rawSha256: sha(raw),
    statisticalDataSha256: source.statisticalDataSha256,
    fetchedAt,
    verifiedAt: new Date().toISOString(),
    bytes: raw.length,
    localPath: file,
  };
  await mkdir(directory, { recursive: true });
  await writeFile(file, raw);
  await writeFile(
    file + '.source.json',
    JSON.stringify(observed, null, 2) + '\n'
  );
  return { parsed, observed };
}
async function acquireDefinition(source, directory) {
  const file = resolve(directory, source.filename);
  let raw,
    fetchedAt = source.fetchedAt;
  try {
    raw = await readFile(file);
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    const r = await fetch(source.url, { signal: AbortSignal.timeout(45000) });
    assert.ok(r.ok, 'definition HTTP ' + r.status);
    raw = Buffer.from(await r.arrayBuffer());
    fetchedAt = new Date().toISOString();
  }
  assert.equal(sha(raw), source.sha256, 'definition SHA ' + source.filename);
  assert.equal(raw.length, source.bytes);
  await mkdir(directory, { recursive: true });
  await writeFile(file, raw);
  return { ...source, fetchedAt, localPath: file };
}
async function main() {
  const { values: o } = parseArgs({
    options: {
      'write-local': { type: 'boolean', default: false },
      'source-dir': {
        type: 'string',
        default: resolve(
          root,
          '.local/verification/themes/employment-community-source'
        ),
      },
      'config-file': { type: 'string' },
      'local-r2-root': { type: 'string', default: resolve(root, '.local/r2') },
      out: {
        type: 'string',
        default: resolve(
          root,
          '.local/verification/themes/employment-community-source.json'
        ),
      },
    },
  });
  const configs = o['config-file']
    ? JSON.parse(await readFile(o['config-file'], 'utf8'))
    : Object.values(
        requireRepo('./packages/data-configs/src/registry.ts').METRICS_REGISTRY
      );
  for (const expected of EXPECTED_CONFIGS) {
    const matches = configs.filter((c) => c.key === expected.key);
    assert.equal(matches.length, 1, 'unique config');
    validateConfig(matches[0], expected);
  }
  const decoded = {},
    sources = [];
  for (const source of SOURCES) {
    const result = await acquireApi(source, o['source-dir']);
    decoded[source.id] = decodeDataset(result.parsed, source);
    sources.push(result.observed);
  }
  const definitions = [];
  for (const s of FILE_SOURCES)
    definitions.push(await acquireDefinition(s, o['source-dir']));
  const results = {
    intent: parseIntentions(decoded['nonregular-intentions']),
    hours: parseHours(decoded['weekly-hours']),
    community: parseCommunity(
      decoded['community-rates'],
      decoded['community-counts'],
      decoded['community-population']
    ),
  };
  const { buildRecipe } = requireRepo('./packages/data-configs/src/recipe.ts'),
    { parseStatsValuesPayload } = requireRepo(
      './packages/stats-r2/src/schemas.ts'
    );
  const generatedAt = new Date().toISOString(),
    files = [];
  for (const field of FIELDS) {
    const config = configs.find((c) => c.key === field.key);
    const selected = results[field.family].rows.filter(
      (r) => r.areaCode !== '00000'
    );
    assert.equal(selected.length, 47);
    const payload = parseStatsValuesPayload({
      metricKey: field.key,
      entityKind: 'prefecture',
      rows: selected.map((r) => ({
        areaCode: r.areaCode,
        areaName: r.areaName,
        yearCode: String(field.year),
        yearName: field.yearName,
        value: r[field.valueField],
        unit: field.unit,
      })),
      meta: {
        generatedAt,
        rowCount: 47,
        areaCount: 47,
        yearRange: [String(field.year), String(field.year)],
        recipe: buildRecipe(config),
      },
    });
    files.push({
      key: `app/stats/${field.key}/values.json`,
      metricKey: field.key,
      rowCount: 47,
      content: JSON.stringify(payload),
    });
  }
  if (o['write-local'])
    for (const f of files) {
      const path = resolve(o['local-r2-root'], f.key);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, f.content);
    }
  const report = {
    status: o['write-local'] ? 'source-verified-staged' : 'source-verified',
    generatedAt,
    candidates: [37, 38, 72],
    sources,
    definitions,
    results,
    files: files.map(({ content, ...f }) => ({
      ...f,
      sha256: sha(content),
      bytes: Buffer.byteLength(content),
    })),
    remaining: [
      'Parent catalog/registry adoption, browser and publication gates. No remote writes.',
    ],
  };
  await mkdir(dirname(resolve(o.out)), { recursive: true });
  await writeFile(resolve(o.out), JSON.stringify(report, null, 2) + '\n');
  console.log(
    JSON.stringify({ status: report.status, metrics: 6, rows: 282, out: o.out })
  );
}
if (
  process.argv[1] &&
  (await realpath(process.argv[1]).catch(() => null)) ===
    fileURLToPath(import.meta.url)
)
  main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
