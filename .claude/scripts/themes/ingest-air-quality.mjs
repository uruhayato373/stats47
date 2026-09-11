import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, promisify } from 'node:util';

const require = createRequire(import.meta.url);
const prefectures = require('../../../packages/area/src/data/prefectures.json');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const run = promisify(execFile);
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const AIR_SOURCE = Object.freeze({
  url: 'https://www.env.go.jp/content/000406532.pdf',
  sha256: 'a04e612926da645e56cfffc06b145c2366e5965a0e7d163c4531f66593a1ef53',
  file: '000406532.pdf',
  pdfPage: 31,
  publicationDate: '2026-05-26',
});
const YEARS = [2022, 2023, 2024];
const NATIONAL = [[878, 855, 854], [879, 867, 867], [880, 874, 870]];
const FIELDS = [
  ['pm25-general-station-count', 'total'],
  ['pm25-valid-general-station-count', 'valid'],
  ['pm25-compliant-general-station-count', 'compliant'],
  ['pm25-general-station-compliance-rate', 'rate'],
];

export function verifyAirSource(bytes) {
  assert.equal(sha(bytes), AIR_SOURCE.sha256, 'Official PDF changed; revalidate before ingestion');
}

/** Reference 2 has general stations first; roadside station columns are never aggregated. */
export function extractAirQualityTable(text) {
  const normalized = text.normalize('NFKC');
  assert.match(normalized, /参考2\s+微小粒子状物質\(PM2\.5\)の都道府県別の環境基準達成状況/, 'Wrong PM2.5 table');
  const firstRow = normalized.search(/北\s*海\s*道\s+\d/);
  assert.ok(firstRow >= 0, 'Missing first prefecture');
  const header = normalized.slice(0, firstRow);
  assert.match(header, /一般局\s+自排局/, 'Station scope/order changed');
  assert.deepEqual([...header.matchAll(/令和([456])年度/g)].map((m) => m[1]), ['4', '5', '6', '4', '5', '6'], 'Fiscal year columns changed');
  assert.equal((header.match(/達成率/g) ?? []).length, 6, 'Rate columns changed');
  assert.equal((header.match(/総測/g) ?? []).length, 6, 'Total station columns changed');
  assert.equal((header.match(/有効/g) ?? []).length, 6, 'Valid station columns changed');
  const names = new Map(prefectures.map((row) => [row.prefName, row.prefCode]));
  const rows = [];
  let national;
  for (const line of normalized.slice(firstRow).split('\n')) {
    const match = line.match(/^([^\d]+?)\s+(\d.*)$/);
    if (!match) continue;
    const name = match[1].replace(/\s/g, '');
    assert.ok(names.has(name) || name === '全国', `Unexpected source row: ${name}`);
    const cells = match[2].trim().split(/\s+/).slice(0, 12);
    assert.equal(cells.length, 12, 'Missing general-station source cell');
    const values = YEARS.map((year, i) => {
      const [t, v, c, r] = cells.slice(i * 4, i * 4 + 4);
      for (const n of [t, v, c]) assert.match(n, /^\d+$/, 'Non-integer/missing station count');
      assert.match(r, /^\d+(?:\.\d+)?%$/, 'Missing published rate');
      const [total, valid, compliant, publishedRate] = [Number(t), Number(v), Number(c), Number(r.slice(0, -1))];
      assert.ok(valid > 0 && compliant <= valid && valid <= total, 'Invalid numerator/denominator');
      const rate = 100 * compliant / valid;
      assert.ok(Math.abs(rate - publishedRate) <= 0.050000001, 'Published rate differs from numerator/denominator');
      return { year, total, valid, compliant, publishedRate, rate };
    });
    if (name === '全国') {
      assert.equal(national, undefined, 'Duplicate national row');
      national = values;
    } else rows.push({ areaCode: names.get(name), areaName: name, values });
  }
  assert.deepEqual(rows.map((row) => row.areaName), prefectures.map((row) => row.prefName), '47 prefectures missing, duplicated or out of order');
  assert.ok(national, 'Missing national row');
  for (const [i, expected] of NATIONAL.entries()) {
    assert.deepEqual(['total', 'valid', 'compliant'].map((field) => national[i][field]), expected, 'Official national counts changed');
    assert.deepEqual(['total', 'valid', 'compliant'].map((field) => rows.reduce((sum, row) => sum + row.values[i][field], 0)), expected, 'Prefecture sums differ from national totals');
  }
  return { rows, checks: { prefecturesPerYear: 47, years: YEARS, rateMatches: 141, nationalCounts: national, missing: 0, duplicates: 0 } };
}

async function main() {
  const { values: options } = parseArgs({ options: {
    help: { type: 'boolean', default: false },
    'write-local': { type: 'boolean', default: false },
    'source-dir': { type: 'string', default: '/tmp/stats47-air-quality-sources' },
    out: { type: 'string', default: '.local/verification/themes/air-quality-source.json' },
  } });
  if (options.help) {
    console.log('Usage: node --import tsx .claude/scripts/themes/ingest-air-quality.mjs [--write-local] [--source-dir DIR] [--out FILE]\nRequires Node.js, repository dependencies, and Poppler pdftotext on PATH. Downloads the pinned official PDF when absent. Without --write-local, validates only and writes the audit report. Writes canonical values.json + recipe to .local/r2 only; never uploads.');
    return;
  }
  await mkdir(options['source-dir'], { recursive: true });
  const file = resolve(options['source-dir'], AIR_SOURCE.file);
  let bytes;
  try { bytes = await readFile(file); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const response = await fetch(AIR_SOURCE.url, { signal: AbortSignal.timeout(60000) });
    assert.ok(response.ok, `Official source HTTP ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
    verifyAirSource(bytes);
    await writeFile(file, bytes);
  }
  verifyAirSource(bytes);
  const { stdout } = await run('pdftotext', ['-layout', '-f', String(AIR_SOURCE.pdfPage), '-l', String(AIR_SOURCE.pdfPage), file, '-'], { maxBuffer: 2 * 1024 * 1024 });
  const result = extractAirQualityTable(stdout);
  const { METRICS_REGISTRY } = require('../../../packages/data-configs/src/registry.ts');
  const { buildRecipe } = require('../../../packages/data-configs/src/recipe.ts');
  const { parseStatsValuesPayload } = require('../../../packages/stats-r2/src/schemas.ts');
  const generatedAt = new Date().toISOString();
  // Validate every config/payload before writing any canonical data.
  const payloads = FIELDS.map(([key, field]) => {
    const config = METRICS_REGISTRY[key];
    assert.ok(config?.isActive && config.source.kind === 'external', `Missing active metric: ${key}`);
    assert.equal(config.source.config.provenance.pdfUrl, AIR_SOURCE.url);
    assert.equal(config.source.config.provenance.pdfPage, AIR_SOURCE.pdfPage);
    assert.equal(config.yearFormat, 'fiscal');
    assert.deepEqual(config.years, { from: 2022, to: 2024 });
    assert.equal(config.unit, field === 'rate' ? '%' : '局');
    const rows = result.rows.flatMap((row) => row.values.map((entry) => ({ areaCode: row.areaCode, areaName: row.areaName, yearCode: String(entry.year), yearName: `${entry.year}年度`, value: entry[field], unit: config.unit })));
    const payload = parseStatsValuesPayload({ metricKey: key, entityKind: 'prefecture', rows, meta: { generatedAt, rowCount: 141, areaCount: 47, yearRange: ['2022', '2024'], recipe: buildRecipe(config) } });
    return { key: `app/stats/${key}/values.json`, metricKey: key, bytes: JSON.stringify(payload) };
  });
  const files = [];
  for (const payload of payloads) {
    files.push({ key: payload.key, metricKey: payload.metricKey, sha256: sha(payload.bytes), sourceMatchedRows: 141 });
    if (options['write-local']) {
      const path = resolve(root, '.local/r2', payload.key);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, payload.bytes);
    }
  }
  const report = { generatedAt, status: options['write-local'] ? 'source-verified-staged' : 'source-verified', source: AIR_SOURCE, ...result.checks, comparedValues: 564, sourceRows: result.rows, files,
    notes: ['一般環境大気測定局のみ。自排局は含まない。住民の曝露割合ではない。', '有効局は等価性の確認された測定機器を使用し年間測定日数250日以上。達成局は長期・短期基準の両方を満たす。', '率は100×達成局数÷有効測定局数。公表の小数1桁丸め率とは分けて検算。', '2023年度の達成率は47県すべて100%。欠測補間ではなく公表結果。'] };
  const output = resolve(root, options.out);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ metrics: 4, values: 564, status: report.status, output }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error); process.exitCode = 1; });
