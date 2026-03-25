/**
 * 港湾統計データ投入スクリプト
 *
 * e-Stat API から甲種港湾の統計データを取得し、ローカル D1 に投入する。
 *
 * Usage:
 *   npx tsx packages/database/scripts/populate-port-statistics.ts
 *   npx tsx packages/database/scripts/populate-port-statistics.ts --metric passengers
 *   npx tsx packages/database/scripts/populate-port-statistics.ts --dry-run
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

/** 取得対象の指標定義 */
interface MetricDef {
  key: string;
  label: string;
  statsDataId: string;
  unit: string;
  /** フィルタパラメータ（合計値を抽出するため） */
  filters: Record<string, string>;
  /** 港コードが格納されている dimension（cat03 or cat04） */
  portDimension: string;
  /** 港湾種別（フィルタ用） */
  portClass?: "甲種" | "乙種";
  /** 同一 port+year で複数行が返る場合に合算するフラグ */
  needsAggregation?: boolean;
}

const METRICS: MetricDef[] = [
  // --- 甲種港湾 ---
  {
    key: "ships_total",
    label: "入港船舶隻数（合計）",
    statsDataId: "0003130814",
    unit: "隻",
    filters: { cdTab: "110", cdCat01: "100", cdCat02: "100" },
    portDimension: "cat03",
    portClass: "甲種",
  },
  {
    key: "cargo_total",
    label: "海上出入貨物トン数（合計）",
    statsDataId: "0003130803",
    unit: "トン",
    filters: { cdTab: "120", cdCat01: "100", cdCat02: "100", cdCat03: "100" },
    portDimension: "cat04",
    portClass: "甲種",
  },
  {
    key: "cargo_export",
    label: "輸出貨物トン数",
    statsDataId: "0003130803",
    unit: "トン",
    filters: { cdTab: "120", cdCat01: "110", cdCat02: "100", cdCat03: "100" },
    portDimension: "cat04",
    portClass: "甲種",
  },
  {
    key: "cargo_import",
    label: "輸入貨物トン数",
    statsDataId: "0003130803",
    unit: "トン",
    filters: { cdTab: "120", cdCat01: "120", cdCat02: "100", cdCat03: "100" },
    portDimension: "cat04",
    portClass: "甲種",
  },
  {
    key: "cargo_coastal_out",
    label: "移出貨物トン数",
    statsDataId: "0003130803",
    unit: "トン",
    filters: { cdTab: "120", cdCat01: "130", cdCat02: "100", cdCat03: "100" },
    portDimension: "cat04",
    portClass: "甲種",
  },
  {
    key: "cargo_coastal_in",
    label: "移入貨物トン数",
    statsDataId: "0003130803",
    unit: "トン",
    filters: { cdTab: "120", cdCat01: "140", cdCat02: "100", cdCat03: "100" },
    portDimension: "cat04",
    portClass: "甲種",
  },
  {
    key: "passengers_total",
    label: "船舶乗降人員（合計）",
    statsDataId: "0003130801",
    unit: "人",
    filters: { cdCat01: "100", cdCat02: "100" },
    portDimension: "cat03",
    portClass: "甲種",
  },
  {
    key: "passengers_boarding",
    label: "乗込人員",
    statsDataId: "0003130801",
    unit: "人",
    filters: { cdCat01: "110", cdCat02: "100" },
    portDimension: "cat03",
    portClass: "甲種",
  },
  {
    key: "passengers_landing",
    label: "上陸人員",
    statsDataId: "0003130801",
    unit: "人",
    filters: { cdCat01: "120", cdCat02: "100" },
    portDimension: "cat03",
    portClass: "甲種",
  },
  {
    key: "container_tonnage",
    label: "コンテナ・シャーシトン数（合計）",
    statsDataId: "0003130745",
    unit: "トン",
    filters: { cdCat01: "100", cdCat02: "100" },
    portDimension: "cat03",
    portClass: "甲種",
  },
  {
    key: "vehicle_ferry_total",
    label: "自動車航送車両台数（合計）",
    statsDataId: "0003131104",
    unit: "台",
    filters: { cdCat01: "100", cdCat02: "00001", cdCat03: "100" },
    portDimension: "cat04",
    portClass: "甲種",
  },
  {
    key: "ships_tonnage",
    label: "入港船舶総トン数",
    statsDataId: "0003130814",
    unit: "総トン",
    filters: { cdTab: "130", cdCat01: "100", cdCat02: "100" },
    portDimension: "cat03",
    portClass: "甲種",
  },
  {
    key: "vehicle_ferry_truck",
    label: "フェリー トラック台数",
    statsDataId: "0003131104",
    unit: "台",
    filters: { cdCat01: "100", cdCat02: "00001", cdCat03: "120" },
    portDimension: "cat04",
    portClass: "甲種",
  },
  {
    key: "vehicle_ferry_car",
    label: "フェリー 乗用車台数",
    statsDataId: "0003131104",
    unit: "台",
    filters: { cdCat01: "100", cdCat02: "00001", cdCat03: "130" },
    portDimension: "cat04",
    portClass: "甲種",
  },
  // --- 乙種港湾 ---
  {
    key: "ships_total",
    label: "入港船舶隻数（合計）[乙種]",
    statsDataId: "0003130816",
    unit: "隻",
    filters: { cdTab: "110", cdCat01: "100", cdCat02: "100" },
    portDimension: "cat03",
    portClass: "乙種",
  },
  {
    key: "cargo_total",
    label: "海上出入貨物トン数（合計）[乙種]",
    statsDataId: "0003130807",
    unit: "トン",
    filters: { cdTab: "120", cdCat01: "100", cdCat02: "100" },
    portDimension: "cat03",
    portClass: "乙種",
  },
  {
    key: "cargo_export",
    label: "輸出貨物トン数 [乙種]",
    statsDataId: "0003130807",
    unit: "トン",
    filters: { cdTab: "120", cdCat01: "110", cdCat02: "100" },
    portDimension: "cat03",
    portClass: "乙種",
  },
  {
    key: "cargo_import",
    label: "輸入貨物トン数 [乙種]",
    statsDataId: "0003130807",
    unit: "トン",
    filters: { cdTab: "120", cdCat01: "120", cdCat02: "100" },
    portDimension: "cat03",
    portClass: "乙種",
  },
  {
    key: "cargo_coastal_out",
    label: "移出貨物トン数 [乙種]",
    statsDataId: "0003130807",
    unit: "トン",
    filters: { cdTab: "120", cdCat01: "130", cdCat02: "100" },
    portDimension: "cat03",
    portClass: "乙種",
  },
  {
    key: "cargo_coastal_in",
    label: "移入貨物トン数 [乙種]",
    statsDataId: "0003130807",
    unit: "トン",
    filters: { cdTab: "120", cdCat01: "140", cdCat02: "100" },
    portDimension: "cat03",
    portClass: "乙種",
  },
  {
    key: "passengers_total",
    label: "船舶乗降人員（合計）[乙種]",
    statsDataId: "0003130817",
    unit: "人",
    filters: { cdCat01: "100", cdCat02: "100" },
    portDimension: "cat03",
    portClass: "乙種",
  },
  {
    key: "passengers_boarding",
    label: "乗込人員 [乙種]",
    statsDataId: "0003130817",
    unit: "人",
    filters: { cdCat01: "110", cdCat02: "100" },
    portDimension: "cat03",
    portClass: "乙種",
  },
  {
    key: "passengers_landing",
    label: "上陸人員 [乙種]",
    statsDataId: "0003130817",
    unit: "人",
    filters: { cdCat01: "120", cdCat02: "100" },
    portDimension: "cat03",
    portClass: "乙種",
  },
  {
    key: "container_tonnage",
    label: "コンテナ・シャーシトン数（合計）[乙種]",
    statsDataId: "0003130808",
    unit: "トン",
    filters: { cdCat01: "100" },
    portDimension: "cat02",
    portClass: "乙種",
    needsAggregation: true,
  },
  {
    key: "vehicle_ferry_total",
    label: "自動車航送車両台数（合計）[乙種]",
    statsDataId: "0003130820",
    unit: "台",
    filters: { cdCat01: "100", cdCat02: "100" },
    portDimension: "cat03",
    portClass: "乙種",
  },
  {
    key: "ships_tonnage",
    label: "入港船舶総トン数 [乙種]",
    statsDataId: "0003130816",
    unit: "総トン",
    filters: { cdTab: "130", cdCat01: "100", cdCat02: "100" },
    portDimension: "cat03",
    portClass: "乙種",
  },
  {
    key: "vehicle_ferry_truck",
    label: "フェリー トラック台数 [乙種]",
    statsDataId: "0003130820",
    unit: "台",
    filters: { cdCat01: "100", cdCat02: "120" },
    portDimension: "cat03",
    portClass: "乙種",
  },
  {
    key: "vehicle_ferry_car",
    label: "フェリー 乗用車台数 [乙種]",
    statsDataId: "0003130820",
    unit: "台",
    filters: { cdCat01: "100", cdCat02: "130" },
    portDimension: "cat03",
    portClass: "乙種",
  },
];

// --- CLI 引数パース ---
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const metricFilter = args.find((a) => a.startsWith("--metric="))?.split("=")[1]
  ?? (args.indexOf("--metric") >= 0 ? args[args.indexOf("--metric") + 1] : null);
const classFilter = args.find((a) => a.startsWith("--class="))?.split("=")[1]
  ?? (args.indexOf("--class") >= 0 ? args[args.indexOf("--class") + 1] : null);

let targetMetrics = METRICS;
if (metricFilter) {
  targetMetrics = targetMetrics.filter((m) => m.key === metricFilter || m.key.startsWith(metricFilter));
}
if (classFilter) {
  targetMetrics = targetMetrics.filter((m) => m.portClass === classFilter);
}

if (targetMetrics.length === 0) {
  console.error(`指標 "${metricFilter}" が見つかりません。利用可能: ${METRICS.map(m => m.key).join(", ")}`);
  process.exit(1);
}

// --- DB 接続 ---
const dbPath = LOCAL_DB_PATHS.STATIC.getPath();
console.log(`DB: ${dbPath}`);
console.log(`対象指標: ${targetMetrics.map(m => m.key).join(", ")}`);
if (isDryRun) console.log("【DRY RUN】");
console.log("");

const db = new Database(dbPath);

// 既知の港コード一覧を取得
const knownPorts = new Set(
  db.prepare("SELECT port_code FROM ports").all().map((r: any) => r.port_code as string)
);
console.log(`既知の港: ${knownPorts.size} 件`);

const upsertStmt = db.prepare(`
  INSERT INTO port_statistics (port_code, year, metric_key, value, unit)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT (port_code, year, metric_key) DO UPDATE SET
    value = excluded.value,
    unit = excluded.unit,
    updated_at = CURRENT_TIMESTAMP
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
  filters: Record<string, string>,
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

/** 港コードを正規化（5桁のうち都道府県計を除外） */
function isIndividualPort(code: string): boolean {
  // XX000 は都道府県計、00001 等は全国計 → 除外
  return /^\d{5}$/.test(code) && !code.endsWith("000") && !code.startsWith("00");
}

async function processMetric(metric: MetricDef): Promise<number> {
  console.log(`\n--- ${metric.key}: ${metric.label} ---`);

  if (metric.needsAggregation) {
    return processAggregateMetric(metric);
  }

  const rawData = await fetchEstatData(metric.statsDataId, metric.filters);
  console.log(`  API レスポンス: ${rawData.length} 件`);

  let inserted = 0;
  const portDimKey = `@${metric.portDimension}`;

  const txn = db.transaction(() => {
    for (const row of rawData) {
      const portCode = row[portDimKey];
      const timeCode = row["@time"];
      const value = parseFloat(row["$"]);

      if (!portCode || !timeCode || isNaN(value)) continue;
      if (!isIndividualPort(portCode)) continue;
      if (!knownPorts.has(portCode)) continue;

      const year = timeCode.substring(0, 4);

      if (!isDryRun) {
        upsertStmt.run(portCode, year, metric.key, value, metric.unit);
      }
      inserted++;
    }
  });

  txn();
  console.log(`  ${isDryRun ? "[DRY RUN] " : ""}投入: ${inserted} 件`);
  return inserted;
}

/** 同一 port+year の複数行を合算して投入 */
async function processAggregateMetric(metric: MetricDef): Promise<number> {
  const portDimKey = `@${metric.portDimension}`;

  const rawData = await fetchEstatData(metric.statsDataId, metric.filters);
  console.log(`  API レスポンス: ${rawData.length} 件（合算モード）`);

  const aggregated = new Map<string, number>();

  for (const row of rawData) {
    const portCode = row[portDimKey];
    const timeCode = row["@time"];
    const value = parseFloat(row["$"]);

    if (!portCode || !timeCode || isNaN(value)) continue;
    if (!isIndividualPort(portCode)) continue;
    if (!knownPorts.has(portCode)) continue;

    const year = timeCode.substring(0, 4);
    const key = `${portCode}_${year}`;
    aggregated.set(key, (aggregated.get(key) ?? 0) + value);
  }

  console.log(`  合算結果: ${aggregated.size} 件`);

  let inserted = 0;
  const txn = db.transaction(() => {
    for (const [key, value] of aggregated) {
      const [portCode, year] = key.split("_");
      if (!isDryRun) {
        upsertStmt.run(portCode, year, metric.key, value, metric.unit);
      }
      inserted++;
    }
  });

  txn();
  console.log(`  ${isDryRun ? "[DRY RUN] " : ""}投入: ${inserted} 件`);
  return inserted;
}

// --- メイン処理 ---
async function main() {
  let totalInserted = 0;

  for (const metric of targetMetrics) {
    try {
      const count = await processMetric(metric);
      totalInserted += count;
    } catch (error) {
      console.error(`  ERROR (${metric.key}):`, error instanceof Error ? error.message : error);
    }
  }

  // 最終サマリー
  const totalRows = db.prepare("SELECT COUNT(*) as cnt FROM port_statistics").get() as any;
  console.log(`\n=== 完了 ===`);
  console.log(`投入合計: ${totalInserted} 件`);
  console.log(`port_statistics 総行数: ${totalRows.cnt}`);

  // metric_key 別の行数
  const byMetric = db.prepare(
    "SELECT metric_key, COUNT(*) as cnt FROM port_statistics GROUP BY metric_key ORDER BY metric_key"
  ).all() as any[];
  console.log("\n指標別行数:");
  for (const row of byMetric) {
    console.log(`  ${row.metric_key}: ${row.cnt}`);
  }

  db.close();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
