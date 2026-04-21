---
name: fetch-adsense-data
description: Google AdSense Management API から広告収益・RPM・CTR・ビューアビリティを取得する。Use when user says "AdSenseデータ", "広告収益", "RPM", "AdSense snapshot". snapshot モードで週次 CSV を .claude/skills/analytics/adsense-improvement/reference/snapshots/ に保存.
---

Google AdSense Management API からサイトの広告パフォーマンスデータを取得する。

2 つのモードがある:
- **ad hoc モード** (デフォルト) — 指定期間/ディメンションで取得して結果を整形表示する
- **snapshot モード** — 全ディメンションを全件取得して週次 snapshot ディレクトリに CSV 保存する。`/weekly-review` から呼ばれる

## 用途

- 広告ユニット別 / ページ別 / デバイス別の収益を分析したいとき
- RPM・CTR・ビューアビリティの推移を追いたいとき
- 特定の改善施策（配置・フォーマット変更等）の効果を測定したいとき
- **週次 snapshot として履歴を git で残したいとき**（snapshot モード）

## 引数

```
$ARGUMENTS — [期間] [ディメンション] [snapshot YYYY-Www]
             期間: last7d | last28d | last3m | YYYY-MM-DD:YYYY-MM-DD（デフォルト: last28d）
             ディメンション: page | ad_unit | device | country | date（カンマ区切りで複数可、デフォルト: page）
                             snapshot モードでは無視され全ディメンションを取得
             snapshot YYYY-Www: ISO 週番号（例: snapshot 2026-W17）。指定時は snapshot モード
```

## 前提

AdSense Management API は **OAuth 2.0** が必須（サービスアカウントでは広告主データにアクセス不可）。以下の環境変数を `.env.local` に設定:

```bash
GOOGLE_ADSENSE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_ADSENSE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_ADSENSE_REFRESH_TOKEN=1//xxxxx
GOOGLE_ADSENSE_ACCOUNT_ID=pub-7995274743017484
```

初回のみリフレッシュトークン取得手順が必要（後述）。

- npm パッケージ: `googleapis`（既にインストール済み）
- AdSense 管理画面: `ca-pub-7995274743017484` の審査通過・広告配信中

## 初回セットアップ: リフレッシュトークン取得

Google は 2022 年末に OOB flow を廃止したため、**loopback redirect 方式**で取得する。

### 前提
1. Google Cloud Console で AdSense Management API を有効化
2. OAuth 同意画面の scope に `https://www.googleapis.com/auth/adsense.readonly` を追加
3. OAuth クライアント（**Desktop app** type）を作成し、Client ID / Secret を取得
4. AdSense 管理画面で認可に使う Google アカウントを Users に追加（別アカウントで管理している場合）

### スクリプト（プロジェクトルートで実行）

以下を `get-adsense-token.mjs` として保存（実行後に削除すること、コミット禁止）:

```javascript
import { google } from 'googleapis';
import http from 'node:http';
import { URL } from 'node:url';
import open from 'open';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const PORT = 53217;
const REDIRECT_URI = `http://localhost:${PORT}`;

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_ADSENSE_CLIENT_ID,
  process.env.GOOGLE_ADSENSE_CLIENT_SECRET,
  REDIRECT_URI
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/adsense.readonly'],
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get('code');
  if (!code) { res.end('no code'); return; }
  const { tokens } = await oauth2Client.getToken(code);
  res.end('<h1>OK. Close this tab.</h1>');
  console.log(`\nGOOGLE_ADSENSE_REFRESH_TOKEN=${tokens.refresh_token}`);
  server.close();
  process.exit(0);
});

server.listen(PORT, async () => {
  console.log('ブラウザを自動で開きます...');
  await open(authUrl).catch(() => console.log('手動で開いてください:\n' + authUrl));
});
```

### 実行
```bash
cd /path/to/stats47
node get-adsense-token.mjs
# → ブラウザで認可 → refresh_token が stdout に出力される
# → .env.local に追記してスクリプトを削除
```

### トラブルシューティング
- **refresh_token が undefined**: https://myaccount.google.com/permissions でアプリ権限を削除してから再実行
- **403 PERMISSION_DENIED / accounts.list が空**: 認可に使った Google アカウントが AdSense にアクセス権を持っていない。AdSense 管理画面 → Account → Access and authorization → Users で招待
- **redirect_uri_mismatch**: OAuth クライアントが Web app タイプになっている。Desktop app で再作成

## 手順

### Step 1: パッケージ確認

```bash
node -e "require('googleapis')" 2>/dev/null && echo "OK" || echo "INSTALL NEEDED"
node -e "require('dotenv')" 2>/dev/null && echo "OK" || npm install -D dotenv
```

### Step 1.5: モード判定

引数に `snapshot YYYY-Www` が含まれていれば **snapshot モード** に分岐する（Step 2s 参照）。
それ以外は従来どおり ad hoc モード（Step 2）を実行する。

### Step 2: データ取得スクリプト実行（ad hoc モード）

```javascript
const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_ADSENSE_CLIENT_ID,
  process.env.GOOGLE_ADSENSE_CLIENT_SECRET
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_ADSENSE_REFRESH_TOKEN });

const adsense = google.adsense({ version: 'v2', auth: oauth2Client });
const ACCOUNT = `accounts/${process.env.GOOGLE_ADSENSE_ACCOUNT_ID}`;

async function main() {
  // 期間: last28d
  const today = new Date();
  const endDate = new Date(today); endDate.setDate(today.getDate() - 1);
  const startDate = new Date(endDate); startDate.setDate(endDate.getDate() - 27);

  const res = await adsense.accounts.reports.generate({
    account: ACCOUNT,
    'dateRange': 'CUSTOM',
    'startDate.year': startDate.getFullYear(),
    'startDate.month': startDate.getMonth() + 1,
    'startDate.day': startDate.getDate(),
    'endDate.year': endDate.getFullYear(),
    'endDate.month': endDate.getMonth() + 1,
    'endDate.day': endDate.getDate(),
    dimensions: ['PAGE_URL'],
    metrics: [
      'ESTIMATED_EARNINGS',
      'PAGE_VIEWS',
      'PAGE_VIEWS_RPM',
      'IMPRESSIONS',
      'CLICKS',
      'IMPRESSIONS_CTR',
      'ACTIVE_VIEW_VIEWABILITY',
    ],
    orderBy: ['-ESTIMATED_EARNINGS'],
    limit: 100,
  });

  console.log(JSON.stringify(res.data, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
```

### Step 3: 期間の計算

| 指定 | startDate | endDate |
|---|---|---|
| last7d | 8日前 | 1日前 |
| last28d | 29日前 | 1日前 |
| last3m | 92日前 | 1日前 |
| YYYY-MM-DD:YYYY-MM-DD | 開始日 | 終了日 |

**注意**: AdSense データは 1 日遅延する。endDate は常に 1 日前。

### Step 4: 結果の整形・レポート

**ページ別レポート（dimensions: PAGE_URL）:**

| # | ページ | PV | Impressions | CTR | RPM | Earnings (USD) | Viewability |
|---|---|---|---|---|---|---|---|
| 1 | /ranking/... | 1,500 | 4,200 | 0.8% | $2.10 | $3.15 | 72% |

**広告ユニット別（dimensions: AD_UNIT_NAME）:**

| # | Unit | Impressions | CTR | RPM | Earnings |
|---|---|---|---|---|---|

**日別推移（dimensions: DATE）:**

### Step 5: 分析コメント

- **収益ページ Top 10**: 収益が集中しているページ
- **RPM 改善候補**: PV は多いが RPM が低いページ（広告位置・フォーマット検討）
- **Viewability 80% 未満**: レイアウト改善の余地
- **前期間比**: 収益・RPM の増減

## snapshot モード

週次レビュー時に全ディメンションを全件取得し、`.claude/skills/analytics/adsense-improvement/reference/snapshots/<YYYY-Www>/` 配下に CSV として保存する。

### 呼び出し例

```
/fetch-adsense-data last7d snapshot 2026-W17
```

期間は過去 7 日間固定（週次 snapshot の前提）。

### 実行スクリプト

プロジェクトルートで以下を `node -e` で実行する:

```javascript
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_ADSENSE_CLIENT_ID,
  process.env.GOOGLE_ADSENSE_CLIENT_SECRET
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_ADSENSE_REFRESH_TOKEN });

const adsense = google.adsense({ version: 'v2', auth: oauth2Client });
const ACCOUNT = `accounts/${process.env.GOOGLE_ADSENSE_ACCOUNT_ID}`;

// 期間 (last7d): AdSense は 1 日遅延
const today = new Date();
const endDate = new Date(today); endDate.setDate(today.getDate() - 1);
const startDate = new Date(endDate); startDate.setDate(endDate.getDate() - 6);

// 保存先
const WEEK = '<YYYY-Www>'; // 引数から受け取る
const OUT_DIR = path.resolve(`.claude/skills/analytics/adsense-improvement/reference/snapshots/${WEEK}`);
fs.mkdirSync(OUT_DIR, { recursive: true });

const esc = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCSV = (rows, headers) =>
  [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n') + '\n';

async function fetchReport(dimensions, metrics, limit = 1000) {
  const res = await adsense.accounts.reports.generate({
    account: ACCOUNT,
    dateRange: 'CUSTOM',
    'startDate.year': startDate.getFullYear(),
    'startDate.month': startDate.getMonth() + 1,
    'startDate.day': startDate.getDate(),
    'endDate.year': endDate.getFullYear(),
    'endDate.month': endDate.getMonth() + 1,
    'endDate.day': endDate.getDate(),
    dimensions,
    metrics,
    limit,
  });
  return res.data;
}

function flatten(report) {
  const headers = report.headers?.map(h => h.name) || [];
  return (report.rows || []).map(row => {
    const out = {};
    row.cells.forEach((cell, i) => { out[headers[i]] = cell.value; });
    return out;
  });
}

async function main() {
  const METRICS = [
    'ESTIMATED_EARNINGS',
    'PAGE_VIEWS',
    'PAGE_VIEWS_RPM',
    'IMPRESSIONS',
    'CLICKS',
    'IMPRESSIONS_CTR',
    'ACTIVE_VIEW_VIEWABILITY',
  ];

  const jobs = [
    { name: 'overview', dims: [], file: 'overview.csv' },
    { name: 'pages', dims: ['PAGE_URL'], file: 'pages.csv' },
    { name: 'units', dims: ['AD_UNIT_NAME'], file: 'units.csv' },
    { name: 'devices', dims: ['PLATFORM_TYPE_NAME'], file: 'devices.csv' },
    { name: 'daily', dims: ['DATE'], file: 'daily.csv' },
  ];

  const summary = [];
  for (const job of jobs) {
    const report = await fetchReport(job.dims, METRICS);
    const rows = flatten(report);
    const headers = [...job.dims, ...METRICS];
    const csv = toCSV(rows, headers);
    fs.writeFileSync(path.join(OUT_DIR, job.file), csv);
    summary.push(`${job.file}: ${rows.length} rows`);
  }

  // 通貨確認
  const overview = flatten(await fetchReport([], METRICS))[0] || {};
  summary.push(`period: ${startDate.toISOString().slice(0,10)} ~ ${endDate.toISOString().slice(0,10)}`);
  summary.push(`total_earnings: ${overview.ESTIMATED_EARNINGS || 'N/A'}`);

  console.log(`[adsense-snapshot] ${WEEK} saved to ${OUT_DIR}`);
  console.log(summary.join('\n'));
}

main().catch(e => { console.error(e.message || e); process.exit(1); });
```

実行前に `<YYYY-Www>` を引数で受け取った値に置換すること。

### 保存後の挙動

- 保存先ディレクトリ: `.claude/skills/analytics/adsense-improvement/reference/snapshots/<YYYY-Www>/`
- 各ファイルの行数
- 期間 / 合計収益サマリー

### snapshot モード完了後の連携

`/weekly-review` から呼ばれた場合は、続けて `/adsense-improvement observe` が実行されて snapshot Issue が作成される。単体実行時は手動で `/adsense-improvement observe` を呼ぶ。

## よく使うパターン

```bash
# ページ別収益（過去28日）
/fetch-adsense-data last28d page

# 広告ユニット別（過去7日）
/fetch-adsense-data last7d ad_unit

# 日別推移（過去28日）
/fetch-adsense-data last28d date

# 週次 snapshot
/fetch-adsense-data snapshot 2026-W17
```

## API レート制限

- AdSense Management API: 1 QPS（ユーザー単位）、クォータ 10,000 リクエスト/日
- レポート dimensions / metrics の組み合わせには制約あり（AD_UNIT × AD_CLIENT_ID 不可等）

## 参照

- [AdSense Management API v2](https://developers.google.com/adsense/management/reference/rest/v2/accounts.reports/generate)
- [Dimensions & Metrics](https://developers.google.com/adsense/management/metrics-dimensions)
- AdSense 管理画面: https://www.google.com/adsense/
