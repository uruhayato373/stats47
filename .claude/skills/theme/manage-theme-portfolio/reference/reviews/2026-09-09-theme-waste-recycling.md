---
date: 2026-09-09
status: local-verified
---

# ごみ・リサイクルの初回実装レビュー

Codexによる実装者レビュー。対象は2023年度の3指標・2章で、公開後の効果判定は含まない。

- 排出量・最終処分量・リサイクル率の141値を検証済みAPI応答と照合した。既存のリサイクル率キーを再利用し、同じ統計の重複登録を避けた。
- 一般廃棄物と産業廃棄物を区別し、処理段階が違う排出量と最終処分量を合算しない。人口規模が量に影響することを説明した。
- リサイクル率は集団回収を含み、最終処分量の割合の補数とは一致しないことを本文に明示した。
- PC・モバイルで全県と兵庫県、表・棒グラフ・タイル地図を確認した。地図は模式的位置と色の値域を明記し、47県を保持する。
- 2024年度は公表済みであり、2023年度を最新と呼ばない。公式Excelの47県、排出量K列・リサイクル率AL列・最終処分量AQ列とhashを確認済みだが、継続取込・前年接続は未実装。

根拠: [環境省・令和6年度一般廃棄物処理実態調査](https://www.env.go.jp/recycle/waste_tech/ippan/r6/index.html)、
`.claude/skills/theme/research-theme-catalog/reference/theme-feasibility-catalog.json`、`.claude/state/metrics/themes/2026-09-09-first-batch.json`。
実験は `THEME-LAUNCH-20260909-waste-recycling`。公開確認後から観測を始める。
未完了工程は `.claude/todo/backlog.md` の `THEME-EXPANSION-IMPLEMENT-01` と `THEME-PORTFOLIO-REMAINDER-01` を参照する。
