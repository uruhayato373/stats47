#!/usr/bin/env node
/**
 * check-period-contract — 週次計測の期間契約を検査する read-only gate。
 *
 * 用途:
 * 1. fetch-metrics-weekly.yml の最終 step (--strict):
 *    対象週の GSC/GA4 summary が missing/partial なら exit 1 で run を赤くする
 *    (commit 後に走るので failure isolation は保ちつつ、partial を green に隠さない)。
 * 2. search-growth-weekly.yml の先頭 step (--max-age-weeks 1):
 *    最新 snapshot が古すぎる (stale artifact) 場合に exit 1 で candidate 再構築を止める。
 *
 * 引数:
 *   [YYYY-Www]         対象週 (省略時は今日 JST の週)
 *   --strict           missing/partial を exit 1 にする
 *   --max-age-weeks N  最新 snapshot 週の許容齢 (省略時は週チェックなし)
 *
 * 検査のみ (書き込み・network なし)。
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PROJECT_ROOT, parseWeekArg } from "./lib/auth.mjs";
import { jstDateOf, isoWeekOf, addDays } from "./lib/periods.mjs";
import { SUMMARY_FILE } from "./lib/weekly-summary.mjs";

const SNAPSHOT_DIRS = {
  gsc: ".claude/skills/analytics/gsc-improvement/reference/snapshots",
  ga4: ".claude/skills/analytics/ga4-improvement/reference/snapshots",
};
const NSM_DIR = ".claude/skills/management/nsm-experiment/reference/weekly-snapshots";

function getArgNum(flag) {
  const i = process.argv.indexOf(flag);
  if (i < 0) return null;
  const n = Number(process.argv[i + 1]);
  return Number.isFinite(n) ? n : null;
}

function latestWeekDir(dir) {
  if (!existsSync(dir)) return null;
  const weeks = readdirSync(dir).filter((d) => /^\d{4}-W\d{2}$/.test(d)).sort();
  return weeks.length ? weeks[weeks.length - 1] : null;
}

function checkSource(source, week) {
  const dir = join(PROJECT_ROOT, SNAPSHOT_DIRS[source], week);
  if (!existsSync(dir)) return { source, level: "missing", detail: `snapshot ${week} 無し` };
  const summaryPath = join(dir, SUMMARY_FILE);
  if (!existsSync(summaryPath)) {
    return { source, level: "missing", detail: `${SUMMARY_FILE} 無し (旧 fetcher 世代?)` };
  }
  let summary;
  try {
    summary = JSON.parse(readFileSync(summaryPath, "utf-8"));
  } catch (e) {
    return { source, level: "missing", detail: `${SUMMARY_FILE} parse 失敗: ${e.message}` };
  }
  const fin = source === "gsc" ? summary.finalized7d : summary.jpFinalized7d;
  if (!fin) return { source, level: "missing", detail: "finalized7d block 無し" };
  for (const k of ["periodStart", "periodEnd", "windowDays", "isFinalized", "generatedAt", "source"]) {
    if (fin[k] === undefined) return { source, level: "missing", detail: `metadata 欠落: ${k}` };
  }
  if (summary.wowBlockedReason) {
    return { source, level: "partial", detail: summary.wowBlockedReason, period: `${fin.periodStart}..${fin.periodEnd}` };
  }
  return { source, level: "ok", detail: `coverage complete`, period: `${fin.periodStart}..${fin.periodEnd}` };
}

function main() {
  const week = parseWeekArg();
  const strict = process.argv.includes("--strict");
  const maxAgeWeeks = getArgNum("--max-age-weeks");
  const results = [];

  if (maxAgeWeeks !== null) {
    // stale artifact guard: 最新 snapshot 週が許容齢内か (次工程が古い snapshot を黙って使わない)
    const minWeek = isoWeekOf(addDays(jstDateOf(), -7 * maxAgeWeeks));
    for (const source of ["gsc", "ga4"]) {
      const latest = latestWeekDir(join(PROJECT_ROOT, SNAPSHOT_DIRS[source]));
      if (!latest) {
        results.push({ source, level: "missing", detail: "snapshot ディレクトリ無し" });
      } else if (latest < minWeek) {
        results.push({ source, level: "stale", detail: `最新 ${latest} < 許容 ${minWeek} (max-age ${maxAgeWeeks}w)` });
      } else {
        results.push({ source, level: "ok", detail: `最新 ${latest} (許容 ${minWeek} 以降)` });
      }
    }
  } else {
    for (const source of ["gsc", "ga4"]) results.push(checkSource(source, week));
    // NSM weekly snapshot (weekly-plan/runbook が finalized7d を読む先)
    const nsmPath = join(PROJECT_ROOT, NSM_DIR, `${week}.json`);
    if (!existsSync(nsmPath)) {
      results.push({ source: "nsm", level: "missing", detail: `${week}.json 無し` });
    } else {
      try {
        const j = JSON.parse(readFileSync(nsmPath, "utf-8"));
        if (j.schemaVersion !== 2 || !j.finalized7d) {
          results.push({ source: "nsm", level: "partial", detail: "schemaVersion 2 / finalized7d block 無し (旧世代)" });
        } else if (j.finalized7d?.gsc?.status === "insufficient-data" || j.finalized7d?.gsc?.error || j.finalized7d?.ga4?.error) {
          results.push({ source: "nsm", level: "partial", detail: j.finalized7d?.gsc?.insufficientReason ?? j.finalized7d?.gsc?.error ?? j.finalized7d?.ga4?.error });
        } else {
          results.push({ source: "nsm", level: "ok", detail: "finalized7d あり" });
        }
      } catch (e) {
        results.push({ source: "nsm", level: "missing", detail: `parse 失敗: ${e.message}` });
      }
    }
  }

  let worst = "ok";
  const rank = { ok: 0, partial: 1, stale: 2, missing: 3 };
  console.log(`[period-contract] week=${week}${maxAgeWeeks !== null ? ` (stale guard max-age=${maxAgeWeeks}w)` : ""}`);
  for (const r of results) {
    const mark = r.level === "ok" ? "✓" : "✗";
    console.log(`  ${mark} ${r.source.padEnd(4)} ${r.level.padEnd(8)} ${r.detail}${r.period ? ` [${r.period}]` : ""}`);
    if ((rank[r.level] ?? 3) > (rank[worst] ?? 0)) worst = r.level;
  }
  if (worst !== "ok") {
    console.log(`[period-contract] 結果: ${worst} — KPI/WoW/ゲート判定は insufficient-data として停止する`);
    if (strict || maxAgeWeeks !== null) process.exit(1);
  } else {
    console.log("[period-contract] 結果: ok");
  }
}

main();
