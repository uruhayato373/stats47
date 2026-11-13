/** Additional analysis delivery: private immutable archive -> prepared evidence -> verified note publication.
 * Dry-run is the default. This CLI never edits note or uploads public assets.
 * npx tsx .claude/scripts/products/release-analysis-pack.ts prepare --all [--check] [--commit]
 * npx tsx .claude/scripts/products/release-analysis-pack.ts publish --id P-01 --verification /tmp/verified.json [--commit]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import dotenv from 'dotenv';
import JSZip from 'jszip';
import { datasetDir, datasetPath } from '../../../config/datasets.mjs';
import { assertDatasetShape } from '../lib/dataset-shape.mjs';
import { R2_PRIVATE_BUCKET } from '../lib/site-config.cjs';
import type { CoverStore } from '../note/lib/cover-storage.mjs';
import { assertPublishedAnalysisCopy, readProductLanding, type AnalysisDelivery } from '../../../apps/web/scripts/lib/product-landing';
import type { StorefrontProduct } from '../../../apps/web/src/features/products/types';

const ROOT = path.resolve(__dirname, '../../..');
const hash = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex');
const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const read = (file: string) => JSON.parse(fs.readFileSync(file, 'utf8'));
type FileEvidence = { file: string; sha256: string; bytes: number };
type Manifest = { productId: string; version: string; planSha256: string; files: FileEvidence[];
  dependencies?: { productId: string; version: string; manifestSha256: string }[] };
export type AnalysisNoteVerification = NonNullable<AnalysisDelivery['verification']> & {
  productId: string; version: string; sourceManifestSha256: string; planSha256: string; archiveSha256: string;
};

function paths(root: string, id: string) {
  if (!/^(?:P-\d{2}|MUNI-MANUFACTURING)$/.test(id)) throw Error('商品IDが不正です');
  return { landing: path.join(root, datasetDir('products.landings'), `${id.toLowerCase()}.json`),
    evidence: path.join(root, datasetDir('products.landing-evidence'), `${id.toLowerCase()}.json`) };
}

function artifactPath(directory: string, file: string) {
  if (!/^[a-zA-Z0-9._/-]+$/.test(file) || file.split('/').some(part => ['.', '..', ''].includes(part))) throw Error(`安全でない納品パス: ${file}`);
  const result = path.resolve(directory, file);
  if (!result.startsWith(`${path.resolve(directory)}${path.sep}`)) throw Error(`納品範囲外: ${file}`);
  return result;
}

/** Every byte is checked against the generated evidence, including ZIP members and reuse dependencies. */
export async function inspectAnalysisRelease(root: string, id: string, ancestors: readonly string[] = []) {
  if (ancestors.includes(id)) throw Error('分析の再利用参照が循環しています');
  const files = paths(root, id);
  const landing = read(files.landing);
  const evidence = read(files.evidence);
  assertDatasetShape('products.landings', landing);
  assertDatasetShape('products.landing-evidence', evidence);
  if (landing.productId !== id || evidence.productId !== id) throw Error('商品IDと台帳が一致しません');
  const plan = landing.analysisRevision ?? landing.analysisReuse;
  if (!plan || !/^[a-z0-9-]+$/.test(plan.version)) throw Error('分析の版がありません');
  const directory = path.join(root, '.local/data-packs', id, plan.version);
  const manifestBytes = fs.readFileSync(path.join(directory, 'manifest.json'));
  const manifest: Manifest = JSON.parse(manifestBytes.toString('utf8'));
  if (manifest.productId !== id || manifest.version !== plan.version || manifest.planSha256 !== hash(JSON.stringify(plan)) ||
      JSON.stringify(evidence.analysisRevision ?? evidence.reuseRevision) !== JSON.stringify(manifest)) throw Error('分析のmanifest・商品ID・版・台帳SHAが一致しません');
  const seen = new Set<string>();
  for (const item of manifest.files) {
    if (seen.has(item.file)) throw Error(`manifestのファイル重複: ${item.file}`);
    seen.add(item.file);
    const bytes = fs.readFileSync(artifactPath(directory, item.file));
    if (bytes.length !== item.bytes || hash(bytes) !== item.sha256) throw Error(`分析ファイルのSHA不一致: ${item.file}`);
  }
  for (const required of ['analysis-pack.zip', 'preview-product.json', 'README.md']) if (!seen.has(required)) throw Error(`必須の分析ファイルがありません: ${required}`);
  const archiveBytes = fs.readFileSync(path.join(directory, 'analysis-pack.zip'));
  const archive = await JSZip.loadAsync(archiveBytes);
  const zippedFiles = manifest.files.filter(item => !['analysis-pack.zip', 'preview-product.json'].includes(item.file));
  if (Object.values(archive.files).filter(item => !item.dir).length !== zippedFiles.length) throw Error('ZIPのファイル集合が一致しません');
  for (const item of zippedFiles) {
    const entry = archive.file(item.file);
    if (!entry || hash(await entry.async('nodebuffer')) !== item.sha256) throw Error(`ZIPのSHA不一致: ${item.file}`);
  }
  const warnings: string[] = [];
  for (const item of manifest.files.filter(item => /(?:^|\/)README\.md$/.test(item.file))) {
    try { assertPublishedAnalysisCopy(fs.readFileSync(artifactPath(directory, item.file), 'utf8')); }
    catch { warnings.push(`${id}/${item.file}: 配布前の文言を修正して再生成してください`); }
  }
  const specs = new Map<string, string>();
  if (seen.has('figure-specs.json')) {
    for (const item of read(path.join(directory, 'figure-specs.json')).figures) {
      if (specs.has(item.file)) throw Error('画像仕様のファイル重複');
      specs.set(item.file, item.template);
    }
  }
  for (const dependency of manifest.dependencies ?? []) {
    const upstream = await inspectAnalysisRelease(root, dependency.productId, [...ancestors, id]);
    if (upstream.delivery.version !== dependency.version || upstream.delivery.sourceManifestSha256 !== dependency.manifestSha256) throw Error('再利用元の版またはSHAが不一致です');
    warnings.push(...upstream.warnings);
    for (const [file, template] of upstream.specs) specs.set(`${dependency.productId.toLowerCase()}-${file}`, template);
  }
  const candidate: StorefrontProduct = read(path.join(directory, 'preview-product.json'));
  if (candidate.id !== id || candidate.slug !== `data-${id.toLowerCase()}-${plan.version}` || candidate.channel !== 'note') throw Error('分析LPの商品IDまたは版が不一致です');
  const sectionIds = new Set<string>();
  const imageFiles = new Set<string>();
  const templates = new Set((read(path.join(root, datasetPath('content.image-templates'))).templates as { id: string }[]).map(item => item.id));
  const delivery: AnalysisDelivery = {
    productId: id, status: 'prepared', version: plan.version, sourceManifestSha256: hash(manifestBytes), planSha256: manifest.planSha256,
    archive: { bucket: R2_PRIVATE_BUCKET, key: `note/product-analysis-archives/${id}/${plan.version}/${hash(archiveBytes)}.zip`, sha256: hash(archiveBytes), bytes: archiveBytes.length },
    attachmentName: `${id}-${plan.version}-analysis.zip`,
    snapshot: { description: candidate.description, included: [...candidate.included], useCases: candidate.useCases ?? [],
      purchaseNotes: [...(candidate.purchaseNotes ?? [])], showcaseNote: candidate.showcaseNote ?? '',
      showcase: (candidate.showcase ?? []).map((section, index) => {
        const sectionId = section.id ?? `analysis-file-${index}`;
        if (sectionIds.has(sectionId)) throw Error('分析の作成例IDが重複しています');
        sectionIds.add(sectionId);
        return { ...section, id: sectionId, figures: section.figures.map(figure => {
          const item = manifest.files.find(item => item.file === `images/${figure.file}`);
          const template = specs.get(figure.file);
          if (!item || !template || !templates.has(template) || template === 'unclassified' || imageFiles.has(figure.file)) throw Error(`分析画像の根拠・型または重複が不正: ${figure.file}`);
          imageFiles.add(figure.file);
          return { ...figure, file: `${plan.version}-${figure.file}`, template, sha256: item.sha256 };
        }) };
      }) },
  };
  assertDatasetShape('products.landing-evidence', { ...evidence, analysisDelivery: delivery });
  try { assertPublishedAnalysisCopy(delivery.snapshot); }
  catch { warnings.push(`${id}/snapshot: 公開前の文言を修正して再生成してください`); }
  const fixedIds = new Set(landing.examples.map((example: { id: string }) => example.id));
  if (delivery.snapshot.showcase.some(section => fixedIds.has(section.id))) throw Error('固定版と分析追加版の作成例IDが重複しています');
  return { files, landing, evidence, directory, manifest, delivery, archiveBytes, specs, warnings: [...new Set(warnings)] };
}

async function verifyPrivateArchive(delivery: AnalysisDelivery, store: CoverStore, bytes?: Buffer) {
  const existing = await store.get(delivery.archive.key);
  if (existing && (hash(existing) !== delivery.archive.sha256 || existing.length !== delivery.archive.bytes)) throw Error('非公開ZIPのSHA不一致');
  if (!existing && bytes) await store.put(delivery.archive.key, bytes);
  const stored = existing ?? await store.get(delivery.archive.key);
  if (!stored || hash(stored) !== delivery.archive.sha256 || stored.length !== delivery.archive.bytes) throw Error('非公開ZIPの読み戻しSHA不一致');
}

export async function prepareAnalysisDelivery(root: string, id: string, options: { commit?: boolean; check?: boolean; store?: CoverStore } = {}) {
  const inspected = await inspectAnalysisRelease(root, id);
  const { delivery, evidence, warnings } = inspected;
  const previous: AnalysisDelivery | undefined = evidence.analysisDelivery;
  if (previous) {
    const { verification: _verification, ...stable } = previous;
    if (JSON.stringify({ ...stable, status: 'prepared' }) !== JSON.stringify(delivery)) throw Error('準備・公開済みの分析版が変わっています。別の版で生成してください');
  }
  if (options.check && !previous) throw Error('分析追加版のprepared台帳がありません');
  if (!options.commit) return { delivery: previous ?? delivery, warnings, committed: false };
  if (warnings.length) throw Error(warnings.join('\n'));
  await verifyPrivateArchive(delivery, options.store ?? (await import('../note/lib/cover-storage.mjs')).createR2Store({ bucket: R2_PRIVATE_BUCKET, writeOnce: true, maxBytes: delivery.archive.bytes }), inspected.archiveBytes);
  const imageDirectory = path.join(root, '.local/r2/app/products', `data-${id.toLowerCase()}`, 'showcase');
  fs.mkdirSync(imageDirectory, { recursive: true });
  for (const figure of delivery.snapshot.showcase.flatMap(section => section.figures)) {
    const bytes = fs.readFileSync(artifactPath(inspected.directory, `images/${figure.file.slice(delivery.version.length + 1)}`));
    const target = path.join(imageDirectory, figure.file);
    if (fs.existsSync(target) && hash(fs.readFileSync(target)) !== figure.sha256) throw Error('既存の版付き公開画像のSHAが異なります');
    fs.writeFileSync(target, bytes);
  }
  const next = { ...evidence, analysisDelivery: previous ?? delivery };
  assertDatasetShape('products.landing-evidence', next);
  fs.writeFileSync(inspected.files.evidence, json(next));
  return { delivery: next.analysisDelivery, warnings, committed: true };
}

/** Flat verification evidence is deliberately strict so wrong-product or stale note evidence cannot promote a delivery. */
export function verifyAnalysisNote(delivery: AnalysisDelivery, verification: AnalysisNoteVerification, product: Pick<StorefrontProduct, 'id' | 'externalUrl' | 'priceYen'>) {
  const keys = ['productId', 'version', 'sourceManifestSha256', 'planSha256', 'archiveSha256', 'noteUrl', 'verifiedAt', 'priceYen', 'attachmentName', 'paidBodySha256'];
  if (!verification || typeof verification !== 'object' || Object.keys(verification).length !== keys.length || keys.some(key => !Object.hasOwn(verification, key))) throw Error('note確認JSONのshapeが不正です');
  if (verification.productId !== delivery.productId || verification.productId !== product.id || verification.version !== delivery.version ||
      verification.sourceManifestSha256 !== delivery.sourceManifestSha256 || verification.planSha256 !== delivery.planSha256 ||
      verification.archiveSha256 !== delivery.archive.sha256 || verification.attachmentName !== delivery.attachmentName ||
      verification.noteUrl !== product.externalUrl || verification.priceYen !== product.priceYen) throw Error('note確認と商品・版・価格・添付SHAが一致しません');
  if (!Number.isFinite(Date.parse(verification.verifiedAt)) || Date.parse(verification.verifiedAt) > Date.now() + 300_000) throw Error('note確認日時が不正です');
  const { productId: _id, version: _version, sourceManifestSha256: _manifest, planSha256: _plan, archiveSha256: _archive, ...note } = verification;
  return { ...delivery, status: 'published' as const, verification: note };
}

export async function publishAnalysisDelivery(root: string, id: string, verification: AnalysisNoteVerification, options: { commit?: boolean; store?: CoverStore } = {}) {
  const inspected = await inspectAnalysisRelease(root, id);
  const previous: AnalysisDelivery | undefined = inspected.evidence.analysisDelivery;
  if (!previous) throw Error('先にprepare --commitを実行してください');
  await prepareAnalysisDelivery(root, id);
  if (inspected.warnings.length) throw Error(inspected.warnings.join('\n'));
  const articles = read(path.join(root, datasetPath('note.articles'))).articles;
  const article = articles.find((item: { key: string }) => item.key === inspected.landing.articleKey);
  if (!article || article.status !== 'published' || !article.isPaid) throw Error('公開済みの有料note記事がありません');
  const published = verifyAnalysisNote(previous, verification, { id, externalUrl: article.noteUrl, priceYen: article.priceJpy });
  const next = { ...inspected.evidence, analysisDelivery: published };
  assertDatasetShape('products.landing-evidence', next);
  assertPublishedAnalysisCopy(published.snapshot);
  if (!options.commit) return { delivery: published, committed: false };
  if (previous.status === 'published' && JSON.stringify(previous) !== JSON.stringify(published)) throw Error('公開済みのnote確認記録は変更できません');
  await verifyPrivateArchive(published, options.store ?? (await import('../note/lib/cover-storage.mjs')).createR2Store({ bucket: R2_PRIVATE_BUCKET, writeOnce: true, maxBytes: published.archive.bytes }));
  // Exercise the same merge used by the storefront, before changing publication status.
  readProductLanding(root, id, inspected.landing.articleKey, { includePreparedAnalysis: true });
  fs.writeFileSync(inspected.files.evidence, json(next));
  return { delivery: published, committed: true };
}

if (require.main === module) {
  (async () => {
    const arg = (name: string) => { const index = process.argv.indexOf(name); return index < 0 ? undefined : process.argv[index + 1]; };
    const command = process.argv[2];
    if (!['prepare', 'publish'].includes(command)) throw Error('prepare --id <ID> | prepare --all | publish --id <ID> --verification <JSON> [--commit]');
    const allowed = new Set(['--id', '--all', '--verification', '--commit', '--check']);
    for (const value of process.argv.slice(3)) if (value.startsWith('--') && !allowed.has(value)) throw Error(`不明な引数: ${value}`);
    if (process.argv.includes('--all') === Boolean(arg('--id'))) throw Error('--id または --all の一方を指定してください');
    if (command === 'publish' && (process.argv.includes('--all') || !arg('--verification'))) throw Error('publishは商品1件と--verificationが必要です');
    dotenv.config({ path: path.join(ROOT, '.env.local'), quiet: true });
    const ids: string[] = process.argv.includes('--all') ? fs.readdirSync(path.join(ROOT, datasetDir('products.landings'))).filter(file => file.endsWith('.json'))
      .map(file => read(path.join(ROOT, datasetDir('products.landings'), file))).filter(item => item.analysisRevision || item.analysisReuse).map(item => item.productId) : [arg('--id')!];
    for (const id of ids) {
      const options = { commit: process.argv.includes('--commit'), check: process.argv.includes('--check') };
      const result = command === 'prepare' ? await prepareAnalysisDelivery(ROOT, id, options) :
        await publishAnalysisDelivery(ROOT, id, read(path.resolve(arg('--verification')!)), options);
      console.log(JSON.stringify({ id, version: result.delivery.version, status: result.delivery.status, committed: result.committed,
        attachmentName: result.delivery.attachmentName, archive: result.delivery.archive, ...('warnings' in result ? { warnings: result.warnings } : {}) }));
    }
  })().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
}
