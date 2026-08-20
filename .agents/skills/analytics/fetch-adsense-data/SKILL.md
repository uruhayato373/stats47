---
name: fetch-adsense-data
description: Google AdSense Management API から広告収益・RPM・CTR・ビューアビリティを取得する。Use when user says "AdSenseデータ", "広告収益", "RPM", "AdSense snapshot". snapshot モードで週次 CSV を .Codex/skills/analytics/adsense-improvement/reference/snapshots/ に保存.
primary_agent: adsense-analyst
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

AdSense Management API は **OAuth 2.0** が必須（サービスアカウントでは広告主データにアクセス不可）。scope は read-only の `https://www.googleapis.com/auth/adsense.readonly` だけを使う（書き込み API は自動化しない。正典 `.Codex/scripts/google-admin/README.md`）。

- **CI設定の正典は GitHub Actions**（CI 専任・`.env.local` を正典にしない）。公開識別子は Repository Variables、秘密情報は Secrets に分離して次の 4 つを設定する:
  - Repository Variable `GOOGLE_ADSENSE_CLIENT_ID`
  - `GOOGLE_ADSENSE_CLIENT_SECRET`
  - `GOOGLE_ADSENSE_REFRESH_TOKEN`（`adsense.readonly`）
  - Repository Variable `GOOGLE_ADSENSE_ACCOUNT_ID`（`pub-7995274743017484`）
- ローカルで ad hoc 実行する場合のみ、同じ 4 変数を shell env か `.env.local` に置く（`.Codex/scripts/google-admin/audit-adsense.mjs` が `.env.local` から自己ロードする）。値は git へ commit しない。
- npm パッケージ: `googleapis`（既にインストール済み）
- AdSense 管理画面: `ca-pub-7995274743017484` の審査通過・広告配信中

## 初回セットアップ: リフレッシュトークン取得

**正典スクリプトは `.Codex/scripts/adsense/oauth-setup.js`**（read-only scope で loopback redirect。使い捨て一時スクリプトを新たに書かない）。

```bash
# Google Cloud Console 側の前提: AdSense Management API 有効・データアクセスに adsense.readonly・
# 公開ステータス「本番環境」・OAuth クライアントは Desktop app タイプ（詳細はスクリプト冒頭のコメント）
cd ~/stats47 && read -r CID && read -rs CSEC && \
  GOOGLE_ADSENSE_CLIENT_ID="$CID" GOOGLE_ADSENSE_CLIENT_SECRET="$CSEC" \
  node .Codex/scripts/adsense/oauth-setup.js; unset CID CSEC
# → ブラウザで認可 → refresh_token を stdout に 1 度だけ出力し accounts.list で実接続を検証する
```

取得後は Client ID の Variable と 2 つの Secret を更新する
（Secret は対話プロンプトに貼る。コマンド引数にしない）:

```bash
read -r CID && printf '%s' "$CID" | gh variable set GOOGLE_ADSENSE_CLIENT_ID; unset CID
gh secret set GOOGLE_ADSENSE_CLIENT_SECRET
gh secret set GOOGLE_ADSENSE_REFRESH_TOKEN
```

### トラブルシューティング
- **refresh_token が undefined**: https://myaccount.google.com/permissions でアプリ権限を削除してから再実行
- **403 PERMISSION_DENIED / accounts.list が空**: 認可に使った Google アカウントが AdSense にアクセス権を持っていない。AdSense 管理画面 → Account → Access and authorization → Users で招待
- **redirect_uri_mismatch**: OAuth クライアントが Web app タイプになっている。Desktop app で再作成
- **has not been used in project ...**: AdSense OAuth client の Google Cloud project で AdSense Management API が未有効。正しい project で有効化する（GA4/GSC 用サービスアカウントの project とは別物）

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

週次レビュー時に全ディメンションを全件取得し、`.Codex/skills/analytics/adsense-improvement/reference/snapshots/<YYYY-Www>/` 配下に CSV として保存する。

### 呼び出し例

```
/fetch-adsense-data last7d snapshot 2026-W17
```

期間は過去 7 日間固定（週次 snapshot の前提）。

### 実行スクリプト

正典実装 `.Codex/scripts/metrics/fetch-adsense-snapshot.mjs` を実行する
(旧: SKILL 内に同義スクリプトを複製していたが、公式 CPC 契約導入時の
drift 防止のため 2026-07-28 に正典参照へ一本化した):

```bash
npm run fetch-adsense-snapshot -- <YYYY-Www>     # 例: 2026-W30。未来週は失敗する
npm run fetch-adsense-snapshot -- <YYYY-Www> --dry-run   # API を呼ばず期間・job 契約を確認
```

- 期間は week から決定的に導出 (`lib/periods.mjs`・遅延 1 日・finalized7d)。
- 出力: overview / daily / devices / units / formats-platforms / placements-platforms /
  bid-types-platforms / traffic-sources / countries / pages.csv + `manifest.json`
  (期間 metadata・status。PAGE_URL 0 行は privacy-threshold であり欠損ではない)。
- metric は公式 `COST_PER_CLICK` / `IMPRESSIONS_RPM` / `AD_REQUESTS` / `AD_REQUESTS_COVERAGE` を含む。
  unit/format/placement 系 job は PAGE_VIEWS 系を要求しない (分母 0)。

### 保存後の挙動

- 保存先ディレクトリ: `.Codex/skills/analytics/adsense-improvement/reference/snapshots/<YYYY-Www>/`
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
