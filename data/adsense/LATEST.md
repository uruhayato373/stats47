# AdSense Latest — 2026-W45

## 確定7日 KPI (finalized7d・前週比は直前の重複しない7日)

| Metric | 確定7日 | 前週比 |
|---|---|---|
| Earnings | 461.00 ▲ |  (+47.3%) |
| Page Views | 11649 ▼ |  (-0.6%) |
| Page RPM | 40.000 ▲ | |
| Impressions | 15546 ▲ |  (+23.0%) |
| 公式 Imp RPM | ¥30.00 | |
| Clicks | 55 ▲ |  (+14.6%) |
| CTR | 0.35% · | |
| 公式 CPC | ¥8.00 | |
| Viewability | 55.8% ▲ | |
| Ad Requests | 20586 | |
| Coverage | 78.9% | |

## 収益分解

- Impression density (imp/PV): **1.335** (前週 1.079)
- Viewable imp / PV: **0.745**
- 公式 Imp RPM: ¥30.00 / 公式 CPC: ¥8.00

## デバイス別（確定7日 / 前週比）

| Platform | RPM | Viewability | 公式CPC | 収益/click(legacy) | imp/PV | Earnings |
|---|---|---|---|---|---|---|
| Connected TV | ¥0.00 · | 0.0% · | ¥0.00 | ¥0.00 | 0.000 | ¥0.00 |
| Desktop | ¥23.00 ▼ | 48.2% ▲ | ¥11.00 | ¥10.71 | 1.419 | ¥150.00 (-10.7%) |
| Mobile | ¥68.00 ▲ | 68.9% ▲ +23.8pp | ¥7.00 | ¥7.46 | 1.289 | ¥306.00 (+118.6%) |
| Tablet | ¥10.00 ▼ | 51.4% ▲ | ¥0.00 | ¥0.00 | 0.652 | ¥5.00 (0.0%) |

## ページ種別 (GA4・確定7日と同じ窓・全世界)

| ページ種別 | PV | 広告の表示 | クリック | 収益 | 1,000 PV あたり | 前週の 1,000 PV あたり |
|---|---|---|---|---|---|---|
| ランキング | 5697 | 7344 | 18 | ¥204 | ¥35.8 | ¥18.7 |
| ブログ記事 | 3610 | 3177 | 16 | ¥116 | ¥32.2 | ¥25.2 |
| その他 | 4554 | 1417 | 8 | ¥60 | ¥13.2 | ¥4.9 |
| テーマ | 2121 | 1617 | 3 | ¥34 | ¥15.9 | ¥4.5 |
| 地域 (県・市区町村) | 1293 | 380 | 3 | ¥19 | ¥15.1 | ¥10.5 |
| ホーム | 458 | 396 | 0 | ¥9 | ¥20.7 | ¥8.4 |
| カテゴリ | 272 | 288 | 0 | ¥5 | ¥19.2 | ¥13.7 |
| 検索 | 401 | 67 | 0 | ¥1 | ¥1.4 | ¥3.1 |
| 合計 | 18406 | 14686 | 48 | ¥448 | ¥24.4 | |

> GA4 の AdSense 連携 (2026-10-13〜) のページ別の値を `page-type.mjs` で分類した。合計は AdSense の値より少なく出る週がある (W43 ¥182 対 ¥210、W44 ¥266 対 ¥313。11-04〜11-10 は ¥596 対 ¥611)。収益の総額は上の AdSense の値を使い、この表はページ種別どうしの比較に使う。クリックは少ないので、判断は 1,000 PV あたりで行う。

履歴: [`history.csv`](./history.csv) / [`history-devices.csv`](./history-devices.csv) (デバイス別) / [`history-units.csv`](./history-units.csv) (ユニット別) / [`history-formats.csv`](./history-formats.csv) (フォーマット別) / [`history-placements.csv`](./history-placements.csv) (配置別) / [`history-bid-types.csv`](./history-bid-types.csv) (入札型別) / [`history-page-types.csv`](./history-page-types.csv) (ページ種別)

> schema v2 (2026-07-28): 公式 `COST_PER_CLICK`/`IMPRESSIONS_RPM`/`AD_REQUESTS`/`AD_REQUESTS_COVERAGE` を追加。
> 旧 `cpc` 列 (earnings/clicks) は**公式 CPC ではない**ため `earnings_per_click_legacy` へ改名した (値は不変)。
> 公式値が無い過去週は `-` (null)。0 で埋めない。ESTIMATED_EARNINGS は月次確定まで変動しうる推定値。
