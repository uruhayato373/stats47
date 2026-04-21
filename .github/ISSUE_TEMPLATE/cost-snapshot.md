---
name: Cloudflare 月次コストスナップショット
about: 月次請求到着時に 1 Issue 作成。メトリクス記録と施策効果判定の起点。
title: '[Cost Snapshot] YYYY-MM (Invoice IN-XXXXXXXX)'
labels: cost-snapshot
assignees: ''
---

## 請求書
- **Invoice**: IN-XXXXXXXX
- **期間**: YYYY-MM-15 〜 YYYY-MM-14
- **発行日**: YYYY-MM-15
- **合計**: $X.XX USD / ¥X,XXX JPY
- **PDF**: `~/Downloads/*.pdf`（必要ならリンク）

## メトリクス

| 指標 | 実績 | 無料枠 | 超過 | 課金額 | budget 判定 |
|---|---|---|---|---|---|
| D1 Rows Read | | 25B | | $ | |
| D1 Rows Written | | 50M | | $ | |
| D1 Storage | | 5 GB | | $ | |
| Workers CPU ms | | 30M | | $ | |
| Workers Requests | | 10M | | $ | |
| Workers Paid サブスク | 1 | - | - | $5.00 | - |
| 消費税 (10%) | | | | $ | - |
| **合計** | | | | **$** | |

<!-- budget 判定: ✅ OK / ⚠️ WARNING / 🔴 ERROR -->

## 生データ
<!-- weekly-snapshots/YYYY-Www.json のパスと commit link -->
- `.claude/skills/analytics/cloudflare-cost-improvement/reference/weekly-snapshots/YYYY-Www.json`

## 前月比
<!-- 前月スナップショット Issue との差分 -->
| 指標 | 前月 | 今月 | delta |
|---|---|---|---|

## アクティブな施策の効果
<!-- 前月以降にデプロイされた施策の実測効果を各施策 Issue にコメントで追記、ここには要約のみ -->

## アラート
<!-- budget 超過・異常値 -->

## 次のアクション
<!-- 次月に向けて着手すべき新規施策の提案 -->
