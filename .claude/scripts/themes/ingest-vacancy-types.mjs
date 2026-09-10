#!/usr/bin/env node
/** 2023 housing census, final table 34-1. Preserve rounded estimates. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
const require = createRequire(import.meta.url);
const prefectures = require('../../../packages/area/src/data/prefectures.json');
const { buildRecipe } = require('../../../packages/data-configs/src/recipe.ts');
const {
  parseStatsValuesPayload,
} = require('../../../packages/stats-r2/src/schemas.ts');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const sha = (v) => createHash('sha256').update(v).digest('hex');
export const SOURCE_SHA =
  '9944ef98f964195ec4ad95f193eb161e02f6578c432a422698ed01e7ea73863b';
export const FIELDS = [
  {
    code: '1',
    key: 'vacant-housing-excluding-rental-sale-secondary',
    title: '賃貸・売却用及び二次的住宅を除く空き家',
  },
  { code: '2', key: 'vacant-housing-for-rent', title: '賃貸用の空き家' },
  { code: '3', key: 'vacant-housing-for-sale', title: '売却用の空き家' },
  {
    code: '4',
    key: 'vacant-housing-secondary-residences',
    title: '二次的住宅',
  },
];
const allAreas = [{ prefCode: '00000', prefName: '全国' }, ...prefectures];
const array = (v) => (Array.isArray(v) ? v : [v]);
export function parseVacancy(document) {
  const response = document.GET_STATS_DATA;
  assert.equal(response.RESULT.STATUS, 0, 'API status');
  assert.equal(response.PARAMETER.STATS_DATA_ID, '0004021660', 'table ID');
  const data = response.STATISTICAL_DATA;
  assert.deepEqual(
    data.RESULT_INF,
    { TOTAL_NUMBER: 240, FROM_NUMBER: 1, TO_NUMBER: 240 },
    'complete unpaginated source'
  );
  assert.equal(data.TABLE_INF['@id'], '0004021660', 'source table ID');
  assert.equal(data.TABLE_INF.STAT_NAME['@code'], '00200522', 'housing census');
  assert.equal(String(data.TABLE_INF.SURVEY_DATE), '202310', 'October 2023');
  assert.equal(data.TABLE_INF.TITLE['@no'], '34-1', 'table number');
  assert.match(
    data.TABLE_INF.STATISTICS_NAME,
    /住宅及び世帯に関する基本集計/,
    'final basic results'
  );
  const axes = new Map(
    data.CLASS_INF.CLASS_OBJ.map((a) => [a['@id'], array(a.CLASS)])
  );
  assert.equal(axes.size, 7, 'expected axes');
  for (const name of ['cat01', 'cat02', 'cat03']) {
    assert.deepEqual(
      axes.get(name).map((c) => [c['@code'], c['@name']]),
      [['0', '総数']],
      'all building/structure/decay groups'
    );
  }
  assert.deepEqual(
    axes.get('tab').map((c) => [c['@code'], c['@name'], c['@unit']]),
    [['03-2023', '空き家数', '戸']],
    'measure and unit'
  );
  assert.deepEqual(
    axes.get('time').map((c) => [c['@code'], c['@name']]),
    [['2023000000', '2023年']],
    'period'
  );
  assert.deepEqual(
    axes.get('cat04').map((c) => [c['@code'], c['@name']]),
    [['0', '総数'], ...FIELDS.map((f) => [f.code, f.title])],
    'exclusive vacancy types'
  );
  assert.deepEqual(
    axes.get('area').map((c) => [c['@code'], c['@name'], c['@level']]),
    allAreas.map((p) => [
      p.prefCode,
      p.prefName,
      p.prefCode === '00000' ? '1' : '2',
    ]),
    'national and 47 prefectures, no cities'
  );
  const cells = new Map();
  assert.equal(data.DATA_INF.VALUE.length, 240, '240 source cells');
  for (const cell of data.DATA_INF.VALUE) {
    for (const [axis, value] of Object.entries({
      tab: '03-2023',
      cat01: '0',
      cat02: '0',
      cat03: '0',
      time: '2023000000',
      unit: '戸',
    }))
      assert.equal(cell['@' + axis], value, 'cell dimension ' + axis);
    assert.ok(
      allAreas.some((p) => p.prefCode === cell['@area']),
      'known geography'
    );
    assert.match(
      cell['@cat04'],
      /^[0-4]$/,
      'type excludes nested second-home bins'
    );
    assert.match(cell.$, /^\d+$/, 'no missing/suppressed value imputation');
    const value = Number(cell.$);
    assert.ok(
      Number.isSafeInteger(value) && value % 100 === 0,
      '100-home rounded estimate'
    );
    const key = cell['@area'] + '/' + cell['@cat04'];
    assert.ok(!cells.has(key), 'duplicate source cell');
    cells.set(key, value);
  }
  const records = allAreas.map((p) => ({
    areaCode: p.prefCode,
    areaName: p.prefName,
    values: Array.from({ length: 5 }, (_, i) =>
      cells.get(p.prefCode + '/' + i)
    ),
  }));
  assert.ok(
    records.every((r) => r.values.every(Number.isFinite)),
    'complete area/type grid'
  );
  const differences = records.map((r) => {
    const delta = r.values.slice(1).reduce((a, b) => a + b, 0) - r.values[0];
    // Each of four bins and the total can round by up to 50. Reject larger
    // discrepancies; do not distribute a residual or infer an unknown count.
    assert.ok(
      Math.abs(delta) <= 5 * 50,
      'type/total discrepancy exceeds rounding envelope'
    );
    return { areaCode: r.areaCode, difference: delta };
  });
  const [national, ...rows] = records;
  const nationalDifferences = national.values.map((value, i) => {
    const delta = rows.reduce((sum, r) => sum + r.values[i], 0) - value;
    assert.ok(
      Math.abs(delta) <= 48 * 50,
      'prefecture/national discrepancy exceeds rounding envelope'
    );
    return delta;
  });
  return {
    rows,
    national,
    checks: {
      sourceCells: 240,
      prefectures: 47,
      missing: 0,
      duplicates: 0,
      unit: '戸',
      period: '2023-10-01',
      roundingUnit: 100,
      differences,
      nationalDifferences,
    },
  };
}
export async function main() {
  const { values: o } = parseArgs({
    options: {
      'write-local': { type: 'boolean', default: false },
      'source-dir': {
        type: 'string',
        default: resolve(
          root,
          '.local/verification/themes/vacancy-core-source'
        ),
      },
      out: {
        type: 'string',
        default: resolve(
          root,
          '.local/verification/themes/vacancy-core-source.json'
        ),
      },
    },
  });
  const bytes = await readFile(resolve(o['source-dir'], 'data.json'));
  assert.equal(sha(bytes), SOURCE_SHA, 'fixed original source SHA');
  const provenance = JSON.parse(
    await readFile(resolve(o['source-dir'], 'source.json'), 'utf8')
  );
  assert.equal(provenance.sha256, SOURCE_SHA, 'source receipt');
  const document = JSON.parse(bytes);
  const result = parseVacancy(document);
  assert.deepEqual(
    result.national.values,
    [9001600, 3856000, 4435800, 326200, 383500],
    'official national source estimates'
  );
  const registry =
    require('../../../packages/data-configs/src/registry.ts').METRICS_REGISTRY;
  const generatedAt = new Date().toISOString();
  const prepared = FIELDS.map((field) => {
    const config = registry[field.key];
    assert.ok(config?.isActive, 'active config');
    assert.equal(config.unit, '戸', 'config unit');
    assert.deepEqual(config.years, { from: 2023, to: 2023 }, 'config period');
    assert.deepEqual(config.entities, ['prefecture'], 'config geography');
    assert.equal(config.display.conversionFactor, 1, 'no conversion');
    assert.deepEqual(
      config.source,
      {
        kind: 'estat',
        statsDataId: '0004021660',
        cdTab: '03-2023',
        cdCat01: '0',
        cdCat02: '0',
        cdCat03: '0',
        cdCat04: field.code,
        displayName: '住宅・土地統計調査',
        url: 'https://www.stat.go.jp/data/jyutaku/2023/index.html',
      },
      'source filter contract'
    );
    const payload = parseStatsValuesPayload({
      metricKey: field.key,
      entityKind: 'prefecture',
      rows: result.rows.map((r) => ({
        areaCode: r.areaCode,
        areaName: r.areaName,
        value: r.values[Number(field.code)],
        unit: '戸',
        yearCode: '2023',
        yearName: '2023年10月1日',
      })),
      meta: {
        generatedAt,
        rowCount: 47,
        areaCount: 47,
        yearRange: ['2023', '2023'],
        recipe: buildRecipe(config),
      },
    });
    return {
      key: 'app/stats/' + field.key + '/values.json',
      content: JSON.stringify(payload),
    };
  });
  if (o['write-local'])
    for (const file of prepared) {
      const path = resolve(root, '.local/r2', file.key);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, file.content);
    }
  const report = {
    generatedAt,
    status: o['write-local'] ? 'source-verified-staged' : 'source-verified',
    source: provenance,
    definitionUrl: 'https://www.stat.go.jp/data/jyutaku/2023/pdf/yougo.pdf',
    roundingUrl: 'https://www.stat.go.jp/data/jyutaku/2023/pdf/riyou.pdf',
    ...result,
    files: prepared.map((f) => ({
      key: f.key,
      sha256: sha(f.content),
      rowCount: 47,
    })),
  };
  await mkdir(dirname(resolve(o.out)), { recursive: true });
  await writeFile(o.out, JSON.stringify(report, null, 2) + '\n');
  console.log(
    JSON.stringify({
      status: report.status,
      metrics: 4,
      rows: 188,
      nationalDifferences: result.checks.nationalDifferences,
      output: o.out,
    })
  );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await main();
