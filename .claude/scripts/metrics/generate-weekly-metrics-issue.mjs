/**
 * 週次統合 Issue [Weekly Metrics] YYYY-Www の本文を生成する
 *
 * 引数:
 *   --week YYYY-Www (省略時は今日の 1 日前の ISO 週 = 月曜朝に回すと先週)
 *
 * 生成物:
 *   - stdout に markdown body を出力
 *   - workflow 側で gh issue create --body-file でそのまま使える
 *
 * 入力:
 *   - .claude/state/metrics/{psi,gsc,ga4,adsense}/history.csv
 *   - gh issue list --label auto-generated / effect/pending (gh CLI 経由)
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { PROJECT_ROOT, toIsoWeek } from "./lib/auth.mjs";

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { week: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--week") opts.week = args[++i];
    else if (/^\d{4}-W\d{2}$/.test(args[i])) opts.week = args[i];
  }
  if (!opts.week) {
    // デフォルト: 昨日の ISO 週（月曜朝に回すと先週）
    const d = new Date();
    d.setDate(d.getDate() - 1);
    opts.week = toIsoWeek(d);
  }
  return opts;
}

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

function readCsv(relPath) {
  const p = join(PROJECT_ROOT, relPath);
  if (!existsSync(p)) return null;
  const raw = readFileSync(p, "utf-8").trim();
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

function num(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function arrow(cur, prv, betterLow) {
  if (cur == null || prv == null) return "";
  const diff = cur - prv;
  if (Math.abs(diff) < 0.01) return " ·";
  const improved = betterLow ? diff < 0 : diff > 0;
  return improved ? " ▲" : " ▼";
}

function pctDelta(cur, prv) {
  if (cur == null || prv == null || prv === 0) return "";
  const p = (((cur - prv) / prv) * 100).toFixed(1);
  const sign = cur >= prv ? "+" : "";
  return ` (${sign}${p}%)`;
}

function monOfWeek(week) {
  // ISO week: YYYY-Www → Monday date
  const [yearStr, wStr] = week.split("-W");
  const year = Number(yearStr);
  const w = Number(wStr);
  // Jan 4 is always in week 1
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Mon = new Date(jan4);
  week1Mon.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
  const target = new Date(week1Mon);
  target.setUTCDate(week1Mon.getUTCDate() + (w - 1) * 7);
  return target;
}

function ghIssueList(args) {
  try {
    const out = execSync(`gh issue list ${args} --json number,title,labels,createdAt,url --limit 50`, {
      encoding: "utf-8",
    });
    return JSON.parse(out);
  } catch (e) {
    console.error(`[gh issue list failed] ${e.message}`);
    return [];
  }
}

function gsSection(week) {
  const hist = readCsv(".claude/state/metrics/gsc/history.csv");
  if (!hist) return "_GSC: history.csv が存在しません（CI 未実行？）_\n";
  const target = hist.rows.find((r) => r.week === week);
  const idx = target ? hist.rows.indexOf(target) : -1;
  const prev = idx > 0 ? hist.rows[idx - 1] : null;
  if (!target) return `_GSC: ${week} の行が見つかりません_\n`;
  const lines = [];
  lines.push(`- Clicks: **${num(target.clicks)}**${arrow(num(target.clicks), num(prev?.clicks), false)}${pctDelta(num(target.clicks), num(prev?.clicks))}`);
  lines.push(`- Impressions: **${num(target.impressions)}**${arrow(num(target.impressions), num(prev?.impressions), false)}${pctDelta(num(target.impressions), num(prev?.impressions))}`);
  lines.push(`- CTR: **${(num(target.ctr) * 100).toFixed(2)}%**${arrow(num(target.ctr), num(prev?.ctr), false)}`);
  lines.push(`- Avg Position: **${num(target.position).toFixed(2)}**${arrow(num(target.position), num(prev?.position), true)}`);
  return lines.join("\n") + "\n";
}

function ga4Section(week) {
  const hist = readCsv(".claude/state/metrics/ga4/history.csv");
  if (!hist) return "_GA4: history.csv が存在しません_\n";
  const target = hist.rows.find((r) => r.week === week);
  const idx = target ? hist.rows.indexOf(target) : -1;
  const prev = idx > 0 ? hist.rows[idx - 1] : null;
  if (!target) return `_GA4: ${week} の行が見つかりません_\n`;
  const lines = [];
  lines.push(`- Active Users: **${num(target.active_users)}**${arrow(num(target.active_users), num(prev?.active_users), false)}${pctDelta(num(target.active_users), num(prev?.active_users))}`);
  lines.push(`- Sessions: **${num(target.sessions)}**${arrow(num(target.sessions), num(prev?.sessions), false)}${pctDelta(num(target.sessions), num(prev?.sessions))}`);
  lines.push(`- Pageviews: **${num(target.pageviews)}**${arrow(num(target.pageviews), num(prev?.pageviews), false)}${pctDelta(num(target.pageviews), num(prev?.pageviews))}`);
  lines.push(`- Avg Session Duration: **${num(target.avg_session_duration_sec).toFixed(1)}s**${arrow(num(target.avg_session_duration_sec), num(prev?.avg_session_duration_sec), false)}`);
  lines.push(`- Bounce Rate: **${(num(target.bounce_rate) * 100).toFixed(2)}%**${arrow(num(target.bounce_rate), num(prev?.bounce_rate), true)}`);
  return lines.join("\n") + "\n";
}

function adsenseSection(week) {
  const hist = readCsv(".claude/state/metrics/adsense/history.csv");
  if (!hist) return "_AdSense: history.csv が存在しません_\n";
  const target = hist.rows.find((r) => r.week === week);
  const idx = target ? hist.rows.indexOf(target) : -1;
  const prev = idx > 0 ? hist.rows[idx - 1] : null;
  if (!target) return `_AdSense: ${week} の行が見つかりません_\n`;
  const lines = [];
  lines.push(`- Earnings: **${num(target.earnings)}**${arrow(num(target.earnings), num(prev?.earnings), false)}${pctDelta(num(target.earnings), num(prev?.earnings))}`);
  lines.push(`- Page Views: **${num(target.page_views)}**${arrow(num(target.page_views), num(prev?.page_views), false)}${pctDelta(num(target.page_views), num(prev?.page_views))}`);
  lines.push(`- RPM: **${num(target.rpm).toFixed(2)}**${arrow(num(target.rpm), num(prev?.rpm), false)}`);
  lines.push(`- Clicks: **${num(target.clicks)}**${arrow(num(target.clicks), num(prev?.clicks), false)}`);
  lines.push(`- CTR: **${(num(target.ctr) * 100).toFixed(2)}%**${arrow(num(target.ctr), num(prev?.ctr), false)}`);
  lines.push(`- Viewability: **${(num(target.viewability) * 100).toFixed(1)}%**${arrow(num(target.viewability), num(prev?.viewability), false)}`);
  return lines.join("\n") + "\n";
}

// PSI は日次。直近 7 日の URL × strategy × day を集約
function psiSection(week) {
  const hist = readCsv(".claude/state/metrics/psi/history.csv");
  if (!hist) return "_PSI: history.csv が存在しません（日次 CI 未実行？）_\n";

  const weekMon = monOfWeek(week);
  const weekSun = new Date(weekMon);
  weekSun.setUTCDate(weekMon.getUTCDate() + 6);
  const mondayStr = weekMon.toISOString().slice(0, 10);
  const sundayStr = weekSun.toISOString().slice(0, 10);

  const weekRows = hist.rows.filter((r) => r.date >= mondayStr && r.date <= sundayStr);
  if (weekRows.length === 0) return `_PSI: ${week} (${mondayStr} 〜 ${sundayStr}) の計測行なし_\n`;

  // URL × strategy ごとに平均 perf / LCP / CLS を計算
  const byKey = new Map();
  for (const r of weekRows) {
    const key = `${r.url}|${r.strategy}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(r);
  }

  let totalErr = 0, totalWarn = 0;
  const worstLcp = []; // {path, strategy, lcp}
  for (const [key, rows] of byKey) {
    const [url, strategy] = key.split("|");
    for (const r of rows) {
      totalErr += num(r.violations_error) ?? 0;
      totalWarn += num(r.violations_warning) ?? 0;
    }
    const lcpAvg = rows.reduce((s, r) => s + (num(r.lcp_ms) ?? 0), 0) / rows.length;
    const path = url.replace(/^https?:\/\/[^/]+/, "") || "/";
    worstLcp.push({ path, strategy, lcp: lcpAvg });
  }
  worstLcp.sort((a, b) => b.lcp - a.lcp);

  const lines = [];
  lines.push(`- 計測日数: **${new Set(weekRows.map((r) => r.date)).size}日** / 対象 ${byKey.size} 組`);
  lines.push(`- 週間累積違反: **error ${totalErr} / warning ${totalWarn}**`);
  lines.push("");
  lines.push("**LCP ワースト 5（週平均）:**");
  lines.push("");
  lines.push("| URL | Strategy | LCP (avg ms) |");
  lines.push("|---|---|---|");
  for (const w of worstLcp.slice(0, 5)) {
    lines.push(`| ${w.path} | ${w.strategy} | ${Math.round(w.lcp)} |`);
  }
  return lines.join("\n") + "\n";
}

function alertsSection(week) {
  const weekMon = monOfWeek(week);
  const weekMonStr = weekMon.toISOString().slice(0, 10);
  const nextMon = new Date(weekMon);
  nextMon.setUTCDate(nextMon.getUTCDate() + 7);
  const nextMonStr = nextMon.toISOString().slice(0, 10);

  const alerts = ghIssueList(
    `--label auto-generated --state all --search "created:${weekMonStr}..${nextMonStr}"`
  );
  if (alerts.length === 0) return "今週 auto-generated な閾値違反 Issue はありません。\n";
  const lines = [];
  for (const a of alerts) {
    const labels = a.labels.map((l) => l.name).join(", ");
    const state = a.labels.some((l) => l.name === "archive") ? "archived" : "active";
    lines.push(`- #${a.number} ${a.title} _(${labels})_`);
  }
  return lines.join("\n") + "\n";
}

function pendingSection() {
  const pending = ghIssueList(`--label effect/pending --state open`);
  if (pending.length === 0) return "なし（全施策が効果判定済み）\n";
  const lines = [];
  const now = Date.now();
  const sorted = pending.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  for (const p of sorted) {
    const created = new Date(p.createdAt);
    const days = Math.floor((now - created.getTime()) / 86400000);
    const typeLabel = p.labels.find((l) => /-improvement$/.test(l.name))?.name ?? "";
    const marker = days >= 14 ? " 👀" : "";
    lines.push(`- #${p.number} ${p.title} — ${days}日経過${marker} _(${typeLabel})_`);
  }
  return lines.join("\n") + "\n";
}

function main() {
  const { week } = parseArgs();
  const lines = [];
  lines.push(`# Weekly Metrics — ${week}`);
  lines.push("");
  lines.push(`生成時刻: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## 🚀 PSI（日次計測、週間集計）");
  lines.push("");
  lines.push(psiSection(week));
  lines.push("## 🔎 GSC（検索パフォーマンス）");
  lines.push("");
  lines.push(gsSection(week));
  lines.push("## 📊 GA4（サイトアクセス）");
  lines.push("");
  lines.push(ga4Section(week));
  lines.push("## 💰 AdSense（広告収益）");
  lines.push("");
  lines.push(adsenseSection(week));
  lines.push("## 🚨 今週の自動起票 Issue（閾値違反）");
  lines.push("");
  lines.push(alertsSection(week));
  lines.push("## ⏳ 効果判定待ち施策（effect/pending）");
  lines.push("");
  lines.push("14 日経過は 👀 マーク → 効果判定を進めるべき候補");
  lines.push("");
  lines.push(pendingSection());
  lines.push("---");
  lines.push("");
  lines.push(`生データ:`);
  lines.push(`- [PSI history.csv](../blob/develop/.claude/state/metrics/psi/history.csv) / [LATEST.md](../blob/develop/.claude/state/metrics/psi/LATEST.md)`);
  lines.push(`- [GSC history.csv](../blob/develop/.claude/state/metrics/gsc/history.csv) / [LATEST.md](../blob/develop/.claude/state/metrics/gsc/LATEST.md)`);
  lines.push(`- [GA4 history.csv](../blob/develop/.claude/state/metrics/ga4/history.csv) / [LATEST.md](../blob/develop/.claude/state/metrics/ga4/LATEST.md)`);
  lines.push(`- [AdSense history.csv](../blob/develop/.claude/state/metrics/adsense/history.csv) / [LATEST.md](../blob/develop/.claude/state/metrics/adsense/LATEST.md)`);
  lines.push("");

  process.stdout.write(lines.join("\n"));
}

main();
