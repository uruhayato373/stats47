---
name: AdSense 改善施策
about: 広告収益改善施策（配置・RPM・ビューアビリティ）。1 施策 1 Issue。
title: '[T?-CATEGORY-NN] '
labels: adsense-improvement, effect/pending
assignees: ''
---

## 施策 ID
<!-- 例: T1-PLACEMENT-01 -->
- **Tier**: T1 / T2 / T3
- **Category**: PLACEMENT / FORMAT / RPM / CTR / VIEWABILITY / POLICY / AUTO-ADS / EXPERIMENT
- **連番**: 01, 02, ...

## ターゲット指標
<!-- 何を改善する施策か。複数可。 -->
- [ ] Earnings
- [ ] Page RPM
- [ ] CTR
- [ ] Impressions
- [ ] Active View %
- [ ] Clicks

## 対象ページ / スロット
<!-- 具体的に何が対象か。URL パターン or 広告ユニット名。 -->

## 想定効果値
<!-- 絶対値 or 割合。デプロイ前に記入しておき後付けバイアスを防ぐ。 -->
<!-- 例: Page RPM +20% / Viewability +10pt / Monthly Earnings +¥5,000 -->

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

## ポリシーチェック
<!-- AdSense ポリシーに抵触しないかの確認。特に配置・ラベリング・コンテンツ -->
- [ ] 広告の誤クリック誘発なし（誤認配置なし）
- [ ] "Advertisement" ラベル付与
- [ ] Auto ads 設定に矛盾しない
- [ ] モバイル表示で邪魔になっていない

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
