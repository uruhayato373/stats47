# GA4 Latest — 2026-W37

## 確定7日 KPI (jpFinalized7d — Japan-only clean。WoW はここだけ)

期間: 2026-09-06 〜 2026-09-12（直前7日: 2026-08-30 〜 2026-09-05・重複なし）

| Metric | 確定7日 | 直前7日 | WoW |
|---|---|---|---|
| Active Users | 3865 | 3596 | +269 (+7.5%) |
| Sessions | 4507 | 4062 | +445 (+11%) |
| Engaged Sessions | 3034 | 2817 | +217 (+7.7%) |
| Pageviews | 11424 | 9612 | +1812 (+18.9%) |
| Engagement Rate | 67.32% | 69.35% | |

> pollution 監視: raw sessions 5456 − JP 4507 = 949 (17.4%)。raw を KPI へ混ぜない。

## 参考系列 (legacy history — 基盤混在のため週次ゲートに使わない)

| Metric | 値 | basis |
|---|---|---|
| Active Users | 3906 | jp-calendar-week |
| Sessions | 4569 | jp-calendar-week |
| Pageviews | 11090 | jp-calendar-week |

> basis=jp-calendar-week は Japan-only カレンダー週 (日曜実行時は末日未確定)、
> basis=raw-rolling28d は無フィルタ 28 日合計 (overseas/(not set) 汚染あり)。KPI は上段の確定7日を使う。

履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / legacy = [`history.csv`](./history.csv)

> schema v2 (2026-07-28): 旧 `history.csv` は W22 以前が raw 28 日合計、W23 以降が Japan-only
> カレンダー週と基盤が混在していたため `basis` 列で行ごとに明記した (値は不変)。
