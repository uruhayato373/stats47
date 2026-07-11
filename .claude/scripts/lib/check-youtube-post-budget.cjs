#!/usr/bin/env node
/**
 * YouTube 投稿ガード。
 *
 * 3 つの check を exit 1 で強制する:
 *   1. Pause check — `.claude/state/youtube-pause.json` の `until` が未来なら投稿停止中
 *   2. Monthly budget — 今月（JST）の platform='youtube' で posted + scheduled 合計 >= 上限なら停止
 *   3. Daily budget — 今日（JST）の合計 >= dailyLimit なら停止 (experiment.json に dailyLimit がある時のみ)
 *
 * 既定は「月 1 本・日次制限なし」(2026-07 慎重再開方針。シャドウバン真因 = 68 本/月 の量産の再発防止、
 * `.claude/rules/sns-content-standards.md` §1)。量産実験モード (`youtube-experiment.json`) 中は
 * monthlyLimit / dailyLimit で上書き (2026-07-11〜: 1日1本ペース = dailyLimit:1 / monthlyLimit:31)。
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

// 上限の解決。既定は 月1 本・日次制限なし (シャドウバン再発防止 — sns-content-standards.md §1)。
// .claude/state/youtube-experiment.json があれば monthlyLimit / dailyLimit を上書きする (量産実験モード)。
// 例: BAN リスクの無い family アカウントでの量産実験 (1日1本ペース = dailyLimit:1 / monthlyLimit:31)。
// ファイルを削除すれば既定 (月1) に戻る。
function resolveLimits() {
  const DEFAULTS = { monthly: 1, daily: Infinity };
  if (!fs.existsSync(EXPERIMENT_FILE)) return DEFAULTS;
  try {
    const exp = JSON.parse(fs.readFileSync(EXPERIMENT_FILE, "utf-8"));
    if (exp.until) {
      const until = new Date(exp.until);
      if (!Number.isNaN(until.getTime()) && until.getTime() <= Date.now()) return DEFAULTS; // 期限切れ → 既定
    }
    return {
      monthly: Number.isFinite(exp.monthlyLimit) && exp.monthlyLimit > 0 ? exp.monthlyLimit : DEFAULTS.monthly,
      daily: Number.isFinite(exp.dailyLimit) && exp.dailyLimit > 0 ? exp.dailyLimit : DEFAULTS.daily,
    };
  } catch {
    /* 壊れていたら既定 (月1) に戻す */
  }
  return DEFAULTS;
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

// 予約投稿 (--schedule) は「公開予定日」の枠で判定する。今日 1 本消化済みでも明日分の予約仕込みは通す。
// 引数が無い/不正なら現在時刻 (即時投稿) を基準にする。
function budgetBaseMs() {
  const i = process.argv.indexOf("--schedule");
  if (i !== -1) {
    const d = new Date(process.argv[i + 1] ?? "");
    if (!Number.isNaN(d.getTime())) return d.getTime();
  }
  return Date.now();
}

function monthRangeJST(baseMs) {
  const baseJST = new Date(baseMs + 9 * 60 * 60 * 1000);
  const firstJST = new Date(baseJST);
  firstJST.setUTCDate(1);
  firstJST.setUTCHours(0, 0, 0, 0);
  const nextMonthJST = new Date(firstJST);
  nextMonthJST.setUTCMonth(firstJST.getUTCMonth() + 1);
  const toUTC = (d) => new Date(d.getTime() - 9 * 60 * 60 * 1000).toISOString();
  return { startUTC: toUTC(firstJST), endUTC: toUTC(nextMonthJST) };
}

function dayRangeJST(baseMs) {
  const baseJST = new Date(baseMs + 9 * 60 * 60 * 1000);
  const dayStartJST = new Date(baseJST);
  dayStartJST.setUTCHours(0, 0, 0, 0);
  const nextDayJST = new Date(dayStartJST);
  nextDayJST.setUTCDate(dayStartJST.getUTCDate() + 1);
  const toUTC = (d) => new Date(d.getTime() - 9 * 60 * 60 * 1000).toISOString();
  return { startUTC: toUTC(dayStartJST), endUTC: toUTC(nextDayJST) };
}

// COALESCE(posted_at, scheduled_at) を JS で等価再現。
// posted_at が非 null ならそれ、null/未設定なら scheduled_at を採用。
// どちらも null/未設定なら範囲比較は成立せずカウント対象外。
function countYoutubePostsInRange(startUTC, endUTC) {
  return store.query((p) => {
    if (p.platform !== "youtube") return false;
    if (p.status !== "posted" && p.status !== "scheduled") return false;
    const effective = p.posted_at ?? p.scheduled_at ?? null;
    if (effective == null) return false;
    return effective >= startUTC && effective < endUTC;
  }).length;
}

function checkBudget() {
  const limits = resolveLimits();
  const baseMs = budgetBaseMs(); // 即時投稿=今 / --schedule 予約=公開予定日の枠で判定

  const month = monthRangeJST(baseMs);
  const monthCount = countYoutubePostsInRange(month.startUTC, month.endUTC);
  if (monthCount >= limits.monthly) {
    fail(`対象月の YouTube 投稿数が上限 ${limits.monthly} 本に達しています (現在 ${monthCount} 本)。上限の正典 — .claude/rules/sns-content-standards.md §1 / .claude/state/youtube-experiment.json`);
  }

  if (Number.isFinite(limits.daily)) {
    const day = dayRangeJST(baseMs);
    const dayCount = countYoutubePostsInRange(day.startUTC, day.endUTC);
    if (dayCount >= limits.daily) {
      const jstDate = new Date(baseMs + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
      fail(`対象日 (JST ${jstDate}) の YouTube 投稿数が上限 ${limits.daily} 本に達しています (現在 ${dayCount} 本)。1日1本ペースの量産実験 — .claude/state/youtube-experiment.json (dailyLimit)。別の日に --schedule するか翌日に投稿`);
    }
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
