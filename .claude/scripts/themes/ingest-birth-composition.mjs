#!/usr/bin/env node
/** Pinned 2024 vital statistics: mother's age and birth order. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
const root = process.cwd(),
  require = createRequire(resolve(root, 'package.json'));
const prefectures = require('./packages/area/src/data/prefectures.json');
const sha = (b) => createHash('sha256').update(b).digest('hex');
export const SOURCES = {
  age: {
    id: '0003411631',
    table: '5',
    axis: 'cat01',
    sexAxis: 'cat02',
    sha256: '9fd8081b29c0026c37c391fa9e143173c98f589e08920b47373444cb41866546',
    labels: [
      ['00100', '総数'],
      ['00190', '14歳以下'],
      ['00220', '15～19歳'],
      ['00230', '20～24歳'],
      ['00240', '25～29歳'],
      ['00250', '30～34歳'],
      ['00260', '35～39歳'],
      ['00280', '40～44歳'],
      ['00300', '45～49歳'],
      ['00310', '50歳以上'],
      ['00450', '不詳'],
    ],
    national: [
      686173, 27, 4231, 42757, 177838, 253444, 162659, 43471, 1609, 125, 12,
    ],
  },
  order: {
    id: '0003411918',
    table: '10',
    axis: 'cat02',
    sexAxis: 'cat01',
    sha256: '4f000d41ba973e5ededc9eadc7137f42a9b84872d46740e9932ffd3ea6152c3c',
    labels: [
      ['00100', '総数'],
      ['00110', '第1子'],
      ['00120', '第2子'],
      ['00140', '第3子'],
      ['00150', '第4子'],
      ['00170', '第5子'],
      ['00180', '第6子'],
      ['00190', '第7子'],
      ['00200', '第8子'],
      ['00210', '第9子'],
      ['00220', '第10子以上'],
    ],
    national: [
      686173, 322476, 248662, 86034, 20552, 5569, 1801, 615, 290, 101, 73,
    ],
  },
};
export const FIELDS = [
  ['births-mother-under25', 'age', ['00190', '00220', '00230']],
  ['births-mother-age25to29', 'age', ['00240']],
  ['births-mother-age30to34', 'age', ['00250']],
  ['births-mother-age35to39', 'age', ['00260']],
  ['births-mother-age40plus', 'age', ['00280', '00300', '00310']],
  ['births-first-child', 'order', ['00110']],
  ['births-second-child', 'order', ['00120']],
  [
    'births-third-child-plus',
    'order',
    ['00140', '00150', '00170', '00180', '00190', '00200', '00210', '00220'],
  ],
];
export function parseBirthSource(document, family) {
  const spec = SOURCES[family];
  assert.ok(spec, 'source family');
  const response = document.GET_STATS_DATA;
  assert.equal(response.RESULT.STATUS, 0);
  const data = response.STATISTICAL_DATA;
  assert.equal(data.TABLE_INF['@id'], spec.id);
  assert.equal(data.TABLE_INF.STAT_NAME['@code'], '00450011');
  assert.equal(data.TABLE_INF.TITLE['@no'], spec.table);
  assert.deepEqual(
    data.RESULT_INF,
    { TOTAL_NUMBER: 770, FROM_NUMBER: 1, TO_NUMBER: 770 },
    'complete response'
  );
  const axes = new Map(
    data.CLASS_INF.CLASS_OBJ.map((a) => [
      a['@id'],
      Array.isArray(a.CLASS) ? a.CLASS : [a.CLASS],
    ])
  );
  assert.deepEqual(
    axes.get(spec.axis).map((a) => [a['@code'], a['@name']]),
    spec.labels,
    'categories'
  );
  assert.deepEqual(
    axes.get(spec.sexAxis).map((a) => [a['@code'], a['@name']]),
    [['00100', '総数']]
  );
  assert.deepEqual(
    axes.get('tab').map((a) => [a['@code'], a['@name'], a['@unit']]),
    [['10040', '出生数', '人']]
  );
  assert.deepEqual(
    axes.get('time').map((a) => [a['@code'], a['@name']]),
    [['2024000000', '2024年']]
  );
  assert.equal(
    data.DATA_INF.NOTE.find((n) => n['@char'] === '-')?.$,
    '計数のない場合',
    'explicit zero symbol'
  );
  const sourceAreas = axes.get('area');
  assert.equal(sourceAreas.length, 70);
  assert.equal(new Set(sourceAreas.map((a) => a['@code'])).size, 70);
  const selected = [
    { prefCode: '00000', prefName: '全国' },
    ...prefectures,
    { prefCode: '51000', prefName: '外国' },
  ];
  for (const p of selected)
    assert.equal(
      sourceAreas.find((a) => a['@code'] === p.prefCode)?.['@name'],
      p.prefName,
      'area identity'
    );
  const cells = new Map();
  let zeroSymbols = 0;
  assert.equal(data.DATA_INF.VALUE.length, 770);
  for (const row of data.DATA_INF.VALUE) {
    for (const [axis, value] of Object.entries({
      tab: '10040',
      [spec.sexAxis]: '00100',
      time: '2024000000',
      unit: '人',
    }))
      assert.equal(row['@' + axis], value, axis);
    assert.ok(sourceAreas.some((a) => a['@code'] === row['@area']));
    assert.ok(spec.labels.some((a) => a[0] === row['@' + spec.axis]));
    const raw = row.$;
    assert.ok(
      raw === '-' || /^\d+$/.test(raw),
      'missing/unknown symbol must not become zero'
    );
    if (raw === '-') zeroSymbols++;
    const value = raw === '-' ? 0 : Number(raw);
    assert.ok(Number.isSafeInteger(value) && value >= 0);
    const key = row['@area'] + '/' + row['@' + spec.axis];
    assert.ok(!cells.has(key), 'duplicate area/category');
    cells.set(key, value);
  }
  const records = sourceAreas.map((area) => {
    const values = Object.fromEntries(
      spec.labels.map(([code]) => {
        const value = cells.get(area['@code'] + '/' + code);
        assert.ok(Number.isFinite(value), 'complete category');
        return [code, value];
      })
    );
    assert.equal(
      spec.labels.slice(1).reduce((s, [code]) => s + values[code], 0),
      values['00100'],
      'parts equal total with unknown retained'
    );
    return { areaCode: area['@code'], areaName: area['@name'], values };
  });
  const national = records.find((r) => r.areaCode === '00000');
  assert.deepEqual(
    spec.labels.map(([c]) => national.values[c]),
    spec.national,
    'national original controls'
  );
  for (const [code] of spec.labels)
    assert.equal(
      selected
        .slice(1)
        .reduce((s, p) => s + cells.get(p.prefCode + '/' + code), 0),
      national.values[code],
      '47 prefectures plus foreign address, excluding re-listed cities'
    );
  return {
    family,
    sourceRows: 770,
    zeroSymbols,
    records,
    rows: records.filter((r) =>
      selected.some((p) => p.prefCode === r.areaCode)
    ),
    relistedCityRowsExcluded: 21 * 11,
  };
}
export function validateConfig(config, field) {
  const [key, family, codes] = field,
    spec = SOURCES[family];
  assert.equal(config.key, key);
  assert.equal(config.isActive, true);
  assert.equal(config.unit, '人');
  assert.deepEqual(config.entities, ['prefecture']);
  assert.deepEqual(config.years, { from: 2024, to: 2024 });
  assert.equal(config.yearFormat, 'calendar');
  assert.equal(config.display.conversionFactor, 1);
  const s = config.source;
  assert.equal(s.kind, 'estat');
  assert.equal(s.statsDataId, spec.id);
  assert.equal(s.cdTab, '10040');
  assert.equal(
    s['cd' + spec.sexAxis[0].toUpperCase() + spec.sexAxis.slice(1)],
    '00100'
  );
  const axisOption = 'cd' + spec.axis[0].toUpperCase() + spec.axis.slice(1);
  if (codes.length === 1) {
    assert.equal(s[axisOption], codes[0]);
    assert.equal(s.axisSum, undefined);
  } else {
    assert.equal(s[axisOption], undefined);
    assert.deepEqual(s.axisSum, { axis: spec.axis, codes });
  }
  assert.equal(s.axisRatio, undefined);
  assert.equal(s.tabCombination, undefined);
}
export async function main() {
  const { values: o } = parseArgs({
    options: {
      'write-local': { type: 'boolean', default: false },
      'source-dir': {
        type: 'string',
        default: resolve(
          root,
          '.local/verification/themes/birth-composition-source'
        ),
      },
      'config-file': { type: 'string' },
      'local-r2-root': { type: 'string', default: resolve(root, '.local/r2') },
      out: {
        type: 'string',
        default: resolve(
          root,
          '.local/verification/themes/birth-composition-source.json'
        ),
      },
    },
  });
  const configs = o['config-file']
    ? JSON.parse(await readFile(o['config-file'], 'utf8'))
    : Object.values(
        require('./packages/data-configs/src/registry.ts').METRICS_REGISTRY
      );
  const results = {},
    sources = [];
  for (const [family, spec] of Object.entries(SOURCES)) {
    const b = await readFile(resolve(o['source-dir'], family + '-data.json'));
    assert.equal(sha(b), spec.sha256, 'pinned raw ' + family);
    results[family] = parseBirthSource(JSON.parse(b), family);
    const receipt = JSON.parse(
      await readFile(resolve(o['source-dir'], family + '-source.json'), 'utf8')
    );
    assert.equal(receipt.sha256, spec.sha256);
    sources.push(receipt);
  }
  for (const age of results.age.records)
    assert.equal(
      age.values['00100'],
      results.order.records.find((r) => r.areaCode === age.areaCode)?.values[
        '00100'
      ],
      'two source totals'
    );
  const defs = JSON.parse(
    await readFile(resolve(o['source-dir'], 'definition-sources.json'), 'utf8')
  );
  assert.deepEqual(defs, [
    {
      file: 'overview.pdf',
      url: 'https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/kakutei24/dl/01_cho.pdf',
      sha256: '78e3fac10b94e864fe02e2ae0d987c12b150259ac1b38fd65c14e2cf6ec51fd9',
    },
    {
      file: 'national-table6.pdf',
      url: 'https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/kakutei24/dl/08_h6.pdf',
      sha256: '0d714ecaafa20e976ea7336ca3c3385f0d363b35c4d9ecc17bc05ea26911357d',
    },
  ], 'pinned definition sources');
  for (const d of defs)
    assert.equal(
      sha(await readFile(resolve(o['source-dir'], d.file))),
      d.sha256,
      'definition SHA'
    );
  const { buildRecipe } = require('./packages/data-configs/src/recipe.ts');
  const {
    parseStatsValuesPayload,
  } = require('./packages/stats-r2/src/schemas.ts');
  const generatedAt = new Date().toISOString(),
    files = [];
  for (const f of FIELDS) {
    const [key, family, codes] = f;
    const config = configs.find((c) => c.key === key);
    assert.ok(config);
    validateConfig(config, f);
    const rows = prefectures.map((p) => {
      const source = results[family].rows.find(
        (r) => r.areaCode === p.prefCode
      );
      return {
        areaCode: p.prefCode,
        areaName: p.prefName,
        yearCode: '2024',
        yearName: '2024年',
        unit: '人',
        value: codes.reduce((s, c) => s + source.values[c], 0),
      };
    });
    const payload = parseStatsValuesPayload({
      metricKey: key,
      entityKind: 'prefecture',
      rows,
      meta: {
        generatedAt,
        rowCount: 47,
        areaCount: 47,
        yearRange: ['2024', '2024'],
        recipe: buildRecipe(config),
      },
    });
    files.push({
      key: 'app/stats/' + key + '/values.json',
      metricKey: key,
      rowCount: 47,
      content: Buffer.from(JSON.stringify(payload)),
    });
  }
  if (o['write-local'])
    for (const f of files) {
      const p = resolve(o['local-r2-root'], f.key);
      await mkdir(dirname(p), { recursive: true });
      await writeFile(p, f.content);
    }
  const report = {
    generatedAt,
    status: o['write-local'] ? 'source-verified-staged' : 'source-verified',
    candidate: 41,
    sources,
    definitions: defs,
    results,
    checks: {
      sourceCells: 1540,
      crossTableTotals: 70,
      canonicalRows: 376,
      national: 686173,
      prefectureSum: 686155,
      foreignAddress: 18,
      motherAgeUnknown: 12,
    },
    files: files.map(({ content, ...f }) => ({
      ...f,
      sha256: sha(content),
      bytes: content.length,
    })),
  };
  await mkdir(dirname(resolve(o.out)), { recursive: true });
  await writeFile(o.out, JSON.stringify(report, null, 2) + '\n');
  console.log(
    JSON.stringify({ status: report.status, metrics: 8, rows: 376, out: o.out })
  );
}
if (
  process.argv[1] &&
  (await realpath(process.argv[1]).catch(() => null)) ===
    fileURLToPath(import.meta.url)
)
  await main();
