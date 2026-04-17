#!/usr/bin/env node
/**
 * YouTube Analytics API からチャンネルデータを取得する。
 *
 * Usage:
 *   node scripts/youtube-analytics.js [report] [options]
 *
 * Reports:
 *   retention <videoId>  — 視聴維持率（相対的な離脱曲線）
 *   traffic              — トラフィックソース別の視聴回数
 *   demographics         — 視聴者の年齢・性別分布
 *   overview [days]      — チャンネル全体の日別サマリー（デフォルト: 28日）
 *   videos [days]        — 動画別パフォーマンス（デフォルト: 28日）
 *   top [days]           — 再生数上位動画（デフォルト: 90日）
 *
 * Examples:
 *   node scripts/youtube-analytics.js retention VIDEO_ID
 *   node scripts/youtube-analytics.js traffic
 *   node scripts/youtube-analytics.js overview 90
 *   node scripts/youtube-analytics.js top 28
 *
 * 前提:
 *   .env.local に以下が設定済み:
 *     GOOGLE_OAUTH_CLIENT_ID
 *     GOOGLE_OAUTH_CLIENT_SECRET
 *     GOOGLE_OAUTH_REFRESH_TOKEN
 */

const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

// --- 認証 ---
const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}

const CLIENT_ID = env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = env.GOOGLE_OAUTH_CLIENT_SECRET;
const REFRESH_TOKEN = env.GOOGLE_OAUTH_REFRESH_TOKEN;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error("Error: OAuth 認証情報が .env.local にありません。");
  console.error("先に node scripts/youtube-oauth-setup.js を実行してください。");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const youtubeAnalytics = google.youtubeAnalytics({ version: "v2", auth: oauth2Client });
const youtube = google.youtube({ version: "v3", auth: oauth2Client });

// OAuth 認証では channel==MINE で自チャンネルを指定
const CHANNEL_ID = "MINE";

// --- ヘルパー ---
function dateStr(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function formatTable(headers, rows) {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => String(r[i] ?? "").length))
  );
  const sep = widths.map((w) => "-".repeat(w + 2)).join("|");
  const fmt = (row) => row.map((v, i) => ` ${String(v ?? "").padEnd(widths[i])} `).join("|");
  return [fmt(headers), sep, ...rows.map(fmt)].join("\n");
}

// --- レポート ---

async function reportRetention(videoId) {
  if (!videoId) {
    console.error("Usage: youtube-analytics.js retention <videoId>");
    process.exit(1);
  }

  // 動画情報を取得
  const videoInfo = await youtube.videos.list({
    id: videoId,
    part: "snippet,contentDetails,statistics",
  });
  const video = videoInfo.data.items?.[0];
  if (video) {
    console.log(`\n動画: ${video.snippet.title}`);
    console.log(`再生数: ${Number(video.statistics.viewCount).toLocaleString()}`);
    console.log(`時間: ${video.contentDetails.duration}\n`);
  }

  // 視聴維持率（audienceRetention は elapsedVideoTimeRatio ベース）
  const res = await youtubeAnalytics.reports.query({
    ids: `channel==${CHANNEL_ID}`,
    startDate: "2020-01-01",
    endDate: dateStr(0),
    metrics: "audienceWatchRatio",
    dimensions: "elapsedVideoTimeRatio",
    filters: `video==${videoId}`,
  });

  if (!res.data.rows || res.data.rows.length === 0) {
    console.log("視聴維持データがありません（再生数が少ない可能性）");
    return;
  }

  console.log("視聴維持率（elapsedVideoTimeRatio → audienceWatchRatio）:\n");
  const headers = ["経過割合", "視聴維持率"];
  const rows = res.data.rows.map(([ratio, watchRatio]) => [
    `${(ratio * 100).toFixed(0)}%`,
    `${(watchRatio * 100).toFixed(1)}%`,
  ]);
  console.log(formatTable(headers, rows));

  // 離脱ポイントの分析
  const data = res.data.rows.map(([r, w]) => ({ ratio: r, watch: w }));
  const mid = data.find((d) => d.watch < 0.5);
  if (mid) {
    console.log(`\n50% 離脱ポイント: 動画の ${(mid.ratio * 100).toFixed(0)}% 地点`);
  }
}

async function reportTraffic(days = 28) {
  const res = await youtubeAnalytics.reports.query({
    ids: `channel==${CHANNEL_ID}`,
    startDate: dateStr(days),
    endDate: dateStr(0),
    metrics: "views,estimatedMinutesWatched",
    dimensions: "insightTrafficSourceType",
    sort: "-views",
  });

  console.log(`\nトラフィックソース（過去${days}日）:\n`);
  const headers = ["ソース", "視聴回数", "推定視聴時間(分)"];
  const rows = (res.data.rows || []).map(([src, views, minutes]) => [
    src,
    Number(views).toLocaleString(),
    Number(minutes).toLocaleString(),
  ]);
  console.log(formatTable(headers, rows));
}

async function reportDemographics(days = 28) {
  const res = await youtubeAnalytics.reports.query({
    ids: `channel==${CHANNEL_ID}`,
    startDate: dateStr(days),
    endDate: dateStr(0),
    metrics: "viewerPercentage",
    dimensions: "ageGroup,gender",
    sort: "-viewerPercentage",
  });

  console.log(`\n視聴者属性（過去${days}日）:\n`);
  const headers = ["年齢層", "性別", "割合"];
  const rows = (res.data.rows || []).map(([age, gender, pct]) => [
    age,
    gender === "male" ? "男性" : gender === "female" ? "女性" : gender,
    `${pct.toFixed(1)}%`,
  ]);
  console.log(formatTable(headers, rows));
}

async function reportOverview(days = 28) {
  const res = await youtubeAnalytics.reports.query({
    ids: `channel==${CHANNEL_ID}`,
    startDate: dateStr(days),
    endDate: dateStr(0),
    metrics: "views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost,likes",
    dimensions: "day",
    sort: "day",
  });

  console.log(`\nチャンネル日別サマリー（過去${days}日）:\n`);
  const headers = ["日付", "視聴回数", "視聴時間(分)", "平均視聴秒", "登録+", "登録-", "いいね"];
  const rows = (res.data.rows || []).map(([day, views, mins, avgDur, subGain, subLost, likes]) => [
    day,
    views,
    mins.toFixed(1),
    avgDur.toFixed(0),
    subGain,
    subLost,
    likes,
  ]);
  console.log(formatTable(headers, rows));

  // サマリー
  const totalViews = res.data.rows.reduce((s, r) => s + r[1], 0);
  const totalMins = res.data.rows.reduce((s, r) => s + r[2], 0);
  const avgDuration = res.data.rows.reduce((s, r) => s + r[3], 0) / res.data.rows.length;
  console.log(`\n合計: ${totalViews}回視聴, ${totalMins.toFixed(0)}分, 平均${avgDuration.toFixed(0)}秒/視聴`);
}

async function reportVideos(days = 28) {
  const res = await youtubeAnalytics.reports.query({
    ids: `channel==${CHANNEL_ID}`,
    startDate: dateStr(days),
    endDate: dateStr(0),
    metrics: "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,likes",
    dimensions: "video",
    sort: "-views",
    maxResults: 50,
  });

  // 動画タイトルを取得
  const videoIds = (res.data.rows || []).map((r) => r[0]);
  const titleMap = new Map();
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50).join(",");
    const vids = await youtube.videos.list({ id: batch, part: "snippet" });
    for (const v of vids.data.items || []) {
      titleMap.set(v.id, v.snippet.title);
    }
  }

  console.log(`\n動画別パフォーマンス（過去${days}日）:\n`);
  const headers = ["タイトル", "視聴回数", "視聴時間(分)", "平均秒", "平均%", "いいね"];
  const rows = (res.data.rows || []).map(([id, views, mins, avgDur, avgPct, likes]) => [
    (titleMap.get(id) || id).substring(0, 40),
    views,
    mins.toFixed(1),
    avgDur.toFixed(0),
    `${avgPct.toFixed(1)}%`,
    likes,
  ]);
  console.log(formatTable(headers, rows));
}

async function reportTop(days = 90) {
  const res = await youtubeAnalytics.reports.query({
    ids: `channel==${CHANNEL_ID}`,
    startDate: dateStr(days),
    endDate: dateStr(0),
    metrics: "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage",
    dimensions: "video",
    sort: "-views",
    maxResults: 20,
  });

  const videoIds = (res.data.rows || []).map((r) => r[0]);
  const titleMap = new Map();
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50).join(",");
    const vids = await youtube.videos.list({ id: batch, part: "snippet,contentDetails" });
    for (const v of vids.data.items || []) {
      titleMap.set(v.id, { title: v.snippet.title, duration: v.contentDetails.duration });
    }
  }

  console.log(`\n再生数 Top 20（過去${days}日）:\n`);
  const headers = ["#", "タイトル", "視聴回数", "視聴時間", "平均秒", "維持率%", "動画時間"];
  const rows = (res.data.rows || []).map(([id, views, mins, avgDur, avgPct], i) => [
    i + 1,
    (titleMap.get(id)?.title || id).substring(0, 35),
    views,
    `${mins.toFixed(0)}分`,
    avgDur.toFixed(0),
    `${avgPct.toFixed(1)}%`,
    titleMap.get(id)?.duration || "",
  ]);
  console.log(formatTable(headers, rows));
}

// --- メイン ---
async function main() {
  const [, , report, ...args] = process.argv;

  switch (report) {
    case "retention":
      await reportRetention(args[0]);
      break;
    case "traffic":
      await reportTraffic(Number(args[0]) || 28);
      break;
    case "demographics":
      await reportDemographics(Number(args[0]) || 28);
      break;
    case "overview":
      await reportOverview(Number(args[0]) || 28);
      break;
    case "videos":
      await reportVideos(Number(args[0]) || 28);
      break;
    case "top":
      await reportTop(Number(args[0]) || 90);
      break;
    default:
      console.log("YouTube Analytics レポート\n");
      console.log("Usage: node scripts/youtube-analytics.js <report> [options]\n");
      console.log("Reports:");
      console.log("  retention <videoId>  視聴維持率（離脱曲線）");
      console.log("  traffic [days]       トラフィックソース（デフォルト: 28日）");
      console.log("  demographics [days]  視聴者属性（デフォルト: 28日）");
      console.log("  overview [days]      チャンネル日別サマリー（デフォルト: 28日）");
      console.log("  videos [days]        動画別パフォーマンス（デフォルト: 28日）");
      console.log("  top [days]           再生数上位動画（デフォルト: 90日）");
      break;
  }
}

main().catch((err) => {
  if (err.message?.includes("invalid_grant")) {
    console.error("Error: リフレッシュトークンが無効です。再認証してください:");
    console.error("  node scripts/youtube-oauth-setup.js");
  } else {
    console.error("Error:", err.message);
  }
  process.exit(1);
});
