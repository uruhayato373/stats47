---
type: blog-quality-inventory
date: 2026-06-02
status: active
tool: .claude/scripts/blog/audit-published-blog.mjs
total_published: 251
with_blocker: 159
tags: [blog, quality, audit]
---

# 公開ブログ品質棚卸し (251 記事 / 2026-06-02)

R2 公開 URL から全公開記事を取得し `quality-gate.mjs` 相当の決定的チェックを適用した棚卸し。
**機械的フロア層のみ** (読者価値は blog-critic、最終評価は GSC)。再生成: `node .claude/scripts/blog/audit-published-blog.mjs`。

- blocker あり: **159** / warning のみ: 64 / clean: 28

## 違反種別 集計

| 違反 | 件数 |
|---|---|
| prose | 145 |
| callouts | 83 |
| ランキング表あり/チャート0 | 82 |
| internalLinks | 78 |
| 上下非対称ランキング表 | 51 |
| truncated | 49 |
| source-link | 49 |
| H2 | 10 |

## 週次是正ループ (まず仕組みを固定 → 週次で是正)

1. **棚卸し更新**: `node .claude/scripts/blog/audit-published-blog.mjs` を週次で実行し本ファイルを再生成。
2. **優先順位付け**: GSC impression 上位 × blocker 数で対象を選ぶ (`select-brushup-candidates.mjs` は GSC 主軸 + structure/chart audit を加味)。流入の多い blocker 記事から着手。
3. **是正**: `/brushup-blog --target article <slug>` で (a) ランキング表 → 上位5+下位5 SVG 化、(b) truncated/非対称表の除去、(c) callout/内部リンク補強、(d) 薄い prose の加筆。
4. **critic 必須**: 各記事 `blog-critic` の `review.md` (verdict: PASS) を取得してから公開 (gate が強制)。
5. **進捗**: 是正済み slug は本ファイル再生成で blocker から消える (= 進捗の客観指標)。

> 標準は `.claude/rules/blog-quality-standards.md`「ランキング可視化の標準」。新規記事は gate が今後の劣化を blocker で防ぐ (遡及はしない)。

## blocker あり記事 全 159 件 (blocker 数降順)

| slug | B | W | prose | svg | rankTbl | 主な指摘 |
|---|--|--|--|--|--|---|
| healthy-life-expectancy-male-female-gap | 5 | 1 | 1924 | 0 | 2 | truncated 表; callouts 0<2; internalLinks 0<3 |
| beef-consumption-quantity | 5 | 0 | 622 | 0 | 2 | internalLinks 1<3; H2 3<4; prose 622<1600 |
| chicken-consumption-quantity | 5 | 0 | 568 | 0 | 1 | internalLinks 1<3; H2 2<4; prose 568<1600 |
| natto-consumption-expenditure | 5 | 0 | 702 | 0 | 1 | internalLinks 1<3; H2 3<4; prose 702<1600 |
| udon-soba-food-culture-prefecture-map | 5 | 0 | 724 | 0 | 1 | internalLinks 2<3; H2 3<4; prose 724<1600 |
| beef-consumption-prefecture-gap | 4 | 1 | 2037 | 0 | 2 | truncated 表; internalLinks 2<3; ランキング表あり/チャート0 |
| carbonated-drink-spending-prefecture-gap | 4 | 1 | 2156 | 0 | 2 | truncated 表; internalLinks 1<3; ランキング表あり/チャート0 |
| carpenter-income-prefecture-gap | 4 | 1 | 2390 | 0 | 2 | truncated 表; internalLinks 2<3; ランキング表あり/チャート0 |
| curry-roux-consumption-gap | 4 | 1 | 1898 | 0 | 2 | truncated 表; internalLinks 1<3; ランキング表あり/チャート0 |
| doctor-income-prefecture-gap | 4 | 1 | 2215 | 0 | 2 | truncated 表; internalLinks 2<3; ランキング表あり/チャート0 |
| frozen-gyoza-spending-prefecture-gap | 4 | 1 | 2060 | 0 | 2 | truncated 表; internalLinks 1<3; ランキング表あり/チャート0 |
| pachinko-participation-prefecture-gap | 4 | 1 | 2183 | 0 | 2 | truncated 表; internalLinks 1<3; ランキング表あり/チャート0 |
| pharmacist-income-prefecture-gap | 4 | 1 | 1943 | 0 | 2 | truncated 表; internalLinks 2<3; ランキング表あり/チャート0 |
| professor-income-prefecture-gap | 4 | 1 | 2313 | 0 | 2 | truncated 表; internalLinks 2<3; ランキング表あり/チャート0 |
| smartphone-ownership-prefecture-gap | 4 | 1 | 2374 | 0 | 2 | truncated 表; internalLinks 1<3; ランキング表あり/チャート0 |
| solar-panel-housing-prefecture-gap | 4 | 1 | 2180 | 0 | 2 | truncated 表; internalLinks 1<3; ランキング表あり/チャート0 |
| strawberry-consumption-prefecture-gap | 4 | 1 | 1934 | 0 | 3 | truncated 表; internalLinks 1<3; ランキング表あり/チャート0 |
| system-consultant-income-prefecture-gap | 4 | 1 | 2310 | 0 | 2 | truncated 表; internalLinks 1<3; ランキング表あり/チャート0 |
| tofu-consumption-prefecture-gap | 4 | 1 | 2331 | 0 | 2 | truncated 表; internalLinks 1<3; ランキング表あり/チャート0 |
| yogurt-spending-prefecture-gap | 4 | 1 | 1895 | 0 | 2 | truncated 表; internalLinks 2<3; ランキング表あり/チャート0 |
| abortion-rate-prefecture-gap | 4 | 0 | 1146 | 0 | 2 | callouts 0<2; internalLinks 0<3; prose 1146<1600 |
| coffee-consumption-prefecture-gap | 4 | 0 | 2658 | 0 | 2 | truncated 表; internalLinks 1<3; ランキング表あり/チャート0 |
| disaster-damage-per-person-prefecture-gap | 4 | 0 | 1482 | 0 | 2 | callouts 0<2; internalLinks 0<3; prose 1482<1600 |
| dog-registration-prefecture-gap | 4 | 0 | 2648 | 0 | 2 | truncated 表; internalLinks 1<3; ランキング表あり/チャート0 |
| elementary-school-children-count | 4 | 0 | 721 | 0 | 1 | H2 2<4; prose 721<1600; ランキング表あり/チャート0 |
| female-lecture-prefecture-gap | 4 | 0 | 1599 | 0 | 2 | callouts 0<2; internalLinks 0<3; prose 1599<1600 |
| general-hospital-bed-occupancy-rate | 4 | 0 | 865 | 0 | 1 | H2 3<4; prose 865<1600; ランキング表あり/チャート0 |
| golf-participation-prefecture-gap | 4 | 0 | 2522 | 0 | 2 | truncated 表; internalLinks 2<3; ランキング表あり/チャート0 |
| instant-noodles-consumption-prefecture-gap | 4 | 0 | 2473 | 0 | 2 | truncated 表; internalLinks 2<3; ランキング表あり/チャート0 |
| library-books-prefecture-gap | 4 | 0 | 1362 | 0 | 2 | callouts 0<2; internalLinks 0<3; prose 1362<1600 |
| mayonnaise-consumption-expenditure | 4 | 0 | 690 | 0 | 1 | internalLinks 1<3; H2 3<4; prose 690<1600 |
| mochi-consumption-prefecture-gap | 4 | 0 | 2472 | 0 | 2 | truncated 表; internalLinks 2<3; ランキング表あり/チャート0 |
| musical-instrument-expenditure-prefecture-gap | 4 | 0 | 1578 | 0 | 2 | callouts 0<2; internalLinks 0<3; prose 1578<1600 |
| oyster-consumption-prefecture-gap | 4 | 0 | 2471 | 0 | 2 | truncated 表; internalLinks 2<3; ランキング表あり/チャート0 |
| public-phone-count-gap | 4 | 0 | 461 | 0 | 1 | internalLinks 2<3; H2 3<4; prose 461<1600 |
| public-phone-prefecture-vanishing | 4 | 0 | 3035 | 0 | 1 | truncated 表; internalLinks 2<3; ランキング表あり/チャート0 |
| roadside-station-prefecture-gap | 4 | 0 | 1230 | 0 | 2 | callouts 0<2; internalLinks 0<3; prose 1230<1600 |
| sake-consumption-prefecture-gap | 4 | 0 | 1445 | 0 | 2 | callouts 0<2; internalLinks 0<3; prose 1445<1600 |
| self-financing-ratio-prefecture-gap | 4 | 0 | 1382 | 0 | 2 | callouts 0<2; internalLinks 0<3; prose 1382<1600 |
| shochu-consumption-prefecture-gap | 4 | 0 | 1548 | 0 | 2 | callouts 0<2; internalLinks 0<3; prose 1548<1600 |
| wheat-flour-consumption-food-culture-gap | 4 | 0 | 513 | 0 | 1 | internalLinks 2<3; H2 3<4; prose 513<1600 |
| wheat-flour-expenditure-vs-quantity | 4 | 0 | 637 | 0 | 1 | internalLinks 1<3; H2 3<4; prose 637<1600 |
| yakiniku-spending-prefecture-gap | 4 | 0 | 2554 | 0 | 2 | truncated 表; internalLinks 1<3; ランキング表あり/チャート0 |
| price-index-high-low-prefecture | 3 | 2 | 2095 | 0 | 1 | truncated 表; ランキング表あり/チャート0; 上下非対称ランキング表 |
| car-ownership-household-prefecture-gap | 3 | 1 | 2385 | 0 | 2 | truncated 表; ランキング表あり/チャート0; 上下非対称ランキング表 |
| chicken-consumption-prefecture-gap | 3 | 1 | 1622 | 0 | 2 | callouts 0<2; internalLinks 0<3; ランキング表あり/チャート0 |
| consumer-price-regional-gap | 3 | 1 | 2345 | 0 | 2 | truncated 表; ランキング表あり/チャート0; 上下非対称ランキング表 |
| dentist-income-prefecture-gap | 3 | 1 | 2137 | 0 | 2 | truncated 表; internalLinks 1<3; ランキング表あり/チャート0 |
| fresh-udon-soba-consumption-prefecture-gap | 3 | 1 | 1672 | 0 | 2 | callouts 0<2; internalLinks 0<3; ランキング表あり/チャート0 |
| future-burden-ratio-extreme-gap | 3 | 1 | 2207 | 0 | 2 | callouts 0<2; internalLinks 0<3; ランキング表あり/チャート0 |
| inflow-population-ratio-prefecture-gap | 3 | 1 | 1625 | 0 | 2 | callouts 0<2; internalLinks 0<3; ランキング表あり/チャート0 |
| inpatient-rate-prefecture-gap | 3 | 1 | 1680 | 0 | 2 | callouts 0<2; internalLinks 0<3; ランキング表あり/チャート0 |
| local-debt-current-ratio-prefecture-gap | 3 | 1 | 1665 | 0 | 2 | callouts 0<2; internalLinks 0<3; ランキング表あり/チャート0 |
| low-birthweight-rate-prefecture-gap | 3 | 1 | 1660 | 0 | 2 | callouts 0<2; internalLinks 0<3; ランキング表あり/チャート0 |
| minimum-wage-increase-rate-prefecture-gap | 3 | 1 | 1664 | 0 | 2 | callouts 0<2; internalLinks 0<3; ランキング表あり/チャート0 |
| outpatient-rate-prefecture-gap | 3 | 1 | 1640 | 0 | 2 | callouts 0<2; internalLinks 0<3; ランキング表あり/チャート0 |
| park-green-space-gap | 3 | 1 | 2464 | 0 | 3 | truncated 表; ランキング表あり/チャート0; 上下非対称ランキング表 |
| passport-issuance-prefecture-gap | 3 | 1 | 2312 | 0 | 2 | truncated 表; ランキング表あり/チャート0; 上下非対称ランキング表 |
| train-commuters-prefecture-gap | 3 | 1 | 1682 | 0 | 2 | callouts 0<2; internalLinks 0<3; ランキング表あり/チャート0 |
| whisky-consumption-prefecture-gap | 3 | 1 | 1669 | 0 | 2 | callouts 0<2; internalLinks 0<3; ランキング表あり/チャート0 |
| cc-estat-02-search-skill | 3 | 0 | 5591 | 0 | 0 | truncated 表; callouts 0<2; internalLinks 0<3 |
| kei-car-density-prefecture-gap | 3 | 0 | 2502 | 0 | 2 | truncated 表; ランキング表あり/チャート0; 上下非対称ランキング表 |
| piano-ownership-prefecture-gap | 3 | 0 | 2548 | 0 | 2 | truncated 表; ランキング表あり/チャート0; 上下非対称ランキング表 |
| temperature-extremes-map | 2 | 2 | 2133 | 0 | 3 | truncated 表; ランキング表あり/チャート0 |
| aging-rate-akita-vs-okinawa | 2 | 1 | 2244 | 0 | 1 | ランキング表あり/チャート0; 上下非対称ランキング表 |
| assembly-answer-chatgpt-5steps | 2 | 1 | 1786 | 0 | 0 | callouts 0<2; internalLinks 0<3 |
| convenience-store-density-map | 2 | 1 | 1594 | 4 | 0 | callouts 1<2; prose 1594<1600 |
| dairy-cattle-hokkaido-monopoly | 2 | 1 | 1976 | 1 | 2 | truncated 表; 上下非対称ランキング表 |
| expenditure-structure-comparison | 2 | 1 | 2583 | 3 | 1 | truncated 表; 上下非対称ランキング表 |
| extreme-heat-days-prefecture | 2 | 1 | 2379 | 0 | 1 | callouts 0<2; ランキング表あり/チャート0 |
| governor-election-turnout-prefecture-gap | 2 | 1 | 2291 | 0 | 2 | internalLinks 1<3; ランキング表あり/チャート0 |
| police-officer-density-vs-crime-gap | 2 | 1 | 3078 | 3 | 4 | truncated 表; 上下非対称ランキング表 |
| population-migration-tokyo-concentration | 2 | 1 | 2228 | 4 | 1 | truncated 表; 上下非対称ランキング表 |
| prefectural-height-male-female-gap | 2 | 1 | 1928 | 0 | 2 | ランキング表あり/チャート0; 上下非対称ランキング表 |
| sports-urban-paradox | 2 | 1 | 2436 | 4 | 2 | truncated 表; 上下非対称ランキング表 |
| taxi-driver-income-prefecture-gap | 2 | 1 | 2394 | 0 | 2 | internalLinks 1<3; ランキング表あり/チャート0 |
| university-advancement-capacity | 2 | 1 | 2645 | 4 | 1 | truncated 表; 上下非対称ランキング表 |
| wheat-flour-consumption-prefecture | 2 | 1 | 2184 | 0 | 1 | callouts 0<2; ランキング表あり/チャート0 |
| agriculture-hokkaido-dominance | 2 | 0 | 3004 | 5 | 1 | truncated 表; 上下非対称ランキング表 |
| ai-claude-code-pref-analysis | 2 | 0 | 5006 | 0 | 0 | callouts 0<2; internalLinks 0<3 |
| bank-deposit-balance-shikoku-anomaly | 2 | 0 | 2799 | 1 | 2 | truncated 表; 上下非対称ランキング表 |
| bonito-catch-zero-prefectures-gap | 2 | 0 | 2411 | 0 | 0 | callouts 0<2; internalLinks 0<3 |
| cc-estat-01-setup | 2 | 0 | 4490 | 0 | 0 | callouts 0<2; internalLinks 0<3 |
| cc-estat-04-aging-heatmap | 2 | 0 | 5102 | 0 | 0 | callouts 0<2; internalLinks 0<3 |
| cc-estat-05-medical-cost-choropleth | 2 | 0 | 6001 | 0 | 0 | callouts 0<2; internalLinks 2<3 |
| cc-estat-06-income-scatter | 2 | 0 | 5948 | 2 | 0 | callouts 0<2; internalLinks 0<3 |
| cc-estat-08-bar-chart-race | 2 | 0 | 5861 | 0 | 0 | callouts 0<2; internalLinks 0<3 |
| cc-estat-09-radar-prefecture | 2 | 0 | 5050 | 4 | 0 | callouts 0<2; internalLinks 0<3 |
| cc-estat-11-tourism-stacked | 2 | 0 | 6256 | 0 | 0 | callouts 0<2; internalLinks 0<3 |
| cc-estat-13-agri-sankey | 2 | 0 | 5221 | 0 | 0 | callouts 0<2; internalLinks 0<3 |
| cc-estat-14-energy-area-chart | 2 | 0 | 6508 | 0 | 0 | callouts 0<2; internalLinks 0<3 |
| cc-estat-16-commerce-bubble | 2 | 0 | 5326 | 2 | 0 | callouts 0<2; internalLinks 0<3 |
| cc-estat-17-edu-slope-graph | 2 | 0 | 6232 | 2 | 1 | callouts 0<2; internalLinks 0<3 |
| cc-estat-19-skill-pipeline | 2 | 0 | 6028 | 0 | 0 | callouts 0<2; internalLinks 0<3 |
| cc-estat-20-publish | 2 | 0 | 8555 | 0 | 0 | callouts 0<2; internalLinks 0<3 |
| depopulation-area-medical-facilities | 2 | 0 | 2974 | 0 | 0 | callouts 1<2; internalLinks 0<3 |
| dual-income-reversal | 2 | 0 | 1363 | 5 | 0 | callouts 1<2; prose 1363<1600 |
| electricity-bill-hike-impact | 2 | 0 | 1438 | 0 | 0 | callouts 0<2; prose 1438<1600 |
| estat-7-techniques-from-unusable-to-usable | 2 | 0 | 2672 | 0 | 0 | callouts 0<2; internalLinks 0<3 |
| foreign-population-growth-rate | 2 | 0 | 1240 | 5 | 0 | callouts 1<2; prose 1240<1600 |
| highway-japan-58years | 2 | 0 | 1466 | 0 | 1 | prose 1466<1600; ランキング表あり/チャート0 |
| household-structure-transformation | 2 | 0 | 2897 | 5 | 1 | truncated 表; 上下非対称ランキング表 |
| inbound-by-nationality-regional-preference | 2 | 0 | 1582 | 6 | 0 | callouts 1<2; prose 1582<1600 |
| inbound-overnight-stay-concentration | 2 | 0 | 1447 | 5 | 0 | callouts 1<2; prose 1447<1600 |
| inpatient-rate-aging-burden | 2 | 0 | 3170 | 0 | 1 | truncated 表; ランキング表あり/チャート0 |
| koumuin-claude-code-estat-automation | 2 | 0 | 4621 | 0 | 0 | callouts 0<2; internalLinks 0<3 |
| manufacturing-labor-productivity-pref | 2 | 0 | 2722 | 2 | 1 | truncated 表; 上下非対称ランキング表 |
| manufacturing-shipment-prefecture-ranking | 2 | 0 | 2583 | 3 | 2 | truncated 表; 上下非対称ランキング表 |
| mineral-water-spending-prefecture-gap | 2 | 0 | 2471 | 0 | 2 | internalLinks 2<3; ランキング表あり/チャート0 |
| minimum-wage-1000yen-prefecture | 2 | 0 | 3320 | 2 | 2 | truncated 表; 上下非対称ランキング表 |
| rice-harvest-volume-prefecture-gap | 2 | 0 | 2957 | 0 | 4 | internalLinks 0<3; ランキング表あり/チャート0 |
| ryokan-vs-hotel-overnight-shift | 2 | 0 | 1439 | 6 | 0 | callouts 0<2; prose 1439<1600 |
| sports-facility-regional-divide | 2 | 0 | 1457 | 6 | 0 | callouts 0<2; prose 1457<1600 |
| sunshine-solar-housing-correlation | 2 | 0 | 2735 | 0 | 0 | callouts 1<2; internalLinks 0<3 |
| urban-parks-green-infrastructure | 2 | 0 | 1577 | 5 | 0 | callouts 0<2; prose 1577<1600 |
| waiting-children-progress | 2 | 0 | 1295 | 5 | 0 | callouts 1<2; prose 1295<1600 |
| crime-rate-regional-gap | 1 | 2 | 1855 | 7 | 0 | callouts 1<2 |
| education-cost-per-child | 1 | 2 | 2192 | 4 | 1 | truncated 表 |
| farmland-crisis-abandoned-land | 1 | 2 | 2243 | 6 | 0 | callouts 1<2 |
| firefighting-capacity-gap | 1 | 2 | 1916 | 6 | 0 | callouts 1<2 |
| hospital-bed-utilization-map | 1 | 2 | 2217 | 4 | 0 | callouts 1<2 |
| noodle-consumption-prefecture-character | 1 | 2 | 2024 | 5 | 0 | callouts 1<2 |
| prefectural-debt-future-burden | 1 | 2 | 1879 | 3 | 0 | callouts 1<2 |
| suicide-rate-aging-nexus | 1 | 2 | 2329 | 5 | 1 | truncated 表 |
| unemployment-tertiary-industry-link | 1 | 2 | 2097 | 0 | 2 | ランキング表あり/チャート0 |
| automotive-industry-transformation-map | 1 | 1 | 2389 | 6 | 0 | callouts 1<2 |
| brazilian-resident-population-prefecture-gap | 1 | 1 | 2353 | 0 | 2 | ランキング表あり/チャート0 |
| electricity-demand-gap | 1 | 1 | 1785 | 5 | 0 | callouts 1<2 |
| energy-infrastructure-gas-electricity | 1 | 1 | 2016 | 6 | 0 | callouts 1<2 |
| foreign-overnight-guests-prefecture-gap | 1 | 1 | 2329 | 0 | 2 | ランキング表あり/チャート0 |
| gasoline-car-society-map | 1 | 1 | 1827 | 5 | 0 | callouts 1<2 |
| ict-media-consumption-gender-gap | 1 | 1 | 1682 | 5 | 0 | callouts 1<2 |
| inbound-overnight-regional-gap | 1 | 1 | 1685 | 6 | 0 | callouts 1<2 |
| library-museum-cultural-capital | 1 | 1 | 1837 | 6 | 0 | callouts 1<2 |
| marriage-divorce-okinawa | 1 | 1 | 3356 | 0 | 1 | ランキング表あり/チャート0 |
| pharma-medical-device-production-map | 1 | 1 | 2341 | 6 | 0 | callouts 1<2 |
| road-infrastructure-density | 1 | 1 | 1669 | 5 | 0 | callouts 1<2 |
| small-business-dominance-map | 1 | 1 | 2533 | 6 | 0 | callouts 1<2 |
| sugar-consumption-prefecture-gap | 1 | 1 | 2116 | 0 | 2 | ランキング表あり/チャート0 |
| traffic-accident-deaths-regional-risk | 1 | 1 | 3724 | 8 | 0 | callouts 1<2 |
| waste-management-recycling-gap | 1 | 1 | 1734 | 5 | 0 | callouts 0<2 |
| water-infrastructure-crisis | 1 | 1 | 2056 | 6 | 0 | callouts 1<2 |
| cc-estat-03-population-bar | 1 | 0 | 4954 | 10 | 1 | callouts 0<2 |
| cc-estat-07-birthrate-line | 1 | 0 | 5785 | 0 | 0 | callouts 0<2 |
| cc-estat-10-wage-box-plot | 1 | 0 | 4731 | 1 | 0 | callouts 0<2 |
| cc-estat-12-housing-treemap | 1 | 0 | 5764 | 5 | 0 | callouts 0<2 |
| cc-estat-15-crime-small-multiple | 1 | 0 | 5867 | 15 | 0 | callouts 0<2 |
| cc-estat-18-cache-r2 | 1 | 0 | 8457 | 0 | 0 | callouts 0<2 |
| education-expenses-gap | 1 | 0 | 1362 | 4 | 0 | prose 1362<1600 |
| food-trio-prefecture-map | 1 | 0 | 2828 | 0 | 1 | ランキング表あり/チャート0 |
| international-cooperation-volunteer-map | 1 | 0 | 1544 | 5 | 0 | prose 1544<1600 |
| konbu-consumption-prefecture-gap | 1 | 0 | 2436 | 0 | 2 | ランキング表あり/チャート0 |
| middle-school-height-east-west-puzzle | 1 | 0 | 3040 | 0 | 2 | ランキング表あり/チャート0 |
| nursing-care-shortage-2040 | 1 | 0 | 2898 | 7 | 0 | callouts 0<2 |
| overseas-travel-gap | 1 | 0 | 1406 | 5 | 0 | prose 1406<1600 |
| population-density-urbanization | 1 | 0 | 3495 | 0 | 1 | ランキング表あり/チャート0 |
| safe-driving-5-features | 1 | 0 | 3364 | 10 | 0 | callouts 0<2 |
| semiconductor-electronics-regional-map | 1 | 0 | 3072 | 6 | 0 | callouts 1<2 |
| vacant-house-crisis | 1 | 0 | 3389 | 8 | 0 | callouts 1<2 |
