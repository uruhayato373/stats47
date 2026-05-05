/**
 * ranking page cards を R2 snapshot 化する (Phase 6, PR-7)。
 *
 * データソース: page_components (page_type='ranking')
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
  RANKING_PAGE_CARDS_SNAPSHOT_KEY,
  type RankingPageCard,
  type RankingPageCardsSnapshot,
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
      id:           schema.pageComponents.componentKey,
      rankingKey:   schema.pageComponents.pageKey,
      componentType: schema.pageComponents.componentType,
      title:        schema.pageComponents.title,
      componentProps: schema.pageComponents.componentProps,
      displayOrder: schema.pageComponents.sortOrder,
      isActive:     schema.pageComponents.isActive,
      createdAt:    schema.pageComponents.createdAt,
      updatedAt:    schema.pageComponents.updatedAt,
    })
    .from(schema.pageComponents)
    .where(
      and(
        eq(schema.pageComponents.pageType, "ranking"),
        eq(schema.pageComponents.isActive, true)
      )
    )
    .orderBy(
      asc(schema.pageComponents.pageKey),
      asc(schema.pageComponents.sortOrder)
    );

  const byRankingKey: Record<string, RankingPageCard[]> = {};
  for (const row of rows) {
    if (!byRankingKey[row.rankingKey]) byRankingKey[row.rankingKey] = [];
    byRankingKey[row.rankingKey].push({
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

  const snapshot: RankingPageCardsSnapshot = {
    generatedAt: new Date().toISOString(),
    byRankingKey,
  };

  const body = JSON.stringify(snapshot);
  const result = await saveToR2(RANKING_PAGE_CARDS_SNAPSHOT_KEY, body, {
    contentType: "application/json; charset=utf-8",
  });

  console.log(
    `✅ ranking-page-cards: rankings=${Object.keys(byRankingKey).length} cards=${rows.length} bytes=${result.size}`,
  );
  sqlite.close();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
