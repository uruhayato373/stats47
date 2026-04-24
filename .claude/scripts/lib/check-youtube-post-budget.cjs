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
const Database = require("better-sqlite3");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const PAUSE_FILE = path.join(PROJECT_ROOT, ".claude/state/youtube-pause.json");
const D1_PATH = path.join(
  PROJECT_ROOT,
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite",
);
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
  if (!fs.existsSync(D1_PATH)) {
    console.warn(`[check-youtube-post-budget] D1 not found, skipping budget check: ${D1_PATH}`);
    return;
  }
  const db = new Database(D1_PATH, { readonly: true, fileMustExist: true });
  try {
    const { startUTC, endUTC } = weekRangeJST();
    const row = db
      .prepare(
        `SELECT COUNT(*) AS n FROM sns_posts
         WHERE platform = 'youtube'
           AND status IN ('posted', 'scheduled')
           AND COALESCE(posted_at, scheduled_at) >= ?
           AND COALESCE(posted_at, scheduled_at) < ?`,
      )
      .get(startUTC, endUTC);
    const count = row?.n ?? 0;
    if (count >= WEEKLY_LIMIT) {
      fail(`今週の YouTube 投稿数が上限 ${WEEKLY_LIMIT} 本に達しています (現在 ${count} 本、週 ${startUTC.slice(0, 10)}〜)`);
    }
  } finally {
    db.close();
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
