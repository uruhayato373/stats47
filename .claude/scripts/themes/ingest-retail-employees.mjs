#!/usr/bin/env node
/** SSDS C350302 only. Raw source is private; only --write-local writes canonical values. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
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
const {
  extractYearCode,
} = require('../../../packages/estat-api/src/stats-data/utils/extract-year-code.ts');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const array = (value) => (Array.isArray(value) ? value : [value]);
export const KEY = 'retail-employees';
export const SOURCE_SHA =
  '56e068fb374b6f910fcca60efee867abe9a4d901717fee616b3cfcd140ef49f6';
export const SOURCE_BYTES = 87073;
export const NATIONAL = 6464650;
const TIME = '2021100000';
const areas = [{ prefCode: '00000', prefName: '全国' }, ...prefectures];

export function verifyRetailSourceBytes(bytes) {
  assert.equal(sha(bytes), SOURCE_SHA, 'pinned original SHA');
  assert.equal(bytes.length, SOURCE_BYTES, 'pinned original bytes');
}

export function parseRetailEmployees(document) {
  const response = document.GET_STATS_DATA;
  assert.equal(response?.RESULT?.STATUS, 0, 'successful source response');
  const data = response.STATISTICAL_DATA;
  assert.equal(data.TABLE_INF['@id'], '0000010103', 'source table');
  assert.equal(data.TABLE_INF.STAT_NAME['@code'], '00200502', 'SSDS survey');
  assert.equal(data.TABLE_INF.CYCLE, '年度次', 'source cycle');
  assert.equal(data.CLASS_INF.CLASS_OBJ.length, 4, 'exactly four source axes');
  const axes = new Map(
    data.CLASS_INF.CLASS_OBJ.map((axis) => [axis['@id'], array(axis.CLASS)])
  );
  assert.deepEqual(
    [...axes.keys()].sort(),
    ['area', 'cat01', 'tab', 'time'],
    'only expected source axes'
  );
  assert.deepEqual(
    axes.get('cat01').map((c) => [c['@code'], c['@name'], c['@unit']]),
    [['C350302', 'C350302_小売業従業者数', '人']],
    'retail-only cohort and unit'
  );
  assert.deepEqual(
    axes.get('tab').map((c) => c['@code']),
    ['00001'],
    'observation tab'
  );
  assert.equal(
    axes.get('time').find((c) => c['@code'] === TIME)?.['@name'],
    '2021年度',
    'selected year definition'
  );
  assert.equal(axes.get('area').length, 48, 'national and 47 area definitions');
  assert.equal(
    new Set(axes.get('area').map((c) => c['@code'])).size,
    48,
    'unique area definitions'
  );
  for (const p of areas)
    assert.equal(
      axes.get('area').find((a) => a['@code'] === p.prefCode)?.['@name'],
      p.prefName,
      'prefecture metadata identity'
    );
  const values = data.DATA_INF.VALUE;
  assert.deepEqual(
    data.RESULT_INF,
    { TOTAL_NUMBER: values.length, FROM_NUMBER: 1, TO_NUMBER: values.length },
    'complete API page'
  );
  const cells = new Map();
  for (const row of values) {
    assert.equal(
      row['@cat01'],
      'C350302',
      'retail-only row, not combined C3503'
    );
    assert.equal(row['@tab'], '00001', 'observation row');
    assert.equal(row['@unit'], '人', 'persons unit');
    assert.ok(
      areas.some((p) => p.prefCode === row['@area']),
      'prefecture or national row only'
    );
    assert.ok(
      axes.get('time').some((t) => t['@code'] === row['@time']),
      'time metadata identity'
    );
    if (row['@time'] !== TIME) continue;
    assert.match(row.$, /^\d+$/, 'numeric count; no missing value imputation');
    const value = Number(row.$);
    assert.ok(Number.isSafeInteger(value), 'safe integer count');
    assert.ok(!cells.has(row['@area']), 'duplicate selected prefecture/year');
    cells.set(row['@area'], value);
  }
  assert.equal(cells.size, 48, '47 prefectures plus national in selected year');
  const national = cells.get('00000');
  assert.equal(national, NATIONAL, 'pinned official national count');
  const rows = prefectures.map((p) => ({
    areaCode: p.prefCode,
    areaName: p.prefName,
    value: cells.get(p.prefCode),
  }));
  assert.equal(
    rows.reduce((sum, row) => sum + row.value, 0),
    national,
    '47 prefectures conserve official national'
  );
  return {
    rows,
    national,
    sourceRows: values.length,
    selectedRows: 48,
    excludedHistoricalRows: values.length - 48,
  };
}

export function buildRetailPayload(result, config, generatedAt) {
  assert.equal(config?.key, KEY, 'metric identity');
  assert.equal(config.isActive, true, 'active config');
  assert.equal(config.unit, '人', 'config unit');
  assert.equal(config.yearFormat, 'fiscal', 'fiscal source label');
  assert.deepEqual(config.entities, ['prefecture'], 'prefecture only');
  assert.deepEqual(
    config.years,
    { from: 2021, to: 2021 },
    'only adopted 2021 year'
  );
  assert.equal(config.display.conversionFactor, 1, 'no value conversion');
  assert.deepEqual(
    config.source,
    {
      kind: 'estat',
      statsDataId: '0000010103',
      cdTab: '00001',
      cdCat01: 'C350302',
      displayName: '社会・人口統計体系',
      url: 'https://www.e-stat.go.jp/dbview?sid=0000010103',
    },
    'exact retail recipe'
  );
  const yearCode = extractYearCode(TIME);
  const payload = parseStatsValuesPayload({
    metricKey: KEY,
    entityKind: 'prefecture',
    rows: result.rows.map((row) => ({
      ...row,
      yearCode,
      yearName: `${yearCode}年度`,
      unit: '人',
    })),
    meta: {
      generatedAt,
      rowCount: 47,
      areaCount: 47,
      yearRange: [yearCode, yearCode],
      recipe: buildRecipe(config),
    },
  });
  assert.deepEqual(
    payload.rows.map(({ areaCode, areaName, value }) => ({
      areaCode,
      areaName,
      value,
    })),
    result.rows,
    '47 raw source-to-canonical values'
  );
  assert.equal(
    payload.rows.reduce((sum, row) => sum + row.value, 0),
    NATIONAL,
    'canonical national conservation'
  );
  return payload;
}

export async function main() {
  const { values: o } = parseArgs({
    options: {
      'write-local': { type: 'boolean', default: false },
      'source-dir': {
        type: 'string',
        default: resolve(
          root,
          '.local/verification/themes/retail-employment-source'
        ),
      },
      out: { type: 'string' },
    },
  });
  const bytes = await readFile(
    resolve(o['source-dir'], 'retail-employees.json')
  );
  verifyRetailSourceBytes(bytes);
  const receipt = JSON.parse(
    await readFile(resolve(o['source-dir'], 'receipt.json'), 'utf8')
  );
  assert.equal(receipt.sha256, SOURCE_SHA, 'source receipt SHA');
  assert.equal(receipt.bytes, SOURCE_BYTES, 'source receipt bytes');
  assert.equal(receipt.parameters.statsDataId, '0000010103');
  assert.equal(receipt.parameters.cdCat01, 'C350302');
  assert.ok(
    !receipt.parameters.appId && !receipt.parameters.APP_ID,
    'no credential in evidence'
  );
  const result = parseRetailEmployees(JSON.parse(bytes));
  const config = require('../../../packages/data-configs/src/registry.ts')
    .METRICS_REGISTRY[KEY];
  const generatedAt = new Date().toISOString();
  const payload = buildRetailPayload(result, config, generatedAt);
  const key = `app/stats/${KEY}/values.json`,
    content = Buffer.from(JSON.stringify(payload));
  if (o['write-local']) {
    const target = resolve(root, '.local/r2', key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content);
  }
  const report = {
    status: o['write-local'] ? 'source-verified-staged' : 'source-verified',
    generatedAt,
    candidateId: 13,
    metricKey: KEY,
    source: {
      url: 'https://www.e-stat.go.jp/dbview?sid=0000010103',
      apiEndpoint: 'https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData',
      parameters: receipt.parameters,
      sha256: SOURCE_SHA,
      bytes: SOURCE_BYTES,
      acquiredAt: receipt.observedAt,
    },
    scope: {
      indicatorCode: 'C350302',
      observationTimeCode: TIME,
      yearCode: '2021',
      yearFormat: 'fiscal',
      unit: '人',
      denominator: null,
      geography: '小売業事業所の都道府県',
      timing: '調査日現在。SSDS年度表示であり年度末・年間平均ではない。',
      excluded: '卸売業。C3503の卸売・小売合計ではない。',
    },
    checks: {
      matchedPrefectures: 47,
      missing: 0,
      duplicates: 0,
      national: NATIONAL,
      prefectureSum: result.national,
      sourceRows: result.sourceRows,
      selectedRows: 48,
      excludedHistoricalRows: result.excludedHistoricalRows,
    },
    rows: result.rows,
    files: [{ key, sha256: sha(content), bytes: content.length, rowCount: 47 }],
  };
  if (o.out) {
    await mkdir(dirname(resolve(o.out)), { recursive: true });
    await writeFile(resolve(o.out), JSON.stringify(report, null, 2) + '\n');
  }
  console.log(
    JSON.stringify({
      status: report.status,
      matchedPrefectures: 47,
      national: NATIONAL,
      writeLocal: o['write-local'],
    })
  );
}
if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
)
  await main();
