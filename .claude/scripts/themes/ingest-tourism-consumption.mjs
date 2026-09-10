import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, promisify } from 'node:util';
import { execFile } from 'node:child_process';
const require = createRequire(import.meta.url);
const ExcelJS = require('exceljs');
const prefectures = require('../../../packages/area/src/data/prefectures.json');
const { METRICS_REGISTRY } = require('../../../packages/data-configs/src/registry.ts');
const { buildRecipe } = require('../../../packages/data-configs/src/recipe.ts');
const { parseStatsValuesPayload } = require('../../../packages/stats-r2/src/schemas.ts');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const SOURCES = {
  domestic: { filename: '002009172.xlsx', url: 'https://www.mlit.go.jp/kankocho/content/002009172.xlsx', sha256: 'ed66bb0902fd76b0fe96987a50a7d317f16e6d98a7447eb32e682dbfe733fdad' },
  inbound: { filename: '001992606.xlsx', url: 'https://www.mlit.go.jp/kankocho/content/001992606.xlsx', sha256: '30fd4a32fad1eeeaaded068bfaa649fb82b0a27459c37b763fd7c555428e5260' },
  domesticOverview: { filename: '001981854.pdf', url: 'https://www.mlit.go.jp/kankocho/content/001981854.pdf', sha256: '1f392526509d5c9595a79411663c3110ba411a0ecf1dce3dabdf82d6af69ec9a' },
  inboundOverview: { filename: '001992584.pdf', url: 'https://www.mlit.go.jp/kankocho/content/001992584.pdf', sha256: '8175fa67d51abef77809ebfbed2685c93c6fa7820be7316a188d34a8a58f06ba' },
  domesticMethods: { filename: '001982651.pdf', url: 'https://www.mlit.go.jp/kankocho/content/001982651.pdf', sha256: 'e4310acaa176130d08a9900f9ea03b0df4c4d98178b45865545de8ee8b0253a4' },
  inboundMethods: { filename: '001977799.pdf', url: 'https://www.mlit.go.jp/kankocho/content/001977799.pdf', sha256: '6d606bc40c1329be63004ab61f8efe2f10fe2b9b33a201b977e31f9d7377c3b9' },
  inboundReport: { filename: '002003329.pdf', url: 'https://www.mlit.go.jp/kankocho/content/002003329.pdf', sha256: '874da709321209d440e91b88fafa0b7f8b1942bfb048eb9993ab8d2624071de0' },
};
export const FIELDS = [
  { key: 'domestic-travel-consumption-by-destination', source: 'domestic', population: '日本人', nationalOverview: 267845, regionalSum: 195502.128, amountDecimals: 3, unitDecimals: 3, visitorDecimals: 3, priceColumn: 'F' },
  { key: 'inbound-travel-consumption-by-destination', source: 'inbound', population: '訪日外国人', nationalOverview: 94549, nationalGeneralVisitors: 94110, regionalSum: 86419.07845932, amountDecimals: 8, unitDecimals: 4, visitorDecimals: 4, priceColumn: 'G' },
];
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const compact = (text) => String(text).normalize('NFKC').replace(/\s+/g, '');
const num = (value, label) => { assert.ok(typeof value === 'number' && Number.isFinite(value) && value >= 0, `${label}: missing or invalid numeric value`); return value; };
const close = (actual, expected, tolerance, label) => assert.ok(Math.abs(actual - expected) <= tolerance + 1e-7, `${label}: ${actual} vs ${expected}`);
const normalizeCell = (value) => value?.richText ? value.richText.map((x) => x.text).join('') : value;
const sheetText = (sheet) => { const rows = []; sheet.eachRow((row) => rows.push(row.values.map(normalizeCell).join(' '))); return compact(rows.join('\n')); };
const metroCodes = new Set(['11000','12000','13000','14000','23000','26000','27000','28000']);

/** Both series are official destination estimates, from distinct surveys. No own allocation or cross-survey sum. */
export function extractTourismConsumption(workbooks, texts) {
  const dom = compact(texts.domesticOverview);
  const ib = compact(texts.inboundOverview);
  assert.ok(dom.includes('2025年年間値(確報)') && dom.includes('26兆7,845億円'));
  assert.ok(ib.includes('2025年暦年の調査結果(確報)') && ib.includes('9兆4,549億円'));
  for (const phrase of ['クルーズ客以外の訪日外国人', '都道府県間交通費', '訪問地不明', '全国の訪日外国人旅行消費額とは一致しない']) assert.ok(ib.includes(phrase), `Inbound scope missing: ${phrase}`);
  const domesticMethods = compact(texts.domesticMethods);
  for (const phrase of ['日本国内居住者', '無作為抽出', '団体・パックツアー料金の10%', '旅行前後支出', '旅行会社マージン', '都道府県別泊数に応じて配分']) assert.ok(domesticMethods.includes(phrase), `Domestic method missing: ${phrase}`);
  const inboundMethods = compact(texts.inboundMethods);
  for (const phrase of ['B1地域調査', '訪日外客数', '都道府県別泊数に応じて配分', '都道府県間の交通費', '訪問地不明の支出']) assert.ok(inboundMethods.includes(phrase), `Inbound method missing: ${phrase}`);
  const report = compact(texts.inboundReport);
  for (const phrase of ['1年以上の滞在者', '永住者の配偶者等及び定住者', '出入国空海港の所在地が含まれ']) assert.ok(report.includes(phrase), `2025 inbound definition missing: ${phrase}`);
  // The PDF overview has the full 47-prefecture table, rounded to whole hundred-million yen.
  const pdfRows = new Map();
  const page = texts.inboundOverview.normalize('NFKC').split('\f').find((x) => x.includes('2025年暦年地域調査結果'));
  assert.ok(page);
  const pattern = /(北海道|東京都|京都府|大阪府|[^\s]+県)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,]+)\s+([\d,.]+)/g;
  for (const m of page.matchAll(pattern)) { assert.ok(!pdfRows.has(m[1])); pdfRows.set(m[1], Number(m[4].replaceAll(',', ''))); }
  assert.equal(pdfRows.size, 47, 'Inbound PDF prefecture count');
  const outputs = FIELDS.map((field) => {
    const workbook = workbooks[field.source];
    const amounts = workbook.getWorksheet('表1-3');
    const prices = workbook.getWorksheet('表1-2');
    const visits = workbook.getWorksheet('表1-1');
    assert.ok(amounts && prices && visits);
    for (const sheet of [amounts, prices, visits]) {
      assert.equal(sheet.getCell('A1').value, `【${field.population}】`);
      assert.equal(compact(sheet.getCell('A5').value), '2025年(令和7年)暦年');
      assert.ok(compact(sheet.getCell('B3').value).includes('【全目的】'));
      assert.equal(sheet.getCell('B8').value, '訪問地');
      const indices = [];
      sheet.eachRow((row, index) => { if (Number.isInteger(row.getCell('A').value)) indices.push(index); });
      assert.deepEqual(indices, Array.from({ length: 47 }, (_, i) => i + 9));
    }
    assert.equal(compact(amounts.getCell('J5').value), '(単位:億円)');
    assert.equal(compact(normalizeCell(amounts.getCell('C6').value)), '旅行消費額注1');
    assert.ok(sheetText(amounts).includes('都道府県間交通費は含まれない'));
    assert.ok(sheetText(amounts).includes('訪問地収入分が含まれる'));
    if (field.source === 'domestic') assert.ok(sheetText(visits).includes('宿泊客および日帰り客が含まれる'));
    let maxSubtotalError = 0;
    let maxMultiplicationError = 0;
    const rows = prefectures.map((pref, index) => {
      const row = index + 9;
      for (const sheet of [amounts, prices, visits]) { assert.equal(sheet.getCell(`A${row}`).value, index + 1); assert.equal(sheet.getCell(`B${row}`).value, pref.prefName); }
      const amount = num(amounts.getCell(`C${row}`).value, `amount ${pref.prefCode}`);
      const components = Array.from({ length: 7 }, (_, i) => num(amounts.getRow(row).getCell(i + 4).value, `component ${pref.prefCode}/${i}`));
      const subtotalError = Math.abs(amount - components.reduce((a, v) => a + v, 0));
      maxSubtotalError = Math.max(maxSubtotalError, subtotalError);
      // Eight independently rounded numbers: total plus seven components.
      close(amount, components.reduce((a, v) => a + v, 0), 8 * 0.5 * 10 ** -field.amountDecimals, `7 fee subtotal ${pref.prefCode}`);
      const unitPrice = num(prices.getCell(`C${row}`).value, `unit price ${pref.prefCode}`);
      assert.equal(unitPrice, visits.getCell(`${field.priceColumn}${row}`).value, `price table match ${pref.prefCode}`);
      const visitorCount = num(visits.getCell(`E${row}`).value, `visitors ${pref.prefCode}`);
      const sample = num(visits.getCell(`${field.source === 'domestic' ? 'C' : 'F'}${row}`).value, `sample ${pref.prefCode}`);
      assert.ok(Number.isInteger(sample) && sample > 0);
      const dp = 0.5 * 10 ** -field.unitDecimals;
      const dv = 0.5 * 10 ** -field.visitorDecimals;
      const tolerance = visitorCount * dp + unitPrice * dv + dp * dv + 0.5 * 10 ** -field.amountDecimals;
      close(amount, unitPrice * visitorCount, tolerance, `visitor x price rounding ${pref.prefCode}`);
      maxMultiplicationError = Math.max(maxMultiplicationError, Math.abs(amount - unitPrice * visitorCount));
      if (field.source === 'inbound') assert.equal(Math.round(amount), pdfRows.get(pref.prefName), `official PDF rounded amount ${pref.prefCode}`);
      return { areaCode: pref.prefCode, areaName: pref.prefName, value: amount, components, visitorCount, unitPrice, sample, sourceRow: row };
    });
    assert.equal(new Set(rows.map((r) => r.areaCode)).size, 47);
    assert.ok(new Set(rows.map((r) => r.value)).size > 1);
    const regionalSum = rows.reduce((sum, row) => sum + row.value, 0);
    close(regionalSum, field.regionalSum, 1e-6, 'Pinned 47-prefecture sum');
    assert.equal(amounts.getCell('B56').value, '都道府県間交通費');
    const interprefectureTransport = num(amounts.getCell('C56').value, 'Interprefecture transport');
    // National publications use a broader expenditure scope: equality would be a false invariant.
    assert.ok(regionalSum + interprefectureTransport < field.nationalOverview);
    if (field.source === 'inbound') {
      const metro = rows.filter((r) => metroCodes.has(r.areaCode)).reduce((a, r) => a + r.value, 0);
      close(metro, amounts.getCell('C59').value, 1e-6, 'Metro total');
      close(regionalSum - metro, amounts.getCell('C60').value, 1e-6, 'Other-region total');
      assert.equal(Math.round(regionalSum), 86419, 'Overview regional total');
      assert.ok(ib.includes('86,419') && ib.includes('94,110'));
    }
    return { metricKey: field.key, unit: '億円', rows, nationalComparison: { regionalSum, interprefectureTransport, publishedNational: field.nationalOverview, publishedNationalGeneralVisitors: field.nationalGeneralVisitors, nationalMinusRegionalSum: field.nationalOverview - regionalSum, equalityExpected: false, rationale: field.source === 'domestic' ? '県間交通費、旅行前後支出、旅行会社マージン等を県別に加算しないため全国総額と異なる。残差を特定費目として再配分しない。' : '県間交通費と訪問地不明支出等を県別に加算しない。県別は一般客、全国総額はクルーズ客も含む。残差を県へ再配分しない。' }, checks: { prefectures: 47, missing: 0, duplicates: 0, comparedFeeCells: 329, maxSubtotalError, visitorTimesPriceWithinRounding: true, maxMultiplicationError, officialPdfMatchedRows: field.source === 'inbound' ? 47 : 0 } };
  });
  return { year: '2025', yearName: '2025年（暦年）', outputs };
}

/** Visit samples are C, not the separate expenditure sample in F. Weighted visits are E. */
export function extractInboundVisits(workbook) {
  const sheet = workbook.getWorksheet('表1-1');
  assert.ok(sheet, 'Missing visit table');
  assert.equal(sheet.getCell('A1').value, '【訪日外国人】');
  assert.equal(compact(sheet.getCell('A5').value), '2025年(令和7年)暦年');
  assert.equal(compact(sheet.getCell('B3').value), '都道府県(47区分)別訪問者数および消費単価【全目的】');
  assert.equal(compact(sheet.getCell('E5').value), '(単位:万人)');
  assert.equal(sheet.getCell('C8').value, '標本サイズ（人）');
  assert.equal(sheet.getCell('E8').value, '訪問者数');
  assert.equal(sheet.getCell('B56').value, '標本サイズ（人）');
  assert.equal(sheet.getCell('C56').value, 101316, 'National unweighted visit sample');
  const indices = [];
  sheet.eachRow((row, index) => { if (Number.isInteger(row.getCell('A').value)) indices.push(index); });
  assert.deepEqual(indices, Array.from({ length: 47 }, (_, i) => i + 9));
  const rows = prefectures.map((pref, index) => {
    const row = index + 9;
    assert.equal(sheet.getCell(`A${row}`).value, index + 1);
    assert.equal(sheet.getCell(`B${row}`).value, pref.prefName);
    const visitors = num(sheet.getCell(`E${row}`).value, 'weighted visitors');
    const sample = num(sheet.getCell(`C${row}`).value, 'unweighted visit sample');
    const rate = num(sheet.getCell(`D${row}`).value, 'weighted visit rate');
    assert.ok(Number.isInteger(sample) && sample <= 101316 && rate <= 1, 'Invalid visit sample/rate');
    return { areaCode: pref.prefCode, areaName: pref.prefName, visitors, sample, rate };
  });
  return { nationalUnweightedSample: 101316, rows, outputs: [
    { metricKey: 'inbound-visitors-by-destination', unit: '万人', rows: rows.map(row => ({ ...row, value: row.visitors })) },
    { metricKey: 'inbound-visit-sample-by-destination', unit: '人', rows: rows.map(row => ({ ...row, value: row.sample })) },
  ] };
}

async function readPinned(spec, dir) {
  const path = resolve(dir, spec.filename);
  let bytes;
  try { bytes = await readFile(path); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const response = await fetch(spec.url, { signal: AbortSignal.timeout(60000) });
    assert.ok(response.ok, `Source HTTP ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(sha(bytes), spec.sha256, `${spec.filename}: source changed; revalidate first`);
    await mkdir(dirname(path), { recursive: true }); await writeFile(path, bytes);
  }
  assert.equal(sha(bytes), spec.sha256, `${spec.filename}: source SHA mismatch`);
  return { path, bytes };
}
async function main() {
  const { values: options } = parseArgs({ options: {
    'write-local': { type: 'boolean', default: false },
    'source-dir': { type: 'string', default: '.local/verification/themes/2026-09-10-tourism-consumption-source' },
    out: { type: 'string', default: '.local/verification/themes/tourism-consumption-source.json' },
    help: { type: 'boolean', default: false },
  } });
  if (options.help) { console.log('Verify pinned official destination expenditure sources. Requires pdftotext. --write-local writes canonical local stats; no remote writes.'); return; }
  const workbooks = {}; const texts = {};
  for (const [name, spec] of Object.entries(SOURCES)) {
    const source = await readPinned(spec, options['source-dir']);
    if (spec.filename.endsWith('.xlsx')) { const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(source.bytes); workbooks[name] = workbook; }
    else { const result = await promisify(execFile)('pdftotext', ['-layout', source.path, '-'], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }); texts[name] = result.stdout; }
  }
  const extracted = extractTourismConsumption(workbooks, texts);
  const inboundVisits = extractInboundVisits(workbooks.inbound);
  assert.ok(compact(texts.inboundReport).includes('101,316'), 'Published visit sample');
  const generatedAt = new Date().toISOString();
  const files = [...extracted.outputs, ...inboundVisits.outputs].map((output) => {
    const config = METRICS_REGISTRY[output.metricKey];
    assert.ok(config?.isActive && config.unit === output.unit && config.yearFormat === 'calendar');
    assert.ok(config.source.kind === 'external' && config.source.fetcherKey === 'manual');
    assert.equal(config.source.config.provenance.url, SOURCES[config.key.startsWith('domestic-') ? 'domestic' : 'inbound'].url);
    assert.deepEqual(config.years, { from: 2025, to: 2025 });
    const rows = output.rows.map(({ areaCode, areaName, value }) => ({ areaCode, areaName, value, unit: output.unit, yearCode: extracted.year, yearName: extracted.yearName }));
    const payload = parseStatsValuesPayload({ metricKey: config.key, entityKind: 'prefecture', rows, meta: { generatedAt, rowCount: 47, areaCount: 47, yearRange: [extracted.year, extracted.year], recipe: buildRecipe(config) } });
    const content = JSON.stringify(payload);
    return { key: `app/stats/${config.key}/values.json`, metricKey: config.key, sha256: sha(content), sourceMatchedRows: 47, content };
  });
  if (options['write-local']) for (const file of files) { const destination = resolve(root, '.local/r2', file.key); await mkdir(dirname(destination), { recursive: true }); await writeFile(destination, file.content); }
  const report = { generatedAt, status: options['write-local'] ? 'source-verified-staged' : 'source-verified', sources: SOURCES, inboundVisits: { nationalUnweightedSample: inboundVisits.nationalUnweightedSample, rows: inboundVisits.rows, comparison: 'Weighted visits differ from unweighted samples. Cross-prefecture duplicates retained.' }, year: extracted.year, metrics: extracted.outputs.map(({ rows, ...rest }) => rest), files: files.map(({ content, ...file }) => file), limitation: '日本人と訪日外国人は異なる標本調査の訪問地推計。全目的・宿泊日帰り込み、県間交通費を除外。訪日外国人はクルーズ客を除く。県内所得・地域への還元率・経済波及効果ではない。全国総額との一致は要求しない。' };
  const path = resolve(root, options.out); await mkdir(dirname(path), { recursive: true }); await writeFile(path, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ metrics: files.length, values: files.length * 47, output: path }));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error); process.exitCode = 1; });
