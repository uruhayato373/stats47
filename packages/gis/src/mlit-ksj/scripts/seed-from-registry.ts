#!/usr/bin/env tsx
/**
 * gis_datasets テーブルに RANKINGS 定義を seed する (is_ranking_target + ranking_config)。
 *
 * Phase 2 of GIS dataset management refactor (plan: stateless-stargazing-teapot).
 * 旧 register-ksj-rankings.ts の RANKINGS hardcode を D1 に移管した seed の真実源。
 *
 * - 既存 row は is_ranking_target=1 / ranking_config=JSON で UPDATE
 * - status / r2_version / 純メタ (name, category 等) は触らない
 * - 冪等: 再実行可能。RANKINGS から除外された旧 dataId の target フラグも reset する
 *
 * 純メタの seed は Phase 2 初回のみ必要 (registry.ts の旧版から D1 に投入済み)。
 * 新規データセット追加時は D1 に手動 INSERT する。
 *
 * Usage:
 *   npx tsx packages/gis/src/mlit-ksj/scripts/seed-from-registry.ts
 *   npx tsx packages/gis/src/mlit-ksj/scripts/seed-from-registry.ts --dry-run
 */

import * as fs from "node:fs";
import * as path from "node:path";
import Database from "better-sqlite3";

const LOCAL_D1_PATH =
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite";

interface RankingDef {
  rankingKey: string;
  rankingName: string;
  unit: string;
  categoryKey: string;
  dataId: string;
  version: string;
  filename?: string;
  filenamePattern?: string;
  yearCode: string;
  description?: string;
}

const RANKINGS: RankingDef[] = [
  {
    rankingKey: "dam-count",
    rankingName: "ダム数",
    unit: "か所",
    categoryKey: "infrastructure",
    dataId: "W01",
    version: "14",
    yearCode: "2014",
    description: "国土数値情報に登録されているダムの都道府県別数",
  },
  {
    rankingKey: "roadside-station-count",
    rankingName: "道の駅数",
    unit: "か所",
    categoryKey: "tourism",
    dataId: "P35",
    version: "18",
    yearCode: "2018",
    description: "国土数値情報に登録されている道の駅の都道府県別数",
  },
  {
    rankingKey: "railway-station-count",
    rankingName: "鉄道駅数",
    unit: "駅",
    categoryKey: "infrastructure",
    dataId: "N02",
    version: "24",
    filenamePattern: "Station",
    yearCode: "2024",
    description: "国土数値情報に登録されている鉄道駅の都道府県別数",
  },
  {
    rankingKey: "expressway-junction-count",
    rankingName: "高速道路IC・JCT数",
    unit: "か所",
    categoryKey: "infrastructure",
    dataId: "N06",
    version: "20",
    filenamePattern: "Joint",
    yearCode: "2020",
    description: "国土数値情報に登録されている高速道路のIC・JCTの都道府県別数",
  },
  {
    rankingKey: "lake-count",
    rankingName: "湖沼数",
    unit: "か所",
    categoryKey: "landweather",
    dataId: "W09",
    version: "05",
    yearCode: "2005",
    description: "国土数値情報に登録されている湖沼の都道府県別数",
  },
  {
    rankingKey: "airport-count",
    rankingName: "空港数",
    unit: "か所",
    categoryKey: "infrastructure",
    dataId: "C28",
    version: "07",
    filenamePattern: "AirportReferencePoint",
    yearCode: "2007",
    description: "国土数値情報に登録されている空港の都道府県別数",
  },
  {
    rankingKey: "nuclear-power-plant-count",
    rankingName: "原子力発電所数",
    unit: "か所",
    categoryKey: "energy",
    dataId: "P03",
    version: "13",
    filenamePattern: "NuclearPowerPlant",
    yearCode: "2013",
    description: "国土数値情報に登録されている原子力発電所の都道府県別数",
  },
  {
    rankingKey: "thermal-power-plant-count",
    rankingName: "火力発電所数",
    unit: "か所",
    categoryKey: "energy",
    dataId: "P03",
    version: "13",
    filenamePattern: "ThermalPowerPlant.topojson",
    yearCode: "2013",
  },
  {
    rankingKey: "hydroelectric-power-plant-count",
    rankingName: "水力発電所数",
    unit: "か所",
    categoryKey: "energy",
    dataId: "P03",
    version: "13",
    filenamePattern: "GeneralHydroelectric",
    yearCode: "2013",
  },
  {
    rankingKey: "photovoltaic-power-plant-count",
    rankingName: "太陽光発電施設数",
    unit: "か所",
    categoryKey: "energy",
    dataId: "P03",
    version: "13",
    filenamePattern: "Photovoltaic",
    yearCode: "2013",
  },
  {
    rankingKey: "wind-power-plant-count-facility",
    rankingName: "風力発電施設数(施設ベース)",
    unit: "か所",
    categoryKey: "energy",
    dataId: "P03",
    version: "13",
    filenamePattern: "WindPowerPlant",
    yearCode: "2013",
  },
  {
    rankingKey: "geothermal-power-plant-count",
    rankingName: "地熱発電施設数",
    unit: "か所",
    categoryKey: "energy",
    dataId: "P03",
    version: "13",
    filenamePattern: "Geothermal",
    yearCode: "2013",
  },
  {
    rankingKey: "biomass-power-station-count",
    rankingName: "バイオマス発電施設数",
    unit: "か所",
    categoryKey: "energy",
    dataId: "P03",
    version: "13",
    filenamePattern: "Biomass",
    yearCode: "2013",
  },
  {
    rankingKey: "tourism-resource-count",
    rankingName: "観光資源数",
    unit: "件",
    categoryKey: "tourism",
    dataId: "P12",
    version: "14",
    yearCode: "2014",
    description: "国土数値情報に登録されている観光資源の都道府県別数",
  },
  {
    rankingKey: "fishing-port-count-ksj",
    rankingName: "漁港数",
    unit: "港",
    categoryKey: "agriculture",
    dataId: "C09",
    version: "06",
    filenamePattern: "FishingPort.topojson",
    yearCode: "2006",
    description: "国土数値情報に登録されている漁港の都道府県別数",
  },
];

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

  // RANKINGS を dataId でグループ化
  const rankingByDataId = new Map<string, RankingDef[]>();
  for (const r of RANKINGS) {
    const arr = rankingByDataId.get(r.dataId) ?? [];
    arr.push(r);
    rankingByDataId.set(r.dataId, arr);
  }

  const projectRoot = findProjectRoot();
  const dbPath = path.join(projectRoot, LOCAL_D1_PATH);
  if (!fs.existsSync(dbPath)) {
    console.error(`ローカル D1 SQLite が見つかりません: ${dbPath}`);
    process.exit(1);
  }

  if (dryRun) {
    console.log("(dry-run) 以下の dataId に is_ranking_target=1 を設定する予定:");
    for (const [dataId, configs] of rankingByDataId) {
      console.log(`  ${dataId.padEnd(12)} rankings=${configs.length}`);
    }
    return;
  }

  const db = new Database(dbPath);

  // 既存 row 必須 (gis_datasets に dataId が無い場合は警告のみ、INSERT はしない)
  const checkExists = db.prepare(
    `SELECT 1 FROM gis_datasets WHERE data_id = ?`,
  );
  const resetAll = db.prepare(
    `UPDATE gis_datasets SET is_ranking_target = 0, ranking_config = NULL`,
  );
  const setRanking = db.prepare(`
    UPDATE gis_datasets
    SET is_ranking_target = 1,
        ranking_config = ?,
        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE data_id = ?
  `);

  let updated = 0;
  const missing: string[] = [];

  db.transaction(() => {
    resetAll.run();
    for (const [dataId, configs] of rankingByDataId) {
      const exists = checkExists.get(dataId);
      if (!exists) {
        missing.push(dataId);
        continue;
      }
      const json = JSON.stringify(
        configs.map((r) => ({
          rankingKey: r.rankingKey,
          rankingName: r.rankingName,
          unit: r.unit,
          categoryKey: r.categoryKey,
          filename: r.filename,
          filenamePattern: r.filenamePattern,
          yearCode: r.yearCode,
          description: r.description,
        })),
      );
      setRanking.run(json, dataId);
      updated++;
    }
  })();

  const totalRankingTargets = (
    db.prepare(
      `SELECT COUNT(*) AS n FROM gis_datasets WHERE is_ranking_target = 1`,
    ).get() as { n: number }
  ).n;

  db.close();

  console.log(`✅ seed-from-registry (rankings) 完了`);
  console.log(`   is_ranking_target=1 の dataset: ${totalRankingTargets}`);
  console.log(`   RANKINGS エントリ総数: ${RANKINGS.length}`);
  if (missing.length > 0) {
    console.warn(
      `   ⚠ D1 に存在しない dataId (skip): ${missing.join(", ")}`,
    );
  }
}

main();
