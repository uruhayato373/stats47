---
name: fetch-gsc-data
description: Google Search Console API から検索パフォーマンスデータを取得する。Use when user says "GSCデータ", "検索パフォーマンス", "検索クエリ分析", "GSC snapshot". クエリ・ページ・デバイス・国別レポート対応。snapshot モードで週次 CSV を .claude/skills/analytics/gsc-improvement/reference/snapshots/ に全件保存.
---

Google Search Console API からサイトの検索パフォーマンスデータを取得する。

2 つのモードがある:
- **ad hoc モード** (デフォルト) — 指定ディメンションを取得して結果を整形表示する
- **snapshot モード** — 全ディメンションを全件取得して週次 snapshot ディレクトリに CSV 保存する。`/weekly-review` から呼ばれる

## 用途

- 検索クエリ別のクリック数・表示回数・CTR・掲載順位を取得したいとき
- ページ別・デバイス別・国別のパフォーマンスを分析したいとき
- ブログ記事やランキングページの SEO 効果を定量評価したいとき
- トレンド分析（期間比較）を行いたいとき
- **週次 snapshot として全クエリ・全ページの履歴を git で残したいとき**（snapshot モード）

## 引数

```
$ARGUMENTS — [期間] [ディメンション] [フィルタ] [snapshot YYYY-Www]
             期間: last7d | last28d | last3m | last6m | YYYY-MM-DD:YYYY-MM-DD（デフォルト: last28d）
             ディメンション: query | page | device | country | date（カンマ区切りで複数可、デフォルト: query）
                             snapshot モードでは無視され全ディメンションを取得
             フィルタ: 任意のURL/クエリフィルタ（例: page=/blog, query=ランキング）
             snapshot YYYY-Www: ISO 週番号（例: snapshot 2026-W16）。指定時は snapshot モード
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

### Step 1.5: モード判定

引数に `snapshot YYYY-Www` が含まれていれば **snapshot モード** に分岐する（Step 2s 参照）。
それ以外は従来どおり ad hoc モード（Step 2）を実行する。

### Step 2: データ取得スクリプト実行（ad hoc モード）

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

## snapshot モード

週次レビュー時に全ディメンションを全件取得し、`.claude/skills/analytics/gsc-improvement/reference/snapshots/<YYYY-Www>/` 配下に CSV として保存する。git で施策 → 数値変化の履歴を追えるようにするのが目的。

**3 段階のコピーを自動で行う**:

1. **Downloads → `gcsエラー/`**: `~/Downloads/stats47.jp-Coverage-YYYY-MM-DD/` を自動検出し、`重大な問題.csv` と `平均読み込み時間のチャート.csv` の 2 ファイルだけを `gcsエラー/` にコピー（mtime 比較で冪等、複数日付あれば最新 1 件のみ採用）。`重大ではない問題.csv` と `メタデータ.csv` は情報量が低いため保存しない
2. **API 全件取得**: queries / pages / devices / countries / daily の 5 ディメンションを searchanalytics.query で全件取得
3. **`gcsエラー/` → `snapshots/<YYYY-Www>/`**: 手動エクスポート CSV を `index-coverage.csv` と `index-trend.csv` に正規化してコピー

### 呼び出し例

```
/fetch-gsc-data last28d query snapshot 2026-W16
```

引数の `snapshot YYYY-Www` が検出されたら、ディメンション指定は無視して全ディメンションを順次取得する。

### 実行スクリプト

プロジェクトルートで以下を `node -e` で実行する:

```javascript
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const KEY_CANDIDATES = ['stats47-f6b5dae19196.json', 'stats47-31b18ee67144.json'];
const KEY_FILE = KEY_CANDIDATES.map(f => path.resolve(f)).find(f => fs.existsSync(f));
if (!KEY_FILE) throw new Error('サービスアカウント鍵が見つかりません');
const SITE_URL = 'sc-domain:stats47.jp';

// 期間 (last28d): GSC は 2 日遅延
const today = new Date();
const endDate = new Date(today); endDate.setDate(today.getDate() - 2);
const startDate = new Date(endDate); startDate.setDate(endDate.getDate() - 27);
const fmt = (d) => d.toISOString().slice(0, 10);

// 保存先
const WEEK = '<YYYY-Www>'; // 引数から受け取る
const OUT_DIR = path.resolve(`.claude/skills/analytics/gsc-improvement/reference/snapshots/${WEEK}`);
fs.mkdirSync(OUT_DIR, { recursive: true });

// CSV ヘルパー: カンマ・改行・ダブルクォートを含む場合のみクォート
const esc = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCSV = (rows, headers) =>
  [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n') + '\n';

async function fetchAll(searchconsole, dimensions) {
  const rows = [];
  let startRow = 0;
  const rowLimit = 25000;
  while (true) {
    const res = await searchconsole.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: { startDate: fmt(startDate), endDate: fmt(endDate), dimensions, rowLimit, startRow },
    });
    const batch = res.data.rows || [];
    rows.push(...batch);
    if (batch.length < rowLimit) break;
    startRow += rowLimit;
  }
  return rows;
}

function normalize(rows, dimName) {
  return rows.map(r => ({
    [dimName]: r.keys[0],
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr.toFixed(4),
    position: r.position.toFixed(2),
  }));
}

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  const searchconsole = google.searchconsole({ version: 'v1', auth });

  const jobs = [
    { name: 'queries', dim: 'query', file: 'queries.csv' },
    { name: 'pages', dim: 'page', file: 'pages.csv' },
    { name: 'devices', dim: 'device', file: 'devices.csv' },
    { name: 'countries', dim: 'country', file: 'countries.csv' },
    { name: 'daily', dim: 'date', file: 'daily.csv' },
  ];

  const summary = [];
  for (const job of jobs) {
    const raw = await fetchAll(searchconsole, [job.dim]);
    const normalized = normalize(raw, job.dim);
    const csv = toCSV(normalized, [job.dim, 'clicks', 'impressions', 'ctr', 'position']);
    fs.writeFileSync(path.join(OUT_DIR, job.file), csv);
    summary.push(`${job.file}: ${normalized.length} rows`);
  }

  // Downloads から最新の GSC export を gcsエラー/ に自動コピー（冪等）
  const DL_DIR = path.join(require('os').homedir(), 'Downloads');
  const DL_PATTERN = /^stats47\.jp-Coverage-(\d{4}-\d{2}-\d{2})$/;
  const GCS_ERR_DIR = path.resolve('gcsエラー');
  const DL_TARGETS = ['重大な問題.csv', '平均読み込み時間のチャート.csv'];
  if (fs.existsSync(DL_DIR)) {
    const candidates = fs.readdirSync(DL_DIR)
      .map(n => n.normalize('NFC'))
      .filter(n => DL_PATTERN.test(n))
      .sort((a, b) => b.localeCompare(a));
    const latest = candidates[0];
    if (latest) {
      const srcDir = path.join(DL_DIR, latest);
      fs.mkdirSync(GCS_ERR_DIR, { recursive: true });
      for (const f of DL_TARGETS) {
        const src = path.join(srcDir, f);
        const dst = path.join(GCS_ERR_DIR, f);
        if (fs.existsSync(src)) {
          const srcMtime = fs.statSync(src).mtimeMs;
          const dstMtime = fs.existsSync(dst) ? fs.statSync(dst).mtimeMs : 0;
          if (srcMtime > dstMtime) {
            fs.copyFileSync(src, dst);
            summary.push(`[downloads] ${f} copied from ${latest}`);
          } else {
            summary.push(`[downloads] ${f} skipped (already up-to-date)`);
          }
        }
      }
    } else {
      summary.push('[downloads] stats47.jp-Coverage-* not found in ~/Downloads, skipping');
    }
  }

  // 手動エクスポート CSV (index coverage) のコピー
  const manualSources = [
    { src: 'gcsエラー/重大な問題.csv', dst: 'index-coverage.csv' },
    { src: 'gcsエラー/平均読み込み時間のチャート.csv', dst: 'index-trend.csv' },
  ];
  for (const m of manualSources) {
    const srcPath = path.resolve(m.src);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, path.join(OUT_DIR, m.dst));
      summary.push(`${m.dst}: copied from ${m.src}`);
    } else {
      summary.push(`${m.dst}: SKIPPED (${m.src} not found — 手動エクスポート未配置)`);
    }
  }

  console.log(`[gsc-snapshot] ${WEEK} saved to ${OUT_DIR}`);
  console.log(summary.join('\n'));
}

main().catch(e => { console.error(e); process.exit(1); });
```

実行前に `<YYYY-Www>` を引数で受け取った値に置換すること。

### 保存後の挙動

スクリプト完了後、以下を報告する:

- 保存先ディレクトリ: `.claude/skills/analytics/gsc-improvement/reference/snapshots/<YYYY-Www>/`
- 各ファイルの行数（queries.csv N rows / pages.csv N rows 等）
- 手動 CSV（index-coverage.csv / index-trend.csv）のコピー有無
- 主要指標サマリー（queries.csv 上位 5 件の clicks 合計 vs 全体 clicks 等）

### snapshot モード完了後の連携

`/weekly-review` から呼ばれた場合は、続けて `/gsc-improvement observe` が実行されて Observation Log に追記される。ユーザーが単体で `/fetch-gsc-data snapshot` を呼んだ場合は、観測ログ追記は手動で `/gsc-improvement observe` を実行する必要がある。

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
