#!/usr/bin/env node
/**
 * 市区町村データ商品を作る: 最新境域の時系列 CSV + 結合用 GeoJSON + README + 検算表。
 * 入力は R2 の公開 URL (cities.json / values.json)・packages/area の自治体一覧・e-Stat 境界データ。
 * 出力は .local/muni-data-products/<指標>/ (repo に入れない)。外部へは書き込まない。
 *
 * 実行: node --import tsx .claude/scripts/products/build-muni-data-product.mjs --metric manufacturing-shipment-amount
 *   --skip-geo         境界を作らない (前回の geo-report.json があれば README に使う)
 *   --simplify 5%      境界の頂点を残す割合
 * 検算に未説明の差があれば exit 1。ESTAT_APP_ID か NEXT_PUBLIC_ESTAT_APP_ID があれば空欄の記号を取り直す。
 * 呼び出し元: オーナー / 対話セッション (定期実行はない)。
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { extractYearCode } from '../../../packages/estat-api/src/stats-data/utils/extract-year-code.ts';
import { renderReadme } from './lib/muni-data-product-readme.mjs';
import { BOUNDARY_CODE_OVERRIDES, BOUNDARY_EXCLUDED_CODES, MUNI_PRODUCT_SPECS } from './lib/muni-data-product-specs.mjs';
import {
  CSV_HEADER,
  boundaryCodeMap,
  buildRows,
  compareBoundaryAreas,
  parseEstatValues,
  reconcile,
  rowCells,
  splitAreaName,
  toCsv,
} from './lib/muni-data-product.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const R2_BASE = 'https://storage.stats47.jp/app/stats';
const ESTAT_API = 'https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData';
const BOUNDARY_URL = (pref) =>
  `https://www.e-stat.go.jp/gis/statmap-search/data?dlserveyId=A002005212020&code=${pref}&coordSys=1&format=shape&downloadType=5&datum=2011`;
const WATER_HCODE = 8154;
const BOUNDARY_FILE = 'municipalities_r2census_boundary.geojson';

const { values: args } = parseArgs({
  options: {
    metric: { type: 'string' },
    'skip-geo': { type: 'boolean', default: false },
    simplify: { type: 'string', default: '5%' },
  },
});
const spec = MUNI_PRODUCT_SPECS[args.metric];
if (!spec) throw new Error(`--metric が未定義: ${args.metric} (定義: lib/muni-data-product-specs.mjs)`);

const outDir = join(ROOT, '.local/muni-data-products', args.metric);
const cacheDir = join(ROOT, '.local/muni-data-products/_cache');
mkdirSync(outDir, { recursive: true });

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}

async function fetchEstatSymbols(appId) {
  const values = [];
  let notes = null;
  let startPosition = 1;
  while (startPosition) {
    const query = new URLSearchParams({ appId, statsDataId: spec.estat.statsDataId, cdCat01: spec.estat.cdCat01, metaGetFlg: 'N', limit: '100000', startPosition: String(startPosition) });
    const body = await fetchJson(`${ESTAT_API}?${query}`);
    const data = body.GET_STATS_DATA;
    if (data.RESULT.STATUS !== 0) throw new Error(`e-Stat: ${data.RESULT.STATUS} ${data.RESULT.ERROR_MSG}`);
    const statistical = data.STATISTICAL_DATA;
    values.push(...[statistical.DATA_INF.VALUE].flat());
    notes ??= statistical.DATA_INF.NOTE;
    startPosition = statistical.RESULT_INF.NEXT_KEY ?? 0;
  }
  return parseEstatValues({ values, notes, yearOf: extractYearCode });
}

function run(command, commandArgs) {
  execFileSync(command, commandArgs, { stdio: ['ignore', 'ignore', 'pipe'], maxBuffer: 1 << 28 });
}

/** mapshaper の標準出力は 64KB で切れるので、ファイルへ書いて読む。 */
function censusAreas(dbf) {
  const out = `${dbf}.areas.json`;
  run('mapshaper', [dbf, '-each', 'c=PREF+CITY, n=CITY_NAME, k=KEY_CODE, j=JINKO', '-filter-fields', 'c,n,k,j', '-o', out, 'format=json', 'force']);
  const records = JSON.parse(readFileSync(out, 'utf8'));
  // 1 つの町丁が複数の形に分かれると人口は片方だけに入るので、KEY_CODE ごとの最大を足す
  const population = new Map();
  for (const r of records) population.set(r.k, Math.max(population.get(r.k) ?? 0, r.j));
  return {
    areas: [...new Map(records.map((r) => [r.c, { code: r.c, name: r.n }])).values()],
    population: [...population.values()].reduce((sum, n) => sum + n, 0),
  };
}

async function downloadBoundary(pref) {
  const dir = join(cacheDir, 'boundary-r2', pref);
  const shp = join(dir, `r2ka${pref}.shp`);
  if (existsSync(shp)) return shp;
  mkdirSync(dir, { recursive: true });
  const response = await fetch(BOUNDARY_URL(pref));
  if (!response.ok) throw new Error(`境界 ${pref}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.subarray(0, 2).toString() !== 'PK') throw new Error(`境界 ${pref}: zip ではない応答`);
  const zip = join(dir, 'source.zip');
  writeFileSync(zip, bytes);
  run('unzip', ['-o', '-q', zip, '-d', dir]);
  await new Promise((done) => setTimeout(done, 1000));
  return shp;
}

async function buildBoundary(areas) {
  const prefs = Array.from({ length: 47 }, (_, i) => String(i + 1).padStart(2, '0'));
  const dissolvedDir = join(cacheDir, 'boundary-r2-dissolved');
  mkdirSync(dissolvedDir, { recursive: true });
  const map = boundaryCodeMap(areas, BOUNDARY_CODE_OVERRIDES);
  const census = [];
  let censusPopulation = 0;
  for (const pref of prefs) {
    const shp = await downloadBoundary(pref);
    const { areas: censusList, population } = censusAreas(shp.replace('.shp', '.dbf'));
    census.push(...censusList.filter((area) => !BOUNDARY_EXCLUDED_CODES.includes(area.code)));
    censusPopulation += population;
    const out = join(dissolvedDir, `${pref}.shp`);
    if (existsSync(out)) continue;
    const subset = Object.fromEntries([...map].filter(([code]) => code.startsWith(pref)));
    run('mapshaper', [
      shp,
      '-filter', `HCODE !== ${WATER_HCODE} && ${JSON.stringify(BOUNDARY_EXCLUDED_CODES)}.indexOf(PREF+CITY) === -1`,
      '-each', `var m=${JSON.stringify(subset)}; code=m[PREF+CITY]||('?'+PREF+CITY); srcArea=AREA`,
      '-dissolve', 'code', 'sum-fields=srcArea',
      '-o', out,
    ]);
    console.log(`[geo] ${pref} dissolved`);
  }
  const comparison = compareBoundaryAreas({ census, areas, overrides: BOUNDARY_CODE_OVERRIDES });
  if (comparison.unmapped.length || comparison.notReached.length) {
    throw new Error(`境界のコード突合に失敗: ${JSON.stringify({ unmapped: comparison.unmapped, notReached: comparison.notReached })}`);
  }

  const municipalities = areas.filter((a) => a.level === '2');
  const namesCsv = join(cacheDir, 'boundary-names.csv');
  writeFileSync(namesCsv, toCsv(['code', 'pref', 'name'], municipalities.map((a) => {
    const { pref, name } = splitAreaName(a.cityName);
    return [a.cityCode, pref, name];
  })));
  const output = join(outDir, BOUNDARY_FILE);
  run('mapshaper-xl', ['6gb',
    '-i', ...prefs.map((p) => join(dissolvedDir, `${p}.shp`)), 'combine-files', 'snap',
    '-merge-layers', 'force',
    '-simplify', args.simplify, 'keep-shapes',
    '-clean',
    '-each', 'calcArea=this.area',
    '-join', namesCsv, 'keys=code,code', 'string-fields=code',
    '-o', output, 'format=geojson', 'precision=0.00001', 'force',
  ]);

  // 計算用の欄は検算のあとに落とし、結合キーと名称だけを残す
  const geojson = JSON.parse(readFileSync(output, 'utf8'));
  const checks = { features: geojson.features.length, multiPartFeatures: 0, parts: 0, population: censusPopulation, srcArea: 0, calcArea: 0, worstAreaRatio: null, missingNames: 0 };
  let worst = 0;
  for (const feature of geojson.features) {
    const p = feature.properties;
    const parts = feature.geometry?.type === 'MultiPolygon' ? feature.geometry.coordinates.length : 1;
    checks.parts += parts;
    if (parts > 1) checks.multiPartFeatures += 1;
    checks.srcArea += p.srcArea;
    checks.calcArea += p.calcArea;
    if (!p.name) checks.missingNames += 1;
    const gap = Math.abs(p.calcArea / p.srcArea - 1);
    if (gap > worst) {
      worst = gap;
      checks.worstAreaRatio = { code: p.code, name: p.name, ratio: Number((p.calcArea / p.srcArea).toFixed(4)) };
    }
    feature.properties = { code: p.code, pref: p.pref, name: p.name };
  }
  writeFileSync(output, JSON.stringify(geojson));
  const report = {
    simplify: args.simplify,
    bytes: statSync(output).size,
    checks,
    renamed: comparison.renamed,
    remapped: comparison.remapped,
    censusCodes: census.length,
  };
  writeFileSync(join(cacheDir, 'geo-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

const areasAll = JSON.parse(readFileSync(join(ROOT, 'packages/area/src/data/cities.json'), 'utf8'));
const municipalities = areasAll.filter((a) => a.level === '2');
const wards = areasAll.filter((a) => a.level === '3');
const [cities, prefs] = await Promise.all([
  fetchJson(`${R2_BASE}/${args.metric}/cities.json`),
  fetchJson(`${R2_BASE}/${args.metric}/values.json`),
]);

const appId = process.env.ESTAT_APP_ID || process.env.NEXT_PUBLIC_ESTAT_APP_ID || '';
const estat = appId ? await fetchEstatSymbols(appId) : null;
const estatCheck = estat && {
  symbols: estat.symbols.size,
  differs: cities.rows.filter((r) => r.value != null && estat.numbers.get(`${r.areaCode}|${r.yearCode}`) !== r.value).length,
};
const symbols = estat?.symbols ?? null;

const rows = buildRows({ cityRows: cities.rows, areas: municipalities, spec, symbols });
const wardRows = buildRows({ cityRows: cities.rows, areas: wards, spec, symbols });
const recon = reconcile({ rows, prefRows: prefs.rows.filter((r) => rows.some((x) => x.year === r.yearCode)), spec });

const base = `${args.metric}_municipalities`;
for (const [name, list] of [[base, rows], [`${args.metric}_wards`, wardRows]]) {
  const cells = list.map(rowCells);
  writeFileSync(join(outDir, `${name}_utf8.csv`), toCsv(CSV_HEADER, cells));
  writeFileSync(join(outDir, `${name}_utf8bom.csv`), toCsv(CSV_HEADER, cells, { bom: true }));
}
const reconHeader = ['年', '県別の合計', '自治体の合計', '差', '差の率(%)', '空欄の自治体数', '空欄で説明した県', '丸めの県', '県またぎ合併の県', '元データ要確認の県', '未説明の県'];
writeFileSync(
  join(outDir, `${args.metric}_national_check.csv`),
  toCsv(reconHeader, recon.byYear.map((y) => [y.year, y.prefTotal, y.muniTotal, y.diff, y.diffPct, y.blanks, y.prefsBlank, y.prefsRounding, y.prefsCrossPref, y.prefsSourceIssue, y.prefsUnexplained]), { bom: true }),
);

const geoReportPath = join(cacheDir, 'geo-report.json');
let geo = null;
if (!args['skip-geo']) geo = await buildBoundary(areasAll);
else if (existsSync(geoReportPath)) geo = JSON.parse(readFileSync(geoReportPath, 'utf8'));

writeFileSync(
  join(outDir, 'README.md'),
  renderReadme({ metric: args.metric, spec, rows, wardRows, recon, geo, boundaryFile: BOUNDARY_FILE, symbolsChecked: Boolean(estat), generatedAt: cities.meta?.generatedAt, today: new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date()) }),
);

for (const file of readdirSync(outDir).sort()) console.log(`${statSync(join(outDir, file)).size}\t${file}`);
console.log(`[muni-data] 行 ${rows.length} (自治体 ${municipalities.length}) / 行政区 ${wardRows.length} / e-Stat 記号 ${estatCheck ? JSON.stringify(estatCheck) : '未取得 (appId なし)'}`);
console.log(JSON.stringify(recon.byYear.at(-1)));
if (recon.unexplained.length) {
  console.error('未説明の差:', recon.unexplained.map((r) => `${r.year}/${r.prefCode}:${r.diff}`).join(' '));
  process.exit(1);
}
