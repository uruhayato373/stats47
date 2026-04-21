---
name: Cloudflare コスト改善施策
about: D1 rows read / Workers CPU ms / Storage の削減施策。1 施策 1 Issue。
title: '[T?-CATEGORY-NN] '
labels: cost-improvement, effect/pending
assignees: ''
---

## 施策 ID
<!-- 例: T1-D1READ-01 -->
- **Tier**: T1 / T2 / T3
- **Category**: D1READ / D1WRITE / D1STORAGE / CPUMS / REQUESTS / R2 / CACHE
- **連番**: 01, 02, ...

## ターゲット指標
<!-- 何を削減する施策か。複数可。 -->
- [ ] D1 Rows Read
- [ ] D1 Rows Written
- [ ] D1 Storage
- [ ] Workers CPU ms
- [ ] Workers Requests
- [ ] R2 Storage / Operations

## 想定効果値
<!-- 絶対値 or 割合。デプロイ前に記入しておき後付けバイアスを防ぐ。 -->
<!-- 例: 月 500M-1B rows 削減 / -50% -->

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
- **次回請求** (次の 15 日): YYYY-MM-DD

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
