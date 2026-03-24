X (Twitter) API v2 からアカウントのツイートデータ（インプレッション・いいね・リツイート等）を取得する。

## 用途

- 自分のツイート一覧とエンゲージメントデータを確認したいとき
- インプレッション・いいね・リツイートの多い投稿を分析したいとき
- 投稿頻度やエンゲージメント推移を把握したいとき

## 引数

```
$ARGUMENTS — [期間] [レポート種類] [件数]
             期間: last7d | last28d | last3m | YYYY-MM-DD:YYYY-MM-DD（デフォルト: last28d）
             レポート種類: overview | tweets | top（デフォルト: overview）
             件数: 数値（デフォルト: 20）
```

## 前提

- `.env.local` に以下の環境変数を設定済み:
  - `X_BEARER_TOKEN` — X API v2 の Bearer Token（Basic プラン以上）
- npm パッケージ: 不要（Node.js 組み込みの `fetch` を使用）
- Basic プラン: 月間 10,000 件読み取り / 3,000 件書き込み

### Bearer Token の取得方法

1. [X Developer Portal](https://developer.x.com/en/portal/dashboard) にアクセス
2. プロジェクト → Keys and tokens → Bearer Token をコピー
3. `.env.local` の `X_BEARER_TOKEN` を更新

## 手順

### Step 1: 共通コード

`node -e` でインライン実行する。認証は以下の共通コード:

```javascript
require('dotenv').config({ path: '.env.local' });
const TOKEN = process.env.X_BEARER_TOKEN;
if (!TOKEN) { console.error('X_BEARER_TOKEN が未設定'); process.exit(1); }

async function xFetch(path, params = {}) {
  const qs = new URLSearchParams(params);
  const url = `https://api.x.com/2/${path}${qs.toString() ? '?' + qs : ''}`;
  const res = await fetch(url, {
    headers: { 'Authorization': 'Bearer ' + TOKEN },
  });
  if (res.status === 429) {
    const reset = res.headers.get('x-rate-limit-reset');
    console.error('Rate limit exceeded. Reset at:', new Date(reset * 1000).toLocaleString());
    process.exit(1);
  }
  const data = await res.json();
  if (data.errors) { console.error('API Error:', JSON.stringify(data.errors, null, 2)); process.exit(1); }
  if (data.title) { console.error('API Error:', data.title, data.detail); process.exit(1); }
  return data;
}
```

### Step 2: ユーザー ID の取得

Bearer Token ではユーザー ID が必要。ユーザー名から ID を取得:

```javascript
const userRes = await xFetch('users/by/username/stats47_jp', {
  'user.fields': 'public_metrics,description,created_at',
});
const user = userRes.data;
const userId = user.id;
// user.public_metrics — フォロワー数、フォロー数、ツイート数等
```

> **注意**: ユーザー名が `stats47_jp` でない場合は適切なユーザー名に変更すること。

### Step 3: レポート種類別のリクエスト

#### overview — アカウントサマリー

```javascript
// ユーザー基本情報（Step 2 で取得済み）
console.log('ユーザー名:', '@' + user.username);
console.log('表示名:', user.name);
console.log('フォロワー:', user.public_metrics.followers_count);
console.log('フォロー:', user.public_metrics.following_count);
console.log('ツイート数:', user.public_metrics.tweet_count);
console.log('いいね数:', user.public_metrics.like_count);
console.log('リスト数:', user.public_metrics.listed_count);

// 期間内のツイート取得（エンゲージメント集計用）
const tweets = await xFetch(`users/${userId}/tweets`, {
  'tweet.fields': 'created_at,public_metrics,organic_metrics,impression_count',
  'max_results': 100,
  'start_time': startTime,  // ISO 8601
  'end_time': endTime,
});
// 合計インプレッション・エンゲージメントを集計
```

#### tweets — ツイート一覧

```javascript
// ページネーション対応で全ツイートを取得
let allTweets = [];
let paginationToken = undefined;
do {
  const params = {
    'tweet.fields': 'created_at,public_metrics',
    'max_results': 100,
    'start_time': startTime,
    'end_time': endTime,
  };
  if (paginationToken) params.pagination_token = paginationToken;
  const res = await xFetch(`users/${userId}/tweets`, params);
  if (res.data) allTweets = allTweets.concat(res.data);
  paginationToken = res.meta?.next_token;
} while (paginationToken && allTweets.length < limit);

// 各ツイートの public_metrics:
// - retweet_count — リツイート数
// - reply_count — リプライ数
// - like_count — いいね数
// - quote_count — 引用ツイート数
// - bookmark_count — ブックマーク数
// - impression_count — インプレッション数
```

#### top — エンゲージメント上位

tweets と同じデータを取得後、`impression_count`（または `like_count + retweet_count + reply_count + quote_count`）で降順ソートして上位 N 件を表示。

### Step 4: 期間の計算

| 指定 | start_time | end_time |
|---|---|---|
| last7d | 7日前 00:00:00Z | 現在 |
| last28d | 28日前 00:00:00Z | 現在 |
| last3m | 90日前 00:00:00Z | 現在 |
| YYYY-MM-DD:YYYY-MM-DD | 開始日T00:00:00Z | 終了日T23:59:59Z |

X API v2 は ISO 8601 形式（`YYYY-MM-DDTHH:mm:ssZ`）で期間を指定する。

```javascript
function calcDateRange(period) {
  const now = new Date();
  let start;
  if (period === 'last7d') start = new Date(now - 7 * 86400000);
  else if (period === 'last28d') start = new Date(now - 28 * 86400000);
  else if (period === 'last3m') start = new Date(now - 90 * 86400000);
  else {
    const [s, e] = period.split(':');
    return {
      startTime: new Date(s).toISOString(),
      endTime: new Date(e + 'T23:59:59Z').toISOString(),
    };
  }
  start.setHours(0, 0, 0, 0);
  return { startTime: start.toISOString(), endTime: now.toISOString() };
}
```

### Step 5: 結果の整形・レポート

**アカウントサマリー:**

| 項目 | 値 |
|---|---|
| ユーザー名 | @stats47_jp |
| フォロワー | 50 |
| フォロー | 20 |
| ツイート数 | 120 |
| 期間内ツイート数 | 15 |
| 合計インプレッション | 8,500 |
| 合計いいね | 45 |
| 合計リツイート | 12 |

**ツイート一覧レポート:**

| # | 投稿日 | インプレ | いいね | RT | リプ | 引用 | 保存 | テキスト（先頭40字） |
|---|---|---|---|---|---|---|---|---|
| 1 | 2026-03-04 | 1,200 | 8 | 3 | 1 | 0 | 2 | 【完全失業率】都道府県ランキング 1位は... |
| 2 | 2026-03-03 | 890 | 5 | 1 | 0 | 1 | 1 | 大学収容力指数、全国で最も高いのは... |

### Step 6: 分析コメント

- **インプレッション vs エンゲージメント**: エンゲージメント率（いいね+RT+リプ / インプレッション）の高い投稿を特定
- **ブックマーク率**: ブックマーク / インプレッションが高い = 後で読み返したい有益なコンテンツ
- **引用ツイート**: 引用が多い = 議論を呼ぶコンテンツ（ポジティブ/ネガティブ両方ありうる）
- **投稿時間帯**: 投稿時間別のインプレッション傾向
- **リツイート率**: RT / インプレッションが高い = 拡散力のあるコンテンツ

## よく使うパターン

```bash
# アカウント概要（過去28日）
/fetch-x-data last28d overview

# 全ツイート一覧
/fetch-x-data last28d tweets

# エンゲージメント Top 10
/fetch-x-data last28d top 10

# 特定期間
/fetch-x-data 2026-02-01:2026-02-28 tweets
```

## 利用可能なメトリクス

### ユーザー public_metrics（users.by/username）

| メトリクス | 説明 |
|---|---|
| `followers_count` | フォロワー数 |
| `following_count` | フォロー数 |
| `tweet_count` | 総ツイート数 |
| `like_count` | 総いいね数 |
| `listed_count` | リストに追加された数 |

### ツイート public_metrics（users/:id/tweets）

| メトリクス | 説明 |
|---|---|
| `impression_count` | インプレッション数 |
| `retweet_count` | リツイート数 |
| `reply_count` | リプライ数 |
| `like_count` | いいね数 |
| `quote_count` | 引用ツイート数 |
| `bookmark_count` | ブックマーク数 |

## API レート制限（Basic プラン）

| エンドポイント | レート制限 | 単位 |
|---|---|---|
| `users/by/username/:username` | 300 リクエスト | 15分 |
| `users/:id/tweets` | 1,500 リクエスト | 15分 |
| 月間読み取り上限 | 10,000 ツイート | 月 |

- 月間 10,000 ツイート読み取り上限に注意
- クレジット残量は [X Developer Portal](https://developer.x.com/en/portal/dashboard) で確認

## 制限事項

- **Bearer Token（App-Only Auth）で取得可能なのは public_metrics のみ**。`organic_metrics`（オーガニックのインプレッション詳細）や `promoted_metrics` は OAuth 2.0 User Context が必要
- `impression_count` は public_metrics に含まれるが、自分のツイートに対してのみ返される
- Basic プランの月間クレジットが枯渇すると `CreditsDepleted` エラーが返る（月初にリセット）
- ツイートの取得可能範囲は過去 7 日間のみ（Basic プラン）。それ以上の過去データは取得不可
- 削除済みツイートは取得不可

## 参照

- [X API v2 ドキュメント](https://developer.x.com/en/docs/x-api)
- [Users lookup](https://developer.x.com/en/docs/x-api/users/lookup/api-reference)
- [User Tweet timeline](https://developer.x.com/en/docs/x-api/tweets/timelines/api-reference/get-users-id-tweets)
- [Tweet metrics](https://developer.x.com/en/docs/x-api/metrics)
- [X Developer Portal](https://developer.x.com/en/portal/dashboard)
- 環境変数: `.env.local`（`X_BEARER_TOKEN`）
