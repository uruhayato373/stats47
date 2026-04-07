---
name: sns-weekly-report
description: DB の sns_metrics から週次パフォーマンスレポートを Markdown で生成する。Use when user says "SNSレポート", "週次レポート", "SNS分析". プラットフォーム横断で集計.
disable-model-invocation: true
---

DB (`sns_metrics`) のパフォーマンスデータを集計し、週次レポートを Markdown で生成する。

## 引数

```
/sns-weekly-report [YYYY-Www]
```

- 週番号（任意）: ISO 8601 週番号（例: `2026-W10`）。省略時は前週。

## 前提

- `sns_metrics` テーブルに `/update-sns-metrics` でデータが蓄積済み
- DB: `.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite`

## 手順

### 1. 対象期間の算出

指定された週番号から月曜〜日曜の日付範囲を算出する。

### 2. DB から集計

```sql
-- プラットフォーム別サマリー
SELECT
  platform,
  COUNT(DISTINCT content_key) AS post_count,
  SUM(impressions) AS total_impressions,
  SUM(reach) AS total_reach,
  SUM(likes) AS total_likes,
  SUM(comments) AS total_comments,
  SUM(shares) AS total_shares,
  SUM(saves) AS total_saves,
  SUM(views) AS total_views
FROM sns_metrics
WHERE fetched_at BETWEEN '<monday>' AND '<sunday>'
GROUP BY platform;

-- 投稿別 Top パフォーマンス（エンゲージメント順）
SELECT content_key, platform, impressions, reach, likes, comments, shares, saves
FROM sns_metrics
WHERE fetched_at BETWEEN '<monday>' AND '<sunday>'
ORDER BY (COALESCE(likes,0) + COALESCE(comments,0) + COALESCE(shares,0) + COALESCE(saves,0)) DESC
LIMIT 10;

-- 前週との比較（前週データがある場合）
-- 同様のクエリを前週期間で実行し、差分を算出
```

### 3. レポート生成

`docs/03_レビュー/weekly/` の週次レビューファイル内に SNS パフォーマンスセクションとしてインライン出力する。
独立ファイルとしての出力が必要な場合は `docs/03_レビュー/weekly/<YYYY-Www>-sns.md` に出力する。

### 4. 分析コメント

データに基づいて以下の分析を記載:

- 前週比での増減トレンド
- エンゲージメント率の高い/低い投稿の特徴
- プラットフォーム別の傾向差
- 次週のアクション提案（投稿頻度・テーマ・プラットフォーム注力先）

## 参照

- `packages/database/src/schema/sns_metrics.ts` — sns_metrics テーブル定義
- `packages/database/src/schema/sns_posts.ts` — sns_posts テーブル定義
