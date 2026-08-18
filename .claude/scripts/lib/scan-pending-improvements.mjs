#!/usr/bin/env node
/**
 * .claude/todo/improvements.md のマークダウンテーブルを走査し、
 * status: pending|in-progress|effect/pending な active 施策を抽出する。
 *
 * weekly-plan の自動候補抽出と、triage-matrix.mjs の両方で利用する。
 *
 * Usage:
 *   node .claude/scripts/lib/scan-pending-improvements.mjs                    # 全 active 施策を JSON 出力
 *   node .claude/scripts/lib/scan-pending-improvements.mjs --format markdown  # Markdown 表で出力
 *   node .claude/scripts/lib/scan-pending-improvements.mjs --due-before 2026-05-24
 *   node .claude/scripts/lib/scan-pending-improvements.mjs --tier 1,2
 *   node .claude/scripts/lib/scan-pending-improvements.mjs --status pending
 *   node .claude/scripts/lib/scan-pending-improvements.mjs --overdue-days 14   # deploy から 14 日以上経過
 *
 * 環境変数:
 *   IMPROVEMENT_BACKLOG_PATH … バックログのパスを差し替える (fixture 検証用。既定は .claude/todo/04)
 *
 * Output JSON schema:
 *   [
 *     {
 *       metric: "gsc",
 *       file: ".claude/todo/improvements.md",
 *       section_id: "BLOG-CTR-02",
 *       title: "SEO タイトル改修 ...",
 *       status: "pending",
 *       tier: 1,
 *       target_metric: "gsc",
 *       due: "2026-06-13",
 *       deployed_at: "2026-06-01",   // タイトルから抽出した deploy 日 (無ければ null)
 *       overdue_days: 59,            // deployed_at からの経過日数 (無ければ null)
 *       owner: "claude",
 *       deep_link: ".claude/todo/improvements.md"
 *     }
 *   ]
 *
 * deployed_at / overdue_days は `triage-matrix.mjs` の「超過」バケットが参照する。
 * 抽出は `.claude/scripts/lib/effect-verdict/engine.mjs` の `extractDeployDate` に一本化
 * (measure-adsense-impact.mjs と同じ正規表現。未デプロイ表現は null になる)。
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { extractDeployDate } from "./effect-verdict/engine.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const BACKLOG_REL = ".claude/todo/improvements.md";
const BACKLOG_PATH =
  process.env.IMPROVEMENT_BACKLOG_PATH || path.join(PROJECT_ROOT, BACKLOG_REL);

/**
 * 「今日」を差し替える (fixture 検証用。既定は実時刻)。
 *
 * ★2026-08-12: overdue 判定のテストが実時刻を使っていたため、fixture に書いた
 *   「deployed 2026-07-28 = まだ 2 日」が日が経つと 15 日になり、**書いた日を過ぎると
 *   必ず落ちる時限テスト**になっていた (実際に落ちた)。テストを緩めるのではなく
 *   時刻を注入可能にして固定する (14 日境界の検査そのものは残す)。
 */
export function resolveToday() {
  const raw = process.env.IMPROVEMENT_TODAY;
  if (!raw) return new Date();
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`IMPROVEMENT_TODAY が日付として解釈できません: ${raw}`);
  }
  return d;
}

const args = process.argv.slice(2);
function getArg(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

const FORMAT = getArg("--format") || "json";
const DUE_BEFORE = getArg("--due-before");
const TIER_FILTER = getArg("--tier");
const STATUS_FILTER = getArg("--status") || "pending,in-progress,effect/pending";
const OVERDUE_DAYS = getArg("--overdue-days");

const TARGET_STATUSES = new Set(STATUS_FILTER.split(",").map((s) => s.trim()));
const TARGET_TIERS = TIER_FILTER
  ? new Set(TIER_FILTER.split(",").map((s) => Number(s.trim())))
  : null;
const MIN_OVERDUE_DAYS = OVERDUE_DAYS == null ? null : Number(OVERDUE_DAYS);

const DAY_MS = 24 * 60 * 60 * 1000;

/** deployed_at から today までの経過日数。deployed_at が無ければ null。 */
export function overdueDays(deployedAt, today = new Date()) {
  if (!deployedAt) return null;
  const d = Date.parse(`${deployedAt}T00:00:00Z`);
  if (Number.isNaN(d)) return null;
  const base = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.floor((base - d) / DAY_MS);
}

/**
 * improvements.md のマークダウンテーブルを行パースして施策一覧を返す。
 * write-past-effects.mjs も同じパーサを再利用する (行の解釈を二重実装しない)。
 * @param {string} [backlogPath]
 * @param {Date} [today] overdue_days の基準日 (テストで固定する)
 */
export function parseBacklog(backlogPath = BACKLOG_PATH, today = new Date()) {
  const content = readFileSync(backlogPath, "utf-8");
  const entries = [];
  let currentTier = null;

  for (const line of content.split("\n")) {
    // ## Tier N からティアを取得
    const tierMatch = line.match(/^## Tier (\d)/);
    if (tierMatch) {
      currentTier = Number(tierMatch[1]);
      continue;
    }
    // ヘッダー行・区切り行をスキップ
    if (/^\|\s*ID\s*\|/.test(line) || /^\|[-| ]+\|$/.test(line)) continue;
    // データ行: | ID | タイトル | Status | Due | Owner | Metric |
    const cols = line.split("|").map((c) => c.trim()).filter((_, i, a) => i > 0 && i < a.length - 1);
    if (cols.length < 6) continue;
    const [id, title, status, due, owner, metric] = cols;
    if (!id || id === "ID") continue;

    const dueClean = due === "-" ? null : (due.match(/^(\d{4}-\d{2}-\d{2})/) || [])[1] || null;
    const deployedAt = extractDeployDate(title);

    entries.push({
      metric: metric,
      file: BACKLOG_REL,
      section_id: id,
      title: title,
      status: status,
      tier: currentTier,
      target_metric: metric,
      due: dueClean,
      deployed_at: deployedAt,
      overdue_days: overdueDays(deployedAt, today),
      owner: owner,
      deep_link: BACKLOG_REL,
    });
  }
  return entries;
}

function applyFilters(entries) {
  return entries.filter((e) => {
    if (!TARGET_STATUSES.has(e.status)) return false;
    if (TARGET_TIERS && e.tier !== null && !TARGET_TIERS.has(e.tier)) return false;
    if (DUE_BEFORE && e.due && e.due > DUE_BEFORE) return false;
    if (MIN_OVERDUE_DAYS != null && !(e.overdue_days != null && e.overdue_days >= MIN_OVERDUE_DAYS))
      return false;
    return true;
  });
}

function sortByTier(entries) {
  return entries.slice().sort((a, b) => {
    const aT = a.tier ?? 99;
    const bT = b.tier ?? 99;
    if (aT !== bT) return aT - bT;
    const aDue = a.due || "9999-12-31";
    const bDue = b.due || "9999-12-31";
    return aDue.localeCompare(bDue);
  });
}

function formatMarkdown(entries) {
  if (entries.length === 0) return "_対象エントリなし_\n";
  const lines = [];
  lines.push("| Tier | Metric | ID | Title | Status | Due | Owner |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const e of entries) {
    const title = e.title.length > 40 ? e.title.slice(0, 40) + "…" : e.title;
    lines.push(
      `| ${e.tier ?? "-"} | ${e.metric} | ${e.section_id} | ${title} | ${e.status} | ${e.due ?? "-"} | ${e.owner ?? "-"} |`,
    );
  }
  return lines.join("\n") + "\n";
}

function main() {
  const allEntries = parseBacklog(BACKLOG_PATH, resolveToday());
  const filtered = sortByTier(applyFilters(allEntries));
  if (FORMAT === "markdown") {
    process.stdout.write(formatMarkdown(filtered));
  } else {
    process.stdout.write(JSON.stringify(filtered, null, 2) + "\n");
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  main();
}
