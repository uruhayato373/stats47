/** 商品LPの分析台帳 → 原典取得 → CSV/Excel/共通画像 → 未公開の改訂案。公開版の納品は変更しない。 */
// The shared loader resolves local/CI credentials before the API package is imported.
import { getAppId } from '../lib/estat-catalog/api.mjs';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { buildMunicipalityEntityPolicy, listPublishableMunicipalities, PREFECTURE_AREA_CODES } from '@stats47/area';
import { datasetDir } from '../../../config/datasets.mjs';
import { assertDatasetShape } from '../lib/dataset-shape.mjs';
import { type AnalysisObservation } from '../../../packages/product-factory/src/analysis/fetch-estat';
import { computeAnalyses, describeAnalysis } from '../../../packages/product-factory/src/analysis/compute';
import { resolveAnalysisRevision, type AuthoredAnalysisRevision, type ResolvedSource } from '../../../packages/product-factory/src/analysis/catalog';
import { fetchResolvedSource, relinkCachedRows, validateSourceRows } from '../../../packages/product-factory/src/analysis/load-source';
import { buildAnalysisFigures } from '../../../packages/product-factory/src/analysis/figures';
import { buildFrame, checkCoverage } from '../analysis/analysis-frame-core.mjs';
import { renderLicenseText } from '../../../packages/product-factory/src/licenses/license-text';
import { serializeSourcesCsv, type SourceRow } from '../../../packages/product-factory/src/data/sources';
import { renderProductFigures } from '../note/render-product-figures';
import { buildPreviewFiles, writePreviewFiles, createPreviewServer } from '../note/build-product-landing-preview';
import { STOREFRONT_PRODUCTS } from '../../../apps/web/src/features/products/storefront.generated';
import type { StorefrontProduct, StorefrontShowcaseSection } from '../../../apps/web/src/features/products/types';

const ROOT = path.resolve(__dirname, '../../..');
const hash = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex');
const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const csv = (rows: unknown[][]) => '\uFEFF' + rows.map(row => row.map(cell => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n') + '\r\n';
const write = (directory: string, file: string, content: string | Buffer) => fs.writeFileSync(path.join(directory, file), content);
const read = (file: string) => JSON.parse(fs.readFileSync(file, 'utf8'));
const acquisitionHash = (source: ResolvedSource) => hash(JSON.stringify({
  id: source.id, grain: source.grain, years: source.years,
  inputs: source.inputs.map(({ id, statsDataId, code, unit, rawUnit }) => ({ id, statsDataId, code, unit, rawUnit })),
}));
const resultTable = (rows: ReturnType<typeof computeAnalyses>) => [
  ['analysis_id', 'area_code', 'area_name', 'year', 'series_id', 'series_name', 'value', 'unit', 'missing_reason'],
  ...rows.map(row => [row.analysisId, row.areaCode, row.areaName, row.year, row.seriesId, row.seriesLabel, row.value, row.unit, row.missingReason ?? '']),
];
const previewModule = (candidates: StorefrontProduct[]) => `/** 自動生成。products:analysis:build。未公開の改訂候補。 */\nimport type { StorefrontProduct } from './types';\nexport const ANALYSIS_PREVIEWS: readonly StorefrontProduct[] = ${JSON.stringify(candidates, null, 2)};\n`;

export async function buildAnalysisPack(productId: string, refresh = false, check = false) {
  if (!/^P-\d{2}$/.test(productId)) throw Error('商品IDが不正です');
  const landing = read(path.join(ROOT, datasetDir('products.landings'), `${productId.toLowerCase()}.json`));
  assertDatasetShape('products.landings', landing);
  const authored: AuthoredAnalysisRevision = landing.analysisRevision;
  if (!authored) throw Error('この商品に分析の改訂台帳がありません');
  const variants = read(path.join(ROOT, datasetDir('metrics.analysis-source-variants'), 'analysis-source-variants.json')).variants;
  const plan = resolveAnalysisRevision(authored, variants);
  const current = STOREFRONT_PRODUCTS.find(product => product.id === productId);
  if (!current) throw Error('現行の商品がありません');
  const destination = path.join(ROOT, '.local/data-packs', productId, plan.version);
  let output = destination;
  const inputs = path.join(output, 'inputs');
  const planSha256 = hash(JSON.stringify(authored));
  const resolvedPlanSha256 = hash(JSON.stringify(plan));
  if (check) {
    const manifest = read(path.join(output, 'manifest.json'));
    if (manifest.planSha256 !== planSha256 || manifest.resolvedPlanSha256 !== resolvedPlanSha256) throw Error('分析台帳が生成後に変わっています');
    for (const file of manifest.files) {
      const bytes = fs.readFileSync(path.join(output, file.file));
      if (hash(bytes) !== file.sha256 || bytes.length !== file.bytes) throw Error(`改訂候補のSHA不一致: ${file.file}`);
    }
    const evidence = read(path.join(ROOT, datasetDir('products.landing-evidence'), `${productId.toLowerCase()}.json`));
    assertDatasetShape('products.landing-evidence', evidence);
    if (JSON.stringify(evidence.analysisRevision) !== JSON.stringify(manifest)) throw Error('検査台帳と改訂候補が不一致です');
    const recalculated = computeAnalyses(plan, plan.sources.flatMap(source => {
      const cached = read(path.join(inputs, `${source.id}.json`));
      if (cached.sourceHash !== hash(JSON.stringify(source))) throw Error('原典の解決情報が古くなっています');
      validateSourceRows(source, cached.rows);
      return cached.rows;
    }));
    if (fs.readFileSync(path.join(output, 'analysis.csv'), 'utf8') !== csv(resultTable(recalculated))) throw Error('同梱観測値から分析を再現できません');
    const archive = await JSZip.loadAsync(fs.readFileSync(path.join(output, 'analysis-pack.zip')));
    for (const file of manifest.files.filter((item: {file: string}) => !['analysis-pack.zip', 'preview-product.json'].includes(item.file))) {
      const entry = archive.file(file.file);
      if (!entry || hash(await entry.async('nodebuffer')) !== file.sha256) throw Error(`ZIP同梱物の不一致: ${file.file}`);
    }
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(path.join(output, 'analysis.xlsx'));
    if (workbook.worksheets.length !== 2 || workbook.worksheets[0].rowCount !== manifest.sources.reduce((sum: number, source: {rows: number}) => sum + source.rows, 1) || workbook.worksheets[1].rowCount !== recalculated.length + 1) throw Error('Excelのシートまたは行数が不一致です');
    const candidate: StorefrontProduct = read(path.join(output, 'preview-product.json'));
    for (const figure of candidate.showcase!.flatMap(section => section.figures)) {
      const localImage = fs.readFileSync(path.join(ROOT, '.local/r2/app/products', candidate.slug, 'showcase', figure.file));
      if (hash(localImage) !== manifest.files.find((file: {file: string}) => file.file === `images/${figure.file}`).sha256) throw Error('LP画像と同梱画像が不一致です');
    }
    if (!fs.readFileSync(path.join(ROOT, 'apps/web/src/features/products/analysis-previews.generated.ts'), 'utf8').includes(JSON.stringify(candidate, null, 2).split('\n').map(line => `  ${line}`).join('\n'))) throw Error('サイト用の派生情報が古くなっています');
    console.log(`分析改訂候補の整合: ${productId}/${plan.version} (${manifest.files.length}ファイル)`);
    return read(path.join(output, 'preview-product.json')) as StorefrontProduct;
  }
  // Build under os.tmpdir() to preserve verified inputs on failure; finally removes this directory.
  output = fs.mkdtempSync(path.join(os.tmpdir(), 'stats47-analysis-'));
  try {
  fs.mkdirSync(path.join(output, 'inputs'), { recursive: true });
  const observations: AnalysisObservation[] = [];
  const sourceEvidence: {
    id: string; inputs: Pick<ResolvedSource['inputs'][number], 'metricKey' | 'variantId' | 'statsDataId' | 'code' | 'unit' | 'rawUnit'>[];
    grain: string; years: number[]; retrievedAt: string; tableTitle: string; rows: number; areas: number; missing: number;
    coverage: (Omit<ReturnType<typeof checkCoverage>, 'rows'> & { year: number })[]; inputSha256: string;
  }[] = [];
  const previousManifest = fs.existsSync(path.join(destination, 'manifest.json')) ? read(path.join(destination, 'manifest.json')) : undefined;
  for (const source of plan.sources) {
    const file = path.join(inputs, source.id + '.json');
    const sourceHash = hash(JSON.stringify(source));
    const cached = !refresh && fs.existsSync(file) ? read(file) : undefined;
    if (cached) {
      const knownHash = previousManifest?.sources.find((item: { id: string }) => item.id === source.id)?.inputSha256;
      if (!knownHash || knownHash !== hash(fs.readFileSync(file)) || cached.sourceHash !== hash(JSON.stringify(cached.source))) throw Error(source.id + ': 保存した原典と検査記録が一致しません。--refreshで再取得してください');
      if (cached.source.inputs && acquisitionHash(cached.source) !== acquisitionHash(source)) throw Error(source.id + ': 取得指定が変わりました。--refreshで再取得してください');
    }
    if (!cached) getAppId();
    const result = cached ? { ...cached, source, sourceHash,
      rows: cached.source.inputs ? cached.rows : relinkCachedRows(cached.source, source, cached.rows),
    } : { source, sourceHash, ...await fetchResolvedSource(source) };
    validateSourceRows(source, result.rows);
    write(output, `inputs/${source.id}.json`, json(result));
    observations.push(...result.rows);
    const entities = source.grain === 'prefecture' ? PREFECTURE_AREA_CODES.map(code => ({ code, name: code })) : listPublishableMunicipalities(buildMunicipalityEntityPolicy());
    const coverage = source.years.map(year => {
      const frame = buildFrame({ entities, metrics: source.metrics.map(metric => ({ alias: metric.id, years: [year],
        rows: result.rows.filter((row: AnalysisObservation) => row.metricId === metric.id).map((row: AnalysisObservation) => ({ ...row, yearCode: String(row.year) })) })) });
      const { rows: _rows, ...summary } = checkCoverage(frame, { required: frame.columns.map((column: { column: string }) => column.column), compareColumn: undefined });
      return { year, ...summary };
    });
    sourceEvidence.push({ id: source.id, inputs: source.inputs.map(({ metricKey, variantId, statsDataId, code, unit, rawUnit }) => ({ metricKey, ...(variantId ? { variantId } : {}), statsDataId, code, unit, ...(rawUnit ? { rawUnit } : {}) })),
      grain: source.grain, years: source.years, retrievedAt: result.retrievedAt, tableTitle: result.tableTitle,
      rows: result.rows.length, areas: entities.length, missing: result.rows.filter((row: AnalysisObservation) => row.value === null).length,
      coverage, inputSha256: hash(json(result)) });
  }
  const results = computeAnalyses(plan, observations);
  const observationTable = [['source_id', 'metric_id', 'area_code', 'area_name', 'year', 'value', 'unit', 'missing_reason'],
    ...observations.map(row => [row.sourceId, row.metricId, row.areaCode, row.areaName, row.year, row.value, row.unit, row.missingReason ?? ''])];
  const calculatedTable = resultTable(results);
  write(output, 'data.csv', csv(observationTable));
  write(output, 'analysis.csv', csv(calculatedTable));
  write(output, 'analysis-plan.json', json(plan));
  const sources: SourceRow[] = plan.sources.flatMap(source => source.inputs.map(metric => ({
    surveyName: source.label, tableName: `${sourceEvidence.find(item => item.id === source.id)!.tableTitle}・${metric.code} ${metric.label}`,
    statsDataId: metric.statsDataId, url: metric.url, year: source.years.join('/'),
    retrievedAt: sourceEvidence.find(item => item.id === source.id)!.retrievedAt, unit: metric.unit,
    transform: '観測値は未加工。分析式と対象はanalysis-plan.json / README.md参照', notes: `${metric.definition} ${source.definition} ${source.boundary}`,
  })));
  write(output, 'SOURCES.csv', serializeSourcesCsv(sources));
  const productDefinition = read(path.join(ROOT, datasetDir('products.packs'), 'packs.json')).packs[productId];
  write(output, 'LICENSE-ja.txt', renderLicenseText(productDefinition.licenseId, sources));
  const workbook = new ExcelJS.Workbook();
  for (const [name, table] of [['観測値', observationTable], ['分析結果', calculatedTable]] as const) {
    const sheet = workbook.addWorksheet(name);
    sheet.addRows(table);
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = { from: 'A1', to: { row: 1, column: table[0].length } };
    sheet.columns.forEach(column => { column.width = 22; });
  }
  await workbook.xlsx.writeFile(path.join(output, 'analysis.xlsx'));
  const built = buildAnalysisFigures(plan, results);
  const figures: { file: string; template: string; input: unknown }[] = [...built.figures];
  const showcase: StorefrontShowcaseSection[] = [...built.showcase];
  figures.push({ file: 'analysis-file-preview.png', template: 'file-preview', input: {
    title: '地域・年・指標で絞れるCSV', meta: `data.csv · ${plan.sources[0].metrics[0].label}`, source: plan.sources[0].label,
    columns: [{ label: '地域コード' }, { label: '地域名' }, { label: '年' }, { label: '値' }],
    rows: observations.filter(row => row.sourceId === plan.sources[0].id && row.metricId === plan.sources[0].metrics[0].id).slice(0, 8)
      .map(row => ({ cells: [row.areaCode, row.areaName, String(row.year), String(row.value ?? '欠測')] })) } });
  write(output, 'figure-specs.json', json({ figures }));
  const figureDirectory = path.join(output, 'images');
  await renderProductFigures(path.join(output, 'figure-specs.json'), figureDirectory);
  const slug = `${current.slug}-${plan.version}`;
  const localImages = path.join(ROOT, '.local/r2/app/products', slug, 'showcase');
  fs.mkdirSync(localImages, { recursive: true });
  for (const figure of figures) fs.copyFileSync(path.join(figureDirectory, figure.file), path.join(localImages, figure.file));
  showcase.push({ kind: 'file', heading: 'ファイルの中身', lead: '地域コード・地域名・年・指標・値・単位を列に持つCSVとExcelです。観測値と分析結果を分け、欠測は理由付きで保持します。',
    figures: [{ file: 'analysis-file-preview.png', alt: `${plan.title}のCSV見本` }] });
  const candidate: StorefrontProduct = { ...current, slug, title: plan.title, displayTitle: plan.title, description: plan.description,
    useCases: plan.useCases, included: [
      ...sourceEvidence.map(source => {
        const definition = plan.sources.find(item => item.id === source.id)!;
        const suffix = definition.inputs[0].yearFormat === 'fiscal' ? '年度' : '年';
        const period = source.years.length === 1 ? `${source.years[0]}${suffix}` : `${source.years[0]}〜${source.years.at(-1)}${suffix}`;
        return `${definition.title}（${source.areas.toLocaleString('ja-JP')}地域・${period}・${source.rows.toLocaleString('ja-JP')}行${source.missing ? `、うち欠測${source.missing.toLocaleString('ja-JP')}行` : ''}）`;
      }),
      'CSV・Excel、分析結果CSV、共通型の図表PNG、出典・計算方法・取得原票',
    ], showcase, showcaseNote: '図はこの改訂候補に同梱する観測値から計算しています。公開中の固定版には含まれていません。',
    purchaseNotes: plan.notes };
  write(output, 'preview-product.json', json(candidate));
  const readme = [`# ${plan.title}`, '', '未公開の改訂候補。既存の販売版に含まれると案内しないこと。', '', plan.description,
    '', '## 再現方法', '商品台帳のanalysisRevisionを入力に products:analysis:build を実行します。地域・期間は台帳で変更します。',
    '', '## 分析', ...plan.recipes.map(recipe => `### ${recipe.heading}\n${recipe.lead}\n\n${describeAnalysis(recipe, results.filter(row => row.analysisId === recipe.id), plan.sources.find(source => source.id === recipe.sourceId)!.inputs[0].yearFormat)}\n\n制約: ${recipe.limitation}`),
    '', '## 参考資料', ...plan.research.references.map(ref => `- [${ref.title}](${ref.url}) ${ref.section}：${ref.finding}`),
    '', '## 検査と確認', '機械検査: 原典の項目/単位、地域の重複、年、欠測、分子/分母、画像型、全ファイルSHA。',
    'オーナー確認: Excel実機・図の読みやすさ・改訂版の販売内容/価格・公開。',
    '', '## 計算式', '指数 = 当年値 / 基準年値 × 100。割合 = 分子 / 分母 × 100。比率 = 分子 / 分母 × 台帳の倍率。分母0以下の比率は理由付き欠測です。増減 = 正項 - 負項。増減率 = (終点 / 始点 - 1) × 100。丸める前の値をCSVへ保存します。基準年0以下は指数を停止し、増減率は理由付き欠測とします。',
    '', '## 利用', '利用範囲・出典表示はLICENSE-ja.txtを確認してください。', ''];
  write(output, 'README.md', readme.join('\n'));
  write(output, 'READINESS.md', '# 公開前確認\n\n- [x] 原典・地域・年・単位の機械検査\n- [x] 同梱CSVからの再計算・共通図型\n- [ ] Excel実機での確認\n- [ ] オーナーによる図・販売内容・価格の確認\n- [ ] 非公開保全・note添付差し替え・LP公開\n');
  const zip = new JSZip();
  const files = ['data.csv', 'analysis.csv', 'analysis.xlsx', 'SOURCES.csv', 'LICENSE-ja.txt', 'analysis-plan.json', 'figure-specs.json', 'README.md', 'READINESS.md',
    ...figures.map(figure => `images/${figure.file}`), ...plan.sources.map(source => `inputs/${source.id}.json`)];
  for (const file of files) zip.file(file, fs.readFileSync(path.join(output, file)));
  write(output, 'analysis-pack.zip', await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
  const manifest = { productId, version: plan.version, planSha256, resolvedPlanSha256, sources: sourceEvidence, results: results.length,
    files: [...files, 'preview-product.json', 'analysis-pack.zip'].map(file => { const bytes = fs.readFileSync(path.join(output, file));
      return { file, sha256: hash(bytes), bytes: bytes.length }; }) };
  write(output, 'manifest.json', json(manifest));
  const evidencePath = path.join(ROOT, datasetDir('products.landing-evidence'), `${productId.toLowerCase()}.json`);
  const evidence = { ...read(evidencePath), analysisRevision: manifest };
  assertDatasetShape('products.landing-evidence', evidence);
  fs.mkdirSync(destination, { recursive: true });
  fs.cpSync(output, destination, { recursive: true });
  fs.writeFileSync(evidencePath, json(evidence));
  console.log(`分析改訂候補: ${productId} ${observations.length}観測値 / ${results.length}分析値 / ${figures.length}画像 → ${destination}`);
  return candidate;
  } finally {
    if (path.dirname(output) !== os.tmpdir() || !path.basename(output).startsWith('stats47-analysis-')) throw Error('一時出力の削除先が不正です');
    fs.rmSync(output, { recursive: true, force: true });
  }
}

function revisionLandings() {
  return fs.readdirSync(path.join(ROOT, datasetDir('products.landings'))).filter(file => file.endsWith('.json'))
    .map(file => read(path.join(ROOT, datasetDir('products.landings'), file))).filter(item => item.analysisRevision);
}

if (require.main === module) {
  const arg = (key: string) => { const index = process.argv.indexOf(key); return index < 0 ? undefined : process.argv[index + 1]; };
  (async () => {
    const check = process.argv.includes('--check');
    const landings = revisionLandings();
    const ids = process.argv.includes('--all') ? landings.map(item => item.productId) : [arg('--id') ?? 'P-01'];
    for (const id of ids) await buildAnalysisPack(id, process.argv.includes('--refresh'), check);
    // Publish the preview list only after every authored revision has been built.
    const candidates: StorefrontProduct[] = landings.map(item => {
      const file = path.join(ROOT, '.local/data-packs', item.productId, item.analysisRevision.version, 'preview-product.json');
      if (!fs.existsSync(file)) throw Error(`改訂案の生成が必要です: ${item.productId} (--all)`);
      return read(file);
    });
    const previewPath = path.join(ROOT, 'apps/web/src/features/products/analysis-previews.generated.ts');
    if (check) {
      if (fs.readFileSync(previewPath, 'utf8') !== previewModule(candidates)) throw Error('サイト用の改訂候補一覧が古くなっています');
    } else fs.writeFileSync(previewPath, previewModule(candidates));
    const files = buildPreviewFiles(STOREFRONT_PRODUCTS.map(product => candidates.find(candidate => candidate.id === product.id) ?? product),
      { revisionIds: candidates.map(product => product.id) });
    const directory = path.join(ROOT, '.local/product-portfolio/analysis-landings');
    writePreviewFiles(files, directory, process.argv.includes('--check'));
    if (!check) for (const id of ids) await buildAnalysisPack(id, false, true);
    if (arg('--serve')) createPreviewServer(files, directory).listen(Number(arg('--serve')), '127.0.0.1');
  })().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
}
