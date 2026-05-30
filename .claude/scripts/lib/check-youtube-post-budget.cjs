#!/usr/bin/env node
/**
 * YouTube 投稿ガード。
 *
 * 2 つの check を exit 1 で強制する:
 *   1. Pause check — `.claude/state/youtube-pause.json` の `until` が未来なら投稿停止中
 *   2. Weekly budget — 今週（月〜日 JST）の platform='youtube' で posted + scheduled 合計 >= 3 なら停止
 *
 * 呼び出し元:
 *   - .claude/scripts/youtube/upload.js main() の先頭
 *   - /publish-youtube-normal, /post-youtube SKILL.md の事前チェック
 *
 * By-pass は設けない — 2 週間の停止期間中は設計上あらゆる YouTube 投稿を止める。
 */

const fs = require("node:fs");
const path = require("node:path");
const store = require("./sns-posts-store.cjs");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const PAUSE_FILE = path.join(PROJECT_ROOT, ".claude/state/youtube-pause.json");
const WEEKLY_LIMIT = 3;

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

function weekRangeJST() {
  const nowJST = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const dow = nowJST.getUTCDay(); // 0=Sun..6=Sat
  const daysFromMonday = (dow + 6) % 7;
  const mondayJST = new Date(nowJST);
  mondayJST.setUTCDate(nowJST.getUTCDate() - daysFromMonday);
  mondayJST.setUTCHours(0, 0, 0, 0);
  const sundayEndJST = new Date(mondayJST);
  sundayEndJST.setUTCDate(mondayJST.getUTCDate() + 7);
  const toUTC = (d) => new Date(d.getTime() - 9 * 60 * 60 * 1000).toISOString();
  return { startUTC: toUTC(mondayJST), endUTC: toUTC(sundayEndJST) };
}

function checkBudget() {
  const { startUTC, endUTC } = weekRangeJST();
  // 旧 SQL の COALESCE(posted_at, scheduled_at) を JS で等価再現。
  // posted_at が非 null ならそれ、null/未設定なら scheduled_at を採用。
  // どちらも null/未設定なら範囲比較は成立せず (SQLite の NULL 比較 = 除外) カウント対象外。
  const count = store.query((p) => {
    if (p.platform !== "youtube") return false;
    if (p.status !== "posted" && p.status !== "scheduled") return false;
    const effective = p.posted_at ?? p.scheduled_at ?? null;
    if (effective == null) return false;
    // ISO 文字列の辞書順比較は SQLite TEXT 比較と等価
    return effective >= startUTC && effective < endUTC;
  }).length;
  if (count >= WEEKLY_LIMIT) {
    fail(`今週の YouTube 投稿数が上限 ${WEEKLY_LIMIT} 本に達しています (現在 ${count} 本、週 ${startUTC.slice(0, 10)}〜)`);
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
