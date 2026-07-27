# GA4 Latest — 2026-W30

## 確定7日 KPI (jpFinalized7d — Japan-only clean。WoW はここだけ)

⚠️ 確定7日 summary が未生成 (summary.json 無し)。WoW・ゲート判定は停止する。

## 参考系列 (legacy history — 基盤混在のため週次ゲートに使わない)

| Metric | 値 | basis |
|---|---|---|
| Active Users | 2081 | jp-calendar-week |
| Sessions | 2520 | jp-calendar-week |
| Pageviews | 6922 | jp-calendar-week |

> basis=jp-calendar-week は Japan-only カレンダー週 (日曜実行時は末日未確定)、
> basis=raw-rolling28d は無フィルタ 28 日合計 (overseas/(not set) 汚染あり)。KPI は上段の確定7日を使う。

履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / legacy = [`history.csv`](./history.csv)

> schema v2 (2026-07-28): 旧 `history.csv` は W22 以前が raw 28 日合計、W23 以降が Japan-only
> カレンダー週と基盤が混在していたため `basis` 列で行ごとに明記した (値は不変)。
