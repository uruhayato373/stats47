# ブログ改善優先度キュー

生成日: 2026-05-24 / GSC 参照週: 2026-W21 / ブログ記事数: 146 / 平均 CTR: 3.80%

**スコア** = CTR ギャップ（平均 - ページ）× log10(impressions + 1)

| 優先度 | slug | imp | CTR | 平均比 | score |
|---|---|---:|---:|---:|---:|
| 1 | child-height-regional-gap | 2,005 | 0.70% | +3.10% | 0.103 |
| 2 | manufacturing-aichi-dominance | 858 | 0.58% | +3.22% | 0.095 |
| 3 | overnight-guests-inbound-recovery | 375 | 0.27% | +3.53% | 0.091 |
| 4 | habitable-area-land-use | 754 | 0.66% | +3.14% | 0.091 |
| 5 | consumer-price-regional-gap | 216 | 0.00% | +3.80% | 0.089 |
| 6 | manufacturing-shipment-prefecture-ranking | 159 | 0.00% | +3.80% | 0.084 |
| 7 | fertility-rate-prefecture-gap | 148 | 0.00% | +3.80% | 0.083 |
| 8 | sunshine-pacific-vs-nihonkai | 146 | 0.00% | +3.80% | 0.082 |
| 9 | fishery-catch-aquaculture-shift | 133 | 0.00% | +3.80% | 0.081 |
| 10 | minimum-wage-1000yen-breakthrough | 118 | 0.00% | +3.80% | 0.079 |
| 11 | temperature-extremes-map | 2,415 | 1.49% | +2.31% | 0.078 |
| 12 | agriculture-hokkaido-dominance | 103 | 0.00% | +3.80% | 0.077 |
| 13 | truck-driver-2024-crisis | 67 | 0.00% | +3.80% | 0.070 |
| 14 | alcohol-prefecture-map | 66 | 0.00% | +3.80% | 0.069 |
| 15 | precipitation-snow-regional-gap | 155 | 0.65% | +3.15% | 0.069 |
| 16 | electricity-demand-gap | 58 | 0.00% | +3.80% | 0.067 |
| 17 | fishery-species-prefecture-specialty | 273 | 1.10% | +2.70% | 0.066 |
| 18 | park-green-space-gap | 334 | 1.20% | +2.60% | 0.066 |
| 19 | birth-death-gap-decline | 51 | 0.00% | +3.80% | 0.065 |
| 20 | marriage-divorce-okinawa | 50 | 0.00% | +3.80% | 0.065 |

## 次のステップ

```bash
# 上位記事から順に補強
/brushup-blog-article child-height-regional-gap
/brushup-blog-article manufacturing-aichi-dominance
/brushup-blog-article overnight-guests-inbound-recovery
```

## 注記

- CTR 0.00% = 計測週中クリックゼロ（検索表示はされている）
- スコア式: `(avg_ctr - page_ctr) × log10(impressions + 1)`
- 自動更新: `.github/workflows/fetch-metrics-weekly.yml` (毎週日曜 JST 20:00)
