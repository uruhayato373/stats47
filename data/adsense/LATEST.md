# AdSense Latest — 2026-W44

## 確定7日 KPI (finalized7d・前週比は直前の重複しない7日)

| Metric | 確定7日 | 前週比 |
|---|---|---|
| Earnings | 313.00 ▲ |  (+49.0%) |
| Page Views | 11716 ▲ |  (+14.8%) |
| Page RPM | 27.000 ▲ | |
| Impressions | 12640 ▲ |  (+23.2%) |
| 公式 Imp RPM | ¥25.00 | |
| Clicks | 48 ▲ |  (+92.0%) |
| CTR | 0.38% · | |
| 公式 CPC | ¥7.00 | |
| Viewability | 45.6% ▲ | |
| Ad Requests | 32859 | |
| Coverage | 40.3% | |

## 収益分解

- Impression density (imp/PV): **1.079** (前週 1.005)
- Viewable imp / PV: **0.492**
- 公式 Imp RPM: ¥25.00 / 公式 CPC: ¥7.00

## デバイス別（確定7日 / 前週比）

| Platform | RPM | Viewability | 公式CPC | 収益/click(legacy) | imp/PV | Earnings |
|---|---|---|---|---|---|---|
| Connected TV | ¥0.00 · | 0.0% · | ¥0.00 | ¥0.00 | 0.000 | ¥0.00 |
| Desktop | ¥24.00 ▼ | 45.7% ▲ +4.1pp | ¥8.00 | ¥8.40 | 1.213 | ¥168.00 (+6.3%) |
| Mobile | ¥33.00 ▲ | 45.1% ▲ +13.2pp | ¥5.00 | ¥5.38 | 0.892 | ¥140.00 (+185.7%) |
| Tablet | ¥11.00 ▼ | 49.5% ▼ -8.1pp | ¥3.00 | ¥2.50 | 0.801 | ¥5.00 (+25.0%) |

> ⚠️ **要確認の退行**: Tablet viewability -8.1pp（57.6%→49.5%）

## ページ種別 (GA4・確定7日と同じ窓・全世界)

| ページ種別 | PV | 広告の表示 | クリック | 収益 | 1,000 PV あたり | 前週の 1,000 PV あたり |
|---|---|---|---|---|---|---|
| ランキング | 6981 | 6142 | 12 | ¥130 | ¥18.7 | ¥12.8 |
| ブログ記事 | 3268 | 1868 | 16 | ¥82 | ¥25.2 | ¥21.6 |
| 地域 (県・市区町村) | 1991 | 477 | 4 | ¥21 | ¥10.5 | ¥8.2 |
| その他 | 3192 | 445 | 4 | ¥16 | ¥4.9 | ¥3.4 |
| カテゴリ | 541 | 421 | 1 | ¥7 | ¥13.7 | ¥10.4 |
| ホーム | 560 | 243 | 2 | ¥5 | ¥8.4 | ¥12.5 |
| テーマ | 582 | 91 | 0 | ¥3 | ¥4.5 | ¥4.5 |
| 検索 | 444 | 93 | 0 | ¥1 | ¥3.1 | ¥1.3 |
| 合計 | 17559 | 9780 | 39 | ¥266 | ¥15.1 | |

> GA4 の AdSense 連携 (2026-10-13〜) のページ別の値を `page-type.mjs` で分類した。合計は AdSense の値より少なく出る週がある (W43 ¥182 対 ¥210、W44 ¥266 対 ¥313。11-04〜11-10 は ¥596 対 ¥611)。収益の総額は上の AdSense の値を使い、この表はページ種別どうしの比較に使う。クリックは少ないので、判断は 1,000 PV あたりで行う。

履歴: [`history.csv`](./history.csv) / [`history-devices.csv`](./history-devices.csv) (デバイス別) / [`history-units.csv`](./history-units.csv) (ユニット別) / [`history-formats.csv`](./history-formats.csv) (フォーマット別) / [`history-placements.csv`](./history-placements.csv) (配置別) / [`history-bid-types.csv`](./history-bid-types.csv) (入札型別) / [`history-page-types.csv`](./history-page-types.csv) (ページ種別)

> schema v2 (2026-07-28): 公式 `COST_PER_CLICK`/`IMPRESSIONS_RPM`/`AD_REQUESTS`/`AD_REQUESTS_COVERAGE` を追加。
> 旧 `cpc` 列 (earnings/clicks) は**公式 CPC ではない**ため `earnings_per_click_legacy` へ改名した (値は不変)。
> 公式値が無い過去週は `-` (null)。0 で埋めない。ESTIMATED_EARNINGS は月次確定まで変動しうる推定値。
