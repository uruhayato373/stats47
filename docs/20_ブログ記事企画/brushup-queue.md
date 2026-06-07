# ブログ改善優先度キュー

生成日: 2026-06-07 / GSC 参照週: 2026-W23 / ブログ記事数: 254 / 平均 CTR: 2.19%

**スコア** = CTR ギャップ（平均 - ページ）× log10(impressions + 1)

| 優先度 | slug | imp | CTR | 平均比 | score |
|---|---|---:|---:|---:|---:|
| 1 | dairy-cattle-hokkaido-monopoly | 457 | 0.22% | +1.97% | 0.052 |
| 2 | consumer-price-regional-gap | 242 | 0.00% | +2.19% | 0.052 |
| 3 | foreign-overnight-guests-prefecture-gap | 230 | 0.00% | +2.19% | 0.052 |
| 4 | fishery-catch-aquaculture-shift | 228 | 0.00% | +2.19% | 0.052 |
| 5 | health-life-expectancy-structure#%E5%81%A5%E5%BA%B7%E5%AF%BF%E5%91%BD%E3%83%A9%E3%83%B3%E3%82%AD%E3%83%B3%E3%82%B01%E4%BD%8D%E3%81%AF%E5%A4%A7%E5%88%86%E7%9C%8C47%E4%BD%8D%E3%81%AF%E5%B2%A9%E6%89%8B%E7%9C%8C | 175 | 0.00% | +2.19% | 0.049 |
| 6 | health-life-expectancy-structure#%E5%85%A8%E5%9B%BD%E3%83%9E%E3%83%83%E3%83%97 | 175 | 0.00% | +2.19% | 0.049 |
| 7 | manufacturing-aichi-dominance | 1,174 | 0.60% | +1.59% | 0.049 |
| 8 | child-height-regional-gap | 1,801 | 0.72% | +1.47% | 0.048 |
| 9 | health-life-expectancy-structure#%E5%8C%BB%E5%B8%AB%E6%95%B0%E3%81%AE%E6%8E%A8%E7%A7%BB47%E5%B9%B4%E3%81%A726%E5%80%8D | 132 | 0.00% | +2.19% | 0.046 |
| 10 | agriculture-hokkaido-dominance | 100 | 0.00% | +2.19% | 0.044 |
| 11 | park-green-space-gap | 385 | 0.52% | +1.67% | 0.043 |
| 12 | recycling-rate-gap | 81 | 0.00% | +2.19% | 0.042 |
| 13 | habitable-area-land-use | 572 | 0.70% | +1.49% | 0.041 |
| 14 | childcare-friendly-prefecture-ranking#%E4%B8%8A%E4%BD%8D10%E7%9C%8C | 72 | 0.00% | +2.19% | 0.041 |
| 15 | childcare-friendly-prefecture-ranking#%E4%B8%8B%E4%BD%8D10%E7%9C%8C | 72 | 0.00% | +2.19% | 0.041 |
| 16 | childcare-friendly-prefecture-ranking#%E8%A9%95%E4%BE%A1%E6%96%B9%E6%B3%957%E6%8C%87%E6%A8%99%E3%81%AE%E3%83%91%E3%83%BC%E3%82%BB%E3%83%B3%E3%82%BF%E3%82%A4%E3%83%AB%E5%B9%B3%E5%9D%87 | 72 | 0.00% | +2.19% | 0.041 |
| 17 | precipitation-snow-regional-gap | 207 | 0.48% | +1.71% | 0.040 |
| 18 | local-government-debt-burden#%E5%9C%B0%E6%96%B9%E5%82%B5%E7%8F%BE%E5%9C%A8%E9%AB%98%E5%89%B2%E5%90%88%E3%83%A9%E3%83%B3%E3%82%AD%E3%83%B3%E3%82%B02022%E5%B9%B4%E5%BA%A6 | 63 | 0.00% | +2.19% | 0.040 |
| 19 | habitable-area-land-use#%E5%8F%AF%E4%BD%8F%E5%9C%B0%E9%9D%A2%E7%A9%8D%E5%89%B2%E5%90%88%E3%83%A9%E3%83%B3%E3%82%AD%E3%83%B3%E3%82%B0 | 58 | 0.00% | +2.19% | 0.039 |
| 20 | pharmacy-count-prefecture-ranking | 57 | 0.00% | +2.19% | 0.039 |

## 次のステップ

```bash
# 上位記事から順に補強
/brushup-blog --target article dairy-cattle-hokkaido-monopoly
/brushup-blog --target article consumer-price-regional-gap
/brushup-blog --target article foreign-overnight-guests-prefecture-gap
```

## 注記

- CTR 0.00% = 計測週中クリックゼロ（検索表示はされている）
- スコア式: `(avg_ctr - page_ctr) × log10(impressions + 1)`
- 自動更新: `.github/workflows/fetch-metrics-weekly.yml` (毎週日曜 JST 20:00)
