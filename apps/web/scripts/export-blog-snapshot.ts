/**
 * Blog snapshot exporter (完全DBレス: docs/01_技術設計/19_完全DBレス設計.md)
 *
 * 記事メタの SSOT は R2 `app/blog/<slug>/article.{md,mdx}` の YAML frontmatter。
 * D1 articles テーブルは廃止したため、frontmatter を直接読んで `app/blog/all.json` を生成する。
 * frontmatter → 列 のルールは packages/database/scripts/extract-articles-seed-from-r2.ts と一致させる
 * (published = fm.published ? true : false / ogImageType = typeof fm.ogImage==="string" ? "static" : null)。
 *
 * 使用方法: NODE_ENV=development npx tsx scripts/export-blog-snapshot.ts
 *   - dev (NODE_ENV=development): .local/r2 のローカル FS を読み書き
 *   - cloud: R2 S3 API (R2_S3_ENDPOINT 等が必要)
 */

import dotenv from "dotenv";
import yaml from "js-yaml";

import {
  fetchFromR2AsString,
  listFromR2,
  saveToR2,
} from "@stats47/r2-storage/server";

import {
  BLOG_SNAPSHOT_KEY,
  type BlogSnapshot,
  type SnapshotArticle,
  type SnapshotTagMeta,
} from "../src/features/blog/types/snapshot";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const BLOG_PREFIX = "app/blog/";

interface Frontmatter {
  title?: string;
  seoTitle?: string;
  description?: string;
  tags?: unknown;
  publishedAt?: unknown;
  updatedAt?: unknown;
  published?: boolean;
  ogImage?: string;
  [key: string]: unknown;
}

function parseFrontmatter(content: string): Frontmatter {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  try {
    return (yaml.load(match[1]) as Frontmatter) ?? {};
  } catch {
    return {};
  }
}

function normalizeDate(v: unknown): string | null {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (v && /^\d{4}-\d{2}-\d{2}/.test(String(v))) return String(v).slice(0, 10);
  return null;
}

interface SlugInfo {
  ext: "md" | "mdx" | null;
  hasCharts: boolean;
}

async function main() {
  // app/blog/ 配下の全キーを 1 度走査して slug ごとに index 化
  const keys = await listFromR2(BLOG_PREFIX);
  const slugInfo = new Map<string, SlugInfo>();
  for (const key of keys) {
    const rest = key.slice(BLOG_PREFIX.length); // <slug>/...
    const slash = rest.indexOf("/");
    if (slash < 0) continue;
    const slug = rest.slice(0, slash);
    const file = rest.slice(slash + 1);
    const info = slugInfo.get(slug) ?? { ext: null, hasCharts: false };
    if (file === "article.mdx") info.ext = "mdx";
    else if (file === "article.md" && info.ext !== "mdx") info.ext = "md";
    if (file.startsWith("data/") && file.endsWith(".json")) info.hasCharts = true;
    slugInfo.set(slug, info);
  }

  const slugs = [...slugInfo.entries()]
    .filter(([, v]) => v.ext !== null)
    .map(([slug]) => slug)
    .sort();
  console.log(`📄 article.{md,mdx} を持つ記事: ${slugs.length} 件`);

  const articles: SnapshotArticle[] = [];
  for (const slug of slugs) {
    const info = slugInfo.get(slug)!;
    const ext = info.ext!;
    const content = await fetchFromR2AsString(`${BLOG_PREFIX}${slug}/article.${ext}`);
    if (content === null) {
      console.warn(`⚠️  本文を読めませんでした: ${slug}`);
      continue;
    }
    const fm = parseFrontmatter(content);
    const tags = (Array.isArray(fm.tags) ? (fm.tags as string[]) : []).map(
      (tagKey) => ({ tagKey: String(tagKey) }),
    );
    articles.push({
      slug,
      title: fm.title ?? slug,
      seoTitle: fm.seoTitle ?? null,
      description: fm.description ?? null,
      filePath: `blog/${slug}/article.${ext}`,
      format: ext,
      hasCharts: info.hasCharts,
      published: fm.published === true,
      publishedAt: normalizeDate(fm.publishedAt),
      ogImageType: typeof fm.ogImage === "string" ? "static" : null,
      proofreadAt: null,
      createdAt: null,
      updatedAt: normalizeDate(fm.updatedAt),
      tags,
    });
  }

  const tagMetaCounter = new Map<string, number>();
  for (const a of articles) {
    if (!a.published) continue;
    for (const t of a.tags) {
      tagMetaCounter.set(t.tagKey, (tagMetaCounter.get(t.tagKey) ?? 0) + 1);
    }
  }
  const tagMeta: SnapshotTagMeta[] = [...tagMetaCounter.entries()]
    .map(([tagKey, articleCount]) => ({ tagKey, articleCount }))
    .sort((a, b) => b.articleCount - a.articleCount);

  const snapshot: BlogSnapshot = {
    generatedAt: new Date().toISOString(),
    articles,
    tagMeta,
  };

  const body = JSON.stringify(snapshot);
  const result = await saveToR2(BLOG_SNAPSHOT_KEY, body, {
    contentType: "application/json; charset=utf-8",
  });

  const publishedCount = articles.filter((a) => a.published).length;
  console.log(
    `✅ blog snapshot: articles=${snapshot.articles.length} published=${publishedCount} tags=${snapshot.tagMeta.length} bytes=${result.size} key=${result.key}`,
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
