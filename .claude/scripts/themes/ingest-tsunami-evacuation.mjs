import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, promisify } from 'node:util';

const require = createRequire(import.meta.url);
const { METRICS_REGISTRY } = require('../../../packages/data-configs/src/registry.ts');
const { buildRecipe } = require('../../../packages/data-configs/src/recipe.ts');
const { parseStatsValuesPayload } = require('../../../packages/stats-r2/src/schemas.ts');
const prefectures = require('../../../packages/area/src/data/prefectures.json');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const run = promisify(execFile);
const BASE_URL = 'https://www.bousai.go.jp/jishin/tsunami/hinan/pdf/';
const KEYS = ['tsunami-evacuation-building-count', 'tsunami-evacuation-tower-count'];
export const NON_APPLICABLE = ['09000', '10000', '11000', '19000', '20000', '25000', '29000'];
export const SOURCES = [
  { file: '02_r504.pdf', sha256: '463cfcb50bd5b06b691c3cbafe46b11cd2ef5e9377601b3a9696c42b0def9205' },
  { file: '03_r504.pdf', sha256: 'c97dfe7dc64719ad044628bb2971dd336f11d537e4d1de6104173ee170021e5e' },
  { file: '04_sankour304.pdf', sha256: 'c8db05326aab2a8d030bdf7d285470698a07c94829fe1f5fa13728bd57ff088c' },
  { file: 'sanko_1.pdf', sha256: '325f52dd0731a508f5a9a476eafbd10caf9d2c8e00a4c7db8e8dce87325e2107' },
];
const integer = (text) => {
  assert.match(text, /^(?:0|[1-9]\d*|[1-9]\d{0,2}(?:,\d{3})+)$/, 'Missing/non-integer facility count');
  const number = Number(text.replaceAll(',', ''));
  assert.ok(Number.isSafeInteger(number) && number >= 0);
  return number;
};

/** Keep explicit non-applicability separate from observed zeros, including inland Gifu. */
export function extractTsunamiPrefectures(text, year) {
  assert.ok([2021, 2023].includes(year));
  const firstPage = text.split('\f')[0].normalize('NFKC');
  assert.ok(firstPage.includes(`都道府県別(令和${year - 2018}年4月時点)`), 'Source observation date changed');
  assert.ok(firstPage.includes('津波避難ビル(棟)') && firstPage.includes('津波避難タワー等(棟)'), 'Source unit/definition changed');
  const rows = [];
  let national;
  for (const line of firstPage.split(/\r?\n/)) {
    if (/^\s*\d+\s/.test(line)) {
      const fields = line.trim().split(/\s+/);
      assert.equal(fields.length, 4, 'Missing facility source cell');
      const [number, name, building, tower] = fields;
      const pref = prefectures[rows.length];
      assert.ok(pref, 'Extra prefecture');
      assert.equal(Number(number), rows.length + 1, 'Prefecture order changed');
      assert.equal(name, pref.prefName, 'Prefecture attribution changed');
      assert.equal(building === '対象外', tower === '対象外', 'Partial non-applicability');
      const nonApplicable = building === '対象外';
      assert.equal(nonApplicable, NON_APPLICABLE.includes(pref.prefCode), 'Non-applicable prefecture set changed');
      rows.push({ areaCode: pref.prefCode, areaName: name, yearCode: String(year), yearName: `${year}年4月1日現在`, values: nonApplicable ? [null, null] : [integer(building), integer(tower)], sourceRow: Number(number) });
    } else if (/^\s*計\s/.test(line)) {
      assert.equal(national, undefined, 'Duplicate national row');
      const fields = line.trim().split(/\s+/);
      assert.equal(fields.length, 3);
      national = fields.slice(1).map(integer);
    }
  }
  assert.equal(rows.length, 47, 'Expected all 47 prefecture rows');
  assert.deepEqual(rows.filter((r) => r.values[0] === null).map((r) => r.areaCode), NON_APPLICABLE);
  const sums = [0, 1].map((i) => rows.reduce((sum, row) => sum + (row.values[i] ?? 0), 0));
  assert.deepEqual(sums, national, 'Prefecture sums differ from national totals');
  return { rows, national };
}

/** The separate municipality table provides an independent aggregation check. */
export function verifyTsunamiMunicipalities(text, prefectureRows, year, expectedCount) {
  assert.ok(text.normalize('NFKC').includes(`市区町村別(令和${year - 2018}年4月時点)`), 'Municipality observation date changed');
  const names = new Set(prefectures.map((p) => p.prefName));
  const totals = new Map(prefectures.map((p) => [p.prefName, [0, 0]]));
  const seen = new Set();
  let applicable = 0;
  let nonApplicable = 0;
  for (const line of text.split(/\r?\n/)) {
    const fields = line.trim().split(/\s+/);
    if (!names.has(fields[0])) continue;
    assert.equal(fields.length, 4, 'Missing municipality source cell');
    const [pref, municipality, building, tower] = fields;
    const key = `${pref}:${municipality}`;
    assert.ok(!seen.has(key), 'Duplicate municipality');
    seen.add(key);
    assert.equal(building === '-', tower === '-', 'Partial municipality non-applicability');
    if (building === '-') { nonApplicable++; continue; }
    applicable++;
    [building, tower].map(integer).forEach((value, i) => { totals.get(pref)[i] += value; });
  }
  assert.equal(applicable, expectedCount, 'Municipality survey population changed');
  assert.equal(seen.size, 1456, 'Municipality source coverage changed');
  for (const row of prefectureRows) {
    assert.deepEqual(totals.get(row.areaName), row.values.map((n) => n ?? 0), `Municipality sum differs: ${row.areaName}`);
  }
  return { applicable, nonApplicable, listed: seen.size, prefectureMatches: 47 };
}

async function sourceText(source, directory) {
  const path = resolve(directory, source.file);
  let bytes;
  try { bytes = await readFile(path); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const response = await fetch(BASE_URL + source.file, { signal: AbortSignal.timeout(60000) });
    assert.ok(response.ok, `Official source HTTP ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(sha(bytes), source.sha256, 'Official source changed; revalidate before ingestion');
    await writeFile(path, bytes);
  }
  assert.equal(sha(bytes), source.sha256, 'Official source SHA mismatch');
  const { stdout } = await run('pdftotext', ['-layout', path, '-'], { encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 });
  return stdout;
}

async function main() {
  const { values: options } = parseArgs({ options: {
    'write-local': { type: 'boolean', default: false },
    'source-dir': { type: 'string', default: '/tmp/stats47-tsunami-sources' },
    out: { type: 'string', default: '.local/verification/themes/tsunami-evacuation-source.json' },
    help: { type: 'boolean', default: false },
  } });
  if (options.help) { console.log('Requires Poppler pdftotext on PATH. Verifies pinned official PDFs, dates, explicit non-applicability and municipality sums. --write-local upserts local canonical stats only.'); return; }
  await mkdir(options['source-dir'], { recursive: true });
  const texts = new Map();
  for (const source of SOURCES) texts.set(source.file, await sourceText(source, options['source-dir']));
  const definition = texts.get('sanko_1.pdf').normalize('NFKC').replace(/\s+/g, '');
  assert.ok(definition.includes('令和5年4月1日現在'));
  assert.ok(definition.includes('40都道府県678市区町村'));
  assert.ok(definition.includes('14726') && definition.includes('550'));
  assert.ok(definition.includes('洪水対応用') && definition.includes('約1,200棟減少'), 'Series-break note changed');
  assert.ok(definition.includes('福島県大熊町を除く'), 'Survey exclusion changed');
  const results = [];
  for (const year of [2021, 2023]) {
    const combined = texts.get('04_sankour304.pdf');
    const result = extractTsunamiPrefectures(year === 2021 ? combined : texts.get('02_r504.pdf'), year);
    assert.deepEqual(result.national, year === 2021 ? [15304, 502] : [14726, 550], 'Official national totals changed');
    const municipalText = year === 2021 ? combined.split('\f').slice(1).join('\f') : texts.get('03_r504.pdf');
    const municipalities = verifyTsunamiMunicipalities(municipalText, result.rows, year, year === 2021 ? 675 : 678);
    results.push({ year, ...result, municipalities });
  }
  const generatedAt = new Date().toISOString();
  const pending = [];
  for (const [index, key] of KEYS.entries()) {
    const config = METRICS_REGISTRY[key];
    assert.ok(config?.isActive && config.source.kind === 'external' && config.source.fetcherKey === 'manual', `Register metric first: ${key}`);
    assert.deepEqual(config.source.config.nonApplicablePrefectures.codes, NON_APPLICABLE);
    assert.equal(config.source.config.nonApplicablePrefectures.reason, '内閣府調査の対象外（原表明記）');
    assert.deepEqual(config.years, { years: [2021, 2023] });
    assert.equal(config.yearFormat, 'calendar');
    assert.equal(config.unit, '棟');
    const rows = results.flatMap((result) => result.rows.map(({ values, sourceRow, ...row }) => ({ ...row, value: values[index], unit: config.unit })));
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
    pending.push({ path, bytes, file: { key: relative, metricKey: key, sha256: sha(bytes), rowCount: allRows.length, sourceMatchedRows: 94, observedValues: 80, nonApplicableValues: 14, recipeHash: payload.meta.recipe.configHash } });
  }
  // Complete every source/config check before any canonical write.
  if (options['write-local']) for (const file of pending) {
    await mkdir(dirname(file.path), { recursive: true });
    await writeFile(file.path, file.bytes);
  }
  const report = { generatedAt, status: options['write-local'] ? 'source-verified-staged' : 'source-verified', sources: SOURCES.map((s) => ({ ...s, url: BASE_URL + s.file })), checks: results, nonApplicablePrefectures: NON_APPLICABLE, files: pending.map((p) => p.file), notes: ['施設整備数であり、浸水人口・危険度の代用ではない。', '対象外7県をnull、岐阜などの公表0を0として保持。両年の対象県集合は一致。', '2023年は洪水対応用約1200棟を計上対象から除外した自治体の影響を含む。2021年との減少を施設撤去と解釈しない。', '2023年調査は福島県大熊町を除く40県678市区町村。2024-08-05訂正版。'] };
  const output = resolve(root, options.out);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ metrics: 2, rows: 188, observedValues: 160, nonApplicableValues: 28, status: report.status, output }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error); process.exitCode = 1; });
