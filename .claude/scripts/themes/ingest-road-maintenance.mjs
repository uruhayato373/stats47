import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, promisify } from 'node:util';
import { execFile } from 'node:child_process';

// Intended location: .claude/scripts/themes/ingest-road-maintenance.mjs.
const require = createRequire(import.meta.url);
const prefectures = require('../../../packages/area/src/data/prefectures.json');
const { METRICS_REGISTRY } = require('../../../packages/data-configs/src/registry.ts');
const { buildRecipe } = require('../../../packages/data-configs/src/recipe.ts');
const { parseStatsValuesPayload } = require('../../../packages/stats-r2/src/schemas.ts');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const ROAD_MAINTENANCE_SOURCES = [
  { facility: 'bridge', name: '橋梁', unit: '橋', file: 'z1-2.pdf', url: 'https://www.mlit.go.jp/road/sisaku/yobohozen/pdf/r07/z1-2.pdf', sha256: 'e09f1abeeed01a215ee7b149bc5e51e6e0ea288ff085a889534b4f76a430d9e4', national: [725525, 319979, 354500, 50434, 612] },
  { facility: 'tunnel', name: 'トンネル', unit: '本', file: 'z2-2.pdf', url: 'https://www.mlit.go.jp/road/sisaku/yobohozen/pdf/r07/z2-2.pdf', sha256: '95763e42a8bec71f62943e20fa3c10419cfab2a8d5ebae807b522e789eafc209', national: [11353, 333, 8004, 2990, 26] },
];
const FIELDS = [['diagnosed-count', 0], ['condition-iii-count', 3], ['condition-iv-count', 4]];
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** Facility location is the prefecture; manager categories are already combined in this table. */
export function extractRoadMaintenance(text, facility) {
  const source = ROAD_MAINTENANCE_SOURCES.find((entry) => entry.facility === facility);
  assert.ok(source, `Unknown facility ${facility}`);
  for (const header of [`全${source.name}2`, '全道路管理者分', '2026年3月31日時点', '所在する', '都道府県', '判定区分', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ']) assert.ok(text.includes(header), `Missing header: ${header}`);
  assert.match(text, /2014[～〜]25年度/, 'Use latest diagnosis from 2014–2025, not the third-round-only results');
  const names = new Set(prefectures.map((pref) => pref.prefName));
  const rows = new Map();
  let national;
  for (const line of text.split('\n')) {
    const [name, ...cells] = line.trim().split(/\s+/);
    if (!names.has(name) && name !== '合計') continue;
    if (name === '合計' && cells.length === 0) continue; // Standalone multi-line header.
    assert.equal(cells.length, 5, `${name}: expected total, I, II, III, IV`);
    const values = cells.map((cell) => {
      assert.match(cell, /^(?:\d+|\d{1,3}(?:,\d{3})+)$/, `${name}: non-integer source value`);
      const value = Number(cell.replaceAll(',', ''));
      assert.ok(Number.isSafeInteger(value) && value >= 0);
      return value;
    });
    assert.equal(values[0], values.slice(1).reduce((sum, value) => sum + value, 0), `${name}: diagnosis partition`);
    if (name === '合計') { assert.equal(national, undefined, 'Duplicate national total'); national = values; }
    else { assert.ok(!rows.has(name), `Duplicate ${name}`); rows.set(name, values); }
  }
  assert.equal(rows.size, 47, 'Missing prefecture');
  assert.ok(national, 'Missing national row');
  assert.deepEqual(national, source.national, 'Official national total changed');
  for (let col = 0; col < 5; col++) assert.equal([...rows.values()].reduce((sum, values) => sum + values[col], 0), national[col], `National total column ${col}`);
  return { facility, national, rows: prefectures.map((pref) => ({ areaCode: pref.prefCode, areaName: pref.prefName, values: rows.get(pref.prefName) })) };
}

async function main() {
  const { values: options } = parseArgs({ options: {
    'write-local': { type: 'boolean', default: false },
    'source-dir': { type: 'string', default: '/tmp/stats47-road-maintenance-source' },
    out: { type: 'string', default: '.local/verification/themes/road-maintenance-source.json' },
    help: { type: 'boolean', default: false },
  } });
  if (options.help) { console.log('Requires Poppler pdftotext. Verify two pinned official diagnosis tables; --write-local writes six canonical local stats payloads. Third-round inspection counts are excluded.'); return; }
  const extracted = [];
  for (const source of ROAD_MAINTENANCE_SOURCES) {
    const path = resolve(options['source-dir'], source.file);
    let bytes;
    try { bytes = await readFile(path); } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const response = await fetch(source.url, { signal: AbortSignal.timeout(60000) });
      assert.ok(response.ok, `Source HTTP ${response.status}`);
      bytes = Buffer.from(await response.arrayBuffer());
      assert.equal(sha(bytes), source.sha256, 'Source changed; revalidate first');
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, bytes);
    }
    assert.equal(sha(bytes), source.sha256, 'Source hash mismatch');
    const { stdout } = await promisify(execFile)('pdftotext', ['-layout', path, '-'], { encoding: 'utf8', maxBuffer: 1024 * 1024 });
    extracted.push({ source, data: extractRoadMaintenance(stdout, source.facility) });
  }
  const generatedAt = new Date().toISOString();
  const payloads = [];
  // Build and validate every payload before --write-local can write the first one.
  for (const { source, data } of extracted) for (const [suffix, column] of FIELDS) {
    const key = `road-${source.facility}-${suffix}`;
    const config = METRICS_REGISTRY[key];
    assert.ok(config?.isActive && config.unit === source.unit && config.yearFormat === 'fiscal', `Invalid config ${key}`);
    assert.deepEqual(config.entities, ['prefecture']);
    assert.deepEqual(config.years, { from: 2025, to: 2025 });
    assert.equal(config.source.kind, 'external');
    assert.equal(config.source.config?.provenance?.pdfUrl, source.url);
    const rows = data.rows.map(({ values, ...row }) => ({ ...row, value: values[column], unit: config.unit, yearCode: '2025', yearName: '2025年度末（2026年3月31日）' }));
    const payload = parseStatsValuesPayload({ metricKey: key, entityKind: 'prefecture', rows, meta: { generatedAt, rowCount: 47, areaCount: 47, yearRange: ['2025', '2025'], recipe: buildRecipe(config) } });
    payloads.push({ key: `app/stats/${key}/values.json`, metricKey: key, content: JSON.stringify(payload), sourceMatchedRows: 47 });
  }
  if (options['write-local']) for (const file of payloads) {
    const destination = resolve(root, '.local/r2', file.key);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, file.content);
  }
  const files = payloads.map(({ content, ...file }) => ({ ...file, sha256: sha(content), bytes: Buffer.byteLength(content) }));
  const report = {
    generatedAt, status: options['write-local'] ? 'source-verified-staged' : 'source-verified',
    sources: ROAD_MAINTENANCE_SOURCES, snapshotDate: '2026-03-31', fiscalYear: 2025,
    geography: '施設が所在する都道府県。全道路管理者（国土交通省・高速道路会社・地方公共団体）の合計。',
    diagnosisPeriod: '2014〜2025年度の点検結果から施設ごとに最新の診断を採用。',
    validation: { prefecturesPerSource: 47, sourceTables: 2, gradePartitionRows: 96, nationalColumnSums: 10, comparedValues: 282 },
    files, limitation: '診断済総数を母数とする区分III/IVの件数。第三巡目（2024〜2025年度）の点検実施数・対象数は別の母集団であり使用しない。建設後50年経過数や修繕未着手数、倒壊確率ではない。',
  };
  const output = resolve(root, options.out);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ metrics: files.length, comparedValues: 282, output }));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error); process.exitCode = 1; });
