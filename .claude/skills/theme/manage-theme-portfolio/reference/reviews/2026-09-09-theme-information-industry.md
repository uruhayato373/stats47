---
date: 2026-09-09
status: local-verified
---

# 情報通信業の初回実装レビュー

Codexによる実装者レビュー。対象は2021年の2指標・2章で、公開後の効果判定は含まない。

- 2021年6月1日時点の民営事業所数・従業者数に対象を統一し、94値を検証済みAPI応答と照合した。
- 事業所所在地の比較であり、企業本社に集約した企業数ではないことを説明した。
- 2021年の調査名簿拡充による時系列の接続制約を明示した。2020年の売上高・付加価値額や古いinactive GDP系列を混ぜない。
- PC・モバイルで全県と兵庫県、表・棒グラフの切替を確認した。新規ランキング2件と県別テーマページは200応答。
- 件数は立地・従業者の分布を示す。生産性や通信カバー率を推論する画面にはしていない。

根拠: [e-Stat項目定義C](https://www.e-stat.go.jp/koumoku/koumoku_teigi/C)、
`.claude/state/estat/theme-expansion-verification.json`、`.claude/state/metrics/themes/2026-09-09-first-batch.json`。
実験は `THEME-LAUNCH-20260909-information-industry`。公開確認後から観測を始める。
未完了工程は `.claude/todo/backlog.md` の `THEME-EXPANSION-IMPLEMENT-01` と `THEME-PORTFOLIO-REMAINDER-01` を参照する。
