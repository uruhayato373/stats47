#!/usr/bin/env node
/**
 * adsense-diagnostics-run — 週次 AdSense 候補生成 (最大3件・決定的)。
 *
 * 正典: docs/02_実装計画/41_AdSense継続改善・GA4_GSC設定自動化仕様.md §4.3/§7。
 * 入力: .claude/state/metrics/adsense/{history,history-devices,history-placements,history-formats}.csv
 *       + snapshot manifest.json (job status)
 *       + .claude/state/metrics/adsense/past-effects.json (任意・effect/none|adverse 台帳)
 * 出力: .claude/state/metrics/adsense/candidates-latest.json (提示まで。バックログ追加・
 *       配置変更・deploy は人間承認 — §3.3)
 *
 *   node .claude/scripts/metrics/adsense-diagnostics-run.mjs [YYYY-Www]
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PROJECT_ROOT, parseWeekArg } from "./lib/auth.mjs";
import { readCsv } from "./update-history-csv.mjs";
import { resolvePeriods } from "./lib/periods.mjs";
import { buildAdsenseCandidates, MAX_CANDIDATES, ADSENSE_ACTIVE_WIP_LIMIT, ADSENSE_WEEKLY_ADOPTION_LIMIT } from "./lib/adsense-diagnostics.mjs";
import { MANIFEST_FILE } from "./lib/adsense-report-contract.mjs";

const STATE_DIR = join(PROJECT_ROOT, ".claude/state/metrics/adsense");
const SNAP_DIR = join(PROJECT_ROOT, ".claude/skills/analytics/adsense-improvement/reference/snapshots");

const num = (v) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** history 行 → 診断入力形。 */
function toAgg(r) {
  if (!r) return null;
  return {
    earnings: num(r.earnings),
    pageViews: num(r.page_views),
    impressions: num(r.impressions),
    viewability: num(r.viewability),
    pageRpm: num(r.rpm),
    impRpm: num(r.impressions_rpm),
    ctr: num(r.ctr),
  };
}

function main() {
  const week = parseWeekArg();
  const hist = readCsv(join(STATE_DIR, "history.csv"))?.rows ?? [];
  const target = hist.find((r) => r.week === week);
  if (!target) {
    console.error(`[adsense-diagnostics] ${week} の history 行が無い — 先に metrics:digest を実行する`);
    process.exit(1);
  }
  const idx = hist.indexOf(target);
  const prev = idx > 0 ? hist[idx - 1] : null;

  // 期間 (baselineEnd = 確定7日の終端)。週から決定的に導出。
  const periods = resolvePeriods({ source: "adsense", week });
  const baselineEnd = periods.finalized7d.periodEnd;

  // devices
  const devRows = readCsv(join(STATE_DIR, "history-devices.csv"))?.rows ?? [];
  const platforms = [...new Set(devRows.filter((r) => r.week === week).map((r) => r.platform))];
  const prevWeek = prev?.week ?? null;
  const devices = platforms.map((p) => ({
    device: p,
    current: toAgg(devRows.find((r) => r.week === week && r.platform === p)),
    previous: prevWeek ? toAgg(devRows.find((r) => r.week === prevWeek && r.platform === p)) : null,
  }));

  // placements (直近 2 週の viewability<50% 連続数)
  const plRows = readCsv(join(STATE_DIR, "history-placements.csv"))?.rows ?? [];
  const placements = plRows
    .filter((r) => r.week === week)
    .map((r) => {
      const keyOf = (row) => `${row.code}@${row.platform}`;
      const weeksBelow = [week, prevWeek].filter(Boolean).reduce((acc, w) => {
        const row = plRows.find((x) => x.week === w && keyOf(x) === keyOf(r));
        return row && num(row.viewability) !== null && num(row.viewability) < 0.5 ? acc + 1 : acc;
      }, 0);
      return {
        code: r.code,
        platform: r.platform,
        current: { impressions: num(r.impressions), viewability: num(r.viewability) },
        weeksBelow,
      };
    });

  // formats (同 platform median との比較)
  const fmRows = readCsv(join(STATE_DIR, "history-formats.csv"))?.rows ?? [];
  const curFm = fmRows.filter((r) => r.week === week);
  const medianByPlatform = {};
  for (const p of new Set(curFm.map((r) => r.platform))) {
    const vals = curFm.filter((r) => r.platform === p).map((r) => num(r.impressions_rpm)).filter((v) => v !== null).sort((a, b) => a - b);
    medianByPlatform[p] = vals.length ? vals[Math.floor(vals.length / 2)] : null;
  }
  const formats = curFm.map((r) => ({
    code: r.code,
    platform: r.platform,
    current: { impressions: num(r.impressions), impRpm: num(r.impressions_rpm), viewability: num(r.viewability), ctr: num(r.ctr) },
    previous: prevWeek ? (() => {
      const p = fmRows.find((x) => x.week === prevWeek && x.code === r.code && x.platform === r.platform);
      return p ? { viewability: num(p.viewability), ctr: num(p.ctr) } : null;
    })() : null,
    deviceMedianImpRpm: medianByPlatform[r.platform],
  }));

  // job status (manifest があれば)
  let jobStatuses = null;
  const manifestPath = join(SNAP_DIR, week, MANIFEST_FILE);
  if (existsSync(manifestPath)) {
    try {
      const m = JSON.parse(readFileSync(manifestPath, "utf-8"));
      jobStatuses = Object.fromEntries(Object.entries(m.jobs ?? {}).map(([k, v]) => [k, v.status]));
    } catch { /* manifest 破損は gap 扱いにしない (読めた情報だけ使う) */ }
  } else {
    // manifest 無し = 旧世代 fetcher の snapshot。format/placement 系は未取得 = missing
    jobStatuses = { "formats-platforms": "missing", "placements-platforms": "missing", "bid-types-platforms": "missing" };
  }

  // traffic mix (device share の変化)
  const shareOf = (w) => {
    const rows = devRows.filter((r) => r.week === w);
    const total = rows.reduce((a, r) => a + (num(r.impressions) ?? 0), 0);
    if (!total) return null;
    return Object.fromEntries(rows.map((r) => [r.platform, ((num(r.impressions) ?? 0) / total) * 100]));
  };
  const efficiencyDown = prev ? (num(target.rpm) ?? 0) < (num(prev.rpm) ?? 0) : false;
  const trafficMix = prevWeek
    ? { dimension: "platform", currentShares: shareOf(week), previousShares: shareOf(prevWeek), efficiencyDown }
    : null;

  // past effects (任意台帳)
  let pastEffects = {};
  const pePath = join(STATE_DIR, "past-effects.json");
  if (existsSync(pePath)) {
    try { pastEffects = JSON.parse(readFileSync(pePath, "utf-8")).candidates ?? {}; } catch { /* */ }
  }

  const candidates = buildAdsenseCandidates({
    baselineEnd,
    account: { current: toAgg(target), previous: toAgg(prev) },
    devices,
    placements,
    formats,
    jobStatuses,
    trafficMix,
    pastEffects,
  });

  const out = {
    schemaVersion: 1,
    week,
    generatedAt: new Date().toISOString(),
    period: periods.finalized7d,
    previousWeek: prevWeek,
    limits: { maxCandidates: MAX_CANDIDATES, activeWipLimit: ADSENSE_ACTIVE_WIP_LIMIT, weeklyAdoptionLimit: ADSENSE_WEEKLY_ADOPTION_LIMIT },
    note: "候補提示まで (自動でバックログ追加・配置変更・deploy しない・doc41 §3.3)。採用は人間承認で最大1件/週",
    candidates,
  };
  writeFileSync(join(STATE_DIR, "candidates-latest.json"), JSON.stringify(out, null, 2) + "\n");

  console.log(`[adsense-diagnostics] week=${week} (baseline ${periods.finalized7d.periodStart}..${baselineEnd}) 候補 ${candidates.length}/${MAX_CANDIDATES} 件`);
  for (const c of candidates) {
    console.log(`  [${c.rule}] ${c.key} score=${c.score} confidence=${c.confidence}`);
    console.log(`      判定: 14日=${c.judgment.day14} / 28日=${c.judgment.day28}  lever=${c.expectedLever}`);
  }
  console.log(`wrote .claude/state/metrics/adsense/candidates-latest.json`);
}

main();
