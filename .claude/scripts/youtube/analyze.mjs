#!/usr/bin/env node
/**
 * YouTube 動画の内容を詳細分析する（メタデータ + 字幕テキスト + サムネイル URL）。
 *
 * Usage:
 *   node .claude/scripts/youtube/analyze.mjs <url-or-videoId>
 *
 * Examples:
 *   node .claude/scripts/youtube/analyze.mjs https://www.youtube.com/shorts/mlfNXVBqmLs
 *   node .claude/scripts/youtube/analyze.mjs mlfNXVBqmLs
 *
 * 出力:
 *   - コンソール: メタデータテーブル + 字幕全文
 *   - JSON: /tmp/youtube-analysis-<videoId>.json
 *
 * 前提:
 *   - サービスアカウント鍵: stats47-*.json（リポジトリルート）
 *   - npm パッケージ: googleapis, youtube-transcript
 */

import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// youtube-transcript は package.json の設定不備で通常 import が壊れるため ESM ファイルを直接指定
const ytPath = join(__dirname, "..", "..", "..", "node_modules/youtube-transcript/dist/youtube-transcript.esm.js");
const { fetchTranscript } = await import(ytPath);
const { google } = require("googleapis");
const fs = require("fs");

// --- videoId 抽出 ---
const VIDEO_ID_REGEX =
  /(?:youtube\.com\/(?:shorts\/|(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=))|youtu\.be\/)([^"&?/\s]{11})/i;

function extractVideoId(input) {
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  const match = input.match(VIDEO_ID_REGEX);
  if (match) return match[1];
  throw new Error(`videoId を抽出できません: ${input}`);
}

// --- 認証（サービスアカウント） ---
function createYoutubeClient() {
  const root = resolve(__dirname, "..", "..", "..");
  const KEY_CANDIDATES = ["stats47-f6b5dae19196.json", "stats47-31b18ee67144.json"];
  const keyFile = KEY_CANDIDATES.map((f) => join(root, f)).find((f) => fs.existsSync(f));
  if (!keyFile) {
    throw new Error(`サービスアカウント鍵が見つかりません: ${KEY_CANDIDATES.join(" / ")}`);
  }
  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ["https://www.googleapis.com/auth/youtube.readonly"],
  });
  return google.youtube({ version: "v3", auth });
}

// --- メタデータ取得 ---
async function fetchMetadata(youtube, videoId) {
  const res = await youtube.videos.list({
    id: videoId,
    part: "snippet,statistics,contentDetails",
  });
  const item = res.data.items?.[0];
  if (!item) throw new Error(`動画が見つかりません: ${videoId}`);

  const { snippet, statistics, contentDetails } = item;
  return {
    title: snippet.title,
    description: snippet.description,
    channelTitle: snippet.channelTitle,
    publishedAt: snippet.publishedAt,
    tags: snippet.tags ?? [],
    duration: contentDetails.duration,
    viewCount: Number(statistics.viewCount ?? 0),
    likeCount: Number(statistics.likeCount ?? 0),
    commentCount: Number(statistics.commentCount ?? 0),
    thumbnails: Object.fromEntries(
      Object.entries(snippet.thumbnails ?? {}).map(([k, v]) => [k, v.url])
    ),
  };
}

// --- 字幕取得 ---
async function fetchTranscriptData(videoId) {
  const segments = await fetchTranscript(videoId, { lang: "ja" });
  const fullText = segments.map((s) => s.text).join(" ");
  return {
    available: true,
    language: segments[0]?.lang ?? "ja",
    fullText,
    segments: segments.map((s) => ({
      text: s.text,
      offset: s.offset,
      duration: s.duration,
    })),
  };
}

// --- ISO 8601 duration を読みやすい形式に ---
function formatDuration(iso) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return iso;
  const h = m[1] ? `${m[1]}:` : "";
  const min = (m[2] ?? "0").padStart(h ? 2 : 1, "0");
  const sec = (m[3] ?? "0").padStart(2, "0");
  return `${h}${min}:${sec}`;
}

// --- タイムスタンプ形式 ---
function formatTimestamp(ms) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// --- メイン ---
async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error("Usage: node .claude/scripts/youtube/analyze.mjs <url-or-videoId>");
    process.exit(1);
  }

  const videoId = extractVideoId(input);
  console.log(`\n🎬 YouTube 動画分析: ${videoId}\n`);

  const youtube = createYoutubeClient();

  // 並列取得
  const [metaResult, transcriptResult] = await Promise.allSettled([
    fetchMetadata(youtube, videoId),
    fetchTranscriptData(videoId),
  ]);

  // --- メタデータ ---
  let metadata = null;
  if (metaResult.status === "fulfilled") {
    metadata = metaResult.value;
    console.log("━━━ メタデータ ━━━");
    console.log(`タイトル:     ${metadata.title}`);
    console.log(`チャンネル:   ${metadata.channelTitle}`);
    console.log(`公開日:       ${metadata.publishedAt?.slice(0, 10)}`);
    console.log(`動画時間:     ${formatDuration(metadata.duration)}`);
    console.log(`再生数:       ${metadata.viewCount.toLocaleString()}`);
    console.log(`いいね:       ${metadata.likeCount.toLocaleString()}`);
    console.log(`コメント:     ${metadata.commentCount.toLocaleString()}`);
    if (metadata.tags.length > 0) {
      console.log(`タグ:         ${metadata.tags.join(", ")}`);
    }
    console.log(`説明:\n${metadata.description}\n`);
    console.log("━━━ サムネイル URL ━━━");
    for (const [key, url] of Object.entries(metadata.thumbnails)) {
      console.log(`  ${key}: ${url}`);
    }
  } else {
    console.error(`メタデータ取得失敗: ${metaResult.reason?.message}`);
  }

  // --- 字幕 ---
  let transcript = { available: false, language: null, fullText: "", segments: [] };
  if (transcriptResult.status === "fulfilled") {
    transcript = transcriptResult.value;
    console.log(`\n━━━ 字幕テキスト (${transcript.language}) ━━━`);
    for (const seg of transcript.segments) {
      console.log(`[${formatTimestamp(seg.offset)}] ${seg.text}`);
    }
    console.log(`\n━━━ 字幕全文 ━━━`);
    console.log(transcript.fullText);
  } else {
    console.log(`\n字幕取得失敗: ${transcriptResult.reason?.message}`);
    console.log("（字幕が無効化されている、または自動生成字幕がない可能性があります）");
  }

  // --- JSON 出力 ---
  const output = {
    videoId,
    url: `https://www.youtube.com/shorts/${videoId}`,
    analyzedAt: new Date().toISOString(),
    metadata,
    transcript,
  };

  const outPath = `/tmp/youtube-analysis-${videoId}.json`;
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
  console.log(`\n📄 JSON 出力: ${outPath}`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
