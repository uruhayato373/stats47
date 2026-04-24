#!/usr/bin/env node
/**
 * YouTube シャドウバン疑いの事実ベース診断。
 *
 * Usage:
 *   node .claude/scripts/youtube/diagnose-shadowban.js                   # JSON を stdout へ
 *   node .claude/scripts/youtube/diagnose-shadowban.js --pretty          # Markdown 要約を併記
 *   node .claude/scripts/youtube/diagnose-shadowban.js --days 14         # 対象期間を変更
 *   node .claude/scripts/youtube/diagnose-shadowban.js --views-threshold 50
 *
 * 出力（JSON）:
 *   {
 *     channel: { subscriberCount, viewCount, videoCount },
 *     window: { days, recentStart, recentEnd, priorStart, priorEnd },
 *     suspectVideos: [{ videoId, title, publishedAt, ageHours, views, likes, comments }],
 *     trafficSourceBreakdown: { recent: { source: views }, prior: { source: views } },
 *     subscriberDelta: { recent: { gained, lost, net }, prior: { gained, lost, net } },
 *     viewsDelta: { recent, prior, changePct },
 *     verdict: "likely-shadowban" | "watch" | "healthy",
 *     verdictReasons: [string]
 *   }
 *
 * 前提:
 *   .env.local に GOOGLE_OAUTH_CLIENT_ID / SECRET / REFRESH_TOKEN。
 *   このスクリプトは read-only（API 呼び出しは list / reports.query のみ）。
 */

const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const envPath = path.resolve(__dirname, "..", "..", "..", ".env.local");
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
  console.error("Error: .env.local に GOOGLE_OAUTH_* が必要です");
  process.exit(1);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { pretty: false, days: 14, viewsThreshold: 50, minAgeHours: 48 };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--pretty":
        opts.pretty = true;
        break;
      case "--days":
        opts.days = Number(args[++i]);
        break;
      case "--views-threshold":
        opts.viewsThreshold = Number(args[++i]);
        break;
      case "--min-age-hours":
        opts.minAgeHours = Number(args[++i]);
        break;
    }
  }
  return opts;
}

function dateStr(d) {
  return d.toISOString().slice(0, 10);
}

async function main() {
  const opts = parseArgs();
  const now = new Date();
  const recentEnd = new Date(now);
  const recentStart = new Date(now);
  recentStart.setUTCDate(recentStart.getUTCDate() - opts.days);
  const priorEnd = new Date(recentStart);
  const priorStart = new Date(recentStart);
  priorStart.setUTCDate(priorStart.getUTCDate() - opts.days);

  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });
  const ytAnalytics = google.youtubeAnalytics({ version: "v2", auth: oauth2Client });
  const CHANNEL = "MINE";

  // --- channel stats ---
  const chRes = await youtube.channels.list({ part: "statistics,snippet", mine: true });
  const chItem = chRes.data.items?.[0];
  const channel = {
    id: chItem?.id,
    title: chItem?.snippet?.title,
    subscriberCount: Number(chItem?.statistics?.subscriberCount ?? 0),
    viewCount: Number(chItem?.statistics?.viewCount ?? 0),
    videoCount: Number(chItem?.statistics?.videoCount ?? 0),
  };

  // --- recent uploads ---
  const uploadsPlaylist = (await youtube.channels.list({ part: "contentDetails", mine: true }))
    .data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  const recentVideoIds = [];
  let pageToken;
  while (true) {
    const res = await youtube.playlistItems.list({
      playlistId: uploadsPlaylist,
      part: "contentDetails",
      maxResults: 50,
      pageToken,
    });
    for (const item of res.data.items || []) {
      const publishedAt = new Date(item.contentDetails.videoPublishedAt);
      if (publishedAt < recentStart) {
        pageToken = null;
        break;
      }
      recentVideoIds.push(item.contentDetails.videoId);
    }
    if (!pageToken) break;
    pageToken = res.data.nextPageToken;
    if (!pageToken) break;
  }

  // --- video details ---
  const videosDetail = [];
  for (let i = 0; i < recentVideoIds.length; i += 50) {
    const batch = recentVideoIds.slice(i, i + 50).join(",");
    const res = await youtube.videos.list({ id: batch, part: "snippet,statistics" });
    for (const v of res.data.items || []) {
      const publishedAt = new Date(v.snippet.publishedAt);
      const ageHours = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60);
      videosDetail.push({
        videoId: v.id,
        title: v.snippet.title,
        publishedAt: v.snippet.publishedAt,
        ageHours: Math.round(ageHours * 10) / 10,
        views: Number(v.statistics.viewCount ?? 0),
        likes: Number(v.statistics.likeCount ?? 0),
        comments: Number(v.statistics.commentCount ?? 0),
      });
    }
  }
  videosDetail.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  const suspectVideos = videosDetail.filter(
    (v) => v.ageHours >= opts.minAgeHours && v.views < opts.viewsThreshold,
  );

  // --- traffic source comparison ---
  async function traffic(startDate, endDate) {
    const res = await ytAnalytics.reports.query({
      ids: `channel==${CHANNEL}`,
      startDate: dateStr(startDate),
      endDate: dateStr(endDate),
      metrics: "views",
      dimensions: "insightTrafficSourceType",
      sort: "-views",
    });
    const map = {};
    for (const [src, views] of res.data.rows || []) map[src] = Number(views);
    return map;
  }
  const [recentTraffic, priorTraffic] = await Promise.all([
    traffic(recentStart, recentEnd),
    traffic(priorStart, priorEnd),
  ]);

  // --- subscriber delta ---
  async function subs(startDate, endDate) {
    const res = await ytAnalytics.reports.query({
      ids: `channel==${CHANNEL}`,
      startDate: dateStr(startDate),
      endDate: dateStr(endDate),
      metrics: "subscribersGained,subscribersLost,views",
    });
    const row = res.data.rows?.[0] || [0, 0, 0];
    return { gained: Number(row[0]), lost: Number(row[1]), net: Number(row[0]) - Number(row[1]), views: Number(row[2]) };
  }
  const [recentSubs, priorSubs] = await Promise.all([
    subs(recentStart, recentEnd),
    subs(priorStart, priorEnd),
  ]);

  // --- verdict ---
  const viewsDeltaPct = priorSubs.views > 0
    ? ((recentSubs.views - priorSubs.views) / priorSubs.views) * 100
    : null;
  const suggestedRecent = recentTraffic["SUGGESTED_VIDEO"] ?? recentTraffic["YT_OTHER_PAGE"] ?? 0;
  const suggestedPrior = priorTraffic["SUGGESTED_VIDEO"] ?? priorTraffic["YT_OTHER_PAGE"] ?? 0;
  const suggestedDeltaPct = suggestedPrior > 0
    ? ((suggestedRecent - suggestedPrior) / suggestedPrior) * 100
    : null;

  const reasons = [];
  if (suspectVideos.length >= 2) {
    reasons.push(`suspect videos = ${suspectVideos.length} (views < ${opts.viewsThreshold} after ${opts.minAgeHours}h)`);
  }
  if (viewsDeltaPct !== null && viewsDeltaPct <= -80) {
    reasons.push(`total views ${viewsDeltaPct.toFixed(1)}% (prior ${priorSubs.views} → recent ${recentSubs.views})`);
  } else if (viewsDeltaPct !== null && viewsDeltaPct <= -50) {
    reasons.push(`total views ${viewsDeltaPct.toFixed(1)}% (soft drop)`);
  }
  if (suggestedDeltaPct !== null && suggestedDeltaPct <= -80) {
    reasons.push(`suggested-video traffic ${suggestedDeltaPct.toFixed(1)}% (prior ${suggestedPrior} → recent ${suggestedRecent})`);
  }
  if (recentSubs.lost > recentSubs.gained) {
    reasons.push(`subscriber net negative: gained ${recentSubs.gained} / lost ${recentSubs.lost}`);
  }

  let verdict = "healthy";
  if (
    suspectVideos.length >= 5 ||
    reasons.length >= 2 ||
    (suspectVideos.length >= 2 && viewsDeltaPct !== null && viewsDeltaPct <= -80)
  ) {
    verdict = "likely-shadowban";
  } else if (reasons.length === 1) {
    verdict = "watch";
  }

  const result = {
    channel,
    window: {
      days: opts.days,
      recentStart: dateStr(recentStart),
      recentEnd: dateStr(recentEnd),
      priorStart: dateStr(priorStart),
      priorEnd: dateStr(priorEnd),
    },
    thresholds: {
      viewsThreshold: opts.viewsThreshold,
      minAgeHours: opts.minAgeHours,
    },
    suspectVideos,
    trafficSourceBreakdown: { recent: recentTraffic, prior: priorTraffic },
    subscriberDelta: { recent: recentSubs, prior: priorSubs },
    viewsDelta: { recent: recentSubs.views, prior: priorSubs.views, changePct: viewsDeltaPct },
    verdict,
    verdictReasons: reasons,
  };

  if (opts.pretty) {
    console.log("# YouTube Shadowban Diagnosis\n");
    console.log(`Verdict: **${verdict}**`);
    if (reasons.length) console.log(`Reasons: ${reasons.map((r) => "- " + r).join("\n")}`);
    console.log(`\nChannel: ${channel.title} (${channel.id}) subs=${channel.subscriberCount} totalViews=${channel.viewCount} videos=${channel.videoCount}`);
    console.log(`Window: recent ${dateStr(recentStart)}..${dateStr(recentEnd)} vs prior ${dateStr(priorStart)}..${dateStr(priorEnd)}`);
    console.log(`Views: prior ${priorSubs.views} → recent ${recentSubs.views}${viewsDeltaPct !== null ? ` (${viewsDeltaPct.toFixed(1)}%)` : ""}`);
    console.log(`Subs: gained ${recentSubs.gained} / lost ${recentSubs.lost}`);
    console.log(`\nSuspect videos (${suspectVideos.length}):`);
    for (const v of suspectVideos) {
      console.log(`  ${v.videoId} views=${v.views} age=${v.ageHours}h — ${v.title}`);
    }
    console.log(`\nTraffic source (recent):`);
    for (const [k, v] of Object.entries(recentTraffic)) {
      const p = priorTraffic[k] ?? 0;
      console.log(`  ${k}: ${v} (prior ${p})`);
    }
    console.log("\n--- JSON ---");
  }
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("Error:", err.message);
  if (err.response?.data) console.error("Details:", JSON.stringify(err.response.data, null, 2));
  process.exit(1);
});
