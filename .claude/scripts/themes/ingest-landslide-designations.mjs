import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, promisify } from 'node:util';
import { execFile } from 'node:child_process';

const require = createRequire(import.meta.url);
const prefectures = require('../../../packages/area/src/data/prefectures.json');
const { METRICS_REGISTRY } = require('../../../packages/data-configs/src/registry.ts');
const { buildRecipe } = require('../../../packages/data-configs/src/recipe.ts');
const { parseStatsValuesPayload } = require('../../../packages/stats-r2/src/schemas.ts');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const SOURCE = {
  url: 'https://www.mlit.go.jp/mizukokudo/sabo/content/001982570.pdf',
  sha256: '6c65c5fe6ded42729c37fb031d83a4325a45d8201d0a01b4c99791bace3ceb45',
  observationDate: '2026-06-30',
};
const FIELDS = [
  ['landslide-warning-zone-count', 6], ['landslide-special-warning-zone-count', 7],
  ['debris-flow-warning-zone-count', 0], ['debris-flow-special-warning-zone-count', 1],
  ['steep-slope-warning-zone-count', 2], ['steep-slope-special-warning-zone-count', 3],
  ['landslip-warning-zone-count', 4], ['landslip-special-warning-zone-count', 5],
];
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** The source order is not JIS order; identify every row by its exact prefecture name. */
export function extractLandslideDesignations(text) {
  assert.match(text, /2026\/6\/30時点/);
  for (const heading of ['全国における土砂災害警戒区域等の指定状況', '土石流', '急傾斜地の崩壊', '地滑り', 'うち土砂災害特別', '基礎調査']) assert.ok(text.includes(heading));
  const names = new Map(prefectures.map((pref) => [pref.prefName, pref]));
  const rows = new Map();
  let national;
  for (const line of text.split('\n')) {
    const [name, ...cells] = line.trim().split(/\s+/);
    if (!names.has(name) && name !== '合計') continue;
    assert.equal(cells.length, 12, `${name}: columns changed`);
    const values = cells.map((cell) => {
      assert.match(cell, /^(?:\d+|\d{1,3}(?:,\d{3})+)$/);
      const number = Number(cell.replaceAll(',', ''));
      assert.ok(Number.isSafeInteger(number) && number >= 0);
      return number;
    });
    assert.equal(values[0] + values[2] + values[4], values[6], `${name}: warning subtotal`);
    assert.equal(values[1] + values[3] + values[5], values[7], `${name}: special subtotal`);
    for (const c of [0, 2, 4, 6]) assert.ok(values[c + 1] <= values[c], `${name}: special is a subset`);
    if (name === '合計') { assert.equal(national, undefined); national = values; }
    else { assert.ok(!rows.has(name), `Duplicate ${name}`); rows.set(name, values); }
  }
  assert.equal(rows.size, 47, 'Missing prefecture');
  assert.ok(national);
  for (let c = 0; c < 12; c++) assert.equal([...rows.values()].reduce((sum, row) => sum + row[c], 0), national[c], `National total column ${c}`);
  return { national: national.slice(0, 8), rows: prefectures.map((pref) => ({ areaCode: pref.prefCode, areaName: pref.prefName, values: Object.fromEntries(FIELDS.map(([key, col]) => [key, rows.get(pref.prefName)[col]])) })) };
}

async function main() {
  const { values: options } = parseArgs({ options: {
    'write-local': { type: 'boolean', default: false },
    source: { type: 'string', default: '/tmp/stats47-landslide-designations.pdf' },
    out: { type: 'string', default: '.local/verification/themes/landslide-source.json' },
    help: { type: 'boolean', default: false },
  } });
  if (options.help) { console.log('Requires Poppler pdftotext on PATH. Verify pinned official PDF; --write-local writes canonical local stats only.'); return; }
  const path = resolve(options.source);
  let bytes;
  try { bytes = await readFile(path); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const response = await fetch(SOURCE.url, { signal: AbortSignal.timeout(60000) });
    assert.ok(response.ok, `Source HTTP ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(sha(bytes), SOURCE.sha256, 'Source changed; revalidate first');
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, bytes);
  }
  assert.equal(sha(bytes), SOURCE.sha256);
  const { stdout } = await promisify(execFile)('pdftotext', ['-layout', path, '-'], { encoding: 'utf8', maxBuffer: 1024 * 1024 });
  const extracted = extractLandslideDesignations(stdout);
  const generatedAt = new Date().toISOString();
  const files = [];
  for (const [key] of FIELDS) {
    const config = METRICS_REGISTRY[key];
    assert.ok(config?.isActive && config.unit === '区域' && config.yearFormat === 'calendar');
    const rows = extracted.rows.map(({ values, ...row }) => ({ ...row, value: values[key], unit: config.unit, yearCode: '2026', yearName: '2026年6月30日時点' }));
    const payload = parseStatsValuesPayload({ metricKey: key, entityKind: 'prefecture', rows, meta: { generatedAt, rowCount: 47, areaCount: 47, yearRange: ['2026', '2026'], recipe: buildRecipe(config) } });
    const content = JSON.stringify(payload);
    const relative = `app/stats/${key}/values.json`;
    files.push({ key: relative, metricKey: key, sha256: sha(content), sourceMatchedRows: 47 });
    if (options['write-local']) { const destination = resolve(root, '.local/r2', relative); await mkdir(dirname(destination), { recursive: true }); await writeFile(destination, content); }
  }
  const report = { generatedAt, status: options['write-local'] ? 'source-verified-staged' : 'source-verified', source: SOURCE, national: extracted.national, files, comparedValues: 376, limitation: 'Official designation counts only; not polygon areas, exposed population or hazard severity. The reference survey columns have a different date and are excluded.' };
  const output = resolve(root, options.out);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ metrics: files.length, values: 376, output }));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error); process.exitCode = 1; });
