# YouTube メトリクス取得手順

> このファイルは `update-sns-metrics` スキルの詳細手順です。概要は [SKILL.md](../SKILL.md) を参照。

**API ベース（browser-use 不要）。** YouTube Data API v3 で全動画（通常動画 + ショート）のメトリクスを取得する。`channels.list` → `playlistItems.list`（uploads プレイリスト）→ `videos.list(statistics)` で一括取得。サービスアカウント認証で安定動作。

**注意:** `search.list` はショート動画を返さないことがある。必ず `playlistItems.list` を使うこと。

### YT-1. API で全動画メトリクスを取得 + 投稿台帳マッチング

投稿台帳 `posts.json`（`sns-posts-store.cjs`）と R2 ranking-items snapshot から読み、キャッシュ列は `updateById` で更新する（完全DBレス。旧 D1 sns_posts / indicators は廃止）。

```bash
cat > /tmp/yt-metrics.js << JSEOF
const { google } = require('${PROJECT_ROOT}/node_modules/googleapis');
const store = require("${PROJECT_ROOT}/.claude/scripts/lib/sns-posts-store.cjs");
const fs = require("fs");
const path = require("path");

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

  // 3. 投稿台帳マッチング + 記録
  const posts = store.query((p) => p.platform === "youtube");
  // ランキング名→キーは R2 ranking-items snapshot（旧 D1 indicators の DBレス版）
  const R2 = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";
  const snap = await (await fetch(R2 + "/app/ranking-items/all.json")).json();
  const rankings = (snap.items || []).map((r) => ({ ranking_key: r.rankingKey, ranking_name: r.rankingName || r.title }));

  // 時系列履歴は .claude/ 配下のファイルに蓄積（.claude/rules/data-storage.md）
  const snsStore = require("${PROJECT_ROOT}/.claude/scripts/lib/sns-metrics-store.cjs");

  const fetchedAt = new Date().toISOString();
  // 最新値キャッシュは投稿台帳 posts.json のレコード列に updateById で書く
  let matched = 0, urlUp = 0, capUp = 0, unmatched = 0;
  {
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
      // 最新値キャッシュ列（impressions=views, replies=comments にマップ）を 1 回の updateById で更新
      const patch = { impressions: views, likes: likes, replies: comments, metrics_updated_at: fetchedAt };
      if (!post.post_url && ytUrl) { patch.post_url = ytUrl; urlUp++; }
      if (!post.caption && title.length > 5) { patch.caption = title; capUp++; }
      store.updateById(post.id, patch);

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
    }
  }

  console.log("Matched: " + matched + ", URLs updated: " + urlUp + ", Captions backfilled: " + capUp + ", Unmatched: " + unmatched);
  console.log("sns-metrics snapshot rows: " + snsStore.countAll());
}

main().catch(e => { console.error(e); process.exit(1); });
JSEOF

node /tmp/yt-metrics.js
rm -f /tmp/yt-metrics.js
```
