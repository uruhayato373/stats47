/**
 * note 記事ドラフトのビルダー (単一 slug)。
 * article-plan + 商品 manifest から 7 ファイルを `.local/note-products/<series>/<slug>/` に書き出す
 * (git 管理外・note.com へは投稿しない)。
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NoteArticlePlan } from "../types";
import type { ProductDefinition } from "../../../catalog/types";
import { ALL_PRODUCTS } from "../../../catalog/products";
import { resolveAttachments, buildAttachmentsJson } from "../generators/attachments";
import { resolveProvenance, buildSourceManifest, buildProductLinks } from "../generators/manifest";
import { renderDraft } from "../generators/draft";
import { renderHashtags } from "../generators/hashtags";
import { buildImagesPlan } from "../generators/images-plan";
import { renderReview } from "../generators/review";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
export const NOTE_OUT_ROOT_DEFAULT = resolve(REPO_ROOT, ".local/note-products");

export interface NoteBuildOptions {
  readonly outRoot?: string;
  readonly coconalaRoot?: string;
  readonly version?: string;
}

export interface NoteBuildResult {
  readonly slug: string;
  readonly series: string;
  readonly access: string;
  readonly outDir: string;
  readonly files: readonly string[];
  readonly attachmentCount: number;
  /** 未生成 (manifest 無し) の member 商品。 */
  readonly missingProducts: readonly string[];
}

/** 記事 1 本のドラフト一式を生成して書き出す。 */
export function buildNoteArticle(
  article: NoteArticlePlan,
  products: readonly ProductDefinition[] = ALL_PRODUCTS,
  opts: NoteBuildOptions = {},
): NoteBuildResult {
  if (!opts.outRoot) throw new Error('Legacy note generation is disabled: use generate --revision <new-id> --all for pinned deliveries');
  const outRoot = opts.outRoot ?? NOTE_OUT_ROOT_DEFAULT;
  const outDir = join(outRoot, article.series, article.slug);
  if (existsSync(outDir)) throw new Error('Existing note draft directory: never overwrite; choose a new revision');
  mkdirSync(outDir, { recursive: true });

  const { attachments, missing } = resolveAttachments(article, products, {
    coconalaRoot: opts.coconalaRoot,
    version: opts.version,
  });
  const provenance = resolveProvenance(article, products, {
    coconalaRoot: opts.coconalaRoot,
    version: opts.version,
  });
  const draft = renderDraft(article, products, attachments, provenance);

  const files: Array<[string, string]> = [
    ["draft.md", draft],
    ["hashtags.txt", renderHashtags(article)],
    ["attachments.json", buildAttachmentsJson(article, attachments)],
    ["source-manifest.json", buildSourceManifest(article, provenance)],
    ["product-links.json", buildProductLinks(article, products)],
    ["images-plan.json", buildImagesPlan(article)],
    ["REVIEW.md", renderReview(article, draft, attachments)],
  ];
  for (const [name, content] of files) {
    writeFileSync(join(outDir, name), content);
  }

  return {
    slug: article.slug,
    series: article.series,
    access: article.access,
    outDir,
    files: files.map(([n]) => n),
    attachmentCount: attachments.length,
    missingProducts: missing,
  };
}
