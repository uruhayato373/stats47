#!/usr/bin/env node
// 週次レビュー / 週次計画の cadence 欠落を検知する (実行漏れガード)。
//
// 背景: 週次メトリクス収集 (fetch-metrics-weekly.yml) は自動で回るが、レビュー文書
// (skill reference/reviews/YYYY-Www.md) と現在計画 (.claude/todo/03_今週の計画.md) は人間/agent が
// /weekly-review・/weekly-plan で手動生成する。cadence が途切れても誰も気づかず、
// 2026-W26〜W28 のレビューが 3 週連続で欠落した。本スクリプトはその穴を機械検知する。
//
// 使い方:
//   node .claude/scripts/management/check-weekly-cadence.mjs            # 人間向けサマリ (欠落があれば exit 1)
//   node .claude/scripts/management/check-weekly-cadence.mjs --json     # CI 向け JSON (常に exit 0)
//
// 判定: 直近 WINDOW 週分を対象に、cadence 開始 (最古ファイル) 以降で欠落している週を列挙する。
//   - レビュー: 完了済みの週まで (今日が月曜なら先週まで) を対象
//   - 計画: 進行中の今週まで (今週分の計画は週頭に存在すべき) を対象

import { readdirSync, existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "../../..");
const REVIEW_DIR = resolve(
  PROJECT_ROOT,
  ".claude/skills/management/weekly-review/reference/reviews",
);
const PLAN_FILE = resolve(PROJECT_ROOT, ".claude/todo/03_今週の計画.md");
const WINDOW = 10; // 遡って検査する週数 (これより古い穴は追わない)

const jsonMode = process.argv.includes("--json");

/** ISO 週ラベル YYYY-Www を返す (Date は UTC 基準) */
function isoWeekLabel(d) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7; // Mon=1..Sun=7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum); // その週の木曜へ
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/** ディレクトリ内の YYYY-Www.md から週ラベル集合を作る */
function presentWeeks(dir) {
  if (!existsSync(dir)) return new Set();
  return new Set(
    readdirSync(dir)
      .map((f) => f.match(/^(\d{4}-W\d{2})\.md$/)?.[1])
      .filter(Boolean),
  );
}

/** 基準日から遡って WINDOW 週分のラベル列 (新しい順) を作る */
function recentWeekLabels(anchorDate) {
  const labels = [];
  const d = new Date(anchorDate);
  for (let i = 0; i < WINDOW; i++) {
    labels.push(isoWeekLabel(d));
    d.setUTCDate(d.getUTCDate() - 7);
  }
  return [...new Set(labels)];
}

/** 対象週集合のうち、cadence 開始 (最古存在) 以降で欠落しているものを返す */
function missingWeeks(present, candidateLabels) {
  if (present.size === 0) return []; // まだ 1 件も無い = cadence 未開始、追わない
  const earliest = [...present].sort()[0];
  return candidateLabels
    .filter((w) => w >= earliest) // 開始前の週は対象外
    .filter((w) => !present.has(w))
    .sort();
}

const today = new Date();
const currentWeek = isoWeekLabel(today);

// 完了済み最新週 = 直近の日曜が属する週 (月曜実行なら先週)
const day = today.getUTCDay(); // 0=Sun..6=Sat
const lastSunday = new Date(today);
lastSunday.setUTCDate(today.getUTCDate() - (day === 0 ? 7 : day));
const lastCompletedWeek = isoWeekLabel(lastSunday);

// レビュー: 完了済み週まで / 計画: 今週まで
const reviewCandidates = recentWeekLabels(lastSunday);
const missingReviews = missingWeeks(presentWeeks(REVIEW_DIR), reviewCandidates);
const planWeek = existsSync(PLAN_FILE)
  ? readFileSync(PLAN_FILE, "utf8").match(/^week:\s*(\d{4}-W\d{2})$/m)?.[1]
  : null;
const missingPlans = planWeek === currentWeek ? [] : [currentWeek];
const missingTotal = missingReviews.length + missingPlans.length;

const bodyLines = [];
bodyLines.push("## 週次 cadence 欠落チェック");
bodyLines.push("");
bodyLines.push(`- 完了済み最新週: **${lastCompletedWeek}** / 進行中: ${currentWeek}`);
bodyLines.push("");
if (missingReviews.length) {
  bodyLines.push(`### ⚠️ 未作成の週次レビュー (${missingReviews.length}週)`);
  for (const w of missingReviews) {
    bodyLines.push(`- [ ] \`.claude/skills/management/weekly-review/reference/reviews/${w}.md\` — \`/weekly-review ${w}\``);
  }
  bodyLines.push("");
}
if (missingPlans.length) {
  bodyLines.push(`### ⚠️ 未作成の週次計画 (${missingPlans.length}週)`);
  for (const w of missingPlans) {
    bodyLines.push(`- [ ] \`.claude/todo/03_今週の計画.md\` — \`/weekly-plan ${w}\``);
  }
  bodyLines.push("");
}
if (missingTotal === 0) {
  bodyLines.push("✅ 欠落なし。レビュー・計画とも最新週まで揃っています。");
}
const body = bodyLines.join("\n");

if (jsonMode) {
  process.stdout.write(
    JSON.stringify(
      { currentWeek, lastCompletedWeek, missingReviews, missingPlans, missingTotal, body },
      null,
      2,
    ) + "\n",
  );
  process.exit(0);
}

console.log(body);
process.exit(missingTotal > 0 ? 1 : 0);
