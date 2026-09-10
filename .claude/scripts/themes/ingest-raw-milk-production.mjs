#!/usr/bin/env node
/** 2025 final raw-milk annual production; never writes remotely. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
const require = createRequire(import.meta.url);
const ExcelJS = require('exceljs');
const prefectures = require('../../../packages/area/src/data/prefectures.json');
const { buildRecipe } = require('../../../packages/data-configs/src/recipe.ts');
const {
  parseStatsValuesPayload,
} = require('../../../packages/stats-r2/src/schemas.ts');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const SOURCES = [
  {
    filename: 'milk-2025.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040477606&fileKind=0',
    sha256: 'a385a247bd2bcba11e0b50975484bf7595a76230e6c1603c45aec9c6f4f260bf',
    bytes: 17498,
  },
  {
    filename: 'milk-users.pdf',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040477603&fileKind=2',
    sha256: 'bd716fbb803bfea58b646b164bc97d5a69715f6564eaae7d895b5434636bfcaa',
    bytes: 425603,
  },
];
export const EXPECTED_SOURCE = {
  kind: 'external',
  fetcherKey: 'manual',
  displayName: '農林水産省「令和7年牛乳乳製品統計」',
  url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040477606&fileKind=0',
  config: {
    source: {
      name: '農林水産省「令和7年牛乳乳製品統計」',
      url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040477606&fileKind=0',
    },
    provenance: {
      url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040477606&fileKind=0',
      table: '第2表 生乳生産量（都道府県別）（月別）',
      valueColumn: 'g011-r07-002!E13:E59（年計・実数）',
      dataYear: '2025年1〜12月',
      accessedAt: '2026-09-10',
      sourceSha256:
        'a385a247bd2bcba11e0b50975484bf7595a76230e6c1603c45aec9c6f4f260bf',
      extraction:
        '全国E12、47県E13:E59。H:Sの月別12列は年計照合専用で年次観測値へ混在させない。全角ｔをtと表記し数量換算しない。',
      verification:
        '県名・順序・47県・欠測・重複・非負整数・年計=12か月計（全国と各県）、年計と各月の47県計=全国を完全一致で検査。',
      restore:
        'node --import tsx .claude/scripts/themes/ingest-raw-milk-production.mjs --write-local',
      definitionUrl:
        'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040477603&fileKind=2',
      definitionSha256:
        'bd716fbb803bfea58b646b164bc97d5a69715f6564eaae7d895b5434636bfcaa',
      releaseStatus: 'final',
      releasedAt: '2026-07-28',
      releaseIndexUrl:
        'https://www.e-stat.go.jp/stat-search/files?layout=datalist&lid=000001487124&page=1',
      sourceUnit: 'ｔ',
      prefectureRows: [13, 59],
      nationalRow: 12,
      geography:
        '生産地の都道府県。県間移出入量を把握して生産量と処理量を区別する。',
      surveyUniverse:
        '乳製品製造を行う全処理場・工場等の基礎調査と、乳製品工場の全数及び月間受乳量300t以上、県間移出入等の条件を用いる有意抽出の月別調査。農家全数調査とは呼ばない。',
    },
  },
};
export const sha = (value) => createHash('sha256').update(value).digest('hex');
export function assertHash(value, expected) {
  assert.equal(sha(value), expected, 'source SHA changed');
}
const clean = (v) =>
  String(v ?? '')
    .normalize('NFKC')
    .replace(/\s/g, '');
const number = (v) => {
  assert.ok(
    typeof v === 'number' && Number.isSafeInteger(v) && v >= 0,
    'missing/suppressed/noninteger/negative production'
  );
  return v;
};
export function parseMilk(workbook) {
  assert.equal(workbook.worksheets.length, 1, 'sheet count');
  const s = workbook.worksheets[0];
  assert.equal(s.name, 'g011-r07-002', '2025 source sheet');
  assert.equal(s.rowCount, 60, 'unexpected extra/missing rows');
  assert.equal(
    clean(s.getCell('A1').value),
    '2生乳生産量(都道府県別)(月別)',
    'table title'
  );
  assert.equal(clean(s.getCell('E6').value), '年計', 'annual column');
  assert.equal(clean(s.getCell('E8').value), '実数', 'count not percentage');
  assert.equal(clean(s.getCell('E10').value), 't', 'annual unit');
  for (let month = 1; month <= 12; month++) {
    assert.equal(
      clean(s.getCell(7, month + 7).value),
      month === 1 ? '1月' : String(month),
      'month header'
    );
    assert.equal(clean(s.getCell(10, month + 7).value), 't', 'monthly unit');
  }
  const all = [{ prefCode: '00000', prefName: '全国' }, ...prefectures];
  const records = all.map((p, i) => {
    const row = i + 12;
    const name =
      p.prefName === '北海道' || i === 0 ? p.prefName : p.prefName.slice(0, -1);
    assert.equal(clean(s.getCell(row, 2).value), name, 'prefecture identity');
    assert.equal(s.getCell(row, 3).value, i + 1, 'area sequence');
    assert.equal(s.getCell(row, 20).value, i + 1, 'area trailing sequence');
    const value = number(s.getCell(row, 5).value);
    const months = Array.from({ length: 12 }, (_, m) =>
      number(s.getCell(row, m + 8).value)
    );
    assert.equal(
      months.reduce((a, b) => a + b, 0),
      value,
      'annual/month total'
    );
    return { areaCode: p.prefCode, areaName: p.prefName, value, months };
  });
  const [national, ...rows] = records;
  assert.equal(
    new Set(rows.map((r) => r.areaCode)).size,
    47,
    '47 unique prefectures'
  );
  assert.equal(
    rows.reduce((a, b) => a + b.value, 0),
    national.value,
    'national annual sum'
  );
  for (let m = 0; m < 12; m++)
    assert.equal(
      rows.reduce((a, b) => a + b.months[m], 0),
      national.months[m],
      'national monthly sum'
    );
  assert.equal(national.value, 7418222, 'official 2025 national production');
  return {
    rows,
    national,
    checks: {
      prefectures: 47,
      missing: 0,
      duplicates: 0,
      annualRows: 47,
      annualMonthlyIdentities: 48,
      nationalSumIdentities: 13,
      nationalAnnual: national.value,
      nationalDifference: 0,
      period: '2025-01/2025-12',
      unit: 't',
      releaseStatus: 'final',
    },
  };
}
export function validateConfig(c) {
  assert.equal(c?.key, 'raw-milk-production', 'config key');
  assert.equal(c.isActive, true, 'inactive config');
  assert.equal(c.unit, 't', 'config unit');
  assert.equal(c.category, 'agriculture', 'config category');
  assert.deepEqual(c.entities, ['prefecture'], 'config geography');
  assert.deepEqual(c.years, { from: 2025, to: 2025 }, 'config period');
  assert.equal(c.yearFormat, 'calendar', 'calendar period');
  assert.equal(c.display.conversionFactor, 1, 'no value conversion');
  assert.deepEqual(c.source, EXPECTED_SOURCE, 'config source definition');
}
async function sourceBytes(src, dir) {
  const path = resolve(dir, src.filename);
  let bytes;
  try {
    bytes = await readFile(path);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const response = await fetch(src.url, {
      signal: AbortSignal.timeout(90000),
    });
    assert.ok(response.ok, 'official source HTTP ' + response.status);
    bytes = Buffer.from(await response.arrayBuffer());
    assertHash(bytes, src.sha256);
    await mkdir(dir, { recursive: true });
    await writeFile(path, bytes);
  }
  assertHash(bytes, src.sha256);
  return bytes;
}
export async function main() {
  const { values: o } = parseArgs({
    options: {
      'write-local': { type: 'boolean', default: false },
      'source-dir': {
        type: 'string',
        default: resolve(
          root,
          '.local/verification/themes/2026-09-10-livestock-bridge-source'
        ),
      },
      'config-file': { type: 'string' },
      out: {
        type: 'string',
        default: resolve(
          root,
          '.local/verification/themes/raw-milk-production-source.json'
        ),
      },
    },
  });
  const config = o['config-file']
    ? JSON.parse(await readFile(o['config-file'], 'utf8')).find(
        (c) => c.key === 'raw-milk-production'
      )
    : require('../../../packages/data-configs/src/registry.ts')
        .METRICS_REGISTRY['raw-milk-production'];
  validateConfig(config);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await sourceBytes(SOURCES[0], o['source-dir']));
  await sourceBytes(SOURCES[1], o['source-dir']);
  const result = parseMilk(workbook);
  const generatedAt = new Date().toISOString();
  const payload = parseStatsValuesPayload({
    metricKey: config.key,
    entityKind: 'prefecture',
    rows: result.rows.map(({ months, ...r }) => ({
      ...r,
      yearCode: '2025',
      yearName: '2025年（確報）',
      unit: 't',
    })),
    meta: {
      generatedAt,
      rowCount: 47,
      areaCount: 47,
      yearRange: ['2025', '2025'],
      recipe: buildRecipe(config),
    },
  });
  const content = JSON.stringify(payload),
    key = 'app/stats/raw-milk-production/values.json';
  if (o['write-local']) {
    const path = resolve(root, '.local/r2', key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
  }
  const report = {
    generatedAt,
    status: o['write-local'] ? 'source-verified-staged' : 'source-verified',
    sources: SOURCES,
    checks: result.checks,
    file: { key, sha256: sha(content), rowCount: 47 },
    national: result.national,
    records: result.rows,
  };
  const output = resolve(o.out);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(
    JSON.stringify({ status: report.status, metricCount: 1, rows: 47, output })
  );
  return report;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await main();
