#!/usr/bin/env tsx
/**
 * KSJ データから都道府県別施設数を集計し、ranking_items + ranking_data に登録
 */

import * as fs from "node:fs";
import * as path from "node:path";
import Database from "better-sqlite3";
import * as topojsonClient from "topojson-client";

const DB_PATH =
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite";

// 都道府県コード → 名前
const PREF_NAMES: Record<string, string> = {
  "01": "北海道", "02": "青森県", "03": "岩手県", "04": "宮城県", "05": "秋田県",
  "06": "山形県", "07": "福島県", "08": "茨城県", "09": "栃木県", "10": "群馬県",
  "11": "埼玉県", "12": "千葉県", "13": "東京都", "14": "神奈川県", "15": "新潟県",
  "16": "富山県", "17": "石川県", "18": "福井県", "19": "山梨県", "20": "長野県",
  "21": "岐阜県", "22": "静岡県", "23": "愛知県", "24": "三重県", "25": "滋賀県",
  "26": "京都府", "27": "大阪府", "28": "兵庫県", "29": "奈良県", "30": "和歌山県",
  "31": "鳥取県", "32": "島根県", "33": "岡山県", "34": "広島県", "35": "山口県",
  "36": "徳島県", "37": "香川県", "38": "愛媛県", "39": "高知県", "40": "福岡県",
  "41": "佐賀県", "42": "長崎県", "43": "熊本県", "44": "大分県", "45": "宮崎県",
  "46": "鹿児島県", "47": "沖縄県",
};

// 全都道府県の5桁コード
const ALL_PREF_CODES = Object.keys(PREF_NAMES).map((c) => c + "000");

interface RankingDef {
  rankingKey: string;
  rankingName: string;
  unit: string;
  categoryKey: string;
  dataId: string;
  version: string;
  filename?: string; // 特定ファイルのみ対象
  filenamePattern?: string; // ファイル名パターン（部分一致）
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
    rankingName: "風力発電施設数（施設ベース）",
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

/**
 * TopoJSON からGeoJSON FeatureCollection を取得
 */
function toGeoJson(topoPath: string) {
  const raw = fs.readFileSync(topoPath, "utf-8");
  const topo = JSON.parse(raw);
  const objKey = Object.keys(topo.objects)[0];
  return topojsonClient.feature(topo, topo.objects[objKey]) as unknown as {
    type: "FeatureCollection";
    features: Array<{
      type: "Feature";
      geometry: { type: string; coordinates: number[] | number[][] | number[][][] };
      properties: Record<string, unknown>;
    }>;
  };
}

/**
 * feature の座標から都道府県コード（5桁）を推定
 * 簡易的に緯度経度の最初の点から最近傍の県庁所在地で判定
 */
function getCoord(
  feature: { geometry: { type: string; coordinates: unknown } }
): [number, number] | null {
  const g = feature.geometry;
  if (!g || !g.coordinates) return null;

  // Point
  if (g.type === "Point") {
    const c = g.coordinates as number[];
    return [c[0], c[1]];
  }
  // LineString
  if (g.type === "LineString") {
    const c = g.coordinates as number[][];
    if (c.length > 0) return [c[0][0], c[0][1]];
  }
  // Polygon
  if (g.type === "Polygon") {
    const c = g.coordinates as number[][][];
    if (c.length > 0 && c[0].length > 0) return [c[0][0][0], c[0][0][1]];
  }
  // MultiLineString / MultiPolygon
  if (g.type === "MultiLineString") {
    const c = g.coordinates as number[][][];
    if (c.length > 0 && c[0].length > 0) return [c[0][0][0], c[0][0][1]];
  }
  if (g.type === "MultiPolygon") {
    const c = g.coordinates as number[][][][];
    if (c.length > 0 && c[0].length > 0 && c[0][0].length > 0)
      return [c[0][0][0][0], c[0][0][0][1]];
  }
  return null;
}

// 県庁所在地の座標（簡易版）
const PREF_CENTERS: Array<{ code: string; lon: number; lat: number }> = [
  { code: "01", lon: 141.347, lat: 43.064 }, { code: "02", lon: 140.74, lat: 40.824 },
  { code: "03", lon: 141.153, lat: 39.704 }, { code: "04", lon: 140.872, lat: 38.269 },
  { code: "05", lon: 140.103, lat: 39.72 }, { code: "06", lon: 140.344, lat: 38.241 },
  { code: "07", lon: 140.468, lat: 37.75 }, { code: "08", lon: 140.447, lat: 36.342 },
  { code: "09", lon: 139.884, lat: 36.567 }, { code: "10", lon: 139.061, lat: 36.391 },
  { code: "11", lon: 139.649, lat: 35.857 }, { code: "12", lon: 140.124, lat: 35.605 },
  { code: "13", lon: 139.692, lat: 35.69 }, { code: "14", lon: 139.642, lat: 35.448 },
  { code: "15", lon: 139.024, lat: 37.902 }, { code: "16", lon: 137.211, lat: 36.695 },
  { code: "17", lon: 136.626, lat: 36.594 }, { code: "18", lon: 136.222, lat: 36.065 },
  { code: "19", lon: 138.569, lat: 35.664 }, { code: "20", lon: 138.181, lat: 36.238 },
  { code: "21", lon: 136.723, lat: 35.391 }, { code: "22", lon: 138.383, lat: 34.977 },
  { code: "23", lon: 136.907, lat: 35.18 }, { code: "24", lon: 136.509, lat: 34.73 },
  { code: "25", lon: 135.868, lat: 35.005 }, { code: "26", lon: 135.76, lat: 35.021 },
  { code: "27", lon: 135.52, lat: 34.686 }, { code: "28", lon: 135.183, lat: 34.691 },
  { code: "29", lon: 135.833, lat: 34.685 }, { code: "30", lon: 135.168, lat: 34.226 },
  { code: "31", lon: 134.238, lat: 35.504 }, { code: "32", lon: 133.051, lat: 35.472 },
  { code: "33", lon: 133.935, lat: 34.662 }, { code: "34", lon: 132.459, lat: 34.396 },
  { code: "35", lon: 131.472, lat: 34.186 }, { code: "36", lon: 134.559, lat: 34.066 },
  { code: "37", lon: 134.044, lat: 34.34 }, { code: "38", lon: 132.766, lat: 33.842 },
  { code: "39", lon: 133.531, lat: 33.559 }, { code: "40", lon: 130.418, lat: 33.607 },
  { code: "41", lon: 130.299, lat: 33.249 }, { code: "42", lon: 129.874, lat: 32.745 },
  { code: "43", lon: 130.742, lat: 32.79 }, { code: "44", lon: 131.613, lat: 33.238 },
  { code: "45", lon: 131.424, lat: 31.911 }, { code: "46", lon: 130.558, lat: 31.561 },
  { code: "47", lon: 127.681, lat: 26.335 },
];

function findNearestPref(lon: number, lat: number): string {
  let minDist = Infinity;
  let nearest = "13";
  for (const p of PREF_CENTERS) {
    const d = (p.lon - lon) ** 2 + (p.lat - lat) ** 2;
    if (d < minDist) {
      minDist = d;
      nearest = p.code;
    }
  }
  return nearest;
}

function countByPrefecture(
  def: RankingDef
): Map<string, number> {
  const baseDir = `.local/r2/gis/mlit-ksj/${def.dataId}/${def.version}`;
  const files = fs
    .readdirSync(baseDir)
    .filter((f) => f.endsWith(".topojson"))
    .filter((f) => {
      if (def.filename) return f === def.filename;
      if (def.filenamePattern) return f.includes(def.filenamePattern);
      return true;
    });

  const counts = new Map<string, number>();
  // 全47都道府県を0で初期化
  for (const code of Object.keys(PREF_NAMES)) {
    counts.set(code, 0);
  }

  for (const file of files) {
    const fpath = path.join(baseDir, file);
    const fc = toGeoJson(fpath);

    for (const feature of fc.features) {
      const coord = getCoord(feature);
      if (!coord) continue;
      const [lon, lat] = coord;
      const prefCode = findNearestPref(lon, lat);
      counts.set(prefCode, (counts.get(prefCode) || 0) + 1);
    }
  }

  return counts;
}

async function main() {
  const db = new Database(DB_PATH);
  const now = new Date().toISOString();

  const insertItem = db.prepare(`
    INSERT INTO ranking_items (
      ranking_key, area_type, ranking_name, title, unit, category_key, data_source_id,
      source_config, is_active, is_featured, created_at, updated_at
    ) VALUES (?, 'prefecture', ?, ?, ?, ?, 'mlit_ksj', ?, 1, 0, ?, ?)
  `);

  const insertData = db.prepare(`
    INSERT OR REPLACE INTO ranking_data (
      area_type, area_code, area_name, year_code, year_name,
      category_code, category_name, value, unit, rank, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const checkExisting = db.prepare(
    "SELECT ranking_key FROM ranking_items WHERE ranking_key = ?"
  );

  let created = 0;
  let skipped = 0;
  let dataRows = 0;

  for (const def of RANKINGS) {
    const existing = checkExisting.get(def.rankingKey);
    if (existing) {
      console.log(`[SKIP] ${def.rankingKey} (既に存在)`);
      skipped++;
      continue;
    }

    console.log(`[集計] ${def.rankingKey} (${def.rankingName})...`);
    const counts = countByPrefecture(def);

    const sourceConfig = JSON.stringify({
      source: {
        name: "国土数値情報",
        url: "https://nlftp.mlit.go.jp/ksj/index.html",
      },
      ksjDataId: def.dataId,
      ksjVersion: def.version,
      description: def.description || def.rankingName,
    });

    // ranking_items 登録
    insertItem.run(
      def.rankingKey,
      def.rankingName,
      def.rankingName,
      def.unit,
      def.categoryKey,
      sourceConfig,
      now,
      now
    );

    // ranking_data 登録（順位付き）
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    let rank = 0;
    let prevVal = -1;
    for (let i = 0; i < sorted.length; i++) {
      const [prefCode, count] = sorted[i];
      if (count !== prevVal) { rank = i + 1; prevVal = count; }
      const areaCode = prefCode + "000";
      const areaName = PREF_NAMES[prefCode] || "";
      insertData.run(
        "prefecture",
        areaCode,
        areaName,
        def.yearCode,
        def.yearCode + "年",
        def.rankingKey,
        def.rankingName,
        count,
        def.unit,
        rank,
        now,
        now
      );
      dataRows++;
    }

    const total = [...counts.values()].reduce((a, b) => a + b, 0);
    const top3 = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([c, v]) => `${PREF_NAMES[c]}(${v})`)
      .join(", ");
    console.log(`  → 合計: ${total}, TOP3: ${top3}`);
    created++;
  }

  console.log(`\n=== 完了 ===`);
  console.log(`  作成: ${created} ランキング`);
  console.log(`  スキップ: ${skipped}`);
  console.log(`  ranking_data: ${dataRows} 行`);

  db.close();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
