/**
 * テーマダッシュボードに新チャートを page_components テーブルへ idempotent 投入する。
 * 定義の単一ソースは theme-page-component-additions.ts。
 *
 * ※ ローカルビルド DB (SQLite) が SSOT。本スクリプトは Mac (DB がある環境) で実行する。
 *   この環境 (R2 に DB 未 push のクラウド) では DB が無いため代わりに
 *   sync-theme-additions-to-r2.ts で R2 へ直接反映している。両者は同一定義から生成されるため
 *   結果は一致する (Mac で本 seed → export-page-components-snapshot を流せば drift しない)。
 *
 * 使用方法 (Mac):
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     apps/web/scripts/seed-theme-page-components.ts
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     apps/web/scripts/export-page-components-snapshot.ts
 */

import BetterSqlite3 from "better-sqlite3";
import dotenv from "dotenv";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "fs";

import { LOCAL_DB_PATHS } from "../../../packages/database/src/config/local-db-paths";
import * as schema from "../../../packages/database/src/schema";

import { THEME_COMPONENT_ADDITIONS } from "./theme-page-component-additions";

dotenv.config({ path: ".env.local" });

const PAGE_TYPE = "theme";

function resolveDatabasePath(): string {
  if (process.env.LOCAL_DB_PATH && fs.existsSync(process.env.LOCAL_DB_PATH)) {
    return process.env.LOCAL_DB_PATH;
  }
  const standardPath = LOCAL_DB_PATHS.STATIC.getPath();
  if (!fs.existsSync(standardPath)) {
    throw new Error(`ローカルビルド DB (SQLite) が見つかりません: ${standardPath}`);
  }
  return standardPath;
}

async function main() {
  const dbPath = resolveDatabasePath();
  console.log(`📁 DB: ${dbPath}`);

  const sqlite = new BetterSqlite3(dbPath);
  const db = drizzle(sqlite, { schema });

  let inserted = 0;
  let updated = 0;

  for (const [pageKey, comps] of Object.entries(THEME_COMPONENT_ADDITIONS)) {
    for (const comp of comps) {
      const existing = await db
        .select({ id: schema.pageComponents.id })
        .from(schema.pageComponents)
        .where(
          and(
            eq(schema.pageComponents.pageType, PAGE_TYPE),
            eq(schema.pageComponents.pageKey, pageKey),
            eq(schema.pageComponents.componentKey, comp.componentKey),
          ),
        )
        .limit(1);

      const values = {
        pageType: PAGE_TYPE,
        pageKey,
        componentKey: comp.componentKey,
        componentType: comp.componentType,
        title: comp.title,
        section: null,
        sortOrder: comp.sortOrder,
        componentProps: JSON.stringify(comp.componentProps),
        sourceName: comp.sourceName,
        sourceLink: comp.sourceLink,
        rankingLink: comp.rankingLink,
        dataSource: "ranking",
        gridColumnSpan: 12,
        isActive: true,
      };

      if (existing.length === 0) {
        await db.insert(schema.pageComponents).values(values);
        inserted++;
        console.log(`  ➕ ${pageKey} / ${comp.componentKey}`);
      } else {
        await db
          .update(schema.pageComponents)
          .set(values)
          .where(
            and(
              eq(schema.pageComponents.pageType, PAGE_TYPE),
              eq(schema.pageComponents.pageKey, pageKey),
              eq(schema.pageComponents.componentKey, comp.componentKey),
            ),
          );
        updated++;
        console.log(`  🔄 ${pageKey} / ${comp.componentKey}`);
      }
    }
  }

  console.log(`\n✅ theme page_components: inserted=${inserted} updated=${updated}`);
  sqlite.close();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
