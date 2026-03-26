/**
 * 賃金構造基本統計調査 — 職種別年収データ投入スクリプト
 *
 * statsDataId=0003445758 から月給(tab:40)と賞与(tab:44)を取得し、
 * 年収(万円) = (月給 × 12 + 賞与) ÷ 10 を計算して ranking_data に INSERT する。
 *
 * Usage:
 *   npx tsx packages/database/scripts/populate-occupation-income.ts
 *   npx tsx packages/database/scripts/populate-occupation-income.ts --key researcher-annual-income
 *   npx tsx packages/database/scripts/populate-occupation-income.ts --dry-run
 */

import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(__dirname, "../../../.env.local") });
import Database from "better-sqlite3";
import { LOCAL_DB_PATHS } from "../src/config/local-db-paths";

const API_KEY = process.env.NEXT_PUBLIC_ESTAT_APP_ID;
if (!API_KEY) {
  console.error("NEXT_PUBLIC_ESTAT_APP_ID が未設定です");
  process.exit(1);
}

const BASE_URL = "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData";
const STATS_DATA_ID = "0003445758";

interface OccupationDef {
  rankingKey: string;
  cdCat02: string; // 職種コード
  occupationName: string;
}

const OCCUPATIONS: OccupationDef[] = [
  { rankingKey: "care-manager-annual-income", cdCat02: "1168", occupationName: "介護支援専門員（ケアマネージャー）" },
  { rankingKey: "high-school-teacher-annual-income", cdCat02: "1194", occupationName: "高等学校教員" },
  { rankingKey: "kindergarten-teacher-annual-income", cdCat02: "1191", occupationName: "幼稚園教員，保育教諭" },
  { rankingKey: "public-health-nurse-annual-income", cdCat02: "1131", occupationName: "保健師" },
  { rankingKey: "home-care-worker-annual-income", cdCat02: "1362", occupationName: "訪問介護従事者" },
  { rankingKey: "nursing-assistant-annual-income", cdCat02: "1371", occupationName: "看護助手" },
  { rankingKey: "researcher-annual-income", cdCat02: "1051", occupationName: "研究者" },
  { rankingKey: "associate-professor-annual-income", cdCat02: "1197", occupationName: "大学准教授（高専含む）" },
];

// CLI 引数
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const keyFilter =
  args.find((a) => a.startsWith("--key="))?.split("=")[1] ??
  (args.indexOf("--key") >= 0 ? args[args.indexOf("--key") + 1] : null);

let targets = OCCUPATIONS;
if (keyFilter) {
  targets = targets.filter((o) => o.rankingKey === keyFilter);
  if (targets.length === 0) {
    console.error(`キー "${keyFilter}" が見つかりません`);
    process.exit(1);
  }
}

// DB
const dbPath = LOCAL_DB_PATHS.STATIC.getPath();
const db = new Database(dbPath);
console.log(`DB: ${dbPath}`);
console.log(`対象: ${targets.map((o) => o.rankingKey).join(", ")}`);
if (isDryRun) console.log("【DRY RUN】");

// Prepared statements
const upsertData = db.prepare(`
  INSERT INTO ranking_data (area_type, category_code, area_code, area_name, year_code, year_name, category_name, value, unit, rank)
  VALUES ('prefecture', ?, ?, ?, ?, ?, ?, ?, '万円', ?)
  ON CONFLICT(area_type, category_code, year_code, area_code) DO UPDATE SET
    value = excluded.value,
    rank = excluded.rank,
    unit = excluded.unit,
    updated_at = CURRENT_TIMESTAMP
`);

const updateYears = db.prepare(`
  UPDATE ranking_items SET
    latest_year = ?,
    available_years = ?,
    updated_at = CURRENT_TIMESTAMP
  WHERE ranking_key = ? AND area_type = 'prefecture'
`);

/** プロキシ対応 fetch */
async function proxyFetch(url: string): Promise<Response> {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (proxyUrl) {
    try {
      const { ProxyAgent } = await import("undici");
      const dispatcher = new ProxyAgent(proxyUrl);
      return fetch(url, { dispatcher } as any);
    } catch {
      // undici が使えない場合はそのまま fetch
    }
  }
  return fetch(url);
}

/** e-Stat API からデータ取得（cdCat01=01: 男女計, cdCat02: 職種コード） */
async function fetchWageData(cdCat02: string): Promise<any[]> {
  const params = new URLSearchParams({
    appId: API_KEY!,
    statsDataId: STATS_DATA_ID,
    cdCat01: "01", // 男女計
    cdCat02,
    lang: "J",
    metaGetFlg: "N",
    cntGetFlg: "N",
    limit: "100000",
  });
  const url = `${BASE_URL}?${params}`;
  console.log(`  API: cdCat02=${cdCat02}`);
  const res = await proxyFetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const status = json.GET_STATS_DATA?.RESULT?.STATUS;
  if (status !== 0) {
    throw new Error(`API error: ${json.GET_STATS_DATA?.RESULT?.ERROR_MSG}`);
  }
  const values = json.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE;
  return Array.isArray(values) ? values : values ? [values] : [];
}

/** 5桁の都道府県コードを2桁に変換 */
function toTwoDigitCode(areaCode: string): string | null {
  if (!/^\d{5}$/.test(areaCode)) return null;
  if (areaCode === "00000") return null; // 全国
  if (!areaCode.endsWith("000")) return null;
  const pref = parseInt(areaCode.substring(0, 2));
  if (pref < 1 || pref > 47) return null;
  return pref.toString().padStart(2, "0");
}

const PREF_NAMES: Record<string, string> = {
  "01": "北海道", "02": "青森県", "03": "岩手県", "04": "宮城県",
  "05": "秋田県", "06": "山形県", "07": "福島県", "08": "茨城県",
  "09": "栃木県", "10": "群馬県", "11": "埼玉県", "12": "千葉県",
  "13": "東京都", "14": "神奈川県", "15": "新潟県", "16": "富山県",
  "17": "石川県", "18": "福井県", "19": "山梨県", "20": "長野県",
  "21": "岐阜県", "22": "静岡県", "23": "愛知県", "24": "三重県",
  "25": "滋賀県", "26": "京都府", "27": "大阪府", "28": "兵庫県",
  "29": "奈良県", "30": "和歌山県", "31": "鳥取県", "32": "島根県",
  "33": "岡山県", "34": "広島県", "35": "山口県", "36": "徳島県",
  "37": "香川県", "38": "愛媛県", "39": "高知県", "40": "福岡県",
  "41": "佐賀県", "42": "長崎県", "43": "熊本県", "44": "大分県",
  "45": "宮崎県", "46": "鹿児島県", "47": "沖縄県",
};

async function processOccupation(def: OccupationDef): Promise<void> {
  console.log(`\n=== ${def.rankingKey}: ${def.occupationName} ===`);

  // 1. e-Stat API からデータ取得
  const rawData = await fetchWageData(def.cdCat02);
  console.log(`  API レスポンス: ${rawData.length} 件`);

  // 2. 都道府県 × 年度 × tab でグループ化
  // キー: `${year}_${prefCode}`, 値: { tab40: 月給(千円), tab44: 賞与(千円) }
  const grouped = new Map<string, { monthly?: number; bonus?: number }>();

  for (const row of rawData) {
    const areaCode5 = row["@area"];
    const timeCode = row["@time"];
    const tabCode = row["@tab"];
    const value = parseFloat(row["$"]);

    if (!areaCode5 || !timeCode || !tabCode || isNaN(value)) continue;

    const prefCode = toTwoDigitCode(areaCode5);
    if (!prefCode) continue;

    // tab:40 = 月給（千円）, tab:44 = 賞与（千円）
    if (tabCode !== "40" && tabCode !== "44") continue;

    const year = timeCode.substring(0, 4);
    const key = `${year}_${prefCode}`;

    if (!grouped.has(key)) grouped.set(key, {});
    const entry = grouped.get(key)!;

    if (tabCode === "40") entry.monthly = value;
    if (tabCode === "44") entry.bonus = value;
  }

  // 3. 年収計算: (月給 × 12 + 賞与) ÷ 10 → 万円
  // 年度ごとにグループ化
  const byYear = new Map<string, Map<string, number>>();

  for (const [key, entry] of grouped) {
    const [year, prefCode] = key.split("_");
    if (entry.monthly === undefined || entry.bonus === undefined) continue;

    const annualIncome = Math.round(((entry.monthly * 12 + entry.bonus) / 10) * 10) / 10; // 小数1桁

    if (!byYear.has(year)) byYear.set(year, new Map());
    byYear.get(year)!.set(prefCode, annualIncome);
  }

  const years = [...byYear.keys()].sort();
  if (years.length === 0) {
    console.log("  データなし — スキップ");
    return;
  }
  console.log(`  年度: ${years[0]}〜${years[years.length - 1]} (${years.length}年)`);

  // 4. ranking_data 投入
  let totalInserted = 0;

  const txn = db.transaction(() => {
    for (const [year, prefMap] of byYear) {
      // ランク計算（降順 — 年収が高い方が上位）
      const sorted = [...prefMap.entries()].sort((a, b) => b[1] - a[1]);
      let rank = 0;
      let prevValue = -1;
      let sameCount = 0;

      for (const [prefCode, value] of sorted) {
        if (value !== prevValue) {
          rank += 1 + sameCount;
          sameCount = 0;
          prevValue = value;
        } else {
          sameCount++;
        }

        const areaName = PREF_NAMES[prefCode] ?? prefCode;
        const yearName = `${year}年`;
        const categoryName = def.occupationName;

        if (!isDryRun) {
          upsertData.run(def.rankingKey, prefCode, areaName, year, yearName, categoryName, value, rank);
        }
        totalInserted++;
      }
    }

    // 5. latest_year / available_years 更新
    if (!isDryRun && years.length > 0) {
      const latestYear = JSON.stringify([years[years.length - 1]]);
      const availableYears = JSON.stringify(years);
      updateYears.run(latestYear, availableYears, def.rankingKey);
    }
  });

  txn();

  const prefCount = byYear.get(years[years.length - 1])?.size ?? 0;
  console.log(
    `  ${isDryRun ? "[DRY RUN] " : ""}投入: ${totalInserted} 件 (${prefCount}県 × ${years.length}年)`
  );

  // Top 3 表示（最新年度）
  if (!isDryRun && years.length > 0) {
    const latestYear = years[years.length - 1];
    const top = db
      .prepare(
        `SELECT area_name, value, rank FROM ranking_data
         WHERE category_code = ? AND year_code = ?
         ORDER BY rank LIMIT 3`
      )
      .all(def.rankingKey, latestYear) as any[];
    console.log(`  Top 3 (${latestYear}年):`);
    top.forEach((r: any) =>
      console.log(`    ${r.rank}位: ${r.area_name} = ${r.value.toLocaleString()} 万円`)
    );
  }
}

async function main() {
  for (const def of targets) {
    try {
      await processOccupation(def);
      // API レートリミット回避
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(
        `  ERROR (${def.rankingKey}):`,
        error instanceof Error ? error.message : error
      );
    }
  }

  console.log("\n=== 完了 ===");

  // 投入結果サマリ
  for (const def of targets) {
    const count = db
      .prepare("SELECT COUNT(*) as c FROM ranking_data WHERE category_code = ?")
      .get(def.rankingKey) as any;
    const item = db
      .prepare("SELECT latest_year, available_years FROM ranking_items WHERE ranking_key = ?")
      .get(def.rankingKey) as any;
    console.log(
      `  ${def.rankingKey}: ${count.c}件, latest=${item?.latest_year}, years=${item?.available_years}`
    );
  }

  db.close();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
