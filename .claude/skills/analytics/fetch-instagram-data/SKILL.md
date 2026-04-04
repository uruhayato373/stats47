---
name: fetch-instagram-data
description: Instagram Graph API からインサイトデータを取得する。Use when user says "Instagram分析", "IG データ", "インスタ確認". リーチ・エンゲージメント・投稿別分析対応.
---

Instagram Graph API からビジネスアカウントのインサイトデータ（リーチ・インプレッション・エンゲージメント等）を取得する。

## 用途

- アカウント全体のリーチ・インプレッション・フォロワー数を確認したいとき
- 投稿別のリーチ・いいね・コメント・保存・シェア数を取得したいとき
- エンゲージメントの高い投稿を分析したいとき
- フォロワー増減や投稿頻度の推移を把握したいとき

## 引数

```
$ARGUMENTS — [期間] [レポート種類] [件数]
             期間: last7d | last28d | last3m | YYYY-MM-DD:YYYY-MM-DD（デフォルト: last28d）
             レポート種類: overview | posts | top | reels（デフォルト: overview）
             件数: 数値（デフォルト: 20）
```

## 前提

- `.env.local` に以下の環境変数を設定済み:
  - `INSTAGRAM_ACCESS_TOKEN` — 長期ユーザーアクセストークン（60日有効）
  - `INSTAGRAM_BUSINESS_ACCOUNT_ID` — Instagram ビジネスアカウント ID
- npm パッケージ: 不要（Node.js 組み込みの `fetch` を使用）

### アクセストークンの取得・更新方法

1. [Meta Graph API Explorer](https://developers.facebook.com/tools/explorer/) にアクセス
2. 対象の Meta App を選択
3. 必要なパーミッション（`instagram_basic`, `instagram_manage_insights`, `pages_show_list`, `pages_read_engagement`）を追加
4. 「Generate Access Token」で短期トークンを取得
5. 短期トークンを長期トークンに交換:

```javascript
// node -e で実行（短期トークンを TEMP_TOKEN に置き換え）
const TEMP_TOKEN = '短期トークンをここに貼る';
const APP_ID = process.env.META_APP_ID || '（.env.local から取得）';
const APP_SECRET = process.env.META_APP_SECRET || '（.env.local から取得）';
const url = `https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${TEMP_TOKEN}`;
const res = await fetch(url);
const data = await res.json();
console.log('長期トークン:', data.access_token);
console.log('有効期限:', data.expires_in, '秒（約60日）');
// → .env.local の INSTAGRAM_ACCESS_TOKEN を更新する
```

6. Instagram ビジネスアカウント ID の確認:

```javascript
// node -e で実行
const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const res = await fetch(`https://graph.facebook.com/v22.0/me/accounts?access_token=${TOKEN}`);
const pages = await res.json();
for (const page of pages.data) {
  const igRes = await fetch(`https://graph.facebook.com/v22.0/${page.id}?fields=instagram_business_account&access_token=${TOKEN}`);
  const ig = await igRes.json();
  console.log(`Page: ${page.name}, IG Account ID: ${ig.instagram_business_account?.id}`);
}
// → .env.local の INSTAGRAM_BUSINESS_ACCOUNT_ID を更新する
```

### トークン失効時

トークンが失効すると API が `OAuthException` エラーを返す。上記の手順 1〜5 で再取得すること。

## 手順

### Step 1: 共通コード

`node -e` でインライン実行する。認証は以下の共通コード:

```javascript
require('dotenv').config({ path: '.env.local' });
const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const IG_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
if (!TOKEN || !IG_ID) { console.error('INSTAGRAM_ACCESS_TOKEN / INSTAGRAM_BUSINESS_ACCOUNT_ID が未設定'); process.exit(1); }

async function igFetch(path, params = {}) {
  const qs = new URLSearchParams({ access_token: TOKEN, ...params });
  const res = await fetch(`https://graph.facebook.com/v22.0/${path}?${qs}`);
  const data = await res.json();
  if (data.error) { console.error('API Error:', JSON.stringify(data.error, null, 2)); process.exit(1); }
  return data;
}
```

### Step 2: レポート種類別のリクエスト

#### overview — アカウントサマリー

アカウントの基本情報とインサイトを取得:

```javascript
// 1. アカウント基本情報
const profile = await igFetch(IG_ID, {
  fields: 'username,name,followers_count,follows_count,media_count,biography',
});

// 2. アカウントインサイト（期間指定）
// metric_type=total_value で期間合計を取得
const insights = await igFetch(`${IG_ID}/insights`, {
  metric: 'reach,impressions,accounts_engaged,profile_views',
  period: 'day',
  metric_type: 'total_value',
  since: startUnix,  // Unix タイムスタンプ
  until: endUnix,
});
// insights.data[].total_value.value — 各メトリクスの合計値
```

#### posts — 投稿一覧

```javascript
// 1. メディア一覧を取得（ページネーション対応）
let allMedia = [];
let url = `https://graph.facebook.com/v22.0/${IG_ID}/media?fields=id,caption,media_type,timestamp,permalink,like_count,comments_count&limit=50&access_token=${TOKEN}`;
while (url && allMedia.length < limit) {
  const res = await fetch(url);
  const data = await res.json();
  allMedia = allMedia.concat(data.data);
  url = data.paging?.next;
}

// 2. 各投稿のインサイトを取得
for (const media of allMedia) {
  const metrics = media.media_type === 'VIDEO'
    ? 'reach,impressions,saved,shares,plays,likes,comments,total_interactions'
    : 'reach,impressions,saved,shares,likes,comments,total_interactions';
  const insight = await igFetch(`${media.id}/insights`, { metric: metrics });
  // insight.data[].values[0].value — 各メトリクスの値
}
```

#### top — エンゲージメント上位

posts と同じデータを取得後、`total_interactions`（いいね+コメント+保存+シェア）で降順ソートして上位 N 件を表示。

#### reels — リール一覧

```javascript
const reels = allMedia.filter(m => m.media_type === 'VIDEO');
// リール専用メトリクス: reach,impressions,saved,shares,plays,likes,comments,total_interactions
```

### Step 3: 期間の計算

| 指定 | since (Unix) | until (Unix) |
|---|---|---|
| last7d | 8日前 00:00 | 今日 00:00 |
| last28d | 29日前 00:00 | 今日 00:00 |
| last3m | 91日前 00:00 | 今日 00:00 |
| YYYY-MM-DD:YYYY-MM-DD | 開始日 00:00 | 終了日+1日 00:00 |

Instagram Insights API は Unix タイムスタンプ（秒）で期間を指定する。

```javascript
function calcDateRange(period) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const until = Math.floor(now.getTime() / 1000);
  let since;
  if (period === 'last7d') since = until - 8 * 86400;
  else if (period === 'last28d') since = until - 29 * 86400;
  else if (period === 'last3m') since = until - 91 * 86400;
  else {
    const [s, e] = period.split(':');
    since = Math.floor(new Date(s).getTime() / 1000);
    return { since, until: Math.floor(new Date(e).getTime() / 1000) + 86400 };
  }
  return { since, until };
}
```

### Step 4: 結果の整形・レポート

**アカウントサマリー:**

| 項目 | 値 |
|---|---|
| ユーザー名 | @stats47_jp |
| フォロワー | 120 |
| フォロー | 30 |
| 投稿数 | 45 |
| リーチ（28日） | 5,200 |
| インプレッション（28日） | 12,800 |
| エンゲージアカウント（28日） | 340 |
| プロフィール閲覧（28日） | 180 |

**投稿一覧レポート:**

| # | 投稿日 | 種類 | リーチ | いいね | コメント | 保存 | シェア | キャプション（先頭30字） |
|---|---|---|---|---|---|---|---|---|
| 1 | 2026-03-04 | IMAGE | 320 | 15 | 2 | 8 | 3 | 【完全失業率】都道府県ランキング... |
| 2 | 2026-03-03 | VIDEO | 890 | 22 | 5 | 12 | 7 | 大学収容力指数ランキング... |

### Step 5: 分析コメント

- **リーチ vs インプレッション**: インプレッション / リーチ比が高い = リピート閲覧が多い
- **保存率**: 保存 / リーチ が高い = 有益なコンテンツとして評価されている（Instagram アルゴリズム上重要）
- **シェア率**: シェア / リーチ が高い = 拡散力のあるコンテンツ
- **Reels vs 静止画**: リーチ数の比較で Reels の効果を評価
- **投稿頻度**: 日別・週別の投稿ペースとリーチの相関

## よく使うパターン

```bash
# アカウント概要（過去28日）
/fetch-instagram-data last28d overview

# 全投稿一覧
/fetch-instagram-data last28d posts

# エンゲージメント Top 10
/fetch-instagram-data last28d top 10

# リールのみ
/fetch-instagram-data last28d reels

# 特定期間
/fetch-instagram-data 2026-02-01:2026-02-28 posts
```

## 利用可能なメトリクス

### アカウントインサイト（/insights）

| メトリクス | 説明 |
|---|---|
| `reach` | リーチしたユニークアカウント数 |
| `impressions` | 表示回数（リピート含む） |
| `accounts_engaged` | エンゲージしたユニークアカウント数 |
| `profile_views` | プロフィール閲覧数 |
| `website_clicks` | プロフィールリンクのクリック数 |
| `follower_count` | フォロワー数（日次推移） |

### 投稿インサイト（/media/insights）

| メトリクス | 説明 | 対象 |
|---|---|---|
| `reach` | リーチ数 | 全種類 |
| `impressions` | インプレッション数 | 全種類 |
| `likes` | いいね数 | 全種類 |
| `comments` | コメント数 | 全種類 |
| `saved` | 保存数 | 全種類 |
| `shares` | シェア数 | 全種類 |
| `total_interactions` | 合計エンゲージメント | 全種類 |
| `plays` | 再生数 | VIDEO (Reels) |

### アカウント基本情報（/fields）

| フィールド | 説明 |
|---|---|
| `username` | ユーザー名 |
| `name` | 表示名 |
| `followers_count` | フォロワー数 |
| `follows_count` | フォロー数 |
| `media_count` | 投稿数 |
| `biography` | プロフィール文 |

## API レート制限

- Instagram Graph API: **200 calls/hour** per User Token
- 投稿インサイト取得は 1 投稿 = 1 API コール
- 50 投稿のインサイト取得: メディア一覧(1) + インサイト(50) = 51 コール
- 大量取得時は 200 コール/時間の制限に注意

## 制限事項

- **アクセストークンは 60 日で失効** → 定期的に再取得が必要（上記「トークンの取得・更新方法」参照）
- アカウントインサイトの `since`〜`until` は最大 30 日間（それ以上は分割リクエスト）
- ストーリーズのインサイトは投稿後 24 時間のみ取得可能
- フォロワーのデモグラフィクス（年齢・性別・地域）はフォロワー 100 人以上で利用可能
- 企業プロキシ環境で `graph.facebook.com` がブロックされる可能性あり

## 参照

- [Instagram Graph API ドキュメント](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api)
- [Instagram Insights API](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/insights)
- [Media Insights](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-media/insights)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [長期トークン交換](https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived/)
- 環境変数: `.env.local`（`INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_BUSINESS_ACCOUNT_ID`）
