/** Private preparation revision. Published delivery contracts select inputs; no v1 fallback. */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CANONICAL_ARTICLES } from '../article-plan';
import type { NoteArticlePlan } from '../types';
import { scanText } from '../validators/claims';
import { readFreeSampleDelivery } from '../../../build/free-sample-delivery';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../../..');
const hash = (bytes: Buffer | string): string => createHash('sha256').update(bytes).digest('hex');
interface FileEvidence { path: string; bytes: number; sha256: string }
interface Delivery {
  artifactDirectory: string; manifestSha256: string; indicatorCount: number;
  pptxIndicatorCount: number; hasXlsx: boolean; officeValidation: string;
}
interface Listing { title: string; serviceUrl?: string; _delivery?: Delivery }
interface PackEvidence {
  manifest: { productId: string; version: string; year: string; files: FileEvidence[] };
  manifestSha256: string; rows: string[][]; sources: Record<string, string>[];
  count: number; slides: number; hasXlsx: boolean;
}

function preparationListings(root: string): Record<string, Listing> {
  const listings = JSON.parse(readFileSync(join(root, '.claude/config/coconala-listings.json'), 'utf8')) as { listings: Record<string, Listing> };
  const free = readFreeSampleDelivery(root);
  return { ...listings.listings, ...(free ? { 'P-13': free } : {}) };
}
export interface NoteRevisionItem {
  productId: string; slug: string; access: string; proposedPriceYen: number;
  status: 'draft-blocked'; readyToPublish: false; outDir: string;
  sourceRevision: string | null; sourceDirectory: string | null; sourceManifestSha256: string | null;
  sourceFiles: FileEvidence[]; attachments: Array<FileEvidence & { sourcePath: string; verified: false }>;
  missingProducts: string[]; blockers: string[]; validationErrors: string[];
  generatedFiles: FileEvidence[];
}
export interface NoteRevisionReport {
  schemaVersion: 1; generatedAt: string; revision: string; outputRoot: string;
  externalChanges: false; readyToPublish: false; items: NoteRevisionItem[];
}

function contained(root: string, candidate: string): void {
  const rel = relative(root, candidate);
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) throw new Error(`unsafe path: ${candidate}`);
}

/** The shared Coconala audit verifies the manifest and every file, CSV counts and PPT scope. */
async function verifyInput(root: string, pid: string, listing: Listing): Promise<PackEvidence> {
  const contract = listing._delivery;
  if (!contract || !/^[a-f0-9]{64}$/.test(contract.manifestSha256)) throw new Error('pinned delivery contract missing');
  const artifactRoot = resolve(root, '.local/coconala-products', pid);
  const dir = resolve(root, contract.artifactDirectory);
  contained(artifactRoot, dir);
  contained(realpathSync(artifactRoot), realpathSync(dir));
  const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8')) as PackEvidence['manifest'];
  if (manifest.productId !== pid || manifest.version !== relative(artifactRoot, dir)) throw new Error('manifest identity mismatch');
  const names = manifest.files.map(file => file.path);
  if (new Set(names).size !== names.length) throw new Error('duplicate manifest files');
  for (const required of ['data.csv', 'SOURCES.csv', 'LICENSE-ja.txt', pid === 'P-13' ? 'databook.pdf' : 'product.pptx']) {
    if (!names.includes(required)) throw new Error(`manifest missing ${required}`);
  }
  for (const file of manifest.files) {
    contained(dir, resolve(dir, file.path));
    contained(realpathSync(dir), realpathSync(resolve(dir, file.path)));
  }
  const audit = await import(pathToFileURL(join(ROOT, '.claude/scripts/coconala/lib/pack-evidence.mjs')).href) as {
    inspectPack(root: string, listing: Listing): Promise<PackEvidence>;
  };
  return audit.inspectPack(root, listing);
}

function renderPreparation(article: NoteArticlePlan, listing: Listing | undefined, evidence: PackEvidence | null): string {
  const lines = ['---', `slug: ${article.slug}`, `title: ${listing?.title ?? article.title}`,
    `access: ${article.access}`, `price_jpy: ${article.priceJpy}`, 'published: false',
    'reviewer: (pending)', 'verdict: (pending)', 'ready_to_publish: false', '---', '',
    `# ${listing?.title ?? article.title}`, '',
    '> 非公開の販売準備原稿です。価格は提案値で、noteでの出品・公開・添付は未実施です。', '',
    '## この資料の目的', article.readerJob, '',
    '## 購入前に確認する範囲'];
  if (!evidence) {
    lines.push('検証済みの固定納品版がありません。ダウンロード可能なサンプルや販売可能な添付があるとは案内しません。');
  } else {
    lines.push(`- CSVには47地域・${evidence.count.toLocaleString('ja-JP')}指標を収録しています。`,
      evidence.slides ? `- PowerPointは${listing!._delivery!.pptxIndicatorCount}指標・${evidence.slides}枚です。全CSV指標をスライド化したものではありません。` : '- PowerPointは非同梱です。PDF・PNGは固定表示の見本です。',
      `- Excel: ${evidence.hasXlsx ? '同梱。実機での表示・編集・再計算は未確認です。' : '非同梱です。'}`,
      `- 収録年: ${evidence.manifest.year}。指標ごとに年・単位・地域の対象が異なります。`,
      '- 家計調査などは県庁所在市等を対象とし、県全体の値ではありません。SOURCES.csvで対象を確認してください。',
      '- 欠測・非該当をゼロに置き換えないでください。順位は指標の望ましさや因果関係を示しません。', '',
      '## 無料部分で確認できる読み方',
      'まず指標名の分母、単位、対象地域、年次をSOURCES.csvと照合します。人口当たりの値と総数は別指標として読み、異なる年の指標を同一年の比較と見なしません。',
      'CSVを編集してもPDF・PNGや他の同梱ファイルが自動更新される機能はありません。Officeファイルの有無は上記の納品範囲を確認してください。', '',
      '## 収録指標の表記例', ...evidence.rows[0].slice(2, 7).map(header => `- ${header}`));
  }
  lines.push('', '## 関連する無料データ', ...article.stats47Targets.map(target => `- [stats47 ${target}](https://stats47.jp${target})`));
  if (article.access === 'paid') lines.push('', '<!-- paid:start -->', '', '## 添付候補と検証経路',
    'attachments.jsonには固定納品版の参照パス・SHA-256・容量を記録しています。未検証の添付は公開しません。',
    'source-manifest.jsonには同じ版のSOURCES.csv全行とファイル検証記録を保存しています。');
  if (article.access === 'free' && evidence) lines.push('', '## 無料見本の対象',
    '総人口2024年のPDF・PNG・CSV、出典、利用条件を用意しています。公開サイトからのダウンロードはまだ行えません。公開前に添付方法と表示を確認します。',
    'この見本では表と固定画像の読みやすさを確認できます。有料版の全指標、ExcelやPowerPointの編集機能を試せる見本ではありません。');
  lines.push('', '## 利用条件と制約',
    '独自の編集・説明・レイアウト部分の利用範囲は同梱LICENSE-ja.txtに従います。原典データや著作権の生じない事実に、独自編集物の再配布制約を適用しません。',
    '国・府省・自治体やe-Statの公認・推奨ではありません。基準年固定で自動更新はありません。', '',
    '## 公開前に必要な作業',
    '- 読者の具体的な利用場面に沿った解説・図版を追加し、独立した意味レビューを受けます。この準備原稿だけでは販売準備完了としません。',
    '- Officeの実機確認、noteでの価格・利用条件・サポート範囲・添付方法の確認が必要です。',
    '- オーナーの承認後に、記事単位で公開手順を実施します。', '');
  return lines.join('\n');
}

/** Creates a new, immutable output folder; original note drafts and product bytes are untouched. */
export async function buildNoteRevision(options: {
  revision: string; root?: string; articles?: readonly NoteArticlePlan[];
}): Promise<NoteRevisionReport> {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]+$/.test(options.revision)) throw new Error('invalid revision');
  const root = options.root ?? ROOT;
  const outputRoot = resolve(root, '.local/note-products-revisions', options.revision);
  if (existsSync(outputRoot)) throw new Error('revision exists; never overwrite');
  const articles = options.articles ?? CANONICAL_ARTICLES;
  const listings = preparationListings(root);
  const report: NoteRevisionReport = { schemaVersion: 1, generatedAt: new Date().toISOString(), revision: options.revision,
    outputRoot: relative(root, outputRoot), externalChanges: false, readyToPublish: false, items: [] };
  mkdirSync(outputRoot, { recursive: true });
  for (const article of articles) {
    if (article.memberProductIds.length !== 1 || !/^[a-z0-9-]+$/.test(article.slug)) throw new Error('one canonical pack and safe slug required');
    const pid = article.memberProductIds[0];
    const listing = listings[pid];
    let evidence: PackEvidence | null = null;
    const validationErrors: string[] = [];
    if (listing?._delivery) {
      try { evidence = await verifyInput(root, pid, listing); }
      catch (error) { validationErrors.push(error instanceof Error ? error.message : String(error)); }
    }
    const outDir = join(outputRoot, article.slug);
    mkdirSync(outDir);
    const item: NoteRevisionItem = { productId: pid, slug: article.slug, access: article.access,
      proposedPriceYen: article.priceJpy, status: 'draft-blocked', readyToPublish: false,
      outDir: relative(root, outDir), sourceRevision: evidence?.manifest.version ?? null,
      sourceDirectory: evidence ? listing!._delivery!.artifactDirectory : null,
      sourceManifestSha256: evidence?.manifestSha256 ?? null, sourceFiles: evidence?.manifest.files ?? [],
      attachments: [], missingProducts: evidence ? [] : [pid], validationErrors, generatedFiles: [],
      blockers: ['semantic-review-pending', 'note-price-terms-and-attachment-review-pending', 'owner-publication-approval-pending'] };
    if (!evidence) item.blockers.push('pinned-delivery-missing-or-invalid');
    if (evidence && (evidence.hasXlsx || evidence.slides > 0) && listing!._delivery!.officeValidation !== 'verified') item.blockers.push('office-real-device-validation-pending');
    if (evidence) item.attachments = evidence.manifest.files
      .filter(file => !/^(listing|preview)\//.test(file.path))
      .map(file => ({ ...file, sourcePath: `${item.sourceDirectory}/${file.path}`, verified: false as const }));
    const draft = renderPreparation(article, listing, evidence);
    item.validationErrors.push(...scanText(draft, article.slug).map(issue => `${issue.code}: ${issue.message}`));
    if ((draft.match(/<!-- paid:start -->/g) ?? []).length !== (article.access === 'paid' ? 1 : 0)) item.validationErrors.push('paid boundary mismatch');
    const files: Record<string, string> = {
      'draft.md': draft,
      'attachments.json': JSON.stringify({ slug: article.slug, access: article.access, readyToPublish: false, attachments: item.attachments }, null, 2) + '\n',
      'source-manifest.json': JSON.stringify({ productId: pid, version: item.sourceRevision, manifestSha256: item.sourceManifestSha256,
        sourceDirectory: item.sourceDirectory, files: item.sourceFiles, sources: evidence?.sources ?? [], missingProducts: item.missingProducts }, null, 2) + '\n',
      'REVIEW.md': `# 非公開準備レビュー\n\nready_to_publish: false\nreviewer: (pending)\nverdict: (pending)\n\n${item.blockers.map(blocker => `- [ ] ${blocker}`).join('\n')}\n`,
    };
    for (const [name, content] of Object.entries(files)) {
      writeFileSync(join(outDir, name), content, { flag: 'wx' });
      item.generatedFiles.push({ path: name, bytes: Buffer.byteLength(content), sha256: hash(content) });
    }
    writeFileSync(join(outDir, 'readiness.json'), JSON.stringify(item, null, 2) + '\n', { flag: 'wx' });
    report.items.push(item);
  }
  writeFileSync(join(outputRoot, 'report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  return report;
}

/** Re-read bytes after generation; a report or a prior build alone is not validation. */
export async function validateNoteRevision(revision: string, root = ROOT): Promise<string[]> {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]+$/.test(revision)) throw new Error('invalid revision');
  const outputRoot = resolve(root, '.local/note-products-revisions', revision);
  const report = JSON.parse(readFileSync(join(outputRoot, 'report.json'), 'utf8')) as NoteRevisionReport;
  const listings = preparationListings(root);
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const item of report.items) {
    try {
      if (seen.has(item.productId)) throw new Error('duplicate product');
      seen.add(item.productId);
      if (item.readyToPublish !== false || !item.blockers.includes('semantic-review-pending')) throw new Error('review blocker removed');
      const dir = resolve(root, item.outDir);
      contained(outputRoot, dir);
      for (const file of item.generatedFiles) {
        const filePath = resolve(dir, file.path);
        contained(dir, filePath);
        const bytes = readFileSync(filePath);
        if (hash(bytes) !== file.sha256 || bytes.length !== file.bytes) throw new Error(`generated file changed: ${file.path}`);
      }
      if (JSON.stringify(JSON.parse(readFileSync(join(dir, 'readiness.json'), 'utf8'))) !== JSON.stringify(item)) throw new Error('readiness differs from report');
      if (item.sourceManifestSha256) {
        const listing = listings[item.productId];
        if (!listing?._delivery || item.sourceDirectory !== listing._delivery.artifactDirectory) throw new Error('delivery pointer changed');
        const evidence = await verifyInput(root, item.productId, listing);
        if (evidence.manifestSha256 !== item.sourceManifestSha256) throw new Error('source manifest changed');
      } else if (!item.missingProducts.includes(item.productId)) throw new Error('missing source not declared');
      if (item.access === 'free' && item.attachments.some(file => !file.sourcePath.startsWith('.local/coconala-products/P-13/'))) throw new Error('free article exposes a paid product');
      errors.push(...item.validationErrors.map(error => `${item.productId}: ${error}`));
    } catch (error) { errors.push(`${item.productId}: ${error instanceof Error ? error.message : String(error)}`); }
  }
  return errors;
}
