#!/usr/bin/env node
/**
 * YouTube Data API v3 で動画をアップロードするスクリプト
 *
 * 使い方:
 *   node .claude/scripts/youtube/upload.js <動画ファイル> [--title "タイトル"] [--description "説明"] [--tags "tag1,tag2"] [--thumbnail サムネイル.png] [--privacy unlisted|private|public]
 *
 * 例:
 *   node .claude/scripts/youtube/upload.js .local/r2/sns/ranking/theft-offenses-recognized-per-1000/youtube/scroll-ges.mp4 \
 *     --title "都道府県別「泥棒が多い県」ランキング" \
 *     --description "2023年の窃盗犯認知件数データ" \
 *     --tags "都道府県,ランキング,統計,犯罪" \
 *     --thumbnail .local/r2/sns/ranking/theft-offenses-recognized-per-1000/youtube/stills/thumbnail-1280x720.png \
 *     --privacy unlisted
 */

const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
// 投稿台帳 SSOT (完全DBレス)。旧 SQLite sns_posts への INSERT を移行 (.claude/rules/data-storage.md)。
const postsStore = require("../lib/sns-posts-store.cjs");

// ── .env.local 読み込み ──

const envPath = path.join(__dirname, "..", "..", "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) envVars[match[1]] = match[2];
}

const CLIENT_ID = envVars.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = envVars.GOOGLE_OAUTH_CLIENT_SECRET;
const REFRESH_TOKEN = envVars.GOOGLE_OAUTH_REFRESH_TOKEN;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error("Error: .env.local に GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN が必要です");
  console.error("  node .claude/scripts/youtube/oauth-setup.js で認証してください");
  process.exit(1);
}

// ── 引数パース ──

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0].startsWith("--")) {
    console.error("Usage: node .claude/scripts/youtube/upload.js <video-file> [options]");
    console.error("  --title        動画タイトル");
    console.error("  --description  動画説明文");
    console.error("  --tags         カンマ区切りタグ");
    console.error("  --thumbnail    サムネイル画像パス");
    console.error("  --privacy      unlisted | private | public (default: unlisted)");
    console.error("  --schedule     公開予約日時 (ISO 8601, e.g. 2026-03-29T11:00:00Z)");
    console.error("  --content-key  D1 記録用 content_key (rankingKey 等)。未指定なら video filename を使用");
    console.error("  --post-type    D1 記録用 post_type (short / normal / bar-chart-race)。未指定なら video duration から推定");
    console.error("  --domain       D1 記録用 domain (ranking / compare / correlation 等、default: ranking)");
    console.error("  --template     D1 記録用 Remotion composition ID (例: RankingYouTube-ScrollGes)");
    console.error("  --metric-keys  D1 記録用 metric_key の JSON 配列 (例: '[\"average-life-expectancy\"]')");
    process.exit(1);
  }

  const result = {
    videoFile: args[0],
    title: "無題",
    description: "",
    tags: [],
    thumbnail: null,
    privacy: "unlisted",
    schedule: null,
    contentKey: null,
    postType: null,
    domain: "ranking",
    template: null,
    metricKeys: null,
  };

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case "--title":
        result.title = args[++i];
        break;
      case "--description":
        result.description = args[++i];
        break;
      case "--tags":
        result.tags = args[++i].split(",").map((t) => t.trim());
        break;
      case "--thumbnail":
        result.thumbnail = args[++i];
        break;
      case "--privacy":
        result.privacy = args[++i];
        break;
      case "--schedule":
        result.schedule = args[++i];
        break;
      case "--content-key":
        result.contentKey = args[++i];
        break;
      case "--post-type":
        result.postType = args[++i];
        break;
      case "--domain":
        result.domain = args[++i];
        break;
      case "--template":
        result.template = args[++i];
        break;
      case "--metric-keys":
        result.metricKeys = args[++i];
        // バリデーション: JSON 配列として parse できるか確認
        try {
          const parsed = JSON.parse(result.metricKeys);
          if (!Array.isArray(parsed)) {
            console.error("Error: --metric-keys must be a JSON array, got: " + result.metricKeys);
            process.exit(1);
          }
        } catch (err) {
          console.error("Error: --metric-keys is not valid JSON: " + result.metricKeys);
          process.exit(1);
        }
        break;
    }
  }

  return result;
}

// ── 投稿台帳 (posts.json) 記録 ──
// 旧 D1 sns_posts への INSERT を sns-posts-store 経由に移植 (完全DBレス)。

function recordToLedger(opts, videoId, videoUrl) {
  try {
    const contentKey = opts.contentKey || path.basename(opts.videoFile).replace(/\.[^.]+$/, "");
    const postType = opts.postType || "short"; // 呼び出し側で正しく指定すべき
    const now = new Date().toISOString();
    const status = opts.schedule ? "scheduled" : "posted";

    postsStore.insert({
      platform: "youtube",
      post_type: postType,
      domain: opts.domain,
      content_key: contentKey,
      caption: opts.title,
      post_url: videoUrl,
      media_path: opts.videoFile,
      thumbnail_path: opts.thumbnail,
      template: opts.template,
      metric_keys: opts.metricKeys,
      status,
      scheduled_at: opts.schedule || null,
      posted_at: opts.schedule ? null : now,
    });
    console.log(
      `[upload.js] 投稿台帳 (posts.json) に記録: video_id=${videoId}, content_key=${contentKey}, post_type=${postType}, template=${opts.template ?? "(none)"}, metric_keys=${opts.metricKeys ?? "(none)"}`,
    );
  } catch (err) {
    // 台帳記録の失敗で upload 自体は止めない
    console.warn(`[upload.js] 台帳記録失敗 (upload は成功): ${err.message}`);
  }
}

// ── メイン ──

async function main() {
  // 投稿ガード 1: 停止期間中 / 週 3 本上限。シャドウバン対応中の誤投稿を防ぐ
  const { spawnSync } = require("child_process");
  const guard = spawnSync("node", [path.join(__dirname, "..", "lib", "check-youtube-post-budget.cjs"), ...process.argv.slice(2)], {
    stdio: "inherit",
  });
  if (guard.status !== 0) process.exit(guard.status ?? 1);

  const opts = parseArgs();

  // 投稿ガード 2: タイトル / サムネ / content_key / template+metrics 重複チェック
  // 2026-03 の duplicate-content 起因シャドウバン再発防止 (Playbook §重複コンテンツ防止ルール)
  const dupArgs = [path.join(__dirname, "..", "lib", "check-youtube-duplicate.cjs"), "--title", opts.title];
  if (opts.thumbnail) dupArgs.push("--thumbnail", opts.thumbnail);
  if (opts.contentKey) dupArgs.push("--content-key", opts.contentKey);
  if (opts.template) dupArgs.push("--template", opts.template);
  if (opts.metricKeys) dupArgs.push("--metric-keys", opts.metricKeys);
  const dupGuard = spawnSync("node", dupArgs, { stdio: "inherit" });
  if (dupGuard.status !== 0) process.exit(dupGuard.status ?? 1);

  // ファイル存在チェック
  if (!fs.existsSync(opts.videoFile)) {
    console.error(`Error: 動画ファイルが見つかりません: ${opts.videoFile}`);
    process.exit(1);
  }

  const fileSizeMB = (fs.statSync(opts.videoFile).size / 1024 / 1024).toFixed(1);
  console.log(`動画: ${opts.videoFile} (${fileSizeMB} MB)`);
  console.log(`タイトル: ${opts.title}`);
  console.log(`公開設定: ${opts.privacy}`);
  if (opts.schedule) console.log(`公開予約: ${opts.schedule}`);

  // OAuth2 認証
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  // 公開予約の場合は privacy を private にし、publishAt を設定
  const status = {
    privacyStatus: opts.schedule ? "private" : opts.privacy,
  };
  if (opts.schedule) {
    status.publishAt = opts.schedule;
  }

  // アップロード
  console.log("\nアップロード中...");
  const res = await youtube.videos.insert({
    part: "snippet,status",
    requestBody: {
      snippet: {
        title: opts.title,
        description: opts.description,
        tags: opts.tags.length > 0 ? opts.tags : undefined,
        categoryId: "22", // People & Blogs
        defaultLanguage: "ja",
        defaultAudioLanguage: "ja",
      },
      status,
    },
    media: {
      body: fs.createReadStream(opts.videoFile),
    },
  });

  const videoId = res.data.id;
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  console.log(`\nアップロード完了!`);
  console.log(`  Video ID: ${videoId}`);
  console.log(`  URL: ${videoUrl}`);

  // サムネイル設定
  if (opts.thumbnail) {
    if (!fs.existsSync(opts.thumbnail)) {
      console.warn(`Warning: サムネイルファイルが見つかりません: ${opts.thumbnail}`);
    } else {
      console.log(`\nサムネイル設定中...`);
      await youtube.thumbnails.set({
        videoId,
        media: {
          mimeType: "image/png",
          body: fs.createReadStream(opts.thumbnail),
        },
      });
      console.log(`  サムネイル設定完了`);
    }
  }

  // 投稿台帳 posts.json に記録 (duplicate-content 再発防止のため inventory を統一管理)
  recordToLedger(opts, videoId, videoUrl);

  console.log(`\n完了: ${videoUrl}`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  if (err.response?.data) {
    console.error("Details:", JSON.stringify(err.response.data, null, 2));
  }
  process.exit(1);
});
