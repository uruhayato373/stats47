/**
 * SSDS 市区町村データ一括取得スクリプト
 *
 * 市区町村テーブル(0000020201-0000020211, 0000020301-0000020311)の
 * 全 cat01 コードを取得し、対応する metric があれば stats_city に登録する。
 *
 * Usage:
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     packages/database/scripts/populate-ssds-city-stats.ts
 *
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     packages/database/scripts/populate-ssds-city-stats.ts --dry-run
 *
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     packages/database/scripts/populate-ssds-city-stats.ts --table 0000020201
 */

import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_PATH = path.resolve(
  __dirname,
  "../../../.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite",
);
const API_KEY = process.env.NEXT_PUBLIC_ESTAT_APP_ID;
if (!API_KEY) {
  console.error("NEXT_PUBLIC_ESTAT_APP_ID が未設定です");
  process.exit(1);
}

const META_URL = "https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo";
const DATA_URL = "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData";
const DELAY_MS = 1200;

// 市区町村テーブル → 都道府県テーブル の逆変換
// 基礎: 00000202XX → 00000101XX
// 指標: 00000203XX → 00000102XX
function toPrefStatsDataId(cityTableId: string): string | null {
  if (!cityTableId.startsWith("000002")) return null;
  const mid = cityTableId.slice(6, 10);
  const cityGroup = parseInt(mid.slice(0, 2));
  const seriesId = mid.slice(2, 4);
  const prefGroup = (cityGroup - 1).toString().padStart(2, "0");
  return `000001${prefGroup}${seriesId}`;
}

// 処理対象テーブル
const CITY_TABLES: string[] = [];
for (let i = 1; i <= 11; i++) {
  const pad = i.toString().padStart(2, "0");
  CITY_TABLES.push(`00000202${pad}`);
  CITY_TABLES.push(`00000203${pad}`);
}

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const tableFilter = args.find((a) => a.startsWith("--table="))?.split("=")[1]
  ?? (args.indexOf("--table") >= 0 ? args[args.indexOf("--table") + 1] : null);

const targetTables = tableFilter ? CITY_TABLES.filter((t) => t === tableFilter) : CITY_TABLES;
if (tableFilter && targetTables.length === 0) {
  console.error(`テーブル "${tableFilter}" は対象外です`);
  process.exit(1);
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function proxyFetch(url: string): Promise<Response> {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (proxyUrl) {
    try {
      const { ProxyAgent } = await import("undici");
      const dispatcher = new ProxyAgent(proxyUrl);
      return fetch(url, { dispatcher } as RequestInit & { dispatcher: unknown });
    } catch { /* fallthrough */ }
  }
  return fetch(url);
}

interface Cat01Item { code: string; name: string; unit: string }

interface EstatValue {
  "@area": string; "@time": string; "@cat01": string;
  $: string; "@unit"?: string;
}

interface EstatClassObj {
  "@id": string; "@name": string;
  CLASS: { "@code": string; "@name": string; "@unit"?: string }
        | { "@code": string; "@name": string; "@unit"?: string }[];
}

async function fetchTableMeta(statsDataId: string): Promise<Cat01Item[]> {
  const url = `${META_URL}?appId=${API_KEY}&lang=J&statsDataId=${statsDataId}`;
  const res = await proxyFetch(url);
  const json = await res.json() as {
    GET_META_INFO?: { METADATA_INF?: { CLASS_INF?: { CLASS_OBJ: EstatClassObj | EstatClassObj[] } } };
  };
  const objs: EstatClassObj[] = [].concat(
    json.GET_META_INFO?.METADATA_INF?.CLASS_INF?.CLASS_OBJ ?? [],
  );
  const co = objs.find((o) => o["@id"] === "cat01");
  if (!co) return [];
  const classes = Array.isArray(co.CLASS) ? co.CLASS : [co.CLASS];
  return classes.map((c) => ({ code: c["@code"], name: c["@name"], unit: c["@unit"] ?? "" }));
}

async function fetchCityData(
  statsDataId: string,
  cdCat01: string,
): Promise<{ areaMap: Map<string, string>; values: EstatValue[]; unit: string; latestYear: string } | null> {
  const params = new URLSearchParams({ appId: API_KEY!, lang: "J", statsDataId, cdCat01, limit: "100000" });
  try {
    const res = await proxyFetch(`${DATA_URL}?${params}`);
    const json = await res.json() as {
      GET_STATS_DATA?: {
        RESULT?: { STATUS: number; ERROR_MSG?: string };
        STATISTICAL_DATA?: {
          CLASS_INF?: { CLASS_OBJ: EstatClassObj | EstatClassObj[] };
          DATA_INF?: { VALUE: EstatValue | EstatValue[] };
        };
      };
    };
    if (json.GET_STATS_DATA?.RESULT?.STATUS !== 0) return null;

    const statData = json.GET_STATS_DATA?.STATISTICAL_DATA;
    if (!statData) return null;

    const classObjs: EstatClassObj[] = [].concat(statData.CLASS_INF?.CLASS_OBJ ?? []);
    const rawValues: EstatValue[] = [].concat(statData.DATA_INF?.VALUE ?? []);
    if (rawValues.length === 0) return null;

    const areaMap = new Map<string, string>();
    for (const obj of classObjs) {
      if (obj["@id"] === "area") {
        const classes = Array.isArray(obj.CLASS) ? obj.CLASS : [obj.CLASS];
        for (const c of classes) areaMap.set(c["@code"], c["@name"]);
      }
    }

    let unit = "";
    for (const obj of classObjs) {
      if (obj["@id"] === "cat01") {
        const classes = Array.isArray(obj.CLASS) ? obj.CLASS : [obj.CLASS];
        const target = classes.find((c) => c["@code"] === cdCat01);
        if (target?.["@unit"]) unit = target["@unit"];
      }
    }

    const cityValues = rawValues.filter(
      (v) => /^\d{5}$/.test(v["@area"]) && !v["@area"].endsWith("000") && v["@area"] !== "00000",
    );
    if (cityValues.length === 0) return null;

    const times = [...new Set(cityValues.map((v) => v["@time"]))].sort().reverse();
    const latestYear = times[0].slice(0, 4);
    return { areaMap, values: cityValues, unit, latestYear };
  } catch (err) {
    console.warn(`    fetch error: ${err}`);
    return null;
  }
}

interface MetricRow { key: string; title: string; unit: string; year_format: string }

async function main() {
  const db = new Database(DB_PATH);

  const hasCityStats = new Set<string>(
    (db.prepare("SELECT DISTINCT metric_key FROM stats_city").all() as { metric_key: string }[])
      .map((r) => r.metric_key),
  );

  const upsertStats = db.prepare(`
    INSERT INTO stats_city
      (metric_key, area_code, area_name, prefecture_code, year_code, year_name, value, unit, rank, rank_pref)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(metric_key, area_code, year_code) DO UPDATE SET
      area_name       = excluded.area_name,
      prefecture_code = excluded.prefecture_code,
      year_name       = excluded.year_name,
      value           = excluded.value,
      unit            = excluded.unit,
      rank            = excluded.rank,
      rank_pref       = excluded.rank_pref
  `);

  const insertBatch = db.transaction(
    (rows: [string, string, string, string, string, string, number, string, number, number][]) => {
      for (const r of rows) upsertStats.run(...r);
    },
  );

  let totalSucceeded = 0;
  let totalSkipped = 0;

  for (const cityTableId of targetTables) {
    const prefTableId = toPrefStatsDataId(cityTableId)!;
    console.log(`\n=== ${cityTableId} (都道府県版: ${prefTableId}) ===`);

    const cat01List = await fetchTableMeta(cityTableId);
    console.log(`  cat01: ${cat01List.length}件`);
    if (cat01List.length === 0) { await delay(DELAY_MS); continue; }
    await delay(DELAY_MS);

    for (const cat01 of cat01List) {
      const metric = db.prepare(`
        SELECT key, title, unit, year_format FROM metrics
        WHERE is_active = 1
          AND json_extract(source_config_json, '$.statsDataId') = ?
          AND (
            json_extract(source_config_json, '$.cdCat01') = ?
            OR json_extract(source_config_json, '$.cdCat01') = ?
          )
        LIMIT 1
      `).get(prefTableId, cat01.code, `#${cat01.code}`) as MetricRow | undefined;

      if (!metric) {
        process.stdout.write(`    [${cat01.code}] metric なし → skip\n`);
        totalSkipped++;
        continue; // no API call → no delay needed
      }

      if (hasCityStats.has(metric.key)) {
        process.stdout.write(`    [${cat01.code}] ${metric.key} → 既取得 skip\n`);
        totalSkipped++;
        continue; // no API call → no delay needed
      }

      process.stdout.write(`    [${cat01.code}] ${metric.key}... `);

      if (isDryRun) {
        process.stdout.write(`[DRY RUN] ok\n`);
        totalSucceeded++;
        continue;
      }

      const data = await fetchCityData(cityTableId, cat01.code);
      await delay(DELAY_MS);

      if (!data || data.values.length === 0) {
        process.stdout.write(`skip (no data)\n`);
        totalSkipped++;
        continue;
      }

      const sorted = [...data.values]
        .filter((v) => v.$ !== "-" && v.$ !== "" && !isNaN(Number(v.$)))
        .map((v) => ({
          areaCode: v["@area"],
          areaName: data.areaMap.get(v["@area"]) ?? "",
          prefCode: v["@area"].slice(0, 2),
          value: Number(v.$),
          time: v["@time"],
        }))
        .filter((v) => v.time.startsWith(data.latestYear))
        .sort((a, b) => b.value - a.value);

      if (sorted.length === 0) {
        process.stdout.write(`skip (0 valid rows)\n`);
        totalSkipped++;
        continue;
      }

      // 全国ランク計算（同値同順位）
      const nationalRanked: typeof sorted & { rank: number }[] = [];
      let nRank = 1;
      let prevVal = NaN;
      let sameCount = 0;
      for (let j = 0; j < sorted.length; j++) {
        const d = sorted[j];
        if (d.value !== prevVal) {
          if (j > 0) nRank += sameCount + 1;
          sameCount = 0;
          prevVal = d.value;
        } else {
          sameCount++;
        }
        nationalRanked.push({ ...d, rank: nRank });
      }

      // 都道府県内ランク計算（prefecture_code でグループ化）
      const byPref = new Map<string, typeof nationalRanked>();
      for (const d of nationalRanked) {
        const arr = byPref.get(d.prefCode) ?? [];
        arr.push(d);
        byPref.set(d.prefCode, arr);
      }

      const rankPrefMap = new Map<string, number>();
      for (const [, prefRows] of byPref) {
        let pRank = 1;
        let pPrev = NaN;
        let pSame = 0;
        for (let j = 0; j < prefRows.length; j++) {
          const d = prefRows[j];
          if (d.value !== pPrev) {
            if (j > 0) pRank += pSame + 1;
            pSame = 0;
            pPrev = d.value;
          } else {
            pSame++;
          }
          rankPrefMap.set(d.areaCode, pRank);
        }
      }

      const yearName = metric.year_format === "fiscal"
        ? `${data.latestYear}年度`
        : `${data.latestYear}年`;

      const rows: [string, string, string, string, string, string, number, string, number, number][] =
        nationalRanked.map((d) => [
          metric.key,
          d.areaCode,
          d.areaName,
          d.prefCode,
          data.latestYear,
          yearName,
          d.value,
          data.unit || cat01.unit || metric.unit,
          d.rank,
          rankPrefMap.get(d.areaCode) ?? 1,
        ]);

      insertBatch(rows);
      hasCityStats.add(metric.key);
      process.stdout.write(`ok (${rows.length} cities, year=${data.latestYear})\n`);
      totalSucceeded++;
    }
  }

  const finalCity = (
    db.prepare("SELECT COUNT(*) as c FROM stats_city").get() as { c: number }
  ).c;

  console.log(`\n✅ 完了: 成功=${totalSucceeded}, スキップ=${totalSkipped}`);
  console.log(`   stats_city 合計: ${finalCity.toLocaleString()} 行`);
  db.close();
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
