/**
 * page_components を R2 snapshot 化する。
 *
 * 旧: page-components/all.json (全件一括)
 * 新: page-components/{pageType}/{encodeURIComponent(pageKey)}.json × ページ数
 *
 * 使用方法:
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     apps/web/scripts/export-page-components-snapshot.ts
 */

import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { asc, eq } from "drizzle-orm";
import fs from "fs";
import BetterSqlite3 from "better-sqlite3";

import { LOCAL_DB_PATHS } from "../../../packages/database/src/config/local-db-paths";
import * as schema from "../../../packages/database/src/schema";
import { saveToR2 } from "@stats47/r2-storage/server";

import { pageComponentsKeyPath } from "../src/features/stat-charts/services/page-components-snapshot";
import type { PageComponent } from "../src/features/stat-charts/services/load-page-components";

dotenv.config({ path: ".env.local" });

function resolveDatabasePath(): string {
  if (process.env.LOCAL_DB_PATH && fs.existsSync(process.env.LOCAL_DB_PATH)) {
    return process.env.LOCAL_DB_PATH;
  }
  const standardPath = LOCAL_DB_PATHS.STATIC.getPath();
  if (fs.existsSync(standardPath)) return standardPath;
  throw new Error(`ローカル D1 SQLite が見つかりません: ${standardPath}`);
}

function parseJson(json: string | null): Record<string, unknown> {
  if (!json) return {};
  try { return JSON.parse(json); } catch { return {}; }
}

async function main() {
  const dbPath = resolveDatabasePath();
  console.log(`📁 DB: ${dbPath}`);

  const sqlite = new BetterSqlite3(dbPath, { readonly: true });
  const db = drizzle(sqlite, { schema });

  const rows = await db
    .select({
      pageType:             schema.pageComponents.pageType,
      pageKey:              schema.pageComponents.pageKey,
      componentKey:         schema.pageComponents.componentKey,
      componentType:        schema.pageComponents.componentType,
      title:                schema.pageComponents.title,
      componentProps:       schema.pageComponents.componentProps,
      sourceName:           schema.pageComponents.sourceName,
      sourceLink:           schema.pageComponents.sourceLink,
      rankingLink:          schema.pageComponents.rankingLink,
      gridColumnSpan:       schema.pageComponents.gridColumnSpan,
      gridColumnSpanTablet: schema.pageComponents.gridColumnSpanTablet,
      gridColumnSpanSm:     schema.pageComponents.gridColumnSpanSm,
      dataSource:           schema.pageComponents.dataSource,
      section:              schema.pageComponents.section,
      sortOrder:            schema.pageComponents.sortOrder,
    })
    .from(schema.pageComponents)
    .where(eq(schema.pageComponents.isActive, true))
    .orderBy(asc(schema.pageComponents.sortOrder));

  const byPage = new Map<string, { pageType: string; pageKey: string; components: PageComponent[] }>();
  for (const row of rows) {
    const mapKey = `${row.pageType}|${row.pageKey}`;
    let entry = byPage.get(mapKey);
    if (!entry) {
      entry = { pageType: row.pageType, pageKey: row.pageKey, components: [] };
      byPage.set(mapKey, entry);
    }
    entry.components.push({
      componentKey: row.componentKey,
      componentType: row.componentType,
      title: row.title,
      componentProps: parseJson(row.componentProps),
      sourceName: row.sourceName,
      sourceLink: row.sourceLink,
      rankingLink: row.rankingLink,
      gridColumnSpan: row.gridColumnSpan ?? 12,
      gridColumnSpanTablet: row.gridColumnSpanTablet,
      gridColumnSpanSm: row.gridColumnSpanSm,
      dataSource: row.dataSource,
      section: row.section,
      sortOrder: row.sortOrder ?? 0,
    });
  }

  const CONCURRENCY = 16;
  const entries = [...byPage.values()];
  let files = 0;

  for (let i = 0; i < entries.length; i += CONCURRENCY) {
    const batch = entries.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async ({ pageType, pageKey, components }) => {
        const body = JSON.stringify(components);
        await saveToR2(pageComponentsKeyPath(pageType, pageKey), body, {
          contentType: "application/json; charset=utf-8",
        });
        files++;
      }),
    );
  }

  console.log(`✅ page-components: files=${files} components=${rows.length}`);
  sqlite.close();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
