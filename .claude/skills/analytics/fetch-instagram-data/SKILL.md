---
name: fetch-instagram-data
description: Instagram Graph API v21 から自アカウント (stats47jp) のプロフィール・投稿・インサイトを取得する。Use when user says "Instagramデータ", "Instagram分析", "IG確認". リーチ・エンゲージメント・投稿別パフォーマンス対応。
---

Instagram Graph API v21（Instagram Login 新フロー）から `stats47jp` の media・insights・プロフィールを取得する。browser-use スクレイピングではなく**純 API 実装**。

## 用途

- 投稿一覧と投稿別のエンゲージメント（like/comment/reach/views）を確認したいとき
- アカウント単位のインサイト（リーチ・プロフィールアクセス・エンゲージメントアカウント数）を時系列で見たいとき
- エンゲージメント上位の投稿を特定して傾向分析したいとき

## 引数

```
$ARGUMENTS — [期間] [レポート種類] [件数]
             期間: last7d | last28d | last3m | YYYY-MM-DD:YYYY-MM-DD（デフォルト: last28d）
             レポート種類: overview | media | top | insights（デフォルト: overview）
             件数: 数値（デフォルト: 20）
```

## 前提

- `.env.local` に以下の環境変数を設定済み:
  - `INSTAGRAM_ACCESS_TOKEN` — 長期トークン（60 日有効）
  - `INSTAGRAM_BUSINESS_ACCOUNT_ID` — IG User ID（数値）
- npm パッケージ: 不要（Node.js 組み込みの `fetch` を使用）
- アカウント種別: Business または Creator（Personal 不可）
- ベース URL: `https://graph.instagram.com/v21.0/`

### トークン取得・更新

1. [Meta for Developers](https://developers.facebook.com/apps/) で対象アプリを開く
2. ユースケース「Instagram でメッセージとコンテンツを管理」→ 設定 → アクセストークンを生成
3. 権限: `instagram_business_basic`, `instagram_business_content_publish`, `instagram_business_manage_insights`
4. 発行された 60 日有効トークンを `.env.local` の `INSTAGRAM_ACCESS_TOKEN` に貼る

### トークン延長（期限 1 週間前に実行）

```bash
curl -s "https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${INSTAGRAM_ACCESS_TOKEN}"
```

`access_token` と `expires_in`（秒）が返る。`.env.local` を更新。

## 手順

### Step 1: 共通コード

`node -e` でインライン実行する。認証ヘッダは不要（アクセストークンを query に付与）:

```javascript
require('dotenv').config({ path: '.env.local' });
const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const IG_USER_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
if (!TOKEN || !IG_USER_ID) {
  console.error('INSTAGRAM_ACCESS_TOKEN または INSTAGRAM_BUSINESS_ACCOUNT_ID が未設定');
  process.exit(1);
}

async function igFetch(path, params = {}) {
  const qs = new URLSearchParams({ ...params, access_token: TOKEN });
  const url = `https://graph.instagram.com/v21.0/${path}?${qs}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) {
    console.error('API Error:', data.error.code, data.error.message);
    process.exit(1);
  }
  return data;
}
```

### Step 2: アカウント基本情報取得

```javascript
const me = await igFetch('me', {
  fields: 'id,username,account_type,media_count,followers_count,follows_count,name,biography,website',
});
// me.username === 'stats47jp'
// me.followers_count — フォロワー数（新フローでは取れない場合あり、その場合は insights 経由）
```

### Step 3: レポート種類別のリクエスト

#### overview — アカウントサマリー

```javascript
// Step 2 の me を表示
console.log('ユーザー名:', '@' + me.username);
console.log('アカウント種別:', me.account_type);  // BUSINESS | CREATOR
console.log('投稿数:', me.media_count);
console.log('フォロワー:', me.followers_count ?? '取得不可（insights で取得）');

// 期間内の media 集計
const media = await igFetch(`${IG_USER_ID}/media`, {
  fields: 'id,caption,media_type,timestamp,like_count,comments_count',
  since: startUnix,  // Unix timestamp
  until: endUnix,
  limit: 100,
});
// 合計 like / comment / media 数を集計
```

#### media — 投稿一覧

```javascript
// ページネーション対応で期間内の全投稿を取得
let allMedia = [];
let next = null;
do {
  const params = {
    fields: 'id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count',
    since: startUnix,
    until: endUnix,
    limit: 100,
  };
  const res = await igFetch(next ?? `${IG_USER_ID}/media`, next ? {} : params);
  allMedia = allMedia.concat(res.data || []);
  next = res.paging?.cursors?.after
    ? `${IG_USER_ID}/media` // Graph API は after cursor で after= パラメータを付与
    : null;
  if (next) params.after = res.paging.cursors.after;
} while (next && allMedia.length < limit);

// 各 media の fields:
// - id — media ID
// - media_type — IMAGE | VIDEO | CAROUSEL_ALBUM
// - media_product_type — FEED | REELS | STORY | AD
// - like_count, comments_count — エンゲージメント
// - caption, permalink, timestamp
```

#### top — エンゲージメント上位

media を取得後、`(like_count + comments_count)` で降順ソートして上位 N 件。

#### insights — アカウントインサイト

```javascript
// アカウント単位の時系列メトリクス
const insights = await igFetch(`${IG_USER_ID}/insights`, {
  metric: 'reach,profile_views,accounts_engaged,total_interactions,website_clicks,follows_and_unfollows',
  period: 'day',
  since: startUnix,
  until: endUnix,
});
// insights.data[i].values[j].value / end_time

// 投稿単位のインサイト（media_id ごと）
for (const m of media) {
  const mi = await igFetch(`${m.id}/insights`, {
    metric: 'reach,likes,comments,saves,shares,views,total_interactions',
  });
  // mi.data[i].values[0].value
}
```

### Step 4: 期間の計算

Instagram Graph API は `since` / `until` に **Unix timestamp（秒）** を取る。

| 指定 | since | until |
|---|---|---|
| last7d | 7日前 00:00:00 | 現在 |
| last28d | 28日前 00:00:00 | 現在 |
| last3m | 90日前 00:00:00 | 現在 |
| YYYY-MM-DD:YYYY-MM-DD | 開始日 00:00:00 | 終了日 23:59:59 |

```javascript
function calcRange(period) {
  const now = Math.floor(Date.now() / 1000);
  let start;
  if (period === 'last7d') start = now - 7 * 86400;
  else if (period === 'last28d') start = now - 28 * 86400;
  else if (period === 'last3m') start = now - 90 * 86400;
  else {
    const [s, e] = period.split(':');
    return {
      startUnix: Math.floor(new Date(s).getTime() / 1000),
      endUnix: Math.floor(new Date(e + 'T23:59:59Z').getTime() / 1000),
    };
  }
  return { startUnix: start, endUnix: now };
}
```

### Step 5: 結果の整形・レポート

**アカウントサマリー:**

| 項目 | 値 |
|---|---|
| ユーザー名 | @stats47jp |
| 種別 | BUSINESS |
| 投稿数 | 71 |
| 期間内投稿数 | 8 |
| 合計いいね | 142 |
| 合計コメント | 5 |
| 合計リーチ | 1,240 |

**投稿一覧レポート:**

| # | 投稿日 | 種別 | いいね | コメント | リーチ | 閲覧 | テキスト（先頭40字） |
|---|---|---|---|---|---|---|---|
| 1 | 2026-03-16 | REELS | 28 | 2 | 340 | 520 | 大阪はチャリ、愛知はクルマ。暮らしの中身... |
| 2 | 2026-03-14 | REELS | 18 | 1 | 210 | 380 | 公務員の退職金、県で 1,000 万円差。同じ... |

### Step 6: 分析コメント

- **リーチ vs 閲覧**: 閲覧（views）がリーチを大きく上回る = 1 人が複数回見ている（バズ or リピート視聴）
- **保存率**: saves / reach が高い = 後で見返したい有益コンテンツ
- **シェア率**: shares / reach が高い = 拡散力のあるコンテンツ
- **コメント率**: comments / likes が高い = 議論を呼ぶコンテンツ
- **プロフィールアクセス → フォロー転換**: profile_views / reach、follows / profile_views を見る

## よく使うパターン

```bash
# アカウント概要（過去 28 日）
/fetch-instagram-data last28d overview

# 投稿一覧
/fetch-instagram-data last28d media

# エンゲージメント Top 10
/fetch-instagram-data last28d top 10

# アカウントインサイト（時系列）
/fetch-instagram-data last7d insights

# 特定期間
/fetch-instagram-data 2026-02-01:2026-02-28 media
```

## 利用可能なメトリクス

### アカウントインサイト（`/{ig-user-id}/insights`）

| メトリクス | 説明 |
|---|---|
| `reach` | リーチ（ユニークユーザー数） |
| `profile_views` | プロフィール閲覧数 |
| `accounts_engaged` | エンゲージメントしたアカウント数 |
| `total_interactions` | 総インタラクション |
| `likes`, `comments`, `shares`, `saves`, `replies` | 各種操作の合計 |
| `website_clicks` | プロフィール上のウェブサイトリンクのクリック |
| `follows_and_unfollows` | フォロー・アンフォロー数 |
| `follower_demographics` | フォロワー属性（年齢・性別・地域） |

### 投稿インサイト（`/{media-id}/insights`）

| メトリクス | 対象 | 説明 |
|---|---|---|
| `reach` | 全形式 | リーチ |
| `views` | VIDEO/REELS | 閲覧数 |
| `likes`, `comments`, `shares`, `saves` | 全形式 | 各種エンゲージメント |
| `total_interactions` | 全形式 | 合計 |
| `plays` | VIDEO | 再生数 |

### 基本フィールド（`/me`, `/{ig-user-id}/media`）

| フィールド | 説明 |
|---|---|
| `username`, `name`, `biography` | プロフィール |
| `account_type` | BUSINESS / CREATOR / MEDIA_CREATOR |
| `media_count`, `followers_count`, `follows_count` | カウント |
| `media_type` | IMAGE / VIDEO / CAROUSEL_ALBUM |
| `media_product_type` | FEED / REELS / STORY / AD |
| `permalink` | 投稿 URL |

## API レート制限

- **200 リクエスト / 1 時間 / ユーザー**（新フロー）
- 越えると `error.code=4 (API User Too Many Calls)` が返る
- 大量取得時は sleep を挟むか、バッチ分割

## 制限事項

- **Personal アカウント不可**。BUSINESS / CREATOR のみ
- **過去 90 日以上前のインサイトは取得不可**
- **他アカウントの閲覧不可**（`business_discovery` は旧フロー専用）
- トークン 60 日失効。`refresh_access_token` で延長するか再発行
- `followers_count` が `/me` で取れない場合あり（API バージョン変更の影響）。その場合は `/me/insights?metric=follower_count&period=day` で代替

## snapshots 記録

取得結果は `.claude/skills/analytics/fetch-instagram-data/reference/snapshots/YYYY-MM-DD/` に JSON/CSV で保存すると後日の比較ができる。`update-sns-metrics` スキルと記録先を揃える場合は `.claude/skills/analytics/sns-metrics-improvement/snapshots/YYYY-MM-DD/metrics.csv` に追記する。

## 参照

- [Instagram Platform API](https://developers.facebook.com/docs/instagram-platform)
- [Instagram API with Instagram Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login)
- [Metrics and Insights](https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights)
- 環境変数: `.env.local`（`INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_BUSINESS_ACCOUNT_ID`）
