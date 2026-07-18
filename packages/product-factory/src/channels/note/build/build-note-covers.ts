/**
 * note 表紙 (cover) の PNG 生成 (仕様 §11)。
 * 決定的タイトルカード SVG → sharp で 1280×670 PNG。docs/31 の images/ へ書き出す。
 * 有料記事は完成イメージ (completion.png) に商品プレビューを再利用 (複製元は .local・SSOT を増やさない)。
 * note.com へは投稿しない。
 */
import { mkdirSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import type { NoteArticlePlan } from "../types";
import { CANONICAL_ARTICLES } from "../article-plan";
import { renderCoverSvg } from "../generators/cover";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const DOCS31_ROOT_DEFAULT = resolve(REPO_ROOT, "docs/31_note記事原稿/product-sales");
const COCONALA_ROOT = resolve(REPO_ROOT, ".local/coconala-products");

export interface CoverBuildResult {
  readonly slug: string;
  readonly cover: string;
  readonly completion: string | null;
}

export async function buildNoteCover(
  article: NoteArticlePlan,
  opts: { docs31Root?: string; version?: string } = {},
): Promise<CoverBuildResult> {
  const docsRoot = opts.docs31Root ?? DOCS31_ROOT_DEFAULT;
  const version = opts.version ?? "v1";
  const imagesDir = join(docsRoot, article.slug, "images");
  mkdirSync(imagesDir, { recursive: true });

  // 表紙 (1280×670)
  const svg = renderCoverSvg(article);
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  const coverPath = join(imagesDir, "cover.png");
  writeFileSync(coverPath, png);

  // 完成イメージ: 有料記事の先頭 member 商品プレビューを再利用 (複製元 SSOT は .local)
  let completion: string | null = null;
  if (article.access === "paid") {
    const firstMember = article.memberProductIds[0];
    const preview = join(COCONALA_ROOT, firstMember, version, "preview", "thumbnail-620x620.png");
    if (firstMember && existsSync(preview)) {
      const dst = join(imagesDir, "completion.png");
      copyFileSync(preview, dst);
      completion = dst;
    }
  }
  return { slug: article.slug, cover: coverPath, completion };
}

export async function buildAllNoteCovers(
  articles: readonly NoteArticlePlan[] = CANONICAL_ARTICLES,
  opts: { docs31Root?: string; onProgress?: (done: number, total: number, r: CoverBuildResult) => void } = {},
): Promise<CoverBuildResult[]> {
  const results: CoverBuildResult[] = [];
  let done = 0;
  for (const article of articles) {
    const r = await buildNoteCover(article, { docs31Root: opts.docs31Root });
    results.push(r);
    done += 1;
    opts.onProgress?.(done, articles.length, r);
  }
  return results;
}
