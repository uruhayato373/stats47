/**
 * 週次メトリクスの history.csv と LATEST.md を更新する
 *
 * 引数:
 *   --week YYYY-Www（対象週。省略時は今日の週）
 *   --source gsc|ga4|adsense|all（デフォルト: all）
 *
 * 入力: .claude/skills/analytics/{gsc,ga4,adsense}-improvement/reference/snapshots/<YYYY-Www>/*.csv
 * 出力: .claude/state/metrics/{gsc,ga4,adsense}/history.csv (append)
 *       .claude/state/metrics/{gsc,ga4,adsense}/LATEST.md
 *
 * 既存の history.csv に同一週の行があれば skip（重複防止）。
 */

import { readFileSync, readdirSync, writeFileSync, existsSync, appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { PROJECT_ROOT, parseWeekArg, toCsv, csvEsc } from "./lib/auth.mjs";

const SOURCES = {
  gsc: {
    snapshotsDir: ".claude/skills/analytics/gsc-improvement/reference/snapshots",
    stateDir: ".claude/state/metrics/gsc",
    headerFields: ["week", "clicks", "impressions", "ctr", "position", "rows_queries", "rows_pages"],
    aggregate: aggregateGsc,
    markdown: markdownGsc,
  },
  ga4: {
    snapshotsDir: ".claude/skills/analytics/ga4-improvement/reference/snapshots",
    stateDir: ".claude/state/metrics/ga4",
    headerFields: ["week", "active_users", "new_users", "sessions", "pageviews", "avg_session_duration_sec", "bounce_rate"],
    aggregate: aggregateGa4,
    markdown: markdownGa4,
  },
  adsense: {
    snapshotsDir: ".claude/skills/analytics/adsense-improvement/reference/snapshots",
    stateDir: ".claude/state/metrics/adsense",
    headerFields: ["week", "earnings", "page_views", "rpm", "impressions", "clicks", "ctr", "viewability"],
    aggregate: aggregateAdsense,
    markdown: markdownAdsense,
  },
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

function readCsv(path) {
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

// ── GSC 集約 ──

function aggregateGsc(snapDir, week) {
  const daily = readCsv(join(snapDir, "daily.csv"));
  const queries = readCsv(join(snapDir, "queries.csv"));
  const pages = readCsv(join(snapDir, "pages.csv"));
  if (!daily) return null;

  let totalClicks = 0, totalImps = 0, ctrWeighted = 0, posWeighted = 0, impsTotal = 0;
  for (const r of daily.rows) {
    const c = num(r.clicks);
    const i = num(r.impressions);
    totalClicks += c;
    totalImps += i;
    ctrWeighted += num(r.ctr) * i;
    posWeighted += num(r.position) * i;
    impsTotal += i;
  }
  const ctr = impsTotal > 0 ? ctrWeighted / impsTotal : 0;
  const position = impsTotal > 0 ? posWeighted / impsTotal : 0;

  return {
    week,
    clicks: totalClicks,
    impressions: totalImps,
    ctr: ctr.toFixed(4),
    position: position.toFixed(2),
    rows_queries: queries?.rows.length ?? 0,
    rows_pages: pages?.rows.length ?? 0,
  };
}

function markdownGsc(history, latest) {
  const prev = history.length >= 2 ? history[history.length - 2] : null;
  const arrow = (cur, prv, betterLow) => {
    if (!prv) return "";
    const diff = num(cur) - num(prv);
    if (Math.abs(diff) < 0.01) return " ·";
    const improved = betterLow ? diff < 0 : diff > 0;
    return improved ? " ▲" : " ▼";
  };
  const delta = (cur, prv, pct = false) => {
    if (!prv) return "";
    const diff = num(cur) - num(prv);
    if (Math.abs(diff) < 0.01) return "";
    const pv = num(prv);
    if (pct && pv !== 0) {
      const p = ((diff / pv) * 100).toFixed(1);
      const sign = diff > 0 ? "+" : "";
      return ` (${sign}${p}%)`;
    }
    return "";
  };

  const lines = [];
  lines.push(`# GSC Latest — ${latest.week}`);
  lines.push("");
  lines.push("| Metric | 今週 | 前週比 |");
  lines.push("|---|---|---|");
  lines.push(`| Clicks | ${latest.clicks}${arrow(latest.clicks, prev?.clicks, false)} | ${delta(latest.clicks, prev?.clicks, true)} |`);
  lines.push(`| Impressions | ${latest.impressions}${arrow(latest.impressions, prev?.impressions, false)} | ${delta(latest.impressions, prev?.impressions, true)} |`);
  lines.push(`| CTR | ${(num(latest.ctr) * 100).toFixed(2)}%${arrow(latest.ctr, prev?.ctr, false)} | |`);
  lines.push(`| Avg Position | ${num(latest.position).toFixed(2)}${arrow(latest.position, prev?.position, true)} | |`);
  lines.push(`| Queries rows | ${latest.rows_queries} | |`);
  lines.push(`| Pages rows | ${latest.rows_pages} | |`);
  lines.push("");
  lines.push("履歴: [`history.csv`](./history.csv) (GitHub が表形式でレンダリング)");
  lines.push("");
  return lines.join("\n");
}

// ── GA4 集約 ──

function aggregateGa4(snapDir, week) {
  const overview = readCsv(join(snapDir, "overview.csv"));
  if (!overview || overview.rows.length === 0) return null;
  const r = overview.rows[0];
  return {
    week,
    active_users: num(r.activeUsers),
    new_users: num(r.newUsers),
    sessions: num(r.sessions),
    pageviews: num(r.screenPageViews),
    avg_session_duration_sec: num(r.averageSessionDuration).toFixed(1),
    bounce_rate: num(r.bounceRate).toFixed(4),
  };
}

function markdownGa4(history, latest) {
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
  lines.push(`# GA4 Latest — ${latest.week}`);
  lines.push("");
  lines.push("| Metric | 今週 | 前週比 |");
  lines.push("|---|---|---|");
  lines.push(`| Active Users | ${latest.active_users}${arrow(latest.active_users, prev?.active_users, false)} | ${pct(latest.active_users, prev?.active_users)} |`);
  lines.push(`| New Users | ${latest.new_users}${arrow(latest.new_users, prev?.new_users, false)} | ${pct(latest.new_users, prev?.new_users)} |`);
  lines.push(`| Sessions | ${latest.sessions}${arrow(latest.sessions, prev?.sessions, false)} | ${pct(latest.sessions, prev?.sessions)} |`);
  lines.push(`| Pageviews | ${latest.pageviews}${arrow(latest.pageviews, prev?.pageviews, false)} | ${pct(latest.pageviews, prev?.pageviews)} |`);
  lines.push(`| Avg Session (sec) | ${latest.avg_session_duration_sec}${arrow(latest.avg_session_duration_sec, prev?.avg_session_duration_sec, false)} | |`);
  lines.push(`| Bounce Rate | ${(num(latest.bounce_rate) * 100).toFixed(2)}%${arrow(latest.bounce_rate, prev?.bounce_rate, true)} | |`);
  lines.push("");
  lines.push("履歴: [`history.csv`](./history.csv)");
  lines.push("");
  return lines.join("\n");
}

// ── AdSense 集約 ──

function aggregateAdsense(snapDir, week) {
  const overview = readCsv(join(snapDir, "overview.csv"));
  if (!overview || overview.rows.length === 0) return null;
  const r = overview.rows[0];
  return {
    week,
    earnings: num(r.ESTIMATED_EARNINGS).toFixed(2),
    page_views: num(r.PAGE_VIEWS),
    rpm: num(r.PAGE_VIEWS_RPM).toFixed(3),
    impressions: num(r.IMPRESSIONS),
    clicks: num(r.CLICKS),
    ctr: num(r.IMPRESSIONS_CTR).toFixed(4),
    viewability: num(r.ACTIVE_VIEW_VIEWABILITY).toFixed(4),
  };
}

function markdownAdsense(history, latest) {
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
  lines.push("履歴: [`history.csv`](./history.csv)");
  lines.push("");
  return lines.join("\n");
}

// ── メイン処理 ──

function updateOne(key, week) {
  const cfg = SOURCES[key];
  const snapDir = join(PROJECT_ROOT, cfg.snapshotsDir, week);
  if (!existsSync(snapDir)) {
    console.log(`[${key}] snapshot ${week} not found at ${snapDir}, skipping`);
    return;
  }
  const latest = cfg.aggregate(snapDir, week);
  if (!latest) {
    console.log(`[${key}] aggregate failed (empty overview?), skipping`);
    return;
  }

  const stateDir = join(PROJECT_ROOT, cfg.stateDir);
  mkdirSync(stateDir, { recursive: true });
  const histPath = join(stateDir, "history.csv");
  const latestPath = join(stateDir, "LATEST.md");

  let history = [];
  if (existsSync(histPath)) {
    const h = readCsv(histPath);
    history = h?.rows ?? [];
  }

  // 重複行を除去
  history = history.filter((r) => r.week !== week);
  history.push(latest);
  history.sort((a, b) => (a.week < b.week ? -1 : 1));

  const csv = toCsv(history, cfg.headerFields);
  writeFileSync(histPath, csv, "utf-8");

  const md = cfg.markdown(history, latest);
  writeFileSync(latestPath, md, "utf-8");

  console.log(`[${key}] updated history.csv (${history.length} weeks) and LATEST.md`);
}

function main() {
  const opts = parseArgs();
  const week = parseWeekArg();
  const targets = opts.source === "all" ? Object.keys(SOURCES) : [opts.source];
  for (const key of targets) {
    if (!SOURCES[key]) {
      console.error(`Unknown source: ${key}`);
      process.exit(2);
    }
    updateOne(key, week);
  }
}

main();
