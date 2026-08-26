/**
 * 検索インデックス生成スクリプト (完全DBレス: docs/01_技術設計/02_データアーキテクチャ.md)
 *
 * 3 つの SSOT を統合して MiniSearch 用の search-index.json と
 * フィルタ用の search-index-meta.json を生成する:
 *   - ranking docs : R2 ranking item.json (listRankingItemsWithTagsFromR2) + git TS の description
 *   - blog docs    : R2 app/blog/all.json (BlogSnapshot, export-blog-snapshot の出力)
 *   - categories   : git TS categories マスタ (@stats47/data-configs)
 *
 * 旧 D1 (metrics LEFT JOIN categories / articles) 依存を撤廃。
 *
 * 使用方法: NODE_ENV=development NODE_OPTIONS='--conditions react-server' \
 *             npx tsx scripts/generate-search-index.ts
 *   ※ 実行前に export-blog-snapshot.ts を走らせて app/blog/all.json を最新化すること
 */

import dotenv from "dotenv";
import fs from "fs";
import MiniSearch from "minisearch";
import path from "path";

import { getCategoryName, getMetricConfig, listCategories } from "@stats47/data-configs";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";
import { listRankingItemsWithTagsFromR2 } from "@stats47/ranking/server";

import {
  BLOG_SNAPSHOT_KEY,
  type BlogSnapshot,
} from "../src/features/blog/types/snapshot";
import { tokenize } from "../src/features/search/lib/tokenize";
import type { ContentType, SearchDocument } from "../src/features/search/types/search.types";
import { configureSearchIndexR2Environment } from "./lib/search-index-r2-env";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
configureSearchIndexR2Environment(process.env);

const STORE_FIELDS = [
  "id",
  "title",
  "description",
  "type",
  "url",
  "category",
  "categoryKey",
  "tags",
  "subtitle",
  "demographicAttr",
  "normalizationBasis",
  "latestYear",
  "publishedAt",
  "updatedAt",
];

const miniSearch = new MiniSearch<SearchDocument>({
  fields: ["title", "description"],
  storeFields: STORE_FIELDS,
  tokenize,
  searchOptions: {
    boost: { title: 3 },
    fuzzy: 0.2,
    prefix: true,
  },
});

interface CategoryMetaOut {
  categoryKey: string;
  categoryName: string;
}

function shouldSkipR2ForLocalPrebuild(): boolean {
  if (process.env.CLOUDFLARE_WORKERS === "true") return false;
  if (process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true") return false;
  if (process.env.R2_PUBLIC_FETCH_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_URL) return false;
  if (
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_S3_ENDPOINT
  ) {
    return false;
  }
  return true;
}

async function main() {
  const documents: SearchDocument[] = [];
  const indexPath = path.join(process.cwd(), "public", "search-index.json");
  const metaPath = path.join(process.cwd(), "public", "search-index-meta.json");

  if (shouldSkipR2ForLocalPrebuild() && fs.existsSync(indexPath) && fs.existsSync(metaPath)) {
    console.log(
      "ℹ️  ローカルでは R2 を読まないため、既存の search-index.json / meta を保持します",
    );
    return;
  }

  // 1. ランキング項目（R2 item.json メタ + git TS の description）
  try {
    const result = await listRankingItemsWithTagsFromR2({
      areaType: "prefecture",
      isActive: true,
    });
    if (!result.success) throw result.error;
    const items = [...result.data];
    items.sort((a, b) => a.rankingKey.localeCompare(b.rankingKey));

    for (const item of items) {
      // description は MiniSearch の検索対象 field。subtitle + git TS の description を結合する
      // (item.json は plain description を持たないため git TS registry から補完)。
      const tsDescription = getMetricConfig(item.rankingKey)?.description;
      const description =
        [item.subtitle, tsDescription].filter(Boolean).join(" ") || item.title;

      documents.push({
        id: `ranking_${item.rankingKey}_${item.areaType}`,
        title: item.title,
        description,
        type: "ranking" as ContentType,
        url: `/ranking/${item.rankingKey}`,
        category: (item.categoryKey ? getCategoryName(item.categoryKey) : null) ?? undefined,
        categoryKey: item.categoryKey ?? undefined,
        subtitle: item.subtitle ?? undefined,
        demographicAttr: item.demographicAttr ?? undefined,
        normalizationBasis: item.normalizationBasis ?? undefined,
        latestYear: item.latestYear?.yearName,
      });
    }
    console.log(`ランキング: ${documents.length}件`);
  } catch (error) {
    console.warn("ランキング項目の取得に失敗:", error);
  }

  const rankingCount = documents.length;

  // 2. ブログ記事（R2 app/blog/all.json）
  try {
    const snapshot = await fetchFromR2AsJson<BlogSnapshot>(BLOG_SNAPSHOT_KEY);
    const articles = (snapshot?.articles ?? []).filter((a) => a.published === true);

    for (const a of articles) {
      const tags = a.tags.map((t) => t.tagKey);
      const tagsStr = tags.join(", ");
      const description = [a.description, tagsStr].filter(Boolean).join(" ");
      const category = tags[0] || "ブログ";

      documents.push({
        id: `blog_${a.slug}`,
        title: a.title,
        description: description || a.title,
        type: "blog" as ContentType,
        url: `/blog/${a.slug}`,
        category,
        tags: tags.length > 0 ? tags : undefined,
        publishedAt: a.publishedAt ? new Date(a.publishedAt).toISOString() : undefined,
        updatedAt: a.updatedAt ? new Date(a.updatedAt).toISOString() : undefined,
      });
    }
    console.log(`ブログ: ${documents.length - rankingCount}件`);
  } catch (error) {
    console.warn("ブログ記事の取得に失敗:", error);
  }

  // R2 データ源が読めない環境 (CI で R2 不在 等) では documents が 0 件になる。
  // この場合に空インデックスで上書きすると本番検索が壊れるため、既存の committed
  // search-index.json を保持して early return する (旧 D1 版の writeEmptyIndex と同じ安全策)。
  // search-index.json はローカルで再生成して commit する運用 (prebuild の CI 実行は no-op)。
  if (documents.length === 0 && fs.existsSync(indexPath) && fs.existsSync(metaPath)) {
    console.log(
      "ℹ️  ドキュメント 0 件 (R2 データ源不在)。既存の search-index.json / meta を保持します",
    );
    return;
  }

  // MiniSearch に追加
  miniSearch.addAll(documents);

  const indexJson = JSON.stringify(miniSearch.toJSON());
  fs.writeFileSync(indexPath, indexJson, "utf-8");
  console.log(`✅ search-index.json を出力: ${indexPath} (${documents.length}件)`);

  // 3. フィルタ用メタ（categories = git TS / blogTags・blogYears = blog docs から集計）
  const categoriesMeta: CategoryMetaOut[] = listCategories().map((c) => ({
    categoryKey: c.categoryKey,
    categoryName: c.categoryName,
  }));

  const tagCountMap = new Map<string, number>();
  const yearSet = new Set<string>();
  for (const doc of documents) {
    if (doc.type !== "blog") continue;
    if (doc.tags) {
      for (const tag of doc.tags) {
        tagCountMap.set(tag, (tagCountMap.get(tag) ?? 0) + 1);
      }
    }
    if (doc.publishedAt) {
      yearSet.add(doc.publishedAt.slice(0, 4));
    }
  }
  const blogTags = [...tagCountMap.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
  const blogYears = [...yearSet].sort().reverse();

  const meta = { categories: categoriesMeta, blogTags, blogYears };
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf-8");
  console.log(`✅ search-index-meta.json を出力: ${metaPath}`);
}

main().catch((error) => {
  console.error("インデックス生成中にエラーが発生しました:", error);
  process.exit(1);
});
