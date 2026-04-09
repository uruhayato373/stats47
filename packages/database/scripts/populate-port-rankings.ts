/**
 * 港湾統計 都道府県別ランキングデータ投入スクリプト
 *
 * 第1部 総括表（都道府県別）から ranking_items + ranking_data に投入する。
 * 既存3キーの全年度拡張 + 新規5キーの登録を行う。
 *
 * Usage:
 *   npx tsx packages/database/scripts/populate-port-rankings.ts
 *   npx tsx packages/database/scripts/populate-port-rankings.ts --key port-cargo-export
 *   npx tsx packages/database/scripts/populate-port-rankings.ts --dry-run
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

interface RankingDef {
  rankingKey: string;
  rankingName: string;
  statsDataId: string;
  filters: Record<string, string>;
  unit: string;
  displayUnit?: string;
  conversionFactor?: number;
}

const RANKINGS: RankingDef[] = [
  {
    rankingKey: "port-inbound-ships",
    rankingName: "入港船舶隻数（港湾統計）",
    statsDataId: "0003130773",
    filters: { cdTab: "110", cdCat01: "100", cdCat02: "100" },
    unit: "隻",
  },
  {
    rankingKey: "port-ships-tonnage",
    rankingName: "入港船舶総トン数（港湾統計）",
    statsDataId: "0003130773",
    filters: { cdTab: "130", cdCat01: "100", cdCat02: "100", cdCat03: "120" },
    unit: "総トン",
    displayUnit: "万総トン",
    conversionFactor: 0.0001,
  },
  {
    rankingKey: "port-cargo-total",
    rankingName: "海上出入貨物量（港湾統計）",
    statsDataId: "0003130738",
    filters: { cdTab: "120", cdCat01: "100", cdCat02: "100", cdCat03: "100" },
    unit: "トン",
    displayUnit: "万トン",
    conversionFactor: 0.0001,
  },
  {
    rankingKey: "port-cargo-export",
    rankingName: "輸出貨物量（港湾統計）",
    statsDataId: "0003130738",
    filters: { cdTab: "120", cdCat01: "110", cdCat02: "100", cdCat03: "100" },
    unit: "トン",
    displayUnit: "万トン",
    conversionFactor: 0.0001,
  },
  {
    rankingKey: "port-cargo-import",
    rankingName: "輸入貨物量（港湾統計）",
    statsDataId: "0003130738",
    filters: { cdTab: "120", cdCat01: "120", cdCat02: "100", cdCat03: "100" },
    unit: "トン",
    displayUnit: "万トン",
    conversionFactor: 0.0001,
  },
  {
    rankingKey: "port-passengers-total",
    rankingName: "港湾旅客数（港湾統計）",
    statsDataId: "0003130737",
    filters: { cdCat01: "100", cdCat02: "100" },
    unit: "人",
    displayUnit: "万人",
    conversionFactor: 0.0001,
  },
  {
    rankingKey: "port-container-count",
    rankingName: "コンテナ取扱個数（港湾統計）",
    statsDataId: "0003130688",
    filters: { cdTab: "150", cdCat01: "100", cdCat02: "100" },
    unit: "TEU",
    displayUnit: "万TEU",
    conversionFactor: 0.0001,
  },
  {
    rankingKey: "port-vehicle-ferry",
    rankingName: "自動車航送車両台数（港湾統計）",
    statsDataId: "0003130796",
    filters: { cdTab: "140", cdCat01: "100", cdCat02: "100" },
    unit: "台",
    displayUnit: "万台",
    conversionFactor: 0.0001,
  },
];

// CLI 引数
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const keyFilter =
  args.find((a) => a.startsWith("--key="))?.split("=")[1] ??
  (args.indexOf("--key") >= 0 ? args[args.indexOf("--key") + 1] : null);

let targets = RANKINGS;
if (keyFilter) {
  targets = targets.filter((r) => r.rankingKey === keyFilter);
  if (targets.length === 0) {
    console.error(`キー "${keyFilter}" が見つかりません`);
    process.exit(1);
  }
}

// DB
const dbPath = LOCAL_DB_PATHS.STATIC.getPath();
const db = new Database(dbPath);
console.log(`DB: ${dbPath}`);
console.log(`対象: ${targets.map((r) => r.rankingKey).join(", ")}`);
if (isDryRun) console.log("【DRY RUN】");

const SOURCE_CONFIG_BASE = {
  survey: {
    name: "港湾調査（港湾統計年報）",
    url: "https://www.e-stat.go.jp/stat-search/files?toukei=00600280",
  },
};

// Prepared statements
const upsertItem = db.prepare(`
  INSERT INTO ranking_items (
    ranking_key, area_type, ranking_name, title, unit, category_key,
    is_active, is_featured, data_source_id, source_config,
    value_display_config, visualization_config, calculation_config,
    latest_year, available_years
  ) VALUES (?, 'prefecture', ?, ?, ?, 'infrastructure',
    1, 0, 'estat', ?,
    ?, ?, '{"isCalculated":false}',
    '[]', '[]')
  ON CONFLICT(ranking_key, area_type) DO UPDATE SET
    ranking_name = excluded.ranking_name,
    title = excluded.title,
    unit = excluded.unit,
    category_key = 'infrastructure',
    source_config = excluded.source_config,
    value_display_config = excluded.value_display_config,
    updated_at = CURRENT_TIMESTAMP
`);

const upsertData = db.prepare(`
  INSERT INTO ranking_data (area_type, category_code, area_code, area_name, year_code, year_name, category_name, value, unit, rank)
  VALUES ('prefecture', ?, ?, ?, ?, ?, '合計', ?, ?, ?)
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
  WHERE ranking_key = ?
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

/** e-Stat API からデータ取得 */
async function fetchEstatData(
  statsDataId: string,
  filters: Record<string, string>
): Promise<any[]> {
  const params = new URLSearchParams({
    appId: API_KEY!,
    statsDataId,
    lang: "J",
    metaGetFlg: "N",
    cntGetFlg: "N",
    ...filters,
  });
  const url = `${BASE_URL}?${params}`;
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

/** 都道府県コード（5桁、都道府県計のみ通す） */
function isPrefCode(areaCode: string): boolean {
  if (!/^\d{5}$/.test(areaCode)) return false;
  if (areaCode === "00000") return false; // 全国
  if (!areaCode.endsWith("000")) return false; // 都道府県計以外は除外
  const pref = parseInt(areaCode.substring(0, 2));
  return pref >= 1 && pref <= 47;
}

const PREF_NAMES: Record<string, string> = {
  "01000": "北海道", "02000": "青森県", "03000": "岩手県", "04000": "宮城県",
  "05000": "秋田県", "06000": "山形県", "07000": "福島県", "08000": "茨城県",
  "09000": "栃木県", "10000": "群馬県", "11000": "埼玉県", "12000": "千葉県",
  "13000": "東京都", "14000": "神奈川県", "15000": "新潟県", "16000": "富山県",
  "17000": "石川県", "18000": "福井県", "19000": "山梨県", "20000": "長野県",
  "21000": "岐阜県", "22000": "静岡県", "23000": "愛知県", "24000": "三重県",
  "25000": "滋賀県", "26000": "京都府", "27000": "大阪府", "28000": "兵庫県",
  "29000": "奈良県", "30000": "和歌山県", "31000": "鳥取県", "32000": "島根県",
  "33000": "岡山県", "34000": "広島県", "35000": "山口県", "36000": "徳島県",
  "37000": "香川県", "38000": "愛媛県", "39000": "高知県", "40000": "福岡県",
  "41000": "佐賀県", "42000": "長崎県", "43000": "熊本県", "44000": "大分県",
  "45000": "宮崎県", "46000": "鹿児島県", "47000": "沖縄県",
};

async function processRanking(def: RankingDef): Promise<void> {
  console.log(`\n=== ${def.rankingKey}: ${def.rankingName} ===`);

  // 1. ranking_items upsert
  const sourceConfig = JSON.stringify({
    ...SOURCE_CONFIG_BASE,
    statsDataId: def.statsDataId,
    ...def.filters,
  });
  const valueDisplayConfig = JSON.stringify({
    conversionFactor: def.conversionFactor ?? 1,
    decimalPlaces: 1,
    ...(def.displayUnit ? { displayUnit: def.displayUnit } : {}),
  });
  const vizConfig = JSON.stringify({
    colorScheme: "interpolateBlues",
    colorSchemeType: "sequential",
    minValueType: "zero",
  });

  if (!isDryRun) {
    upsertItem.run(
      def.rankingKey,
      def.rankingName,
      def.rankingName,
      def.unit,
      sourceConfig,
      valueDisplayConfig,
      vizConfig
    );
  }
  console.log(`  ranking_items: upserted`);

  // 2. e-Stat API からデータ取得
  const rawData = await fetchEstatData(def.statsDataId, def.filters);
  console.log(`  API レスポンス: ${rawData.length} 件`);

  // 3. 都道府県 × 年度でグループ化
  const byYear = new Map<string, Map<string, number>>();

  for (const row of rawData) {
    const areaCode = row["@area"];
    const timeCode = row["@time"];
    const value = parseFloat(row["$"]);

    if (!areaCode || !timeCode || isNaN(value)) continue;
    if (!isPrefCode(areaCode)) continue;

    const year = timeCode.substring(0, 4);
    if (!byYear.has(year)) byYear.set(year, new Map());
    byYear.get(year)!.set(areaCode, value);
  }

  const years = [...byYear.keys()].sort();
  console.log(`  年度: ${years[0]}〜${years[years.length - 1]} (${years.length}年)`);

  // 4. ranking_data 投入（年度ごとにランク計算）
  let totalInserted = 0;

  const txn = db.transaction(() => {
    for (const [year, prefMap] of byYear) {
      // ランク計算（降順）
      const sorted = [...prefMap.entries()].sort((a, b) => b[1] - a[1]);
      let rank = 0;
      let prevValue = -1;
      let sameCount = 0;

      for (const [areaCode, value] of sorted) {
        if (value !== prevValue) {
          rank += 1 + sameCount;
          sameCount = 0;
          prevValue = value;
        } else {
          sameCount++;
        }

        const areaName = PREF_NAMES[areaCode] ?? areaCode;
        const yearName = `${year}年`;

        if (!isDryRun) {
          upsertData.run(def.rankingKey, areaCode, areaName, year, yearName, value, def.unit, rank);
        }
        totalInserted++;
      }
    }

    // 5. latest_year / available_years 更新
    if (!isDryRun && years.length > 0) {
      const latestYearCode = years[years.length - 1];
      updateYears.run(
        JSON.stringify({ yearCode: latestYearCode, yearName: `${latestYearCode}年` }),
        JSON.stringify(years.map(y => ({ yearCode: y, yearName: `${y}年` }))),
        def.rankingKey
      );
    }
  });

  txn();

  const prefCount = byYear.get(years[years.length - 1])?.size ?? 0;
  console.log(
    `  ${isDryRun ? "[DRY RUN] " : ""}投入: ${totalInserted} 件 (${prefCount}県 × ${years.length}年)`
  );

  // Top 3 表示
  if (years.length > 0) {
    const latestYear = years[years.length - 1];
    const top = db
      .prepare(
        `SELECT area_code, value, rank FROM ranking_data
         WHERE category_code = ? AND year_code = ?
         ORDER BY rank LIMIT 3`
      )
      .all(def.rankingKey, latestYear) as any[];
    console.log(`  Top 3 (${latestYear}年):`);
    top.forEach((r: any) =>
      console.log(`    ${r.rank}位: ${r.area_code} = ${r.value.toLocaleString()} ${def.unit}`)
    );
  }
}

async function main() {
  for (const def of targets) {
    try {
      await processRanking(def);
    } catch (error) {
      console.error(
        `  ERROR (${def.rankingKey}):`,
        error instanceof Error ? error.message : error
      );
    }
  }

  console.log("\n=== 完了 ===");
  const total = db
    .prepare(
      "SELECT COUNT(*) as c FROM ranking_data WHERE category_code LIKE 'port-%'"
    )
    .get() as any;
  console.log(`port- ランキング合計: ${total.c} 件`);

  db.close();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
