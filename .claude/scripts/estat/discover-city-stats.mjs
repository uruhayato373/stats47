#!/usr/bin/env node
/**
 * e-Stat 市区町村レベル統計表の Discovery
 *
 * collectArea=3 で getStatsList を paging 全取得し、
 * estat_metainfo に area_type='city' status='candidate' で INSERT OR IGNORE する。
 *
 * 既存 22 件 registered は status=registered のまま保護される (OR IGNORE)。
 *
 * Usage:
 *   node .claude/scripts/estat/discover-city-stats.mjs [--dry-run] [--limit N]
 *
 * --dry-run  : DB に書かず取得件数だけ表示
 * --limit N  : 最初の N 件で停止 (default: 全件)
 */

import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ProxyAgent } from "undici";
import BetterSqlite3 from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(__filename), "..", "..", "..");

config({ path: path.join(PROJECT_ROOT, ".env.local") });

const APP_ID = process.env.NEXT_PUBLIC_ESTAT_APP_ID;
if (!APP_ID) {
  console.error("❌ NEXT_PUBLIC_ESTAT_APP_ID が .env.local に未設定");
  process.exit(1);
}

const DB_PATH = path.join(
  PROJECT_ROOT,
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite"
);

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const limitIdx = args.indexOf("--limit");
const HARD_LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1] ?? "0", 10) : 0;

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const fetchOpts = proxyUrl ? { dispatcher: new ProxyAgent(proxyUrl) } : {};

const BASE_URL = "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList";
const BATCH_SIZE = 10000; // e-Stat API の limit 上限は 100000、安全のため 10000 でページング
const DELAY_MS = 200;

async function fetchPage(startPosition) {
  const params = new URLSearchParams({
    appId: APP_ID,
    lang: "J",
    collectArea: "3",
    limit: String(BATCH_SIZE),
    startPosition: String(startPosition),
  });
  const url = `${BASE_URL}?${params.toString()}`;
  const res = await fetch(url, fetchOpts);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  const json = await res.json();
  const datalist = json?.GET_STATS_LIST?.DATALIST_INF;
  if (!datalist) {
    const errMsg = json?.GET_STATS_LIST?.RESULT?.ERROR_MSG;
    if (errMsg && /該当するデータが存在しません|該当データはありませんでした/.test(errMsg)) {
      return { tables: [], total: 0, nextKey: null };
    }
    throw new Error(`unexpected response: ${JSON.stringify(json).slice(0, 200)}`);
  }
  const tables = datalist.TABLE_INF
    ? Array.isArray(datalist.TABLE_INF)
      ? datalist.TABLE_INF
      : [datalist.TABLE_INF]
    : [];
  return {
    tables,
    total: datalist.NUMBER,
    nextKey: datalist.RESULT_INF?.NEXT_KEY ?? null,
  };
}

function pickString(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "$" in value) return String(value.$);
  return null;
}

/** TABLE_INF → estat_metainfo row */
function mapTableInf(t) {
  const stats_data_id = String(t["@id"]);
  const stat_name = pickString(t.STAT_NAME) ?? "";
  const title = pickString(t.TITLE) ?? pickString(t.STATISTICS_NAME) ?? "";
  const gov_org = pickString(t.GOV_ORG) ?? null;
  const stats_field = pickString(t.STATISTICS_NAME) ? null : null; // 後段で metainfo から導出
  const cycle = pickString(t.CYCLE) ?? null;
  const survey_date = pickString(t.SURVEY_DATE) ?? null;
  const updated_date = pickString(t.UPDATED_DATE) ?? null;
  return {
    stats_data_id,
    stat_name,
    title,
    gov_org,
    stats_field,
    cycle,
    survey_date,
    updated_date,
  };
}

async function main() {
  console.log(`📡 e-Stat 市区町村 discovery (collectArea=3)`);
  console.log(`   mode: ${DRY_RUN ? "DRY RUN" : "WRITE"}`);
  console.log(`   DB: ${DB_PATH}`);
  console.log("");

  const db = DRY_RUN ? null : new BetterSqlite3(DB_PATH);
  const insertStmt = db
    ? db.prepare(`
        INSERT OR IGNORE INTO estat_metainfo
          (stats_data_id, stat_name, title, area_type, gov_org, stats_field,
           cycle, survey_date, updated_date, status, is_active, created_at, updated_at)
        VALUES
          (@stats_data_id, @stat_name, @title, 'city', @gov_org, @stats_field,
           @cycle, @survey_date, @updated_date, 'candidate', 1, datetime('now'), datetime('now'))
      `)
    : null;

  let startPosition = 1;
  let total = 0;
  let collected = 0;
  let inserted = 0;
  let ignored = 0;
  let pageNum = 0;

  while (true) {
    pageNum++;
    const start = Date.now();
    const { tables, total: t, nextKey } = await fetchPage(startPosition);
    total = t;
    const elapsed = Date.now() - start;
    console.log(
      `  page ${pageNum}: startPos=${startPosition} got=${tables.length} total=${total} (${elapsed}ms)`
    );

    if (tables.length === 0) break;

    if (db) {
      const tx = db.transaction((rows) => {
        for (const t of rows) {
          const row = mapTableInf(t);
          const r = insertStmt.run(row);
          if (r.changes > 0) inserted++;
          else ignored++;
        }
      });
      tx(tables);
    } else {
      // dry-run: 件数集計のみ
      collected += tables.length;
    }

    collected = (collected || 0) + (db ? tables.length : 0);

    if (HARD_LIMIT > 0 && (inserted + ignored) >= HARD_LIMIT) {
      console.log(`  ⚠️ HARD_LIMIT ${HARD_LIMIT} 到達、停止`);
      break;
    }
    if (!nextKey) break;
    startPosition = nextKey;
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  console.log("");
  console.log("━━━ 結果 ━━━");
  console.log(`  e-Stat 総件数 (TOTAL_NUMBER): ${total}`);
  console.log(`  取得済み: ${collected}`);
  if (db) {
    console.log(`  INSERT 成功 (新規 candidate): ${inserted}`);
    console.log(`  IGNORE (既存 registered/candidate): ${ignored}`);
  } else {
    console.log(`  (dry-run: DB 書き込みなし)`);
  }

  if (db) db.close();
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
