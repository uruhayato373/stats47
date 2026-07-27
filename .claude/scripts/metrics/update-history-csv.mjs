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

// ── AdSense (従来ロジック・期間契約の対象外) ──

const ADSENSE_FIELDS = ["week", "earnings", "page_views", "rpm", "impressions", "clicks", "ctr", "viewability"];
const ADSENSE_DEVICE_FIELDS = [
  "week", "platform", "earnings", "page_views", "rpm",
  "impressions", "clicks", "ctr", "viewability", "cpc", "imp_per_pv",
];

function aggregateAdsense(snapDir, week) {
  const overview = readCsv(join(snapDir, "overview.csv"));
  if (!overview || overview.rows.length === 0) return null;
  const r = overview.rows[0];
  const latest = {
    week,
    earnings: num(r.ESTIMATED_EARNINGS).toFixed(2),
    page_views: num(r.PAGE_VIEWS),
    rpm: num(r.PAGE_VIEWS_RPM).toFixed(3),
    impressions: num(r.IMPRESSIONS),
    clicks: num(r.CLICKS),
    ctr: num(r.IMPRESSIONS_CTR).toFixed(4),
    viewability: num(r.ACTIVE_VIEW_VIEWABILITY).toFixed(4),
  };
  const devices = readCsv(join(snapDir, "devices.csv"));
  if (devices && devices.rows.length > 0) {
    latest._devices = devices.rows.map((d) => {
      const earnings = num(d.ESTIMATED_EARNINGS);
      const pv = num(d.PAGE_VIEWS);
      const imp = num(d.IMPRESSIONS);
      const clicks = num(d.CLICKS);
      return {
        week,
        platform: d.PLATFORM_TYPE_NAME || "unknown",
        earnings: earnings.toFixed(2),
        page_views: pv,
        rpm: num(d.PAGE_VIEWS_RPM).toFixed(2),
        impressions: imp,
        clicks,
        ctr: num(d.IMPRESSIONS_CTR).toFixed(4),
        viewability: num(d.ACTIVE_VIEW_VIEWABILITY).toFixed(4),
        // CPC = 収益/click。viewable-CPM のレバーで、モバイルの click 無価値化を検知する
        cpc: clicks > 0 ? (earnings / clicks).toFixed(2) : "0.00",
        // imp_per_pv = 広告表示率。1 に近いほど枠が埋まっている
        imp_per_pv: pv > 0 ? (imp / pv).toFixed(3) : "0.000",
      };
    });
  }
  return latest;
}

function writeAdsenseDeviceHistory(stateDir, week, deviceRows) {
  const path = join(stateDir, "history-devices.csv");
  let rows = [];
  if (existsSync(path)) {
    rows = readCsv(path)?.rows ?? [];
  }
  rows = rows.filter((r) => r.week !== week);
  rows.push(...deviceRows);
  rows.sort((a, b) =>
    a.week !== b.week ? (a.week < b.week ? -1 : 1) : a.platform < b.platform ? -1 : 1
  );
  writeFileSync(path, toCsv(rows, ADSENSE_DEVICE_FIELDS), "utf-8");
  return rows;
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
  const lines = [];
  lines.push(`# AdSense Latest — ${latest.week}`);
  lines.push("");
  lines.push("| Metric | 今週 | 前週比 |");
  lines.push("|---|---|---|");
  lines.push(`| Earnings | ${latest.earnings}${arrow(latest.earnings, prev?.earnings, false)} | ${pct(latest.earnings, prev?.earnings)} |`);
  lines.push(`| Page Views | ${latest.page_views}${arrow(latest.page_views, prev?.page_views, false)} | ${pct(latest.page_views, prev?.page_views)} |`);
  lines.push(`| RPM | ${latest.rpm}${arrow(latest.rpm, prev?.rpm, false)} | |`);
  lines.push(`| Impressions | ${latest.impressions}${arrow(latest.impressions, prev?.impressions, false)} | ${pct(latest.impressions, prev?.impressions)} |`);
  lines.push(`| Clicks | ${latest.clicks}${arrow(latest.clicks, prev?.clicks, false)} | ${pct(latest.clicks, prev?.clicks)} |`);
  lines.push(`| CTR | ${(num(latest.ctr) * 100).toFixed(2)}%${arrow(latest.ctr, prev?.ctr, false)} | |`);
  lines.push(`| Viewability | ${(num(latest.viewability) * 100).toFixed(1)}%${arrow(latest.viewability, prev?.viewability, false)} | |`);
  lines.push("");

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
    lines.push("## デバイス別（今週 / 前週比）");
    lines.push("");
    lines.push("| Platform | RPM | Viewability | CPC | imp/PV | Earnings |");
    lines.push("|---|---|---|---|---|---|");
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
          `¥${d.cpc} | ${d.imp_per_pv} | ¥${d.earnings}${pct(d.earnings, p?.earnings)} |`
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

  lines.push("履歴: [`history.csv`](./history.csv) / デバイス別: [`history-devices.csv`](./history-devices.csv)");
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
  const { _devices, ...row } = latest;
  const history = upsertHistory(join(stateDir, "history.csv"), ADSENSE_FIELDS, row);
  let deviceHistory = null;
  if (_devices) {
    deviceHistory = writeAdsenseDeviceHistory(stateDir, week, _devices);
  }
  writeFileSync(join(stateDir, "LATEST.md"), markdownAdsense(history, row, deviceHistory), "utf-8");
  console.log(
    `[adsense] updated history.csv (${history.length} weeks) and LATEST.md` +
      (deviceHistory ? ` + history-devices.csv (${deviceHistory.length} rows)` : "")
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
