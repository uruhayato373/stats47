/**
 * populate-catalog.mjs
 *
 * estat_metainfo の候補を estat_catalog（1行1ランキング）に展開する。
 *
 * Phase A: classInf が NULL の候補に対して e-Stat getMetaInfo API を呼び classInf を書き戻す
 * Phase B: classInf → estat_catalog 行に展開（cat01 コードごとに1行）
 *
 * 実行例:
 *   node .claude/scripts/estat/populate-catalog.mjs
 *   node .claude/scripts/estat/populate-catalog.mjs --category laborwage
 *   node .claude/scripts/estat/populate-catalog.mjs --limit 50
 *   node .claude/scripts/estat/populate-catalog.mjs --skip-fetch   # Phase B のみ
 *   node .claude/scripts/estat/populate-catalog.mjs --phase-b-only # Phase B のみ（--skip-fetchの別名）
 */

import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "../../..");

// --- 設定 ---
const DBPATH = resolve(
  PROJECT_ROOT,
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite"
);
const RATE_LIMIT_DELAY_MS = 1300; // e-Stat: 60 req/min 対策

// .env.local から ESTAT APP ID を読む
function loadEstatAppId() {
  try {
    const raw = readFileSync(resolve(PROJECT_ROOT, ".env.local"), "utf-8");
    const match = raw.match(/NEXT_PUBLIC_ESTAT_APP_ID=(\S+)/);
    if (match) return match[1];
  } catch {}
  return process.env.ESTAT_APP_ID ?? process.env.NEXT_PUBLIC_ESTAT_APP_ID ?? null;
}

// CLI 引数のパース
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { category: null, limit: Infinity, skipFetch: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--category" && args[i + 1]) opts.category = args[++i];
    else if (args[i] === "--limit" && args[i + 1]) opts.limit = parseInt(args[++i], 10);
    else if (args[i] === "--skip-fetch" || args[i] === "--phase-b-only") opts.skipFetch = true;
  }
  return opts;
}

// e-Stat getMetaInfo API 呼び出し
async function fetchMetaInfo(appId, statsDataId) {
  const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo?appId=${appId}&statsDataId=${statsDataId}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${statsDataId}`);
  return res.json();
}

// API レスポンスの CLASS_INF を簡略 JSON にシリアライズ
function serializeClassInf(metaJson) {
  const classInfRaw = metaJson?.GET_META_INFO?.METADATA_INF?.CLASS_INF;
  if (!classInfRaw) return null;

  const classObjs = classInfRaw.CLASS_OBJ;
  if (!classObjs) return null;
  const arr = Array.isArray(classObjs) ? classObjs : [classObjs];

  const result = {};
  for (const obj of arr) {
    const id = obj["@id"];
    if (!id) continue;
    const classes = obj.CLASS ? (Array.isArray(obj.CLASS) ? obj.CLASS : [obj.CLASS]) : [];
    result[id] = classes.map((c) => ({
      code: c["@code"],
      name: c["@name"],
      unit: c["@unit"] ?? null,
      level: c["@level"] ?? null,
      parentCode: c["@parentCode"] ?? null,
    }));
  }
  return Object.keys(result).length > 0 ? JSON.stringify(result) : null;
}

// 除外判定: 名前に男/女 を含む → isExcluded=1
const EXCLUDE_PATTERNS = [/男(?!女)/, /女(?!男)/, /男性/, /女性/];
function shouldExclude(name) {
  return EXCLUDE_PATTERNS.some((p) => p.test(name));
}

async function main() {
  const opts = parseArgs();
  const appId = loadEstatAppId();
  if (!appId && !opts.skipFetch) {
    console.error("ESTAT_APP_ID が見つかりません。.env.local に NEXT_PUBLIC_ESTAT_APP_ID を設定してください。");
    process.exit(1);
  }

  const db = new Database(DBPATH);

  // ─── Phase A: classInf 一括取得 ───────────────────────────────────────────
  if (!opts.skipFetch) {
    let query = "SELECT stats_data_id, category_key FROM estat_metainfo WHERE class_inf IS NULL AND area_type = 'prefecture'";
    const params = [];
    if (opts.category) {
      query += " AND category_key = ?";
      params.push(opts.category);
    }
    const targets = db.prepare(query).all(...params);
    const limited = targets.slice(0, opts.limit);

    console.log(`\n[Phase A] classInf 取得対象: ${limited.length} 件 (全候補: ${targets.length} 件)`);
    if (opts.category) console.log(`  category フィルタ: ${opts.category}`);

    const updateStmt = db.prepare(
      "UPDATE estat_metainfo SET class_inf = ?, updated_at = datetime('now') WHERE stats_data_id = ?"
    );

    let fetched = 0, failed = 0;
    for (const row of limited) {
      try {
        const json = await fetchMetaInfo(appId, row.stats_data_id);
        const classInf = serializeClassInf(json);
        if (classInf) {
          updateStmt.run(classInf, row.stats_data_id);
          fetched++;
        } else {
          // classInf なし → エントリを空文字でマーク（再取得しない）
          updateStmt.run("", row.stats_data_id);
          failed++;
        }
        if (fetched % 50 === 0) process.stdout.write(`  取得済: ${fetched}/${limited.length}\r`);
        await new Promise((r) => setTimeout(r, RATE_LIMIT_DELAY_MS));
      } catch (err) {
        console.error(`  ✗ ${row.stats_data_id}: ${err.message}`);
        failed++;
        await new Promise((r) => setTimeout(r, RATE_LIMIT_DELAY_MS));
      }
    }
    console.log(`\n  完了: 取得 ${fetched} 件, 失敗/空 ${failed} 件`);
  }

  // ─── Phase B: classInf → estat_catalog に展開 ────────────────────────────
  console.log("\n[Phase B] estat_catalog に展開中...");

  let metaQuery = "SELECT stats_data_id, category_key, class_inf FROM estat_metainfo WHERE class_inf IS NOT NULL AND class_inf != ''";
  const metaParams = [];
  if (opts.category) {
    metaQuery += " AND category_key = ?";
    metaParams.push(opts.category);
  }
  const allMeta = db.prepare(metaQuery).all(...metaParams);
  console.log(`  対象 stats_data_id: ${allMeta.length} 件`);

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO estat_catalog
      (stats_data_id, cat01_code, cat01_name, unit, category_key, is_excluded, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  let inserted = 0, skipped = 0;
  const insertMany = db.transaction((rows) => {
    for (const r of rows) {
      const info = insertStmt.run(r.statsDataId, r.code, r.name, r.unit, r.categoryKey, r.isExcluded);
      if (info.changes > 0) inserted++;
      else skipped++;
    }
  });

  for (const meta of allMeta) {
    let parsed;
    try {
      parsed = JSON.parse(meta.class_inf);
    } catch {
      continue;
    }

    // cat01 が最優先。なければ最初の cat* 次元を使う
    const catKey = parsed.cat01
      ? "cat01"
      : Object.keys(parsed).find((k) => k.startsWith("cat"));
    if (!catKey) continue;

    const items = parsed[catKey];
    if (!Array.isArray(items) || items.length === 0) continue;

    const rows = items.map((item) => ({
      statsDataId: meta.stats_data_id,
      code: item.code,
      name: item.name,
      unit: item.unit ?? null,
      categoryKey: meta.category_key ?? null,
      isExcluded: shouldExclude(item.name) ? 1 : 0,
    }));

    insertMany(rows);
  }

  console.log(`  挿入: ${inserted} 行, スキップ(重複): ${skipped} 行`);

  // ─── 既存 metrics との紐付け ───────────────────────────────────────────────
  const linkResult = db.prepare(`
    UPDATE estat_catalog SET metric_key = m.key, is_active = 1
    FROM metrics m
    WHERE estat_catalog.ranking_key = m.key AND estat_catalog.metric_key IS NULL
  `).run();
  if (linkResult.changes > 0) console.log(`  既存 metrics との紐付け: ${linkResult.changes} 件`);

  // ─── サマリ ───────────────────────────────────────────────────────────────
  console.log("\n=== estat_catalog サマリ ===");
  const summary = db.prepare(`
    SELECT category_key,
      COUNT(*) AS total,
      SUM(is_excluded) AS excluded,
      SUM(CASE WHEN ranking_key IS NOT NULL THEN 1 ELSE 0 END) AS with_key,
      SUM(is_active) AS active
    FROM estat_catalog
    GROUP BY category_key
    ORDER BY total DESC
  `).all();
  for (const row of summary) {
    console.log(
      `  ${String(row.category_key ?? "null").padEnd(22)} total=${row.total} excluded=${row.excluded} with_key=${row.with_key} active=${row.active}`
    );
  }
  const total = db.prepare("SELECT COUNT(*) AS n FROM estat_catalog").get();
  console.log(`\n  合計: ${total.n} 行`);

  db.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
