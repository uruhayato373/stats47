import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { inArray, eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import * as schema from "../src/schema";

const isDryRun = process.argv.includes("--dry-run");

function findSqliteFile(): string | null {
  const dir = path.resolve(
    __dirname,
    "../../../.local/d1/v3/d1/miniflare-D1DatabaseObject"
  );
  if (!fs.existsSync(dir)) return null;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sqlite"))
    .map((f) => ({ file: f, size: fs.statSync(path.join(dir, f)).size }))
    .sort((a, b) => b.size - a.size);
  if (files.length === 0) return null;
  return path.join(dir, files[0].file);
}

function getR2Slugs(blogDir: string): string[] {
  if (!fs.existsSync(blogDir)) {
    console.warn(`⚠️  .local/r2/blog/ が見つかりません: ${blogDir}`);
    return [];
  }
  return fs.readdirSync(blogDir).filter((name) => {
    const dir = path.join(blogDir, name);
    if (!fs.statSync(dir).isDirectory()) return false;
    return (
      fs.existsSync(path.join(dir, "article.md")) ||
      fs.existsSync(path.join(dir, "article.mdx"))
    );
  });
}

interface Frontmatter {
  title?: string;
  seoTitle?: string;
  description?: string;
  tags?: string[];
  publishedAt?: string;
  published?: boolean;
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

function buildArticleData(
  slug: string,
  blogDir: string
): schema.InsertArticle {
  const mdxPath = path.join(blogDir, slug, "article.mdx");
  const ext = fs.existsSync(mdxPath) ? "mdx" : "md";
  const filePath = `blog/${slug}/article.${ext}`;
  const content = fs.readFileSync(
    path.join(blogDir, slug, `article.${ext}`),
    "utf-8"
  );
  const fm = parseFrontmatter(content);

  const dataDir = path.join(blogDir, slug, "data");
  const hasCharts =
    fs.existsSync(dataDir) &&
    fs.readdirSync(dataDir).some((f) => f.endsWith(".json"));

  let publishedAt: string | null = null;
  if (fm.publishedAt instanceof Date) {
    publishedAt = fm.publishedAt.toISOString().slice(0, 10);
  } else if (
    fm.publishedAt &&
    /^\d{4}-\d{2}-\d{2}/.test(String(fm.publishedAt))
  ) {
    publishedAt = String(fm.publishedAt);
  }

  return {
    slug,
    title: fm.title ?? slug,
    seoTitle: fm.seoTitle ?? null,
    description: fm.description ?? null,
    filePath,
    format: ext,
    hasCharts,
    published: fm.published ?? false,
    publishedAt,
  };
}

async function sync() {
  const dbPath = findSqliteFile();
  if (!dbPath) {
    console.error("❌ ローカル D1 SQLite が見つかりません。");
    process.exit(1);
  }
  console.log(`DB: ${dbPath}`);

  const blogDir = path.resolve(__dirname, "../../../.local/r2/blog");
  const r2Slugs = getR2Slugs(blogDir);
  console.log(
    `\nR2 に存在する記事 (${r2Slugs.length}件): ${r2Slugs.join(", ") || "(なし)"}`
  );

  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite, { schema });

  const dbArticles = await db
    .select({ slug: schema.articles.slug })
    .from(schema.articles);
  const dbSlugs = dbArticles.map((a) => a.slug);
  console.log(
    `DB に登録された記事 (${dbSlugs.length}件): ${dbSlugs.join(", ") || "(なし)"}`
  );

  const toAdd = r2Slugs.filter((s) => !dbSlugs.includes(s));
  const toUpdate = r2Slugs.filter((s) => dbSlugs.includes(s));
  const toDelete = dbSlugs.filter((s) => !r2Slugs.includes(s));

  console.log(
    `\n追加対象 (${toAdd.length}件): ${toAdd.join(", ") || "(なし)"}`
  );
  console.log(
    `更新対象 (${toUpdate.length}件): ${toUpdate.join(", ") || "(なし)"}`
  );
  console.log(
    `削除対象 (${toDelete.length}件): ${toDelete.join(", ") || "(なし)"}`
  );

  if (isDryRun) {
    console.log("\n--dry-run モード: 変更は実行されませんでした。");
    return;
  }

  if (toDelete.length > 0) {
    await db
      .delete(schema.articles)
      .where(inArray(schema.articles.slug, toDelete));
    console.log(`\n✅ ${toDelete.length}件を DB から削除しました。`);
  }

  if (toAdd.length > 0) {
    for (const slug of toAdd) {
      const data = buildArticleData(slug, blogDir);
      await db.insert(schema.articles).values(data);
      console.log(`  ➕ 追加: ${slug}`);
    }
    console.log(`✅ ${toAdd.length}件を DB に追加しました。`);
  }

  if (toUpdate.length > 0) {
    const now = new Date().toISOString();
    for (const slug of toUpdate) {
      const data = buildArticleData(slug, blogDir);
      // published は編集上の判断のため上書きしない（frontmatter に明示されている場合のみ更新）
      const fm = parseFrontmatter(
        fs.readFileSync(path.join(blogDir, slug, `article.${data.format}`), "utf-8")
      );
      const updateSet: Partial<schema.InsertArticle> & { updatedAt?: string } = {
        title: data.title,
        seoTitle: data.seoTitle,
        description: data.description,
        filePath: data.filePath,
        format: data.format,
        hasCharts: data.hasCharts,
        publishedAt: data.publishedAt,
        updatedAt: now,
      };
      if (typeof fm.published === "boolean") {
        updateSet.published = fm.published;
      }
      await db
        .update(schema.articles)
        .set(updateSet)
        .where(eq(schema.articles.slug, slug));
      console.log(`  🔄 更新: ${slug}`);
    }
    console.log(`✅ ${toUpdate.length}件を DB で更新しました。`);
  }

  if (toAdd.length === 0 && toDelete.length === 0) {
    console.log("\n✅ 追加・削除の差分なし。");
  }
}

sync().catch((err) => {
  console.error(err);
  process.exit(1);
});
