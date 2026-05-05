#!/usr/bin/env tsx
/**
 * 港湾数・漁港数 都道府県別集計 — metrics + stats に登録
 *
 * データソース:
 *   - port-count      : ports テーブル（甲種＋乙種、is_active=1）
 *   - fishing-port-count: fishing_ports テーブル（is_active=1）
 *
 * Usage:
 *   npx tsx packages/database/scripts/register-port-counts.ts
 *   npx tsx packages/database/scripts/register-port-counts.ts --dry-run
 *   npx tsx packages/database/scripts/register-port-counts.ts --key port-count
 */

import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(__dirname, "../../../.env.local") });
import Database from "better-sqlite3";
import { LOCAL_DB_PATHS } from "../src/config/local-db-paths";

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

interface MetricDef {
  key: string;
  title: string;
  unit: string;
  categoryKey: string;
  yearCode: string;
  description: string;
  sourceConfigJson: string;
  query: string; // SELECT prefecture_code, COUNT(*) as cnt ...
}

const METRICS: MetricDef[] = [
  {
    key: "port-count",
    title: "港湾数",
    unit: "港",
    categoryKey: "infrastructure",
    yearCode: "2024",
    description: "都道府県内にある港湾（甲種・乙種）の数",
    sourceConfigJson: JSON.stringify({
      source: {
        name: "国土交通省港湾局",
        url: "https://www.mlit.go.jp/kowan/",
      },
      note: "ports テーブル（甲種・乙種、is_active=1）から集計",
    }),
    query: `
      SELECT prefecture_code, COUNT(*) AS cnt
      FROM ports
      WHERE is_active = 1
      GROUP BY prefecture_code
    `,
  },
  {
    key: "fishing-port-count",
    title: "漁港数",
    unit: "港",
    categoryKey: "agriculture",
    yearCode: "2006",
    description: "都道府県内にある漁港の数（漁港漁場整備法に基づく第1〜第4種・特定第3種）",
    sourceConfigJson: JSON.stringify({
      source: {
        name: "国土数値情報（漁港）",
        url: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-C09.html",
      },
      ksjDataId: "C09",
      ksjVersion: "06",
      note: "fishing_ports テーブル（is_active=1）から集計",
    }),
    query: `
      SELECT prefecture_code, COUNT(*) AS cnt
      FROM fishing_ports
      WHERE is_active = 1
      GROUP BY prefecture_code
    `,
  },
];

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const keyFilter =
  args.find((a) => a.startsWith("--key="))?.split("=")[1] ??
  (args.indexOf("--key") >= 0 ? args[args.indexOf("--key") + 1] : null);

let targets = METRICS;
if (keyFilter) {
  targets = targets.filter((m) => m.key === keyFilter);
  if (targets.length === 0) {
    console.error(`キー "${keyFilter}" が見つかりません`);
    process.exit(1);
  }
}

const dbPath = LOCAL_DB_PATHS.STATIC.getPath();
const db = new Database(dbPath);
console.log(`DB: ${dbPath}`);
if (isDryRun) console.log("【DRY RUN】");

const upsertMetric = db.prepare(`
  INSERT INTO metrics (key, title, unit, category_key, source_id, source_config_json, is_active, year_format, created_at, updated_at)
  VALUES (?, ?, ?, ?, 'mlit_ksj', ?, 1, 'plain', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT(key) DO UPDATE SET
    title = excluded.title,
    unit = excluded.unit,
    category_key = excluded.category_key,
    source_config_json = excluded.source_config_json,
    updated_at = CURRENT_TIMESTAMP
`);

const upsertObservation = db.prepare(`
  INSERT OR REPLACE INTO stats
    (metric_key, area_type, area_code, area_name, year_code, year_name, value, unit, rank)
  VALUES (?, 'prefecture', ?, ?, ?, ?, ?, ?, ?)
`);

for (const def of targets) {
  console.log(`\n=== ${def.key}: ${def.title} ===`);

  const rows = db.prepare(def.query).all() as Array<{ prefecture_code: string; cnt: number }>;
  console.log(`  集計結果: ${rows.length} 都道府県`);

  // 全47都道府県を0で初期化（データなし県も0として登録）
  const counts = new Map<string, number>();
  for (const code of Object.keys(PREF_NAMES)) {
    counts.set(code, 0);
  }
  for (const row of rows) {
    counts.set(row.prefecture_code, row.cnt);
  }

  // ランク計算（降順、同値同順位）
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const ranked: Array<{ prefCode: string; count: number; rank: number }> = [];
  let rank = 0;
  let prevVal = -1;
  let sameCount = 0;

  for (let i = 0; i < sorted.length; i++) {
    const [prefCode, count] = sorted[i];
    if (count !== prevVal) {
      rank += 1 + sameCount;
      sameCount = 0;
      prevVal = count;
    } else {
      sameCount++;
    }
    ranked.push({ prefCode, count, rank });
  }

  const top3 = ranked.slice(0, 3).map((r) => `${PREF_NAMES[r.prefCode]}(${r.count})`).join(", ");
  const total = sorted.reduce((s, [, v]) => s + v, 0);
  console.log(`  合計: ${total}${def.unit}, TOP3: ${top3}`);

  if (!isDryRun) {
    const txn = db.transaction(() => {
      upsertMetric.run(def.key, def.title, def.unit, def.categoryKey, def.sourceConfigJson);

      for (const { prefCode, count, rank: r } of ranked) {
        const areaCode = prefCode + "000";
        const areaName = PREF_NAMES[prefCode] ?? prefCode;
        const yearName = `${def.yearCode}年`;
        upsertObservation.run(def.key, areaCode, areaName, def.yearCode, yearName, count, def.unit, r);
      }
    });
    txn();
    console.log(`  登録完了: metrics 1件 + stats ${ranked.length}件`);
  }
}

console.log("\n=== 完了 ===");
db.close();
