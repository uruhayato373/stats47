import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
const require = createRequire(import.meta.url);
const Excel = require('exceljs');
const prefectures = require('../../../packages/area/src/data/prefectures.json');
const { METRICS_REGISTRY } = require('../../../packages/data-configs/src/registry.ts');
const { buildRecipe } = require('../../../packages/data-configs/src/recipe.ts');
const { parseStatsValuesPayload } = require('../../../packages/stats-r2/src/schemas.ts');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const DEFINITIONS = [
  {
    "key": "dairy-cattle-holdings",
    "kind": "livestock",
    "file": "dairy-2025.xlsx",
    "sheet": "1(1)ア",
    "first": 26,
    "last": 72,
    "nationalRow": 12,
    "col": 4,
    "unitRow": 11,
    "unit": "戸",
    "year": 2025,
    "yearName": "2025年2月1日現在",
    "rounding": "holdings",
    "source": {
      "file": "dairy-2025.xlsx",
      "url": "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040372628&fileKind=0",
      "sha256": "72349168a1d502b14d0a69f0f7f8f10d544eac311a7b9e0dadf5c27eed34f9fa",
      "bytes": 22491
    }
  },
  {
    "key": "beef-cattle-count",
    "kind": "livestock",
    "file": "beef-2025.xlsx",
    "sheet": "2(1)ア",
    "first": 27,
    "last": 73,
    "nationalRow": 13,
    "col": 7,
    "unitRow": 12,
    "unit": "頭",
    "year": 2025,
    "yearName": "2025年2月1日現在",
    "rounding": "heads",
    "source": {
      "file": "beef-2025.xlsx",
      "url": "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040372636&fileKind=0",
      "sha256": "52fd71aadd332269dca66d4a888c3e9b54ca4893f186752cab4c5a592f6d42c6",
      "bytes": 33958
    }
  },
  {
    "key": "pig-count",
    "kind": "livestock",
    "file": "pigs-2024.xlsx",
    "sheet": "3(1)ア",
    "first": 25,
    "last": 71,
    "nationalRow": 11,
    "col": 7,
    "unitRow": 10,
    "unit": "頭",
    "year": 2024,
    "yearName": "2024年2月1日現在",
    "rounding": "heads",
    "source": {
      "file": "pigs-2024.xlsx",
      "url": "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040226135&fileKind=0",
      "sha256": "4854e18a9dcbbb959f5a3d73ff29803784ba355fe1af011fd421d8ad02aed018",
      "bytes": 21501
    }
  },
  {
    "key": "layer-hen-count",
    "kind": "livestock",
    "file": "layers-2024.xlsx",
    "sheet": "4(1)",
    "first": 25,
    "last": 71,
    "nationalRow": 11,
    "col": 11,
    "unitRow": 10,
    "unit": "千羽",
    "year": 2024,
    "yearName": "2024年2月1日現在",
    "rounding": "thousand-birds",
    "source": {
      "file": "layers-2024.xlsx",
      "url": "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040226152&fileKind=0",
      "sha256": "f24b2a564c498108c0c6e8beae5f4f6f18bb5e2b6c84591cf25a50fb506163a5",
      "bytes": 21450
    }
  },
  {
    "key": "food-manufacturing-establishments",
    "kind": "food",
    "file": "food-regional-2024-rebased.xlsx",
    "sheet": "第１表",
    "col": 8,
    "unit": "事業所",
    "year": 2024,
    "yearName": "2024年6月1日現在",
    "rounding": "exact",
    "source": {
      "file": "food-regional-2024-rebased.xlsx",
      "url": "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040480518&fileKind=0",
      "sha256": "f7a4a74ec5a652694acb88ca69624766bdfece81d7e9afb416ce46b4413fa78f",
      "bytes": 3745702
    }
  },
  {
    "key": "food-manufacturing-employees",
    "kind": "food",
    "file": "food-regional-2024-rebased.xlsx",
    "sheet": "第１表",
    "col": 9,
    "unit": "人",
    "year": 2024,
    "yearName": "2024年6月1日現在",
    "rounding": "exact",
    "source": {
      "file": "food-regional-2024-rebased.xlsx",
      "url": "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040480518&fileKind=0",
      "sha256": "f7a4a74ec5a652694acb88ca69624766bdfece81d7e9afb416ce46b4413fa78f",
      "bytes": 3745702
    }
  },
  {
    "key": "food-manufacturing-shipment-amount",
    "kind": "food",
    "file": "food-regional-2024-rebased.xlsx",
    "sheet": "第１表",
    "col": 12,
    "unit": "百万円",
    "year": 2023,
    "yearName": "2023年（2024年調査・再集計参考値）",
    "rounding": "million-yen",
    "source": {
      "file": "food-regional-2024-rebased.xlsx",
      "url": "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040480518&fileKind=0",
      "sha256": "f7a4a74ec5a652694acb88ca69624766bdfece81d7e9afb416ce46b4413fa78f",
      "bytes": 3745702
    }
  }
];
const sha = (value) => createHash('sha256').update(value).digest('hex');
const compact = (value) => String(value ?? '').replaceAll(/\s/g, '');
const sum = (items) => items.reduce((total, value) => total + value, 0);
const numeric = (value, address) => {
  assert.ok(Number.isSafeInteger(value) && value >= 0, `${address}: nonnumeric/suppressed/missing value`);
  return value;
};
function roundingQuantum(value, kind) {
  if (kind === 'exact') return 0;
  if (kind === 'million-yen' || kind === 'thousand-birds') return 1;
  // Official livestock notes: 7+ digits -> nearest 1,000; 5-6 -> nearest 100;
  // holdings 4 digits -> nearest 10, <=3 exact; heads <=4 -> nearest 10.
  if (value >= 1_000_000) return 1000;
  if (value >= 10_000) return 100;
  if (kind === 'holdings' && value < 1000) return 0;
  return 10;
}
function reconciled(rows, national, d) {
  const total = sum(rows.map((r) => r.value));
  const tolerance = (sum(rows.map((r) => roundingQuantum(r.value, d.rounding))) + roundingQuantum(national, d.rounding)) / 2;
  const delta = total - national;
  assert.ok(Math.abs(delta) <= tolerance, `${d.key}: nationwide sum difference ${delta} outside ${tolerance}`);
  return { national, prefectureSum: total, delta, tolerance, rounding: d.rounding, status: delta === 0 ? 'exact' : 'within-source-rounding' };
}
export function extractFoodLivestock(workbook, d) {
  const sheet = workbook.getWorksheet(d.sheet);
  assert.ok(sheet, `Missing sheet ${d.sheet}`);
  let rows, national;
  if (d.kind === 'livestock') {
    assert.match(compact(sheet.getCell('A1').value), new RegExp(d.year === 2025 ? '令和７年２月１日現在' : '令和６年２月１日現在'));
    const species = d.key.startsWith('dairy') ? '乳用牛' : d.key.startsWith('beef') ? '肉用牛' : d.key === 'pig-count' ? '豚' : '採卵鶏';
    assert.ok(compact(sheet.getCell('A1').value).includes(species));
    assert.equal(compact(sheet.getCell(d.first - 1, 1).value), '（都道府県）');
    assert.equal(compact(sheet.getCell(d.unitRow, d.col).value), d.unit);
    assert.equal(d.last - d.first + 1, 47);
    assert.equal(compact(sheet.getCell(d.nationalRow, 1).value), '全国');
    const headings = Array.from({ length: d.unitRow - 4 }, (_, i) => compact(sheet.getCell(i + 4, d.col).value)).join(' ');
    assert.ok(headings.includes(d.unit === '戸' ? '飼養戸数' : d.unit === '千羽' ? '成鶏めす' : '飼養頭数'));
    if (d.key === 'layer-hen-count') assert.ok(headings.includes('６か月以上'));
    rows = prefectures.map((pref, index) => {
      const rowNumber = d.first + index;
      const expectedName = pref.prefName === '北海道' ? pref.prefName : pref.prefName.replace(/[都府県]$/, '');
      assert.equal(compact(sheet.getCell(rowNumber, 1).value), expectedName, `${d.key}: prefecture row ${rowNumber}`);
      return { areaCode: pref.prefCode, areaName: pref.prefName, value: numeric(sheet.getCell(rowNumber, d.col).value, `${d.sheet}:${rowNumber}:${d.col}`), sourceRow: rowNumber, sourceColumn: d.col };
    });
    national = numeric(sheet.getCell(d.nationalRow, d.col).value, 'national');
  } else {
    assert.equal(d.kind, 'food');
    assert.ok(compact(sheet.getCell('B1').value).includes('【参考値】2024年経済構造実態調査'));
    assert.ok(compact(sheet.getCell('B1').value).includes('令和8(2026)年7月29日'));
    assert.ok(compact(sheet.getCell('B5').value).includes('全事業所'));
    const noteSheet = workbook.getWorksheet('留意事項');
    assert.ok(compact(noteSheet?.getCell('C3').value).includes('2024)年6月1日現在'));
    assert.ok(compact(noteSheet?.getCell('C3').value).includes('2023)年1月'));
    assert.ok(compact(noteSheet?.getCell('C4').value).includes('個人経営を含まない'));
    assert.ok(compact(noteSheet?.getCell('C11').value).includes('基礎調査の結果を反映'));
    assert.equal(compact(sheet.getCell(8, d.col).value), d.unit === '事業所' ? '事業所数' : d.unit === '人' ? '従業者数' : '製造品出荷額等');
    if (d.unit !== '事業所') assert.equal(compact(sheet.getCell(9, d.col).value), d.unit);
    const selected = new Map();
    sheet.eachRow((row) => {
      if (row.getCell(4).value !== '09') return;
      const code = String(row.getCell(6).value);
      // Official regional table also has designated cities with two-digit codes >47.
      if (!/^\d{2}$/.test(code) || Number(code) > 47) return;
      assert.equal(row.getCell(5).value, '食料品製造業');
      assert.equal(String(row.getCell(2).value), '2023000000');
      assert.ok(!selected.has(code), `Duplicate ${code}`);
      selected.set(code, { name: row.getCell(7).value, value: numeric(row.getCell(d.col).value, `${d.sheet}:${row.number}:${d.col}`), sourceRow: row.number, sourceColumn: d.col });
    });
    assert.equal(selected.size, 48);
    assert.equal(selected.get('00')?.name, '全国計');
    national = selected.get('00').value;
    rows = prefectures.map((pref) => {
      const found = selected.get(pref.prefCode.slice(0, 2));
      assert.equal(found?.name, pref.prefName);
      return { areaCode: pref.prefCode, areaName: pref.prefName, value: found.value, sourceRow: found.sourceRow, sourceColumn: found.sourceColumn };
    });
    assert.equal(d.year, d.col === 12 ? 2023 : 2024, 'Accounting reference year must not replace stock reference date');
  }
  assert.equal(rows.length, 47);
  assert.equal(new Set(rows.map((row) => row.areaCode)).size, 47);
  return { rows, verification: reconciled(rows, national, d) };
}
async function sourceWorkbook(d, directory) {
  const path = resolve(directory, d.source.file);
  let bytes;
  try { bytes = await readFile(path); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const response = await fetch(d.source.url, { signal: AbortSignal.timeout(60000) });
    assert.ok(response.ok, `Source HTTP ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(sha(bytes), d.source.sha256, 'Official source changed: revalidate first');
    await mkdir(dirname(path), { recursive: true }); await writeFile(path, bytes);
  }
  assert.equal(sha(bytes), d.source.sha256, `Source hash mismatch: ${d.source.file}`);
  const workbook = new Excel.Workbook(); await workbook.xlsx.load(bytes); return workbook;
}
async function main() {
  const { values: options } = parseArgs({ options: {
    'write-local': { type: 'boolean', default: false },
    'source-dir': { type: 'string', default: '/tmp/stats47-food-industry-source' },
    out: { type: 'string', default: '.local/verification/themes/food-livestock-source.json' },
    metric: { type: 'string' },
  } });
  const selected = options.metric ? DEFINITIONS.filter((d) => d.key === options.metric) : DEFINITIONS;
  assert.ok(selected.length > 0, 'Unknown metric');
  const workbooks = new Map(), files = [], generatedAt = new Date().toISOString();
  for (const d of selected) {
    const config = METRICS_REGISTRY[d.key];
    assert.ok(config?.isActive, `${d.key}: register reviewed config first`);
    assert.equal(config.unit, d.unit); assert.equal(config.yearFormat, 'calendar');
    assert.deepEqual(config.years, { from: d.year, to: d.year });
    assert.equal(config.source?.config?.provenance?.sha256, d.source.sha256);
    if (!workbooks.has(d.source.file)) workbooks.set(d.source.file, await sourceWorkbook(d, options['source-dir']));
    const { rows, verification } = extractFoodLivestock(workbooks.get(d.source.file), d);
    const payload = parseStatsValuesPayload({ metricKey: d.key, entityKind: 'prefecture', rows: rows.map(({ sourceRow, sourceColumn, ...row }) => ({ ...row, unit: d.unit, yearCode: String(d.year), yearName: d.yearName })), meta: { generatedAt, rowCount: 47, areaCount: 47, yearRange: [String(d.year), String(d.year)], recipe: buildRecipe(config) } });
    const content = JSON.stringify(payload);
    files.push({ key: `app/stats/${d.key}/values.json`, metricKey: d.key, content, sha256: sha(content), source: d.source, sourceCells: rows.map(({ value, ...row }) => row), year: d.year, yearName: d.yearName, unit: d.unit, verification });
  }
  // Validate every requested series before staging any local canonical file.
  if (options['write-local']) for (const file of files) {
    const destination = resolve(root, '.local/r2', file.key);
    await mkdir(dirname(destination), { recursive: true }); await writeFile(destination, file.content);
  }
  const report = { generatedAt, status: 'PASS', localStaged: options['write-local'], rows: files.length * 47, files: files.map(({ content, ...file }) => file) };
  const out = resolve(options.out); await mkdir(dirname(out), { recursive: true }); await writeFile(out, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ status: report.status, metrics: files.length, rows: report.rows, localStaged: report.localStaged, out }));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
