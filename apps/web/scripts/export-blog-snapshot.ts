/**
 * Blog snapshot exporter
 *
 * D1 articles / taggings / tags をローカル SQLite から読み、
 * `snapshots/blog/all.json` を R2 に書き出す。
 *
 * 使用方法: npx tsx scripts/export-blog-snapshot.ts
 */

import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import BetterSqlite3 from "better-sqlite3";

import { LOCAL_DB_PATHS } from "../../../packages/database/src/config/local-db-paths";
import * as schema from "../../../packages/database/src/schema";
import { saveToR2 } from "@stats47/r2-storage/server";

import {
  BLOG_SNAPSHOT_KEY,
  type BlogSnapshot,
  type SnapshotArticle,
  type SnapshotTagMeta,
} from "../src/features/blog/types/snapshot";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

function resolveDatabasePath(): string {
  if (process.env.LOCAL_DB_PATH && fs.existsSync(process.env.LOCAL_DB_PATH)) {
    return process.env.LOCAL_DB_PATH;
  }
  const standardPath = LOCAL_DB_PATHS.STATIC.getPath();
  if (fs.existsSync(standardPath)) return standardPath;
  throw new Error(
    `ローカル D1 SQLite が見つかりません: ${standardPath}`,
  );
}

async function main() {
  const dbPath = resolveDatabasePath();
  console.log(`📁 DB: ${dbPath}`);

  const sqlite = new BetterSqlite3(dbPath, { readonly: true });
  const db = drizzle(sqlite, { schema });

  const articleRows = await db.select().from(schema.articles);
  const articleTagRows = await db
    .select({
      slug: schema.taggings.taggableId,
      tagKey: schema.taggings.tagKey,
    })
    .from(schema.taggings)
    .where(eq(schema.taggings.taggableType, "article"));

  const tagsBySlug = new Map<string, Array<{ tagKey: string }>>();
  for (const row of articleTagRows) {
    const list = tagsBySlug.get(row.slug);
    const entry = { tagKey: row.tagKey };
    if (list) {
      list.push(entry);
    } else {
      tagsBySlug.set(row.slug, [entry]);
    }
  }

  const snapshotArticles: SnapshotArticle[] = articleRows.map((a) => ({
    ...a,
    tags: tagsBySlug.get(a.slug) ?? [],
  }));

  const tagMetaCounter = new Map<string, number>();
  for (const a of snapshotArticles) {
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
    articles: snapshotArticles,
    tagMeta,
  };

  const body = JSON.stringify(snapshot);
  const result = await saveToR2(BLOG_SNAPSHOT_KEY, body, {
    contentType: "application/json; charset=utf-8",
  });

  console.log(
    `✅ blog snapshot: articles=${snapshot.articles.length} tags=${snapshot.tagMeta.length} bytes=${result.size} key=${result.key}`,
  );

  sqlite.close();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
