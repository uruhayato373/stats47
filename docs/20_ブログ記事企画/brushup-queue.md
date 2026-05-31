# ブログ改善優先度キュー

生成日: 2026-05-31 / GSC 参照週: 2026-W22 / ブログ記事数: 202 / 平均 CTR: 2.49%

**スコア** = CTR ギャップ（平均 - ページ）× log10(impressions + 1)

| 優先度 | slug | imp | CTR | 平均比 | score |
|---|---|---:|---:|---:|---:|
| 1 | consumer-price-regional-gap | 207 | 0.00% | +2.49% | 0.058 |
| 2 | fishery-catch-aquaculture-shift | 196 | 0.00% | +2.49% | 0.057 |
| 3 | child-height-regional-gap | 2,061 | 0.78% | +1.71% | 0.057 |
| 4 | manufacturing-aichi-dominance | 1,067 | 0.66% | +1.83% | 0.056 |
| 5 | foreign-overnight-guests-prefecture-gap | 165 | 0.00% | +2.49% | 0.055 |
| 6 | precipitation-snow-regional-gap | 156 | 0.00% | +2.49% | 0.055 |
| 7 | overnight-guests-inbound-recovery | 315 | 0.32% | +2.17% | 0.054 |
| 8 | agriculture-hokkaido-dominance | 115 | 0.00% | +2.49% | 0.052 |
| 9 | habitable-area-land-use | 606 | 0.66% | +1.83% | 0.051 |
| 10 | health-life-expectancy-structure#%E5%81%A5%E5%BA%B7%E5%AF%BF%E5%91%BD%E3%83%A9%E3%83%B3%E3%82%AD%E3%83%B3%E3%82%B01%E4%BD%8D%E3%81%AF%E5%A4%A7%E5%88%86%E7%9C%8C47%E4%BD%8D%E3%81%AF%E5%B2%A9%E6%89%8B%E7%9C%8C | 104 | 0.00% | +2.49% | 0.050 |
| 11 | health-life-expectancy-structure#%E5%85%A8%E5%9B%BD%E3%83%9E%E3%83%83%E3%83%97 | 104 | 0.00% | +2.49% | 0.050 |
| 12 | health-life-expectancy-structure#%E5%81%A5%E5%BA%B7%E5%AF%BF%E5%91%BD%E3%81%AE%E6%8E%A8%E7%A7%BB9%E5%B9%B4%E3%81%A7%E7%94%B7%E6%80%A7226%E6%AD%B3%E3%81%97%E3%81%8B%E3%81%97%E4%B8%8D%E5%81%A5%E5%BA%B7%E6%9C%9F%E9%96%93%E3%81%AF%E7%B8%AE%E3%81%BE%E3%82%89%E3%81%AA%E3%81%84 | 103 | 0.00% | +2.49% | 0.050 |
| 13 | park-green-space-gap | 360 | 0.56% | +1.93% | 0.049 |
| 14 | health-life-expectancy-structure#%E5%8C%BB%E5%B8%AB%E6%95%B0%E3%81%AE%E6%8E%A8%E7%A7%BB47%E5%B9%B4%E3%81%A726%E5%80%8D | 81 | 0.00% | +2.49% | 0.048 |
| 15 | fertility-rate-prefecture-gap | 282 | 0.71% | +1.78% | 0.044 |
| 16 | aging-rate-akita-vs-okinawa | 50 | 0.00% | +2.49% | 0.043 |
| 17 | marriage-divorce-okinawa | 47 | 0.00% | +2.49% | 0.042 |
| 18 | alcohol-prefecture-map | 44 | 0.00% | +2.49% | 0.041 |
| 19 | brazilian-resident-population-prefecture-gap | 44 | 0.00% | +2.49% | 0.041 |
| 20 | temperature-extremes-map | 2,754 | 1.31% | +1.18% | 0.041 |

## 次のステップ

```bash
# 上位記事から順に補強
/brushup-blog --target article consumer-price-regional-gap
/brushup-blog --target article fishery-catch-aquaculture-shift
/brushup-blog --target article child-height-regional-gap
```

## 注記

- CTR 0.00% = 計測週中クリックゼロ（検索表示はされている）
- スコア式: `(avg_ctr - page_ctr) × log10(impressions + 1)`
- 自動更新: `.github/workflows/fetch-metrics-weekly.yml` (毎週日曜 JST 20:00)
