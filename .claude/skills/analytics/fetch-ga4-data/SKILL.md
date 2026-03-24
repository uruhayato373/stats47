Google Analytics 4 (GA4) Data API からサイトのアクセスデータを取得する。

## 用途

- ページ別 PV・ユーザー数・滞在時間を取得したいとき
- 流入経路（Direct / Organic / Referral / Social）の内訳を確認したいとき
- デバイス別・国別・地域別のアクセス傾向を分析したいとき
- ブログ記事やランキングページの閲覧状況を把握したいとき

## 引数

```
$ARGUMENTS — [期間] [レポート種類] [フィルタ]
             期間: last7d | last28d | last3m | last6m | YYYY-MM-DD:YYYY-MM-DD（デフォルト: last28d）
             レポート種類: pages | channels | devices | daily | overview（デフォルト: pages）
             フィルタ: 任意のページパスフィルタ（例: page=/blog, page=/ranking）
```

## 前提

- サービスアカウント鍵: `stats47-*.json`（リポジトリルートに `stats47-f6b5dae19196.json` または `stats47-31b18ee67144.json` のいずれかが存在、gitignore 済み）
- サービスアカウント: `stats47-windows@stats47.iam.gserviceaccount.com`
- GA4 プロパティ ID: `463218070`
- npm パッケージ: `googleapis`（インストール済み）

## 手順

### Step 1: データ取得

`node -e` でインライン実行する。認証・プロパティ ID は以下の共通コード:

```javascript
const { google } = require('googleapis');
const fs = require('fs');
// 存在する鍵ファイルを自動検出
const KEY_CANDIDATES = ['stats47-f6b5dae19196.json', 'stats47-31b18ee67144.json'];
const keyFile = KEY_CANDIDATES.find(f => fs.existsSync(f));
if (!keyFile) throw new Error('サービスアカウント鍵が見つかりません: ' + KEY_CANDIDATES.join(' / '));
const auth = new google.auth.GoogleAuth({
  keyFile,
  scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
});
const analyticsdata = google.analyticsdata({ version: 'v1beta', auth });
const PROPERTY = 'properties/463218070';
```

### Step 2: レポート種類別のリクエスト

#### pages — ページ別 PV・ユーザー・滞在時間

```javascript
requestBody: {
  dateRanges: [{ startDate, endDate }],
  dimensions: [{ name: 'pagePath' }],
  metrics: [
    { name: 'screenPageViews' },
    { name: 'activeUsers' },
    { name: 'averageSessionDuration' },
  ],
  orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
  limit: 30,
  // フィルタ（任意）:
  // dimensionFilter: {
  //   filter: { fieldName: 'pagePath', stringFilter: { matchType: 'CONTAINS', value: '/blog' } }
  // },
}
```

#### channels — 流入経路別

```javascript
requestBody: {
  dateRanges: [{ startDate, endDate }],
  dimensions: [{ name: 'sessionDefaultChannelGroup' }],
  metrics: [
    { name: 'sessions' },
    { name: 'activeUsers' },
    { name: 'screenPageViews' },
    { name: 'bounceRate' },
  ],
  orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
}
```

#### devices — デバイス別

```javascript
requestBody: {
  dateRanges: [{ startDate, endDate }],
  dimensions: [{ name: 'deviceCategory' }],
  metrics: [
    { name: 'sessions' },
    { name: 'activeUsers' },
    { name: 'screenPageViews' },
    { name: 'averageSessionDuration' },
  ],
}
```

#### daily — 日別推移

```javascript
requestBody: {
  dateRanges: [{ startDate, endDate }],
  dimensions: [{ name: 'date' }],
  metrics: [
    { name: 'activeUsers' },
    { name: 'screenPageViews' },
    { name: 'sessions' },
  ],
  orderBys: [{ dimension: { dimensionName: 'date' } }],
}
```

#### overview — サマリー（ディメンションなし）

```javascript
requestBody: {
  dateRanges: [{ startDate, endDate }],
  metrics: [
    { name: 'activeUsers' },
    { name: 'sessions' },
    { name: 'screenPageViews' },
    { name: 'averageSessionDuration' },
    { name: 'bounceRate' },
    { name: 'newUsers' },
  ],
}
```

### Step 3: 期間の計算

| 指定 | startDate | endDate |
|---|---|---|
| last7d | 8日前 | 1日前 |
| last28d | 29日前 | 1日前 |
| last3m | 91日前 | 1日前 |
| last6m | 181日前 | 1日前 |
| YYYY-MM-DD:YYYY-MM-DD | 開始日 | 終了日 |

GA4 データは GSC より遅延が少なく、前日分まで取得可能。

### Step 4: 結果の整形・レポート

**ページ別レポート:**

| # | ページ | PV | ユーザー | 平均滞在(秒) |
|---|---|---|---|---|
| 1 | / | 180 | 20 | 480.8 |
| 2 | /ranking | 114 | 30 | 305.3 |

**流入経路レポート:**

| チャネル | セッション | ユーザー | PV | 直帰率 |
|---|---|---|---|---|
| Organic Search | 500 | 300 | 1,200 | 45.2% |
| Direct | 200 | 100 | 800 | 38.5% |

### Step 5: 分析コメント

- **人気ページ**: PV 上位のページとセクション（/ranking, /blog, /dashboard, /compare）
- **滞在時間**: 長い = エンゲージメント高、短い = 離脱早い
- **流入経路**: Organic の割合が増えているか（SEO 効果の指標）
- **デバイス**: モバイル vs デスクトップの比率

## よく使うパターン

```bash
# サイト全体サマリー（過去28日）
/fetch-ga4-data last28d overview

# ページ別PVランキング
/fetch-ga4-data last28d pages

# ブログ記事のみ
/fetch-ga4-data last28d pages page=/blog

# 流入経路の内訳
/fetch-ga4-data last28d channels

# 日別推移
/fetch-ga4-data last28d daily

# デバイス別
/fetch-ga4-data last28d devices
```

## 利用可能なメトリクス（主要）

| メトリクス名 | 説明 |
|---|---|
| `activeUsers` | アクティブユーザー数 |
| `newUsers` | 新規ユーザー数 |
| `sessions` | セッション数 |
| `screenPageViews` | ページビュー数 |
| `averageSessionDuration` | 平均セッション時間（秒） |
| `bounceRate` | 直帰率 |
| `engagedSessions` | エンゲージメントセッション数 |
| `engagementRate` | エンゲージメント率 |
| `eventsPerSession` | セッションあたりイベント数 |
| `conversions` | コンバージョン数 |

## 利用可能なディメンション（主要）

| ディメンション名 | 説明 |
|---|---|
| `pagePath` | ページパス |
| `pageTitle` | ページタイトル |
| `date` | 日付（YYYYMMDD 形式） |
| `sessionDefaultChannelGroup` | 流入チャネル |
| `deviceCategory` | デバイス種別（desktop/mobile/tablet） |
| `country` | 国 |
| `city` | 都市 |
| `firstUserSource` | 初回流入元 |

## 参照

- [GA4 Data API ドキュメント](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [ディメンション・メトリクス一覧](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema)
- サービスアカウント鍵: `stats47-f6b5dae19196.json` または `stats47-31b18ee67144.json`（リポジトリルート）
- GA4 プロパティ ID: `463218070`
