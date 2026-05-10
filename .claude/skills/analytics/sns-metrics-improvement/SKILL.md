---
name: sns-metrics-improvement
description: X / YouTube / Instagram の投稿パフォーマンスを週次スナップショットで追跡し、改善施策と効果判定を記録する。Use when user says "SNSメトリクス", "SNS改善", "投稿パフォーマンス分析", "エンゲージメント改善", or when reviewing sns-metrics-improvement issues.
---

X / YouTube / Instagram の投稿メトリクス（impressions / views / likes / engagement）を **週次スナップショット + 施策ログ**で追跡するスキル。

実証ベース判定ルール（`.claude/rules/evidence-based-judgment.md`）に従い、すべての effect/* ラベルは実測値を根拠とする。

## データの保管場所

| データ | 保管先 |
|---|---|
| 週次メトリクス CSV | `snapshots/YYYY-MM-DD/metrics.csv` |
| 改善施策ログ（append-only） | `reference/improvement-log.md` |
| 書き込みスクリプト | `.claude/scripts/lib/sns-metrics-store.cjs` |

## スナップショット収集

```bash
# 週次メトリクス取得（各プラットフォームから）
/fetch-x-data
/fetch-youtube-data
/fetch-instagram-data
```

収集後は `snapshots/YYYY-MM-DD/metrics.csv` に保存し、`reference/improvement-log.md` に実測値を追記する。

## 実証チェックリスト（effect/* ラベルを付ける前に必須）

参照: `.claude/rules/evidence-based-judgment.md`

- [ ] `snapshots/<date>/metrics.csv` の実測値を取得したか
- [ ] before/after の比較対象（投稿日・プラットフォーム・指標）が明確か
- [ ] 想定効果に根拠（過去投稿実績 / A/B 比較）を併記したか
- [ ] NG ワード（「のはず」「兆候」「浸透待ち」）を使っていないか
