---
date: 2026-09-09
status: local-verified
---

# 建設業の初回実装レビュー

Codexによる実装者レビュー。対象は初回の4指標・3章で、公開後の効果判定は含まない。

- 2023年度の完成工事高・許可業者数と、2021年の民営事業所従業者数を別パネルで表示する。
- 完成工事高は業者所在地に帰属する。元請・下請の重複を説明し、合算や施工県への読み替えをしない。
- 許可業者数の単位を「業者」に是正した。従業者数との年差を使った比率は計算しない。
- 4指標×47県の188値を検証済みAPI応答と照合した。PC・モバイルで全県と兵庫県の切替、表・棒グラフ、ランキング・県別ページを確認した。
- 2021年の名簿拡充による過去年との比較制約を本文に明示した。将来の時系列追加では接続を再検査する。

根拠: [e-Stat項目定義C](https://www.e-stat.go.jp/koumoku/koumoku_teigi/C)、
`.claude/state/estat/theme-expansion-verification.json`、`.claude/state/metrics/themes/2026-09-09-first-batch.json`。
実験は `THEME-LAUNCH-20260909-construction-industry`。公開確認後から観測を始める。
未完了工程は `.claude/todo/backlog.md` の `THEME-EXPANSION-IMPLEMENT-01` と `THEME-PORTFOLIO-REMAINDER-01` を参照する。
