import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
const require = createRequire(import.meta.url);
const prefectures = require('../../../packages/area/src/data/prefectures.json');
const { METRICS_REGISTRY } = require('../../../packages/data-configs/src/registry.ts');
const { buildRecipe } = require('../../../packages/data-configs/src/recipe.ts');
const { parseStatsValuesPayload } = require('../../../packages/stats-r2/src/schemas.ts');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const sha = value => createHash('sha256').update(value).digest('hex');
export const SOURCES = [
  {
    "id": "0004005665",
    "filename": "0004005665-data.json",
    "parameters": {
      "statsDataId": "0004005665",
      "cdCat01": "41,80",
      "cdCat02": "0",
      "cdTab": "102-2021,113-2021,114-2021,115-2021",
      "limit": "100000"
    },
    "statisticalDataSha256": "f565914ff3607a835858a105d38c6b64f1792e67b7f136895b5d7b4dc5edc1b1",
    "rawSha256": "0985713aa9b5fe0f78061459345418e077bc8273b6945f5a66eeb61b332cc503"
  },
  {
    "id": "0004006330",
    "filename": "0004006330-data.json",
    "parameters": {
      "statsDataId": "0004006330",
      "cdCat01": "41,80",
      "cdCat02": "0",
      "cdTab": "201-2021,205-2021,211-2021,250-2021,252-2021,255-2021,258-2021,259-2021,260-2021,261-2021",
      "limit": "100000"
    },
    "statisticalDataSha256": "9bf8d3901c018c87cb9755029c3d4fe5e4cdf8b2063b43d0937f4d0b5ae0f286",
    "rawSha256": "10c3a518b6046ee7689069bdd08be7faf272c1d39b939167396e23c57a076ea5"
  }
];
export const FIELDS = [
  {
    "key": "media-production-establishments",
    "id": "0004005665",
    "industry": "41",
    "tab": "102-2021",
    "unit": "事業所",
    "year": 2021,
    "financial": false
  },
  {
    "key": "media-production-employees",
    "id": "0004005665",
    "industry": "41",
    "tab": "113-2021",
    "unit": "人",
    "year": 2021,
    "financial": false
  },
  {
    "key": "media-production-revenue",
    "id": "0004006330",
    "industry": "41",
    "tab": "250-2021",
    "unit": "百万円",
    "year": 2020,
    "financial": true
  },
  {
    "key": "media-production-net-value-added",
    "id": "0004006330",
    "industry": "41",
    "tab": "261-2021",
    "unit": "百万円",
    "year": 2020,
    "financial": true
  },
  {
    "key": "amusement-industry-establishments",
    "id": "0004005665",
    "industry": "80",
    "tab": "102-2021",
    "unit": "事業所",
    "year": 2021,
    "financial": false
  },
  {
    "key": "amusement-industry-employees",
    "id": "0004005665",
    "industry": "80",
    "tab": "113-2021",
    "unit": "人",
    "year": 2021,
    "financial": false
  },
  {
    "key": "amusement-industry-revenue",
    "id": "0004006330",
    "industry": "80",
    "tab": "250-2021",
    "unit": "百万円",
    "year": 2020,
    "financial": true
  },
  {
    "key": "amusement-industry-net-value-added",
    "id": "0004006330",
    "industry": "80",
    "tab": "261-2021",
    "unit": "百万円",
    "year": 2020,
    "financial": true
  }
];
export const DEFINITIONS = {
  "url": "https://www.stat.go.jp/data/e-census/2021/kekka/pdf/k_outline.pdf",
  "filename": "definitions.pdf",
  "sha256": "e86231685dd7516d0192ecc2cf91547df3622eeef88fdab6ba07777acdb009ad"
};
const PREF_CODES = new Set(prefectures.map(p => p.prefCode));
const asArray = value => Array.isArray(value) ? value : [value];
const sum = values => values.reduce((a, b) => a + b, 0);
export function parseSource(raw, source) {
  assert.equal(Number(raw.GET_STATS_DATA?.RESULT?.STATUS), 0, 'e-Stat status');
  const data = raw.GET_STATS_DATA.STATISTICAL_DATA;
  assert.equal(data.TABLE_INF['@id'], source.id);
  assert.equal(data.TABLE_INF.SURVEY_DATE, 202106);
  const classes = new Map(asArray(data.CLASS_INF.CLASS_OBJ).map(c => [c['@id'], new Map(asArray(c.CLASS).map(v => [v['@code'], v['@name']]))]));
  for (const p of prefectures) assert.equal(classes.get('area').get(p.prefCode), p.prefName, 'area identity');
  assert.equal(classes.get('cat01').get('41'), '映像・音声・文字情報制作業');
  assert.equal(classes.get('cat01').get('80'), '娯楽業');
  assert.equal(classes.get('cat02').get('0'), '総数');
  const rows = asArray(data.DATA_INF.VALUE);
  assert.equal(Number(data.RESULT_INF.TOTAL_NUMBER), rows.length, 'partial response');
  const allCoordinates = new Set(), values = new Map(); let excludedCityRows = 0;
  for (const row of rows) {
    assert.equal(row['@cat02'], '0'); assert.equal(row['@time'], '2021000000');
    assert.ok(['41', '80'].includes(row['@cat01']));
    assert.ok(source.parameters.cdTab.split(',').includes(row['@tab']));
    const key = [row['@area'], row['@cat01'], row['@tab']].join('|');
    assert.ok(!allCoordinates.has(key), 'duplicate coordinate'); allCoordinates.add(key);
    assert.ok(/^-?\d+$/.test(row.$), 'suppressed or missing value');
    const value = Number(row.$); assert.ok(Number.isSafeInteger(value));
    const expectedUnit = row['@tab'] === '201-2021' ? '企業等' : ['102-2021', '205-2021'].includes(row['@tab']) ? '事業所' : row['@tab'].startsWith('11') || row['@tab'] === '211-2021' ? '人' : '百万円';
    assert.equal(row['@unit'], expectedUnit, 'source unit');
    if (expectedUnit !== '百万円') assert.ok(value >= 0);
    if (row['@area'] !== '00000' && !PREF_CODES.has(row['@area'])) { excludedCityRows++; continue; }
    values.set(key, value);
  }
  const get = (area, industry, tab) => {
    const value = values.get([area, industry, tab].join('|'));
    assert.notEqual(value, undefined, 'missing prefecture coordinate'); return value;
  };
  assert.equal(values.size, 48 * 2 * source.parameters.cdTab.split(',').length);
  const nationalDifferences = [];
  for (const industry of ['41', '80']) for (const tab of source.parameters.cdTab.split(',')) {
    const difference = sum(prefectures.map(p => get(p.prefCode, industry, tab))) - get('00000', industry, tab);
    const financial = Number(tab.split('-')[0]) >= 250;
    // Each of the 47 cells and the national cell is rounded by at most 0.5 million yen.
    assert.ok(Math.abs(difference) <= (financial ? 24 : 0), 'prefecture/national sum');
    nationalDifferences.push({ industry, tab, difference });
  }
  let financialIdentities = 0;
  if (source.id === '0004006330') {
    for (const area of ['00000', ...PREF_CODES]) for (const industry of ['41', '80']) {
      const nva = get(area, industry, '250-2021') - get(area, industry, '252-2021') + get(area, industry, '255-2021') + get(area, industry, '259-2021');
      assert.ok(Math.abs(get(area, industry, '261-2021') - nva) <= 2.5, 'net value added identity');
      assert.ok(Math.abs(get(area, industry, '260-2021') - get(area, industry, '261-2021') - get(area, industry, '258-2021')) <= 1.5, 'gross/net difference');
      financialIdentities += 2;
    }
  }
  return { get, checks: { excludedCityRows, prefectures: 47, nationalDifferences, financialIdentities, duplicates: 0, missing: 0 } };
}
async function fetchSource(source, dir) {
  const path = resolve(dir, source.filename); let bytes;
  try { bytes = await readFile(path); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const appId = process.env.NEXT_PUBLIC_ESTAT_APP_ID || process.env.ESTAT_APP_ID;
    assert.ok(appId, 'e-Stat key required for uncached source');
    const url = new URL('https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData');
    url.search = new URLSearchParams({ appId, lang: 'J', ...source.parameters }).toString();
    let response; try { response = await fetch(url, { signal: AbortSignal.timeout(60000) }); } catch { throw new Error(`e-Stat failed: ${source.id}`); }
    assert.ok(response.ok, `e-Stat HTTP ${response.status}`); bytes = Buffer.from(await response.arrayBuffer());
  }
  const raw = JSON.parse(bytes);
  assert.equal(sha(JSON.stringify(raw.GET_STATS_DATA?.STATISTICAL_DATA)), source.statisticalDataSha256, 'source data or metadata changed');
  const extracted = parseSource(raw, source);
  await mkdir(dir, { recursive: true }); await writeFile(path, bytes);
  return { ...extracted, rawSha256: sha(bytes) };
}
async function main() {
  const { values: options } = parseArgs({ options: { 'write-local': { type: 'boolean', default: false }, 'source-dir': { type: 'string', default: '/tmp/stats47-cultural-industry-source' }, out: { type: 'string', default: '.local/verification/themes/cultural-industry-source.json' } } });
  const dir = options['source-dir']; const definitionPath = resolve(dir, DEFINITIONS.filename);
  let definition; try { definition = await readFile(definitionPath); } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    const response = await fetch(DEFINITIONS.url, { signal: AbortSignal.timeout(60000) }); assert.ok(response.ok, 'definition fetch'); definition = Buffer.from(await response.arrayBuffer());
    await mkdir(dir, { recursive: true }); await writeFile(definitionPath, definition);
  }
  assert.equal(sha(definition), DEFINITIONS.sha256, 'definition changed');
  const loaded = new Map(); for (const source of SOURCES) loaded.set(source.id, await fetchSource(source, dir));
  const files = [], generatedAt = new Date().toISOString();
  for (const field of FIELDS) {
    const config = METRICS_REGISTRY[field.key]; assert.ok(config?.isActive, 'config missing');
    assert.equal(config.unit, field.unit); assert.equal(config.yearFormat, 'calendar'); assert.deepEqual(config.years, { from: field.year, to: field.year });
    const selection = field.financial ? config.source.config?.provenance?.apiParameters : config.source;
    assert.deepEqual(Object.fromEntries(['statsDataId', 'cdTab', 'cdCat01', 'cdCat02'].map(k => [k, selection[k]])), { statsDataId: field.id, cdTab: field.tab, cdCat01: field.industry, cdCat02: '0' }, 'selection drift');
    assert.equal(config.source.kind, field.financial ? 'external' : 'estat');
    const data = loaded.get(field.id);
    const rows = prefectures.map(p => ({ areaCode: p.prefCode, areaName: p.prefName, value: data.get(p.prefCode, field.industry, field.tab), unit: field.unit, yearCode: String(field.year), yearName: field.financial ? '2020年（2021年調査）' : '2021年6月1日現在' }));
    const payload = parseStatsValuesPayload({ metricKey: field.key, entityKind: 'prefecture', rows, meta: { generatedAt, rowCount: 47, areaCount: 47, yearRange: [String(field.year), String(field.year)], recipe: buildRecipe(config) } });
    const content = JSON.stringify(payload); files.push({ key: `app/stats/${field.key}/values.json`, metricKey: field.key, sha256: sha(content), content, sourceMatchedRows: 47, national: data.get('00000', field.industry, field.tab) });
  }
  if (options['write-local']) for (const file of files) { const p = resolve(root, '.local/r2', file.key); await mkdir(dirname(p), { recursive: true }); await writeFile(p, file.content); }
  const report = { generatedAt, status: options['write-local'] ? 'source-verified-staged' : 'source-verified', sources: SOURCES, definitions: DEFINITIONS, checks: Object.fromEntries([...loaded].map(([id, data]) => [id, { ...data.checks, rawSha256: data.rawSha256 }])), files: files.map(({ content, ...file }) => file), limitations: ['事業所・雇用は2021年事業所所在地別、経理は2020年実績を企業本所所在地へ集計。異なる母集団を割り算しない。', '中分類41と80は文化産業全体ではない。金額は百万円未満を丸めた公表値。'] };
  const out = resolve(root, options.out); await mkdir(dirname(out), { recursive: true }); await writeFile(out, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ metrics: files.length, values: files.length * 47, output: out }));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error); process.exitCode = 1; });
