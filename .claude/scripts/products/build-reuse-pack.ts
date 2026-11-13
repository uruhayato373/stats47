/** 検査済みの分析納品から素材集・総合集を派生する。観測値や図を再計算しない。 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import JSZip from 'jszip';
import { datasetDir } from '../../../config/datasets.mjs';
import { assertDatasetShape } from '../lib/dataset-shape.mjs';
import { resolveAnalysisReuse } from '../../../packages/product-factory/src/analysis/reuse';
import type { AnalysisCatalogProduct } from '../../../packages/product-factory/src/analysis/validate-catalog';
import { assertAnalysisAxes } from '../../../packages/product-factory/src/analysis/coverage';
import { computeAnalyses, type AnalysisResult } from '../../../packages/product-factory/src/analysis/compute';
import { validateSourceRows } from '../../../packages/product-factory/src/analysis/load-source';
import { resolveAnalysisRevision } from '../../../packages/product-factory/src/analysis/catalog';
import type { StorefrontProduct, StorefrontShowcaseSection } from '../../../apps/web/src/features/products/types';

const hash = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex');
const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const read = (file: string) => JSON.parse(fs.readFileSync(file, 'utf8'));
type FileEvidence = { file: string; sha256: string; bytes: number };

export async function buildReusePack(root: string, landing: AnalysisCatalogProduct, products: AnalysisCatalogProduct[],
  current: StorefrontProduct, evidencePath: string, check: boolean): Promise<StorefrontProduct> {
  const selections = resolveAnalysisReuse(landing, products);
  const plan = landing.analysisReuse!;
  const destination = path.join(root, '.local/data-packs', landing.productId, plan.version);
  const variants = read(path.join(root, datasetDir('metrics.analysis-source-variants'), 'analysis-source-variants.json')).variants;
  const axisResults = new Map<string, AnalysisResult[]>();
  const dependencies = [...new Map(selections.map(selection => [selection.productId, selection])).values()].map(selection => {
    const directory = path.join(root, '.local/data-packs', selection.productId, selection.version);
    const manifestBytes = fs.readFileSync(path.join(directory, 'manifest.json'));
    const manifest = JSON.parse(manifestBytes.toString());
    if (manifest.planSha256 !== hash(JSON.stringify(selection.source)) ||
        manifest.resolvedPlanSha256 !== hash(JSON.stringify(resolveAnalysisRevision(selection.source, variants))))
      throw Error(`再利用元の台帳が変わっています: ${selection.productId}`);
    for (const file of manifest.files as FileEvidence[]) {
      const bytes = fs.readFileSync(path.join(directory, file.file));
      if (hash(bytes) !== file.sha256 || bytes.length !== file.bytes) throw Error(`再利用元のSHA不一致: ${selection.productId}/${file.file}`);
    }
    const resolved = resolveAnalysisRevision(selection.source, variants);
    const results = computeAnalyses(resolved, resolved.sources.flatMap(source => {
      const cached = read(path.join(directory, 'inputs', `${source.id}.json`));
      if (cached.sourceHash !== hash(JSON.stringify(source))) throw Error(`再利用元の原典定義が変わっています: ${selection.productId}/${source.id}`);
      validateSourceRows(source, cached.rows);
      return cached.rows;
    }));
    for (const recipe of resolved.recipes) axisResults.set(`${selection.productId}/${recipe.id}`, results.filter(row => row.analysisId === recipe.id));
    return { productId: selection.productId, version: selection.version, manifestSha256: hash(manifestBytes), directory,
      candidate: read(path.join(directory, 'preview-product.json')) as StorefrontProduct };
  });
  assertAnalysisAxes(landing, products, axisResults);
  const contents = new Map<string, Buffer>();
  const showcase: StorefrontShowcaseSection[] = selections.map(selection => {
    const dependency = dependencies.find(item => item.productId === selection.productId)!;
    const section = dependency.candidate.showcase?.find(item => item.id === selection.recipeId && item.kind === 'chart');
    if (!section) throw Error(`元のLPに作成例がありません: ${selection.productId}/${selection.recipeId}`);
    const { id: _id, heading, lead, note, themeRefs } = section;
    if (JSON.stringify({ id: selection.metadata.id, heading, lead, note, themeRefs }) !== JSON.stringify(selection.metadata))
      throw Error(`元の作成例の説明が台帳と一致しません: ${selection.recipeId}`);
    return { ...section, ...selection.metadata, figures: section.figures.map(figure => {
      const file = `${selection.prefix}${figure.file}`;
      contents.set(`images/${file}`, fs.readFileSync(path.join(dependency.directory, 'images', figure.file)));
      return { ...figure, file };
    }) };
  });
  const provenance = dependencies.map(({ productId, version, manifestSha256 }) => ({ productId, version, manifestSha256 }));
  for (const dependency of dependencies) {
    if (plan.format === 'packs') contents.set(`packs/${dependency.productId}.zip`, fs.readFileSync(path.join(dependency.directory, 'analysis-pack.zip')));
    // 素材にも原典・計算条件・利用条件を同梱し、図だけが独立して出典を失うのを防ぐ。
    for (const file of ['SOURCES.csv', 'LICENSE-ja.txt', 'analysis-plan.json', 'README.md'])
      contents.set(`sources/${dependency.productId}/${file}`, fs.readFileSync(path.join(dependency.directory, file)));
  }
  contents.set('reuse-plan.json', Buffer.from(json(plan)));
  contents.set('dependencies.json', Buffer.from(json(provenance)));
  contents.set('README.md', Buffer.from(`# ${plan.title}\n\n分析データ追加版です。既存の固定版とは別ファイルです。\n\n${plan.description}\n\n${dependencies.map(item => `- ${item.productId}: ${item.version}`).join('\n')}\n\n${plan.notes.join('\n\n')}\n\n元商品の原典・計算条件・利用条件は sources/ を参照してください。Office実機での表示・操作・互換性は未確認です。\n`));
  contents.set('READINESS.md', Buffer.from('# 検査記録\n\n- [x] 元の版・台帳・同梱ファイルSHAの検査\n- [x] 作成例・テーマ参照の継承\n- [ ] Office実機での表示・操作・互換性の確認（未確認）\n'));
  const slug = `${current.slug}-${plan.version}`;
  const candidate: StorefrontProduct = { ...current, slug, title: plan.title, displayTitle: plan.title, description: plan.description,
    useCases: plan.useCases, purchaseNotes: plan.notes, showcase,
    included: [plan.format === 'packs' ? `分析データ ${dependencies.length}商品分（各商品のCSV・Excel・図表・原票をZIPで同梱）` : `共通型の図表PNG ${showcase.flatMap(item => item.figures).length}枚`,
      '元商品の版・出典・計算方法・利用条件'],
    showcaseNote: '分析の追加ファイルは元商品の同じ版の図・出典・計算条件を引き継ぎます。既存の固定版とは別ファイルです。' };
  const planSha256 = hash(JSON.stringify(plan));
  const localImages = path.join(root, '.local/r2/app/products', slug, 'showcase');
  if (check) {
    const manifest = read(path.join(destination, 'manifest.json'));
    if (manifest.planSha256 !== planSha256 || JSON.stringify(manifest.dependencies) !== JSON.stringify(provenance)) throw Error('再利用台帳または元商品の版が変わっています');
    if (JSON.stringify(read(evidencePath).reuseRevision) !== JSON.stringify(manifest)) throw Error('再利用の検査記録が不一致です');
    for (const file of manifest.files as FileEvidence[]) {
      const bytes = fs.readFileSync(path.join(destination, file.file));
      if (hash(bytes) !== file.sha256 || bytes.length !== file.bytes) throw Error(`再利用納品のSHA不一致: ${file.file}`);
    }
    for (const [file, bytes] of contents) {
      if (hash(fs.readFileSync(path.join(destination, file))) !== hash(bytes)) throw Error(`元商品からの再現不一致: ${file}`);
      if (file.startsWith('images/') && hash(fs.readFileSync(path.join(localImages, path.basename(file)))) !== hash(bytes)) throw Error(`LP画像の不一致: ${file}`);
    }
    if (fs.readFileSync(path.join(destination, 'preview-product.json'), 'utf8') !== json(candidate)) throw Error('再利用LPの派生情報が古くなっています');
    const archive = await JSZip.loadAsync(fs.readFileSync(path.join(destination, 'analysis-pack.zip')));
    for (const [file, bytes] of contents) {
      const entry = archive.file(file);
      if (!entry || hash(await entry.async('nodebuffer')) !== hash(bytes)) throw Error(`再利用ZIPの不一致: ${file}`);
    }
    console.log(`再利用改訂候補の整合: ${landing.productId}/${plan.version}`);
    return candidate;
  }
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'stats47-reuse-'));
  try {
    const zip = new JSZip();
    for (const [file, bytes] of contents) zip.file(file, bytes);
    contents.set('analysis-pack.zip', await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
    contents.set('preview-product.json', Buffer.from(json(candidate)));
    for (const [file, bytes] of contents) {
      fs.mkdirSync(path.dirname(path.join(temporary, file)), { recursive: true });
      fs.writeFileSync(path.join(temporary, file), bytes);
    }
    const manifest = { productId: landing.productId, version: plan.version, planSha256, dependencies: provenance,
      files: [...contents].map(([file, bytes]) => ({ file, sha256: hash(bytes), bytes: bytes.length })) };
    fs.writeFileSync(path.join(temporary, 'manifest.json'), json(manifest));
    const evidence = { ...read(evidencePath), reuseRevision: manifest };
    assertDatasetShape('products.landing-evidence', evidence);
    fs.mkdirSync(destination, { recursive: true });
    fs.cpSync(temporary, destination, { recursive: true });
    fs.mkdirSync(localImages, { recursive: true });
    for (const [file, bytes] of contents) if (file.startsWith('images/')) fs.writeFileSync(path.join(localImages, path.basename(file)), bytes);
    fs.writeFileSync(evidencePath, json(evidence));
    console.log(`再利用改訂候補: ${landing.productId} ${dependencies.length}商品 / ${showcase.length}作成例`);
    return candidate;
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}
