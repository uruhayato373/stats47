---
name: performance-report
description: performance_metrics DB からパフォーマンス総合レポート生成（トレンド・バジェット監査・ページ種別比較・改善提案）
argument-hint: "[--period 7d|28d|3m] [--compare]"
allowed-tools: Read, Bash, Grep
---

`performance_metrics` テーブルに蓄積されたデータからパフォーマンス総合レポートを生成する。トレンド分析・バジェット監査・ページ種別比較・改善提案を含む。

## 前提条件

- `/lighthouse-audit` が少なくとも1回実行済みであること（`performance_metrics` にデータが必要）
- トレンド比較には2回以上の測定データが必要

## 引数

```
/performance-report [--period 7d|28d|3m] [--compare]
```

- `--period`: 分析対象期間（デフォルト: `28d`）
  - `7d`: 直近7日間
  - `28d`: 直近28日間
  - `3m`: 直近3ヶ月
- `--compare`: 前期間との比較を含める（例: `28d` なら前の28日間と比較）

## 実行

```bash
npx tsx packages/database/scripts/performance-report.ts $ARGUMENTS
```

スクリプトが存在しない場合は、以下の手順で手動実行する:

### 手動実行手順

1. **データ取得**

   ```sql
   -- 期間内の全測定データ
   SELECT * FROM performance_metrics
   WHERE measured_at >= datetime('now', '-28 days')
   ORDER BY measured_at DESC;

   -- ページ種別の判定（URL パターン）
   -- /              → homepage
   -- /themes/*      → theme
   -- /ranking/*     → ranking
   -- /areas/*       → area
   -- /blog/*        → blog
   -- /correlation/* → correlation
   -- /compare/*     → compare
   -- その他         → other
   ```

2. **セクション別分析の実行**（後述の各セクション参照）

3. **レポートファイルの生成・保存**

## レポートセクション

### 1. Executive Summary

- 期間内の測定回数・対象 URL 数
- 全体の平均 Performance Score（mobile / desktop）
- CWV 合格率（Good の割合）
- 前期間比の改善/悪化サマリー（`--compare` 時）
- 最も改善が必要なページ TOP 3

### 2. Core Web Vitals ステータス

CWV の 3 指標（LCP, CLS, INP）を評価する:

| 評価 | LCP | CLS | INP |
|---|---|---|---|
| Good | < 2.5s | < 0.1 | < 200ms |
| Needs Improvement | 2.5-4.0s | 0.1-0.25 | 200-500ms |
| Poor | > 4.0s | > 0.25 | > 500ms |

出力:
- Lab データ（Lighthouse）の CWV 分布
- Field データ（CrUX）の CWV 分布（データがある場合）
- ページ別の CWV ステータス一覧

### 3. ページ種別比較

ページ種別ごとの平均スコア・CWV を比較する:

| 種別 | 件数 | Perf (mob) | Perf (desk) | LCP | CLS | FCP | TBT |
|---|---|---|---|---|---|---|---|
| homepage | 1 | N | N | Ns | N | Ns | Nms |
| theme | N | N | N | Ns | N | Ns | Nms |
| ranking | N | N | N | Ns | N | Ns | Nms |
| area | N | N | N | Ns | N | Ns | Nms |
| blog | N | N | N | Ns | N | Ns | Nms |

### 4. トレンド分析

複数回の測定データからトレンドを分析する:

- 日次/週次の Performance Score 推移
- CWV 各指標の推移グラフ（テキストベース）
- 急激な悪化があった場合のアラート（前回比 -10 以上）
- デプロイとの相関（Git コミット履歴との照合）

### 5. Budget Violations

パフォーマンスバジェット違反の一覧:

| URL | Strategy | 指標 | 値 | 閾値 | 重大度 | 初検出日 | 継続期間 |
|---|---|---|---|---|---|---|---|
| /ranking/xxx | mobile | LCP | 4.2s | 2.5s | Poor | YYYY-MM-DD | N日 |

バジェット定義:
- Performance Score >= 80（mobile）/ >= 90（desktop）
- LCP < 2500ms
- CLS < 0.1
- FCP < 1800ms
- TBT < 200ms
- Total Byte Weight < 2MB

### 6. リソース分析

- 平均 Total Byte Weight（ページ種別ごと）
- Main Thread Time の分布
- 重いページの特定と原因推測（JS バンドル・画像・フォント等）

### 7. 改善アクション

優先度付きの改善提案:

| 優先度 | アクション | 対象ページ | 期待効果 | 実行方法 |
|---|---|---|---|---|
| P0 | LCP 改善: 画像最適化 | /ranking/xxx | LCP 4.2s → 2.5s | next/image の priority 設定 |
| P1 | CLS 改善: レイアウトシフト修正 | /themes/xxx | CLS 0.15 → 0.05 | 明示的な width/height 設定 |
| P2 | JS バンドル削減 | 全ページ | TBT -100ms | dynamic import の活用 |

改善提案の根拠:
- Lighthouse の diagnostics・opportunities セクションのデータ
- ページ種別間の比較（同種別の他ページより悪いもの）
- CWV の閾値超過

## 出力

### 保存先

```
docs/03_レビュー/performance/YYYY-MM.md
```

ディレクトリが存在しない場合は作成する。

### 出力フォーマット

```markdown
---
title: パフォーマンスレポート
date: "YYYY-MM-DD"
period: "YYYY-MM-DD ~ YYYY-MM-DD"
---

# パフォーマンスレポート（YYYY年MM月）

## エグゼクティブサマリー

- 測定 URL 数: N（mobile: N, desktop: N）
- 平均 Performance Score: mobile N / desktop N（前期比 ±N）
- CWV 合格率: N%（Good: N, NI: N, Poor: N）
- バジェット違反: N 件
- 最優先改善: {1文で}

## Core Web Vitals ステータス

### Lab Data（Lighthouse）

| 指標 | Good | Needs Improvement | Poor | p50 | p75 |
|---|---|---|---|---|---|
| LCP | N (N%) | N (N%) | N (N%) | Ns | Ns |
| CLS | N (N%) | N (N%) | N (N%) | N | N |
| FCP | N (N%) | N (N%) | N (N%) | Ns | Ns |
| TBT | N (N%) | N (N%) | N (N%) | Nms | Nms |

### Field Data（CrUX）

{CrUX データがある場合のみ表示}

## ページ種別比較

{テーブル}

## トレンド

{推移データ}

## バジェット違反

{違反一覧}

## リソース分析

{分析結果}

## 改善アクション

### P0: 即時対応

{アクション一覧}

### P1: 今週中

{アクション一覧}

### P2: 今月中

{アクション一覧}

## 次回への申し送り

- 注視すべきページ
- 改善後の再測定予定
- ベースライン数値
```

## 注意事項

- **データ不足**: 測定データが1回分しかない場合、トレンド分析はスキップされる
- **CrUX データ**: 低トラフィックページでは Field データが取得できないため、Lab データのみの分析になる
- **季節性**: トラフィック変動によるサーバー負荷の影響を考慮すること
- **Cloudflare Pages**: Edge キャッシュの効果で TTFB は一般的に良好。キャッシュ MISS 時との差異に注意

## 推奨実行頻度

- **月次**: フルレポート（`--period 28d --compare`）
- **四半期**: 長期トレンド（`--period 3m --compare`）
- **SEO 監査時**: `/seo-audit` の CWV セクションのデータソースとして利用

## 参照

- `.claude/skills/analytics/lighthouse-audit/SKILL.md` — PSI 測定・DB 蓄積
- `.claude/skills/analytics/seo-audit/SKILL.md` — SEO 総合監査
- `packages/database/src/schema/` — performance_metrics テーブル定義
- `docs/03_レビュー/performance/` — 過去のレポート

## DB パス

```
.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite
```
