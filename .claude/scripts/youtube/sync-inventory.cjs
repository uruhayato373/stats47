#!/usr/bin/env node
/**
 * YouTube channel と D1 sns_posts の inventory を同期する。
 *
 * 動作:
 *   1. チャンネル UCdRiwDSX1aUd0dSd7Cs08Kg の全動画を API で取得
 *   2. D1 の sns_posts (platform='youtube') と video_id でマッチング
 *   3. D1 に無い動画 → INSERT (status='posted', deleted_at=NULL)
 *   4. D1 にあるが channel に無い動画 → deleted_at にタイムスタンプを書く (履歴は残す)
 *
 * Usage:
 *   node .claude/scripts/youtube/sync-inventory.cjs [--dry-run]
 *
 * これは inventory の真実源を D1 にするための同期スクリプト。
 * 月 1 回、または大量削除/復元の直後に実行する想定。
 */

const { google } = require("googleapis");
const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const CHANNEL_ID = "UCdRiwDSX1aUd0dSd7Cs08Kg";
const D1_PATH = path.join(
  PROJECT_ROOT,
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite",
);

function loadEnv() {
  const envPath = path.join(PROJECT_ROOT, ".env.local");
  const env = {};
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

function videoIdFromUrl(url) {
  if (!url) return null;
  const m = url.match(/[?&]v=([\w-]{11})/) || url.match(/youtu\.be\/([\w-]{11})/);
  return m ? m[1] : null;
}

async function fetchAllChannelVideos(yt) {
  const ch = await yt.channels.list({ part: "contentDetails", id: CHANNEL_ID });
  const uploads = ch.data.items[0].contentDetails.relatedPlaylists.uploads;

  const allIds = [];
  let pageToken;
  do {
    const r = await yt.playlistItems.list({
      part: "contentDetails",
      playlistId: uploads,
      maxResults: 50,
      pageToken,
    });
    for (const it of r.data.items) allIds.push(it.contentDetails.videoId);
    pageToken = r.data.nextPageToken;
  } while (pageToken);

  const videos = [];
  for (let i = 0; i < allIds.length; i += 50) {
    const r = await yt.videos.list({
      part: "snippet,contentDetails,status",
      id: allIds.slice(i, i + 50).join(","),
    });
    for (const v of r.data.items) {
      videos.push({
        videoId: v.id,
        title: v.snippet.title,
        publishedAt: v.snippet.publishedAt,
        duration: v.contentDetails.duration,
        privacyStatus: v.status.privacyStatus,
        thumbnail: v.snippet.thumbnails?.maxres || v.snippet.thumbnails?.high,
      });
    }
  }
  return videos;
}

function isDryRun() {
  return process.argv.includes("--dry-run");
}

async function main() {
  const dryRun = isDryRun();
  console.log(`[sync-inventory] mode: ${dryRun ? "DRY-RUN" : "EXECUTE"}`);

  const env = loadEnv();
  const oauth2 = new google.auth.OAuth2(env.GOOGLE_OAUTH_CLIENT_ID, env.GOOGLE_OAUTH_CLIENT_SECRET);
  oauth2.setCredentials({ refresh_token: env.GOOGLE_OAUTH_REFRESH_TOKEN });
  const yt = google.youtube({ version: "v3", auth: oauth2 });

  console.log("[sync-inventory] YouTube から全動画を取得中...");
  const channelVideos = await fetchAllChannelVideos(yt);
  console.log(`[sync-inventory] channel videos: ${channelVideos.length}`);
  const channelIds = new Set(channelVideos.map((v) => v.videoId));

  const db = new Database(D1_PATH);
  try {
    const d1Rows = db
      .prepare(
        `SELECT id, content_key, caption, post_url, status, posted_at, scheduled_at, deleted_at
         FROM sns_posts
         WHERE platform = 'youtube'`,
      )
      .all();
    console.log(`[sync-inventory] D1 youtube rows: ${d1Rows.length}`);

    const d1ByVideoId = new Map();
    for (const r of d1Rows) {
      const vid = videoIdFromUrl(r.post_url);
      if (vid) d1ByVideoId.set(vid, r);
    }

    // 1. channel にあるが D1 に無い → INSERT
    const toInsert = channelVideos.filter((v) => !d1ByVideoId.has(v.videoId));
    console.log(`[sync-inventory] 新規 INSERT 対象: ${toInsert.length} 本`);

    // 2. D1 にあるが channel に無い、かつ deleted_at が未設定 → deleted_at マーク
    const toMarkDeleted = d1Rows.filter((r) => {
      const vid = videoIdFromUrl(r.post_url);
      return vid && !channelIds.has(vid) && !r.deleted_at;
    });
    console.log(`[sync-inventory] 削除マーク対象: ${toMarkDeleted.length} 本`);

    if (dryRun) {
      console.log("\n=== INSERT サンプル (最初の 5 件) ===");
      toInsert.slice(0, 5).forEach((v) => {
        console.log(`  ${v.videoId} ${v.publishedAt.slice(0, 10)} "${v.title.slice(0, 50)}"`);
      });
      console.log("\n=== 削除マーク サンプル (最初の 5 件) ===");
      toMarkDeleted.slice(0, 5).forEach((r) => {
        const vid = videoIdFromUrl(r.post_url);
        console.log(`  ${vid} sns_posts.id=${r.id} "${r.caption?.slice(0, 50) ?? ""}"`);
      });
      console.log("\n[sync-inventory] DRY-RUN 完了。実行は --dry-run を外す");
      return;
    }

    // 実際の INSERT
    const insertStmt = db.prepare(
      `INSERT INTO sns_posts (
        platform, post_type, domain, content_key,
        caption, post_url,
        status, posted_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const now = new Date().toISOString();
    let inserted = 0;
    db.transaction(() => {
      for (const v of toInsert) {
        // duration から post_type を推定
        const m = v.duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
        const secs = (parseInt(m?.[1] || 0)) * 60 + parseInt(m?.[2] || 0);
        const postType = secs <= 60 ? "short" : secs >= 240 ? "normal" : "short"; // ≤60s=shorts, ≥4min=normal, それ以外=short
        insertStmt.run(
          "youtube",
          postType,
          "ranking",
          null, // content_key は API では取得不能、必要なら後で手動補完
          v.title,
          `https://www.youtube.com/watch?v=${v.videoId}`,
          "posted",
          v.publishedAt,
          now,
          now,
        );
        inserted++;
      }
    })();
    console.log(`[sync-inventory] INSERT 完了: ${inserted} 本`);

    // 削除マーク
    const deleteStmt = db.prepare(
      `UPDATE sns_posts SET deleted_at = ?, updated_at = ? WHERE id = ?`,
    );
    let marked = 0;
    db.transaction(() => {
      for (const r of toMarkDeleted) {
        deleteStmt.run(now, now, r.id);
        marked++;
      }
    })();
    console.log(`[sync-inventory] 削除マーク完了: ${marked} 本`);
  } finally {
    db.close();
  }
}

main().catch((err) => {
  console.error("[sync-inventory] FATAL:", err.message);
  process.exit(1);
});
