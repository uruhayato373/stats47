#!/usr/bin/env node
/**
 * e-Stat メタデータ完全カタログ CLI。
 *
 * サブコマンド:
 *   run    L1 (getStatsList 全 collectArea) → 差分 plan → getMetaInfo (時間予算まで) →
 *          .local/r2/estat-catalog/ に staging (diff-push-r2.ts --prefix estat-catalog で R2 反映)
 *   pull   公開 URL から manifest + 索引を .local/estat-catalog/ へ取得 (ローカル検索用)
 *   search <語...>  pull 済みの索引をキーワード検索
 *
 * 設計: docs/02_実装計画/48_e-Statカタログ実装仕様.md
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { fetchMetaInfo, getAppId, listAllTables, sleep } from "../lib/estat-catalog/api.mjs";
import { classRows, normalizeTableRow, summarizeMeta } from "../lib/estat-catalog/normalize.mjs";
import {
  buildPlan,
  computeSurveysSummary,
  markRemoved,
  recordFetchFailure,
  recordFetchSuccess,
  upsertTableRow,
} from "../lib/estat-catalog/index.mjs";
import { loadPulled } from "../lib/estat-catalog/pulled.mjs";
import { getObjectJson } from "../lib/estat-catalog/s3.mjs";

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(__filename), "..", "..", "..");
const STAGING_DIR = path.join(PROJECT_ROOT, ".local/r2/estat-catalog");
const PULL_DIR = path.join(PROJECT_ROOT, ".local/estat-catalog");

const DEFAULT_META_SCOPE = [2, 3];
const DEFAULT_TIME_BUDGET_MIN = 150;
const META_DELAY_MS = 500;
const LIST_DELAY_MS = 300;
const FAILURE_RATE_LIMIT = 0.2;
const API_VERSION = "3.0";

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}

function parseIntList(s, fallback) {
  if (!s) return fallback;
  return String(s)
    .split(",")
    .map((x) => parseInt(x.trim(), 10))
    .filter((n) => !Number.isNaN(n));
}

function publicBase() {
  return process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";
}

async function fetchPublicJson(key) {
  const res = await fetch(`${publicBase()}/${key}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET ${key}: HTTP ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// run
// ---------------------------------------------------------------------------

async function cmdRun(args) {
  const dryRun = !!args["dry-run"];
  const metaScope = parseIntList(args["meta-scope"], DEFAULT_META_SCOPE);
  const timeBudgetMin = args["time-budget-min"] ? Number(args["time-budget-min"]) : DEFAULT_TIME_BUDGET_MIN;
  const maxMeta = args["max-meta"] ? Number(args["max-meta"]) : Infinity;

  getAppId(); // dry-run でも早期に fail させる (plan だけでも実行環境の確認になる)

  console.log(
    `📡 estat-catalog run (metaScope=${metaScope.join(",")} timeBudget=${timeBudgetMin}min ` +
      `maxMeta=${maxMeta === Infinity ? "∞" : maxMeta} dryRun=${dryRun})`,
  );

  // --- L1: getStatsList を全 collectArea (1=全国 2=都道府県 3=市区町村) で crawl ---
  const freshRows = new Map();
  const collectAreaCounts = {};
  for (const ca of [1, 2, 3]) {
    console.log(`\n--- L1 collectArea=${ca} ---`);
    const raw = await listAllTables(ca, {
      delayMs: LIST_DELAY_MS,
      onPage: ({ count }) => process.stdout.write(`\r  ...${count} 件`),
    });
    collectAreaCounts[ca] = raw.length;
    for (const r of raw) freshRows.set(String(r["@id"]), normalizeTableRow(r, String(ca)));
    console.log(`\n  → collectArea=${ca}: ${raw.length} 件`);
  }
  console.log(`\nL1 合計 (重複排除後): ${freshRows.size} 件`);
  console.log(JSON.stringify({ collectAreaCounts }, null, 2));

  if (dryRun) {
    console.log("\n【DRY RUN】ここで停止 (getMetaInfo は呼ばない・R2 も読まない)");
    return;
  }

  // --- 既存索引 + manifest を S3 (CI 権威。CDN cache 越しの公開 URL は使わない) から取得 ---
  const manifest = (await getObjectJson("estat-catalog/manifest.json")) ?? {
    failed: [],
    quarantined: [],
  };
  const surveysIndex = (await getObjectJson("estat-catalog/index/surveys.json")) ?? [];
  const existingTables = [];
  for (const s of surveysIndex) {
    const shard = await getObjectJson(`estat-catalog/index/tables/${s.statCode}.json`);
    if (shard) existingTables.push(...shard);
  }
  console.log(`既存索引: ${existingTables.length} 件 (${surveysIndex.length} 調査)`);

  // --- 差分 plan ---
  const plan = buildPlan({ existingTables, freshRows, manifest, metaScope, maxMeta });
  console.log(
    `plan: new=${plan.newRows.length} updated=${plan.updatedRows.length} ` +
      `retry=${plan.retryRows.length} removed=${plan.removedIds.length} toFetchMeta=${plan.toFetchMeta.length}`,
  );

  // --- getMetaInfo を時間予算まで ---
  const startedAt = new Date().toISOString();
  const deadline = Date.now() + timeBudgetMin * 60 * 1000;
  const existingById = new Map(existingTables.map((t) => [t.statsDataId, t]));
  const metaResults = new Map(); // statsDataId -> { ok, meta, classRows, rawResponse } | { ok:false }
  let attempted = 0;
  let failedCount = 0;
  let timeBudgetHit = plan.toFetchMeta.length === 0 ? false : Date.now() >= deadline;
  let m = manifest;

  for (const target of plan.toFetchMeta) {
    if (Date.now() >= deadline) {
      timeBudgetHit = true;
      break;
    }
    attempted++;
    const fetchedAt = new Date().toISOString();
    try {
      const raw = await fetchMetaInfo(target.statsDataId);
      const summary = summarizeMeta(raw);
      metaResults.set(target.statsDataId, {
        ok: true,
        rawResponse: raw,
        classRows: classRows(raw, target.statsDataId),
        meta: {
          sourceUpdatedDate: summary.sourceUpdatedDate,
          fetchedAt,
          dims: summary.dims,
          years: summary.years,
          timeKind: summary.timeKind,
          prefDim: summary.prefDim,
          has47Pref: summary.has47Pref,
          areaKind: summary.areaKind,
          areaCount: summary.areaCount,
        },
      });
      m = recordFetchSuccess(m, target.statsDataId);
      console.log(`  ✓ ${target.statsDataId} ${(target.title || "").slice(0, 30)}`);
    } catch (e) {
      failedCount++;
      metaResults.set(target.statsDataId, { ok: false });
      m = recordFetchFailure(m, target.statsDataId, e.message, fetchedAt);
      console.log(`  ✗ ${target.statsDataId} ${e.message}`);
    }
    await sleep(META_DELAY_MS);
  }

  if (attempted > 0 && failedCount / attempted > FAILURE_RATE_LIMIT) {
    console.error(
      `❌ 失敗率 ${((failedCount / attempted) * 100).toFixed(1)}% (${failedCount}/${attempted}) > 20% — fail-closed で停止`,
    );
    process.exit(1);
  }

  // --- 索引 upsert (statsDataId 単位) ---
  const finishedAt = new Date().toISOString();
  const mergedById = new Map(existingById);
  for (const [id, row] of freshRows) {
    mergedById.set(id, upsertTableRow(existingById.get(id), row, metaResults.get(id) ?? null));
  }
  for (const id of plan.removedIds) {
    const existing = existingById.get(id);
    if (existing) mergedById.set(id, markRemoved(existing, finishedAt));
  }
  const allTables = [...mergedById.values()];

  // --- statCode shard 単位で staging へ書き出し (変更のあった shard のみ) ---
  fs.mkdirSync(path.join(STAGING_DIR, "index/tables"), { recursive: true });
  fs.mkdirSync(path.join(STAGING_DIR, "index/classes"), { recursive: true });
  fs.mkdirSync(path.join(STAGING_DIR, "meta"), { recursive: true });

  const shardKeyOf = (t) => t.statCode || "unknown";
  const byShard = new Map();
  for (const t of allTables) {
    const key = shardKeyOf(t);
    if (!byShard.has(key)) byShard.set(key, []);
    byShard.get(key).push(t);
  }
  const changedShards = new Set();
  for (const row of [...plan.newRows, ...plan.updatedRows, ...plan.retryRows]) changedShards.add(shardKeyOf(row));
  for (const id of plan.removedIds) {
    const existing = existingById.get(id);
    if (existing) changedShards.add(shardKeyOf(existing));
  }
  for (const shardKey of changedShards) {
    const rows = byShard.get(shardKey) ?? [];
    fs.writeFileSync(path.join(STAGING_DIR, `index/tables/${shardKey}.json`), JSON.stringify(rows, null, 1));
  }

  // classes shard: meta 成功分だけ、既存 shard を読み直して当該 statsDataId 分を置き換える
  const classesShardCache = new Map();
  for (const [id, result] of metaResults) {
    if (!result.ok) continue;
    const t = mergedById.get(id);
    const shardKey = shardKeyOf(t);
    if (!classesShardCache.has(shardKey)) {
      const existingClasses = (await getObjectJson(`estat-catalog/index/classes/${shardKey}.json`)) ?? [];
      classesShardCache.set(
        shardKey,
        existingClasses.filter((r) => r.statsDataId !== id),
      );
    }
    classesShardCache.get(shardKey).push(...result.classRows);
  }
  for (const [shardKey, rows] of classesShardCache) {
    fs.writeFileSync(path.join(STAGING_DIR, `index/classes/${shardKey}.json`), JSON.stringify(rows, null, 1));
  }

  // meta 生レスポンス (成功分のみ、封筒形式・出典再現用)
  for (const [id, result] of metaResults) {
    if (!result.ok) continue;
    const envelope = {
      fetchedAt: result.meta.fetchedAt,
      params: { statsDataId: id, lang: "J" },
      apiVersion: API_VERSION,
      response: result.rawResponse,
    };
    fs.writeFileSync(path.join(STAGING_DIR, `meta/${id}.json`), JSON.stringify(envelope, null, 1));
  }

  // --- surveys.json / manifest.json ---
  const surveys = computeSurveysSummary(allTables);
  fs.writeFileSync(path.join(STAGING_DIR, "index/surveys.json"), JSON.stringify(surveys, null, 1));

  const collectAreas = {};
  for (const ca of [1, 2, 3]) {
    const tablesForCa = allTables.filter((t) => String(t.collectArea) === String(ca) && !t.removedAt);
    collectAreas[ca] = {
      tables: tablesForCa.length,
      metaFetched: tablesForCa.filter((t) => t.meta).length,
      metaPending: metaScope.includes(ca) ? tablesForCa.filter((t) => !t.meta).length : null,
    };
  }
  const finalManifest = {
    ...m,
    generatedAt: finishedAt,
    metaScope,
    collectAreas,
    lastRun: { startedAt, finishedAt, fetched: attempted, failed: failedCount, timeBudgetHit },
  };
  fs.writeFileSync(path.join(STAGING_DIR, "manifest.json"), JSON.stringify(finalManifest, null, 2));

  console.log(`\n完了: fetched=${attempted} failed=${failedCount} timeBudgetHit=${timeBudgetHit}`);
  console.log(`staging: ${path.relative(PROJECT_ROOT, STAGING_DIR)}`);
  console.log(
    `→ npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix estat-catalog で R2 へ反映`,
  );
}

// ---------------------------------------------------------------------------
// pull / search
// ---------------------------------------------------------------------------

async function cmdPull() {
  const manifest = await fetchPublicJson("estat-catalog/manifest.json");
  if (!manifest) {
    console.error("estat-catalog/manifest.json が見つかりません (初回 run が未実施の可能性)");
    process.exit(1);
  }
  const surveys = (await fetchPublicJson("estat-catalog/index/surveys.json")) ?? [];
  fs.mkdirSync(path.join(PULL_DIR, "index/tables"), { recursive: true });
  fs.mkdirSync(path.join(PULL_DIR, "index/classes"), { recursive: true });
  fs.writeFileSync(path.join(PULL_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(PULL_DIR, "index/surveys.json"), JSON.stringify(surveys, null, 2));

  let tablesCount = 0;
  let classesCount = 0;
  for (const s of surveys) {
    const tables = await fetchPublicJson(`estat-catalog/index/tables/${s.statCode}.json`);
    if (tables) {
      fs.writeFileSync(path.join(PULL_DIR, `index/tables/${s.statCode}.json`), JSON.stringify(tables));
      tablesCount += tables.length;
    }
    if (s.metaFetched > 0) {
      const classes = await fetchPublicJson(`estat-catalog/index/classes/${s.statCode}.json`);
      if (classes) {
        fs.writeFileSync(path.join(PULL_DIR, `index/classes/${s.statCode}.json`), JSON.stringify(classes));
        classesCount += classes.length;
      }
    }
  }
  console.log(`pull 完了: ${surveys.length} 調査 / ${tablesCount} 表 / ${classesCount} 分類行 → ${path.relative(PROJECT_ROOT, PULL_DIR)}`);
}

async function cmdSearch(args) {
  const { tables } = loadPulled(PULL_DIR);
  const terms = args._.filter(Boolean);
  const id = args.id;
  if (id) {
    const t = tables.find((x) => x.statsDataId === id);
    if (!t) {
      console.log(`見つかりません: ${id}`);
      return;
    }
    const classesPath = path.join(PULL_DIR, `index/classes/${t.statCode}.json`);
    const classes = fs.existsSync(classesPath)
      ? JSON.parse(fs.readFileSync(classesPath, "utf8")).filter((c) => c.statsDataId === id)
      : [];
    console.log(JSON.stringify({ table: t, classes }, null, 2));
    return;
  }
  if (terms.length === 0) {
    console.error("検索語または --id を指定してください");
    process.exit(1);
  }
  const prefOnly = !!args["pref-only"];
  const year = args.year ? String(args.year) : null;
  const collectArea = args["collect-area"] ? String(args["collect-area"]) : null;
  const hay = (t) => `${t.statName} ${t.title} ${t.govOrg ?? ""}`.toLowerCase();
  const needles = terms.map((t) => t.toLowerCase());
  const hits = tables.filter((t) => {
    if (!needles.every((n) => hay(t).includes(n))) return false;
    if (prefOnly && !t.meta?.has47Pref) return false;
    if (year && !(t.meta?.years ?? []).includes(year)) return false;
    if (collectArea && String(t.collectArea) !== collectArea) return false;
    return true;
  });
  console.log(`${hits.length} 件`);
  for (const t of hits.slice(0, 50)) {
    const metaStr = t.meta
      ? `years=${t.meta.years.join("/")} areaKind=${t.meta.areaKind} has47Pref=${t.meta.has47Pref}`
      : "meta未取得";
    console.log(`${t.statsDataId} [${t.collectArea}] ${t.statName} / ${t.title} (${metaStr})`);
  }
  if (hits.length > 50) console.log(`... 他 ${hits.length - 50} 件`);
}

// ---------------------------------------------------------------------------

async function main() {
  const [sub, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  if (sub === "run") return cmdRun(args);
  if (sub === "pull") return cmdPull(args);
  if (sub === "search") return cmdSearch(args);
  console.error("使い方: catalog.mjs <run|pull|search> [options]");
  process.exit(1);
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
