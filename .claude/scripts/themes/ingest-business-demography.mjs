import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const require = createRequire(import.meta.url);
const ExcelJS = require('exceljs');
const { METRICS_REGISTRY } = require('../../../packages/data-configs/src/registry.ts');
const { buildRecipe } = require('../../../packages/data-configs/src/recipe.ts');
const { parseStatsValuesPayload } = require('../../../packages/stats-r2/src/schemas.ts');
const prefectures = require('../../../packages/area/src/data/prefectures.json');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const KEY = {
  opening: 'business-opening-establishments',
  closure: 'business-closure-establishments',
  base: 'business-opening-base-establishments',
  openingRate: 'business-opening-rate',
  closureRate: 'business-closure-rate',
};

export const SOURCES = [
  { year: 2022, annualId: '000040256811', annualSha: 'a1e8f63460d1d7d4652973a2cce3c187ad2a02adf07187b7aca56b3b86a0fb34', marchId: '000032193604', marchSha: 'fd39db37aca914600ad90621d817fdad89eb41fadb47382afb774b9489f4a14e', national: [91397, 76646, 2354920], whitepaperRates: [3.9, 3.3] },
  { year: 2023, annualId: '000040221692', annualSha: '9670370c24768cfcd6ec8435c0a4c4634eb464cd7424d07323882529d228cdfb', marchId: '000040049732', marchSha: 'a0d361614df7ae68f2fcc69a85edcd2dd9f91ebb23e027ca1094c33ea783e7e4', national: [92601, 92718, 2372421], whitepaperRates: [3.9, 3.9] },
  { year: 2024, annualId: '000040366800', annualSha: '8b58e73b9cad2b13b142de8af28f1659f39fbed950d1667a350b195eded1bc42', marchId: '000040176935', marchSha: '5c3de3f157fd064468b6fbe58959eff4fd388059d810e4be5a2d40b3c0911f34', national: [89215, 89069, 2375575], whitepaperRates: [3.8, 3.7] },
];

const cell = (sheet, row, column) => {
  assert.ok(sheet, 'Missing source sheet');
  const raw = sheet.getRow(row).getCell(column).value;
  return raw && typeof raw === 'object' && 'result' in raw ? raw.result : raw;
};
const count = (raw) => {
  assert.ok(Number.isSafeInteger(raw) && raw >= 0, 'Missing/non-integer establishment count');
  return raw;
};
const shortName = (name) => name === '北海道' ? name : name.replace(/[都府県]$/, '');
const round1 = (value) => Math.round(value * 10) / 10;

/** The annual table's D column is a monthly mean, never the rate denominator. */
export function extractBusinessDemography(annual, march, year) {
  assert.ok(Number.isInteger(year) && year >= 2019 && year <= 2100);
  assert.equal(cell(annual, 2, 1), '都道府県労働局別適用状況〔事業所関係〕');
  assert.equal(cell(annual, 3, 4), `${year}年度`, 'Annual observation year changed');
  assert.equal(cell(march, 3, 4), `-令和${year - 2018}年3月-`, 'Denominator must be previous fiscal year-end');
  assert.equal(cell(annual, 4, 2), '保険関係新規成立事業所数');
  assert.equal(cell(annual, 4, 3), '保険関係消滅事業所数');
  assert.equal(cell(march, 4, 4), '月末適用事業所数', 'Do not use the annual monthly mean');
  assert.equal(cell(annual, 6, 2), '所');
  assert.equal(cell(annual, 6, 3), '所');
  assert.equal(cell(march, 5, 4), '所');
  assert.equal(cell(annual, 7, 1), '全国計');
  assert.equal(cell(march, 6, 1), '全国計');
  assert.equal(prefectures.length, 47);
  const series = new Map(Object.values(KEY).map((key) => [key, []]));
  const national = [count(cell(annual, 7, 2)), count(cell(annual, 7, 3)), count(cell(march, 6, 4))];
  const totals = [0, 0, 0];
  const lineage = [];
  for (const [i, pref] of prefectures.entries()) {
    const annualRow = 8 + i;
    const marchRow = 7 + i;
    assert.equal(cell(annual, annualRow, 1), shortName(pref.prefName), 'Annual prefecture order changed');
    assert.equal(cell(march, marchRow, 1), pref.prefName, 'Monthly prefecture order changed');
    const opening = count(cell(annual, annualRow, 2));
    const closure = count(cell(annual, annualRow, 3));
    const base = count(cell(march, marchRow, 4));
    assert.ok(base > 0, 'Missing/zero denominator');
    [opening, closure, base].forEach((n, index) => { totals[index] += n; });
    const values = [opening, closure, base, 100 * opening / base, 100 * closure / base];
    for (const [index, key] of Object.values(KEY).entries()) {
      series.get(key).push({ areaCode: pref.prefCode, areaName: pref.prefName, yearCode: String(year), yearName: key === KEY.base ? `${year}年度の前年度末（${year}年3月末）` : `${year}年度`, value: values[index], unit: index < 3 ? '所' : '%' });
    }
    lineage.push({ areaCode: pref.prefCode, annualCells: [`B${annualRow}`, `C${annualRow}`], denominatorCell: `D${marchRow}`, opening, closure, base });
  }
  assert.deepEqual(totals, national, 'Prefecture sums differ from official national totals');
  for (const [sheet, row] of [[annual, 55], [march, 54]]) {
    assert.ok([null, undefined, ''].includes(cell(sheet, row, 1)), 'Unexpected extra region');
  }
  return { series, lineage, national, nationalRates: [100 * national[0] / national[2], 100 * national[1] / national[2]] };
}

export function verifyWhitepaper2022(series) {
  // Official indexed figure 2-2-27: the first eleven prefectures and its stated ranks.
  const opening = series.get(KEY.openingRate);
  const closure = series.get(KEY.closureRate);
  const sample = [[3.4, 3.7], [2.6, 3.6], [2.4, 3.2], [3.3, 3.5], [2.3, 3.2], [2.5, 3.1], [3.2, 3.4], [3.8, 3.7], [3.6, 2.8], [3.5, 2.8], [4.6, 3.4]];
  for (const [i, expected] of sample.entries()) assert.deepEqual([round1(opening[i].value), round1(closure[i].value)], expected);
  const top = (rows, n) => [...rows].sort((a, b) => b.value - a.value).slice(0, n).map((r) => r.areaCode);
  assert.deepEqual(top(opening, 3), ['47000', '23000', '11000']);
  assert.deepEqual(top(closure, 4), ['35000', '23000', '42000', '47000']);
  return { comparedValues: 22, openingTop3: top(opening, 3), closureTop4: top(closure, 4) };
}

async function loadBook(source, kind, sourceDir) {
  const annual = kind === 'annual';
  const file = `${source.year}-${annual ? 'table25' : 'march-table1'}.xlsx`;
  const url = `https://www.e-stat.go.jp/stat-search/file-download?fileKind=0&statInfId=${source[`${kind}Id`]}`;
  const path = resolve(sourceDir, file);
  let bytes;
  try { bytes = await readFile(path); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
    assert.ok(response.ok, `Official source HTTP ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(sha(bytes), source[`${kind}Sha`], 'Official source changed; revalidate before ingestion');
    await writeFile(path, bytes);
  }
  assert.equal(sha(bytes), source[`${kind}Sha`], 'Official source SHA mismatch');
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(bytes);
  if (annual) assert.equal(cell(book.getWorksheet('第25表（１）注釈'), 1, 1), '［注］１）年度月平均である。');
  else assert.equal(cell(book.getWorksheet('注釈'), 1, 1), '〔注〕各月分は業務統計値であり変動があり得る。');
  return { sheet: book.getWorksheet(annual ? '第25表（１）' : '第1表'), source: { year: source.year, kind, file, url, sha256: sha(bytes) } };
}

async function main() {
  const { values: options } = parseArgs({ options: {
    'write-local': { type: 'boolean', default: false },
    'source-dir': { type: 'string', default: '/tmp/stats47-business-demography' },
    out: { type: 'string', default: '.local/verification/themes/business-demography-source.json' },
  } });
  await mkdir(options['source-dir'], { recursive: true });
  const series = new Map(Object.values(KEY).map((key) => [key, []]));
  const checks = [];
  const sources = [];
  for (const source of SOURCES) {
    const annual = await loadBook(source, 'annual', options['source-dir']);
    const march = await loadBook(source, 'march', options['source-dir']);
    sources.push(annual.source, march.source);
    const result = extractBusinessDemography(annual.sheet, march.sheet, source.year);
    assert.deepEqual(result.national, source.national, 'Official national counts changed');
    assert.deepEqual(result.nationalRates.map(round1), source.whitepaperRates, 'National rate differs from whitepaper');
    const whitepaper = source.year === 2022 ? verifyWhitepaper2022(result.series) : undefined;
    checks.push({ year: source.year, prefectures: 47, national: result.national, nationalRates: result.nationalRates, whitepaper, lineage: result.lineage });
    for (const [key, rows] of result.series) series.get(key).push(...rows);
  }
  const generatedAt = new Date().toISOString();
  const pending = [];
  // Validate every source and config before writing any canonical payload.
  for (const [key, rows] of series) {
    const config = METRICS_REGISTRY[key];
    assert.ok(config?.isActive && config.source.kind === 'external', `Register metric first: ${key}`);
    assert.deepEqual(config.years, { from: 2022, to: 2024 });
    assert.equal(config.yearFormat, 'fiscal');
    assert.equal(config.unit, rows[0].unit);
    if (key.endsWith('-rate')) {
      assert.equal(config.source.fetcherKey, 'calculated');
      assert.equal(config.calculation.denominatorKey, KEY.base);
      assert.equal(config.calculation.numeratorKey, key === KEY.openingRate ? KEY.opening : KEY.closure);
      assert.equal(config.calculation.scaleFactor, 100);
    }
    const relative = `app/stats/${key}/values.json`;
    const path = resolve(root, '.local/r2', relative);
    let previous = [];
    try { previous = parseStatsValuesPayload(JSON.parse(await readFile(path, 'utf8'))).rows; } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const merged = new Map(previous.map((row) => [`${row.areaCode}:${row.yearCode}`, row]));
    for (const row of rows) merged.set(`${row.areaCode}:${row.yearCode}`, row);
    const allRows = [...merged.values()].sort((a, b) => a.areaCode.localeCompare(b.areaCode) || Number(b.yearCode) - Number(a.yearCode));
    const years = [...new Set(allRows.map((row) => row.yearCode))].sort();
    const payload = parseStatsValuesPayload({ metricKey: key, entityKind: 'prefecture', rows: allRows, meta: { generatedAt, rowCount: allRows.length, areaCount: 47, yearRange: [years[0], years.at(-1)], recipe: buildRecipe(config) } });
    const bytes = JSON.stringify(payload);
    pending.push({ path, bytes, file: { key: relative, metricKey: key, sha256: sha(bytes), sourceMatchedRows: rows.length, rowCount: allRows.length, recipeHash: payload.meta.recipe.configHash } });
  }
  if (options['write-local']) for (const file of pending) {
    await mkdir(dirname(file.path), { recursive: true });
    await writeFile(file.path, file.bytes);
  }
  const report = { generatedAt, status: options['write-local'] ? 'source-verified-staged' : 'source-verified', sources, checks, files: pending.map((p) => p.file), observations: 705, rateValues: 282, notes: ['各年度内の成立・消滅数を前年度末事業所数で除す。年報D列の年度月平均は分母に使わない。', '白書2024図2-2-27は検索索引にある11県22値・上位順位を照合。図全47県の直接ファイル照合は403のため未実施。', '雇用保険の行政記録。企業単位や雇用者のいない事業者を捉えない。月報値は変動し得る。'], formulaSources: ['https://www.chusho.meti.go.jp/pamflet/hakusyo/2024/PDF/chusho/07Hakusyo_fuzokutoukei_web.pdf', 'https://www.chusho.meti.go.jp/pamflet/hakusyo/2026/PDF/chusho/00Hakusyo_zentai.pdf'] };
  const output = resolve(root, options.out);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ metrics: series.size, observations: report.observations, status: report.status, output }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error); process.exitCode = 1; });
