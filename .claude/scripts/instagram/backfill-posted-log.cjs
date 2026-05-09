#!/usr/bin/env node
/**
 * ig-posted-log.jsonl の初回バックフィル
 *
 * D1 sns_posts から instagram の投稿済みレコードを読み出し、
 * .claude/state/ig-posted-log.jsonl に追記する。
 * 既存エントリと content_key+domain の重複チェックをして冪等に動作する。
 *
 * 実行: node .claude/scripts/instagram/backfill-posted-log.cjs
 */

const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const D1_PATH = path.join(
  ROOT,
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite"
);
const LOG_PATH = path.join(ROOT, ".claude/state/ig-posted-log.jsonl");

if (!fs.existsSync(D1_PATH)) {
  console.error("❌ D1 not found:", D1_PATH);
  process.exit(1);
}

const db = new Database(D1_PATH, { readonly: true });

const rows = db
  .prepare(
    `SELECT posted_at, domain, content_key, post_url
     FROM sns_posts
     WHERE platform = 'instagram' AND status = 'posted'
     ORDER BY posted_at ASC`
  )
  .all();

db.close();

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
