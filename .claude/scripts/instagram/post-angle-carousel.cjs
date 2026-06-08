#!/usr/bin/env node
/**
 * Instagram angle-post carousel 投稿スクリプト
 *
 * posts.json の angle-post エントリを carousel として投稿する。
 * GitHub Actions (post-angle-carousel.yml) から呼ばれる。
 *
 * 環境変数:
 *   INSTAGRAM_ACCESS_TOKEN
 *   INSTAGRAM_BUSINESS_ACCOUNT_ID
 *   POST_ID           — posts.json の id (指定時はそのエントリのみ)
 *   CONTENT_KEY       — 指定時は content_key が一致する最初の pending/draft エントリ
 *   ANGLE             — 指定時は angle も合わせて絞り込み
 *   IG_PUBLIC_R2_BASE — デフォルト: https://storage.stats47.jp
 */

const fs = require("node:fs");
const path = require("node:path");

const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const IG_USER_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
const PUBLIC_R2_BASE =
  process.env.IG_PUBLIC_R2_BASE || "https://storage.stats47.jp";
const POST_ID = process.env.POST_ID ? Number(process.env.POST_ID) : null;
const CONTENT_KEY = process.env.CONTENT_KEY;
const ANGLE = process.env.ANGLE;

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const POSTS_FILE = path.join(PROJECT_ROOT, ".claude/state/sns/posts.json");
const PUBLISH_LOG = path.join(
  PROJECT_ROOT,
  ".claude/state/metrics/sns/instagram-publish-log.csv",
);

if (!TOKEN || !IG_USER_ID) {
  console.error(
    "❌ INSTAGRAM_ACCESS_TOKEN または INSTAGRAM_BUSINESS_ACCOUNT_ID が未設定",
  );
  process.exit(1);
}

const GRAPH_BASE = "https://graph.instagram.com/v21.0";

async function igPost(endpoint, params) {
  const body = new URLSearchParams({ ...params, access_token: TOKEN });
  const res = await fetch(`${GRAPH_BASE}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await res.json();
  if (data.error) throw new Error(`API ${data.error.code}: ${data.error.message}`);
  return data;
}

async function igGet(endpoint, params = {}) {
  const qs = new URLSearchParams({ ...params, access_token: TOKEN });
  const res = await fetch(`${GRAPH_BASE}/${endpoint}?${qs}`);
  const data = await res.json();
  if (data.error) throw new Error(`API ${data.error.code}: ${data.error.message}`);
  return data;
}

async function waitForFinished(containerId, maxAttempts = 20, intervalMs = 6000) {
  for (let i = 1; i <= maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const { status_code } = await igGet(containerId, { fields: "status_code" });
    console.log(`  ⏳ container status (${i}/${maxAttempts}): ${status_code}`);
    if (status_code === "FINISHED") return;
    if (status_code === "ERROR" || status_code === "EXPIRED") {
      throw new Error(`container 処理失敗: status=${status_code}`);
    }
    if (i === maxAttempts) throw new Error("container polling timeout");
  }
}

async function postCarousel(imageUrls, caption) {
  const childIds = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const { id } = await igPost(`${IG_USER_ID}/media`, {
      image_url: imageUrls[i],
      is_carousel_item: "true",
    });
    childIds.push(id);
    console.log(`  📸 child ${i + 1}/${imageUrls.length}: ${id}`);
  }

  const { id: containerId } = await igPost(`${IG_USER_ID}/media`, {
    media_type: "CAROUSEL",
    children: childIds.join(","),
    caption,
  });
  console.log(`  📦 carousel container: ${containerId}`);

  await waitForFinished(containerId);

  const { id: mediaId } = await igPost(`${IG_USER_ID}/media_publish`, {
    creation_id: containerId,
  });
  return mediaId;
}

function findEntry(posts) {
  if (POST_ID) {
    return posts.find((p) => p.id === POST_ID) || null;
  }
  return (
    posts.find(
      (p) =>
        p.platform === "instagram" &&
        p.post_type === "angle-post" &&
        (p.status === "draft" || p.status === "scheduled") &&
        (!CONTENT_KEY || p.content_key === CONTENT_KEY) &&
        (!ANGLE || p.angle === ANGLE),
    ) || null
  );
}

function buildImageUrls(entry) {
  const prefix = `${PUBLIC_R2_BASE}/sns/${entry.domain || "ranking"}/${entry.content_key}/instagram/stills`;
  return [
    `${prefix}/slide-1-cover-1080x1350.png`,
    `${prefix}/slide-2-table-1080x1350.png`,
    `${prefix}/slide-3-cta-1080x1350.png`,
  ];
}

async function verifyUrls(urls) {
  for (const url of urls) {
    const res = await fetch(url, { method: "HEAD" });
    if (!res.ok) throw new Error(`URL 到達不可 (${res.status}): ${url}`);
  }
  console.log("  ✅ public URL 確認 OK");
}

function saveResult(entry, mediaId, permalink) {
  const now = new Date().toISOString();
  // CSV ログ
  const dir = path.dirname(PUBLISH_LOG);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const header = "posted_at,domain,content_key,type,angle,media_id,permalink\n";
  if (!fs.existsSync(PUBLISH_LOG)) fs.writeFileSync(PUBLISH_LOG, header);
  fs.appendFileSync(
    PUBLISH_LOG,
    `${now},${entry.domain || "ranking"},${entry.content_key},carousel,${entry.angle || ""},${mediaId},${permalink}\n`,
  );

  // posts.json 更新
  const data = JSON.parse(fs.readFileSync(POSTS_FILE, "utf-8"));
  const idx = data.posts.findIndex((p) => p.id === entry.id);
  if (idx !== -1) {
    data.posts[idx].status = "posted";
    data.posts[idx].post_url = permalink;
    data.posts[idx].posted_at = now;
    data.posts[idx].updated_at = now;
    fs.writeFileSync(POSTS_FILE, JSON.stringify(data, null, 2) + "\n");
    console.log(`  💾 posts.json updated (id=${entry.id}, status=posted)`);
  }
}

async function main() {
  const data = JSON.parse(fs.readFileSync(POSTS_FILE, "utf-8"));
  const entry = findEntry(data.posts);

  if (!entry) {
    console.log("[post-angle-carousel] 投稿対象なし — 終了");
    process.exit(0);
  }

  console.log(
    `🎯 posting: id=${entry.id} angle=${entry.angle} key=${entry.content_key}`,
  );
  console.log(`   caption: ${entry.caption?.slice(0, 60)}...`);

  const imageUrls = buildImageUrls(entry);
  imageUrls.forEach((u, i) => console.log(`  🖼  ${i + 1}: ${u}`));

  await verifyUrls(imageUrls);

  const mediaId = await postCarousel(imageUrls, entry.caption);
  const { permalink } = await igGet(mediaId, { fields: "permalink" });

  console.log(`✅ 投稿完了: ${permalink}`);
  console.log(`PERMALINK=${permalink}`);
  console.log(`MEDIA_ID=${mediaId}`);
  console.log(`CONTENT_KEY=${entry.content_key}`);
  console.log(`DOMAIN=${entry.domain || "ranking"}`);

  saveResult(entry, mediaId, permalink);
}

main().catch((err) => {
  console.error(`\n❌ ${err.message}`);
  process.exit(1);
});
