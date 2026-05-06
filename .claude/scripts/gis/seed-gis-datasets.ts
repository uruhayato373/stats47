#!/usr/bin/env tsx
/**
 * gis_datasets テーブルシードスクリプト
 *
 * KSJ_REGISTRY（42件）を D1 に全件 upsert し、
 * .local/r2/gis/mlit-ksj/{dataId}/ の _meta.json から
 * is_downloaded / r2_version / file_count / total_size_bytes を更新する。
 *
 * 実行: npx tsx .claude/scripts/gis/seed-gis-datasets.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";
import Database from "better-sqlite3";
import { KSJ_REGISTRY } from "../../../packages/gis/src/mlit-ksj/registry";

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const DB_PATH = path.join(
  PROJECT_ROOT,
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite"
);
const R2_GIS_DIR = path.join(PROJECT_ROOT, ".local/r2/gis/mlit-ksj");

interface MetaJson {
  dataId: string;
  version: string;
  files: Array<{ filename: string; sizeBytes: number; featureCount: number }>;
  convertedAt: string;
  attribution: string;
}

function readMeta(dataId: string): MetaJson | null {
  const dataDir = path.join(R2_GIS_DIR, dataId);
  if (!fs.existsSync(dataDir)) return null;

  // バージョンディレクトリを探す（複数ある場合は最新を使う）
  const versions = fs.readdirSync(dataDir).filter((v) =>
    fs.statSync(path.join(dataDir, v)).isDirectory()
  );
  if (versions.length === 0) return null;

  // 最新バージョン（バージョン文字列で降順ソート）
  const latestVersion = versions.sort().reverse()[0];
  const metaPath = path.join(dataDir, latestVersion, "_meta.json");
  if (!fs.existsSync(metaPath)) return null;

  try {
    return JSON.parse(fs.readFileSync(metaPath, "utf-8")) as MetaJson;
  } catch {
    return null;
  }
}

function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.error(`D1 ファイルが見つかりません: ${DB_PATH}`);
    process.exit(1);
  }

  const db = new Database(DB_PATH);

  const upsert = db.prepare(`
    INSERT INTO gis_datasets (
      data_id, name, name_en, category, geometry_type, coverage, license,
      is_downloaded, r2_version, file_count, total_size_bytes,
      converted_at, r2_prefix, attribution
    ) VALUES (
      @dataId, @name, @nameEn, @category, @geometryType, @coverage, @license,
      @isDownloaded, @r2Version, @fileCount, @totalSizeBytes,
      @convertedAt, @r2Prefix, @attribution
    )
    ON CONFLICT(data_id) DO UPDATE SET
      name           = excluded.name,
      name_en        = excluded.name_en,
      category       = excluded.category,
      geometry_type  = excluded.geometry_type,
      coverage       = excluded.coverage,
      license        = excluded.license,
      is_downloaded  = excluded.is_downloaded,
      r2_version     = excluded.r2_version,
      file_count     = excluded.file_count,
      total_size_bytes = excluded.total_size_bytes,
      converted_at   = excluded.converted_at,
      r2_prefix      = excluded.r2_prefix,
      attribution    = excluded.attribution
  `);

  const upsertAll = db.transaction(() => {
    let downloaded = 0;
    for (const [dataId, def] of KSJ_REGISTRY) {
      const meta = readMeta(dataId);
      const isDownloaded = meta !== null ? 1 : 0;
      if (isDownloaded) downloaded++;

      const totalSizeBytes = meta
        ? meta.files.reduce((s, f) => s + f.sizeBytes, 0)
        : null;
      const r2Prefix = meta
        ? `gis/mlit-ksj/${dataId}/${meta.version}/`
        : null;

      upsert.run({
        dataId,
        name: def.name,
        nameEn: def.nameEn,
        category: def.category,
        geometryType: def.geometryType,
        coverage: def.coverage,
        license: def.license,
        isDownloaded,
        r2Version: meta?.version ?? null,
        fileCount: meta ? meta.files.length : null,
        totalSizeBytes,
        convertedAt: meta?.convertedAt ?? null,
        r2Prefix,
        attribution: meta?.attribution ?? "国土交通省国土数値情報ダウンロードサイト",
      });
    }
    return downloaded;
  });

  const downloaded = upsertAll();
  const total = KSJ_REGISTRY.size;

  console.log(`\n✓ gis_datasets シード完了`);
  console.log(`  合計: ${total} 件`);
  console.log(`  ダウンロード済み: ${downloaded} 件`);
  console.log(`  未取得: ${total - downloaded} 件`);

  // 確認
  const rows = db.prepare("SELECT category, COUNT(*) as cnt, SUM(is_downloaded) as dl FROM gis_datasets GROUP BY category ORDER BY category").all() as Array<{ category: string; cnt: number; dl: number }>;
  console.log("\n  カテゴリ別:");
  for (const r of rows) {
    console.log(`    ${r.category.padEnd(12)} ${r.dl}/${r.cnt} downloaded`);
  }

  db.close();
}

main();
