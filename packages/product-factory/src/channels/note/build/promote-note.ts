/**
 * promote (N4-N5): canonical 記事を docs/31 outbox + note catalog data へ draft 展開する。
 *
 * - 本文 (draft.md) は既存 note フロー形式 (`type: note-draft` frontmatter) へ変換して
 *   `docs/31_note記事原稿/product-sales/<slug>/` へ書き出す (ephemeral outbox・published:false)。
 * - editorial メタは note 記事台帳 `data/note/articles.json` のレコードとして返す
 *   (別カタログを作らない = 仕様 §5)。台帳への追加は記事台帳の書き込み口が行う。
 * - note.com 公開・R2 保存はしない (人間工程)。本文は note:article save で private/公開 R2 へ保存する。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NoteArticlePlan } from "../types";
import type { ProductDefinition } from "../../../catalog/types";
import { ALL_PRODUCTS } from "../../../catalog/products";
import { CANONICAL_ARTICLES } from "../article-plan";
import { resolveAttachments, buildAttachmentsJson } from "../generators/attachments";
import { resolveProvenance } from "../generators/manifest";
import { renderDraft } from "../generators/draft";
import { resolveHashtags, renderHashtags } from "../generators/hashtags";
import { renderReview } from "../generators/review";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const DOCS31_ROOT_DEFAULT = resolve(REPO_ROOT, "docs/31_note記事原稿/product-sales");
/** note 記事台帳 (data/note/articles.json) に追加する 1 記事の元になるエントリ。 */
export interface NoteCatalogEntry {
  readonly key: string;
  readonly title: string;
  readonly isPaid: boolean;
  readonly priceJpy: number;
  readonly status: "draft";
  readonly r2Path: string;
}

export interface PromoteOptions {
  readonly docs31Root?: string;
  readonly created?: string;
  readonly dryRun?: boolean;
}

/** renderDraft の出力 (先頭 frontmatter 付き) から本文だけを取り出す。 */
function stripFrontmatter(md: string): string {
  return md.replace(/^---\n[\s\S]*?\n---\n\n/, "");
}

/** docs/31 用 note-draft frontmatter + 本文。 */
function toNoteDraftFile(
  article: NoteArticlePlan,
  body: string,
  created: string,
): string {
  const tags = resolveHashtags(article);
  const fm = [
    "---",
    "type: note-draft",
    "vertical: product-sales",
    `category: ${article.series}`,
    `slug: ${article.slug}`,
    `title: ${article.title}`,
    `created: ${created}`,
    "status: draft",
    `is_paid: ${article.access === "paid"}`,
    `price_jpy: ${article.priceJpy}`,
    `tags: [${tags.join(", ")}]`,
    "published: false",
    "source: product-factory (deterministic draft — 公開前に critic/人間レビューが必要)",
    "---",
  ].join("\n");
  return `${fm}\n\n${body}`;
}

/** 記事 1 本を docs/31 outbox へ展開し、catalog エントリを返す。 */
export function promoteNoteArticle(
  article: NoteArticlePlan,
  products: readonly ProductDefinition[] = ALL_PRODUCTS,
  opts: PromoteOptions = {},
): NoteCatalogEntry {
  if (opts.dryRun !== true) throw new Error('promote --apply is blocked: pinned revision, independent review and owner approval are required; generate --revision <new-id> --all first');
  const created = opts.created ?? new Date().toISOString().slice(0, 10);
  const docsRoot = opts.docs31Root ?? DOCS31_ROOT_DEFAULT;
  const outDir = join(docsRoot, article.slug);

  const { attachments } = resolveAttachments(article, products);
  const provenance = resolveProvenance(article, products);
  const body = stripFrontmatter(renderDraft(article, products, attachments, provenance));
  const draftFile = toNoteDraftFile(article, body, created);

  if (!opts.dryRun) {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "draft.md"), draftFile);
    writeFileSync(join(outDir, "hashtags.txt"), renderHashtags(article));
    writeFileSync(join(outDir, "attachments.json"), buildAttachmentsJson(article, attachments));
    writeFileSync(join(outDir, "REVIEW.md"), renderReview(article, draftFile, attachments));
  }

  return {
    key: article.slug,
    title: article.title,
    isPaid: article.access === "paid",
    priceJpy: article.priceJpy,
    status: "draft",
    r2Path: `note/product-sales/${article.slug}`,
  };
}

/** 記事台帳のレコード (data/note/articles.schema.json の article) に変換する。本文は未保存 (manifest null)。 */
export function toLedgerArticle(e: NoteCatalogEntry) {
  return {
    key: e.key,
    vertical: "product-sales" as const,
    title: e.title,
    magazine: null,
    isPaid: e.isPaid,
    ...(e.isPaid ? { priceJpy: e.priceJpy } : {}),
    status: e.status,
    r2Path: e.r2Path,
    body: { store: e.isPaid ? ("r2-private" as const) : ("r2-public" as const), manifest: null },
  };
}

export interface PromoteAllResult {
  readonly entries: NoteCatalogEntry[];
  /** 記事台帳へ追加するレコード (書き込みは呼び出し側。promote は台帳を直接書かない) */
  readonly ledgerArticles: ReturnType<typeof toLedgerArticle>[];
  readonly docsWritten: number;
  readonly dryRun: boolean;
}

/** 全 canonical 記事を docs/31 へ展開し、記事台帳へ追加するレコードを返す。 */
export function promoteAllNoteArticles(
  articles: readonly NoteArticlePlan[] = CANONICAL_ARTICLES,
  products: readonly ProductDefinition[] = ALL_PRODUCTS,
  opts: PromoteOptions = {},
): PromoteAllResult {
  if (opts.dryRun !== true) throw new Error('promote --apply is blocked: existing catalog/drafts must not be overwritten; use a reviewed pinned revision');
  const entries: NoteCatalogEntry[] = [];
  let docsWritten = 0;
  for (const article of articles) {
    entries.push(promoteNoteArticle(article, products, opts));
    if (!opts.dryRun) docsWritten += 1;
  }
  return { entries, ledgerArticles: entries.map(toLedgerArticle), docsWritten, dryRun: !!opts.dryRun };
}
