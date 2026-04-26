#!/usr/bin/env node
/**
 * GitHub Actions 用 IG 予約投稿スクリプト
 *
 * `.claude/state/instagram-w18-schedule.json` を読み、今日 (JST) と一致する
 * エントリがあれば Instagram Graph API で投稿する。
 *
 * 設計:
 * - ローカルファイル依存なし (caption / media は R2 公開 URL から取得)
 * - D1 への書き込みなし (CI に D1 環境なし)
 * - 投稿成功 / 該当なし は exit 0、API エラーのみ exit 1
 *
 * 環境変数:
 *   INSTAGRAM_ACCESS_TOKEN
 *   INSTAGRAM_BUSINESS_ACCOUNT_ID
 *   IG_PUBLIC_R2_BASE (default: https://storage.stats47.jp)
 *   IG_SCHEDULE_FILE (default: .claude/state/instagram-w18-schedule.json)
 *   IG_FORCE_DATE (test 用: JST 日付を強制指定 YYYY-MM-DD)
 */

const fs = require("node:fs");
const path = require("node:path");

const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const IG_USER_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
const PUBLIC_R2_BASE = process.env.IG_PUBLIC_R2_BASE || "https://storage.stats47.jp";
const SCHEDULE_FILE =
  process.env.IG_SCHEDULE_FILE || ".claude/state/instagram-w18-schedule.json";
const FORCE_DATE = process.env.IG_FORCE_DATE; // YYYY-MM-DD

if (!TOKEN || !IG_USER_ID) {
  console.error("❌ INSTAGRAM_ACCESS_TOKEN または INSTAGRAM_BUSINESS_ACCOUNT_ID が未設定");
  process.exit(1);
}

function getJstDate() {
  if (FORCE_DATE) return FORCE_DATE;
  const now = new Date();
  // UTC + 9 hours = JST
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

async function findTodayEntry() {
  const file = path.resolve(SCHEDULE_FILE);
  if (!fs.existsSync(file)) {
    console.log(`[post-from-schedule] schedule file not found: ${file}`);
    return null;
  }
  const today = getJstDate();
  console.log(`[post-from-schedule] today (JST): ${today}`);
  const entries = JSON.parse(fs.readFileSync(file, "utf-8"));
  return entries.find((e) => e.date === today) || null;
}

async function fetchCaption(domain, contentKey) {
  const url = `${PUBLIC_R2_BASE}/sns/${domain}/${contentKey}/instagram/caption.txt`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`caption fetch failed (${res.status}): ${url}`);
  return (await res.text()).trim();
}

function mediaUrlFor(type, domain, contentKey) {
  if (type === "reels") {
    return `${PUBLIC_R2_BASE}/sns/${domain}/${contentKey}/instagram/reel.mp4`;
  }
  // image: 1 枚目の slide を採用
  return `${PUBLIC_R2_BASE}/sns/${domain}/${contentKey}/instagram/stills/slide-1-cover-1080x1350.png`;
}

async function postReels({ contentKey, caption, videoUrl }) {
  console.log(`📦 reels container 作成...`);
  const containerRes = await fetch(
    `https://graph.instagram.com/v21.0/${IG_USER_ID}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        media_type: "REELS",
        video_url: videoUrl,
        caption,
        access_token: TOKEN,
      }),
    },
  );
  const containerJson = await containerRes.json();
  if (!containerJson.id) {
    throw new Error(`container 作成失敗: ${JSON.stringify(containerJson)}`);
  }
  const containerId = containerJson.id;
  console.log(`  container id: ${containerId}`);

  console.log(`⏳ 動画処理 polling...`);
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const statusRes = await fetch(
      `https://graph.instagram.com/v21.0/${containerId}?fields=status_code&access_token=${TOKEN}`,
    );
    const statusJson = await statusRes.json();
    console.log(`  status (${i + 1}/60): ${statusJson.status_code}`);
    if (statusJson.status_code === "FINISHED") break;
    if (statusJson.status_code === "ERROR") {
      throw new Error(`container 処理失敗: ${JSON.stringify(statusJson)}`);
    }
    if (i === 59) throw new Error(`動画処理 timeout (5 分)`);
  }

  console.log(`🚀 publish...`);
  const publishRes = await fetch(
    `https://graph.instagram.com/v21.0/${IG_USER_ID}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        creation_id: containerId,
        access_token: TOKEN,
      }),
    },
  );
  const publishJson = await publishRes.json();
  if (!publishJson.id) {
    throw new Error(`publish 失敗: ${JSON.stringify(publishJson)}`);
  }

  const permalink = await fetchPermalink(publishJson.id);
  console.log(`✅ 投稿完了 media id: ${publishJson.id}`);
  console.log(`PERMALINK=${permalink}`);
  return { mediaId: publishJson.id, permalink };
}

async function fetchPermalink(mediaId) {
  try {
    const res = await fetch(
      `https://graph.instagram.com/v21.0/${mediaId}?fields=permalink&access_token=${TOKEN}`,
    );
    const json = await res.json();
    return json.permalink || `https://www.instagram.com/p/${mediaId}/`;
  } catch {
    return `https://www.instagram.com/p/${mediaId}/`;
  }
}

async function postImage({ contentKey, caption, imageUrl }) {
  console.log(`📦 image container 作成...`);
  const containerRes = await fetch(
    `https://graph.instagram.com/v21.0/${IG_USER_ID}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        image_url: imageUrl,
        caption,
        access_token: TOKEN,
      }),
    },
  );
  const containerJson = await containerRes.json();
  if (!containerJson.id) {
    throw new Error(`container 作成失敗: ${JSON.stringify(containerJson)}`);
  }
  const containerId = containerJson.id;

  console.log(`🚀 publish...`);
  const publishRes = await fetch(
    `https://graph.instagram.com/v21.0/${IG_USER_ID}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        creation_id: containerId,
        access_token: TOKEN,
      }),
    },
  );
  const publishJson = await publishRes.json();
  if (!publishJson.id) throw new Error(`publish 失敗: ${JSON.stringify(publishJson)}`);

  const permalink = await fetchPermalink(publishJson.id);
  console.log(`✅ 投稿完了 media id: ${publishJson.id}`);
  console.log(`PERMALINK=${permalink}`);
  return { mediaId: publishJson.id, permalink };
}

async function main() {
  const entry = await findTodayEntry();
  if (!entry) {
    console.log(`[post-from-schedule] 今日の予定なし、skip`);
    process.exit(0);
  }

  console.log(`[post-from-schedule] 投稿対象: ${JSON.stringify(entry)}`);

  const caption = await fetchCaption(entry.domain, entry.content_key);
  console.log(`📝 caption (先頭 80): ${caption.slice(0, 80)}...`);

  const mediaUrl = mediaUrlFor(entry.type, entry.domain, entry.content_key);
  // 公開 URL の到達確認
  const headRes = await fetch(mediaUrl, { method: "HEAD" });
  if (!headRes.ok) {
    throw new Error(`media URL 到達不能 (${headRes.status}): ${mediaUrl}`);
  }
  console.log(`✅ media URL OK: ${mediaUrl}`);

  if (entry.type === "reels") {
    await postReels({ contentKey: entry.content_key, caption, videoUrl: mediaUrl });
  } else {
    await postImage({ contentKey: entry.content_key, caption, imageUrl: mediaUrl });
  }
}

main().catch((err) => {
  console.error(`❌ ${err.message || err}`);
  process.exit(1);
});
