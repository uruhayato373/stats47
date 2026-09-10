import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const require = createRequire(import.meta.url);
const ExcelJS = require('exceljs');
const unzipper = require('unzipper');
const { METRICS_REGISTRY } = require('../../../packages/data-configs/src/registry.ts');
const { buildRecipe } = require('../../../packages/data-configs/src/recipe.ts');
const { parseStatsValuesPayload } = require('../../../packages/stats-r2/src/schemas.ts');
const prefectures = require('../../../packages/area/src/data/prefectures.json');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const SOURCES = [
  { file: '000944043.zip', sha256: 'abfbe65fc0874f7b80932425bd2eac59bf826b21091b1986ddd626aca0978e52', memberSha256: 'eaef92d55e29e00790795606b371767acde4d9496fc38924678ba52a5131c846', firstRow: 9, period: '令和４年度実績' },
  { file: '001048599.zip', sha256: 'd7f9b9e2f77830423f6fa7894d6d2c7b777b4103381460c654b5d7b71dbcc528', memberSha256: '819b6f4e8e5724a380cf37de491cb0702889949f9b24764149441c57fa2ebf09', firstRow: 8, period: '令和5年度実績' },
];
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const value = (sheet, r, c) => {
  const raw = sheet.getRow(r).getCell(c).value;
  return raw && typeof raw === 'object' && 'result' in raw ? raw.result : raw;
};
const number = (raw) => {
  // R05 stores application counts as decimal strings; blanks are still missing.
  if (typeof raw === 'string' && /^\d+(?:\.\d+)?$/.test(raw)) raw = Number(raw);
  assert.equal(typeof raw, 'number', 'Missing source value');
  assert.ok(Number.isFinite(raw) && raw >= 0);
  return raw;
};
const PROCEDURES = [...Array.from({ length: 22 }, (_, i) => 7 + 6 * i), ...Array.from({ length: 8 }, (_, i) => 295 + 6 * i)];

/** Online availability is a stock; applications are a fiscal-year flow. */
export function extractDx(r5, r6) {
  for (const [index, sheet] of [r5, r6].entries()) {
    assert.ok(String(value(sheet, 1, 1)).includes(SOURCES[index].period), 'Observation year changed');
    for (const [i, pref] of prefectures.entries()) {
      const r = SOURCES[index].firstRow + i;
      // R05 includes the check digit (six characters); R06 uses five characters.
      const code = String(value(sheet, r, 2));
      assert.equal(code.length, index === 0 ? 6 : 5);
      assert.equal(code.slice(0, 5), pref.prefCode);
      assert.equal(value(sheet, r, 4), pref.prefName);
    }
  }
  assert.equal(value(r5, 6, 25), '地方税申告手続（eLTAX）');
  assert.equal(value(r5, 6, 115), '職員採用試験申込');
  assert.ok(String(value(r6, 6, 21)).includes('自動車税環境性能割'));
  const series = new Map();
  const add = (key, pref, datum) => series.set(key, [...(series.get(key) ?? []), { areaCode: pref.prefCode, areaName: pref.prefName, value: datum }]);
  for (const [i, pref] of prefectures.entries()) {
    const r = i + 9;
    for (const [key, col] of [['prefectural-eltax-online-application-rate', 30], ['prefectural-recruitment-online-application-rate', 120]]) {
      const total = number(value(r5, r, col - 2));
      const online = number(value(r5, r, col - 1));
      const rate = Math.round(number(value(r5, r, col)) * 1000) / 10;
      assert.ok(total > 0 && online <= total && Math.abs(rate - 100 * online / total) <= 0.05000001);
      add(key, pref, rate);
    }
    let applicable = 0;
    let online = 0;
    for (const c of PROCEDURES) {
      const exists = value(r5, r, c);
      const state = value(r5, r, c + 1);
      assert.ok(['有', '無'].includes(exists), 'Unknown applicability; do not treat missing as zero');
      if (exists === '有') {
        assert.ok(['済', '未'].includes(state), 'Unknown online status');
        applicable++;
        if (state === '済') online++;
      }
    }
    for (const c of [343, 349]) {
      assert.ok(String(value(r5, 6, c)).includes('市区町村のみ'));
      assert.ok([null, undefined, ''].includes(value(r5, r, c)));
    }
    assert.ok(applicable > 0 && online <= applicable);
    add('prefectural-dx-online-procedure-count', pref, online);
    add('prefectural-dx-applicable-procedure-count', pref, applicable);
    add('prefectural-dx-online-procedure-rate', pref, 100 * online / applicable);
    const total = number(value(r6, i + 8, 23));
    const count = number(value(r6, i + 8, 24));
    const rate = number(value(r6, i + 8, 25));
    assert.ok(total > 0 && count <= total && Math.abs(rate - 100 * count / total) < 1e-8);
    add('prefectural-auto-environment-tax-application-count', pref, total);
    add('prefectural-auto-environment-tax-online-application-count', pref, count);
    add('prefectural-auto-environment-tax-online-application-rate', pref, rate);
  }
  assert.equal(series.size, 8);
  return series;
}

async function main() {
  const { values: options } = parseArgs({ options: {
    'write-local': { type: 'boolean', default: false },
    'source-dir': { type: 'string', default: '/tmp/stats47-dx-sources' },
    out: { type: 'string', default: '.local/verification/themes/dx-source.json' },
  } });
  await mkdir(options['source-dir'], { recursive: true });
  const sheets = [];
  for (const source of SOURCES) {
    const file = resolve(options['source-dir'], source.file);
    let bytes;
    try { bytes = await readFile(file); } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const response = await fetch(`https://www.soumu.go.jp/main_content/${source.file}`, { signal: AbortSignal.timeout(60000) });
      assert.ok(response.ok, `Source HTTP ${response.status}`);
      bytes = Buffer.from(await response.arrayBuffer());
      assert.equal(sha(bytes), source.sha256, 'Source changed; revalidate before ingestion');
      await writeFile(file, bytes);
    }
    assert.equal(sha(bytes), source.sha256);
    const archive = await unzipper.Open.buffer(bytes);
    const matches = [];
    for (const entry of archive.files.filter((entry) => entry.path.endsWith('.xlsx'))) {
      const member = await entry.buffer();
      if (sha(member) === source.memberSha256) matches.push(member);
    }
    assert.equal(matches.length, 1);
    const book = new ExcelJS.Workbook();
    await book.xlsx.load(matches[0]);
    sheets.push(book.getWorksheet('都道府県'));
  }
  const series = extractDx(...sheets);
  const generatedAt = new Date().toISOString();
  const files = [];
  for (const [key, values] of series) {
    const config = METRICS_REGISTRY[key];
    assert.ok(config?.isActive && config.source.kind === 'external');
    const snapshot = key.startsWith('prefectural-dx-');
    const year = key.startsWith('prefectural-auto-') || snapshot ? '2023' : '2022';
    assert.equal(config.years.from, Number(year));
    assert.equal(config.yearFormat, snapshot ? 'calendar' : 'fiscal');
    const payload = parseStatsValuesPayload({ metricKey: key, entityKind: 'prefecture', rows: values.map((row) => ({ ...row, unit: config.unit, yearCode: year, yearName: snapshot ? '2023年4月1日調査時点' : `${year}年度` })), meta: { generatedAt, rowCount: 47, areaCount: 47, yearRange: [year, year], recipe: buildRecipe(config) } });
    const bytes = JSON.stringify(payload);
    const relative = `app/stats/${key}/values.json`;
    files.push({ key: relative, metricKey: key, sha256: sha(bytes), sourceMatchedRows: 47 });
    if (options['write-local']) {
      const path = resolve(root, '.local/r2', relative);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, bytes);
    }
  }
  const report = { generatedAt, status: options['write-local'] ? 'source-verified-staged' : 'source-verified', sources: SOURCES, files, comparedValues: 376, notes: ['利用実績は原表A1の年度を採用。公開日から観測年度を推測しない。', 'オンライン化は2023年4月1日調査時点、利用率とは別指標。'] };
  const output = resolve(root, options.out);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ metrics: series.size, values: 376, status: report.status, output }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error); process.exitCode = 1; });
