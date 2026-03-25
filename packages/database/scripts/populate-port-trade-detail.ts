/**
 * 港湾貿易明細データ投入スクリプト
 *
 * 品種別×仕向国/仕出国のクロス集計データを e-Stat API から取得し
 * port_trade_detail テーブルに投入する。
 *
 * データソース: 港湾統計（年報）第2部 第3表(4)-(7)
 * - 輸出品種別仕向国   2010-2019: 0003131923, 2020~: 0004001881
 * - 輸入品種別仕出国   2010-2019: 0003131925, 2020~: 0004001900
 * - 移出品種別仕向港   2010-2019: 0003131089, 2020~: 0004001901
 * - 移入品種別仕出港   2010-2019: 0003131051, 2020~: 0004001902
 *
 * Usage:
 *   npx tsx packages/database/scripts/populate-port-trade-detail.ts
 *   npx tsx packages/database/scripts/populate-port-trade-detail.ts --direction export
 *   npx tsx packages/database/scripts/populate-port-trade-detail.ts --dry-run
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
const API_LIMIT = 100000;

interface TradeDef {
  direction: string;
  label: string;
  destinationType: "country" | "port";
  periods: {
    statsDataId: string;
    label: string;
    portDim: string;       // cat04 etc
    commodityDim: string;  // cat06 etc
    destDim: string;       // cat03 etc
    baseFilters: Record<string, string>;
  }[];
}

const TRADE_DEFS: TradeDef[] = [
  {
    direction: "export",
    label: "輸出品種別仕向国",
    destinationType: "country",
    periods: [
      {
        statsDataId: "0003131923",
        label: "2010-2019",
        portDim: "cat04",
        commodityDim: "cat06",
        destDim: "cat03",
        baseFilters: { cdTab: "120", cdCat01: "100" },
      },
      {
        statsDataId: "0004001881",
        label: "2020~",
        portDim: "cat04",
        commodityDim: "cat06",
        destDim: "cat03",
        baseFilters: { cdTab: "120", cdCat01: "100" },
      },
    ],
  },
  {
    direction: "import",
    label: "輸入品種別仕出国",
    destinationType: "country",
    periods: [
      {
        statsDataId: "0003131925",
        label: "2010-2019",
        portDim: "cat04",
        commodityDim: "cat06",
        destDim: "cat03",
        baseFilters: { cdTab: "120", cdCat01: "100" },
      },
      {
        statsDataId: "0004001900",
        label: "2020~",
        portDim: "cat04",
        commodityDim: "cat06",
        destDim: "cat03",
        baseFilters: { cdTab: "120", cdCat01: "100" },
      },
    ],
  },
  {
    direction: "coastal_out",
    label: "移出品種別仕向港",
    destinationType: "port",
    periods: [
      {
        statsDataId: "0003131089",
        label: "2010-2019",
        portDim: "cat04",
        commodityDim: "cat03",
        destDim: "cat01",
        baseFilters: { cdTab: "120", cdCat02: "100" },
      },
      {
        statsDataId: "0004001901",
        label: "2020~",
        portDim: "cat04",
        commodityDim: "cat03",
        destDim: "cat01",
        baseFilters: { cdTab: "120", cdCat02: "100", cdCat05: "100" },
      },
    ],
  },
  {
    direction: "coastal_in",
    label: "移入品種別仕出港",
    destinationType: "port",
    periods: [
      {
        statsDataId: "0003131051",
        label: "2010-2019",
        portDim: "cat04",
        commodityDim: "cat03",
        destDim: "cat01",
        baseFilters: { cdTab: "120", cdCat02: "100" },
      },
      {
        statsDataId: "0004001902",
        label: "2020~",
        portDim: "cat04",
        commodityDim: "cat03",
        destDim: "cat01",
        baseFilters: { cdTab: "120", cdCat02: "100", cdCat05: "100" },
      },
    ],
  },
];

// CLI 引数
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const dirFilter =
  args.find((a) => a.startsWith("--direction="))?.split("=")[1] ??
  (args.indexOf("--direction") >= 0
    ? args[args.indexOf("--direction") + 1]
    : null);

let targets = TRADE_DEFS;
if (dirFilter) {
  targets = targets.filter((d) => d.direction === dirFilter);
  if (targets.length === 0) {
    console.error(`Direction "${dirFilter}" not found`);
    process.exit(1);
  }
}

// DB
const dbPath = LOCAL_DB_PATHS.STATIC.getPath();
const db = new Database(dbPath);
console.log(`DB: ${dbPath}`);
console.log(`対象: ${targets.map((t) => t.direction).join(", ")}`);
if (isDryRun) console.log("【DRY RUN】");

// Known ports
const knownPorts = new Set(
  db
    .prepare("SELECT port_code FROM ports")
    .all()
    .map((r: any) => r.port_code as string)
);

const upsertStmt = db.prepare(`
  INSERT INTO port_trade_detail
    (port_code, year, direction, commodity_code, commodity_name,
     destination_code, destination_name, destination_type, value, unit)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'トン')
  ON CONFLICT(port_code, year, direction, commodity_code, destination_code) DO UPDATE SET
    commodity_name = excluded.commodity_name,
    destination_name = excluded.destination_name,
    value = excluded.value,
    updated_at = CURRENT_TIMESTAMP
`);

/** e-Stat メタデータ取得 */
async function fetchMetaInfo(
  statsDataId: string
): Promise<Map<string, Map<string, string>>> {
  const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo?appId=${API_KEY}&statsDataId=${statsDataId}&lang=J`;
  const res = await fetch(url);
  const json = await res.json();
  const classObj =
    json.GET_META_INFO?.METADATA_INF?.CLASS_INF?.CLASS_OBJ || [];
  const result = new Map<string, Map<string, string>>();
  for (const obj of Array.isArray(classObj) ? classObj : [classObj]) {
    const id = obj["@id"];
    const map = new Map<string, string>();
    const classes = Array.isArray(obj.CLASS) ? obj.CLASS : [obj.CLASS];
    for (const c of classes) {
      map.set(c["@code"], c["@name"]);
    }
    result.set(id, map);
  }
  return result;
}

/** e-Stat API からページネーション付きでデータ取得 */
async function fetchAllPages(
  statsDataId: string,
  filters: Record<string, string>
): Promise<any[]> {
  const allRows: any[] = [];
  let startPosition = 1;

  while (true) {
    const params = new URLSearchParams({
      appId: API_KEY!,
      statsDataId,
      lang: "J",
      metaGetFlg: "N",
      cntGetFlg: "N",
      limit: String(API_LIMIT),
      startPosition: String(startPosition),
      ...filters,
    });
    const url = `${BASE_URL}?${params}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    const status = json.GET_STATS_DATA?.RESULT?.STATUS;
    if (status === 1) break; // no more data
    if (status !== 0) {
      throw new Error(`API error: ${json.GET_STATS_DATA?.RESULT?.ERROR_MSG}`);
    }

    const values = json.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE;
    const rows = Array.isArray(values) ? values : values ? [values] : [];
    allRows.push(...rows);

    if (rows.length < API_LIMIT) break;
    startPosition += API_LIMIT;
    console.log(`    ページネーション: ${allRows.length} 件取得済み...`);
  }

  return allRows;
}

function isIndividualPort(code: string): boolean {
  return /^\d{5}$/.test(code) && !code.endsWith("000") && !code.startsWith("00");
}

async function processDirection(tradeDef: TradeDef): Promise<number> {
  console.log(`\n=== ${tradeDef.direction}: ${tradeDef.label} ===`);
  let totalInserted = 0;

  for (const period of tradeDef.periods) {
    console.log(`\n  --- ${period.label} (${period.statsDataId}) ---`);

    // メタデータ取得（品種名・国名の変換用）
    const meta = await fetchMetaInfo(period.statsDataId);
    const commodityNames = meta.get(period.commodityDim) || new Map();
    const destNames = meta.get(period.destDim) || new Map();
    console.log(
      `  メタ: 品種 ${commodityNames.size}, 相手先 ${destNames.size}`
    );

    // データ取得
    const rawData = await fetchAllPages(
      period.statsDataId,
      period.baseFilters
    );
    console.log(`  API: ${rawData.length} 件`);

    // フィルタ & 投入
    let inserted = 0;
    const txn = db.transaction(() => {
      for (const row of rawData) {
        const portCode = row[`@${period.portDim}`];
        const commodityCode = row[`@${period.commodityDim}`];
        const destCode = row[`@${period.destDim}`];
        const timeCode = row["@time"];
        const value = parseFloat(row["$"]);

        if (
          !portCode || !commodityCode || !destCode || !timeCode || isNaN(value)
        )
          continue;
        if (!isIndividualPort(portCode)) continue;
        if (!knownPorts.has(portCode)) continue;
        // 合計行を除外
        if (commodityCode === "00001" || destCode === "100") continue;
        // 値が 0 のものは除外（疎行列の最適化）
        if (value === 0) continue;

        const year = timeCode.substring(0, 4);
        const commodityName =
          commodityNames.get(commodityCode)?.replace(/^\d+\s*/, "") || null;
        const destName = destNames.get(destCode) || null;

        if (!isDryRun) {
          upsertStmt.run(
            portCode,
            year,
            tradeDef.direction,
            commodityCode,
            commodityName,
            destCode,
            destName,
            tradeDef.destinationType,
            value
          );
        }
        inserted++;
      }
    });
    txn();
    console.log(
      `  ${isDryRun ? "[DRY RUN] " : ""}投入: ${inserted} 件`
    );
    totalInserted += inserted;
  }

  return totalInserted;
}

async function main() {
  let grandTotal = 0;

  for (const tradeDef of targets) {
    try {
      const count = await processDirection(tradeDef);
      grandTotal += count;
    } catch (error) {
      console.error(
        `  ERROR (${tradeDef.direction}):`,
        error instanceof Error ? error.message : error
      );
    }
  }

  const totalRows = db
    .prepare("SELECT COUNT(*) as c FROM port_trade_detail")
    .get() as any;
  const byDir = db
    .prepare(
      "SELECT direction, COUNT(*) as c FROM port_trade_detail GROUP BY direction"
    )
    .all() as any[];

  console.log(`\n=== 完了 ===`);
  console.log(`投入合計: ${grandTotal} 件`);
  console.log(`port_trade_detail 総行数: ${totalRows.c}`);
  console.log(`方向別:`);
  for (const d of byDir) {
    console.log(`  ${d.direction}: ${d.c}`);
  }

  db.close();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
