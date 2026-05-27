/**
 * e-Stat 0003423613 (住民基本台帳人口移動報告) を D1 stats_migration_flow に投入。
 *
 * 使い方:
 *   tsx packages/database/scripts/ingest-migration-flow.ts        # 2020-2025 全年
 *   tsx packages/database/scripts/ingest-migration-flow.ts 2025   # 単年
 *   tsx packages/database/scripts/ingest-migration-flow.ts 2020-2025
 *
 * 前提:
 *   - sources に id="estat:0003423613" を登録 (本スクリプトが自動で UPSERT)
 *   - metrics に key="population-migration-inter-prefecture" を登録 (本スクリプトが自動で UPSERT)
 *   - prefectures テーブルに 47 都道府県 (code 5-digit) が揃っている
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");
const D1_PATH = resolve(
  REPO_ROOT,
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite",
);

const STATS_DATA_ID = "0003423613";
const METRIC_KEY = "population-migration-inter-prefecture";
const SOURCE_ID = `estat:${STATS_DATA_ID}`;

function parseYearArg(arg: string | undefined): number[] {
  if (!arg) return [2020, 2021, 2022, 2023, 2024, 2025];
  if (arg.includes("-")) {
    const [a, b] = arg.split("-").map(Number);
    const out: number[] = [];
    for (let y = a; y <= b; y++) out.push(y);
    return out;
  }
  return [Number(arg)];
}

function readAppId(): string {
  const envPath = resolve(REPO_ROOT, ".env.local");
  const line = readFileSync(envPath, "utf8")
    .split("\n")
    .find((l) => l.startsWith("NEXT_PUBLIC_ESTAT_APP_ID="));
  const id = line?.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");
  if (!id) throw new Error("NEXT_PUBLIC_ESTAT_APP_ID が .env.local に見つかりません");
  return id;
}

function isPrefCode(code: string): boolean {
  if (!/^\d{2}000$/.test(code)) return false;
  const n = Number(code.slice(0, 2));
  return n >= 1 && n <= 47;
}

interface EstatValue {
  "@cat01": string;
  "@area": string;
  "@time": string;
  $: string;
}

async function fetchYear(appId: string, year: number): Promise<EstatValue[]> {
  const url =
    `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData` +
    `?appId=${appId}&statsDataId=${STATS_DATA_ID}` +
    `&cdCat02=0` +
    `&cdTimeFrom=${year}000101&cdTimeTo=${year}001212` +
    `&limit=100000`;
  const res = await fetch(url);
  const json = (await res.json()) as Record<string, unknown>;
  const stat = (json.GET_STATS_DATA as Record<string, unknown> | undefined)
    ?.STATISTICAL_DATA as Record<string, unknown> | undefined;
  if (!stat) {
    throw new Error(
      `e-Stat ${year}: 応答不正 ${JSON.stringify(json).slice(0, 300)}`,
    );
  }
  return ((stat.DATA_INF as Record<string, unknown>).VALUE as EstatValue[]) ?? [];
}

interface PairCounts {
  fromCode: string;
  toCode: string;
  yearCode: string;
  count: number;
}

function aggregateByPair(values: EstatValue[], year: number): PairCounts[] {
  // (from, to) 単位で合計 (月別データがある場合に備えて合算)
  const m = new Map<string, number>();
  for (const v of values) {
    const from = v["@cat01"];
    const to = v["@area"];
    if (!isPrefCode(from) || !isPrefCode(to)) continue;
    if (from === to) continue;
    const n = Number(v.$);
    if (!Number.isFinite(n)) continue;
    const key = `${from}|${to}`;
    m.set(key, (m.get(key) ?? 0) + n);
  }
  const yearCode = String(year);
  const out: PairCounts[] = [];
  for (const [key, n] of m) {
    const [fromCode, toCode] = key.split("|");
    out.push({ fromCode, toCode, yearCode, count: n });
  }
  return out;
}

function ensureSourceAndMetric(db: Database.Database): void {
  // estat platform source
  db.prepare(
    `INSERT OR IGNORE INTO sources (id, source_kind, name, organization, url)
     VALUES ('estat', 'platform', 'e-Stat', '総務省統計局', 'https://www.e-stat.go.jp/')`,
  ).run();

  // estat_table source for 0003423613
  db.prepare(
    `INSERT INTO sources (id, source_kind, external_id, parent_source_id, name, url)
     VALUES (?, 'estat_table', ?, 'estat', ?, ?)
     ON CONFLICT(id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP`,
  ).run(
    SOURCE_ID,
    STATS_DATA_ID,
    "住民基本台帳人口移動報告 (都道府県間移動)",
    `https://www.e-stat.go.jp/dbview?sid=${STATS_DATA_ID}`,
  );

  // metric
  db.prepare(
    `INSERT INTO metrics (
       key, title, subtitle, description, unit, source_id, category_key,
       source_config_json, value_display_config_json, visualization_config_json,
       calculation_config_json, year_format, is_active, is_featured
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET updated_at = CURRENT_TIMESTAMP`,
  ).run(
    METRIC_KEY,
    "都道府県間人口移動 (転入・転出)",
    "住民基本台帳人口移動報告",
    "47 都道府県 × 47 都道府県のペア観測。inflow = partner→focus、outflow = focus→partner、net = inflow - outflow。",
    "人",
    SOURCE_ID,
    "population", // category
    JSON.stringify({ statsDataId: STATS_DATA_ID, cdCat02: "0" }),
    JSON.stringify({ conversionFactor: 1, decimalPlaces: 0 }),
    JSON.stringify({
      preset: "migration-flow",
      colorScheme: "interpolateRdBu",
      colorSchemeType: "diverging",
    }),
    JSON.stringify({ isCalculated: false, isPairRelationship: true }),
    "calendar",
    1,
    0,
  );
}

async function main() {
  const years = parseYearArg(process.argv[2]);
  console.log(`[ingest-migration-flow] target years: ${years.join(", ")}`);

  const appId = readAppId();
  const db = new Database(D1_PATH);
  db.pragma("foreign_keys = ON");

  ensureSourceAndMetric(db);
  console.log("[ingest] source + metric ready");

  const upsert = db.prepare(
    `INSERT INTO stats_migration_flow
       (metric_key, from_pref_code, to_pref_code, year_code, inflow, outflow, net)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(metric_key, from_pref_code, to_pref_code, year_code)
       DO UPDATE SET inflow=excluded.inflow, outflow=excluded.outflow, net=excluded.net`,
  );

  for (const year of years) {
    console.log(`\n[ingest] year=${year} fetch...`);
    const values = await fetchYear(appId, year);
    console.log(`  raw VALUE records: ${values.length}`);

    const pairs = aggregateByPair(values, year);
    // for stats_migration_flow we need 47×46 oriented rows per focus
    // Plan: for each ordered pair (A, B), we record one row where
    //   from_pref = A (= 移動前住所地, "cat01" in e-Stat),
    //   to_pref   = B (= 移動先地域,  "area"  in e-Stat),
    //   inflow    = count where partner→focus
    //   outflow   = count where focus→partner
    //
    // ここでは "focus" の概念を捨て、純粋に有向ペアとして格納する:
    //   row(from=A, to=B): inflow=A→B 件数, outflow=B→A 件数, net=inflow-outflow
    //
    // 動画用には focus 視点で再構成する (exporter 側で行う)
    const cntByPair = new Map<string, number>();
    for (const p of pairs) cntByPair.set(`${p.fromCode}|${p.toCode}`, p.count);

    const tx = db.transaction((rows: typeof pairs) => {
      for (const p of rows) {
        const reverse = cntByPair.get(`${p.toCode}|${p.fromCode}`) ?? 0;
        const inflow = p.count; // from A → to B
        const outflow = reverse; // from B → to A
        const net = inflow - outflow;
        upsert.run(
          METRIC_KEY,
          p.fromCode,
          p.toCode,
          String(year),
          inflow,
          outflow,
          net,
        );
      }
    });
    tx(pairs);
    console.log(`  inserted/updated ${pairs.length} rows`);
  }

  const total = db
    .prepare(`SELECT COUNT(*) AS c FROM stats_migration_flow WHERE metric_key = ?`)
    .get(METRIC_KEY) as { c: number };
  console.log(`\n[done] stats_migration_flow total rows: ${total.c}`);

  // sanity: 兵庫県 (28000) を focus にして純移動 top5 確認
  const hyogoNet = db
    .prepare(
      `SELECT from_pref_code, inflow, outflow, net
       FROM stats_migration_flow
       WHERE metric_key = ? AND to_pref_code = '28000' AND year_code = '2025'
       ORDER BY net DESC LIMIT 5`,
    )
    .all(METRIC_KEY);
  if (hyogoNet.length > 0) {
    console.log("\n[verify] 兵庫県 2025 流入超過 top5:");
    for (const r of hyogoNet as Array<{
      from_pref_code: string;
      inflow: number;
      outflow: number;
      net: number;
    }>) {
      console.log(
        `  ${r.from_pref_code} → 兵庫: 流入 ${r.inflow} / 流出 ${r.outflow} / 純 ${r.net}`,
      );
    }
  }
  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
