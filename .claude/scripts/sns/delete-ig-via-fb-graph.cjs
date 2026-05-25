#!/usr/bin/env node
/**
 * Instagram メディア削除スクリプト — Facebook Graph API 版
 *
 * 既存の `delete-ig-migration-flow.cjs` は Instagram Login token (graph.instagram.com) を
 * 使用していたため削除非対応。本スクリプトは Facebook Page Access Token を使い
 * graph.facebook.com 経由で削除する。
 *
 * 前提:
 *   - .env.local に META_PAGE_ACCESS_TOKEN, META_PAGE_ID, INSTAGRAM_BUSINESS_ACCOUNT_ID
 *   - Token 取得手順: docs/10_SNS戦略/04_Facebook_Page_Token_Setup.md
 *
 * 使い方:
 *   node .claude/scripts/sns/delete-ig-via-fb-graph.cjs --domain migration-flow --dry-run
 *   node .claude/scripts/sns/delete-ig-via-fb-graph.cjs --domain migration-flow
 */

const path = require("path");
const Database = require("better-sqlite3");
require("dotenv").config({ path: path.join(__dirname, "../../../.env.local") });

const TOKEN = process.env.META_PAGE_ACCESS_TOKEN;
const IG_USER_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
if (!TOKEN || !IG_USER_ID) {
  console.error(
    "❌ META_PAGE_ACCESS_TOKEN または INSTAGRAM_BUSINESS_ACCOUNT_ID 未設定",
  );
  console.error("   セットアップ: docs/10_SNS戦略/04_Facebook_Page_Token_Setup.md");
  process.exit(1);
}

const DB_PATH = path.join(
  __dirname,
  "../../../.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite",
);
const GRAPH = "https://graph.facebook.com/v21.0";
const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const domain = (() => {
  const i = args.indexOf("--domain");
  return i >= 0 ? args[i + 1] : "migration-flow";
})();

async function fetchAllIgMedia() {
  // IG Business Account の自社メディアを paging で全件取得
  const all = [];
  let url = `${GRAPH}/${IG_USER_ID}/media?fields=id,permalink&limit=100&access_token=${TOKEN}`;
  while (url) {
    const res = await fetch(url);
    const data = await res.json();
    if (data.error) throw new Error(`API: ${data.error.message}`);
    all.push(...(data.data || []));
    url = data.paging?.next;
    if (all.length > 2000) break; // 安全リミット
  }
  return all;
}

async function deleteMedia(id) {
  const res = await fetch(`${GRAPH}/${id}?access_token=${TOKEN}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (data.error) throw new Error(`API: ${data.error.message}`);
  return data;
}

async function main() {
  // Token sanity check
  const meRes = await fetch(`${GRAPH}/me?access_token=${TOKEN}`);
  const me = await meRes.json();
  if (me.error) {
    console.error(`❌ Token invalid: ${me.error.message}`);
    console.error("   docs/10_SNS戦略/04_Facebook_Page_Token_Setup.md を参照");
    process.exit(1);
  }
  console.log(`✅ Token OK (page: ${me.name || me.id})`);

  const db = new Database(DB_PATH);
  const targets = db
    .prepare(
      `SELECT id, content_key, post_url FROM sns_posts
       WHERE domain=? AND platform='instagram' AND status='posted'
       ORDER BY posted_at`,
    )
    .all(domain);
  console.log(`削除対象: ${targets.length} 件 (domain=${domain})`);
  if (targets.length === 0) {
    db.close();
    return;
  }

  console.log("IG /me/media を fetch 中...");
  const media = await fetchAllIgMedia();
  console.log(`IG 上の投稿: ${media.length} 件`);
  const byPermalink = new Map(
    media.map((m) => [m.permalink?.replace(/\/$/, ""), m.id]),
  );

  let deleted = 0;
  let notFound = 0;
  let failed = 0;
  for (const t of targets) {
    const key = (t.post_url || "").replace(/\/$/, "");
    const mediaId = byPermalink.get(key);
    if (!mediaId) {
      console.warn(`⚠️  IG に存在せず (既削除?): ${t.content_key}`);
      notFound += 1;
      continue;
    }
    if (DRY) {
      console.log(`[dry-run] DELETE ${t.content_key}: ${mediaId}`);
      deleted += 1;
      continue;
    }
    try {
      const res = await deleteMedia(mediaId);
      db.prepare(`UPDATE sns_posts SET status='deleted' WHERE id=?`).run(t.id);
      console.log(
        `✅ 削除: ${t.content_key} (${mediaId}) ${res.success ? "" : JSON.stringify(res)}`,
      );
      deleted += 1;
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.error(`❌ 失敗: ${t.content_key}: ${err.message}`);
      failed += 1;
    }
  }

  console.log(`\n=== 結果 ===`);
  console.log(`削除${DRY ? " (dry-run)" : ""}: ${deleted}`);
  console.log(`IG に存在せず: ${notFound}`);
  console.log(`失敗: ${failed}`);
  db.close();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
