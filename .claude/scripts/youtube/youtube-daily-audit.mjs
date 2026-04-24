#!/usr/bin/env node
/**
 * YouTube 日次監査スクリプト（GitHub Actions `youtube-audit-daily.yml` から呼ばれる）
 *
 * 1. `diagnose-shadowban.js` を subprocess で実行して JSON 取得
 * 2. 生 JSON を `.claude/state/metrics/youtube/youtube-batch-<TIMESTAMP>.json` に保存
 * 3. `history.csv` に日次サマリ 1 行を append
 * 4. `LATEST.md` を前日比つきで更新
 * 5. pause.json / verdict に応じて Issue コメント or 新規起票
 *
 * Usage:
 *   node .claude/scripts/youtube/youtube-daily-audit.mjs            # 本番
 *   node .claude/scripts/youtube/youtube-daily-audit.mjs --dry-run  # snapshot のみ、Issue 操作は skip
 *
 * Exit code:
 *   0 = 正常終了（healthy / watch でも 0）
 *   1 = fatal error（API 失敗等）
 *   2 = input error（既存 snapshot なし時の読み取り失敗など）
 *
 * verdict=likely-shadowban は exit 0。Issue 起票するが workflow 自体は失敗させない
 * （PSI の threshold-check は exit 1 にするが、こちらは recovery 中の既知状態で毎日 alert されないよう設計）。
 */

import { spawnSync } from "node:child_process";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  appendFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = resolve(fileURLToPath(import.meta.url), "..", "..", "..", "..");
const STATE_DIR = join(PROJECT_ROOT, ".claude/state/metrics/youtube");
const HISTORY_CSV = join(STATE_DIR, "history.csv");
const LATEST_MD = join(STATE_DIR, "LATEST.md");
const PAUSE_JSON = join(PROJECT_ROOT, ".claude/state/youtube-pause.json");
const DIAGNOSE_SCRIPT = join(PROJECT_ROOT, ".claude/scripts/youtube/diagnose-shadowban.js");

const HISTORY_HEADER =
  "date,verdict,suspectCount,recentViews,priorViews,viewsDeltaPct,searchViews,shortsViews,suggestedViews,subsGained,subsLost";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");

function log(msg) {
  console.error(`[youtube-daily-audit] ${msg}`);
}

function ensureStateDir() {
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
  if (!existsSync(HISTORY_CSV)) writeFileSync(HISTORY_CSV, HISTORY_HEADER + "\n");
}

function runDiagnose() {
  const res = spawnSync("node", [DIAGNOSE_SCRIPT], {
    cwd: PROJECT_ROOT,
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
  });
  if (res.status !== 0) {
    log(`diagnose-shadowban.js failed (exit ${res.status}): ${res.stderr}`);
    process.exit(1);
  }
  try {
    return JSON.parse(res.stdout);
  } catch (err) {
    log(`diagnose-shadowban.js stdout was not valid JSON: ${err.message}`);
    log(`stdout head: ${res.stdout.slice(0, 500)}`);
    process.exit(1);
  }
}

function todayJSTDate() {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

function summaryRow(date, diag) {
  const rec = diag.subscriberDelta?.recent || {};
  const traffic = diag.trafficSourceBreakdown?.recent || {};
  const viewsDeltaPct = diag.viewsDelta?.changePct;
  return [
    date,
    diag.verdict,
    diag.suspectVideos?.length ?? 0,
    diag.viewsDelta?.recent ?? 0,
    diag.viewsDelta?.prior ?? 0,
    viewsDeltaPct == null ? "" : viewsDeltaPct.toFixed(2),
    traffic["YT_SEARCH"] ?? 0,
    traffic["SHORTS"] ?? 0,
    traffic["SUGGESTED_VIDEO"] ?? 0,
    rec.gained ?? 0,
    rec.lost ?? 0,
  ].join(",");
}

function readLastHistoryRows(n) {
  if (!existsSync(HISTORY_CSV)) return [];
  const lines = readFileSync(HISTORY_CSV, "utf-8").trim().split("\n");
  return lines.slice(1).slice(-n);
}

function parseHistoryRow(line) {
  const parts = line.split(",");
  return {
    date: parts[0],
    verdict: parts[1],
    suspectCount: Number(parts[2]),
    recentViews: Number(parts[3]),
    priorViews: Number(parts[4]),
    viewsDeltaPct: parts[5] === "" ? null : Number(parts[5]),
    searchViews: Number(parts[6]),
    shortsViews: Number(parts[7]),
    suggestedViews: Number(parts[8]),
    subsGained: Number(parts[9]),
    subsLost: Number(parts[10]),
  };
}

function arrow(current, previous) {
  if (previous == null || previous === 0) return "—";
  const delta = current - previous;
  if (delta === 0) return "→ 0";
  const sign = delta > 0 ? "↑" : "↓";
  return `${sign} ${delta > 0 ? "+" : ""}${delta}`;
}

function renderLatestMd(todayRow, prevRow, diag, pause) {
  const lines = [];
  lines.push(`# YouTube Daily Monitor — ${todayRow.date}`);
  lines.push("");
  lines.push(`- verdict: **${todayRow.verdict}**`);
  lines.push(`- suspect videos (48h+, views<50): **${todayRow.suspectCount}**`);
  if (pause) {
    lines.push(`- pause: until **${pause.until?.slice(0, 10)}** (issue #${pause.issue ?? "-"})`);
  }
  lines.push("");
  lines.push("## 前日比");
  lines.push("");
  lines.push("| 指標 | 今日 | 前回 | 変化 |");
  lines.push("|---|---:|---:|---|");
  if (prevRow) {
    lines.push(
      `| recent views (14d) | ${todayRow.recentViews} | ${prevRow.recentViews} | ${arrow(todayRow.recentViews, prevRow.recentViews)} |`,
    );
    lines.push(
      `| YT_SEARCH | ${todayRow.searchViews} | ${prevRow.searchViews} | ${arrow(todayRow.searchViews, prevRow.searchViews)} |`,
    );
    lines.push(
      `| SHORTS | ${todayRow.shortsViews} | ${prevRow.shortsViews} | ${arrow(todayRow.shortsViews, prevRow.shortsViews)} |`,
    );
    lines.push(
      `| SUGGESTED_VIDEO | ${todayRow.suggestedViews} | ${prevRow.suggestedViews} | ${arrow(todayRow.suggestedViews, prevRow.suggestedViews)} |`,
    );
    lines.push(
      `| subsGained | ${todayRow.subsGained} | ${prevRow.subsGained} | ${arrow(todayRow.subsGained, prevRow.subsGained)} |`,
    );
  } else {
    lines.push("| — | — | — | 初回計測 |");
  }
  lines.push("");
  lines.push("## チャンネル概況");
  lines.push("");
  const ch = diag.channel || {};
  lines.push(`- subs: ${ch.subscriberCount ?? "-"}`);
  lines.push(`- total views: ${ch.viewCount ?? "-"}`);
  lines.push(`- videos: ${ch.videoCount ?? "-"}`);
  lines.push("");
  if (diag.verdictReasons?.length) {
    lines.push("## Reasons");
    lines.push("");
    for (const r of diag.verdictReasons) lines.push(`- ${r}`);
    lines.push("");
  }
  lines.push("---");
  lines.push(`_Generated by \`.claude/scripts/youtube/youtube-daily-audit.mjs\` at ${new Date().toISOString()}_`);
  return lines.join("\n") + "\n";
}

function loadPause() {
  if (!existsSync(PAUSE_JSON)) return null;
  try {
    const p = JSON.parse(readFileSync(PAUSE_JSON, "utf-8"));
    if (!p.until) return null;
    if (new Date(p.until).getTime() <= Date.now()) return null;
    return p;
  } catch (err) {
    log(`invalid pause.json: ${err.message}`);
    return null;
  }
}

function oneLineComment(todayRow, prevRow) {
  const parts = [];
  parts.push(`verdict=**${todayRow.verdict}**`);
  parts.push(`suspect=${todayRow.suspectCount}`);
  parts.push(`recent views 14d=${todayRow.recentViews}`);
  if (prevRow) {
    const d = todayRow.recentViews - prevRow.recentViews;
    parts.push(`Δviews=${d > 0 ? "+" : ""}${d}`);
    const dSug = todayRow.suggestedViews - prevRow.suggestedViews;
    parts.push(`ΔSUGGESTED=${dSug > 0 ? "+" : ""}${dSug}`);
  }
  parts.push(`subs gained/lost=${todayRow.subsGained}/${todayRow.subsLost}`);
  return `📊 daily audit (${todayRow.date}): ${parts.join(" · ")}`;
}

function runGh(args) {
  const res = spawnSync("gh", args, { encoding: "utf-8", maxBuffer: 5 * 1024 * 1024 });
  if (res.status !== 0) {
    log(`gh ${args.join(" ")} failed: ${res.stderr}`);
    return null;
  }
  return res.stdout;
}

function commentOnIssue(issueNumber, body) {
  log(`comment on issue #${issueNumber}`);
  return runGh(["issue", "comment", String(issueNumber), "--body", body]);
}

function createAlertIssue(date, bodyMd) {
  const title = `[YouTube Alert] likely-shadowban ${date}`;
  const existingRaw = runGh([
    "issue",
    "list",
    "--state",
    "open",
    "--search",
    `"${title}" in:title`,
    "--json",
    "number",
  ]);
  if (existingRaw) {
    const existing = JSON.parse(existingRaw);
    if (existing.length > 0) {
      log(`alert issue already exists: #${existing[0].number}, skip creation`);
      return existing[0].number;
    }
  }
  const bodyFile = `/tmp/youtube-alert-${date}.md`;
  writeFileSync(bodyFile, bodyMd);
  const out = runGh([
    "issue",
    "create",
    "--title",
    title,
    "--label",
    "youtube-experiment,auto-generated",
    "--body-file",
    bodyFile,
  ]);
  if (out) log(`created alert issue: ${out.trim()}`);
  return out;
}

// --- main ---

ensureStateDir();

log(`running diagnose-shadowban.js (dry-run=${DRY_RUN})`);
const diag = runDiagnose();

const now = new Date();
const ts = now.toISOString().replace(/[:.]/g, "-");
const batchFile = join(STATE_DIR, `youtube-batch-${ts}.json`);
writeFileSync(batchFile, JSON.stringify(diag, null, 2));
log(`wrote batch: ${batchFile}`);

const date = todayJSTDate();
const row = summaryRow(date, diag);
appendFileSync(HISTORY_CSV, row + "\n");
log(`appended history row`);

const lastRows = readLastHistoryRows(2).map(parseHistoryRow);
const todayRow = lastRows[lastRows.length - 1];
const prevRow = lastRows.length >= 2 ? lastRows[lastRows.length - 2] : null;

const pause = loadPause();
const latestMd = renderLatestMd(todayRow, prevRow, diag, pause);
writeFileSync(LATEST_MD, latestMd);
log(`updated LATEST.md`);

// --- Issue 連携 ---

if (DRY_RUN) {
  log("dry-run: skipping Issue operations");
  log(`summary line: ${oneLineComment(todayRow, prevRow)}`);
  process.exit(0);
}

if (pause?.issue) {
  commentOnIssue(pause.issue, oneLineComment(todayRow, prevRow));
}

if (!pause && diag.verdict === "likely-shadowban") {
  const prevVerdict = prevRow?.verdict;
  if (prevVerdict && prevVerdict !== "likely-shadowban") {
    log(`state change ${prevVerdict} → likely-shadowban, creating alert issue`);
    createAlertIssue(date, latestMd);
  } else {
    log(`likely-shadowban continues from previous day (prev verdict=${prevVerdict ?? "none"}), skipping new alert`);
  }
}

log("done");
process.exit(0);
