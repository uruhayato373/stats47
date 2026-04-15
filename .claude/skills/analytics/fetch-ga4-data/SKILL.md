---
name: fetch-ga4-data
description: Google Analytics 4 Data API からアクセスデータを取得する。Use when user says "GA4データ", "PV確認", "アクセス分析", "GA4 snapshot". PV・流入経路・デバイス別レポート対応。snapshot モードで週次 CSV を .claude/skills/analytics/ga4-improvement/reference/snapshots/ に全件保存.
---

Google Analytics 4 (GA4) Data API からサイトのアクセスデータを取得する。

2 つのモードがある:
- **ad hoc モード** (デフォルト) — 指定レポートを取得して結果を整形表示する
- **snapshot モード** — 全レポートを全件取得して週次 snapshot ディレクトリに CSV 保存する。`/weekly-review` から呼ばれる

## 用途

- ページ別 PV・ユーザー数・滞在時間を取得したいとき
- 流入経路（Direct / Organic / Referral / Social）の内訳を確認したいとき
- デバイス別・国別・地域別のアクセス傾向を分析したいとき
- ブログ記事やランキングページの閲覧状況を把握したいとき
- **週次 snapshot として全ページの履歴を git で残したいとき**（snapshot モード）

## 引数

```
$ARGUMENTS — [期間] [レポート種類] [フィルタ] [snapshot YYYY-Www]
             期間: last7d | last28d | last3m | last6m | YYYY-MM-DD:YYYY-MM-DD（デフォルト: last28d）
             レポート種類: pages | channels | devices | daily | overview（デフォルト: pages）
                           snapshot モードでは無視され全レポートを取得
             フィルタ: 任意のページパスフィルタ（例: page=/blog, page=/ranking）
             snapshot YYYY-Www: ISO 週番号（例: snapshot 2026-W16）。指定時は snapshot モード
```

## 前提

- サービスアカウント鍵: `stats47-*.json`（リポジトリルートに `stats47-f6b5dae19196.json` または `stats47-31b18ee67144.json` のいずれかが存在、gitignore 済み）
- サービスアカウント: `stats47-windows@stats47.iam.gserviceaccount.com`
- GA4 プロパティ ID: `463218070`
- npm パッケージ: `googleapis`（インストール済み）

## 手順

### Step 0: モード判定

引数に `snapshot YYYY-Www` が含まれていれば **snapshot モード** に分岐する（下部「snapshot モード」節を参照）。
それ以外は従来どおり ad hoc モード（Step 1〜）を実行する。

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

## snapshot モード

週次レビュー時に全レポートを全件取得し、`.claude/skills/analytics/ga4-improvement/reference/snapshots/<YYYY-Www>/` 配下に CSV として保存する。git で施策 → 数値変化の履歴を追えるようにするのが目的。

### 呼び出し例

```
/fetch-ga4-data last28d snapshot 2026-W16
```

引数の `snapshot YYYY-Www` が検出されたら、レポート種類指定は無視して 5 レポート (`overview` / `pages` / `channels` / `devices` / `daily`) を順次取得する。

### 実行スクリプト

プロジェクトルートで以下を `node -e` で実行する:

```javascript
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const KEY_CANDIDATES = ['stats47-f6b5dae19196.json', 'stats47-31b18ee67144.json'];
const keyFile = KEY_CANDIDATES.find(f => fs.existsSync(f));
if (!keyFile) throw new Error('サービスアカウント鍵が見つかりません');
const auth = new google.auth.GoogleAuth({
  keyFile,
  scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
});
const analyticsdata = google.analyticsdata({ version: 'v1beta', auth });
const PROPERTY = 'properties/463218070';

// 期間 (last28d): GA4 は 1 日遅延
const today = new Date();
const endDate = new Date(today); endDate.setDate(today.getDate() - 1);
const startDate = new Date(endDate); startDate.setDate(endDate.getDate() - 27);
const fmt = (d) => d.toISOString().slice(0, 10);
const dateRanges = [{ startDate: fmt(startDate), endDate: fmt(endDate) }];

// 保存先
const WEEK = '<YYYY-Www>'; // 引数から受け取る
const OUT_DIR = path.resolve(`.claude/skills/analytics/ga4-improvement/reference/snapshots/${WEEK}`);
fs.mkdirSync(OUT_DIR, { recursive: true });

// CSV ヘルパー
const esc = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCSV = (rows, headers) =>
  [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n') + '\n';

async function runReport(requestBody) {
  const res = await analyticsdata.properties.runReport({ property: PROPERTY, requestBody });
  return res.data.rows || [];
}

async function runReportPaged(requestBody) {
  const rows = [];
  const limit = 10000;
  let offset = 0;
  while (true) {
    const res = await analyticsdata.properties.runReport({
      property: PROPERTY,
      requestBody: { ...requestBody, limit, offset },
    });
    const batch = res.data.rows || [];
    rows.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }
  return rows;
}

function toRow(row, dimNames, metricNames) {
  const r = {};
  dimNames.forEach((n, i) => { r[n] = row.dimensionValues?.[i]?.value ?? ''; });
  metricNames.forEach((n, i) => { r[n] = row.metricValues?.[i]?.value ?? ''; });
  return r;
}

async function main() {
  const summary = [];

  // overview (no dimensions)
  {
    const metrics = ['activeUsers', 'sessions', 'screenPageViews', 'averageSessionDuration', 'bounceRate', 'newUsers'];
    const raw = await runReport({
      dateRanges,
      metrics: metrics.map(n => ({ name: n })),
    });
    const rows = raw.map(r => toRow(r, [], metrics));
    fs.writeFileSync(path.join(OUT_DIR, 'overview.csv'), toCSV(rows, metrics));
    summary.push(`overview.csv: ${rows.length} rows`);
  }

  // pages (paginated, 全件)
  {
    const dims = ['pagePath'];
    const metrics = ['screenPageViews', 'activeUsers', 'averageSessionDuration', 'engagementRate'];
    const raw = await runReportPaged({
      dateRanges,
      dimensions: dims.map(n => ({ name: n })),
      metrics: metrics.map(n => ({ name: n })),
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    });
    const rows = raw.map(r => toRow(r, dims, metrics));
    fs.writeFileSync(path.join(OUT_DIR, 'pages.csv'), toCSV(rows, [...dims, ...metrics]));
    summary.push(`pages.csv: ${rows.length} rows`);
  }

  // channels
  {
    const dims = ['sessionDefaultChannelGroup'];
    const metrics = ['sessions', 'activeUsers', 'screenPageViews', 'bounceRate', 'conversions'];
    const raw = await runReport({
      dateRanges,
      dimensions: dims.map(n => ({ name: n })),
      metrics: metrics.map(n => ({ name: n })),
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    });
    const rows = raw.map(r => toRow(r, dims, metrics));
    fs.writeFileSync(path.join(OUT_DIR, 'channels.csv'), toCSV(rows, [...dims, ...metrics]));
    summary.push(`channels.csv: ${rows.length} rows`);
  }

  // devices
  {
    const dims = ['deviceCategory'];
    const metrics = ['sessions', 'activeUsers', 'screenPageViews', 'averageSessionDuration'];
    const raw = await runReport({
      dateRanges,
      dimensions: dims.map(n => ({ name: n })),
      metrics: metrics.map(n => ({ name: n })),
    });
    const rows = raw.map(r => toRow(r, dims, metrics));
    fs.writeFileSync(path.join(OUT_DIR, 'devices.csv'), toCSV(rows, [...dims, ...metrics]));
    summary.push(`devices.csv: ${rows.length} rows`);
  }

  // daily
  {
    const dims = ['date'];
    const metrics = ['activeUsers', 'sessions', 'screenPageViews', 'newUsers'];
    const raw = await runReport({
      dateRanges,
      dimensions: dims.map(n => ({ name: n })),
      metrics: metrics.map(n => ({ name: n })),
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    });
    const rows = raw.map(r => toRow(r, dims, metrics));
    fs.writeFileSync(path.join(OUT_DIR, 'daily.csv'), toCSV(rows, [...dims, ...metrics]));
    summary.push(`daily.csv: ${rows.length} rows`);
  }

  console.log(`[ga4-snapshot] ${WEEK} saved to ${OUT_DIR}`);
  console.log(summary.join('\n'));
}

main().catch(e => { console.error(e); process.exit(1); });
```

実行前に `<YYYY-Www>` を引数で受け取った値に置換すること。

### 保存後の挙動

スクリプト完了後、以下を報告する:

- 保存先ディレクトリ: `.claude/skills/analytics/ga4-improvement/reference/snapshots/<YYYY-Www>/`
- 各ファイルの行数
- 主要指標サマリー（overview.csv の PV/users/sessions）

### snapshot モード完了後の連携

`/weekly-review` から呼ばれた場合は、続けて `/ga4-improvement observe` が実行されて Observation Log に追記される。

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
