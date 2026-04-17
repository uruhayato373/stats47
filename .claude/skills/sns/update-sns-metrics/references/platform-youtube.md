# YouTube メトリクス取得手順

> このファイルは `update-sns-metrics` スキルの詳細手順です。概要は [SKILL.md](../SKILL.md) を参照。

**API ベース（browser-use 不要）。** YouTube Data API v3 で全動画（通常動画 + ショート）のメトリクスを取得する。`channels.list` → `playlistItems.list`（uploads プレイリスト）→ `videos.list(statistics)` で一括取得。サービスアカウント認証で安定動作。

**注意:** `search.list` はショート動画を返さないことがある。必ず `playlistItems.list` を使うこと。

### YT-1. API で全動画メトリクスを取得 + DB マッチング

```bash
cat > /tmp/yt-metrics.js << JSEOF
const { google } = require('${PROJECT_ROOT}/node_modules/googleapis');
const Database = require("${PROJECT_ROOT}/node_modules/better-sqlite3");
const fs = require("fs");
const path = require("path");

const DB_PATH = "${PROJECT_ROOT}/.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite";
const CHANNEL_ID = "UCdRiwDSX1aUd0dSd7Cs08Kg";
const KEY_CANDIDATES = ['stats47-f6b5dae19196.json', 'stats47-31b18ee67144.json'];
const keyFile = KEY_CANDIDATES.map(f => path.resolve('${PROJECT_ROOT}', f)).find(f => fs.existsSync(f));
if (!keyFile) throw new Error('サービスアカウント鍵が見つかりません: ' + KEY_CANDIDATES.join(' / '));

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/youtube.readonly'],
  });
  const youtube = google.youtube({ version: 'v3', auth });

  // 1. チャンネルの uploads プレイリスト ID を取得
  const ch = await youtube.channels.list({ id: CHANNEL_ID, part: 'contentDetails' });
  const uploadsId = ch.data.items[0].contentDetails.relatedPlaylists.uploads;
  console.log("Uploads playlist: " + uploadsId);

  // 2. playlistItems.list で全動画ID を取得（ショート含む）
  let allVideoIds = [];
  let nextPageToken = undefined;
  do {
    const pl = await youtube.playlistItems.list({
      playlistId: uploadsId,
      part: 'contentDetails',
      maxResults: 50,
      pageToken: nextPageToken,
    });
    allVideoIds = allVideoIds.concat(pl.data.items.map(i => i.contentDetails.videoId));
    nextPageToken = pl.data.nextPageToken;
  } while (nextPageToken);
  console.log("Total videos found: " + allVideoIds.length);

  // 3. Videos API で統計を取得（50件ずつバッチ）
  const allVideos = [];
  for (let i = 0; i < allVideoIds.length; i += 50) {
    const ids = allVideoIds.slice(i, i + 50).join(',');
    const videos = await youtube.videos.list({
      id: ids,
      part: 'snippet,statistics',
    });
    allVideos.push(...videos.data.items);
  }

  // 3. DB マッチング + 記録
  const db = new Database(DB_PATH);
  const posts = db.prepare("SELECT id, content_key, caption, domain, post_type, post_url FROM sns_posts WHERE platform = ?").all("youtube");
  const rankings = db.prepare("SELECT ranking_key, ranking_name FROM ranking_items").all();

  // 時系列履歴は .claude/ 配下のファイルに蓄積（CLAUDE.md §記録先の統一原則）
  const snsStore = require("${PROJECT_ROOT}/.claude/scripts/lib/sns-metrics-store.cjs");

  const fetchedAt = new Date().toISOString();
  // sns_posts のキャッシュカラムは運用データとして D1 に残す
  const updCache = db.prepare("UPDATE sns_posts SET impressions=?, likes=?, replies=?, metrics_updated_at=? WHERE id=?");
  const updUrl = db.prepare("UPDATE sns_posts SET post_url=? WHERE id=? AND (post_url IS NULL OR post_url = '')");
  const updCaption = db.prepare("UPDATE sns_posts SET caption=? WHERE id=? AND (caption IS NULL OR caption = '')");

  let matched = 0, urlUp = 0, capUp = 0, unmatched = 0;
  const tx = db.transaction(() => {
    for (const v of allVideos) {
      const videoId = v.id;
      const title = v.snippet.title;
      const views = parseInt(v.statistics.viewCount || '0');
      const likes = parseInt(v.statistics.likeCount || '0');
      const comments = parseInt(v.statistics.commentCount || '0');
      const ytUrl = "https://www.youtube.com/watch?v=" + videoId;

      let post = null;

      // Strategy 1: post_url の videoId で完全一致
      post = posts.find(p => p.post_url && p.post_url.includes(videoId));

      // Strategy 2: ranking_name in title
      if (!post) {
        for (const r of rankings) {
          if (title.includes(r.ranking_name)) {
            // youtube にはショートと通常動画がある。content_key + post_type で絞る
            post = posts.find(p => p.content_key === r.ranking_key);
            break;
          }
        }
      }

      // Strategy 3: caption prefix 先頭80文字
      if (!post && title.length > 5) {
        post = posts.find(p => p.caption && p.caption.startsWith(title.slice(0, 80)));
      }

      if (!post) { unmatched++; continue; }
      matched++;
      const r = updUrl.run(ytUrl, post.id);
      if (r.changes > 0) urlUp++;

      // YouTube タイトルから caption を自動 backfill（NULL の場合のみ）
      if (title.length > 5) {
        const cr = updCaption.run(title, post.id);
        if (cr.changes > 0) capUp++;
      }

      snsStore.upsertMetric({
        sns_post_id: post.id,
        platform: "youtube",
        domain: post.domain,
        content_key: post.content_key,
        fetched_at: fetchedAt,
        views: views,
        likes: likes,
        comments: comments,
      });
      updCache.run(views, likes, comments, fetchedAt, post.id);
    }
  });
  tx();

  console.log("Matched: " + matched + ", URLs updated: " + urlUp + ", Captions backfilled: " + capUp + ", Unmatched: " + unmatched);
  console.log("sns-metrics snapshot rows: " + snsStore.countAll());
  db.close();
}

main().catch(e => { console.error(e); process.exit(1); });
JSEOF

node /tmp/yt-metrics.js
rm -f /tmp/yt-metrics.js
```
