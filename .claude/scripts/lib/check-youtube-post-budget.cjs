#!/usr/bin/env node
/**
 * YouTube 投稿ガード。
 *
 * 2 つの check を exit 1 で強制する:
 *   1. Pause check — `.claude/state/youtube-pause.json` の `until` が未来なら投稿停止中
 *   2. Monthly budget — 今月（JST）の platform='youtube' で posted + scheduled 合計 >= 1 なら停止
 *
 * 2026-07 の慎重再開方針で「月 1 本」に変更 (旧: 週 3 本)。シャドウバン真因 = 68 本/月 の量産の
 * 再発防止 (`.claude/rules/sns-content-standards.md` §1)。
 *
 * 呼び出し元:
 *   - .claude/scripts/youtube/upload.js main() の先頭
 *   - /post-youtube SKILL.md の事前チェック
 *
 * By-pass は設けない — 停止期間中は設計上あらゆる YouTube 投稿を止める。
 */

const fs = require("node:fs");
const path = require("node:path");
const store = require("./sns-posts-store.cjs");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const PAUSE_FILE = path.join(PROJECT_ROOT, ".claude/state/youtube-pause.json");
const EXPERIMENT_FILE = path.join(PROJECT_ROOT, ".claude/state/youtube-experiment.json");

// 月次上限。既定は 1 本 (シャドウバン再発防止 — sns-content-standards.md §1)。
// .claude/state/youtube-experiment.json があれば monthlyLimit を上書きする (量産実験モード)。
// 例: BAN リスクの無い family アカウントでの量産実験。ファイルを削除すれば既定 (月1) に戻る。
function resolveMonthlyLimit() {
  if (!fs.existsSync(EXPERIMENT_FILE)) return 1;
  try {
    const exp = JSON.parse(fs.readFileSync(EXPERIMENT_FILE, "utf-8"));
    if (exp.until) {
      const until = new Date(exp.until);
      if (!Number.isNaN(until.getTime()) && until.getTime() <= Date.now()) return 1; // 期限切れ → 既定
    }
    if (Number.isFinite(exp.monthlyLimit) && exp.monthlyLimit > 0) return exp.monthlyLimit;
  } catch {
    /* 壊れていたら既定 (月1) に戻す */
  }
  return 1;
}

function fail(msg) {
  console.error(`[check-youtube-post-budget] ${msg}`);
  process.exit(1);
}

function checkPause() {
  if (!fs.existsSync(PAUSE_FILE)) return;
  const pause = JSON.parse(fs.readFileSync(PAUSE_FILE, "utf-8"));
  if (!pause.until) return;
  const until = new Date(pause.until);
  if (Number.isNaN(until.getTime())) return;
  if (until.getTime() <= Date.now()) return;

  // --schedule が pause.until より後なら「pause 期間中の予約仕込み」として許可
  const scheduleIdx = process.argv.indexOf("--schedule");
  if (scheduleIdx !== -1) {
    const publishAt = new Date(process.argv[scheduleIdx + 1] ?? "");
    if (!Number.isNaN(publishAt.getTime()) && publishAt.getTime() > until.getTime()) {
      console.log(`[check-youtube-post-budget] pause 中だが publishAt(${process.argv[scheduleIdx + 1]}) > until(${pause.until}) のため予約仕込みを許可`);
      return;
    }
  }

  const untilDate = pause.until.slice(0, 10);
  const issue = pause.issue ? ` (issue #${pause.issue})` : "";
  const reason = pause.reason ? ` / reason: ${pause.reason}` : "";
  fail(`YouTube 投稿停止中 — until ${untilDate}${issue}${reason}. 停止解除は .claude/state/youtube-pause.json を削除`);
}

function monthRangeJST() {
  const nowJST = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const firstJST = new Date(nowJST);
  firstJST.setUTCDate(1);
  firstJST.setUTCHours(0, 0, 0, 0);
  const nextMonthJST = new Date(firstJST);
  nextMonthJST.setUTCMonth(firstJST.getUTCMonth() + 1);
  const toUTC = (d) => new Date(d.getTime() - 9 * 60 * 60 * 1000).toISOString();
  return { startUTC: toUTC(firstJST), endUTC: toUTC(nextMonthJST) };
}

function checkBudget() {
  const MONTHLY_LIMIT = resolveMonthlyLimit();
  const { startUTC, endUTC } = monthRangeJST();
  // COALESCE(posted_at, scheduled_at) を JS で等価再現。
  // posted_at が非 null ならそれ、null/未設定なら scheduled_at を採用。
  // どちらも null/未設定なら範囲比較は成立せずカウント対象外。
  const count = store.query((p) => {
    if (p.platform !== "youtube") return false;
    if (p.status !== "posted" && p.status !== "scheduled") return false;
    const effective = p.posted_at ?? p.scheduled_at ?? null;
    if (effective == null) return false;
    return effective >= startUTC && effective < endUTC;
  }).length;
  if (count >= MONTHLY_LIMIT) {
    fail(`今月の YouTube 投稿数が上限 ${MONTHLY_LIMIT} 本に達しています (現在 ${count} 本、月 ${startUTC.slice(0, 7)})。月1運用の再開方針 — .claude/rules/sns-content-standards.md §1`);
  }
}

function main() {
  checkPause();
  checkBudget();
}

try {
  main();
} catch (err) {
  fail(`unexpected error: ${err.message}`);
}
