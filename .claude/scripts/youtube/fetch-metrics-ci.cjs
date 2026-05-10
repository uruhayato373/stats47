#!/usr/bin/env node
/**
 * YouTube メトリクス取得（CI 用）
 *
 * GitHub Actions から実行する。.env.local（GOOGLE_OAUTH_CLIENT_ID/SECRET/REFRESH_TOKEN）
 * を読み込み、チャンネル全動画のメトリクスを取得して SNS metrics CSV に記録する。
 * D1 DB への書き込みは行わない（sns_post_id = "" でも CSV に記録可能）。
 */

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const store = require(path.join(PROJECT_ROOT, ".claude/scripts/lib/sns-metrics-store.cjs"));
const { google } = require(path.join(PROJECT_ROOT, "node_modules/googleapis"));

// .env.local から OAuth 認証情報を読み込む
const envPath = path.join(PROJECT_ROOT, ".env.local");
const envVars = {};
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.+)$/);
    if (m) envVars[m[1]] = m[2].trim();
  }
}

const CLIENT_ID = envVars.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = envVars.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const REFRESH_TOKEN = envVars.GOOGLE_OAUTH_REFRESH_TOKEN || process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
const CHANNEL_ID = "UCdRiwDSX1aUd0dSd7Cs08Kg";

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error("Error: GOOGLE_OAUTH_CLIENT_ID / CLIENT_SECRET / REFRESH_TOKEN が未設定");
  process.exit(1);
}

const FETCHED_AT = new Date().toISOString();

async function main() {
  console.log("YouTube メトリクス取得開始...");

  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  // uploads プレイリスト ID を取得
  const ch = await youtube.channels.list({ id: [CHANNEL_ID], part: ["contentDetails"] });
  const uploadsId = ch.data.items[0].contentDetails.relatedPlaylists.uploads;

  // 全動画 ID を収集
  const allVideoIds = [];
  let nextPageToken;
  do {
    const pl = await youtube.playlistItems.list({
      playlistId: uploadsId,
      part: ["contentDetails"],
      maxResults: 50,
      pageToken: nextPageToken,
    });
    allVideoIds.push(...pl.data.items.map((i) => i.contentDetails.videoId));
    nextPageToken = pl.data.nextPageToken;
  } while (nextPageToken);
  console.log(`動画数: ${allVideoIds.length} 件`);

  // 50件ずつ statistics を取得
  let saved = 0;
  for (let i = 0; i < allVideoIds.length; i += 50) {
    const chunk = allVideoIds.slice(i, i + 50);
    const res = await youtube.videos.list({
      id: chunk,
      part: ["statistics"],
    });
    for (const v of res.data.items || []) {
      const s = v.statistics || {};
      store.upsertMetric({
        sns_post_id: "",
        platform: "youtube",
        domain: "ranking",
        content_key: v.id, // video_id をプロキシとして使用
        fetched_at: FETCHED_AT,
        impressions: "",
        reach: "",
        views: s.viewCount || 0,
        likes: s.likeCount || 0,
        comments: s.commentCount || 0,
        shares: "",
        saves: "",
        quotes: "",
      });
      saved++;
    }
    console.log(`  ${Math.min(i + 50, allVideoIds.length)}/${allVideoIds.length} 件処理済み`);
  }

  console.log(`✅ YouTube メトリクス記録完了: ${saved} 件`);
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
