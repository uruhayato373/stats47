---
name: GA4 改善施策
about: ユーザー行動改善施策（エンゲージメント・CV・回遊）。1 施策 1 Issue。
title: '[T?-CATEGORY-NN] '
labels: ga4-improvement, effect/pending
assignees: ''
---

## 施策 ID
<!-- 例: T1-ENGAGEMENT-01 -->
- **Tier**: T1 / T2 / T3
- **Category**: USERS / SESSIONS / ENGAGEMENT / BOUNCE / CONVERSION / RETENTION / SPEED / NAVIGATION / CONTENT
- **連番**: 01, 02, ...

## ターゲット指標
<!-- 何を改善する施策か。複数可。 -->
- [ ] Active Users
- [ ] Sessions
- [ ] Page Views
- [ ] Engagement Rate
- [ ] Avg Engagement Time
- [ ] Bounce Rate
- [ ] Key Events / Conversions

## 対象ページ / セグメント
<!-- 具体的に何が対象か。URL パターン or ユーザーセグメント。 -->

## 想定効果値
<!-- 絶対値 or 割合。デプロイ前に記入しておき後付けバイアスを防ぐ。 -->
<!-- 例: Engagement Rate +5pt / Bounce -10pt / Key Event +30% -->

## デプロイ情報
- **デプロイ日**: YYYY-MM-DD
- **PR**: #
- **コミット**: `abcdef12`
- **本番反映**: [ ] デプロイ済 / [ ] 反映待ち

## 変更内容
<!-- 何をしたか、なぜその方針を選んだか -->

## 変更ファイル
<!-- git diff --name-only の結果 -->
```
```

## 観測予定日
- **MID** (デプロイ + 14 日): YYYY-MM-DD
- **FINAL** (デプロイ + 28 日): YYYY-MM-DD

## 実測効果
<!-- observe モードが自動でコメント追記する。手動追加も可。
     判定ルール:
     - 経過 < 14 日 → effect/pending
     - 経過 ≥ 14 日 かつ |実測/想定| ≥ 80% → effect/full
     - 経過 ≥ 14 日 かつ 20-80% → effect/partial
     - 経過 ≥ 14 日 かつ < 20% → effect/none
     - 逆方向 → effect/adverse
-->

## 関連
<!-- snapshot issue, 他の施策, PR へのリンク -->
