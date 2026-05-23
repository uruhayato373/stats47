/**
 * 駅別乗降客数 (国土数値情報 S12) と鉄道路線 (N02) を R2 snapshot 化する。
 *
 * 入力: apps/remotion/public/station-passengers/ の per-pref JSON
 *   ({NN}.json = 駅+乗降客数, lines-{NN}.json = 路線 GeoJSON)
 *   — apps/remotion/scripts/fetch-station-passengers.ts / fetch-railway-lines.ts が生成。
 *
 * 出力 R2 キー (app/ 名前空間):
 *   app/station-passengers/index.json          … 47 県サマリ
 *   app/station-passengers/{NN}/stations.json   … 県別 駅+乗降客数
 *   app/station-passengers/{NN}/lines.json      … 県別 路線 GeoJSON
 *
 * Usage:
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     apps/web/scripts/export-station-passengers-snapshot.ts
 */
import fs from "fs";
import path from "path";

import dotenv from "dotenv";

import { saveToR2 } from "@stats47/r2-storage/server";

dotenv.config({ path: ".env.local" });

const REPO_ROOT = path.resolve(__dirname, "../../..");
const DATA_DIR = path.join(
  REPO_ROOT,
  "apps/remotion/public/station-passengers",
);

/** 県間比較に使う年（JR 報告開始済み） */
const YEARS = [2019, 2020, 2021, 2022, 2023];
const LATEST_YEAR = 2023;

interface StationJson {
  prefCode: string;
  prefName: string;
  dataset: string;
  source: string;
  years: number[];
  stations: Array<{ counts: Record<string, number> }>;
}

interface PrefSummary {
  prefCode: string;
  prefName: string;
  stationCount: number;
  /** 最新年度の県内合計乗降客数 (人/日) */
  latestTotal: number;
}

async function main() {
  const summaries: PrefSummary[] = [];
  let filesWritten = 0;

  for (let i = 1; i <= 47; i++) {
    const code = String(i).padStart(2, "0");
    const stationsPath = path.join(DATA_DIR, `${code}.json`);
    const linesPath = path.join(DATA_DIR, `lines-${code}.json`);
    if (!fs.existsSync(stationsPath)) {
      throw new Error(
        `${stationsPath} が無い。先に fetch-station-passengers.ts all を実行してください。`,
      );
    }

    const stationsRaw = fs.readFileSync(stationsPath, "utf8");
    const stationsJson = JSON.parse(stationsRaw) as StationJson;

    await saveToR2(`app/station-passengers/${code}/stations.json`, stationsRaw, {
      contentType: "application/json; charset=utf-8",
    });
    filesWritten++;

    if (fs.existsSync(linesPath)) {
      await saveToR2(
        `app/station-passengers/${code}/lines.json`,
        fs.readFileSync(linesPath, "utf8"),
        { contentType: "application/json; charset=utf-8" },
      );
      filesWritten++;
    } else {
      console.warn(`⚠ ${code}: lines-${code}.json が無い (路線図レイヤーなし)`);
    }

    let latestTotal = 0;
    for (const s of stationsJson.stations) {
      const v = s.counts[String(LATEST_YEAR)];
      if (typeof v === "number" && v > 0) latestTotal += v;
    }
    summaries.push({
      prefCode: code,
      prefName: stationsJson.prefName,
      stationCount: stationsJson.stations.length,
      latestTotal,
    });
  }

  // 県サマリ index (乗降客数降順)
  summaries.sort((a, b) => b.latestTotal - a.latestTotal);
  const index = {
    generatedAt: new Date().toISOString(),
    dataset: "国土数値情報 駅別乗降客数 (S12) / 鉄道 (N02)",
    years: YEARS,
    latestYear: LATEST_YEAR,
    prefectures: summaries,
  };
  await saveToR2(
    "app/station-passengers/index.json",
    JSON.stringify(index),
    { contentType: "application/json; charset=utf-8" },
  );
  filesWritten++;

  console.log(
    `✅ station-passengers: ${filesWritten} files (47 県 × stations+lines + index)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
