#!/usr/bin/env tsx
/**
 * git TS SSOT (datasets.ts) → 使い捨て SQLite gis_datasets を決定的に再構築する seed。
 *
 * 完全DBレス: 登録済み (status='registered') データセットのメタ + ranking 定義の SSOT は
 * `packages/gis/src/mlit-ksj/datasets.ts` (git TS)。本 seed はそれを使い捨てローカル SQLite
 * (`packages/database/.data/stats47.sqlite` = 再生成可能なビルドキャッシュ) に UPSERT する。
 * これにより SQLite を消しても git TS から完全に再生成できる (旧「手動 INSERT」を廃止)。
 *
 * 挙動 (冪等):
 *   - GIS_DATASETS の各エントリを INSERT (新規) または UPDATE (既存)。
 *     · 純メタ (name/category/geometry_type/coverage/license/stats47_category) を git TS で上書き
 *     · is_ranking_target / ranking_config / latest_version を git TS で上書き
 *     · status: 新規=registered / 既存 available→registered に昇格 / imported・deprecated は保持
 *     · name_en と build state (r2_version/file_count/converted_at 等) は保持 (上書きしない)
 *   - GIS_DATASETS に無い行の is_ranking_target は 0 にリセット (target から外れた旧 dataId を掃除)
 *
 * 空の使い捨て SQLite でも現在の gis_datasets schema を作成してから seed する。
 *
 * Usage:
 *   npx tsx packages/gis/src/mlit-ksj/scripts/seed-from-registry.ts
 *   npx tsx packages/gis/src/mlit-ksj/scripts/seed-from-registry.ts --dry-run
 *
 * 正典: `.claude/rules/gis-data.md` / `packages/gis/src/mlit-ksj/README.md`
 */

import * as fs from "node:fs";
import * as path from "node:path";
import Database from "better-sqlite3";
import { GIS_DATASETS } from "../datasets";
import { ensureDisposableGisCatalog } from "../disposable-catalog-db";

const LOCAL_D1_PATH = "packages/database/.data/stats47.sqlite";

function findProjectRoot(): string {
  let dir = __dirname;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(dir, "package.json"), "utf-8"),
      );
      if (pkg.workspaces || pkg.name === "stats47") return dir;
    }
    dir = path.dirname(dir);
  }
  throw new Error("Could not find project root");
}

function main(): void {
  const dryRun = process.argv.includes("--dry-run");

  const rankingTargets = GIS_DATASETS.filter((d) => d.isRankingTarget);
  const totalRankingConfigs = rankingTargets.reduce(
    (n, d) => n + (d.rankingConfig?.length ?? 0),
    0,
  );

  if (dryRun) {
    console.log(
      `(dry-run) datasets.ts → SQLite に seed 予定: 登録 ${GIS_DATASETS.length} 件 / ranking 対象 ${rankingTargets.length} 件 / ranking 定義 ${totalRankingConfigs} 個`,
    );
    for (const d of GIS_DATASETS) {
      const rk = d.isRankingTarget ? ` [ranking x${d.rankingConfig?.length ?? 0}]` : "";
      console.log(
        `  ${d.dataId.padEnd(12)} ${d.category.padEnd(11)} ${d.geometryType.padEnd(8)} ${d.coverage.padEnd(11)} ${(d.stats47Category ?? "—").padEnd(16)}${rk}`,
      );
    }
    return;
  }

  const projectRoot = findProjectRoot();
  const dbPath = process.env.LOCAL_DB_PATH
    ? path.resolve(process.env.LOCAL_DB_PATH)
    : path.join(projectRoot, LOCAL_D1_PATH);
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  ensureDisposableGisCatalog(db);

  // git TS に無い行の ranking フラグを掃除 (target から外れた旧 dataId)
  const resetRanking = db.prepare(
    `UPDATE gis_datasets SET is_ranking_target = 0, ranking_config = NULL`,
  );

  // UPSERT: 純メタ + ranking は git TS で上書き / status は昇格のみ / build state は保持
  const upsert = db.prepare(`
    INSERT INTO gis_datasets (
      data_id, name, name_en, category, geometry_type, coverage, license,
      stats47_category, is_ranking_target, ranking_config, latest_version, status,
      created_at, updated_at
    ) VALUES (
      @dataId, @name, '', @category, @geometryType, @coverage, @license,
      @stats47Category, @isRankingTarget, @rankingConfig, @latestVersion, 'registered',
      strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')
    )
    ON CONFLICT(data_id) DO UPDATE SET
      name             = excluded.name,
      category         = excluded.category,
      geometry_type    = excluded.geometry_type,
      coverage         = excluded.coverage,
      license          = excluded.license,
      stats47_category = excluded.stats47_category,
      is_ranking_target= excluded.is_ranking_target,
      ranking_config   = excluded.ranking_config,
      latest_version   = COALESCE(excluded.latest_version, gis_datasets.latest_version),
      status           = CASE WHEN gis_datasets.status = 'available' THEN 'registered' ELSE gis_datasets.status END,
      updated_at       = strftime('%Y-%m-%dT%H:%M:%fZ','now')
  `);

  let count = 0;
  db.transaction(() => {
    resetRanking.run();
    for (const d of GIS_DATASETS) {
      upsert.run({
        dataId: d.dataId,
        name: d.name,
        category: d.category,
        geometryType: d.geometryType,
        coverage: d.coverage,
        license: d.license,
        stats47Category: d.stats47Category,
        isRankingTarget: d.isRankingTarget ? 1 : 0,
        rankingConfig: d.rankingConfig ? JSON.stringify(d.rankingConfig) : null,
        latestVersion: d.latestVersion ?? null,
      });
      count++;
    }
  })();

  const registered = (
    db.prepare(`SELECT COUNT(*) AS n FROM gis_datasets WHERE status IN ('registered','imported')`).get() as { n: number }
  ).n;
  const rankingN = (
    db.prepare(`SELECT COUNT(*) AS n FROM gis_datasets WHERE is_ranking_target = 1`).get() as { n: number }
  ).n;

  db.close();

  console.log(`✅ seed-from-registry (datasets.ts → SQLite) 完了`);
  console.log(`   UPSERT: ${count} 件 (git TS SSOT)`);
  console.log(`   registered/imported: ${registered} 件 / is_ranking_target: ${rankingN} 件 / ranking 定義 ${totalRankingConfigs} 個`);
}

main();
