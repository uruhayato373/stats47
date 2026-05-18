#!/usr/bin/env node
// 1 つ以上の e-Stat candidate を recipe (query/prefSource) ベースで取得・登録する。
// SKILL.md (.claude/skills/management/expand-indicators/SKILL.md) から呼ばれる。
//
// Usage:
//   node ingest-indicator.mjs --recipes <file.json> [--slugs slug1,slug2] [--dry-run] [--sleep-ms 7000]
//
// Recipe JSON 形式:
//   [
//     {
//       "slug": "convenience-store-sales-monthly",
//       "statsDataId": "0004032502",
//       "categoryKey": "commercial",
//       "title": "コンビニエンスストア販売額（都道府県別・年計）",
//       "unit": "百万円",
//       "yearCode": "2024",
//       "yearName": "2024年",
//       "query": { "cdCat01": "0101300", "cdCat02": "01040100", "cdCat03": "01030100", "cdTime": "2024000000" },
//       "prefSource": "area" | "cat02-pseudo" | "cat03-pseudo",
//       "allowOldYear": false
//     }
//   ]
//
// 出力: stdout に結果 JSON (配列) を 1 ブロック書き出す。

import { config } from "dotenv";
import path from "path";
import fs from "fs";
import { ProxyAgent } from "undici";
import BetterSqlite3 from "better-sqlite3";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../..");
config({ path: path.resolve(PROJECT_ROOT, ".env.local") });

const APP_ID = process.env.NEXT_PUBLIC_ESTAT_APP_ID;
if (!APP_ID) {
  console.error("NEXT_PUBLIC_ESTAT_APP_ID is not set in .env.local");
  process.exit(1);
}

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const fetchOpts = proxyUrl ? { dispatcher: new ProxyAgent(proxyUrl) } : {};

const D1_PATH = path.join(
  PROJECT_ROOT,
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite",
);

const MAX_YEAR_AGE = 5;
const NOW_YEAR = new Date().getFullYear();

const PREF_NAMES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県",
  "静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県",
  "奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県",
  "熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

function pseudoCodeToAreaCode(code) {
  const n = parseInt(code, 10);
  if (isNaN(n) || n < 2 || n > 48) return null;
  return String(n - 1).padStart(2, "0") + "000";
}

function parseArgs(argv) {
  const args = { recipes: null, slugs: null, dryRun: false, sleepMs: 7000 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--recipes") args.recipes = argv[++i];
    else if (a === "--slugs") args.slugs = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--sleep-ms") args.sleepMs = parseInt(argv[++i], 10);
  }
  if (!args.recipes) {
    console.error("--recipes <file.json> is required");
    process.exit(1);
  }
  return args;
}

async function fetchData(params) {
  const sp = new URLSearchParams({ appId: APP_ID, lang: "J", ...params });
  const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?${sp}`;
  const res = await fetch(url, fetchOpts);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const status = json.GET_STATS_DATA?.RESULT?.STATUS;
  if (status !== 0) {
    throw new Error(`API STATUS=${status}: ${json.GET_STATS_DATA?.RESULT?.ERROR_MSG}`);
  }
  return json.GET_STATS_DATA?.STATISTICAL_DATA;
}

async function getAreaMap(statsDataId) {
  const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo?appId=${APP_ID}&lang=J&statsDataId=${statsDataId}`;
  const r = await fetch(url, fetchOpts);
  const j = await r.json();
  const co = [].concat(j.GET_META_INFO?.METADATA_INF?.CLASS_INF?.CLASS_OBJ || []);
  const area = co.find((o) => o["@id"] === "area");
  const m = new Map();
  if (!area) return m;
  for (const c of [].concat(area.CLASS || [])) m.set(c["@code"], c["@name"]);
  return m;
}

// 47 都道府県のみマッチ (大海区 48000-74000 や複合コード「青森県(太平洋北区)」等を除外)
const PREF_AREA_RE = /^(0[1-9]|[1-3]\d|4[0-7])000$/;

function pickPrefByArea(values, areaMap) {
  const arr = [].concat(values || []);
  const out = arr
    .filter((v) => PREF_AREA_RE.test(v["@area"]))
    .map((v) => ({
      areaCode: v["@area"],
      areaName: areaMap.get(v["@area"]) || "",
      value: Number(v.$),
      unit: v["@unit"] || "",
    }))
    .filter((v) => !isNaN(v.value));
  const m = new Map();
  for (const r of out) if (!m.has(r.areaCode)) m.set(r.areaCode, r);
  return [...m.values()];
}

function pickPrefByPseudoCat(values, catKey) {
  const arr = [].concat(values || []);
  const out = arr
    .map((v) => {
      const code = v[`@${catKey}`];
      const areaCode = pseudoCodeToAreaCode(code);
      if (!areaCode) return null;
      const idx = parseInt(code, 10) - 2;
      return {
        areaCode,
        areaName: PREF_NAMES[idx] || "",
        value: Number(v.$),
        unit: v["@unit"] || "",
      };
    })
    .filter((v) => v && !isNaN(v.value));
  const m = new Map();
  for (const r of out) if (!m.has(r.areaCode)) m.set(r.areaCode, r);
  return [...m.values()];
}

function rankAndSort(prefs) {
  prefs.sort((a, b) => b.value - a.value);
  let rank = 1;
  for (let i = 0; i < prefs.length; i++) {
    if (i > 0 && prefs[i].value !== prefs[i - 1].value) rank = i + 1;
    prefs[i].rank = rank;
  }
  return prefs;
}

async function processCandidate(cand, db, opts) {
  const result = {
    slug: cand.slug,
    statsDataId: cand.statsDataId,
    status: "failed",
    rows: 0,
    latestYear: Number(cand.yearCode),
    reason: "",
  };
  try {
    if (!cand.allowOldYear && NOW_YEAR - Number(cand.yearCode) > MAX_YEAR_AGE) {
      result.reason = `latest_year ${cand.yearCode} > ${MAX_YEAR_AGE}y old`;
      return result;
    }

    const existing = db.prepare("SELECT key FROM metrics WHERE key = ?").get(cand.slug);
    if (existing) {
      const cnt = db.prepare("SELECT COUNT(*) AS n FROM stats_prefecture WHERE metric_key = ?").get(cand.slug);
      if (cnt.n >= 47) {
        result.status = "skipped";
        result.rows = cnt.n;
        result.reason = "already registered";
        return result;
      }
    }

    if (opts.dryRun) {
      result.status = "dry-run";
      result.reason = "would fetch + insert";
      return result;
    }

    const params = { statsDataId: cand.statsDataId, ...cand.query, limit: "10000" };
    const statData = await fetchData(params);
    if (!statData) {
      result.reason = "no STATISTICAL_DATA";
      return result;
    }

    let prefs;
    if (cand.prefSource === "area") {
      const areaMap = await getAreaMap(cand.statsDataId);
      prefs = pickPrefByArea(statData.DATA_INF?.VALUE, areaMap);
    } else if (cand.prefSource === "cat02-pseudo") {
      prefs = pickPrefByPseudoCat(statData.DATA_INF?.VALUE, "cat02");
    } else if (cand.prefSource === "cat03-pseudo") {
      prefs = pickPrefByPseudoCat(statData.DATA_INF?.VALUE, "cat03");
    } else {
      result.reason = `unknown prefSource: ${cand.prefSource}`;
      return result;
    }

    if (!prefs || prefs.length < 47) {
      result.rows = prefs?.length || 0;
      result.reason = `only ${result.rows} prefectures`;
      const dumpDir = "/tmp/expand-indicators";
      fs.mkdirSync(dumpDir, { recursive: true });
      fs.writeFileSync(
        `${dumpDir}/${cand.slug}.debug.json`,
        JSON.stringify({ slug: cand.slug, params, prefs: prefs?.slice(0, 5) }, null, 2),
      );
      return result;
    }

    prefs = rankAndSort(prefs);
    const recordedUnit = prefs[0].unit || cand.unit;

    const sourceId = `estat:${cand.statsDataId}`;
    const srcExists = db.prepare("SELECT id FROM sources WHERE id = ?").get(sourceId);
    if (!srcExists) {
      db.prepare(
        `INSERT INTO sources (id, source_kind, external_id, name, organization, url, is_active, created_at, updated_at)
         VALUES (?, 'estat_table', ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      ).run(sourceId, cand.statsDataId, cand.title, "総務省統計局", `https://www.e-stat.go.jp/dbview?sid=${cand.statsDataId}`);
    }

    const visConfig = JSON.stringify({ colorScheme: "interpolateBlues", colorSchemeType: "sequential", minValueType: "zero" });
    const sourceConfig = JSON.stringify({
      source: { name: cand.title, url: `https://www.e-stat.go.jp/dbview?sid=${cand.statsDataId}` },
      statsDataId: cand.statsDataId,
      ...cand.query,
    });
    const valueDisplayConfig = JSON.stringify({ conversionFactor: 1, decimalPlaces: 1 });

    db.prepare(
      `INSERT INTO metrics (
        key, title, unit, source_id, category_key,
        visualization_config_json, source_config_json, value_display_config_json,
        is_active, year_format, year_code, tags, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'fiscal', ?, '[]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET
        title = excluded.title,
        unit = excluded.unit,
        source_id = excluded.source_id,
        category_key = excluded.category_key,
        visualization_config_json = excluded.visualization_config_json,
        source_config_json = excluded.source_config_json,
        value_display_config_json = excluded.value_display_config_json,
        is_active = 1,
        year_code = excluded.year_code,
        updated_at = CURRENT_TIMESTAMP`,
    ).run(cand.slug, cand.title, recordedUnit, sourceId, cand.categoryKey, visConfig, sourceConfig, valueDisplayConfig, cand.yearCode);

    db.prepare("DELETE FROM stats_prefecture WHERE metric_key = ? AND year_code = ?").run(cand.slug, cand.yearCode);
    const insStmt = db.prepare(
      `INSERT INTO stats_prefecture (metric_key, area_code, area_name, year_code, year_name, value, unit, rank, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    );
    const txn = db.transaction((rows) => {
      for (const r of rows) {
        insStmt.run(cand.slug, r.areaCode, r.areaName, cand.yearCode, cand.yearName, r.value, r.unit || recordedUnit, r.rank);
      }
    });
    txn(prefs);

    db.prepare(
      "UPDATE estat_metainfo SET status='registered', is_active=1, updated_at=CURRENT_TIMESTAMP WHERE stats_data_id=?",
    ).run(cand.statsDataId);

    const cnt = db.prepare("SELECT COUNT(*) AS n FROM stats_prefecture WHERE metric_key = ? AND year_code = ?").get(cand.slug, cand.yearCode);
    result.rows = cnt.n;
    result.status = cnt.n >= 47 ? "done" : "failed";
    result.reason = cnt.n >= 47 ? "ok" : `only ${cnt.n} rows inserted`;
  } catch (e) {
    result.reason = String(e.message || e).slice(0, 120);
  }
  return result;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const args = parseArgs(process.argv);
  const recipesPath = path.resolve(args.recipes);
  if (!fs.existsSync(recipesPath)) {
    console.error(`recipes file not found: ${recipesPath}`);
    process.exit(1);
  }
  let recipes = JSON.parse(fs.readFileSync(recipesPath, "utf8"));
  if (args.slugs) recipes = recipes.filter((r) => args.slugs.includes(r.slug));
  if (recipes.length === 0) {
    console.error("no recipes match the given filters");
    process.exit(1);
  }

  const db = new BetterSqlite3(D1_PATH);
  const results = [];
  for (let i = 0; i < recipes.length; i++) {
    const c = recipes[i];
    process.stderr.write(`[${i + 1}/${recipes.length}] ${c.slug} (${c.statsDataId})...\n`);
    let res;
    try {
      res = await processCandidate(c, db, { dryRun: args.dryRun });
    } catch (e) {
      res = {
        slug: c.slug,
        statsDataId: c.statsDataId,
        status: "failed",
        rows: 0,
        latestYear: Number(c.yearCode),
        reason: String(e.message).slice(0, 80),
      };
    }
    process.stderr.write(`  -> ${res.status} rows=${res.rows} year=${res.latestYear} reason=${res.reason}\n`);
    results.push(res);
    if (i < recipes.length - 1 && !args.dryRun) await sleep(args.sleepMs);
  }
  db.close();
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
