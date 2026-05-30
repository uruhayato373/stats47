#!/usr/bin/env node
/**
 * ig-posted-log.jsonl の初回バックフィル
 *
 * 共有ストア (sns_posts) から instagram の投稿済みレコードを読み出し、
 * .claude/state/ig-posted-log.jsonl に追記する。
 * 既存エントリと content_key+domain の重複チェックをして冪等に動作する。
 *
 * 実行: node .claude/scripts/instagram/backfill-posted-log.cjs
 */

const fs = require("node:fs");
const path = require("node:path");
const store = require("../lib/sns-posts-store.cjs");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const LOG_PATH = path.join(ROOT, ".claude/state/ig-posted-log.jsonl");

// 旧 SELECT posted_at, domain, content_key, post_url FROM sns_posts
//     WHERE platform='instagram' AND status='posted' ORDER BY posted_at ASC
const rows = store
  .query((p) => p.platform === "instagram" && p.status === "posted")
  .sort((a, b) => String(a.posted_at || "").localeCompare(String(b.posted_at || "")));

// 既存ログを読み込んで重複チェック
const existingKeys = new Set();
if (fs.existsSync(LOG_PATH)) {
  for (const line of fs.readFileSync(LOG_PATH, "utf8").trim().split("\n")) {
    if (!line) continue;
    try {
      const e = JSON.parse(line);
      existingKeys.add(`${e.domain}::${e.content_key}`);
    } catch {}
  }
}

let appended = 0;
for (const row of rows) {
  const dedupeKey = `${row.domain}::${row.content_key}`;
  if (existingKeys.has(dedupeKey)) continue;

  const entry = {
    date: (row.posted_at || "").slice(0, 10),
    domain: row.domain || "ranking",
    content_key: row.content_key,
    permalink: row.post_url || "",
    posted_at: row.posted_at || "",
  };
  fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + "\n");
  existingKeys.add(dedupeKey);
  appended++;
}

console.log(`✅ バックフィル完了: ${appended} 件追記 (既存スキップ: ${rows.length - appended} 件)`);
