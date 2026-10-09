#!/usr/bin/env node
"use strict";

/**
 * Instagram 予約表 (instagram-w*-schedule.json) のエントリを投稿台帳へ下書きとして登録し、
 * エントリに post_id を書き戻す。1 投稿 = 1 id を「投稿した時」ではなく「予約表に載せた時」に決めるため。
 * IG cron (post-from-schedule.cjs) は post_id が承認済みのエントリだけを投稿する。
 *
 * - 対象: post_id の無いエントリのうち、前日以降の日付で ig-posted-log に無いもの (投稿済みの過去分は触らない)
 * - 同じ domain + content_key の Instagram 下書きが台帳にあれば、その行を使う (二重に登録しない)
 * - 本文 (caption) は R2 の sns/<domain>/<key>/instagram/caption.txt を台帳へ写す (承認の前に読めるように)
 *
 * usage:
 *   node .claude/scripts/instagram/register-ig-schedule.cjs --schedule instagram-w45 [--dry-run]
 *   node .claude/scripts/instagram/register-ig-schedule.cjs --all [--dry-run]     # 全予約表
 * 登録後の承認: node .claude/scripts/sns/approve-posts.cjs --schedule instagram-w45
 */

const fs = require("node:fs");
const path = require("node:path");
const store = require("../lib/sns-posts-store.cjs");
const { parsePostedLog } = require("../lib/ig-ledger-core.cjs");
const { R2_PUBLIC_BASE_URL } = require("../lib/site-config.cjs");
const { datasetDir, datasetPath } = require("../../../config/datasets.mjs");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const SCHEDULE_DIR = path.join(ROOT, datasetDir("sns.instagram-schedules"));

function jstDate(offsetDays = 0) {
  return new Date(Date.now() + 9 * 3600_000 + offsetDays * 86_400_000).toISOString().slice(0, 10);
}

const postTypeOf = (entry) => (entry.type === "carousel" ? "carousel" : entry.type === "reels" ? "reel" : "original");

async function fetchCaption(entry) {
  const res = await fetch(`${R2_PUBLIC_BASE_URL}/sns/${entry.domain}/${entry.content_key}/instagram/caption.txt`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`caption の取得に失敗 HTTP ${res.status}: ${entry.domain}/${entry.content_key}`);
  return (await res.text()).trim();
}

/**
 * 1 つの予約表を登録する。戻り値: { file, registered: [{date, content_key, id, reused}] }
 */
async function registerScheduleFile(file, { dryRun = false, since = jstDate(-1) } = {}) {
  const raw = fs.readFileSync(file, "utf8");
  const json = JSON.parse(raw);
  const entries = Array.isArray(json) ? json : json.entries ?? [];
  const logPath = path.join(ROOT, datasetPath("sns.ig-posted-log"));
  const posted = new Set(
    parsePostedLog(fs.existsSync(logPath) ? fs.readFileSync(logPath, "utf8") : "").map((e) => `${e.date}|${e.content_key}`),
  );
  const registered = [];
  for (const entry of entries) {
    if (Number.isInteger(entry.post_id) || entry.date < since || posted.has(`${entry.date}|${entry.content_key}`)) continue;
    const scheduledAt = new Date(`${entry.date}T${entry.time || "08:00"}:00+09:00`).toISOString();
    const existing = store
      .loadAll()
      .find((p) => p.platform === "instagram" && p.status === "draft" && !p.deleted_at && p.domain === entry.domain && p.content_key === entry.content_key);
    if (dryRun) {
      registered.push({ date: entry.date, content_key: entry.content_key, id: existing?.id ?? null, reused: Boolean(existing) });
      continue;
    }
    const caption = await fetchCaption(entry);
    const row = existing
      ? store.updateById(existing.id, { scheduled_at: scheduledAt, post_type: postTypeOf(entry), ...(caption ? { caption } : {}) })
      : store.insert({
          platform: "instagram",
          post_type: postTypeOf(entry),
          domain: entry.domain,
          content_key: entry.content_key,
          caption,
          status: "draft",
          scheduled_at: scheduledAt,
        });
    entry.post_id = row.id;
    registered.push({ date: entry.date, content_key: entry.content_key, id: row.id, reused: Boolean(existing) });
  }
  if (!dryRun && registered.length) fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
  return { file, registered };
}

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const name = argv.includes("--schedule") ? argv[argv.indexOf("--schedule") + 1] : null;
  const files = argv.includes("--all")
    ? fs.readdirSync(SCHEDULE_DIR).filter((f) => /^instagram-w.+-schedule\.json$/.test(f)).map((f) => path.join(SCHEDULE_DIR, f))
    : name
      ? [path.join(SCHEDULE_DIR, `${name.replace(/\.json$/, "").replace(/-schedule$/, "")}-schedule.json`)]
      : [];
  if (!files.length) {
    console.error("usage: register-ig-schedule.cjs --schedule instagram-wNN | --all [--dry-run]");
    process.exit(1);
  }
  for (const file of files) {
    const { registered } = await registerScheduleFile(file, { dryRun });
    if (!registered.length) continue;
    console.log(`${path.basename(file)}: ${dryRun ? "(dry-run) " : ""}${registered.length} 件を台帳へ登録`);
    for (const r of registered) console.log(`  ${r.date} ${r.content_key} → id=${r.id ?? "(新規)"}${r.reused ? " (既存の下書き)" : ""}`);
  }
}

module.exports = { registerScheduleFile };

if (require.main === module) {
  main().catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  });
}
