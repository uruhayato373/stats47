# ページ品質監査 Latest — 2026-09-26

- モード: full / 対象 6468 URL / commit c180120e398f43c3bd5340351fc624a12f22e9c7
- 違反: **error 3179 / warning 4624**

## テンプレート別集計

| テンプレート | URL数 | error | warning |
|---|---|---|---|
| home | 1 | 1 | 1 |
| ranking | 2409 | 888 | 2879 |
| prefecture-list | 1 | 0 | 1 |
| theme | 56 | 33 | 34 |
| geo-analysis | 71 | 57 | 13 |
| other | 307 | 3 | 50 |
| prefecture-detail | 2491 | 1521 | 1313 |
| blog | 1 | 1 | 1 |
| blog-article | 605 | 605 | 225 |
| category | 17 | 12 | 12 |
| survey | 148 | 58 | 92 |
| municipality | 361 | 0 | 3 |

## 違反の詳細

上位 100 件 (error を先に) / 全 7803 件。全件は R2 `state/page-quality/latest.json` (`npm run state:pull -- page-quality`)。

| URL | metric | 実測 | 前回 | 閾値 | 種別 |
|---|---|---|---|---|---|
| `/` | duplicate_link_ratio (absolute) | 0.4134 | - | <= 0.3 | 🚨 |
| `/ranking` | duplicate_link_ratio (absolute) | 0.3141 | - | <= 0.3 | 🚨 |
| `/geo` | html_bytes (delta_pct) | 1428.9 | 120676 | <= 30 | 🚨 |
| `/geo` | rsc_bytes (delta_pct) | 1416.9 | 60372 | <= 30 | 🚨 |
| `/geo` | dom_nodes (delta_pct) | 335.6 | 441 | <= 30 | 🚨 |
| `/geo` | duplicate_link_ratio (absolute) | 0.3404 | - | <= 0.3 | 🚨 |
| `/geo/layers` | duplicate_link_ratio (absolute) | 0.3393 | - | <= 0.3 | 🚨 |
| `/geo/layers/residential-land-price` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/layers/station-points` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/G04-a` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/L01` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/L02` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/L03-a` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/W09` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A16` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A17` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A22` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A31b` | duplicate_link_ratio (absolute) | 0.4766 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A38` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/N03` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/P04` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/P05` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/P11` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/P29` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/P36` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/C28` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/N02` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/N07` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/S12` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/mesh1000r6` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A03` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A09` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A18` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A19` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A23` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A24` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A25` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A30a5` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A31a` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A42` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A43` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A44` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A45` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A51` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A52` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A53` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A54` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A55` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/G04-c` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/G04-d` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/G08` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/L03-b` | duplicate_link_ratio (absolute) | 0.4688 | - | <= 0.3 | 🚨 |
| `/geo/datasets/L03-b-c` | duplicate_link_ratio (absolute) | 0.4688 | - | <= 0.3 | 🚨 |
| `/geo/datasets/L03-b-u` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/N08` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/S05-d` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/S10a` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/m250r6` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/geo/datasets/m500r6` | duplicate_link_ratio (absolute) | 0.4724 | - | <= 0.3 | 🚨 |
| `/themes/population-dynamics` | duplicate_link_ratio (absolute) | 0.4922 | - | <= 0.3 | 🚨 |
| `/themes/aging-society` | duplicate_link_ratio (absolute) | 0.3723 | - | <= 0.3 | 🚨 |
| `/themes/living-housing` | duplicate_link_ratio (absolute) | 0.529 | - | <= 0.3 | 🚨 |
| `/themes/local-economy` | duplicate_link_ratio (absolute) | 0.3922 | - | <= 0.3 | 🚨 |
| `/themes/labor-wages` | duplicate_link_ratio (absolute) | 0.3556 | - | <= 0.3 | 🚨 |
| `/themes/manufacturing` | duplicate_link_ratio (absolute) | 0.3436 | - | <= 0.3 | 🚨 |
| `/themes/healthcare` | duplicate_link_ratio (absolute) | 0.553 | - | <= 0.3 | 🚨 |
| `/themes/safety` | duplicate_link_ratio (absolute) | 0.5128 | - | <= 0.3 | 🚨 |
| `/themes/education-culture` | duplicate_link_ratio (absolute) | 0.4836 | - | <= 0.3 | 🚨 |
| `/themes/tourism` | duplicate_link_ratio (absolute) | 0.3846 | - | <= 0.3 | 🚨 |
| `/themes/consumer-prices` | duplicate_link_ratio (absolute) | 0.358 | - | <= 0.3 | 🚨 |
| `/themes/occupation-salary` | duplicate_link_ratio (absolute) | 0.3756 | - | <= 0.3 | 🚨 |
| `/themes/real-income` | duplicate_link_ratio (absolute) | 0.3892 | - | <= 0.3 | 🚨 |
| `/themes/labor-mobility` | duplicate_link_ratio (absolute) | 0.4519 | - | <= 0.3 | 🚨 |
| `/themes/local-finance` | duplicate_link_ratio (absolute) | 0.3665 | - | <= 0.3 | 🚨 |
| `/themes/fishery-marine` | duplicate_link_ratio (absolute) | 0.3459 | - | <= 0.3 | 🚨 |
| `/themes/roads` | duplicate_link_ratio (absolute) | 0.3587 | - | <= 0.3 | 🚨 |
| `/themes/climate` | duplicate_link_ratio (absolute) | 0.3103 | - | <= 0.3 | 🚨 |
| `/themes/construction-industry` | duplicate_link_ratio (absolute) | 0.3774 | - | <= 0.3 | 🚨 |
| `/themes/agriculture-production` | duplicate_link_ratio (absolute) | 0.3677 | - | <= 0.3 | 🚨 |
| `/themes/forestry-timber` | duplicate_link_ratio (absolute) | 0.4181 | - | <= 0.3 | 🚨 |
| `/themes/local-services` | duplicate_link_ratio (absolute) | 0.419 | - | <= 0.3 | 🚨 |
| `/themes/business-demography` | duplicate_link_ratio (absolute) | 0.3261 | - | <= 0.3 | 🚨 |
| `/themes/single-parent-households` | duplicate_link_ratio (absolute) | 0.3099 | - | <= 0.3 | 🚨 |
| `/themes/health-checkups` | duplicate_link_ratio (absolute) | 0.3377 | - | <= 0.3 | 🚨 |
| `/themes/daily-time-use` | duplicate_link_ratio (absolute) | 0.3158 | - | <= 0.3 | 🚨 |
| `/themes/water-services` | duplicate_link_ratio (absolute) | 0.3357 | - | <= 0.3 | 🚨 |
| `/themes/regional-energy` | duplicate_link_ratio (absolute) | 0.4286 | - | <= 0.3 | 🚨 |
| `/themes/environmental-quality` | duplicate_link_ratio (absolute) | 0.4364 | - | <= 0.3 | 🚨 |
| `/themes/cultural-participation` | duplicate_link_ratio (absolute) | 0.3517 | - | <= 0.3 | 🚨 |
| `/themes/sports-participation` | duplicate_link_ratio (absolute) | 0.3832 | - | <= 0.3 | 🚨 |
| `/themes/local-government-digital` | duplicate_link_ratio (absolute) | 0.3077 | - | <= 0.3 | 🚨 |
| `/themes/gender-participation` | duplicate_link_ratio (absolute) | 0.3165 | - | <= 0.3 | 🚨 |
| `/areas/01000/population-dynamics` | duplicate_link_ratio (absolute) | 0.496 | - | <= 0.3 | 🚨 |
| `/areas/01000/aging-society` | duplicate_link_ratio (absolute) | 0.3736 | - | <= 0.3 | 🚨 |
| `/areas/01000/living-housing` | duplicate_link_ratio (absolute) | 0.5331 | - | <= 0.3 | 🚨 |
| `/areas/01000/local-economy` | duplicate_link_ratio (absolute) | 0.3939 | - | <= 0.3 | 🚨 |
| `/areas/01000/labor-wages` | duplicate_link_ratio (absolute) | 0.3563 | - | <= 0.3 | 🚨 |
| `/areas/01000/manufacturing` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/01000/healthcare` | duplicate_link_ratio (absolute) | 0.5569 | - | <= 0.3 | 🚨 |
| `/areas/01000/safety` | duplicate_link_ratio (absolute) | 0.5163 | - | <= 0.3 | 🚨 |

## 代表URLのスクショ (先週比の変化)

| テンプレート | 端末 | 先週比 | スクショ |
|---|---|---|---|
| home | mobile-390 | 16% | [home-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/home-mobile-390.webp) |
| home | sm-640 | 19% | [home-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/home-sm-640.png) |
| home | tablet-768 | 13% | [home-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/home-tablet-768.webp) |
| home | rail-992 | 11% | [home-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/home-rail-992.png) |
| home | laptop-1024 | 10% | [home-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/home-laptop-1024.png) |
| home | desktop-1440 | 11% | [home-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/home-desktop-1440.webp) |
| home | wide-1920 | 9% | [home-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/home-wide-1920.png) |
| ranking | mobile-390 | 比較元なし | [ranking--index-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/ranking--index-mobile-390.webp) |
| ranking | sm-640 | 比較元なし | [ranking--index-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--index-sm-640.png) |
| ranking | tablet-768 | 比較元なし | [ranking--index-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/ranking--index-tablet-768.webp) |
| ranking | rail-992 | 比較元なし | [ranking--index-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--index-rail-992.png) |
| ranking | laptop-1024 | 比較元なし | [ranking--index-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--index-laptop-1024.png) |
| ranking | desktop-1440 | 比較元なし | [ranking--index-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/ranking--index-desktop-1440.webp) |
| ranking | wide-1920 | 比較元なし | [ranking--index-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--index-wide-1920.png) |
| prefecture-list | mobile-390 | 3% | [prefecture-list-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/prefecture-list-mobile-390.webp) |
| prefecture-list | sm-640 | 3% | [prefecture-list-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-list-sm-640.png) |
| prefecture-list | tablet-768 | 3% | [prefecture-list-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/prefecture-list-tablet-768.webp) |
| prefecture-list | rail-992 | 3% | [prefecture-list-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-list-rail-992.png) |
| prefecture-list | laptop-1024 | 3% | [prefecture-list-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-list-laptop-1024.png) |
| prefecture-list | desktop-1440 | 3% | [prefecture-list-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/prefecture-list-desktop-1440.webp) |
| prefecture-list | wide-1920 | 3% | [prefecture-list-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-list-wide-1920.png) |
| theme | mobile-390 | 比較元なし | [theme--index-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/theme--index-mobile-390.webp) |
| theme | sm-640 | 比較元なし | [theme--index-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--index-sm-640.png) |
| theme | tablet-768 | 比較元なし | [theme--index-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/theme--index-tablet-768.webp) |
| theme | rail-992 | 比較元なし | [theme--index-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--index-rail-992.png) |
| theme | laptop-1024 | 比較元なし | [theme--index-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--index-laptop-1024.png) |
| theme | desktop-1440 | 比較元なし | [theme--index-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/theme--index-desktop-1440.webp) |
| theme | wide-1920 | 比較元なし | [theme--index-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--index-wide-1920.png) |
| geo-analysis | mobile-390 | 2% | [geo-analysis-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/geo-analysis-mobile-390.webp) |
| geo-analysis | sm-640 | 2% | [geo-analysis-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis-sm-640.png) |
| geo-analysis | tablet-768 | 3% | [geo-analysis-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/geo-analysis-tablet-768.webp) |
| geo-analysis | rail-992 | 3% | [geo-analysis-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis-rail-992.png) |
| geo-analysis | laptop-1024 | 3% | [geo-analysis-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis-laptop-1024.png) |
| geo-analysis | desktop-1440 | 3% | [geo-analysis-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/geo-analysis-desktop-1440.webp) |
| geo-analysis | wide-1920 | 3% | [geo-analysis-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis-wide-1920.png) |
| geo-analysis | mobile-390 | 比較元なし | [geo-analysis--compare-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/geo-analysis--compare-mobile-390.webp) |
| geo-analysis | sm-640 | 比較元なし | [geo-analysis--compare-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--compare-sm-640.png) |
| geo-analysis | tablet-768 | 比較元なし | [geo-analysis--compare-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/geo-analysis--compare-tablet-768.webp) |
| geo-analysis | rail-992 | 比較元なし | [geo-analysis--compare-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--compare-rail-992.png) |
| geo-analysis | laptop-1024 | 比較元なし | [geo-analysis--compare-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--compare-laptop-1024.png) |
| geo-analysis | desktop-1440 | 比較元なし | [geo-analysis--compare-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/geo-analysis--compare-desktop-1440.webp) |
| geo-analysis | wide-1920 | 比較元なし | [geo-analysis--compare-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--compare-wide-1920.png) |
| geo-analysis | mobile-390 | 比較元なし | [geo-analysis--layer-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/geo-analysis--layer-mobile-390.webp) |
| geo-analysis | sm-640 | 比較元なし | [geo-analysis--layer-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--layer-sm-640.png) |
| geo-analysis | tablet-768 | 比較元なし | [geo-analysis--layer-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/geo-analysis--layer-tablet-768.webp) |
| geo-analysis | rail-992 | 比較元なし | [geo-analysis--layer-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--layer-rail-992.png) |
| geo-analysis | laptop-1024 | 比較元なし | [geo-analysis--layer-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--layer-laptop-1024.png) |
| geo-analysis | desktop-1440 | 比較元なし | [geo-analysis--layer-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/geo-analysis--layer-desktop-1440.webp) |
| geo-analysis | wide-1920 | 比較元なし | [geo-analysis--layer-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--layer-wide-1920.png) |
| geo-analysis | mobile-390 | 比較元なし | [geo-analysis--analysis-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/geo-analysis--analysis-mobile-390.webp) |
| geo-analysis | sm-640 | 比較元なし | [geo-analysis--analysis-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-sm-640.png) |
| geo-analysis | tablet-768 | 比較元なし | [geo-analysis--analysis-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/geo-analysis--analysis-tablet-768.webp) |
| geo-analysis | rail-992 | 比較元なし | [geo-analysis--analysis-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-rail-992.png) |
| geo-analysis | laptop-1024 | 比較元なし | [geo-analysis--analysis-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-laptop-1024.png) |
| geo-analysis | desktop-1440 | 比較元なし | [geo-analysis--analysis-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/geo-analysis--analysis-desktop-1440.webp) |
| geo-analysis | wide-1920 | 比較元なし | [geo-analysis--analysis-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-wide-1920.png) |
| geo-analysis | mobile-390 | 比較元なし | [geo-analysis--analysis-pref-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/geo-analysis--analysis-pref-mobile-390.webp) |
| geo-analysis | sm-640 | 比較元なし | [geo-analysis--analysis-pref-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-pref-sm-640.png) |
| geo-analysis | tablet-768 | 比較元なし | [geo-analysis--analysis-pref-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/geo-analysis--analysis-pref-tablet-768.webp) |
| geo-analysis | rail-992 | 比較元なし | [geo-analysis--analysis-pref-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-pref-rail-992.png) |
| geo-analysis | laptop-1024 | 比較元なし | [geo-analysis--analysis-pref-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-pref-laptop-1024.png) |
| geo-analysis | desktop-1440 | 比較元なし | [geo-analysis--analysis-pref-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/geo-analysis--analysis-pref-desktop-1440.webp) |
| geo-analysis | wide-1920 | 比較元なし | [geo-analysis--analysis-pref-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-pref-wide-1920.png) |
| geo-analysis | mobile-390 | 比較元なし | [geo-analysis--dataset-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/geo-analysis--dataset-mobile-390.webp) |
| geo-analysis | sm-640 | 比較元なし | [geo-analysis--dataset-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--dataset-sm-640.png) |
| geo-analysis | tablet-768 | 比較元なし | [geo-analysis--dataset-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/geo-analysis--dataset-tablet-768.webp) |
| geo-analysis | rail-992 | 比較元なし | [geo-analysis--dataset-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--dataset-rail-992.png) |
| geo-analysis | laptop-1024 | 比較元なし | [geo-analysis--dataset-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--dataset-laptop-1024.png) |
| geo-analysis | desktop-1440 | 比較元なし | [geo-analysis--dataset-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/geo-analysis--dataset-desktop-1440.webp) |
| geo-analysis | wide-1920 | 比較元なし | [geo-analysis--dataset-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--dataset-wide-1920.png) |
| other | mobile-390 | 比較元なし | [other--about-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/other--about-mobile-390.webp) |
| other | sm-640 | 比較元なし | [other--about-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--about-sm-640.png) |
| other | tablet-768 | 比較元なし | [other--about-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/other--about-tablet-768.webp) |
| other | rail-992 | 比較元なし | [other--about-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--about-rail-992.png) |
| other | laptop-1024 | 比較元なし | [other--about-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--about-laptop-1024.png) |
| other | desktop-1440 | 比較元なし | [other--about-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/other--about-desktop-1440.webp) |
| other | wide-1920 | 比較元なし | [other--about-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--about-wide-1920.png) |
| other | mobile-390 | 比較元なし | [other--products-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/other--products-mobile-390.webp) |
| other | sm-640 | 比較元なし | [other--products-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--products-sm-640.png) |
| other | tablet-768 | 比較元なし | [other--products-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/other--products-tablet-768.webp) |
| other | rail-992 | 比較元なし | [other--products-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--products-rail-992.png) |
| other | laptop-1024 | 比較元なし | [other--products-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--products-laptop-1024.png) |
| other | desktop-1440 | 比較元なし | [other--products-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/other--products-desktop-1440.webp) |
| other | wide-1920 | 比較元なし | [other--products-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--products-wide-1920.png) |
| other | mobile-390 | 比較元なし | [other--product-item-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/other--product-item-mobile-390.webp) |
| other | sm-640 | 比較元なし | [other--product-item-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--product-item-sm-640.png) |
| other | tablet-768 | 比較元なし | [other--product-item-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/other--product-item-tablet-768.webp) |
| other | rail-992 | 比較元なし | [other--product-item-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--product-item-rail-992.png) |
| other | laptop-1024 | 比較元なし | [other--product-item-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--product-item-laptop-1024.png) |
| other | desktop-1440 | 比較元なし | [other--product-item-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/other--product-item-desktop-1440.webp) |
| other | wide-1920 | 比較元なし | [other--product-item-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--product-item-wide-1920.png) |
| theme | mobile-390 | 8% | [theme-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/theme-mobile-390.webp) |
| theme | sm-640 | 7% | [theme-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme-sm-640.png) |
| theme | tablet-768 | 7% | [theme-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/theme-tablet-768.webp) |
| theme | rail-992 | 6% | [theme-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme-rail-992.png) |
| theme | laptop-1024 | 6% | [theme-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme-laptop-1024.png) |
| theme | desktop-1440 | 7% | [theme-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/theme-desktop-1440.webp) |
| theme | wide-1920 | 5% | [theme-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme-wide-1920.png) |
| theme | mobile-390 | 比較元なし | [theme--real-income-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/theme--real-income-mobile-390.webp) |
| theme | sm-640 | 比較元なし | [theme--real-income-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--real-income-sm-640.png) |
| theme | tablet-768 | 比較元なし | [theme--real-income-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/theme--real-income-tablet-768.webp) |
| theme | rail-992 | 比較元なし | [theme--real-income-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--real-income-rail-992.png) |
| theme | laptop-1024 | 比較元なし | [theme--real-income-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--real-income-laptop-1024.png) |
| theme | desktop-1440 | 比較元なし | [theme--real-income-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/theme--real-income-desktop-1440.webp) |
| theme | wide-1920 | 比較元なし | [theme--real-income-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--real-income-wide-1920.png) |
| prefecture-detail | mobile-390 | 比較元なし | [prefecture-detail--hokkaido-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/prefecture-detail--hokkaido-mobile-390.webp) |
| prefecture-detail | sm-640 | 比較元なし | [prefecture-detail--hokkaido-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--hokkaido-sm-640.png) |
| prefecture-detail | tablet-768 | 比較元なし | [prefecture-detail--hokkaido-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/prefecture-detail--hokkaido-tablet-768.webp) |
| prefecture-detail | rail-992 | 比較元なし | [prefecture-detail--hokkaido-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--hokkaido-rail-992.png) |
| prefecture-detail | laptop-1024 | 比較元なし | [prefecture-detail--hokkaido-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--hokkaido-laptop-1024.png) |
| prefecture-detail | desktop-1440 | 比較元なし | [prefecture-detail--hokkaido-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/prefecture-detail--hokkaido-desktop-1440.webp) |
| prefecture-detail | wide-1920 | 比較元なし | [prefecture-detail--hokkaido-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--hokkaido-wide-1920.png) |
| prefecture-detail | mobile-390 | 7% | [prefecture-detail-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/prefecture-detail-mobile-390.webp) |
| prefecture-detail | sm-640 | 8% | [prefecture-detail-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail-sm-640.png) |
| prefecture-detail | tablet-768 | 8% | [prefecture-detail-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/prefecture-detail-tablet-768.webp) |
| prefecture-detail | rail-992 | 8% | [prefecture-detail-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail-rail-992.png) |
| prefecture-detail | laptop-1024 | 8% | [prefecture-detail-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail-laptop-1024.png) |
| prefecture-detail | desktop-1440 | 5% | [prefecture-detail-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/prefecture-detail-desktop-1440.webp) |
| prefecture-detail | wide-1920 | 4% | [prefecture-detail-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail-wide-1920.png) |
| prefecture-detail | mobile-390 | 比較元なし | [prefecture-detail--okinawa-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/prefecture-detail--okinawa-mobile-390.webp) |
| prefecture-detail | sm-640 | 比較元なし | [prefecture-detail--okinawa-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--okinawa-sm-640.png) |
| prefecture-detail | tablet-768 | 比較元なし | [prefecture-detail--okinawa-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/prefecture-detail--okinawa-tablet-768.webp) |
| prefecture-detail | rail-992 | 比較元なし | [prefecture-detail--okinawa-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--okinawa-rail-992.png) |
| prefecture-detail | laptop-1024 | 比較元なし | [prefecture-detail--okinawa-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--okinawa-laptop-1024.png) |
| prefecture-detail | desktop-1440 | 比較元なし | [prefecture-detail--okinawa-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/prefecture-detail--okinawa-desktop-1440.webp) |
| prefecture-detail | wide-1920 | 比較元なし | [prefecture-detail--okinawa-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--okinawa-wide-1920.png) |
| prefecture-detail | mobile-390 | 比較元なし | [prefecture-detail--theme-geo-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/prefecture-detail--theme-geo-mobile-390.webp) |
| prefecture-detail | sm-640 | 比較元なし | [prefecture-detail--theme-geo-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-geo-sm-640.png) |
| prefecture-detail | tablet-768 | 比較元なし | [prefecture-detail--theme-geo-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/prefecture-detail--theme-geo-tablet-768.webp) |
| prefecture-detail | rail-992 | 比較元なし | [prefecture-detail--theme-geo-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-geo-rail-992.png) |
| prefecture-detail | laptop-1024 | 比較元なし | [prefecture-detail--theme-geo-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-geo-laptop-1024.png) |
| prefecture-detail | desktop-1440 | 比較元なし | [prefecture-detail--theme-geo-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/prefecture-detail--theme-geo-desktop-1440.webp) |
| prefecture-detail | wide-1920 | 比較元なし | [prefecture-detail--theme-geo-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-geo-wide-1920.png) |
| prefecture-detail | mobile-390 | 比較元なし | [prefecture-detail--theme-population-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/prefecture-detail--theme-population-mobile-390.webp) |
| prefecture-detail | sm-640 | 比較元なし | [prefecture-detail--theme-population-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-population-sm-640.png) |
| prefecture-detail | tablet-768 | 比較元なし | [prefecture-detail--theme-population-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/prefecture-detail--theme-population-tablet-768.webp) |
| prefecture-detail | rail-992 | 比較元なし | [prefecture-detail--theme-population-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-population-rail-992.png) |
| prefecture-detail | laptop-1024 | 比較元なし | [prefecture-detail--theme-population-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-population-laptop-1024.png) |
| prefecture-detail | desktop-1440 | 比較元なし | [prefecture-detail--theme-population-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/prefecture-detail--theme-population-desktop-1440.webp) |
| prefecture-detail | wide-1920 | 比較元なし | [prefecture-detail--theme-population-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-population-wide-1920.png) |
| prefecture-detail | mobile-390 | 比較元なし | [prefecture-detail--theme-care-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/prefecture-detail--theme-care-mobile-390.webp) |
| prefecture-detail | sm-640 | 比較元なし | [prefecture-detail--theme-care-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-care-sm-640.png) |
| prefecture-detail | tablet-768 | 比較元なし | [prefecture-detail--theme-care-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/prefecture-detail--theme-care-tablet-768.webp) |
| prefecture-detail | rail-992 | 比較元なし | [prefecture-detail--theme-care-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-care-rail-992.png) |
| prefecture-detail | laptop-1024 | 比較元なし | [prefecture-detail--theme-care-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-care-laptop-1024.png) |
| prefecture-detail | desktop-1440 | 比較元なし | [prefecture-detail--theme-care-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/prefecture-detail--theme-care-desktop-1440.webp) |
| prefecture-detail | wide-1920 | 比較元なし | [prefecture-detail--theme-care-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-care-wide-1920.png) |
| ranking | mobile-390 | 比較元なし | [ranking--single-year-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/ranking--single-year-mobile-390.webp) |
| ranking | sm-640 | 比較元なし | [ranking--single-year-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--single-year-sm-640.png) |
| ranking | tablet-768 | 比較元なし | [ranking--single-year-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/ranking--single-year-tablet-768.webp) |
| ranking | rail-992 | 比較元なし | [ranking--single-year-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--single-year-rail-992.png) |
| ranking | laptop-1024 | 比較元なし | [ranking--single-year-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--single-year-laptop-1024.png) |
| ranking | desktop-1440 | 比較元なし | [ranking--single-year-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/ranking--single-year-desktop-1440.webp) |
| ranking | wide-1920 | 比較元なし | [ranking--single-year-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--single-year-wide-1920.png) |
| ranking | mobile-390 | 比較元なし | [ranking--old-2years-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/ranking--old-2years-mobile-390.webp) |
| ranking | sm-640 | 比較元なし | [ranking--old-2years-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--old-2years-sm-640.png) |
| ranking | tablet-768 | 比較元なし | [ranking--old-2years-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/ranking--old-2years-tablet-768.webp) |
| ranking | rail-992 | 比較元なし | [ranking--old-2years-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--old-2years-rail-992.png) |
| ranking | laptop-1024 | 比較元なし | [ranking--old-2years-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--old-2years-laptop-1024.png) |
| ranking | desktop-1440 | 比較元なし | [ranking--old-2years-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/ranking--old-2years-desktop-1440.webp) |
| ranking | wide-1920 | 比較元なし | [ranking--old-2years-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--old-2years-wide-1920.png) |
| ranking | mobile-390 | 比較元なし | [ranking--kakei-city-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/ranking--kakei-city-mobile-390.webp) |
| ranking | sm-640 | 比較元なし | [ranking--kakei-city-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--kakei-city-sm-640.png) |
| ranking | tablet-768 | 比較元なし | [ranking--kakei-city-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/ranking--kakei-city-tablet-768.webp) |
| ranking | rail-992 | 比較元なし | [ranking--kakei-city-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--kakei-city-rail-992.png) |
| ranking | laptop-1024 | 比較元なし | [ranking--kakei-city-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--kakei-city-laptop-1024.png) |
| ranking | desktop-1440 | 比較元なし | [ranking--kakei-city-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/ranking--kakei-city-desktop-1440.webp) |
| ranking | wide-1920 | 比較元なし | [ranking--kakei-city-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--kakei-city-wide-1920.png) |
| ranking | mobile-390 | 比較元なし | [ranking--negative-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/ranking--negative-mobile-390.webp) |
| ranking | sm-640 | 比較元なし | [ranking--negative-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--negative-sm-640.png) |
| ranking | tablet-768 | 比較元なし | [ranking--negative-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/ranking--negative-tablet-768.webp) |
| ranking | rail-992 | 比較元なし | [ranking--negative-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--negative-rail-992.png) |
| ranking | laptop-1024 | 比較元なし | [ranking--negative-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--negative-laptop-1024.png) |
| ranking | desktop-1440 | 比較元なし | [ranking--negative-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/ranking--negative-desktop-1440.webp) |
| ranking | wide-1920 | 比較元なし | [ranking--negative-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--negative-wide-1920.png) |
| ranking | mobile-390 | 比較元なし | [ranking--long-title-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/ranking--long-title-mobile-390.webp) |
| ranking | sm-640 | 比較元なし | [ranking--long-title-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--long-title-sm-640.png) |
| ranking | tablet-768 | 比較元なし | [ranking--long-title-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/ranking--long-title-tablet-768.webp) |
| ranking | rail-992 | 比較元なし | [ranking--long-title-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--long-title-rail-992.png) |
| ranking | laptop-1024 | 比較元なし | [ranking--long-title-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--long-title-laptop-1024.png) |
| ranking | desktop-1440 | 比較元なし | [ranking--long-title-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/ranking--long-title-desktop-1440.webp) |
| ranking | wide-1920 | 比較元なし | [ranking--long-title-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--long-title-wide-1920.png) |
| ranking | mobile-390 | 8% | [ranking-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/ranking-mobile-390.webp) |
| ranking | sm-640 | 8% | [ranking-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking-sm-640.png) |
| ranking | tablet-768 | 8% | [ranking-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/ranking-tablet-768.webp) |
| ranking | rail-992 | 8% | [ranking-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking-rail-992.png) |
| ranking | laptop-1024 | 8% | [ranking-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking-laptop-1024.png) |
| ranking | desktop-1440 | 11% | [ranking-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/ranking-desktop-1440.webp) |
| ranking | wide-1920 | 11% | [ranking-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking-wide-1920.png) |
| blog | mobile-390 | 10% | [blog-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/blog-mobile-390.webp) |
| blog | sm-640 | 4% | [blog-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-sm-640.png) |
| blog | tablet-768 | 4% | [blog-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/blog-tablet-768.webp) |
| blog | rail-992 | 1% | [blog-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-rail-992.png) |
| blog | laptop-1024 | 1% | [blog-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-laptop-1024.png) |
| blog | desktop-1440 | 2% | [blog-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/blog-desktop-1440.webp) |
| blog | wide-1920 | 2% | [blog-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-wide-1920.png) |
| blog-article | mobile-390 | 比較元なし | [blog-article-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/blog-article-mobile-390.webp) |
| blog-article | sm-640 | 比較元なし | [blog-article-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article-sm-640.png) |
| blog-article | tablet-768 | 比較元なし | [blog-article-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/blog-article-tablet-768.webp) |
| blog-article | rail-992 | 比較元なし | [blog-article-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article-rail-992.png) |
| blog-article | laptop-1024 | 比較元なし | [blog-article-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article-laptop-1024.png) |
| blog-article | desktop-1440 | 比較元なし | [blog-article-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/blog-article-desktop-1440.webp) |
| blog-article | wide-1920 | 比較元なし | [blog-article-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article-wide-1920.png) |
| blog-article | mobile-390 | 比較元なし | [blog-article--charts-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/blog-article--charts-mobile-390.webp) |
| blog-article | sm-640 | 比較元なし | [blog-article--charts-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article--charts-sm-640.png) |
| blog-article | tablet-768 | 比較元なし | [blog-article--charts-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/blog-article--charts-tablet-768.webp) |
| blog-article | rail-992 | 比較元なし | [blog-article--charts-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article--charts-rail-992.png) |
| blog-article | laptop-1024 | 比較元なし | [blog-article--charts-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article--charts-laptop-1024.png) |
| blog-article | desktop-1440 | 比較元なし | [blog-article--charts-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/blog-article--charts-desktop-1440.webp) |
| blog-article | wide-1920 | 比較元なし | [blog-article--charts-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article--charts-wide-1920.png) |
| category | mobile-390 | 比較元なし | [category--landweather-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/category--landweather-mobile-390.webp) |
| category | sm-640 | 比較元なし | [category--landweather-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category--landweather-sm-640.png) |
| category | tablet-768 | 比較元なし | [category--landweather-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/category--landweather-tablet-768.webp) |
| category | rail-992 | 比較元なし | [category--landweather-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category--landweather-rail-992.png) |
| category | laptop-1024 | 比較元なし | [category--landweather-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category--landweather-laptop-1024.png) |
| category | desktop-1440 | 比較元なし | [category--landweather-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/category--landweather-desktop-1440.webp) |
| category | wide-1920 | 比較元なし | [category--landweather-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category--landweather-wide-1920.png) |
| category | mobile-390 | 10% | [category-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/category-mobile-390.webp) |
| category | sm-640 | 8% | [category-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category-sm-640.png) |
| category | tablet-768 | 8% | [category-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/category-tablet-768.webp) |
| category | rail-992 | 8% | [category-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category-rail-992.png) |
| category | laptop-1024 | 7% | [category-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category-laptop-1024.png) |
| category | desktop-1440 | 6% | [category-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/category-desktop-1440.webp) |
| category | wide-1920 | 5% | [category-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category-wide-1920.png) |
| survey | mobile-390 | 比較元なし | [survey--index-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/survey--index-mobile-390.webp) |
| survey | sm-640 | 比較元なし | [survey--index-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--index-sm-640.png) |
| survey | tablet-768 | 比較元なし | [survey--index-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/survey--index-tablet-768.webp) |
| survey | rail-992 | 比較元なし | [survey--index-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--index-rail-992.png) |
| survey | laptop-1024 | 比較元なし | [survey--index-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--index-laptop-1024.png) |
| survey | desktop-1440 | 比較元なし | [survey--index-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/survey--index-desktop-1440.webp) |
| survey | wide-1920 | 比較元なし | [survey--index-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--index-wide-1920.png) |
| survey | mobile-390 | 4% | [survey-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/survey-mobile-390.webp) |
| survey | sm-640 | 3% | [survey-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey-sm-640.png) |
| survey | tablet-768 | 3% | [survey-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/survey-tablet-768.webp) |
| survey | rail-992 | 2% | [survey-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey-rail-992.png) |
| survey | laptop-1024 | 2% | [survey-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey-laptop-1024.png) |
| survey | desktop-1440 | 2% | [survey-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/survey-desktop-1440.webp) |
| survey | wide-1920 | 2% | [survey-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey-wide-1920.png) |
| survey | mobile-390 | 比較元なし | [survey--police-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/survey--police-mobile-390.webp) |
| survey | sm-640 | 比較元なし | [survey--police-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--police-sm-640.png) |
| survey | tablet-768 | 比較元なし | [survey--police-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/survey--police-tablet-768.webp) |
| survey | rail-992 | 比較元なし | [survey--police-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--police-rail-992.png) |
| survey | laptop-1024 | 比較元なし | [survey--police-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--police-laptop-1024.png) |
| survey | desktop-1440 | 比較元なし | [survey--police-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/survey--police-desktop-1440.webp) |
| survey | wide-1920 | 比較元なし | [survey--police-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--police-wide-1920.png) |
| municipality | mobile-390 | 比較元なし | [municipality--designated-city-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/municipality--designated-city-mobile-390.webp) |
| municipality | sm-640 | 比較元なし | [municipality--designated-city-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--designated-city-sm-640.png) |
| municipality | tablet-768 | 比較元なし | [municipality--designated-city-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/municipality--designated-city-tablet-768.webp) |
| municipality | rail-992 | 比較元なし | [municipality--designated-city-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--designated-city-rail-992.png) |
| municipality | laptop-1024 | 比較元なし | [municipality--designated-city-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--designated-city-laptop-1024.png) |
| municipality | desktop-1440 | 比較元なし | [municipality--designated-city-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/municipality--designated-city-desktop-1440.webp) |
| municipality | wide-1920 | 比較元なし | [municipality--designated-city-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--designated-city-wide-1920.png) |
| municipality | mobile-390 | 比較元なし | [municipality--village-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/municipality--village-mobile-390.webp) |
| municipality | sm-640 | 比較元なし | [municipality--village-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--village-sm-640.png) |
| municipality | tablet-768 | 比較元なし | [municipality--village-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/municipality--village-tablet-768.webp) |
| municipality | rail-992 | 比較元なし | [municipality--village-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--village-rail-992.png) |
| municipality | laptop-1024 | 比較元なし | [municipality--village-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--village-laptop-1024.png) |
| municipality | desktop-1440 | 比較元なし | [municipality--village-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/municipality--village-desktop-1440.webp) |
| municipality | wide-1920 | 比較元なし | [municipality--village-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--village-wide-1920.png) |
| other | mobile-390 | 比較元なし | [other--japan-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/other--japan-mobile-390.webp) |
| other | sm-640 | 比較元なし | [other--japan-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-sm-640.png) |
| other | tablet-768 | 比較元なし | [other--japan-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/other--japan-tablet-768.webp) |
| other | rail-992 | 比較元なし | [other--japan-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-rail-992.png) |
| other | laptop-1024 | 比較元なし | [other--japan-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-laptop-1024.png) |
| other | desktop-1440 | 比較元なし | [other--japan-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/other--japan-desktop-1440.webp) |
| other | wide-1920 | 比較元なし | [other--japan-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-wide-1920.png) |
| other | mobile-390 | 比較元なし | [other--japan-theme-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/other--japan-theme-mobile-390.webp) |
| other | sm-640 | 比較元なし | [other--japan-theme-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-theme-sm-640.png) |
| other | tablet-768 | 比較元なし | [other--japan-theme-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/other--japan-theme-tablet-768.webp) |
| other | rail-992 | 比較元なし | [other--japan-theme-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-theme-rail-992.png) |
| other | laptop-1024 | 比較元なし | [other--japan-theme-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-theme-laptop-1024.png) |
| other | desktop-1440 | 比較元なし | [other--japan-theme-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/other--japan-theme-desktop-1440.webp) |
| other | wide-1920 | 比較元なし | [other--japan-theme-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-theme-wide-1920.png) |
| other | mobile-390 | 比較元なし | [other--municipalities-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/other--municipalities-mobile-390.webp) |
| other | sm-640 | 比較元なし | [other--municipalities-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-sm-640.png) |
| other | tablet-768 | 比較元なし | [other--municipalities-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/other--municipalities-tablet-768.webp) |
| other | rail-992 | 比較元なし | [other--municipalities-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-rail-992.png) |
| other | laptop-1024 | 比較元なし | [other--municipalities-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-laptop-1024.png) |
| other | desktop-1440 | 比較元なし | [other--municipalities-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/other--municipalities-desktop-1440.webp) |
| other | wide-1920 | 比較元なし | [other--municipalities-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-wide-1920.png) |
| other | mobile-390 | 比較元なし | [other--municipalities-theme-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/other--municipalities-theme-mobile-390.webp) |
| other | sm-640 | 比較元なし | [other--municipalities-theme-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-theme-sm-640.png) |
| other | tablet-768 | 比較元なし | [other--municipalities-theme-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/other--municipalities-theme-tablet-768.webp) |
| other | rail-992 | 比較元なし | [other--municipalities-theme-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-theme-rail-992.png) |
| other | laptop-1024 | 比較元なし | [other--municipalities-theme-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-theme-laptop-1024.png) |
| other | desktop-1440 | 比較元なし | [other--municipalities-theme-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/other--municipalities-theme-desktop-1440.webp) |
| other | wide-1920 | 比較元なし | [other--municipalities-theme-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-theme-wide-1920.png) |
| other | mobile-390 | 比較元なし | [other--municipalities-ranking-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/other--municipalities-ranking-mobile-390.webp) |
| other | sm-640 | 比較元なし | [other--municipalities-ranking-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-ranking-sm-640.png) |
| other | tablet-768 | 比較元なし | [other--municipalities-ranking-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/other--municipalities-ranking-tablet-768.webp) |
| other | rail-992 | 比較元なし | [other--municipalities-ranking-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-ranking-rail-992.png) |
| other | laptop-1024 | 比較元なし | [other--municipalities-ranking-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-ranking-laptop-1024.png) |
| other | desktop-1440 | 比較元なし | [other--municipalities-ranking-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/other--municipalities-ranking-desktop-1440.webp) |
| other | wide-1920 | 比較元なし | [other--municipalities-ranking-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-ranking-wide-1920.png) |
| municipality | mobile-390 | 4% | [municipality-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/municipality-mobile-390.webp) |
| municipality | sm-640 | 5% | [municipality-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality-sm-640.png) |
| municipality | tablet-768 | 5% | [municipality-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/municipality-tablet-768.webp) |
| municipality | rail-992 | 5% | [municipality-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality-rail-992.png) |
| municipality | laptop-1024 | 5% | [municipality-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality-laptop-1024.png) |
| municipality | desktop-1440 | 5% | [municipality-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/municipality-desktop-1440.webp) |
| municipality | wide-1920 | 5% | [municipality-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality-wide-1920.png) |
| other | mobile-390 | 12% | [other-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/other-mobile-390.webp) |
| other | sm-640 | 13% | [other-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other-sm-640.png) |
| other | tablet-768 | 9% | [other-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/other-tablet-768.webp) |
| other | rail-992 | 10% | [other-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other-rail-992.png) |
| other | laptop-1024 | 8% | [other-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other-laptop-1024.png) |
| other | desktop-1440 | 8% | [other-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-26/other-desktop-1440.webp) |
| other | wide-1920 | 8% | [other-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other-wide-1920.png) |

## UI 指摘の場所

- `/areas/01000`
  - a11y: color-contrast (serious, 8 箇所)
- `/areas/07000`
  - degraded_image: https://storage.stats47.jp/app/areas/07000/specialty/nameko.webp (HTTP 404)
- `/areas/10000`
  - degraded_image: https://storage.stats47.jp/app/areas/10000/specialty/brix-nine.webp (HTTP 404)
  - degraded_image: https://storage.stats47.jp/app/areas/10000/specialty/aka-imo.webp (HTTP 404)
- `/areas/12000`
  - degraded_image: https://storage.stats47.jp/app/areas/12000/specialty/tomisato-suika.webp (HTTP 404)
  - degraded_image: https://storage.stats47.jp/app/areas/12000/specialty/shiro-takenoko.webp (HTTP 404)
  - degraded_image: https://storage.stats47.jp/app/areas/12000/specialty/mineoka-gyunyu.webp (HTTP 404)
- `/areas/13000`
  - a11y: color-contrast (serious, 8 箇所)
- `/areas/19000`
  - degraded_image: https://storage.stats47.jp/app/areas/19000/specialty/yugao.webp (HTTP 404)
- `/areas/22000`
  - degraded_image: https://storage.stats47.jp/app/areas/22000/specialty/midori-mai.webp (HTTP 404)
  - degraded_image: https://storage.stats47.jp/app/areas/22000/specialty/kajiki.webp (HTTP 404)
  - degraded_image: https://storage.stats47.jp/app/areas/22000/specialty/me-kyabetsu.webp (HTTP 404)
- `/areas/24000`
  - degraded_image: https://storage.stats47.jp/app/areas/24000/specialty/ise-hijiki.webp (HTTP 404)
  - degraded_image: https://storage.stats47.jp/app/areas/24000/specialty/ao-sanori.webp (HTTP 404)
- `/areas/28000`
  - degraded_image: https://storage.stats47.jp/app/areas/28000/specialty/tamba-dainagon-azuki.webp (HTTP 404)
  - degraded_image: https://storage.stats47.jp/app/areas/28000/specialty/botan-nabe-inoshishi.webp (HTTP 404)
- `/areas/32000`
  - degraded_image: https://storage.stats47.jp/app/areas/32000/specialty/ita-wakame.webp (HTTP 404)
  - degraded_image: https://storage.stats47.jp/app/areas/32000/specialty/shussai-shoga.webp (HTTP 404)
- `/areas/33000`
  - degraded_image: https://storage.stats47.jp/app/areas/33000/specialty/satosho-makomotake.webp (HTTP 404)
- `/areas/39000`
  - degraded_image: https://storage.stats47.jp/app/areas/39000/specialty/monpa-ebi.webp (HTTP 404)
- `/areas/43000`
  - degraded_image: https://storage.stats47.jp/app/areas/43000/specialty/shichijo-melon.webp (HTTP 404)
- `/areas/45000`
  - degraded_image: https://storage.stats47.jp/app/areas/45000/specialty/miyazaki-jidokko.webp (HTTP 404)
  - degraded_image: https://storage.stats47.jp/app/areas/45000/specialty/miyazaki-boshiitake.webp (HTTP 404)
- `/areas/47000`
  - a11y: color-contrast (serious, 8 箇所)
- `/areas/02000/landslide-exposure`
  - a11y: scrollable-region-focusable (serious, 1 箇所)
- `/blog/alcohol-prefecture-map`
  - blog_svg_text: https://storage.stats47.jp/app/blog/alcohol-prefecture-map/data/liquor-type-breakdown.svg (1 件: はみ出し "2,760 （33.5%）" right +35px)
- `/blog/allocation-tax-area`
  - blog_svg_text: https://storage.stats47.jp/app/blog/allocation-tax-area/data/allocation-tax-area-prefecture-rankings.svg (9 件: 重なり "北海道" ⇄ "656,171,677 千円" / 重なり "兵庫県" ⇄ "350,362,720 千円" / 重なり "大阪府" ⇄ "312,117,425 千円")
- `/blog/automotive-industry-transformation-map`
  - blog_svg_text: https://storage.stats47.jp/app/blog/automotive-industry-transformation-map/data/chart5-line.svg (4 件: 重なり "静岡" ⇄ "大阪" / 重なり "神奈川" ⇄ "大阪" / 重なり "神奈川" ⇄ "兵庫")
- `/blog/beer-peak-month-july-to-december`
  - a11y: color-contrast (serious, 3 箇所)
  - blog_svg_text: https://storage.stats47.jp/app/blog/beer-peak-month-july-to-december/data/beer-months-by-year-timeseries.svg (1 件: 重なり "6月" ⇄ "2012年")
  - blog_svg_text: https://storage.stats47.jp/app/blog/beer-peak-month-july-to-december/data/alcohol-expenditure-timeseries.svg (2 件: 重なり "2012" ⇄ "発泡酒・ビール風" / 重なり "2015" ⇄ "チューハイ・カクテル")
  - blog_svg_text: https://storage.stats47.jp/app/blog/beer-peak-month-july-to-december/data/beer-quantity-timeseries.svg (2 件: 重なり "2009" ⇄ "ビール" / 重なり "2015" ⇄ "発泡酒・ビール風")
- `/blog/birth-death-gap-decline`
  - blog_svg_text: https://storage.stats47.jp/app/blog/birth-death-gap-decline/data/inline-chart-1.svg (1 件: はみ出し "▲15.6（千人当たり）" right +48px)
- `/blog/cc-estat-07-birthrate-line`
  - blog_svg_text: https://storage.stats47.jp/app/blog/cc-estat-07-birthrate-line/data/tfr-tokyo-okinawa-timeseries.svg (4 件: 重なり "1998" ⇄ "沖縄県" / 重なり "1999" ⇄ "沖縄県" / 重なり "2004" ⇄ "東京都")
- `/blog/cc-estat-08-bar-chart-race`
  - blog_svg_text: https://storage.stats47.jp/app/blog/cc-estat-08-bar-chart-race/data/manufacturing-shipment-amount-ranking.svg (7 件: 重なり "愛知県" ⇄ "58,021,789 百万円" / 重なり "静岡県" ⇄ "19,773,249 百万円" / 重なり "大阪府" ⇄ "19,343,010 百万円")
- `/blog/cc-estat-14-energy-area-chart`
  - blog_svg_text: https://storage.stats47.jp/app/blog/cc-estat-14-energy-area-chart/data/electricity-demand-ranking.svg (10 件: 重なり "東京都" ⇄ "75,521,853 Ｍｗｈ" / 重なり "愛知県" ⇄ "56,119,552 Ｍｗｈ" / 重なり "大阪府" ⇄ "53,301,121 Ｍｗｈ")
- `/blog/cc-estat-16-commerce-bubble`
  - blog_svg_text: https://storage.stats47.jp/app/blog/cc-estat-16-commerce-bubble/data/commerce-sales-ranking.svg (10 件: 重なり "東京都" ⇄ "211,933,731 百万円" / 重なり "大阪府" ⇄ "64,319,587 百万円" / 重なり "愛知県" ⇄ "44,886,931 百万円")
- `/blog/cc-estat-17-edu-slope-graph`
  - blog_svg_text: https://storage.stats47.jp/app/blog/cc-estat-17-edu-slope-graph/data/slope-structure-timeseries.svg (2 件: 重なり "上昇イメージ（順位が上がる）" ⇄ "下降イメージ（順位が下がる）" / 重なり "下降イメージ（順位が下がる）" ⇄ "据え置きイメージ（ほぼ変化なし）")
- `/blog/child-height-regional-gap`
  - blog_svg_text: https://storage.stats47.jp/app/blog/child-height-regional-gap/data/inline-chart-1.svg (2 件: はみ出し "47. 高知" bottom +4px / はみ出し "159.7" bottom +4px)
- `/blog/commercial-land-price-trend`
  - blog_svg_text: https://storage.stats47.jp/app/blog/commercial-land-price-trend/data/standard-price-change-rate-commercial-timeseries.svg (1 件: はみ出し "47都道府県平均" right +77px)
- `/blog/communication-cost-burden`
  - blog_svg_text: https://storage.stats47.jp/app/blog/communication-cost-burden/data/comm-cost-trend.svg (1 件: はみ出し "47都道府県平均" right +77px)
- `/blog/consumer-price-difference-index-utilities-prefecture-gap`
  - blog_svg_text: https://storage.stats47.jp/app/blog/consumer-price-difference-index-utilities-prefecture-gap/data/consumer-price-difference-index-utilities-prefecture-gap-prefecture-rankings.svg (10 件: 重なり "北海道" ⇄ "119.6 （全国=100）" / 重なり "岩手県" ⇄ "112.1 （全国=100）" / 重なり "山形県" ⇄ "111.2 （全国=100）")
- `/blog/convenience-store-sales-monthly-prefecture-gap`
  - blog_svg_text: https://storage.stats47.jp/app/blog/convenience-store-sales-monthly-prefecture-gap/data/convenience-store-sales-monthly-prefecture-gap-prefecture-rankings.svg (1 件: 重なり "東京都" ⇄ "1,896,372 百万円")
- `/blog/ehime-migration-flow`
  - blog_svg_text: https://storage.stats47.jp/app/blog/ehime-migration-flow/data/ehime-migration-flow-migration-timeseries.svg (1 件: 重なり "2023" ⇄ "純移動")
- `/blog/electricity-demand-gap`
  - blog_svg_text: https://storage.stats47.jp/app/blog/electricity-demand-gap/data/electricity-demand-ranking.svg (10 件: 重なり "東京都" ⇄ "75,521,853 Ｍｗｈ" / 重なり "愛知県" ⇄ "56,119,552 Ｍｗｈ" / 重なり "大阪府" ⇄ "53,301,121 Ｍｗｈ")
- `/blog/energy-infrastructure-gas-electricity`
  - blog_svg_text: https://storage.stats47.jp/app/blog/energy-infrastructure-gas-electricity/data/gasoline-trend.svg (1 件: はみ出し "全国" right +31px)
- `/blog/engel-coefficient-prefecture-ranking`
  - blog_svg_text: https://storage.stats47.jp/app/blog/engel-coefficient-prefecture-ranking/data/engel-timeseries.svg (1 件: はみ出し "全国平均" right +49px)
- `/blog/extreme-heat-days-prefecture`
  - blog_svg_text: https://storage.stats47.jp/app/blog/extreme-heat-days-prefecture/data/hokkaido-kumamoto-timeseries.svg (1 件: 重なり "2016" ⇄ "北海道")
- `/blog/female-lecture-prefecture-gap`
  - blog_svg_text: https://storage.stats47.jp/app/blog/female-lecture-prefecture-gap/data/female-class-lecture-count-per-million-female-prefecture-rankings.svg (5 件: 重なり "島根県" ⇄ "3,148.5 学級･講座" / 重なり "富山県" ⇄ "2,510.4 学級･講座" / 重なり "福井県" ⇄ "1,824.9 学級･講座")
- `/blog/fiscal-health-50years-trend`
  - blog_svg_text: https://storage.stats47.jp/app/blog/fiscal-health-50years-trend/data/current-balance-trend.svg (1 件: はみ出し "警戒ライン 80%" right +33px)
- `/blog/food-price-regional-2026`
  - blog_svg_text: https://storage.stats47.jp/app/blog/food-price-regional-2026/data/food-pressure-ranking.svg (9 件: 重なり "沖縄県" ⇄ "106.7 （全国=100）" / 重なり "東京都" ⇄ "103 （全国=100）" / 重なり "福井県" ⇄ "102.5 （全国=100）")
- `/blog/habitable-area-land-use`
  - blog_svg_text: https://storage.stats47.jp/app/blog/habitable-area-land-use/data/land-productivity.svg (1 件: はみ出し "出典: 農林水産省「農業産出額」÷ 可…" bottom +3px)
- `/blog/health-life-expectancy-structure`
  - blog_svg_text: https://storage.stats47.jp/app/blog/health-life-expectancy-structure/data/health-trend.svg (2 件: はみ出し "8.73年" right +16px / はみ出し "12.07年" right +20px)
- `/blog/hospital-bed-utilization-map`
  - blog_svg_text: https://storage.stats47.jp/app/blog/hospital-bed-utilization-map/data/bed-util-vs-physicians.svg (13 件: はみ出し "0" top +8px / はみ出し "0" top +8px / はみ出し "0" top +8px)
- `/blog/ibaraki-migration-flow`
  - blog_svg_text: https://storage.stats47.jp/app/blog/ibaraki-migration-flow/data/ibaraki-migration-flow-migration-timeseries.svg (1 件: 重なり "2023" ⇄ "純移動")
- `/blog/inbound-overnight-guests-prefecture`
  - blog_svg_text: https://storage.stats47.jp/app/blog/inbound-overnight-guests-prefecture/data/inbound-national-trend.svg (1 件: はみ出し "全国 外国人延べ宿泊者数" right +117px)
- `/blog/inbound-overnight-regional-gap`
  - blog_svg_text: https://storage.stats47.jp/app/blog/inbound-overnight-regional-gap/data/foreign-guests-trend.svg (1 件: はみ出し "系列1" right +36px)
- `/blog/inbound-overnight-stay-concentration`
  - blog_svg_text: https://storage.stats47.jp/app/blog/inbound-overnight-stay-concentration/data/national-timeseries.svg (1 件: はみ出し "47都道府県合計" right +77px)
- `/blog/income-quintile-alcohol`
  - blog_svg_text: https://storage.stats47.jp/app/blog/income-quintile-alcohol/data/wine-quintile.svg (3 件: はみ出し "第Ⅰ階級（下位20%）" left +31px / はみ出し "第Ⅲ階級（中位）" left +11px / はみ出し "第Ⅴ階級（上位20%）" left +31px)
  - blog_svg_text: https://storage.stats47.jp/app/blog/income-quintile-alcohol/data/shochu-quintile.svg (3 件: はみ出し "第Ⅰ階級（下位20%）" left +31px / はみ出し "第Ⅲ階級（中位）" left +11px / はみ出し "第Ⅴ階級（上位20%）" left +31px)
  - blog_svg_text: https://storage.stats47.jp/app/blog/income-quintile-alcohol/data/sake-quintile.svg (3 件: はみ出し "第Ⅰ階級（下位20%）" left +31px / はみ出し "第Ⅲ階級（中位）" left +11px / はみ出し "第Ⅴ階級（上位20%）" left +31px)
  - blog_svg_text: https://storage.stats47.jp/app/blog/income-quintile-alcohol/data/beer-quintile.svg (3 件: はみ出し "第Ⅰ階級（下位20%）" left +31px / はみ出し "第Ⅲ階級（中位）" left +11px / はみ出し "第Ⅴ階級（上位20%）" left +31px)
  - blog_svg_text: https://storage.stats47.jp/app/blog/income-quintile-alcohol/data/whisky-quintile.svg (3 件: はみ出し "第Ⅰ階級（下位20%）" left +31px / はみ出し "第Ⅲ階級（中位）" left +11px / はみ出し "第Ⅴ階級（上位20%）" left +31px)
- `/blog/income-quintile-appliance`
  - blog_svg_text: https://storage.stats47.jp/app/blog/income-quintile-appliance/data/pc-quintile.svg (3 件: はみ出し "第Ⅰ階級（下位20%）" left +31px / はみ出し "第Ⅲ階級（中位）" left +11px / はみ出し "第Ⅴ階級（上位20%）" left +31px)
  - blog_svg_text: https://storage.stats47.jp/app/blog/income-quintile-appliance/data/tv-quintile.svg (3 件: はみ出し "第Ⅰ階級（下位20%）" left +31px / はみ出し "第Ⅲ階級（中位）" left +11px / はみ出し "第Ⅴ階級（上位20%）" left +31px)
  - blog_svg_text: https://storage.stats47.jp/app/blog/income-quintile-appliance/data/fridge-quintile.svg (3 件: はみ出し "第Ⅰ階級（下位20%）" left +31px / はみ出し "第Ⅲ階級（中位）" left +11px / はみ出し "第Ⅴ階級（上位20%）" left +31px)
- `/blog/income-quintile-beverage`
  - blog_svg_text: https://storage.stats47.jp/app/blog/income-quintile-beverage/data/black-tea-quintile.svg (3 件: はみ出し "第Ⅰ階級（下位20%）" left +31px / はみ出し "第Ⅲ階級（中位）" left +11px / はみ出し "第Ⅴ階級（上位20%）" left +31px)
  - blog_svg_text: https://storage.stats47.jp/app/blog/income-quintile-beverage/data/coffee-quintile.svg (3 件: はみ出し "第Ⅰ階級（下位20%）" left +31px / はみ出し "第Ⅲ階級（中位）" left +11px / はみ出し "第Ⅴ階級（上位20%）" left +31px)
  - blog_svg_text: https://storage.stats47.jp/app/blog/income-quintile-beverage/data/green-tea-quintile.svg (3 件: はみ出し "第Ⅰ階級（下位20%）" left +31px / はみ出し "第Ⅲ階級（中位）" left +11px / はみ出し "第Ⅴ階級（上位20%）" left +31px)
- `/blog/income-quintile-car`
  - blog_svg_text: https://storage.stats47.jp/app/blog/income-quintile-car/data/car-purchase-quintile.svg (3 件: はみ出し "第Ⅰ階級（下位20%）" left +31px / はみ出し "第Ⅲ階級（中位）" left +11px / はみ出し "第Ⅴ階級（上位20%）" left +31px)
  - blog_svg_text: https://storage.stats47.jp/app/blog/income-quintile-car/data/gasoline-quintile.svg (3 件: はみ出し "第Ⅰ階級（下位20%）" left +31px / はみ出し "第Ⅲ階級（中位）" left +11px / はみ出し "第Ⅴ階級（上位20%）" left +31px)
  - blog_svg_text: https://storage.stats47.jp/app/blog/income-quintile-car/data/train-pass-quintile.svg (3 件: はみ出し "第Ⅰ階級（下位20%）" left +31px / はみ出し "第Ⅲ階級（中位）" left +11px / はみ出し "第Ⅴ階級（上位20%）" left +31px)
- ほか 77 URL (latest.json の ui_findings を参照)
