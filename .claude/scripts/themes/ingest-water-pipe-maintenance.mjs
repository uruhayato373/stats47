#!/usr/bin/env node
/** Intended: .claude/scripts/themes/ingest-water-pipe-maintenance.mjs. */
import assert from 'node:assert/strict';
import { realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';
const root = process.cwd();
const require = createRequire(resolve(root, 'package.json'));
const { parse } = require('csv-parse/sync');
const prefectures = require('./packages/area/src/data/prefectures.json');
export const SOURCE = {
  file: 'water-digital-long.zip',
  member: '2024.csv',
  url: 'https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/9112b58e-556c-429e-906f-45be48b63fd9/db7e75fb/20260703_resources_govdashboard_watersupply_table_02.zip',
  sha256: 'c9e6254f8a13e1df65d9ea5bdc0561aeb0c15fc1fdd3214d82e490599990bc5f',
  memberSha256:
    '6922a6570522e41a2352c86669c92f260e5ab4ac6140b129ca91941af413b1b0',
  originalUrl:
    'https://www.e-stat.go.jp/stat-search?page=1&toukei=00200251&tstat=000001125335',
  xlsUrl: 'https://www.soumu.go.jp/main_content/001064895.xls',
  xlsSha256: 'ad3f1d6f4d36cd0f868b5e54a0294708828794b6f8fc28cf6e53a526e2dd9162',
  nationalXlsUrl: 'https://www.soumu.go.jp/main_content/001064869.xls',
  nationalXlsSha256:
    '065baf4f8a8c4468e49208384195fd549e7c667590e536d272c5268c6ffc2885',
};
export const METRICS = [
  {
    key: 'public-water-pipe-aging-rate',
    field: 'agingRate',
    title: '水道管路の経年化率',
    unit: '%',
    decimals: 1,
  },
  {
    key: 'public-water-pipe-renewal-rate',
    field: 'renewalRate',
    title: '水道管路の更新率',
    unit: '%',
    decimals: 2,
  },
  {
    key: 'public-water-pipe-length',
    field: 'totalKm',
    title: '水道管路の総延長',
    unit: 'km',
    decimals: 2,
  },
  {
    key: 'public-water-aged-pipe-length',
    field: 'agedKm',
    title: '法定耐用年数を経過した水道管路延長',
    unit: 'km',
    decimals: 2,
  },
  {
    key: 'public-water-renewed-pipe-length',
    field: 'renewedKm',
    title: '年度内に更新した水道管路延長',
    unit: 'km',
    decimals: 2,
  },
];
export const PIPE_FIELDS = [
  ['列013', '4.施設__(6)導水管延長(千m)'],
  ['列014', '4.施設__(7)送水管延長(千m)'],
  ['列015', '4.施設__(8)配水管延長(千m)'],
  [
    '列060',
    '4.施設__(6)～(8)導水配水管延長__うち法定耐用年数を経過した管路延長(千m)__導水管',
  ],
  [
    '列061',
    '4.施設__(6)～(8)導水配水管延長__うち法定耐用年数を経過した管路延長(千m)__送水管',
  ],
  [
    '列062',
    '4.施設__(6)～(8)導水配水管延長__うち法定耐用年数を経過した管路延長(千m)__配水管',
  ],
  [
    '列063',
    '4.施設__(6)～(8)導水配水管延長__うち当該年度に更新した管路延長(千m)__導水管',
  ],
  [
    '列064',
    '4.施設__(6)～(8)導水配水管延長__うち当該年度に更新した管路延長(千m)__送水管',
  ],
  [
    '列065',
    '4.施設__(6)～(8)導水配水管延長__うち当該年度に更新した管路延長(千m)__配水管',
  ],
];
const TYPES = {
  '001': [
    '001:末端給水事業',
    ['1:上水道事業のみ', '2:上水道事業と簡易水道事業'],
  ],
  '002': ['002:用水供給事業', ['1:上水道事業のみ']],
  '005': ['005:法適用簡易水道事業', ['3:簡易水道事業のみ']],
  '006': [
    '006:末端給水事業のうち同一会計内の法適用簡易水道事業分',
    ['4:上水道事業と簡易水道事業のうち簡易水道事業'],
  ],
};
const sha = (b) => createHash('sha256').update(b).digest('hex');
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
// Integer hundredths preserve the source's decimal precision; 千m and km are numerically identical.
export function exactHundredths(s) {
  assert.match(
    s,
    /^(0|[1-9]\d*)(\.\d{1,2})?$/,
    'missing, negative, non-finite or overprecision source value'
  );
  const [whole, frac = ''] = s.split('.');
  const value = Number(whole) * 100 + Number(frac.padEnd(2, '0'));
  assert.ok(Number.isSafeInteger(value));
  return value;
}
export function parsePipeCsv(text) {
  return parse(text, {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    relax_column_count: false,
  });
}
export function aggregatePipeRows(
  rawRows,
  expected = { rawRows: 153285, entities: 1799, selected: 1703, subset: 96 }
) {
  const prefMap = new Map(prefectures.map((p) => [p.prefCode.slice(0, 2), p]));
  const fields = new Map(PIPE_FIELDS);
  const entities = new Map();
  let selectedCells = 0;
  assert.equal(rawRows.length, expected.rawRows, 'CSV row count changed');
  for (const [index, r] of rawRows.entries()) {
    if (!fields.has(r.item_key)) continue;
    // Other statistical tables legitimately reuse their column identifiers.
    if (r.statistical_table_number !== '01') {
      assert.ok(
        !PIPE_FIELDS.some(([, name]) => name === r.item_name),
        'pipe field moved to another table'
      );
      continue;
    }
    assert.equal(r.statistical_table_name, '01 施設及び業務概況に関する調');
    assert.equal(r.source_url, SOURCE.originalUrl);
    assert.equal(r.fiscal_year, '2024');
    assert.equal(r.item_name, fields.get(r.item_key));
    assert.equal(r.item_unit, '千m');
    assert.match(r.local_public_enterprise_code, /^\d{6}$/);
    assert.ok(
      prefMap.has(r.local_public_enterprise_code.slice(0, 2)),
      'unknown prefecture'
    );
    const type = TYPES[r.facility_code];
    assert.ok(type, 'unknown facility code');
    assert.equal(r.facility_code_name, type[0]);
    assert.ok(
      type[1].includes(r.cond_1_business_type),
      'business universe changed'
    );
    assert.ok(
      r.local_public_enterprise_name.trim().length >= 2,
      'missing entity name'
    );
    const key = r.local_public_enterprise_code + ':' + r.facility_code;
    let e = entities.get(key);
    if (!e) {
      e = {
        entityCode: r.local_public_enterprise_code,
        facilityCode: r.facility_code,
        name: r.local_public_enterprise_name,
        businessType: r.cond_1_business_type,
        values: {},
        sourceRows: [],
      };
      entities.set(key, e);
    }
    assert.equal(
      e.name,
      r.local_public_enterprise_name,
      'entity name mismatch'
    );
    assert.equal(
      e.businessType,
      r.cond_1_business_type,
      'entity business type mismatch'
    );
    assert.equal(e.values[r.item_key], undefined, 'duplicate entity/field');
    e.values[r.item_key] = exactHundredths(r.item_value);
    e.sourceRows.push(index + 2);
    selectedCells++;
  }
  assert.equal(entities.size, expected.entities, 'missing entity');
  const selected = [];
  const excluded = [];
  const subsetParentWarnings = [];
  const subsetInternalWarnings = [];
  for (const e of entities.values()) {
    assert.equal(Object.keys(e.values).length, 9, 'missing pipe field');
    e.vector = PIPE_FIELDS.map(([key]) => e.values[key]);
    for (let i = 0; i < 3; i++)
      for (const offset of [3, 6]) {
        if (e.facilityCode === '006') {
          if (e.vector[i + offset] > e.vector[i])
            subsetInternalWarnings.push({
              entityCode: e.entityCode,
              name: e.name,
              field: PIPE_FIELDS[i + offset][0],
              valueHundredths: e.vector[i + offset],
              totalHundredths: e.vector[i],
            });
        } else
          assert.ok(
            e.vector[i + offset] <= e.vector[i],
            offset === 3 ? 'aged > total' : 'renewed > total'
          );
      }
    if (e.facilityCode === '006') {
      const parent = entities.get(e.entityCode + ':001');
      assert.ok(parent, 'orphan simplified-water subset');
      assert.equal(parent.businessType, '2:上水道事業と簡易水道事業');
      for (const [key] of PIPE_FIELDS)
        if (e.values[key] > parent.values[key])
          subsetParentWarnings.push({
            entityCode: e.entityCode,
            name: e.name,
            field: key,
            subsetHundredths: e.values[key],
            parentHundredths: parent.values[key],
          });
      excluded.push(e);
      continue;
    }
    selected.push(e);
  }
  assert.equal(selected.length, expected.selected);
  assert.equal(excluded.length, expected.subset);
  const rows = prefectures.map((pref) => {
    const group = selected.filter((e) =>
      e.entityCode.startsWith(pref.prefCode.slice(0, 2))
    );
    assert.ok(group.length, 'missing prefecture');
    const vector = PIPE_FIELDS.map((_, i) =>
      sum(group.map((e) => e.vector[i]))
    );
    const total = sum(vector.slice(0, 3)),
      aged = sum(vector.slice(3, 6)),
      renewed = sum(vector.slice(6, 9));
    assert.ok(total > 0, 'prefecture denominator zero');
    return {
      areaCode: pref.prefCode,
      areaName: pref.prefName,
      totalKm: total / 100,
      agedKm: aged / 100,
      renewedKm: renewed / 100,
      agingRate: Number(((aged / total) * 100).toFixed(6)),
      renewalRate: Number(((renewed / total) * 100).toFixed(6)),
      vectorHundredths: vector,
      businessCounts: Object.fromEntries(
        ['001', '002', '005'].map((code) => [
          code,
          group.filter((e) => e.facilityCode === code).length,
        ])
      ),
    };
  });
  const vector = PIPE_FIELDS.map((_, i) =>
    sum(rows.map((r) => r.vectorHundredths[i]))
  );
  const totals = [
    sum(vector.slice(0, 3)),
    sum(vector.slice(3, 6)),
    sum(vector.slice(6, 9)),
  ];
  const national = {
    totalKm: totals[0] / 100,
    agedKm: totals[1] / 100,
    renewedKm: totals[2] / 100,
    agingRate: Number(((totals[1] / totals[0]) * 100).toFixed(6)),
    renewalRate: Number(((totals[2] / totals[0]) * 100).toFixed(6)),
    vectorHundredths: vector,
  };
  return {
    rows,
    national,
    selected,
    excludedSubset: excluded,
    checks: {
      rawRows: rawRows.length,
      entities: entities.size,
      selectedBusinesses: selected.length,
      excludedSubsetBusinesses: excluded.length,
      sourcePipeCells: selectedCells,
      keptPipeCells: selected.length * 9,
      prefectures: rows.length,
      missingCells: 0,
      duplicateCells: 0,
      negativeLengths: 0,
      subsetParentCellChecks: excluded.length * 9,
      subsetParentWarnings,
      subsetInternalWarnings,
      sourceBusinessCounts: Object.fromEntries(
        ['001', '002', '005', '006'].map((code) => [
          code,
          [...entities.values()].filter((e) => e.facilityCode === code).length,
        ])
      ),
      zeroLengthBusinesses: selected
        .filter((e) => sum(e.vector.slice(0, 3)) === 0)
        .map((e) => ({
          entityCode: e.entityCode,
          facilityCode: e.facilityCode,
          name: e.name,
        })),
    },
  };
}
export function assertPinnedNational(result) {
  assert.deepEqual(
    [
      result.national.totalKm,
      result.national.agedKm,
      result.national.renewedKm,
    ],
    [812358.64, 213050.93, 4624.74],
    'official FY2024 national 3 lengths'
  );
  assert.deepEqual(
    result.national.vectorHundredths,
    [
      1929059, 4658879, 74647926, 590582, 1338715, 19375796, 8189, 17851,
      436434,
    ],
    'official FY2024 national 9 pipe cells'
  );
  assert.deepEqual(result.checks.sourceBusinessCounts, {
    '001': 1230,
    '002': 69,
    '005': 404,
    '006': 96,
  });
  // Known inconsistencies exist ONLY in excluded subset records. Never derive or repair the selected full accounts from these.
  const actual = result.checks.subsetParentWarnings
    .map((r) => [r.entityCode, r.field, r.subsetHundredths, r.parentHundredths])
    .sort();
  assert.deepEqual(
    actual,
    [
      ['012297', '列013', 286, 25],
      ['012297', '列060', 96, 0],
      ['072125', '列061', 300, 108],
      ['184233', '列013', 35542, 461],
      ['184233', '列014', 27306, 726],
      ['184233', '列015', 158211, 13027],
      ['184233', '列060', 3421, 461],
      ['184233', '列061', 2863, 632],
      ['184811', '列013', 231, 19],
      ['184811', '列060', 37, 19],
    ],
    'excluded-subset anomaly set changed'
  );
  assert.deepEqual(
    result.checks.subsetInternalWarnings
      .map((r) => [r.entityCode, r.field, r.valueHundredths, r.totalHundredths])
      .sort(),
    [
      ['203246', '列061', 29, 0],
      ['203246', '列062', 1215, 0],
    ],
    'excluded-subset internal anomaly set changed'
  );
}
export async function main() {
  const { values: o } = parseArgs({
    options: {
      'source-dir': {
        type: 'string',
        default: resolve(
          root,
          '.local/verification/themes/bridge-waterpipe-source'
        ),
      },
      'write-local': { type: 'boolean', default: false },
      'proposal-config-dir': { type: 'string' },
      out: {
        type: 'string',
        default: resolve(
          root,
          '.local/verification/themes/water-pipe-maintenance-source.json'
        ),
      },
    },
  });
  const sourceDir = resolve(o['source-dir']);
  const zipPath = resolve(sourceDir, SOURCE.file);
  let bytes;
  try {
    bytes = await readFile(zipPath);
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    const r = await fetch(SOURCE.url, { signal: AbortSignal.timeout(90000) });
    assert.ok(r.ok);
    bytes = Buffer.from(await r.arrayBuffer());
    assert.equal(sha(bytes), SOURCE.sha256);
    await mkdir(sourceDir, { recursive: true });
    await writeFile(zipPath, bytes);
  }
  assert.equal(sha(bytes), SOURCE.sha256, 'original ZIP changed');
  const csvBytes = execFileSync('unzip', ['-p', zipPath, SOURCE.member], {
    maxBuffer: 80 * 1024 * 1024,
  });
  assert.equal(sha(csvBytes), SOURCE.memberSha256, 'original CSV changed');
  const result = aggregatePipeRows(parsePipeCsv(csvBytes.toString('utf8')));
  assertPinnedNational(result);
  const {
    parseStatsValuesPayload,
  } = require('./packages/stats-r2/src/schemas.ts');
  const { buildRecipe } = require('./packages/data-configs/src/recipe.ts');
  const registry = o['proposal-config-dir']
    ? null
    : require('./packages/data-configs/src/registry.ts').METRICS_REGISTRY;
  assert.ok(
    !(o['proposal-config-dir'] && o['write-local']),
    'proposal config mode cannot write canonical R2'
  );
  const generatedAt = new Date().toISOString();
  const files = [];
  for (const m of METRICS) {
    const config =
      registry?.[m.key] ??
      Object.values(
        require(resolve(o['proposal-config-dir'], m.key + '.ts'))
      )[0];
    assert.equal(config.key, m.key);
    assert.ok(config.isActive);
    assert.equal(config.unit, m.unit);
    assert.deepEqual(config.entities, ['prefecture']);
    assert.deepEqual(config.years, { from: 2024, to: 2024 });
    assert.equal(config.yearFormat, 'fiscal');
    assert.equal(config.display.conversionFactor, 1);
    assert.equal(config.source.config.provenance.sourceSha256, SOURCE.sha256);
    assert.equal(config.source.config.valueField, m.field);
    const rows = result.rows.map((r) => ({
      areaCode: r.areaCode,
      areaName: r.areaName,
      value: r[m.field],
      unit: m.unit,
      yearCode: '2024',
      yearName: '2024年度（2025年3月31日末）',
    }));
    const payload = parseStatsValuesPayload({
      metricKey: m.key,
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
      key: `app/stats/${m.key}/values.json`,
      metricKey: m.key,
      rows,
      content: Buffer.from(JSON.stringify(payload)),
    });
  }
  if (o['write-local'])
    for (const file of files) {
      const path = resolve(root, '.local/r2', file.key);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, file.content);
    }
  const report = {
    generatedAt,
    status: o['write-local'] ? 'source-verified-staged' : 'source-verified',
    source: SOURCE,
    year: 2024,
    definition:
      '地方公営企業の法適用水道事業。末端給水001、用水供給002、独立会計の簡易水道005を合算。同一会計内簡易水道006は001の内数なので加算しない。法非適用・民営等は対象外。管路所在地の県ではなく事業団体の所属県別。',
    checks: {
      ...result.checks,
      nationalComponentMatches: 9,
      canonicalRows: 235,
    },
    national: result.national,
    rows: result.rows,
    entities: result.selected,
    excludedSubset: result.excludedSubset,
    files: files.map(({ content, rows, ...f }) => ({
      ...f,
      bytes: content.length,
      sha256: sha(content),
      rowCount: rows.length,
    })),
  };
  await mkdir(dirname(resolve(o.out)), { recursive: true });
  await writeFile(o.out, JSON.stringify(report, null, 2) + '\n');
  await writeFile(
    resolve(sourceDir, 'metric-values.json'),
    JSON.stringify(
      files.map(({ metricKey, rows }) => ({ metricKey, rows })),
      null,
      2
    ) + '\n'
  );
  console.log(
    JSON.stringify({
      status: report.status,
      metrics: 5,
      prefectures: 47,
      canonicalRows: 235,
      national: result.national,
      out: o.out,
    })
  );
}
if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
)
  await main();
