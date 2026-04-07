---
name: lighthouse-audit
description: Lighthouse CLI でパフォーマンス測定しDB蓄積する。Use when user says "Lighthouse実行", "パフォーマンス測定", "CWV計測". スコア・CWV・リソース分析をページ種別一括実行.
disable-model-invocation: true
argument-hint: "[--url PATH] [--type TYPE] [--strategy mobile|desktop|both] [--dry-run]"
allowed-tools: Read, Bash, Grep
---

Lighthouse CLI をローカル実行して stats47.jp の各ページのパフォーマンスを測定し、`performance_metrics` テーブルに蓄積する。API キー不要・レート制限なし。測定結果はマークダウンテーブルで出力する。

## 引数

```
/lighthouse-audit [--url PATH] [--type TYPE] [--strategy mobile|desktop|both] [--dry-run] [--top-pv N]
```

- `--url`: 単一パスを指定して測定（例: `--url /ranking/population-density`）
- `--type`: ページ種別を指定して一括測定（省略時: `all`）
  - `homepage`: トップページのみ
  - `theme`: テーマダッシュボード（`/themes/*`）
  - `ranking`: ランキングページ（PV 上位から抽出）
  - `area`: 都道府県ページ（`/areas/*`）
  - `blog`: ブログ記事（PV 上位から抽出）
  - `all`: 全種別から代表ページを選出
- `--strategy`: 測定デバイス（デフォルト: `both`）
  - `mobile`: モバイルのみ
  - `desktop`: デスクトップのみ
  - `both`: モバイル・デスクトップ両方
- `--dry-run`: API を呼ばず、測定対象 URL の一覧のみ表示
- `--top-pv N`: PV 上位 N 件を対象とする（デフォルト: `10`）。`ranking_page_views` テーブルから PV 上位を抽出

## 実行

**Lighthouse CLI スクリプト（推奨）:**

```bash
npx tsx packages/database/scripts/lighthouse-check.ts $ARGUMENTS
```

このスクリプトは:
- ローカルの Chrome で Lighthouse を実行（API キー不要・レート制限なし）
- 結果を `performance_metrics` テーブルに自動 UPSERT
- マークダウンテーブルで結果を出力

**デフォルト測定対象:**
- トップページ、テーマ（3ページ）、都道府県（3ページ）、比較、相関分析 = 計 9 URL

### フォールバック: PSI API

CLI が使えない場合（Chrome なし等）は PSI API を使用:

```bash
PSI_API_KEY=$(grep PSI_API_KEY .env.local | cut -d= -f2)
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeedtest?url=https://stats47.jp/&strategy=mobile&key=${PSI_API_KEY}"
```

**注意**: PSI API はネットワーク環境によりアクセスできない場合がある（企業プロキシ等）。その場合はブラウザで https://pagespeed.web.dev/ を使用。

## バジェット違反チェック

以下の閾値を超えた場合はレポートに警告を出す:

   | 指標 | Good | Needs Improvement | Poor |
   |---|---|---|---|
   | LCP | < 2500ms | 2500-4000ms | > 4000ms |
   | CLS | < 0.1 | 0.1-0.25 | > 0.25 |
   | INP | < 200ms | 200-500ms | > 500ms |
   | FCP | < 1800ms | 1800-3000ms | > 3000ms |
   | TBT | < 200ms | 200-600ms | > 600ms |
   | Performance Score | >= 90 | 50-89 | < 50 |

## 出力フォーマット

### コンソール出力（マークダウンテーブル）

```markdown
## Lighthouse Audit Results — YYYY-MM-DD

### Mobile

| URL | Perf | A11y | BP | SEO | LCP | CLS | FCP | TBT | Budget |
|---|---|---|---|---|---|---|---|---|---|
| / | 92 | 100 | 100 | 100 | 1.8s | 0.02 | 0.9s | 120ms | OK |
| /ranking/pop-density | 78 | 98 | 100 | 100 | 3.2s | 0.15 | 1.5s | 350ms | LCP,CLS |

### Desktop

| URL | Perf | A11y | BP | SEO | LCP | CLS | FCP | TBT | Budget |
|---|---|---|---|---|---|---|---|---|---|
| ... |

### CrUX Field Data（実ユーザーデータ）

| URL | LCP p75 | CLS p75 | INP p75 | TTFB p75 | 評価 |
|---|---|---|---|---|---|
| / | 2.1s | 0.05 | 120ms | 0.8s | Good |

※ CrUX データはトラフィックが十分なページのみ。低トラフィックページでは null になる。

### Budget Violations

| URL | Strategy | 指標 | 値 | 閾値 | 重大度 |
|---|---|---|---|---|---|
| /ranking/xxx | mobile | LCP | 4.2s | 2.5s | Poor |

### Summary

- 測定 URL 数: N
- バジェット違反: N 件（Poor: N, Needs Improvement: N）
- 平均 Performance Score: mobile N / desktop N
```

## 注意事項

- **CLI 推奨**: ローカル Lighthouse CLI は API キー不要で安定して動作する。PSI API はフォールバック
- **CrUX データ**: 実ユーザーデータは Chrome UX Report に十分なトラフィックがあるページのみ返される。新規ページや低トラフィックページでは null
- **Lab vs Field**: Lighthouse スコアは Lab データ（シミュレーション）。CrUX は Field データ（実ユーザー）。両方を記録する
- **測定のばらつき**: Lighthouse スコアは測定ごとに ±5 程度のばらつきがある。トレンドで判断すること
- **Cloudflare Pages**: stats47 は Cloudflare Pages でホスティングされているため、TTFB は一般的に良好。Edge キャッシュの影響も考慮

## 推奨実行頻度

- **週次**: `--type all --strategy both`（定点観測）
- **デプロイ後**: `--type homepage --strategy mobile`（リグレッション検出）
- **月次**: `/performance-report` と組み合わせてトレンド分析

## 参照

- `.claude/skills/analytics/performance-report/SKILL.md` — パフォーマンス総合レポート
- `.claude/skills/analytics/seo-audit/SKILL.md` — SEO 総合監査（CWV セクションと連携）
- `packages/database/src/schema/` — performance_metrics テーブル定義
- PageSpeed Insights API: https://developers.google.com/speed/docs/insights/v5/get-started

## DB パス

```
.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite
```
