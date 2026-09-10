#!/usr/bin/env node
/** 2019 household housing/land debt, table 4-1. No regional averaging. */
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
export const KEY = 'housing-land-debt-per-household';
export const SOURCE_SHA =
  'beb8d6c6bb125fb208047f53f8909d18cd14a02eedfb1e5d35d37f8495a8a068';
export function parseHousingDebt(document) {
  const response = document.GET_STATS_DATA,
    data = response.STATISTICAL_DATA;
  assert.equal(response.RESULT.STATUS, 0);
  assert.equal(data.TABLE_INF['@id'], '0003426532', 'table');
  assert.equal(
    data.TABLE_INF.STAT_NAME['@code'],
    '00200564',
    'household survey'
  );
  assert.equal(data.TABLE_INF.TITLE['@no'], '4-1');
  assert.deepEqual(
    data.RESULT_INF,
    { TOTAL_NUMBER: 268, FROM_NUMBER: 1, TO_NUMBER: 268 },
    'complete source'
  );
  const axes = new Map(
    data.CLASS_INF.CLASS_OBJ.map((a) => [
      a['@id'],
      Array.isArray(a.CLASS) ? a.CLASS : [a.CLASS],
    ])
  );
  for (const [axis, expected] of Object.entries({
    cat01: [['0', '総世帯']],
    cat02: [['0', '全世帯']],
    cat03: [['0', '平均']],
    cat04: [
      ['22', '金融負債残高'],
      ['221', '住宅・土地のための負債'],
      ['222', '住宅・土地以外の負債'],
      ['223', '月賦・年賦'],
    ],
    time: [['2019000000', '2019年']],
  }))
    assert.deepEqual(
      axes.get(axis).map((c) => [c['@code'], c['@name']]),
      expected,
      axis + ' definition'
    );
  assert.deepEqual(
    axes.get('tab').map((c) => [c['@code'], c['@name'], c['@unit']]),
    [['04-2019', '1世帯当たり資産現在高・負債現在高', '千円']]
  );
  const cells = new Map();
  assert.equal(data.DATA_INF.VALUE.length, 268);
  for (const c of data.DATA_INF.VALUE) {
    for (const [axis, value] of Object.entries({
      tab: '04-2019',
      cat01: '0',
      cat02: '0',
      cat03: '0',
      time: '2019000000',
      unit: '千円',
    }))
      assert.equal(c['@' + axis], value, axis);
    assert.ok(['22', '221', '222', '223'].includes(c['@cat04']));
    assert.ok(
      axes.get('area').some((a) => a['@code'] === c['@area']),
      'area in source metadata'
    );
    assert.match(c.$, /^\d+$/, 'no missing or suppressed amount imputation');
    const value = Number(c.$);
    assert.ok(Number.isSafeInteger(value));
    const key = c['@area'] + '/' + c['@cat04'];
    assert.ok(!cells.has(key), 'duplicate area/type');
    cells.set(key, value);
  }
  const all = [{ prefCode: '00000', prefName: '全国' }, ...prefectures];
  const records = all.map((p) => {
    const area = axes.get('area').find((a) => a['@code'] === p.prefCode);
    assert.equal(area?.['@name'], p.prefName, 'prefecture identity');
    const values = ['22', '221', '222', '223'].map((code) =>
      cells.get(p.prefCode + '/' + code)
    );
    assert.ok(values.every(Number.isFinite), 'complete prefecture/debt types');
    const difference = values[1] + values[2] + values[3] - values[0];
    assert.ok(
      Math.abs(difference) <= 2,
      'three rounded debt components and total'
    );
    return {
      areaCode: p.prefCode,
      areaName: p.prefName,
      value: values[1],
      totalDebt: values[0],
      otherDebt: values[2],
      installmentDebt: values[3],
      difference,
    };
  });
  const [national, ...rows] = records;
  return {
    rows,
    national,
    checks: {
      prefectures: 47,
      selectedCells: 192,
      excludedAggregateCells: 76,
      missing: 0,
      duplicates: 0,
      roundingUnit: '千円',
      maxComponentDifference: Math.max(
        ...records.map((r) => Math.abs(r.difference))
      ),
      nationalAggregation: 'official estimate; never average prefecture means',
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
          '.local/verification/themes/housing-debt-source'
        ),
      },
      out: {
        type: 'string',
        default: resolve(
          root,
          '.local/verification/themes/housing-debt-source.json'
        ),
      },
    },
  });
  const bytes = await readFile(
    resolve(o['source-dir'], 'housing-debt-data.json')
  );
  assert.equal(sha(bytes), SOURCE_SHA, 'original SHA');
  const source = JSON.parse(
    await readFile(resolve(o['source-dir'], 'housing-debt-source.json'), 'utf8')
  );
  assert.equal(source.sha256, SOURCE_SHA);
  const result = parseHousingDebt(JSON.parse(bytes));
  assert.equal(result.national.value, 3879, 'national original');
  const config = require('../../../packages/data-configs/src/registry.ts')
    .METRICS_REGISTRY[KEY];
  assert.equal(config?.key, KEY);
  assert.ok(config.isActive);
  assert.deepEqual(config.years, { from: 2019, to: 2019 });
  assert.equal(config.unit, '千円');
  assert.equal(config.display.conversionFactor, 1);
  assert.deepEqual(config.source, {
    kind: 'estat',
    statsDataId: '0003426532',
    cdTab: '04-2019',
    cdCat01: '0',
    cdCat02: '0',
    cdCat03: '0',
    cdCat04: '221',
    displayName: '全国家計構造調査',
    url: 'https://www.stat.go.jp/data/zenkokukakei/2019/index.html',
  });
  const generatedAt = new Date().toISOString();
  const payload = parseStatsValuesPayload({
    metricKey: KEY,
    entityKind: 'prefecture',
    rows: result.rows.map(({ areaCode, areaName, value }) => ({
      areaCode,
      areaName,
      value,
      yearCode: '2019',
      yearName: '2019年',
      unit: '千円',
    })),
    meta: {
      generatedAt,
      rowCount: 47,
      areaCount: 47,
      yearRange: ['2019', '2019'],
      recipe: buildRecipe(config),
    },
  });
  const key = 'app/stats/' + KEY + '/values.json',
    content = JSON.stringify(payload);
  if (o['write-local']) {
    const path = resolve(root, '.local/r2', key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
  }
  const report = {
    generatedAt,
    status: o['write-local'] ? 'source-verified-staged' : 'source-verified',
    source,
    ...result,
    files: [{ key, sha256: sha(content), rowCount: 47 }],
  };
  await mkdir(dirname(resolve(o.out)), { recursive: true });
  await writeFile(o.out, JSON.stringify(report, null, 2) + '\n');
  console.log(
    JSON.stringify({
      status: report.status,
      rows: 47,
      national: result.national.value,
      output: o.out,
    })
  );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await main();
