---
name: GSC 改善施策
about: 検索パフォーマンス改善施策。1 施策 1 Issue。
title: '[T?-CATEGORY-NN] '
labels: gsc-improvement, effect/pending
assignees: ''
---

## 施策 ID
<!-- 例: T1-CTR-01 -->
- **Tier**: T1 / T2 / T3
- **Category**: CTR / IMPRESSIONS / POSITION / INDEX / TITLE / DESCRIPTION / INTERNAL-LINK / SITEMAP / SCHEMA / CONTENT
- **連番**: 01, 02, ...

## ターゲット指標
<!-- 何を改善する施策か。複数可。 -->
- [ ] Clicks
- [ ] Impressions
- [ ] CTR
- [ ] Avg Position
- [ ] Index Coverage

## 対象ページ / クエリ
<!-- 具体的に何が対象か。URL パターン or クエリ。 -->

## 想定効果値
<!-- 絶対値 or 割合。デプロイ前に記入しておき後付けバイアスを防ぐ。 -->
<!-- 例: CTR +1.5pt / Impressions +20% / Position -2 -->

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
