# ブログ改善優先度キュー

生成日: 2026-05-10 / GSC 参照週: 2026-W19 / ブログ記事数: 113 / 平均 CTR: 2.63%

**スコア** = CTR ギャップ（平均 - ページ）× log10(impressions + 1)

| 優先度 | slug | imp | CTR | 平均比 | score |
|---|---|---:|---:|---:|---:|
| 1 | manufacturing-aichi-dominance | 344 | 0.00% | +2.63% | 0.067 |
| 2 | habitable-area-land-use | 605 | 0.33% | +2.30% | 0.064 |
| 3 | foreign-residents-diversity-map | 189 | 0.00% | +2.63% | 0.060 |
| 4 | consumer-price-regional-gap | 340 | 0.29% | +2.34% | 0.059 |
| 5 | overnight-guests-inbound-recovery | 331 | 0.30% | +2.33% | 0.059 |
| 6 | minimum-wage-1000yen-breakthrough | 111 | 0.00% | +2.63% | 0.054 |
| 7 | manufacturing-shipment-prefecture-ranking | 87 | 0.00% | +2.63% | 0.051 |
| 8 | birth-death-gap-decline | 78 | 0.00% | +2.63% | 0.050 |
| 9 | child-height-regional-gap | 861 | 0.93% | +1.70% | 0.050 |
| 10 | cpi-change-regional-pattern | 70 | 0.00% | +2.63% | 0.049 |
| 11 | barber-beauty-salon-regional-gap | 69 | 0.00% | +2.63% | 0.049 |
| 12 | truck-driver-2024-crisis | 61 | 0.00% | +2.63% | 0.047 |
| 13 | fishery-species-prefecture-specialty | 181 | 0.55% | +2.08% | 0.047 |
| 14 | food-spending-pattern | 50 | 0.00% | +2.63% | 0.045 |
| 15 | school-nonattendance-pattern | 49 | 0.00% | +2.63% | 0.045 |
| 16 | wage-vs-living-cost | 49 | 0.00% | +2.63% | 0.045 |
| 17 | aging-rate-akita-vs-okinawa | 48 | 0.00% | +2.63% | 0.044 |
| 18 | electricity-demand-gap | 48 | 0.00% | +2.63% | 0.044 |
| 19 | fertility-fiscal-nexus | 42 | 0.00% | +2.63% | 0.043 |
| 20 | manufacturing-productivity-ranking | 40 | 0.00% | +2.63% | 0.042 |

## 次のステップ

```bash
# 上位記事から順に補強
/brushup-blog-article manufacturing-aichi-dominance
/brushup-blog-article habitable-area-land-use
/brushup-blog-article foreign-residents-diversity-map
```

## 注記

- CTR 0.00% = 計測週中クリックゼロ（検索表示はされている）
- スコア式: `(avg_ctr - page_ctr) × log10(impressions + 1)`
- 自動更新: `.github/workflows/fetch-metrics-weekly.yml` (毎週日曜 JST 20:00)
