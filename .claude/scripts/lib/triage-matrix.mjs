#!/usr/bin/env node
/**
 * 改善ログ pending|in-progress エントリを Tier × 期日マトリクスで可視化する CLI ツール。
 *
 * scan-pending-improvements.mjs を child_process で呼び、JSON output を受け取り、
 * markdown / csv / matrix の 3 つの形式で出力する。
 *
 * Usage:
 *   node .claude/scripts/lib/triage-matrix.mjs --format markdown   # 素通し (scan の markdown)
 *   node .claude/scripts/lib/triage-matrix.mjs --format csv        # CSV (1 行ヘッダー + データ)
 *   node .claude/scripts/lib/triage-matrix.mjs --format matrix     # Tier × 期日カテゴリ集計
 *   node .claude/scripts/lib/triage-matrix.mjs --week 2026-W21    # 基準週 (ISO 8601, default 今週)
 *
 * 期日カテゴリ (matrix モード, 今日基準):
 *   - 今週: due <= 今週日曜
 *   - 来週: 今週日曜 < due <= 来週日曜
 *   - 来来週: 来週日曜 < due <= 来来週日曜
 *   - 超過: deployed_at から 14 日以上経過 & status=pending (due 無関係)
 *   - 未定: due が null
 *
 * 関連:
 *   .claude/scripts/lib/scan-pending-improvements.mjs (依存)
 *   .claude/skills/management/triage-improvement-log/SKILL.md (UX レイヤー)
 */

import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const SCAN_SCRIPT = path.join(
  PROJECT_ROOT,
  ".claude",
  "scripts",
  "lib",
  "scan-pending-improvements.mjs",
);

const args = process.argv.slice(2);
function getArg(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

const FORMAT = getArg("--format") || "markdown";
const WEEK = getArg("--week"); // YYYY-Www (ISO 8601), default 今週

// ===== 日付ユーティリティ =====

function todayUTC() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function parseISODate(s) {
  return new Date(s + "T00:00:00Z");
}

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(d, n) {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

/**
 * ISO 8601 週番号 (YYYY-Www) → その週の日曜 (週末) を返す。
 * ISO 8601 は月曜始まり → その週の日曜は (月曜 + 6 日)。
 */
function isoWeekToSunday(isoWeek) {
  const m = isoWeek.match(/^(\d{4})-W(\d{2})$/);
  if (!m) throw new Error(`Invalid week format: ${isoWeek} (expected YYYY-Www)`);
  const year = Number(m[1]);
  const week = Number(m[2]);
  // ISO 8601: Week 1 は 1/4 を含む週
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Dow = jan4.getUTCDay() || 7; // 1=Mon, 7=Sun
  const week1Monday = addDays(jan4, 1 - jan4Dow);
  const targetMonday = addDays(week1Monday, (week - 1) * 7);
  return addDays(targetMonday, 6); // Sunday
}

/**
 * 今週の日曜 (UTC) を返す。
 */
function thisSunday(base = todayUTC()) {
  const dow = base.getUTCDay(); // 0=Sun ... 6=Sat
  const daysUntilSun = dow === 0 ? 0 : 7 - dow;
  return addDays(base, daysUntilSun);
}

/**
 * 期日カテゴリ判定。
 * 戻り値: '今週' | '来週' | '来来週' | '超過' | '未定'
 */
function classifyDue(entry, baseSunday, today) {
  // 超過: deployed_at から 14 日以上経過 & status=pending
  if (
    entry.status === "pending" &&
    entry.overdue_days !== null &&
    entry.overdue_days >= 14
  ) {
    return "超過";
  }
  // 未定: due が null
  if (!entry.due) return "未定";

  const due = parseISODate(entry.due);
  const week2 = addDays(baseSunday, 7);
  const week3 = addDays(baseSunday, 14);
  if (due <= baseSunday) return "今週";
  if (due <= week2) return "来週";
  if (due <= week3) return "来来週";
  return "未定"; // 3 週超先は「未定」として集約 (重要度が低い)
}

// ===== scan-pending-improvements.mjs 呼び出し =====

function loadEntries() {
  const stdout = execFileSync(
    "node",
    [SCAN_SCRIPT],
    { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 },
  );
  return JSON.parse(stdout);
}

function loadMarkdown() {
  return execFileSync(
    "node",
    [SCAN_SCRIPT, "--format", "markdown"],
    { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 },
  );
}

// ===== Format: markdown (素通し) =====

function formatMarkdown() {
  return loadMarkdown();
}

// ===== Format: csv =====

function csvEscape(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[,"\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function formatCSV(entries) {
  const header = "tier,status,id,title,deployed_at,due,overdue_days,owner,metric";
  const rows = entries.map((e) =>
    [
      e.tier ?? "",
      e.status,
      e.section_id,
      e.title,
      e.deployed_at ?? "",
      e.due ?? "",
      e.overdue_days ?? "",
      e.owner ?? "",
      e.metric,
    ]
      .map(csvEscape)
      .join(","),
  );
  return [header, ...rows].join("\n") + "\n";
}

// ===== Format: matrix =====

function formatMatrix(entries, baseSunday, today) {
  // Tier (1/2/3/その他) × 期日カテゴリ (今週/来週/来来週/超過/未定)
  const tiers = [1, 2, 3];
  const categories = ["今週", "来週", "来来週", "超過", "未定"];
  const counts = new Map();
  for (const t of tiers) {
    counts.set(t, Object.fromEntries(categories.map((c) => [c, 0])));
  }
  // tier=null/その他 (4+) は tier=3 にまとめる
  for (const e of entries) {
    const tier = tiers.includes(e.tier) ? e.tier : 3;
    const cat = classifyDue(e, baseSunday, today);
    counts.get(tier)[cat]++;
  }

  const lines = [];
  lines.push(
    `### Tier × 期日マトリクス (基準: 今日=${toISODate(today)}, 今週日曜=${toISODate(baseSunday)})`,
  );
  lines.push("");
  lines.push(`| Tier | ${categories.join(" | ")} |`);
  lines.push(`|---|${categories.map(() => "---").join("|")}|`);
  for (const t of tiers) {
    const row = counts.get(t);
    lines.push(`| ${t} | ${categories.map((c) => row[c]).join(" | ")} |`);
  }
  lines.push("");

  // 自動アクション提案
  const overduePending = entries.filter(
    (e) =>
      e.status === "pending" &&
      e.overdue_days !== null &&
      e.overdue_days >= 14,
  );
  const dueOverdueInProgress = entries.filter(
    (e) =>
      e.status === "in-progress" &&
      e.due &&
      parseISODate(e.due) < today,
  );

  lines.push("### 自動アクション提案");
  lines.push("");
  if (overduePending.length === 0 && dueOverdueInProgress.length === 0) {
    lines.push("_アクション対象なし_");
  } else {
    for (const e of overduePending) {
      lines.push(
        `- **${e.section_id}** (${e.metric}, tier ${e.tier ?? "-"}, deployed ${e.deployed_at}, ${e.overdue_days}d): 期限切れ警告: 検証コマンド実行 or due 延長 → [${e.deep_link}](${e.deep_link})`,
      );
    }
    for (const e of dueOverdueInProgress) {
      lines.push(
        `- **${e.section_id}** (${e.metric}, tier ${e.tier ?? "-"}, due ${e.due}): effect 判定実施を本週内に → [${e.deep_link}](${e.deep_link})`,
      );
    }
  }
  lines.push("");
  return lines.join("\n");
}

// ===== Main =====

function main() {
  if (FORMAT === "markdown") {
    process.stdout.write(formatMarkdown());
    return;
  }

  const entries = loadEntries();

  if (FORMAT === "csv") {
    process.stdout.write(formatCSV(entries));
    return;
  }

  if (FORMAT === "matrix") {
    const today = todayUTC();
    const baseSunday = WEEK ? isoWeekToSunday(WEEK) : thisSunday(today);
    process.stdout.write(formatMatrix(entries, baseSunday, today));
    return;
  }

  console.error(`Unknown --format: ${FORMAT} (expected markdown|csv|matrix)`);
  process.exit(1);
}

main();
