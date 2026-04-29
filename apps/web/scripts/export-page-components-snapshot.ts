/**
 * page_components / page_component_assignments を R2 snapshot 化する。
 *
 * 使用方法:
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     apps/web/scripts/export-page-components-snapshot.ts
 *
 * Phase 5b D1→R2 移行用。
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
  PAGE_COMPONENTS_SNAPSHOT_KEY,
  type PageComponentsSnapshot,
} from "../src/features/stat-charts/services/page-components-snapshot";
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
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

async function main() {
  const dbPath = resolveDatabasePath();
  console.log(`📁 DB: ${dbPath}`);

  const sqlite = new BetterSqlite3(dbPath, { readonly: true });
  const db = drizzle(sqlite, { schema });

  // page_component_assignments + page_components を JOIN
  const rows = await db
    .select({
      pageType: schema.pageComponentAssignments.pageType,
      pageKey: schema.pageComponentAssignments.pageKey,
      componentKey: schema.pageComponents.componentKey,
      componentType: schema.pageComponents.componentType,
      title: schema.pageComponents.title,
      componentProps: schema.pageComponents.componentProps,
      sourceName: schema.pageComponents.sourceName,
      sourceLink: schema.pageComponents.sourceLink,
      rankingLink: schema.pageComponents.rankingLink,
      gridColumnSpan: schema.pageComponents.gridColumnSpan,
      gridColumnSpanTablet: schema.pageComponents.gridColumnSpanTablet,
      gridColumnSpanSm: schema.pageComponents.gridColumnSpanSm,
      dataSource: schema.pageComponents.dataSource,
      section: schema.pageComponentAssignments.section,
      sortOrder: schema.pageComponentAssignments.sortOrder,
    })
    .from(schema.pageComponentAssignments)
    .innerJoin(
      schema.pageComponents,
      eq(schema.pageComponentAssignments.componentKey, schema.pageComponents.componentKey),
    )
    .where(and(eq(schema.pageComponents.isActive, true)))
    .orderBy(asc(schema.pageComponentAssignments.sortOrder));

  const byPage: Record<string, PageComponent[]> = {};
  for (const row of rows) {
    const key = `${row.pageType}|${row.pageKey}`;
    const component: PageComponent = {
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
    };
    if (!byPage[key]) byPage[key] = [];
    byPage[key].push(component);
  }

  const snapshot: PageComponentsSnapshot = {
    generatedAt: new Date().toISOString(),
    byPage,
  };

  const body = JSON.stringify(snapshot);
  const result = await saveToR2(PAGE_COMPONENTS_SNAPSHOT_KEY, body, {
    contentType: "application/json; charset=utf-8",
  });

  console.log(
    `✅ page-components: pages=${Object.keys(byPage).length} components=${rows.length} bytes=${result.size}`,
  );

  sqlite.close();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
