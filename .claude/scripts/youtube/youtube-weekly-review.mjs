#!/usr/bin/env node
/**
 * YouTube Weekly Review
 *
 * 直近 7 日 + 前 7 日の history.csv から前週比サマリを生成し、
 * .claude/state/metrics/youtube/LATEST.md に `## Weekly Review YYYY-Www` セクションを追記更新する。
 *
 * `docs/10_SNS戦略/06_YouTube運用Playbook.md` の routine 定義に基づく。
 *
 * 開いている [YouTube Recovery] issue があれば同サマリを gh issue comment で投稿。
 *
 * 使い方:
 *   node .claude/scripts/youtube/youtube-weekly-review.mjs
 *   node .claude/scripts/youtube/youtube-weekly-review.mjs --week 2026-W20
 *   node .claude/scripts/youtube/youtube-weekly-review.mjs --dry-run
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

const HISTORY_PATH = path.join(PROJECT_ROOT, ".claude/state/metrics/youtube/history.csv");
const LATEST_PATH = path.join(PROJECT_ROOT, ".claude/state/metrics/youtube/LATEST.md");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const WEEK_ARG = (() => {
  const i = args.indexOf("--week");
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
})();

function getIsoWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

const STRING_COLUMNS = new Set(["date", "verdict"]);

function parseCsv(text) {
  const lines = text.trim().split("\n");
  const header = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row = {};
    header.forEach((h, i) => {
      const v = cells[i];
      row[h] = STRING_COLUMNS.has(h) ? v : (v === "" ? 0 : parseFloat(v));
    });
    return row;
  });
}

function average(rows, key) {
  if (rows.length === 0) return 0;
  const sum = rows.reduce((s, r) => s + (r[key] || 0), 0);
  return sum / rows.length;
}

function pct(curr, prev) {
  if (prev === 0) return curr === 0 ? 0 : 100;
  return ((curr - prev) / prev) * 100;
}

function fmtPct(n) {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function arrow(n) {
  if (n > 5) return "▲";
  if (n < -5) return "▼";
  return "→";
}

function buildSummary(weekId, recent7, prev7) {
  const r = {
    views: average(recent7, "recentViews"),
    suspect: average(recent7, "suspectCount"),
    search: average(recent7, "searchViews"),
    shorts: average(recent7, "shortsViews"),
    suggested: average(recent7, "suggestedViews"),
    gained: recent7.reduce((s, x) => s + (x.subsGained || 0), 0),
    lost: recent7.reduce((s, x) => s + (x.subsLost || 0), 0),
  };
  const p = {
    views: average(prev7, "recentViews"),
    suspect: average(prev7, "suspectCount"),
    search: average(prev7, "searchViews"),
    shorts: average(prev7, "shortsViews"),
    suggested: average(prev7, "suggestedViews"),
    gained: prev7.reduce((s, x) => s + (x.subsGained || 0), 0),
    lost: prev7.reduce((s, x) => s + (x.subsLost || 0), 0),
  };

  const verdictCounts = recent7.reduce((acc, x) => {
    acc[x.verdict] = (acc[x.verdict] || 0) + 1;
    return acc;
  }, {});
  const verdicts = Object.entries(verdictCounts)
    .map(([v, c]) => `${v}: ${c}日`)
    .join(", ");

  const lines = [];
  lines.push(`## Weekly Review ${weekId}`);
  lines.push("");
  lines.push(`期間: 直近 7 日 (${recent7[0]?.date} 〜 ${recent7[recent7.length - 1]?.date}) vs 前 7 日`);
  lines.push("");
  lines.push("| 指標 | 直近7日 平均 | 前7日 平均 | 変化 |");
  lines.push("|---|---:|---:|---|");
  lines.push(`| recent views (14d 平均) | ${r.views.toFixed(0)} | ${p.views.toFixed(0)} | ${arrow(pct(r.views, p.views))} ${fmtPct(pct(r.views, p.views))} |`);
  lines.push(`| YT_SEARCH | ${r.search.toFixed(0)} | ${p.search.toFixed(0)} | ${arrow(pct(r.search, p.search))} ${fmtPct(pct(r.search, p.search))} |`);
  lines.push(`| SHORTS | ${r.shorts.toFixed(0)} | ${p.shorts.toFixed(0)} | ${arrow(pct(r.shorts, p.shorts))} ${fmtPct(pct(r.shorts, p.shorts))} |`);
  lines.push(`| SUGGESTED | ${r.suggested.toFixed(0)} | ${p.suggested.toFixed(0)} | ${arrow(pct(r.suggested, p.suggested))} ${fmtPct(pct(r.suggested, p.suggested))} |`);
  lines.push(`| suspect videos (平均) | ${r.suspect.toFixed(1)} | ${p.suspect.toFixed(1)} | ${arrow(pct(p.suspect, r.suspect))} ${fmtPct(pct(p.suspect, r.suspect))} |`);
  lines.push(`| subs net (gained - lost) | ${r.gained - r.lost} | ${p.gained - p.lost} | — |`);
  lines.push("");
  lines.push(`Verdict 内訳: ${verdicts}`);
  lines.push("");
  lines.push(`参照: [docs/10_SNS戦略/06_YouTube運用Playbook.md](../../../docs/10_SNS戦略/06_YouTube運用Playbook.md)`);
  lines.push("");
  return lines.join("\n");
}

function upsertWeeklySection(latest, weekId, summary) {
  const marker = `## Weekly Review ${weekId}`;
  if (latest.includes(marker)) {
    const re = new RegExp(`${marker}[\\s\\S]*?(?=\\n## |$)`, "");
    return latest.replace(re, summary);
  }
  const insertAt = latest.indexOf("\n---\n_Generated by");
  if (insertAt >= 0) {
    return latest.slice(0, insertAt) + "\n" + summary + latest.slice(insertAt);
  }
  return latest + "\n\n" + summary;
}

function findOpenRecoveryIssue() {
  try {
    const json = execSync(
      `gh issue list --label youtube-alert --state open --search "Recovery in:title" --json number,title --limit 5`,
      { encoding: "utf-8" }
    );
    const arr = JSON.parse(json);
    return arr.find((x) => x.title.includes("YouTube Recovery"));
  } catch {
    return null;
  }
}

function main() {
  if (!existsSync(HISTORY_PATH)) {
    console.error(`history.csv not found: ${HISTORY_PATH}`);
    process.exit(1);
  }
  const rows = parseCsv(readFileSync(HISTORY_PATH, "utf-8"));
  rows.sort((a, b) => (a.date < b.date ? -1 : 1));
  if (rows.length < 2) {
    console.error(`history.csv has only ${rows.length} rows (need ≥ 2)`);
    process.exit(1);
  }
  const windowSize = Math.min(7, Math.floor(rows.length / 2));
  const recent7 = rows.slice(-windowSize);
  const prev7 = rows.slice(-windowSize * 2, -windowSize);
  const weekId = WEEK_ARG || getIsoWeek();
  const summary = buildSummary(weekId, recent7, prev7);

  if (DRY_RUN) {
    console.log(summary);
    return;
  }

  const latest = existsSync(LATEST_PATH) ? readFileSync(LATEST_PATH, "utf-8") : "";
  const updated = upsertWeeklySection(latest, weekId, summary);
  writeFileSync(LATEST_PATH, updated, "utf-8");
  console.log(`✓ Updated ${LATEST_PATH} with Weekly Review ${weekId}`);

  const recovery = findOpenRecoveryIssue();
  if (recovery) {
    try {
      execSync(`gh issue comment ${recovery.number} --body-file -`, {
        input: summary,
        encoding: "utf-8",
        stdio: ["pipe", "inherit", "inherit"],
      });
      console.log(`✓ Commented on #${recovery.number}`);
    } catch (e) {
      console.error(`Failed to comment on #${recovery.number}: ${e.message}`);
    }
  } else {
    console.log("No open YouTube Recovery issue to comment on.");
  }
}

main();
