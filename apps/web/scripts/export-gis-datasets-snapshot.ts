/**
 * gis_datasets を R2 snapshot 化する。
 *
 * Usage:
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     apps/web/scripts/export-gis-datasets-snapshot.ts
 */

import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "fs";
import BetterSqlite3 from "better-sqlite3";

import { LOCAL_DB_PATHS } from "../../../packages/database/src/config/local-db-paths";
import * as schema from "../../../packages/database/src/schema";
import { saveToR2 } from "@stats47/r2-storage/server";

import {
  GIS_DATASETS_SNAPSHOT_KEY,
  type GisDatasetsSnapshot,
} from "../src/features/gis-catalog/types";

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
    .select()
    .from(schema.gisDatasets)
    .orderBy(schema.gisDatasets.category, schema.gisDatasets.dataId);

  const snapshot: GisDatasetsSnapshot = {
    generatedAt: new Date().toISOString(),
    datasets: rows.map((r) => ({
      dataId: r.dataId,
      name: r.name,
      nameEn: r.nameEn,
      category: r.category,
      geometryType: r.geometryType,
      coverage: r.coverage,
      license: r.license,
      isDownloaded: Boolean(r.isDownloaded),
      r2Version: r.r2Version,
      fileCount: r.fileCount,
      totalSizeBytes: r.totalSizeBytes,
      convertedAt: r.convertedAt,
      r2Prefix: r.r2Prefix,
      attribution: r.attribution,
    })),
  };

  const body = JSON.stringify(snapshot);
  const result = await saveToR2(GIS_DATASETS_SNAPSHOT_KEY, body, {
    contentType: "application/json; charset=utf-8",
  });

  console.log(`✅ gis-datasets: count=${rows.length} bytes=${result.size}`);
  sqlite.close();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
