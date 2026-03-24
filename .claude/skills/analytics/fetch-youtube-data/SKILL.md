YouTube Data API v3 からチャンネルの公開データ（動画一覧・再生数・いいね数等）を取得する。

## 用途

- チャンネル全体の登録者数・総再生回数・動画数を確認したいとき
- 動画別の再生数・いいね数・コメント数を取得したいとき
- 再生数の多い動画・少ない動画を分析したいとき
- 投稿頻度や再生数の推移を把握したいとき

## 引数

```
$ARGUMENTS — [レポート種類] [並び順] [件数]
             レポート種類: overview | videos | top | recent（デフォルト: overview）
             並び順: date | viewCount | rating（デフォルト: date）
             件数: 数値（デフォルト: 20）
```

## 前提

- サービスアカウント鍵: `stats47-*.json`（リポジトリルートに `stats47-f6b5dae19196.json` または `stats47-31b18ee67144.json` のいずれかが存在、gitignore 済み）
- サービスアカウント: `stats47-windows@stats47.iam.gserviceaccount.com`
- チャンネル ID: `UCdRiwDSX1aUd0dSd7Cs08Kg`
- npm パッケージ: `googleapis`（インストール済み）

## 手順

### Step 1: データ取得

`node -e` でインライン実行する。認証・チャンネル ID は以下の共通コード:

```javascript
const { google } = require('googleapis');
const fs = require('fs');
// 存在する鍵ファイルを自動検出
const KEY_CANDIDATES = ['stats47-f6b5dae19196.json', 'stats47-31b18ee67144.json'];
const keyFile = KEY_CANDIDATES.find(f => fs.existsSync(f));
if (!keyFile) throw new Error('サービスアカウント鍵が見つかりません: ' + KEY_CANDIDATES.join(' / '));
const auth = new google.auth.GoogleAuth({
  keyFile,
  scopes: ['https://www.googleapis.com/auth/youtube.readonly'],
});
const youtube = google.youtube({ version: 'v3', auth });
const CHANNEL_ID = 'UCdRiwDSX1aUd0dSd7Cs08Kg';
```

### Step 2: レポート種類別のリクエスト

#### overview — チャンネルサマリー

```javascript
const ch = await youtube.channels.list({
  id: CHANNEL_ID,
  part: 'snippet,statistics,contentDetails',
});
const stats = ch.data.items[0].statistics;
// stats.subscriberCount — 登録者数
// stats.viewCount — 総再生回数
// stats.videoCount — 動画数
```

#### videos — 動画一覧（全件取得）

Search API でページネーションしながら全動画を取得し、Videos API で統計を取得:

```javascript
// 1. Search API で動画ID一覧を取得（50件ずつページネーション）
let allItems = [];
let nextPageToken = undefined;
do {
  const search = await youtube.search.list({
    channelId: CHANNEL_ID,
    part: 'snippet',
    order: 'date',        // date | viewCount | rating
    maxResults: 50,
    type: 'video',
    pageToken: nextPageToken,
  });
  allItems = allItems.concat(search.data.items);
  nextPageToken = search.data.nextPageToken;
} while (nextPageToken);

// 2. Videos API で統計・詳細を取得（50件ずつバッチ）
for (let i = 0; i < allItems.length; i += 50) {
  const ids = allItems.slice(i, i + 50).map(v => v.id.videoId).join(',');
  const videos = await youtube.videos.list({
    id: ids,
    part: 'snippet,statistics,contentDetails',
  });
  // videos.data.items[].statistics.viewCount — 再生数
  // videos.data.items[].statistics.likeCount — いいね数
  // videos.data.items[].statistics.commentCount — コメント数
  // videos.data.items[].contentDetails.duration — 動画時間（ISO 8601）
}
```

#### top — 再生数上位

videos と同じだが、取得後に `viewCount` で降順ソートして上位 N 件を表示。

#### recent — 最新動画

```javascript
const search = await youtube.search.list({
  channelId: CHANNEL_ID,
  part: 'snippet',
  order: 'date',
  maxResults: 10,  // 件数指定
  type: 'video',
});
// + Videos API で統計取得
```

### Step 3: 結果の整形・レポート

**チャンネルサマリー:**

| 項目 | 値 |
|---|---|
| チャンネル名 | 統計で見る都道府県 \| stats47 |
| 登録者数 | 11 |
| 総再生回数 | 34,541 |
| 動画数 | 55 |

**動画一覧レポート:**

| # | タイトル | 再生 | いいね | コメント | 時間 | 公開日 |
|---|---|---|---|---|---|---|
| 1 | 完全失業率 都道府県ランキング | 990 | 0 | 1 | 1:53 | 2026-03-04 |
| 2 | 大学収容力指数 | 462 | 2 | 0 | 1:53 | 2026-03-04 |

**再生数 Top N:**

再生数で降順ソートし、上位 N 件を表示。

### Step 4: 分析コメント

- **再生数分布**: 1,000回超の動画とそれ以下の動画の分布
- **エンゲージメント**: いいね率（いいね / 再生数）の高い動画
- **投稿頻度**: 日別・週別の投稿ペース
- **動画時間**: Shorts（60秒以下）vs 通常動画の再生数比較
- **再生数0の動画**: インプレッションが出ていない可能性（タイトル・サムネ改善候補）

## よく使うパターン

```bash
# チャンネル概要
/fetch-youtube-data overview

# 全動画一覧（公開日順）
/fetch-youtube-data videos

# 再生数 Top 10
/fetch-youtube-data top 10

# 最新 5 本
/fetch-youtube-data recent 5
```

## 利用可能なデータ（主要）

### チャンネル統計（channels.list）

| フィールド | 説明 |
|---|---|
| `statistics.subscriberCount` | 登録者数 |
| `statistics.viewCount` | 総再生回数 |
| `statistics.videoCount` | 動画数 |

### 動画統計（videos.list）

| フィールド | 説明 |
|---|---|
| `statistics.viewCount` | 再生回数 |
| `statistics.likeCount` | いいね数 |
| `statistics.commentCount` | コメント数 |
| `statistics.favoriteCount` | お気に入り数 |
| `contentDetails.duration` | 動画時間（ISO 8601: PT1M30S = 1分30秒） |
| `snippet.title` | タイトル |
| `snippet.publishedAt` | 公開日時 |
| `snippet.tags` | タグ一覧 |

### Search API パラメータ

| パラメータ | 値 |
|---|---|
| `order` | `date`（公開日順）/ `viewCount`（再生数順）/ `rating`（評価順） |
| `maxResults` | 最大 50 |
| `publishedAfter` | ISO 8601 日時（例: `2026-01-01T00:00:00Z`） |
| `publishedBefore` | ISO 8601 日時 |

## API レート制限

- YouTube Data API v3: 1日あたり 10,000 ユニットのクォータ
- `search.list`: 100 ユニット/リクエスト
- `videos.list`: 1 ユニット/リクエスト
- `channels.list`: 1 ユニット/リクエスト
- 全55動画取得: search(2回 × 100) + videos(2回 × 1) = 約 202 ユニット

## 制限事項

- 登録者数は丸められた値（1,000未満の場合は正確な値）

## YouTube Analytics API（視聴維持率・トラフィックソース等）

YouTube Analytics API は OAuth 2.0 認証で利用可能。セットアップ済み（`stats47jp@gmail.com`）。

### 使い方

```bash
# チャンネル日別サマリー（過去28日）
node scripts/youtube-analytics.js overview 28

# 動画別パフォーマンス（過去28日）— 視聴回数・平均視聴秒・維持率
node scripts/youtube-analytics.js videos 28

# 再生数上位動画（過去90日）— 維持率・視聴時間付き
node scripts/youtube-analytics.js top 90

# 特定動画の視聴維持率（離脱曲線）
node scripts/youtube-analytics.js retention <videoId>

# トラフィックソース別の視聴回数
node scripts/youtube-analytics.js traffic 28

# 視聴者の年齢・性別分布
node scripts/youtube-analytics.js demographics 28
```

### 認証情報

- OAuth クライアント ID / シークレット: `.env.local` の `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET`
- リフレッシュトークン: `.env.local` の `GOOGLE_OAUTH_REFRESH_TOKEN`
- 再認証が必要な場合: `node scripts/youtube-oauth-setup.js`

### 分析レポート

- 離脱分析レポート: `docs/03_レビュー/youtube_retention_analysis_20260319.md`
- 動画候補選定: `docs/03_レビュー/youtube_video_candidates_20260320.md`

## 参照

- [YouTube Data API v3 ドキュメント](https://developers.google.com/youtube/v3)
- [YouTube Analytics API ドキュメント](https://developers.google.com/youtube/analytics)
- [Search: list](https://developers.google.com/youtube/v3/docs/search/list)
- [Videos: list](https://developers.google.com/youtube/v3/docs/videos/list)
- [Channels: list](https://developers.google.com/youtube/v3/docs/channels/list)
- サービスアカウント鍵: `stats47-f6b5dae19196.json` または `stats47-31b18ee67144.json`（リポジトリルート）
- チャンネル ID: `UCdRiwDSX1aUd0dSd7Cs08Kg`
