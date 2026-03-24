/**
 * 検索インデックス生成スクリプト
 *
 * D1 の ranking_items / articles と categories から
 * MiniSearch 用の search-index.json と
 * フィルタ用の search-index-meta.json を生成する。
 *
 * 使用方法: npx tsx scripts/generate-search-index.ts
 */

import dotenv from "dotenv";
import { and, asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import fs from "fs";
import MiniSearch from "minisearch";
import path from "path";
import { createDatabaseClient } from "../../../packages/database/src/client";
import { LOCAL_DB_PATHS } from "../../../packages/database/src/config/local-db-paths";
import * as schema from "../../../packages/database/src/schema";
import { tokenize } from "../src/features/search/lib/tokenize";
import type { ContentType, SearchDocument } from "../src/features/search/types/search.types";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

function resolveDatabasePath(): string | null {
  if (process.env.LOCAL_DB_PATH) {
    return process.env.LOCAL_DB_PATH;
  }
  const standardPath = LOCAL_DB_PATHS.STATIC.getPath();
  if (fs.existsSync(standardPath)) {
    console.log(`📁 標準データベースパスを使用: ${standardPath}`);
    return standardPath;
  }
  const wranglerBaseDir = path.join(
    process.cwd(),
    ".wrangler/state/v3/d1/miniflare-D1DatabaseObject"
  );
  if (fs.existsSync(wranglerBaseDir)) {
    const files = fs
      .readdirSync(wranglerBaseDir)
      .filter((file) => file.endsWith(".sqlite"))
      .map((file) => {
        const filePath = path.join(wranglerBaseDir, file);
        return { path: filePath, mtime: fs.statSync(filePath).mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime);
    if (files.length > 0) {
      console.log(`📁 Wranglerデータベースパスを使用: ${files[0].path}`);
      return files[0].path;
    }
  }
  return null;
}

const miniSearch = new MiniSearch<SearchDocument>({
  fields: ["title", "description"],
  storeFields: [
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
  ],
  tokenize,
  searchOptions: {
    boost: { title: 3 },
    fuzzy: 0.2,
    prefix: true,
  },
});

interface CategoryMeta {
  categoryKey: string;
  categoryName: string;
}

function writeEmptyIndex() {
  const indexPath = path.join(process.cwd(), "public", "search-index.json");
  const metaPath = path.join(process.cwd(), "public", "search-index-meta.json");

  // 既存のインデックスがあればそのまま保持（CI環境ではDB不在のため）
  if (fs.existsSync(indexPath) && fs.existsSync(metaPath)) {
    console.log(`ℹ️  DBが見つかりませんが、既存の search-index.json を保持します: ${indexPath}`);
    return;
  }

  const emptyIndex = new MiniSearch<SearchDocument>({
    fields: ["title", "description"],
    storeFields: ["id", "title", "description", "type", "url", "category", "categoryKey", "tags", "subtitle", "demographicAttr", "normalizationBasis", "latestYear", "publishedAt", "updatedAt"],
    tokenize,
  });
  fs.writeFileSync(indexPath, JSON.stringify(emptyIndex.toJSON()), "utf-8");
  console.log(`⚠️  DBが見つからないため空の search-index.json を生成: ${indexPath}`);

  fs.writeFileSync(metaPath, JSON.stringify({ categories: [], blogTags: [], blogYears: [] }), "utf-8");
  console.log(`⚠️  空の search-index-meta.json を生成: ${metaPath}`);
}

async function main() {
  const dbPath = resolveDatabasePath();
  if (!dbPath) {
    writeEmptyIndex();
    return;
  }

  const client = createDatabaseClient({
    localDbPath: dbPath,
    useLocalAdapter: true,
  });
  const db = drizzle(client, { schema });

  const documents: SearchDocument[] = [];

  // 1. ランキング項目（ranking_items LEFT JOIN categories）
  try {
    const rankingRows = await db
      .select({
        rankingKey: schema.rankingItems.rankingKey,
        areaType: schema.rankingItems.areaType,
        title: schema.rankingItems.title,
        subtitle: schema.rankingItems.subtitle,
        rankingName: schema.rankingItems.rankingName,
        rankingDescription: schema.rankingItems.description,
        demographicAttr: schema.rankingItems.demographicAttr,
        normalizationBasis: schema.rankingItems.normalizationBasis,
        availableYears: schema.rankingItems.availableYears,
        categoryKey: schema.rankingItems.categoryKey,
        categoryName: schema.categories.categoryName,
      })
      .from(schema.rankingItems)
      .leftJoin(
        schema.categories,
        eq(schema.rankingItems.categoryKey, schema.categories.categoryKey)
      )
      .where(
        and(
          eq(schema.rankingItems.isActive, true),
          eq(schema.rankingItems.areaType, "prefecture")
        )
      )
      .orderBy(asc(schema.rankingItems.rankingKey));

    for (const row of rankingRows) {
      // availableYears から最新年を取得
      let latestYear: string | undefined;
      try {
        const years = row.availableYears
          ? (JSON.parse(row.availableYears as string) as { yearCode: string; yearName: string }[])
          : [];
        if (years.length > 0) {
          const sorted = [...years].sort((a, b) => b.yearCode.localeCompare(a.yearCode));
          latestYear = sorted[0].yearName;
        }
      } catch {
        // JSON parse 失敗時は無視
      }

      const description = [row.subtitle, row.rankingName, row.rankingDescription]
        .filter(Boolean)
        .join(" ");
      documents.push({
        id: `ranking_${row.rankingKey}_${row.areaType}`,
        title: row.title,
        description: description || row.title,
        type: "ranking" as ContentType,
        url: `/ranking/${row.rankingKey}`,
        category: row.categoryName ?? undefined,
        categoryKey: row.categoryKey ?? undefined,
        subtitle: row.subtitle ?? undefined,
        demographicAttr: row.demographicAttr ?? undefined,
        normalizationBasis: row.normalizationBasis ?? undefined,
        latestYear,
      });
    }
    console.log(`ランキング: ${documents.length}件`);
  } catch (error) {
    console.warn("ランキング項目の取得に失敗:", error);
  }

  const rankingCount = documents.length;

  // 2. ブログ記事（articles + article_tags + tags）
  try {
    const articleRows = await db
      .select({
        slug: schema.articles.slug,
        title: schema.articles.title,
        description: schema.articles.description,
        publishedAt: schema.articles.publishedAt,
        updatedAt: schema.articles.updatedAt,
      })
      .from(schema.articles)
      .where(eq(schema.articles.published, true));

    // article_tags + tags からタグ名を取得
    const tagRows = await db
      .select({
        slug: schema.articleTags.slug,
        tagName: schema.tags.tagName,
      })
      .from(schema.articleTags)
      .innerJoin(schema.tags, eq(schema.articleTags.tagKey, schema.tags.tagKey));

    const tagsBySlug = new Map<string, string[]>();
    for (const row of tagRows) {
      const existing = tagsBySlug.get(row.slug);
      if (existing) {
        existing.push(row.tagName);
      } else {
        tagsBySlug.set(row.slug, [row.tagName]);
      }
    }

    for (const row of articleRows) {
      const tags = tagsBySlug.get(row.slug) ?? [];
      const tagsStr = tags.join(", ");
      const description = [row.description, tagsStr].filter(Boolean).join(" ");
      const category = tags[0] || "ブログ";

      documents.push({
        id: `blog_${row.slug}`,
        title: row.title,
        description: description || row.title,
        type: "blog" as ContentType,
        url: `/blog/${row.slug}`,
        category,
        tags: tags.length > 0 ? tags : undefined,
        publishedAt: row.publishedAt ? new Date(row.publishedAt).toISOString() : undefined,
        updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : undefined,
      });
    }
    console.log(`ブログ: ${documents.length - rankingCount}件`);
  } catch (error) {
    console.warn("ブログ記事の取得に失敗:", error);
  }

  const blogCount = documents.length - rankingCount;

  // MiniSearch に追加
  miniSearch.addAll(documents);

  const indexJson = JSON.stringify(miniSearch.toJSON());
  const indexPath = path.join(process.cwd(), "public", "search-index.json");
  fs.writeFileSync(indexPath, indexJson, "utf-8");
  console.log(`✅ search-index.json を出力: ${indexPath} (${documents.length}件)`);

  // 4. フィルタ用メタ（categories）
  const categoriesMeta: CategoryMeta[] = [];
  try {
    const categoriesRows = await db
      .select()
      .from(schema.categories)
      .orderBy(asc(schema.categories.displayOrder));

    for (const c of categoriesRows) {
      categoriesMeta.push({
        categoryKey: c.categoryKey,
        categoryName: c.categoryName,
      });
    }

    // blogTags: タグ名 + 件数（件数降順）
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
    const metaPath = path.join(process.cwd(), "public", "search-index-meta.json");
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf-8");
    console.log(`✅ search-index-meta.json を出力: ${metaPath}`);
  } catch (error) {
    console.warn("カテゴリメタの取得に失敗:", error);
  }
}

main().catch((error) => {
  console.error("インデックス生成中にエラーが発生しました:", error);
  process.exit(1);
});
