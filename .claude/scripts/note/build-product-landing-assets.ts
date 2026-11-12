/** Fixed paid-delivery ZIP -> shared image templates -> local LP samples and metadata-only evidence.
 * Usage: npx tsx .claude/scripts/note/build-product-landing-assets.ts [--id P-01] [--archive-cache <cache-dir>]
 * Reads private R2; never writes to R2, note or the delivery archive.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import dotenv from 'dotenv';
import { inspectLandingArchive, selectLandingMetric, sha256 } from './lib/product-landing-evidence.mjs';
import { renderProductFigures } from './render-product-figures';
import { getMetricConfig, METRICS_REGISTRY } from '../../../packages/data-configs/src/registry';
import { isCapitalCityValueMetric } from '../../../packages/data-configs/src/provenance/resolve-metric-provenance';
import { PREFECTURE_CAPITAL_CITY_NAMES } from '../../../packages/area/src/constants/capital-cities';
import { formatYearName } from '../../../packages/types/src/year-format';
import { datasetDir, datasetPath } from '../../../config/datasets.mjs';
import { assertDatasetShape } from '../lib/dataset-shape.mjs';

const ROOT = path.resolve(__dirname, '../../..');
const readJson = (file: string) => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
interface LandingExample { id: string; metricKeys: string[]; preferredTemplate: 'bar' | 'choropleth' }
interface Landing { productId: string; examples: LandingExample[] }
interface Figure { file: string; template: string; input: unknown }

export async function buildProductLandingAssets(productId: string, archiveCache?: string) {
  if (!/^P-\d{2}$/.test(productId)) throw Error('商品IDが不正です');
  const landing: Landing = readJson(path.join(datasetDir('products.landings'), `${productId.toLowerCase()}.json`));
  assertDatasetShape('products.landings', landing);
  if (landing.productId !== productId) throw Error('商品IDと台帳ファイルが一致しません');
  const deliveries = readJson(datasetPath('products.note-pack-deliveries'));
  assertDatasetShape('products.note-pack-deliveries', deliveries);
  const delivery = deliveries.packs[productId]?._delivery;
  const archive = delivery?.archive;
  if (!delivery || !archive || !archive.key.endsWith(`/${archive.sha256}.zip`) ||
    !archive.key.startsWith(`note/product-archives/${productId}/${path.basename(delivery.artifactDirectory)}/`))
    throw Error('固定納品版とZIP参照が一致しません');
  const cached = archiveCache && path.join(archiveCache, `${productId}.zip`);
  const bytes = cached && fs.existsSync(cached) ? fs.readFileSync(cached)
    : await (await import('./lib/cover-storage.mjs')).createR2Store({ bucket: archive.bucket, maxBytes: archive.bytes }).get(archive.key);
  if (!bytes) throw Error('固定納品ZIPが見つかりません');
  const source = await inspectLandingArchive(bytes, archive, delivery);
  if (source.files.includes('product.xlsx') !== delivery.hasXlsx) throw Error('固定納品Excelの有無が台帳と一致しません');
  const specs: Figure[] = [];
  const selected = new Map<string, ReturnType<typeof selectLandingMetric>>();
  const examples = landing.examples.map((example) => {
    if (!/^[a-z0-9-]+$/.test(example.id) || example.metricKeys.length !== 1) throw Error('作成例には安全なIDと1指標が必要です');
    if (!['bar', 'choropleth'].includes(example.preferredTemplate)) throw Error('作成例は共通の棒・地図型だけです');
    const metric = selectLandingMetric(source, example.metricKeys[0]);
    selected.set(metric.key, metric);
    const definition = getMetricConfig(metric.key);
    if (!definition) throw Error(`指標定義がありません: ${metric.key}`);
    const capitalCity = isCapitalCityValueMetric(definition, METRICS_REGISTRY);
    if (capitalCity && example.preferredTemplate === 'choropleth') throw Error('県庁所在市の値を県全体の地図へ塗りません');
    const parts = /^(.*?)（(.*)）$/.exec(metric.title);
    const title = parts?.[1] ?? metric.title;
    const note = capitalCity ? '県庁所在市・二人以上世帯・1世帯当たり年間' : parts?.[2].replace(/）（/g, '・');
    const common = { metricKey: metric.key, grain: 'prefecture', title, note,
      yearLabel: formatYearName(metric.year, definition.yearFormat ?? 'calendar'), unit: metric.unit, source: metric.source };
    const rows = metric.rows.map((row: { area_code: string; area_name: string; value: number; rank: number }) => ({ ...row,
      area_name: capitalCity ? PREFECTURE_CAPITAL_CITY_NAMES[row.area_code] : row.area_name }));
    const file = `${example.id}.png`;
    specs.push({ file, template: example.preferredTemplate, input: example.preferredTemplate === 'choropleth'
      ? { prefecture: { ...common, rows } }
      : { ...common, rows: rows.map((row: { area_name: string; value: number }) => ({ name: row.area_name, value: row.value })) } });
    return { id: example.id, figures: [{ file, alt: `${metric.title}（${common.yearLabel}・${example.preferredTemplate === 'choropleth' ? '地図' : '地域別比較'}）`, template: example.preferredTemplate }] };
  });
  const previewMetric = selected.values().next().value;
  if (!previewMetric) throw Error('作成例がありません');
  const previewDefinition = getMetricConfig(previewMetric.key)!;
  const previewIsCapitalCity = isCapitalCityValueMetric(previewDefinition, METRICS_REGISTRY);
  const previewLabel = previewIsCapitalCity
    ? `${previewMetric.title.split('（')[0]}・県庁所在市・二人以上世帯`
    : previewMetric.title;
  const previewFile = 'file-preview.png';
  specs.push({ file: previewFile, template: 'file-preview', input: {
    title: 'CSVの列と値', meta: `data.csv · 47行・${source.metrics.length.toLocaleString('ja-JP')}指標`,
    note: `${previewLabel}（${formatYearName(previewMetric.year, previewDefinition.yearFormat ?? 'calendar')}・${previewMetric.unit}）`, source: previewMetric.source,
    columns: [{ label: source.rows[0][0], align: 'start' }, { label: source.rows[0][1], align: 'start' }, { label: '数値', align: 'start' }],
    rows: source.rows.slice(1, 9).map((row: string[]) => ({ cells: [row[0], row[1], row[previewMetric.column]] })),
  } });
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'stats47-product-landing-'));
  const out = path.join(ROOT, `.local/r2/app/products/data-${productId.toLowerCase()}/showcase`);
  try {
    const specPath = path.join(temp, 'figure-specs.json');
    fs.writeFileSync(specPath, JSON.stringify({ figures: specs }));
    await renderProductFigures(specPath, out);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
  const figureWithHash = (figure: { file: string; alt: string; template: string }) => ({ ...figure, sha256: sha256(fs.readFileSync(path.join(out, figure.file))) });
  const years = [...new Set(source.metrics.map((metric: { year: string }) => metric.year))].sort();
  const capitalCitySamples = [...selected.keys()].every((key) => isCapitalCityValueMetric(getMetricConfig(key)!, METRICS_REGISTRY));
  const geography = capitalCitySamples ? '47県庁所在市・二人以上世帯' : '47地域';
  const included = [
    `CSV（${geography}・${source.metrics.length.toLocaleString('ja-JP')}指標、基準年は指標ごとに固定）`,
    ...(delivery.hasXlsx ? [`Excel（${source.metrics.length.toLocaleString('ja-JP')}指標）`] : []),
    `PowerPoint（${delivery.pptxIndicatorCount}指標の図表）`,
    'PDFデータブック・地図PNG', ...(source.files.some((file: string) => file.endsWith('.svg')) ? ['編集用の地図SVG'] : []),
    '出典一覧（SOURCES.csv）・利用条件',
  ];
  const evidence = {
    productId, deliveryVersion: path.basename(delivery.artifactDirectory), manifestSha256: delivery.manifestSha256,
    sourceArchive: { bucket: archive.bucket, key: archive.key, sha256: archive.sha256 },
    selectedMetrics: [...selected.values()].map(({ key, title, year, unit }) => ({ key, title, year, unit })),
    included, examples: examples.map((example) => ({ ...example, figures: example.figures.map(figureWithHash) })),
    filePreview: { heading: 'ファイルの中身',
      lead: `CSVは地域コード・地域名と指標の値を横に並べた形式です。${capitalCitySamples ? '納品CSVでは県のコード・県名で記録していますが、家計調査の値は県庁所在市の二人以上世帯が対象です。' : ''}画像は8行と1指標を抜粋しています。元の数値列名には指標名・年・単位が入り、画像では「数値」と省略しています。全${source.metrics.length.toLocaleString('ja-JP')}指標の出典と基準年はSOURCES.csvで確認できます。`,
      figures: [figureWithHash({ file: previewFile, alt: `${productId}のdata.csvから列と8行を抜粋した見本`, template: 'file-preview' })] },
    showcaseNote: `図は販売済みの固定納品ファイルの値から作成しています。収録指標の基準年は${years[0]}〜${years.at(-1)}年で指標ごとに異なり、時系列データではありません。`,
  };
  assertDatasetShape('products.landing-evidence', evidence);
  const evidencePath = path.join(ROOT, datasetDir('products.landing-evidence'), `${productId.toLowerCase()}.json`);
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  return { productId, figures: specs.length, indicators: source.metrics.length, output: out };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  dotenv.config({ path: path.join(ROOT, '.env.local'), quiet: true });
  const arg = (key: string) => { const i = process.argv.indexOf(key); return i < 0 ? undefined : process.argv[i + 1]; };
  const ids = arg('--id') ? [arg('--id')!] : Object.keys(readJson(datasetPath('products.note-pack-deliveries')).packs);
  (async () => { for (const id of ids) console.log(JSON.stringify(await buildProductLandingAssets(id, arg('--archive-cache')))); })()
    .catch((error) => { console.error(error.message); process.exitCode = 1; });
}
