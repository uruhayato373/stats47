/**
 * 週次メトリクスの history.csv / history-finalized7d.csv / LATEST.md を更新する
 *
 * 引数:
 *   YYYY-Www（対象週。省略時は今日 JST の週）
 *   --source gsc|ga4|adsense|all（デフォルト: all）
 *
 * 入力: .claude/skills/analytics/{gsc,ga4,adsense}-improvement/reference/snapshots/<YYYY-Www>/*
 * 出力: .claude/state/metrics/{gsc,ga4,adsense}/history.csv
 *       .claude/state/metrics/{gsc,ga4}/history-finalized7d.csv （確定7日 KPI・非重複系列）
 *       .claude/state/metrics/{gsc,ga4,adsense}/LATEST.md
 *
 * 期間契約 (docs/02_実装計画/39 §18.2):
 * - KPI/WoW は summary.json (finalized7d + 直前の重複しない previous7d) だけを使う。
 * - GSC history.csv の既存行はローリング28日合計 — schema v2 で列名 *_rolling28d に改名 (値は不変)。
 * - GA4 history.csv は基盤混在 (raw 28日 / Japan カレンダー週) — basis 列で行ごとに明記 (値は不変)。
 * - summary.json が無い週 (過去 backfill) の GSC は daily.csv から決定的に再計算する。
 * - coverage が partial/missing のときは確定7日行を書かず、LATEST に insufficient-data を表示する。
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { PROJECT_ROOT, parseWeekArg, toCsv } from "./lib/auth.mjs";
import {
  SUMMARY_FILE,
  buildGscSummary,
  migrateGscHistoryRows,
  migrateGa4HistoryRows,
  gscFinalizedHistoryRow,
  ga4FinalizedHistoryRow,
  renderGscLatest,
  renderGa4Latest,
  GSC_HISTORY_FIELDS_V2,
  GA4_HISTORY_FIELDS_V2,
  GSC_FINALIZED_HISTORY_FIELDS,
  GA4_FINALIZED_HISTORY_FIELDS,
} from "./lib/weekly-summary.mjs";
import {
  ADSENSE_HISTORY_FIELDS_V2,
  ADSENSE_DEVICE_FIELDS_V2,
  ADSENSE_BREAKDOWN_SPECS,
  ADSENSE_BREAKDOWN_FIELDS,
  migrateAdsenseHistoryRows,
  migrateAdsenseDeviceRows,
  adsenseHistoryRowFromOverview,
  adsenseDeviceRowFromSnapshot,
  adsenseBreakdownRow,
} from "./lib/adsense-report-contract.mjs";

const SNAPSHOT_DIRS = {
  gsc: ".claude/skills/analytics/gsc-improvement/reference/snapshots",
  ga4: ".claude/skills/analytics/ga4-improvement/reference/snapshots",
  adsense: ".claude/skills/analytics/adsense-improvement/reference/snapshots",
};
const STATE_DIRS = {
  gsc: ".claude/state/metrics/gsc",
  ga4: ".claude/state/metrics/ga4",
  adsense: ".claude/state/metrics/adsense",
};

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuote) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuote = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuote = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

export function readCsv(path) {
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, "utf-8").trim();
  if (!raw) return null;
  const lines = raw.split("\n");
  const header = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map((l) => {
    const cells = parseCsvLine(l);
    const o = {};
    header.forEach((h, i) => {
      o[h] = cells[i];
    });
    return o;
  });
  return { header, rows };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { source: "all" };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--source") opts.source = args[++i];
  }
  return opts;
}

function num(v) {
  if (v == null || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** history 系 CSV を week で dedupe・sort して書き込み、全行を返す。 */
function upsertHistory(path, fields, row) {
  let rows = [];
  if (existsSync(path)) rows = readCsv(path)?.rows ?? [];
  rows = rows.filter((r) => r.week !== row.week);
  rows.push(row);
  rows.sort((a, b) => (a.week < b.week ? -1 : 1));
  writeFileSync(path, toCsv(rows, fields), "utf-8");
  return rows;
}

/** snapshot dir から GSC summary を得る (summary.json 優先・無ければ daily.csv から決定的に再計算)。 */
export function loadOrRebuildGscSummary(snapDir, week) {
  const summaryPath = join(snapDir, SUMMARY_FILE);
  if (existsSync(summaryPath)) {
    try {
      return JSON.parse(readFileSync(summaryPath, "utf-8"));
    } catch {
      /* fall through to rebuild */
    }
  }
  const daily = readCsv(join(snapDir, "daily.csv"));
  if (!daily) return null;
  try {
    return buildGscSummary({
      week,
      dailyRows: daily.rows.map((r) => ({
        date: r.date,
        clicks: r.clicks,
        impressions: r.impressions,
        position: r.position,
      })),
    });
  } catch {
    return null; // 期間再現不能 (未来週など) — 確定7日を捏造しない
  }
}

// ── GSC ──

function updateGsc(week) {
  const snapDir = join(PROJECT_ROOT, SNAPSHOT_DIRS.gsc, week);
  if (!existsSync(snapDir)) {
    console.log(`[gsc] snapshot ${week} not found, skipping`);
    return;
  }
  const stateDir = join(PROJECT_ROOT, STATE_DIRS.gsc);
  mkdirSync(stateDir, { recursive: true });

  // 1. rolling28d 行 (機会発見系列・schema v2 列名)
  const daily = readCsv(join(snapDir, "daily.csv"));
  const queries = readCsv(join(snapDir, "queries.csv"));
  const pages = readCsv(join(snapDir, "pages.csv"));
  let rollingRows = [];
  const histPath = join(stateDir, "history.csv");
  // 既存履歴の v2 移行 (値は保全・列名のみ)
  const existing = existsSync(histPath) ? (readCsv(histPath)?.rows ?? []) : [];
  const { rows: migrated, migrated: didMigrate } = migrateGscHistoryRows(existing);
  if (didMigrate) {
    writeFileSync(histPath, toCsv(migrated, GSC_HISTORY_FIELDS_V2), "utf-8");
    console.log(`[gsc] history.csv を schema v2 (*_rolling28d) へ移行 (${migrated.length} 行・値は不変)`);
  }
  if (daily) {
    let clicks = 0,
      imps = 0,
      posW = 0;
    for (const r of daily.rows) {
      const c = num(r.clicks);
      const i = num(r.impressions);
      clicks += c;
      imps += i;
      posW += num(r.position) * i;
    }
    const row = {
      week,
      clicks_rolling28d: clicks,
      impressions_rolling28d: imps,
      ctr_rolling28d: imps > 0 ? (clicks / imps).toFixed(4) : "",
      position_rolling28d: imps > 0 ? (posW / imps).toFixed(2) : "",
      rows_queries: queries?.rows.length ?? 0,
      rows_pages: pages?.rows.length ?? 0,
    };
    rollingRows = upsertHistory(histPath, GSC_HISTORY_FIELDS_V2, row);
  } else {
    rollingRows = existsSync(histPath) ? (readCsv(histPath)?.rows ?? []) : [];
    console.log("[gsc] daily.csv 無し — rolling28d 行は追加しない");
  }

  // 2. 確定7日 KPI (summary.json 優先・無ければ daily.csv から再計算)
  const summary = loadOrRebuildGscSummary(snapDir, week);
  const finRow = gscFinalizedHistoryRow(summary);
  if (finRow) {
    upsertHistory(join(stateDir, "history-finalized7d.csv"), GSC_FINALIZED_HISTORY_FIELDS, finRow);
  } else {
    console.warn(
      `[gsc] 確定7日 KPI 行なし (${summary ? (summary.wowBlockedReason ?? "coverage 不完全") : "summary 再構築不能"}) — history-finalized7d.csv へ書かない`,
    );
  }

  // 3. LATEST.md (確定7日 KPI + ローリング28日を分離表示)
  writeFileSync(join(stateDir, "LATEST.md"), renderGscLatest({ summary, rollingRows, week }), "utf-8");
  console.log(`[gsc] updated history.csv (${rollingRows.length} weeks) / history-finalized7d.csv (${finRow ? "+1" : "±0"}) / LATEST.md`);
}

// ── GA4 ──

function updateGa4(week) {
  const snapDir = join(PROJECT_ROOT, SNAPSHOT_DIRS.ga4, week);
  if (!existsSync(snapDir)) {
    console.log(`[ga4] snapshot ${week} not found, skipping`);
    return;
  }
  const stateDir = join(PROJECT_ROOT, STATE_DIRS.ga4);
  mkdirSync(stateDir, { recursive: true });

  const weekHasCleanSnapshot = (w) =>
    existsSync(join(PROJECT_ROOT, SNAPSHOT_DIRS.ga4, w, "overview-clean.csv"));

  // 1. 後方互換の legacy 系列 (overview-clean 優先の従来集計) + basis 列移行
  const histPath = join(stateDir, "history.csv");
  const existing = existsSync(histPath) ? (readCsv(histPath)?.rows ?? []) : [];
  const { rows: migrated, migrated: didMigrate } = migrateGa4HistoryRows(existing, weekHasCleanSnapshot);
  if (didMigrate) {
    writeFileSync(histPath, toCsv(migrated, GA4_HISTORY_FIELDS_V2), "utf-8");
    console.log(`[ga4] history.csv へ basis 列を付与 (${migrated.length} 行・値は不変)`);
  }
  const cleanPath = join(snapDir, "overview-clean.csv");
  const rawPath = join(snapDir, "overview.csv");
  const overview = existsSync(cleanPath) ? readCsv(cleanPath) : readCsv(rawPath);
  let legacyRows = existsSync(histPath) ? (readCsv(histPath)?.rows ?? []) : [];
  if (overview && overview.rows.length > 0) {
    const r = overview.rows[0];
    const row = {
      week,
      basis: existsSync(cleanPath) ? "jp-calendar-week" : "raw-rolling28d",
      active_users: num(r.activeUsers),
      new_users: num(r.newUsers),
      sessions: num(r.sessions),
      pageviews: num(r.screenPageViews),
      avg_session_duration_sec: num(r.averageSessionDuration).toFixed(1),
      bounce_rate: num(r.bounceRate).toFixed(4),
    };
    legacyRows = upsertHistory(histPath, GA4_HISTORY_FIELDS_V2, row);
  } else {
    console.log("[ga4] overview(-clean).csv 無し — legacy 行は追加しない");
  }

  // 2. 確定7日 KPI (summary.json のみ — Japan-only totals は過去週から再計算できない)
  let summary = null;
  const summaryPath = join(snapDir, SUMMARY_FILE);
  if (existsSync(summaryPath)) {
    try {
      summary = JSON.parse(readFileSync(summaryPath, "utf-8"));
    } catch {
      summary = null;
    }
  }
  const finRow = ga4FinalizedHistoryRow(summary);
  if (finRow) {
    upsertHistory(join(stateDir, "history-finalized7d.csv"), GA4_FINALIZED_HISTORY_FIELDS, finRow);
  } else {
    console.warn(
      `[ga4] 確定7日 KPI 行なし (${summary ? (summary.wowBlockedReason ?? "coverage 不完全") : "summary.json 無し"}) — history-finalized7d.csv へ書かない`,
    );
  }

  writeFileSync(join(stateDir, "LATEST.md"), renderGa4Latest({ summary, legacyRows, week }), "utf-8");
  console.log(`[ga4] updated history.csv (${legacyRows.length} weeks) / history-finalized7d.csv (${finRow ? "+1" : "±0"}) / LATEST.md`);
}

// ── AdSense (doc41 §2.1/§4.2: 公式 CPC 契約 + breakdown 履歴) ──

function aggregateAdsense(snapDir, week) {
  const overview = readCsv(join(snapDir, "overview.csv"));
  if (!overview || overview.rows.length === 0) return null;
  const latest = adsenseHistoryRowFromOverview(week, overview.rows[0]);
  const devices = readCsv(join(snapDir, "devices.csv"));
  if (devices && devices.rows.length > 0) {
    latest._devices = devices.rows.map((d) => adsenseDeviceRowFromSnapshot(week, d));
  }
  return latest;
}

/** history-devices.csv を v2 移行しつつ week 単位で dedupe して書き、全履歴を返す。 */
function writeAdsenseDeviceHistory(stateDir, week, deviceRows) {
  const path = join(stateDir, "history-devices.csv");
  let rows = [];
  if (existsSync(path)) {
    rows = readCsv(path)?.rows ?? [];
  }
  const { rows: migrated, migrated: didMigrate } = migrateAdsenseDeviceRows(rows);
  if (didMigrate) {
    console.log(`[adsense] history-devices.csv を schema v2 へ移行 (cpc→earnings_per_click_legacy・${migrated.length} 行・値は不変)`);
  }
  rows = migrated.filter((r) => r.week !== week);
  rows.push(...deviceRows);
  rows.sort((a, b) =>
    a.week !== b.week ? (a.week < b.week ? -1 : 1) : a.platform < b.platform ? -1 : 1
  );
  writeFileSync(path, toCsv(rows, ADSENSE_DEVICE_FIELDS_V2), "utf-8");
  return rows;
}

/** format/placement/bid-type × platform の breakdown 履歴を upsert する (snapshot にある job のみ)。 */
function writeAdsenseBreakdownHistories(stateDir, snapDir, week) {
  const written = [];
  for (const spec of ADSENSE_BREAKDOWN_SPECS) {
    const snap = readCsv(join(snapDir, spec.snapshotFile));
    if (!snap || snap.rows.length === 0) continue;
    const path = join(stateDir, spec.historyFile);
    let rows = existsSync(path) ? (readCsv(path)?.rows ?? []) : [];
    rows = rows.filter((r) => r.week !== week);
    rows.push(...snap.rows.map((r) => adsenseBreakdownRow(week, spec.keyDim, r)));
    rows.sort((a, b) =>
      a.week !== b.week ? (a.week < b.week ? -1 : 1) : `${a.code}@${a.platform}` < `${b.code}@${b.platform}` ? -1 : 1,
    );
    writeFileSync(path, toCsv(rows, ADSENSE_BREAKDOWN_FIELDS), "utf-8");
    written.push(`${spec.historyFile} (${rows.length} rows)`);
  }
  return written;
}

function markdownAdsense(history, latest, deviceHistory) {
  const prev = history.length >= 2 ? history[history.length - 2] : null;
  const arrow = (cur, prv, betterLow) => {
    if (!prv) return "";
    const diff = num(cur) - num(prv);
    if (Math.abs(diff) < 0.01) return " ·";
    const improved = betterLow ? diff < 0 : diff > 0;
    return improved ? " ▲" : " ▼";
  };
  const pct = (cur, prv) => {
    if (!prv) return "";
    const pv = num(prv);
    if (pv === 0) return "";
    const diff = num(cur) - pv;
    const p = ((diff / pv) * 100).toFixed(1);
    const sign = diff > 0 ? "+" : "";
    return ` (${sign}${p}%)`;
  };
  // 公式値が空 ("") の行は "-" 表示 (0 と混同しない・doc41 §2.1)
  const officialOrDash = (v, unit = "") => (v === "" || v === undefined || v === null ? "-" : `${unit}${v}`);
  const lines = [];
  lines.push(`# AdSense Latest — ${latest.week}`);
  lines.push("");
  lines.push("## 確定7日 KPI (finalized7d・前週比は直前の重複しない7日)");
  lines.push("");
  lines.push("| Metric | 確定7日 | 前週比 |");
  lines.push("|---|---|---|");
  lines.push(`| Earnings | ${latest.earnings}${arrow(latest.earnings, prev?.earnings, false)} | ${pct(latest.earnings, prev?.earnings)} |`);
  lines.push(`| Page Views | ${latest.page_views}${arrow(latest.page_views, prev?.page_views, false)} | ${pct(latest.page_views, prev?.page_views)} |`);
  lines.push(`| Page RPM | ${latest.rpm}${arrow(latest.rpm, prev?.rpm, false)} | |`);
  lines.push(`| Impressions | ${latest.impressions}${arrow(latest.impressions, prev?.impressions, false)} | ${pct(latest.impressions, prev?.impressions)} |`);
  lines.push(`| 公式 Imp RPM | ${officialOrDash(latest.impressions_rpm, "¥")} | |`);
  lines.push(`| Clicks | ${latest.clicks}${arrow(latest.clicks, prev?.clicks, false)} | ${pct(latest.clicks, prev?.clicks)} |`);
  lines.push(`| CTR | ${(num(latest.ctr) * 100).toFixed(2)}%${arrow(latest.ctr, prev?.ctr, false)} | |`);
  lines.push(`| 公式 CPC | ${officialOrDash(latest.cost_per_click, "¥")} | |`);
  lines.push(`| Viewability | ${(num(latest.viewability) * 100).toFixed(1)}%${arrow(latest.viewability, prev?.viewability, false)} | |`);
  lines.push(`| Ad Requests | ${officialOrDash(latest.ad_requests)} | |`);
  lines.push(`| Coverage | ${latest.ad_requests_coverage === "" || latest.ad_requests_coverage === undefined ? "-" : (num(latest.ad_requests_coverage) * 100).toFixed(1) + "%"} | |`);
  lines.push("");
  // 収益分解 (doc41 §7.2): Page RPM 単独で判断しない
  const pv = num(latest.page_views);
  const imp = num(latest.impressions);
  if (pv > 0) {
    lines.push("## 収益分解 (§7.2)");
    lines.push("");
    lines.push(`- Impression density (imp/PV): **${(imp / pv).toFixed(3)}**${prev ? ` (前週 ${(num(prev.impressions) / Math.max(num(prev.page_views), 1)).toFixed(3)})` : ""}`);
    lines.push(`- Viewable imp / PV: **${((imp * num(latest.viewability)) / pv).toFixed(3)}**`);
    lines.push(`- 公式 Imp RPM: ${officialOrDash(latest.impressions_rpm, "¥")} / 公式 CPC: ${officialOrDash(latest.cost_per_click, "¥")}`);
    lines.push("");
  }

  if (deviceHistory && deviceHistory.length > 0) {
    const weeks = [...new Set(deviceHistory.map((r) => r.week))].sort();
    const prevWeek = weeks.filter((w) => w < latest.week).pop() || null;
    const cur = deviceHistory.filter((r) => r.week === latest.week);
    const prevByPlatform = new Map(
      deviceHistory.filter((r) => r.week === prevWeek).map((r) => [r.platform, r])
    );
    const shortName = (p) =>
      /desktop/i.test(p) ? "Desktop"
        : /mobile/i.test(p) ? "Mobile"
          : /tablet/i.test(p) ? "Tablet"
            : p;
    const alerts = [];
    lines.push("## デバイス別（確定7日 / 前週比）");
    lines.push("");
    lines.push("| Platform | RPM | Viewability | 公式CPC | 収益/click(legacy) | imp/PV | Earnings |");
    lines.push("|---|---|---|---|---|---|---|");
    for (const d of cur) {
      const p = prevByPlatform.get(d.platform);
      const viewCur = num(d.viewability) * 100;
      const viewPrev = p ? num(p.viewability) * 100 : null;
      const viewPp = viewPrev != null ? viewCur - viewPrev : null;
      const viewPpStr =
        viewPp != null && Math.abs(viewPp) >= 3
          ? ` ${viewPp >= 0 ? "+" : ""}${viewPp.toFixed(1)}pp`
          : "";
      lines.push(
        `| ${shortName(d.platform)} | ¥${d.rpm}${arrow(d.rpm, p?.rpm, false)} | ` +
          `${viewCur.toFixed(1)}%${arrow(d.viewability, p?.viewability, false)}${viewPpStr} | ` +
          `${officialOrDash(d.cost_per_click, "¥")} | ¥${d.earnings_per_click_legacy} | ${d.imp_per_pv} | ¥${d.earnings}${pct(d.earnings, p?.earnings)} |`
      );
      // 8pp 以上の viewability 低下は「要確認の退行」として明示する。imp 200 未満はノイズ扱い。
      if (viewPp != null && viewPp <= -8 && num(d.impressions) >= 200) {
        alerts.push(
          `${shortName(d.platform)} viewability ${viewPp.toFixed(1)}pp（${viewPrev.toFixed(1)}%→${viewCur.toFixed(1)}%）`
        );
      }
    }
    lines.push("");
    if (alerts.length > 0) {
      lines.push(`> ⚠️ **要確認の退行**: ${alerts.join(" / ")}`);
      lines.push("");
    }
  }

  lines.push("履歴: [`history.csv`](./history.csv) / デバイス別: [`history-devices.csv`](./history-devices.csv) / 内訳: [`history-formats.csv`](./history-formats.csv)・[`history-placements.csv`](./history-placements.csv)・[`history-bid-types.csv`](./history-bid-types.csv)");
  lines.push("");
  lines.push("> schema v2 (2026-07-28・doc41 §2.1): 公式 `COST_PER_CLICK`/`IMPRESSIONS_RPM`/`AD_REQUESTS`/`AD_REQUESTS_COVERAGE` を追加。");
  lines.push("> 旧 `cpc` 列 (earnings/clicks) は**公式 CPC ではない**ため `earnings_per_click_legacy` へ改名した (値は不変)。");
  lines.push("> 公式値が無い過去週は `-` (null)。0 で埋めない。ESTIMATED_EARNINGS は月次確定まで変動しうる推定値。");
  lines.push("");
  return lines.join("\n");
}

function updateAdsense(week) {
  const snapDir = join(PROJECT_ROOT, SNAPSHOT_DIRS.adsense, week);
  if (!existsSync(snapDir)) {
    console.log(`[adsense] snapshot ${week} not found, skipping`);
    return;
  }
  const latest = aggregateAdsense(snapDir, week);
  if (!latest) {
    console.log("[adsense] aggregate failed (empty overview?), skipping");
    return;
  }
  const stateDir = join(PROJECT_ROOT, STATE_DIRS.adsense);
  mkdirSync(stateDir, { recursive: true });

  // account history v2 移行 (公式列追加・過去行は "" = null。値は不変)
  const histPath = join(stateDir, "history.csv");
  const existing = existsSync(histPath) ? (readCsv(histPath)?.rows ?? []) : [];
  const { rows: migrated, migrated: didMigrate } = migrateAdsenseHistoryRows(existing);
  if (didMigrate) {
    writeFileSync(histPath, toCsv(migrated, ADSENSE_HISTORY_FIELDS_V2), "utf-8");
    console.log(`[adsense] history.csv を schema v2 (公式CPC/impRPM列追加) へ移行 (${migrated.length} 行・値は不変)`);
  }

  const { _devices, ...row } = latest;
  const history = upsertHistory(histPath, ADSENSE_HISTORY_FIELDS_V2, row);
  let deviceHistory = null;
  if (_devices) {
    deviceHistory = writeAdsenseDeviceHistory(stateDir, week, _devices);
  }
  const breakdowns = writeAdsenseBreakdownHistories(stateDir, snapDir, week);
  writeFileSync(join(stateDir, "LATEST.md"), markdownAdsense(history, row, deviceHistory), "utf-8");
  console.log(
    `[adsense] updated history.csv (${history.length} weeks) and LATEST.md` +
      (deviceHistory ? ` + history-devices.csv (${deviceHistory.length} rows)` : "") +
      (breakdowns.length ? ` + ${breakdowns.join(" / ")}` : "")
  );
}

// ── メイン処理 ──

const UPDATERS = { gsc: updateGsc, ga4: updateGa4, adsense: updateAdsense };

function main() {
  const opts = parseArgs();
  const week = parseWeekArg();
  const targets = opts.source === "all" ? Object.keys(UPDATERS) : [opts.source];
  for (const key of targets) {
    if (!UPDATERS[key]) {
      console.error(`Unknown source: ${key}`);
      process.exit(2);
    }
    UPDATERS[key](week);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
