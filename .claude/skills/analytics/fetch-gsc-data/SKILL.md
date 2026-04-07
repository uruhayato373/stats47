---
name: fetch-gsc-data
description: Google Search Console API から検索パフォーマンスデータを取得する。Use when user says "GSCデータ", "検索パフォーマンス", "検索クエリ分析". クエリ・ページ・デバイス・国別レポート対応.
---

Google Search Console API からサイトの検索パフォーマンスデータを取得する。

## 用途

- 検索クエリ別のクリック数・表示回数・CTR・掲載順位を取得したいとき
- ページ別・デバイス別・国別のパフォーマンスを分析したいとき
- ブログ記事やランキングページの SEO 効果を定量評価したいとき
- トレンド分析（期間比較）を行いたいとき

## 引数

```
$ARGUMENTS — [期間] [ディメンション] [フィルタ]
             期間: last7d | last28d | last3m | last6m | YYYY-MM-DD:YYYY-MM-DD（デフォルト: last28d）
             ディメンション: query | page | device | country | date（カンマ区切りで複数可、デフォルト: query）
             フィルタ: 任意のURL/クエリフィルタ（例: page=/blog, query=ランキング）
```

## 前提

- サービスアカウント鍵: `stats47-*.json`（リポジトリルートに `stats47-f6b5dae19196.json` または `stats47-31b18ee67144.json` のいずれかが存在、gitignore 済み）
- サービスアカウント: 鍵ファイル内の `client_email` を参照（Mac: `ststs47-mac@stats47.iam.gserviceaccount.com`、Windows: `stats47-windows@stats47.iam.gserviceaccount.com`）
- サイト: `sc-domain:stats47.jp`（Search Console にドメインプロパティとして登録済み・サービスアカウントにアクセス権付与済み）
- npm パッケージ: `googleapis`（未インストールの場合は `npm install -D googleapis` を実行）

## 手順

### Step 1: パッケージ確認

```bash
# googleapis がインストールされているか確認
node -e "require('googleapis')" 2>/dev/null && echo "OK" || echo "INSTALL NEEDED"
```

未インストールの場合:
```bash
npm install -D googleapis
```

### Step 2: データ取得スクリプト実行

以下の Node.js スクリプトをインラインで実行する（一時ファイル不要、`node -e` で直接実行）。

```javascript
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// 存在する鍵ファイルを自動検出
const KEY_CANDIDATES = ['stats47-f6b5dae19196.json', 'stats47-31b18ee67144.json'];
const KEY_FILE = KEY_CANDIDATES.map(f => path.resolve(__dirname, f)).find(f => fs.existsSync(f));
if (!KEY_FILE) throw new Error('サービスアカウント鍵が見つかりません: ' + KEY_CANDIDATES.join(' / '));
const SITE_URL = 'sc-domain:stats47.jp';

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  const searchconsole = google.searchconsole({ version: 'v1', auth });

  const res = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: '<startDate>',   // YYYY-MM-DD
      endDate: '<endDate>',       // YYYY-MM-DD
      dimensions: ['<dim1>'],     // query, page, device, country, date
      rowLimit: 100,
      // フィルタ（任意）:
      // dimensionFilterGroups: [{
      //   filters: [{ dimension: 'page', operator: 'contains', expression: '/blog' }]
      // }],
    },
  });

  console.log(JSON.stringify(res.data, null, 2));
}

main();
```

### Step 3: 期間の計算

| 指定 | startDate | endDate |
|---|---|---|
| last7d | 9日前 | 2日前 |
| last28d | 30日前 | 2日前 |
| last3m | 92日前 | 2日前 |
| last6m | 182日前 | 2日前 |
| YYYY-MM-DD:YYYY-MM-DD | 開始日 | 終了日 |

**注意**: GSC データは2〜3日遅延するため、endDate は常に2日前以前にすること。

### Step 4: 結果の整形・レポート

取得したデータを以下の形式で報告する:

**クエリ別レポート（dimensions: query）:**

| # | クエリ | クリック | 表示 | CTR | 順位 |
|---|---|---|---|---|---|
| 1 | 都道府県 ランキング | 150 | 3,200 | 4.7% | 8.2 |
| 2 | ... | ... | ... | ... | ... |

**ページ別レポート（dimensions: page）:**

| # | ページ | クリック | 表示 | CTR | 順位 |
|---|---|---|---|---|---|
| 1 | /ranking/... | 80 | 1,500 | 5.3% | 12.1 |

**日別推移（dimensions: date）:**
折れ線グラフ的にクリック・表示の推移を報告。

### Step 5: 分析コメント

データを報告した後、以下の観点で簡単な分析を添える:

- **上位クエリ**: どのキーワードが最もトラフィックを稼いでいるか
- **CTR 改善候補**: 表示回数が多いが CTR が低いクエリ（タイトル・description 改善の余地）
- **順位改善候補**: 11〜20位のクエリ（1ページ目に押し上げられる可能性）
- **ページ別**: どのセクション（/ranking, /blog, /compare）が強いか
- **期間比較**: 前期間との増減（指定された場合）

## よく使うパターン

```bash
# ブログ記事のパフォーマンス（過去28日）
/fetch-gsc-data last28d page page=/blog

# 検索クエリ上位100（過去3ヶ月）
/fetch-gsc-data last3m query

# ランキングページのパフォーマンス
/fetch-gsc-data last28d page page=/ranking

# 日別クリック推移（過去7日）
/fetch-gsc-data last7d date

# 特定クエリの順位推移
/fetch-gsc-data last3m date query=ランキング

# デバイス別内訳
/fetch-gsc-data last28d device
```

## API レート制限

- Search Console API: 1,200 リクエスト/分（通常使用では問題にならない）
- rowLimit 最大: 25,000（デフォルト 1,000）
- startDate/endDate: 最大16ヶ月前まで

## 参照

- [Search Console API ドキュメント](https://developers.google.com/webmaster-tools/v1/searchanalytics/query)
- [Search Analytics クエリガイド](https://developers.google.com/webmaster-tools/v1/how-tos/search_analytics)
- サービスアカウント鍵: `stats47-f6b5dae19196.json` または `stats47-31b18ee67144.json`（リポジトリルート）
