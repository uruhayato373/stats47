#!/usr/bin/env node
/**
 * IG migration-flow 投稿 (古い city コロプレスなし版) を Graph API で削除する。
 *
 * 流れ:
 * 1. sns_posts ストア (.claude/state/sns/posts.json) から domain='migration-flow' AND platform='instagram' AND status='posted' を取得 (post_url 含む)
 * 2. Graph API /{IG_USER_ID}/media?fields=id,permalink で最近の投稿一覧を fetch (paging)
 * 3. permalink が ストアの post_url とマッチする media-id を解決
 * 4. DELETE /{media-id} を実行
 * 5. sns_posts ストアの status を 'deleted' に更新
 *
 * 使い方:
 *   node .claude/scripts/sns/delete-ig-migration-flow.cjs --dry-run  # 削除予定だけ表示
 *   node .claude/scripts/sns/delete-ig-migration-flow.cjs            # 実削除
 */

const path = require("path");
const store = require("../lib/sns-posts-store.cjs");
require("dotenv").config({ path: path.join(__dirname, "../../../.env.local") });

const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const IG_USER_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
if (!TOKEN || !IG_USER_ID) {
  console.error("❌ INSTAGRAM_ACCESS_TOKEN / INSTAGRAM_BUSINESS_ACCOUNT_ID 未設定");
  process.exit(1);
}

const GRAPH = "https://graph.instagram.com/v21.0";
const DRY = process.argv.includes("--dry-run");

async function igGet(path, params = {}) {
  const qs = new URLSearchParams({ ...params, access_token: TOKEN });
  const res = await fetch(`${GRAPH}/${path}?${qs}`);
  const data = await res.json();
  if (data.error) throw new Error(`API: ${data.error.message}`);
  return data;
}

async function fetchAllMedia() {
  const all = [];
  let url = `${GRAPH}/${IG_USER_ID}/media?fields=id,permalink&limit=100&access_token=${TOKEN}`;
  while (url) {
    const res = await fetch(url);
    const data = await res.json();
    if (data.error) throw new Error(`API: ${data.error.message}`);
    all.push(...(data.data || []));
    url = data.paging?.next;
    if (all.length > 1000) break; // 安全リミット
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
  // 旧: SELECT id, content_key, post_url FROM sns_posts
  //     WHERE domain='migration-flow' AND platform='instagram' AND status='posted'
  //     ORDER BY posted_at DESC
  // SQLite の ORDER BY posted_at DESC は NULL を末尾に置く (NULLS LAST 既定) ため、
  // null/undefined を最小値扱いにして降順ソートし等価に再現する。
  const targets = store
    .query(
      (p) =>
        p.domain === "migration-flow" &&
        p.platform === "instagram" &&
        p.status === "posted",
    )
    .sort((a, b) => {
      const av = a.posted_at ?? "";
      const bv = b.posted_at ?? "";
      if (av < bv) return 1;
      if (av > bv) return -1;
      return 0;
    })
    .map((p) => ({ id: p.id, content_key: p.content_key, post_url: p.post_url }));
  console.log(`削除対象: ${targets.length} 件`);

  console.log("IG /me/media を fetch 中...");
  const media = await fetchAllMedia();
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
      console.warn(`⚠️  IG 上に存在しない (古い? 既削除?): ${t.content_key} ${t.post_url}`);
      notFound += 1;
      continue;
    }
    if (DRY) {
      console.log(`[dry-run] DELETE ${t.content_key}: ${mediaId} (${t.post_url})`);
      deleted += 1;
      continue;
    }
    try {
      await deleteMedia(mediaId);
      // 旧: UPDATE sns_posts SET status='deleted' WHERE id=?
      store.updateById(t.id, { status: "deleted" });
      console.log(`✅ 削除: ${t.content_key} (${mediaId})`);
      deleted += 1;
      await new Promise((r) => setTimeout(r, 300)); // rate limit 配慮
    } catch (err) {
      console.error(`❌ 失敗: ${t.content_key}: ${err.message}`);
      failed += 1;
    }
  }

  console.log("");
  console.log(`=== 結果 ===`);
  console.log(`削除${DRY ? " (dry-run)" : ""}: ${deleted}`);
  console.log(`IG に存在せず: ${notFound}`);
  console.log(`失敗: ${failed}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
