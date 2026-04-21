---
name: GA4 週次スナップショット
about: 週次取得時に 1 Issue 作成。メトリクス記録と施策効果判定の起点。
title: '[GA4 Snapshot] YYYY-Www'
labels: ga4-snapshot
assignees: ''
---

## 期間
- **ISO Week**: YYYY-Www
- **期間**: YYYY-MM-DD 〜 YYYY-MM-DD（過去 7 日）
- **取得日**: YYYY-MM-DD

## 全体メトリクス

| 指標 | 実績 | 前週 | delta | 目標 | 判定 |
|---|---|---|---|---|---|
| Active Users | | | | | |
| Sessions | | | | | |
| Page Views | | | | | |
| Engagement Rate | % | % | | % | |
| Avg Engagement Time | s | s | | | |
| Bounce Rate | % | % | | % | |
| Key Events | | | | | |

<!-- 判定: ✅ OK / ⚠️ WARNING / 🔴 ERROR -->

## チャネル別

| Channel | Users | Sessions | Engagement | 前週比 |
|---|---|---|---|---|
| Organic Search | | | | |
| Direct | | | | |
| Referral | | | | |
| Social | | | | |

## デバイス別

| Device | Users | Sessions | Engagement |
|---|---|---|---|
| mobile | | | |
| desktop | | | |
| tablet | | | |

## 生データ
- `.claude/skills/analytics/ga4-improvement/reference/snapshots/YYYY-Www/`
  - `overview.csv`
  - `pages.csv`
  - `channels.csv`
  - `devices.csv`
  - `daily.csv`

## トップページ変動（前週比）
<!-- Users / Engagement の伸びが大きい上位 10 ページ -->

## アクティブな施策の効果
<!-- 前週以降にデプロイされた施策の実測効果を各施策 Issue にコメントで追記、ここには要約のみ -->

## アラート
<!-- Bounce Rate 悪化、Engagement 急減、Key Event 消失等 -->

## 次のアクション
<!-- 次週に向けて着手すべき新規施策の提案 -->
