# SNS 投稿管理

SNS 投稿の計画・ステータス・パフォーマンスを Markdown で管理する。
パフォーマンス数値の時系列データは DB (`sns_metrics`) に蓄積。

## 構成

```
posts/
  ranking.md        ランキング投稿（1テーブル = 全ランキング × 全プラットフォーム）
  bar-chart-race.md Bar Chart Race 投稿
  compare.md        比較投稿
  correlation.md    相関投稿
analytics/
  weekly/      週次レポート
  monthly/     月次レポート
templates/     Obsidian テンプレート
```

## テーブル形式

各 contentType ごとに 1 ファイル（Markdown テーブル）で管理する。

### ステータス値

| 値 | 意味 |
|---|---|
| `posted` | 各プラットフォームに投稿済み |
| `generated` | コンテンツ生成済み（`.local/r2/sns/` に配置） |
| `-` | 未着手 |

### テーブル列

- **title**: 指標名（`[title](https://stats47.jp/ranking/<key>)` 形式のリンク。key はURL末尾から取得）
- **X / IG / YT / TT**: 各プラットフォームのステータス
- **Note**: note.com のステータス（ranking のみ）
- **postedAt**: 投稿日（ISO 8601）
- **memo**: 自由記述

## 関連スキル

| スキル | 用途 |
|---|---|
| `/post-x`, `/post-instagram` 等 | コンテンツ生成 → テーブルのステータスを `generated` に |
| `/mark-sns-posted` | 投稿記録 → テーブルのステータスを `posted` に |
| `/update-sns-metrics` | API 指標取得 → DB 蓄積 |
| `/sns-weekly-report` | 週次パフォーマンスレポート生成 |

## DB テーブル (`sns_metrics`)

パフォーマンス数値の時系列蓄積用。スナップショット方式で取得のたびに INSERT。

```sql
-- 特定投稿の最新指標
SELECT * FROM sns_metrics
WHERE content_key = 'total-fertility-rate' AND platform = 'x'
ORDER BY fetched_at DESC LIMIT 1;

-- プラットフォーム別 月次サマリー
SELECT platform, COUNT(DISTINCT content_key) AS posts,
  SUM(impressions) AS imp, SUM(likes) AS likes
FROM sns_metrics
WHERE fetched_at BETWEEN '2026-03-01' AND '2026-03-31'
GROUP BY platform;
```
