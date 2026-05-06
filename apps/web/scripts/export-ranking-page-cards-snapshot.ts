/**
 * ranking page cards を R2 snapshot 化する。
 *
 * 旧: ranking-page-cards/all.json (全件一括)
 * 新: ranking-page-cards/{rankingKey}.json × rankingKey 数
 *
 * Usage:
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     apps/web/scripts/export-ranking-page-cards-snapshot.ts
 */

import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { and, asc, eq } from "drizzle-orm";
import fs from "fs";
import BetterSqlite3 from "better-sqlite3";

import { LOCAL_DB_PATHS } from "../../../packages/database/src/config/local-db-paths";
import * as schema from "../../../packages/database/src/schema";
import { saveToR2 } from "@stats47/r2-storage/server";

import {
  rankingPageCardsKeyPath,
  type RankingPageCard,
} from "../src/features/ranking/components/RankingPageCards/snapshot-reader";

dotenv.config({ path: ".env.local" });

function resolveDatabasePath(): string {
  if (process.env.LOCAL_DB_PATH && fs.existsSync(process.env.LOCAL_DB_PATH)) {
    return process.env.LOCAL_DB_PATH;
  }
  const standardPath = LOCAL_DB_PATHS.STATIC.getPath();
  if (fs.existsSync(standardPath)) return standardPath;
  throw new Error(`ローカル D1 SQLite が見つかりません: ${standardPath}`);
}

async function main() {
  const dbPath = resolveDatabasePath();
  console.log(`📁 DB: ${dbPath}`);

  const sqlite = new BetterSqlite3(dbPath, { readonly: true });
  const db = drizzle(sqlite, { schema });

  const rows = await db
    .select({
      id:            schema.pageComponents.componentKey,
      rankingKey:    schema.pageComponents.pageKey,
      componentType: schema.pageComponents.componentType,
      title:         schema.pageComponents.title,
      componentProps: schema.pageComponents.componentProps,
      displayOrder:  schema.pageComponents.sortOrder,
      isActive:      schema.pageComponents.isActive,
      createdAt:     schema.pageComponents.createdAt,
      updatedAt:     schema.pageComponents.updatedAt,
    })
    .from(schema.pageComponents)
    .where(and(
      eq(schema.pageComponents.pageType, "ranking"),
      eq(schema.pageComponents.isActive, true),
    ))
    .orderBy(asc(schema.pageComponents.pageKey), asc(schema.pageComponents.sortOrder));

  const byKey = new Map<string, RankingPageCard[]>();
  for (const row of rows) {
    let cards = byKey.get(row.rankingKey);
    if (!cards) { cards = []; byKey.set(row.rankingKey, cards); }
    cards.push({
      id: row.id,
      rankingKey: row.rankingKey,
      componentType: row.componentType,
      title: row.title,
      componentProps: row.componentProps,
      displayOrder: row.displayOrder ?? 0,
      isActive: row.isActive ?? true,
      createdAt: row.createdAt ?? null,
      updatedAt: row.updatedAt ?? null,
    });
  }

  const CONCURRENCY = 16;
  const entries = [...byKey.entries()];
  let files = 0;

  for (let i = 0; i < entries.length; i += CONCURRENCY) {
    const batch = entries.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async ([rankingKey, cards]) => {
        const body = JSON.stringify(cards);
        await saveToR2(rankingPageCardsKeyPath(rankingKey), body, {
          contentType: "application/json; charset=utf-8",
        });
        files++;
      }),
    );
  }

  console.log(`✅ ranking-page-cards: files=${files} cards=${rows.length}`);
  sqlite.close();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
