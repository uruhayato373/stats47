#!/usr/bin/env node
"use strict";

/**
 * Threads 予約投稿 (GitHub Actions cron 用)。
 *
 * `.claude/state/threads-schedule.json` の中から「予定時刻 (JST) を過ぎ、遅れが 6 時間以内で、
 * 台帳 (posts.json) に posted が無い」最早の 1 件だけを Threads API で公開し、台帳へ
 * platform="threads" で記録する。Threads API にも予約公開のパラメータが無いため
 * (https://developers.facebook.com/docs/threads/reference/publishing/ ・アクセス日 2026-09-23)、
 * IG と同じく cron で即時公開を発火する方式で予約を代替する。
 *
 * ## schedule JSON の形式
 *
 *   {
 *     "entries": [
 *       { "date": "2026-09-25", "time": "12:00", "type": "text",
 *         "domain": "ranking", "content_key": "vacant-housing-rate",
 *         "text": "本文 (500 文字まで)… https://stats47.jp/ranking/vacant-housing-rate?utm_source=threads&utm_medium=social&utm_campaign=vacant-housing-rate&utm_content=shock" },
 *       { "date": "2026-09-26", "time": "19:00", "type": "image",
 *         "domain": "ranking", "content_key": "doctors-per-capita",
 *         "text": "本文…", "image_url": "https://storage.stats47.jp/sns/ranking/doctors-per-capita/threads/card.png",
 *         "alt_text": "任意 (1,000 文字まで)" }
 *     ]
 *   }
 *
 * 検査の中身は lib/threads-core.cjs (純粋関数・node:test 付き)。
 *
 * ## 二重投稿の防止 (2 段)
 *
 * 1. 台帳で domain + content_key + platform=threads が posted なら出さない
 * 2. 公開前に自アカウントの直近投稿を API で読み、同じ本文が 48 時間以内にあれば出さずに
 *    台帳だけ補完する (公開後に commit-back が落ちて台帳が戻った場合の再投稿を止める)
 *    直近投稿が読めなければ公開しない (重複でないことを示せないため)
 *
 * ## 使い方
 *
 *   node .claude/scripts/threads/post-from-schedule.cjs --dry-run            # API を呼ばない
 *   node .claude/scripts/threads/post-from-schedule.cjs --dry-run --now 2026-09-25T03:10:00Z
 *   THREADS_ACCESS_TOKEN=... THREADS_USER_ID=... node .claude/scripts/threads/post-from-schedule.cjs
 *
 * 終了コード: 0 = 投稿した / 出すものが無い、1 = 検査違反・資格情報なし・API エラー
 */

const fs = require("node:fs");
const path = require("node:path");

const store = require("../lib/sns-posts-store.cjs");
const core = require("../lib/threads-core.cjs");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const DEFAULT_SCHEDULE = path.join(PROJECT_ROOT, ".claude/state/threads-schedule.json");
const GRAPH = "https://graph.threads.net/v1.0";

/** 公開前待ち (公式推奨: 平均 30 秒)。https://developers.facebook.com/docs/threads/posts */
const PRE_PUBLISH_WAIT_MS = 30 * 1000;
/** コンテナ状態の確認 (公式推奨: 1 分に 1 回・5 分まで)。https://developers.facebook.com/docs/threads/troubleshooting */
const STATUS_POLL_INTERVAL_MS = 60 * 1000;
const STATUS_POLL_MAX = 5;
const PERMALINK_RETRY = 3;
const PERMALINK_RETRY_WAIT_MS = 5 * 1000;
const RECENT_POSTS_LIMIT = 25;

const TOKEN = process.env.THREADS_ACCESS_TOKEN;
const USER_ID = process.env.THREADS_USER_ID;

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
    ? process.argv[i + 1]
    : undefined;
}
const has = (name) => process.argv.includes(`--${name}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function resolveNowMs() {
  const forced = arg("now") || process.env.THREADS_FORCE_NOW;
  if (!forced) return Date.now();
  const ms = Date.parse(forced);
  if (Number.isNaN(ms)) throw new Error(`--now が日時として不正: ${forced}`);
  return ms;
}

function loadSchedule(file) {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function setOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}

// ---- Threads API (access_token は URL / body にだけ載せ、ログへ出さない) ----

async function graph(method, pathname, params = {}) {
  const url = new URL(`${GRAPH}/${pathname}`);
  const init = { method };
  if (method === "GET") {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    url.searchParams.set("access_token", TOKEN);
  } else {
    init.headers = { "Content-Type": "application/x-www-form-urlencoded" };
    init.body = new URLSearchParams({ ...params, access_token: TOKEN });
  }
  const res = await fetch(url, init);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const detail = json.error?.message ?? JSON.stringify(json).slice(0, 300);
    throw new Error(`Threads API ${method} /${pathname.split("/").pop()} 失敗 (HTTP ${res.status}): ${detail}`);
  }
  return json;
}

async function listRecentPosts() {
  const json = await graph("GET", `${USER_ID}/threads`, {
    fields: "id,text,timestamp,permalink",
    limit: RECENT_POSTS_LIMIT,
  });
  return Array.isArray(json.data) ? json.data : [];
}

async function createContainer(entry) {
  const params = { media_type: entry.type === "image" ? "IMAGE" : "TEXT", text: entry.text };
  if (entry.type === "image") {
    params.image_url = entry.image_url;
    if (entry.alt_text) params.alt_text = entry.alt_text;
  }
  const json = await graph("POST", `${USER_ID}/threads`, params);
  if (!json.id) throw new Error(`コンテナ作成の応答に id が無い: ${JSON.stringify(json).slice(0, 300)}`);
  return json.id;
}

async function waitUntilReady(containerId) {
  await sleep(PRE_PUBLISH_WAIT_MS);
  for (let i = 0; i < STATUS_POLL_MAX; i++) {
    const json = await graph("GET", containerId, { fields: "status,error_message" });
    console.log(`  container status (${i + 1}/${STATUS_POLL_MAX}): ${json.status}`);
    if (json.status === "FINISHED") return;
    if (json.status !== "IN_PROGRESS") {
      throw new Error(`コンテナが公開できない状態: ${json.status} ${json.error_message ?? ""}`);
    }
    await sleep(STATUS_POLL_INTERVAL_MS);
  }
  throw new Error(`コンテナが ${STATUS_POLL_MAX} 分以内に FINISHED にならない (公開せず終了)`);
}

async function publish(containerId) {
  const json = await graph("POST", `${USER_ID}/threads_publish`, { creation_id: containerId });
  if (!json.id) throw new Error(`公開の応答に id が無い: ${JSON.stringify(json).slice(0, 300)}`);
  return json.id;
}

async function fetchPermalink(mediaId) {
  for (let i = 0; i < PERMALINK_RETRY; i++) {
    const json = await graph("GET", mediaId, { fields: "permalink" }).catch((e) => {
      console.log(`  permalink 取得失敗 (${i + 1}/${PERMALINK_RETRY}): ${e.message}`);
      return {};
    });
    if (store.isVerifiedThreadsPostUrl(json.permalink)) return json.permalink;
    await sleep(PERMALINK_RETRY_WAIT_MS);
  }
  throw new Error(
    `公開済み (media id=${mediaId}) だが permalink を取得できず台帳は未記録。` +
      "次回実行が自アカウント直近投稿との照合で台帳を補完する (再投稿はしない)",
  );
}

// ---- 台帳 (posts.json は store 経由でのみ書く: sns-content-standards.md §3) ----

function recordPosted(entry, permalink, postedAt) {
  const decision = core.decideLedgerAction({ entry, permalink, postedAt, existing: store.loadAll() });
  if (decision.action === "update") store.updateById(decision.id, decision.patch);
  if (decision.action === "insert") store.insert(decision.record);
  console.log(`  台帳: ${decision.action} (${decision.reason}) ${entry.domain}/${entry.content_key}`);
}

// ---- 実行 ----

function printPlan(plan, results, nowMs, postedToday) {
  const jst = new Date(nowMs + 9 * 3600 * 1000).toISOString().slice(0, 16).replace("T", " ");
  console.log(`[threads] now (JST): ${jst} / 本日の投稿 ${postedToday}/${core.THREADS_DAILY_MAX}`);
  for (const row of plan.rows) {
    const e = row.entry ?? {};
    const r = results[row.index];
    const mark = row.state === "posted" ? "" : r.errors.length ? " NG" : " OK";
    console.log(
      `  #${row.index} ${e.date} ${e.time} [${row.state}] ${e.type} ${e.domain}/${e.content_key}` +
        ` 本文 ${r.textLength}/${core.THREADS_TEXT_MAX} リンク ${r.linkCount}/${core.THREADS_LINK_MAX}${mark}`,
    );
    if (row.state !== "posted") for (const err of r.errors) console.log(`      - ${err}`);
  }
  const next = plan.next?.entry;
  console.log(next ? `[threads] 今回の投稿対象: #${plan.next.index} ${next.domain}/${next.content_key}` : "[threads] 今回の投稿対象: なし");
}

async function main() {
  const dryRun = has("dry-run");
  const file = arg("schedule") ? path.resolve(arg("schedule")) : DEFAULT_SCHEDULE;
  const nowMs = resolveNowMs();

  const raw = loadSchedule(file);
  if (!raw) {
    console.log(`[threads] schedule が無い (${path.relative(PROJECT_ROOT, file)})。投稿なし`);
    return 0;
  }
  const { errors: scheduleErrors, entries } = core.validateSchedule(raw);
  const ledger = store.loadAll();
  const plan = core.planRun(entries, { nowMs, ledger });
  const results = entries.map((e) => core.validateEntry(e));
  const postedToday = core.countPostedOnJstDay(ledger, nowMs);

  printPlan(plan, results, nowMs, postedToday);
  for (const err of scheduleErrors) console.error(`::error::schedule: ${err}`);

  if (dryRun) {
    const bad = plan.rows.filter((r) => r.state !== "posted" && results[r.index].errors.length);
    console.log(`[threads] --dry-run: API は呼んでいない。検査 NG ${bad.length} 件`);
    return scheduleErrors.length || bad.length ? 1 : 0;
  }

  if (scheduleErrors.length) return 1;
  for (const row of plan.rows.filter((r) => r.state === "missed")) {
    console.log(`::warning::予定時刻から ${core.MAX_LATENESS_MINUTES} 分を超えたため出さない: #${row.index} ${row.entry.content_key}`);
  }
  if (!plan.next) {
    if (!TOKEN || !USER_ID) console.log("::warning::THREADS_ACCESS_TOKEN / THREADS_USER_ID が未設定 (投稿対象が出た時点で失敗する)");
    return 0;
  }

  const entry = plan.next.entry;
  const check = results[plan.next.index];
  if (check.errors.length) {
    for (const err of check.errors) console.error(`::error::${entry.content_key}: ${err}`);
    return 1;
  }
  if (postedToday >= core.THREADS_DAILY_MAX) {
    console.log(`[threads] 本日 (JST) は既に ${postedToday} 件で上限 ${core.THREADS_DAILY_MAX}。出さない`);
    return 0;
  }
  if (!TOKEN || !USER_ID) {
    console.error("::error::THREADS_ACCESS_TOKEN / THREADS_USER_ID が未設定。GitHub Secrets に登録する");
    return 1;
  }

  const recent = await listRecentPosts();
  const dup = core.findRemoteDuplicate(entry, recent, { nowMs });
  if (dup) {
    console.log(`[threads] 同じ本文が既に公開済み (${dup.permalink})。再投稿せず台帳だけ補完する`);
    recordPosted(entry, dup.permalink, new Date(Date.parse(dup.timestamp)).toISOString());
    setOutput("permalink", dup.permalink);
    setOutput("content_key", entry.content_key);
    return 0;
  }

  if (entry.type === "image") {
    const head = await fetch(entry.image_url, { method: "HEAD" });
    if (!head.ok) throw new Error(`image_url に到達できない (HTTP ${head.status}): ${entry.image_url}`);
  }

  console.log(`[threads] コンテナ作成: ${entry.type} ${entry.domain}/${entry.content_key}`);
  const containerId = await createContainer(entry);
  await waitUntilReady(containerId);
  const mediaId = await publish(containerId);
  const postedAt = new Date().toISOString();
  console.log(`[threads] 公開: media id ${mediaId}`);
  const permalink = await fetchPermalink(mediaId);
  recordPosted(entry, permalink, postedAt);
  console.log(`PERMALINK=${permalink}`);
  setOutput("permalink", permalink);
  setOutput("content_key", entry.content_key);
  return 0;
}

if (require.main === module) {
  main()
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error(`::error::${err.message || err}`);
      process.exit(1);
    });
}
