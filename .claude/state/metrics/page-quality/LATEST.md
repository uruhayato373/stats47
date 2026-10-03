# ページ品質監査 Latest — 2026-10-03

- モード: full / 対象 6475 URL / commit 7c51aa2d00625e823b2e5566b7adfd16520cd63f
- 違反: **error 3149 / warning 7885**

## テンプレート別集計

| テンプレート | URL数 | error | warning |
|---|---|---|---|
| home | 1 | 1 | 1 |
| ranking | 2412 | 869 | 4845 |
| prefecture-list | 1 | 0 | 1 |
| theme | 56 | 33 | 42 |
| geo-analysis | 71 | 54 | 26 |
| other | 308 | 3 | 86 |
| prefecture-detail | 2491 | 1512 | 2445 |
| blog | 1 | 1 | 2 |
| blog-article | 608 | 608 | 309 |
| category | 17 | 10 | 18 |
| survey | 148 | 58 | 107 |
| municipality | 361 | 0 | 3 |

## 違反の詳細

上位 100 件 (error を先に) / 全 11034 件。全件は R2 `state/page-quality/latest.json` (`npm run state:pull -- page-quality`)。

| URL | metric | 実測 | 前回 | 閾値 | 種別 |
|---|---|---|---|---|---|
| `/` | duplicate_link_ratio (absolute) | 0.4134 | - | <= 0.3 | 🚨 |
| `/ranking` | duplicate_link_ratio (absolute) | 0.3141 | - | <= 0.3 | 🚨 |
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
| `/themes/local-government-digital` | duplicate_link_ratio (absolute) | 0.3101 | - | <= 0.3 | 🚨 |
| `/themes/gender-participation` | duplicate_link_ratio (absolute) | 0.3165 | - | <= 0.3 | 🚨 |
| `/areas/01000/population-dynamics` | duplicate_link_ratio (absolute) | 0.496 | - | <= 0.3 | 🚨 |
| `/areas/01000/aging-society` | duplicate_link_ratio (absolute) | 0.3736 | - | <= 0.3 | 🚨 |
| `/areas/01000/living-housing` | duplicate_link_ratio (absolute) | 0.5331 | - | <= 0.3 | 🚨 |
| `/areas/01000/local-economy` | duplicate_link_ratio (absolute) | 0.3939 | - | <= 0.3 | 🚨 |
| `/areas/01000/labor-wages` | duplicate_link_ratio (absolute) | 0.3563 | - | <= 0.3 | 🚨 |
| `/areas/01000/manufacturing` | duplicate_link_ratio (absolute) | 0.3439 | - | <= 0.3 | 🚨 |
| `/areas/01000/healthcare` | duplicate_link_ratio (absolute) | 0.5569 | - | <= 0.3 | 🚨 |
| `/areas/01000/safety` | duplicate_link_ratio (absolute) | 0.5163 | - | <= 0.3 | 🚨 |
| `/areas/01000/education-culture` | duplicate_link_ratio (absolute) | 0.4745 | - | <= 0.3 | 🚨 |
| `/areas/01000/tourism` | duplicate_link_ratio (absolute) | 0.3864 | - | <= 0.3 | 🚨 |
| `/areas/01000/consumer-prices` | duplicate_link_ratio (absolute) | 0.359 | - | <= 0.3 | 🚨 |

## 代表URLのスクショ (先週比の変化)

| テンプレート | 端末 | 先週比 | スクショ |
|---|---|---|---|
| home | mobile-390 | 11% | [home-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/home-mobile-390.webp) |
| home | sm-640 | 12% | [home-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/home-sm-640.png) |
| home | tablet-768 | 9% | [home-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/home-tablet-768.webp) |
| home | rail-992 | 7% | [home-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/home-rail-992.png) |
| home | laptop-1024 | 7% | [home-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/home-laptop-1024.png) |
| home | desktop-1440 | 8% | [home-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/home-desktop-1440.webp) |
| home | wide-1920 | 6% | [home-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/home-wide-1920.png) |
| ranking | mobile-390 | 1% | [ranking--index-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/ranking--index-mobile-390.webp) |
| ranking | sm-640 | 1% | [ranking--index-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--index-sm-640.png) |
| ranking | tablet-768 | 1% | [ranking--index-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/ranking--index-tablet-768.webp) |
| ranking | rail-992 | 1% | [ranking--index-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--index-rail-992.png) |
| ranking | laptop-1024 | 1% | [ranking--index-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--index-laptop-1024.png) |
| ranking | desktop-1440 | 1% | [ranking--index-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/ranking--index-desktop-1440.webp) |
| ranking | wide-1920 | 1% | [ranking--index-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--index-wide-1920.png) |
| prefecture-list | mobile-390 | 0% | [prefecture-list-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/prefecture-list-mobile-390.webp) |
| prefecture-list | sm-640 | 0% | [prefecture-list-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-list-sm-640.png) |
| prefecture-list | tablet-768 | 0% | [prefecture-list-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/prefecture-list-tablet-768.webp) |
| prefecture-list | rail-992 | 0% | [prefecture-list-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-list-rail-992.png) |
| prefecture-list | laptop-1024 | 0% | [prefecture-list-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-list-laptop-1024.png) |
| prefecture-list | desktop-1440 | 0% | [prefecture-list-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/prefecture-list-desktop-1440.webp) |
| prefecture-list | wide-1920 | 0% | [prefecture-list-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-list-wide-1920.png) |
| theme | mobile-390 | 0% | [theme--index-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/theme--index-mobile-390.webp) |
| theme | sm-640 | 0% | [theme--index-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--index-sm-640.png) |
| theme | tablet-768 | 0% | [theme--index-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/theme--index-tablet-768.webp) |
| theme | rail-992 | 0% | [theme--index-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--index-rail-992.png) |
| theme | laptop-1024 | 0% | [theme--index-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--index-laptop-1024.png) |
| theme | desktop-1440 | 0% | [theme--index-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/theme--index-desktop-1440.webp) |
| theme | wide-1920 | 0% | [theme--index-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--index-wide-1920.png) |
| geo-analysis | mobile-390 | 0% | [geo-analysis-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/geo-analysis-mobile-390.webp) |
| geo-analysis | sm-640 | 0% | [geo-analysis-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis-sm-640.png) |
| geo-analysis | tablet-768 | 0% | [geo-analysis-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/geo-analysis-tablet-768.webp) |
| geo-analysis | rail-992 | 0% | [geo-analysis-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis-rail-992.png) |
| geo-analysis | laptop-1024 | 0% | [geo-analysis-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis-laptop-1024.png) |
| geo-analysis | desktop-1440 | 0% | [geo-analysis-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/geo-analysis-desktop-1440.webp) |
| geo-analysis | wide-1920 | 0% | [geo-analysis-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis-wide-1920.png) |
| geo-analysis | mobile-390 | 0% | [geo-analysis--compare-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/geo-analysis--compare-mobile-390.webp) |
| geo-analysis | sm-640 | 0% | [geo-analysis--compare-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--compare-sm-640.png) |
| geo-analysis | tablet-768 | 0% | [geo-analysis--compare-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/geo-analysis--compare-tablet-768.webp) |
| geo-analysis | rail-992 | 0% | [geo-analysis--compare-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--compare-rail-992.png) |
| geo-analysis | laptop-1024 | 0% | [geo-analysis--compare-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--compare-laptop-1024.png) |
| geo-analysis | desktop-1440 | 0% | [geo-analysis--compare-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/geo-analysis--compare-desktop-1440.webp) |
| geo-analysis | wide-1920 | 0% | [geo-analysis--compare-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--compare-wide-1920.png) |
| geo-analysis | mobile-390 | 0% | [geo-analysis--layer-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/geo-analysis--layer-mobile-390.webp) |
| geo-analysis | sm-640 | 0% | [geo-analysis--layer-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--layer-sm-640.png) |
| geo-analysis | tablet-768 | 0% | [geo-analysis--layer-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/geo-analysis--layer-tablet-768.webp) |
| geo-analysis | rail-992 | 0% | [geo-analysis--layer-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--layer-rail-992.png) |
| geo-analysis | laptop-1024 | 0% | [geo-analysis--layer-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--layer-laptop-1024.png) |
| geo-analysis | desktop-1440 | 0% | [geo-analysis--layer-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/geo-analysis--layer-desktop-1440.webp) |
| geo-analysis | wide-1920 | 0% | [geo-analysis--layer-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--layer-wide-1920.png) |
| geo-analysis | mobile-390 | 0% | [geo-analysis--analysis-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/geo-analysis--analysis-mobile-390.webp) |
| geo-analysis | sm-640 | 0% | [geo-analysis--analysis-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-sm-640.png) |
| geo-analysis | tablet-768 | 0% | [geo-analysis--analysis-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/geo-analysis--analysis-tablet-768.webp) |
| geo-analysis | rail-992 | 0% | [geo-analysis--analysis-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-rail-992.png) |
| geo-analysis | laptop-1024 | 1% | [geo-analysis--analysis-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-laptop-1024.png) |
| geo-analysis | desktop-1440 | 1% | [geo-analysis--analysis-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/geo-analysis--analysis-desktop-1440.webp) |
| geo-analysis | wide-1920 | 0% | [geo-analysis--analysis-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-wide-1920.png) |
| geo-analysis | mobile-390 | 0% | [geo-analysis--analysis-pref-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/geo-analysis--analysis-pref-mobile-390.webp) |
| geo-analysis | sm-640 | 0% | [geo-analysis--analysis-pref-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-pref-sm-640.png) |
| geo-analysis | tablet-768 | 0% | [geo-analysis--analysis-pref-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/geo-analysis--analysis-pref-tablet-768.webp) |
| geo-analysis | rail-992 | 0% | [geo-analysis--analysis-pref-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-pref-rail-992.png) |
| geo-analysis | laptop-1024 | 0% | [geo-analysis--analysis-pref-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-pref-laptop-1024.png) |
| geo-analysis | desktop-1440 | 0% | [geo-analysis--analysis-pref-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/geo-analysis--analysis-pref-desktop-1440.webp) |
| geo-analysis | wide-1920 | 0% | [geo-analysis--analysis-pref-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-pref-wide-1920.png) |
| geo-analysis | mobile-390 | 0% | [geo-analysis--dataset-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/geo-analysis--dataset-mobile-390.webp) |
| geo-analysis | sm-640 | 0% | [geo-analysis--dataset-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--dataset-sm-640.png) |
| geo-analysis | tablet-768 | 0% | [geo-analysis--dataset-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/geo-analysis--dataset-tablet-768.webp) |
| geo-analysis | rail-992 | 0% | [geo-analysis--dataset-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--dataset-rail-992.png) |
| geo-analysis | laptop-1024 | 0% | [geo-analysis--dataset-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--dataset-laptop-1024.png) |
| geo-analysis | desktop-1440 | 0% | [geo-analysis--dataset-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/geo-analysis--dataset-desktop-1440.webp) |
| geo-analysis | wide-1920 | 0% | [geo-analysis--dataset-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--dataset-wide-1920.png) |
| other | mobile-390 | 13% | [other--about-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/other--about-mobile-390.webp) |
| other | sm-640 | 13% | [other--about-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--about-sm-640.png) |
| other | tablet-768 | 12% | [other--about-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/other--about-tablet-768.webp) |
| other | rail-992 | 11% | [other--about-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--about-rail-992.png) |
| other | laptop-1024 | 11% | [other--about-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--about-laptop-1024.png) |
| other | desktop-1440 | 10% | [other--about-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/other--about-desktop-1440.webp) |
| other | wide-1920 | 9% | [other--about-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--about-wide-1920.png) |
| other | mobile-390 | 10% | [other--products-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/other--products-mobile-390.webp) |
| other | sm-640 | 7% | [other--products-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--products-sm-640.png) |
| other | tablet-768 | 8% | [other--products-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/other--products-tablet-768.webp) |
| other | rail-992 | 8% | [other--products-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--products-rail-992.png) |
| other | laptop-1024 | 8% | [other--products-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--products-laptop-1024.png) |
| other | desktop-1440 | 6% | [other--products-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/other--products-desktop-1440.webp) |
| other | wide-1920 | 5% | [other--products-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--products-wide-1920.png) |
| other | mobile-390 | 0% | [other--product-item-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/other--product-item-mobile-390.webp) |
| other | sm-640 | 0% | [other--product-item-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--product-item-sm-640.png) |
| other | tablet-768 | 0% | [other--product-item-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/other--product-item-tablet-768.webp) |
| other | rail-992 | 0% | [other--product-item-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--product-item-rail-992.png) |
| other | laptop-1024 | 0% | [other--product-item-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--product-item-laptop-1024.png) |
| other | desktop-1440 | 0% | [other--product-item-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/other--product-item-desktop-1440.webp) |
| other | wide-1920 | 0% | [other--product-item-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--product-item-wide-1920.png) |
| theme | mobile-390 | 0% | [theme-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/theme-mobile-390.webp) |
| theme | sm-640 | 0% | [theme-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme-sm-640.png) |
| theme | tablet-768 | 0% | [theme-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/theme-tablet-768.webp) |
| theme | rail-992 | 0% | [theme-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme-rail-992.png) |
| theme | laptop-1024 | 0% | [theme-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme-laptop-1024.png) |
| theme | desktop-1440 | 0% | [theme-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/theme-desktop-1440.webp) |
| theme | wide-1920 | 0% | [theme-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme-wide-1920.png) |
| theme | mobile-390 | 0% | [theme--real-income-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/theme--real-income-mobile-390.webp) |
| theme | sm-640 | 0% | [theme--real-income-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--real-income-sm-640.png) |
| theme | tablet-768 | 0% | [theme--real-income-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/theme--real-income-tablet-768.webp) |
| theme | rail-992 | 0% | [theme--real-income-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--real-income-rail-992.png) |
| theme | laptop-1024 | 0% | [theme--real-income-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--real-income-laptop-1024.png) |
| theme | desktop-1440 | 0% | [theme--real-income-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/theme--real-income-desktop-1440.webp) |
| theme | wide-1920 | 0% | [theme--real-income-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--real-income-wide-1920.png) |
| prefecture-detail | mobile-390 | 6% | [prefecture-detail--hokkaido-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/prefecture-detail--hokkaido-mobile-390.webp) |
| prefecture-detail | sm-640 | 5% | [prefecture-detail--hokkaido-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--hokkaido-sm-640.png) |
| prefecture-detail | tablet-768 | 5% | [prefecture-detail--hokkaido-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/prefecture-detail--hokkaido-tablet-768.webp) |
| prefecture-detail | rail-992 | 3% | [prefecture-detail--hokkaido-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--hokkaido-rail-992.png) |
| prefecture-detail | laptop-1024 | 3% | [prefecture-detail--hokkaido-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--hokkaido-laptop-1024.png) |
| prefecture-detail | desktop-1440 | 4% | [prefecture-detail--hokkaido-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/prefecture-detail--hokkaido-desktop-1440.webp) |
| prefecture-detail | wide-1920 | 3% | [prefecture-detail--hokkaido-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--hokkaido-wide-1920.png) |
| prefecture-detail | mobile-390 | 6% | [prefecture-detail-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/prefecture-detail-mobile-390.webp) |
| prefecture-detail | sm-640 | 5% | [prefecture-detail-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail-sm-640.png) |
| prefecture-detail | tablet-768 | 5% | [prefecture-detail-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/prefecture-detail-tablet-768.webp) |
| prefecture-detail | rail-992 | 3% | [prefecture-detail-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail-rail-992.png) |
| prefecture-detail | laptop-1024 | 3% | [prefecture-detail-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail-laptop-1024.png) |
| prefecture-detail | desktop-1440 | 4% | [prefecture-detail-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/prefecture-detail-desktop-1440.webp) |
| prefecture-detail | wide-1920 | 3% | [prefecture-detail-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail-wide-1920.png) |
| prefecture-detail | mobile-390 | 6% | [prefecture-detail--okinawa-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/prefecture-detail--okinawa-mobile-390.webp) |
| prefecture-detail | sm-640 | 5% | [prefecture-detail--okinawa-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--okinawa-sm-640.png) |
| prefecture-detail | tablet-768 | 5% | [prefecture-detail--okinawa-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/prefecture-detail--okinawa-tablet-768.webp) |
| prefecture-detail | rail-992 | 6% | [prefecture-detail--okinawa-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--okinawa-rail-992.png) |
| prefecture-detail | laptop-1024 | 5% | [prefecture-detail--okinawa-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--okinawa-laptop-1024.png) |
| prefecture-detail | desktop-1440 | 5% | [prefecture-detail--okinawa-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/prefecture-detail--okinawa-desktop-1440.webp) |
| prefecture-detail | wide-1920 | 3% | [prefecture-detail--okinawa-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--okinawa-wide-1920.png) |
| prefecture-detail | mobile-390 | 0% | [prefecture-detail--theme-geo-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/prefecture-detail--theme-geo-mobile-390.webp) |
| prefecture-detail | sm-640 | 0% | [prefecture-detail--theme-geo-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-geo-sm-640.png) |
| prefecture-detail | tablet-768 | 0% | [prefecture-detail--theme-geo-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/prefecture-detail--theme-geo-tablet-768.webp) |
| prefecture-detail | rail-992 | 0% | [prefecture-detail--theme-geo-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-geo-rail-992.png) |
| prefecture-detail | laptop-1024 | 0% | [prefecture-detail--theme-geo-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-geo-laptop-1024.png) |
| prefecture-detail | desktop-1440 | 1% | [prefecture-detail--theme-geo-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/prefecture-detail--theme-geo-desktop-1440.webp) |
| prefecture-detail | wide-1920 | 0% | [prefecture-detail--theme-geo-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-geo-wide-1920.png) |
| prefecture-detail | mobile-390 | 0% | [prefecture-detail--theme-population-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/prefecture-detail--theme-population-mobile-390.webp) |
| prefecture-detail | sm-640 | 0% | [prefecture-detail--theme-population-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-population-sm-640.png) |
| prefecture-detail | tablet-768 | 0% | [prefecture-detail--theme-population-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/prefecture-detail--theme-population-tablet-768.webp) |
| prefecture-detail | rail-992 | 0% | [prefecture-detail--theme-population-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-population-rail-992.png) |
| prefecture-detail | laptop-1024 | 0% | [prefecture-detail--theme-population-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-population-laptop-1024.png) |
| prefecture-detail | desktop-1440 | 0% | [prefecture-detail--theme-population-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/prefecture-detail--theme-population-desktop-1440.webp) |
| prefecture-detail | wide-1920 | 0% | [prefecture-detail--theme-population-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-population-wide-1920.png) |
| prefecture-detail | mobile-390 | 0% | [prefecture-detail--theme-care-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/prefecture-detail--theme-care-mobile-390.webp) |
| prefecture-detail | sm-640 | 0% | [prefecture-detail--theme-care-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-care-sm-640.png) |
| prefecture-detail | tablet-768 | 0% | [prefecture-detail--theme-care-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/prefecture-detail--theme-care-tablet-768.webp) |
| prefecture-detail | rail-992 | 0% | [prefecture-detail--theme-care-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-care-rail-992.png) |
| prefecture-detail | laptop-1024 | 0% | [prefecture-detail--theme-care-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-care-laptop-1024.png) |
| prefecture-detail | desktop-1440 | 0% | [prefecture-detail--theme-care-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/prefecture-detail--theme-care-desktop-1440.webp) |
| prefecture-detail | wide-1920 | 0% | [prefecture-detail--theme-care-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-care-wide-1920.png) |
| ranking | mobile-390 | 5% | [ranking--single-year-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/ranking--single-year-mobile-390.webp) |
| ranking | sm-640 | 4% | [ranking--single-year-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--single-year-sm-640.png) |
| ranking | tablet-768 | 3% | [ranking--single-year-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/ranking--single-year-tablet-768.webp) |
| ranking | rail-992 | 1% | [ranking--single-year-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--single-year-rail-992.png) |
| ranking | laptop-1024 | 1% | [ranking--single-year-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--single-year-laptop-1024.png) |
| ranking | desktop-1440 | 0% | [ranking--single-year-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/ranking--single-year-desktop-1440.webp) |
| ranking | wide-1920 | 0% | [ranking--single-year-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--single-year-wide-1920.png) |
| ranking | mobile-390 | 0% | [ranking--old-2years-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/ranking--old-2years-mobile-390.webp) |
| ranking | sm-640 | 0% | [ranking--old-2years-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--old-2years-sm-640.png) |
| ranking | tablet-768 | 0% | [ranking--old-2years-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/ranking--old-2years-tablet-768.webp) |
| ranking | rail-992 | 0% | [ranking--old-2years-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--old-2years-rail-992.png) |
| ranking | laptop-1024 | 0% | [ranking--old-2years-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--old-2years-laptop-1024.png) |
| ranking | desktop-1440 | 0% | [ranking--old-2years-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/ranking--old-2years-desktop-1440.webp) |
| ranking | wide-1920 | 0% | [ranking--old-2years-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--old-2years-wide-1920.png) |
| ranking | mobile-390 | 1% | [ranking--kakei-city-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/ranking--kakei-city-mobile-390.webp) |
| ranking | sm-640 | 1% | [ranking--kakei-city-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--kakei-city-sm-640.png) |
| ranking | tablet-768 | 0% | [ranking--kakei-city-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/ranking--kakei-city-tablet-768.webp) |
| ranking | rail-992 | 0% | [ranking--kakei-city-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--kakei-city-rail-992.png) |
| ranking | laptop-1024 | 0% | [ranking--kakei-city-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--kakei-city-laptop-1024.png) |
| ranking | desktop-1440 | 0% | [ranking--kakei-city-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/ranking--kakei-city-desktop-1440.webp) |
| ranking | wide-1920 | 0% | [ranking--kakei-city-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--kakei-city-wide-1920.png) |
| ranking | mobile-390 | 3% | [ranking--negative-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/ranking--negative-mobile-390.webp) |
| ranking | sm-640 | 2% | [ranking--negative-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--negative-sm-640.png) |
| ranking | tablet-768 | 2% | [ranking--negative-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/ranking--negative-tablet-768.webp) |
| ranking | rail-992 | 1% | [ranking--negative-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--negative-rail-992.png) |
| ranking | laptop-1024 | 1% | [ranking--negative-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--negative-laptop-1024.png) |
| ranking | desktop-1440 | 0% | [ranking--negative-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/ranking--negative-desktop-1440.webp) |
| ranking | wide-1920 | 0% | [ranking--negative-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--negative-wide-1920.png) |
| ranking | mobile-390 | 9% | [ranking--long-title-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/ranking--long-title-mobile-390.webp) |
| ranking | sm-640 | 10% | [ranking--long-title-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--long-title-sm-640.png) |
| ranking | tablet-768 | 8% | [ranking--long-title-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/ranking--long-title-tablet-768.webp) |
| ranking | rail-992 | 2% | [ranking--long-title-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--long-title-rail-992.png) |
| ranking | laptop-1024 | 1% | [ranking--long-title-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--long-title-laptop-1024.png) |
| ranking | desktop-1440 | 1% | [ranking--long-title-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/ranking--long-title-desktop-1440.webp) |
| ranking | wide-1920 | 1% | [ranking--long-title-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--long-title-wide-1920.png) |
| ranking | mobile-390 | 6% | [ranking-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/ranking-mobile-390.webp) |
| ranking | sm-640 | 5% | [ranking-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking-sm-640.png) |
| ranking | tablet-768 | 4% | [ranking-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/ranking-tablet-768.webp) |
| ranking | rail-992 | 3% | [ranking-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking-rail-992.png) |
| ranking | laptop-1024 | 2% | [ranking-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking-laptop-1024.png) |
| ranking | desktop-1440 | 2% | [ranking-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/ranking-desktop-1440.webp) |
| ranking | wide-1920 | 2% | [ranking-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking-wide-1920.png) |
| blog | mobile-390 | 29% | [blog-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/blog-mobile-390.webp) |
| blog | sm-640 | 26% | [blog-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-sm-640.png) |
| blog | tablet-768 | 28% | [blog-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/blog-tablet-768.webp) |
| blog | rail-992 | 23% | [blog-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-rail-992.png) |
| blog | laptop-1024 | 19% | [blog-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-laptop-1024.png) |
| blog | desktop-1440 | 16% | [blog-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/blog-desktop-1440.webp) |
| blog | wide-1920 | 12% | [blog-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-wide-1920.png) |
| blog-article | mobile-390 | 0% | [blog-article-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/blog-article-mobile-390.webp) |
| blog-article | sm-640 | 0% | [blog-article-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article-sm-640.png) |
| blog-article | tablet-768 | 0% | [blog-article-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/blog-article-tablet-768.webp) |
| blog-article | rail-992 | 0% | [blog-article-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article-rail-992.png) |
| blog-article | laptop-1024 | 0% | [blog-article-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article-laptop-1024.png) |
| blog-article | desktop-1440 | 0% | [blog-article-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/blog-article-desktop-1440.webp) |
| blog-article | wide-1920 | 0% | [blog-article-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article-wide-1920.png) |
| blog-article | mobile-390 | 20% | [blog-article--charts-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/blog-article--charts-mobile-390.webp) |
| blog-article | sm-640 | 15% | [blog-article--charts-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article--charts-sm-640.png) |
| blog-article | tablet-768 | 14% | [blog-article--charts-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/blog-article--charts-tablet-768.webp) |
| blog-article | rail-992 | 12% | [blog-article--charts-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article--charts-rail-992.png) |
| blog-article | laptop-1024 | 10% | [blog-article--charts-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article--charts-laptop-1024.png) |
| blog-article | desktop-1440 | 9% | [blog-article--charts-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/blog-article--charts-desktop-1440.webp) |
| blog-article | wide-1920 | 6% | [blog-article--charts-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article--charts-wide-1920.png) |
| category | mobile-390 | 1% | [category--landweather-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/category--landweather-mobile-390.webp) |
| category | sm-640 | 1% | [category--landweather-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category--landweather-sm-640.png) |
| category | tablet-768 | 1% | [category--landweather-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/category--landweather-tablet-768.webp) |
| category | rail-992 | 1% | [category--landweather-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category--landweather-rail-992.png) |
| category | laptop-1024 | 1% | [category--landweather-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category--landweather-laptop-1024.png) |
| category | desktop-1440 | 1% | [category--landweather-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/category--landweather-desktop-1440.webp) |
| category | wide-1920 | 0% | [category--landweather-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category--landweather-wide-1920.png) |
| category | mobile-390 | 7% | [category-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/category-mobile-390.webp) |
| category | sm-640 | 5% | [category-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category-sm-640.png) |
| category | tablet-768 | 4% | [category-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/category-tablet-768.webp) |
| category | rail-992 | 4% | [category-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category-rail-992.png) |
| category | laptop-1024 | 4% | [category-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category-laptop-1024.png) |
| category | desktop-1440 | 4% | [category-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/category-desktop-1440.webp) |
| category | wide-1920 | 3% | [category-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category-wide-1920.png) |
| survey | mobile-390 | 0% | [survey--index-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/survey--index-mobile-390.webp) |
| survey | sm-640 | 0% | [survey--index-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--index-sm-640.png) |
| survey | tablet-768 | 0% | [survey--index-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/survey--index-tablet-768.webp) |
| survey | rail-992 | 0% | [survey--index-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--index-rail-992.png) |
| survey | laptop-1024 | 0% | [survey--index-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--index-laptop-1024.png) |
| survey | desktop-1440 | 0% | [survey--index-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/survey--index-desktop-1440.webp) |
| survey | wide-1920 | 0% | [survey--index-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--index-wide-1920.png) |
| survey | mobile-390 | 7% | [survey-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/survey-mobile-390.webp) |
| survey | sm-640 | 3% | [survey-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey-sm-640.png) |
| survey | tablet-768 | 3% | [survey-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/survey-tablet-768.webp) |
| survey | rail-992 | 2% | [survey-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey-rail-992.png) |
| survey | laptop-1024 | 2% | [survey-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey-laptop-1024.png) |
| survey | desktop-1440 | 1% | [survey-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/survey-desktop-1440.webp) |
| survey | wide-1920 | 1% | [survey-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey-wide-1920.png) |
| survey | mobile-390 | 8% | [survey--police-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/survey--police-mobile-390.webp) |
| survey | sm-640 | 5% | [survey--police-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--police-sm-640.png) |
| survey | tablet-768 | 4% | [survey--police-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/survey--police-tablet-768.webp) |
| survey | rail-992 | 3% | [survey--police-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--police-rail-992.png) |
| survey | laptop-1024 | 3% | [survey--police-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--police-laptop-1024.png) |
| survey | desktop-1440 | 2% | [survey--police-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/survey--police-desktop-1440.webp) |
| survey | wide-1920 | 2% | [survey--police-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--police-wide-1920.png) |
| municipality | mobile-390 | 11% | [municipality--designated-city-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/municipality--designated-city-mobile-390.webp) |
| municipality | sm-640 | 5% | [municipality--designated-city-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--designated-city-sm-640.png) |
| municipality | tablet-768 | 4% | [municipality--designated-city-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/municipality--designated-city-tablet-768.webp) |
| municipality | rail-992 | 6% | [municipality--designated-city-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--designated-city-rail-992.png) |
| municipality | laptop-1024 | 6% | [municipality--designated-city-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--designated-city-laptop-1024.png) |
| municipality | desktop-1440 | 6% | [municipality--designated-city-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/municipality--designated-city-desktop-1440.webp) |
| municipality | wide-1920 | 6% | [municipality--designated-city-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--designated-city-wide-1920.png) |
| municipality | mobile-390 | 9% | [municipality--village-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/municipality--village-mobile-390.webp) |
| municipality | sm-640 | 5% | [municipality--village-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--village-sm-640.png) |
| municipality | tablet-768 | 6% | [municipality--village-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/municipality--village-tablet-768.webp) |
| municipality | rail-992 | 8% | [municipality--village-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--village-rail-992.png) |
| municipality | laptop-1024 | 8% | [municipality--village-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--village-laptop-1024.png) |
| municipality | desktop-1440 | 8% | [municipality--village-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/municipality--village-desktop-1440.webp) |
| municipality | wide-1920 | 4% | [municipality--village-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--village-wide-1920.png) |
| other | mobile-390 | 0% | [other--japan-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/other--japan-mobile-390.webp) |
| other | sm-640 | 0% | [other--japan-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-sm-640.png) |
| other | tablet-768 | 0% | [other--japan-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/other--japan-tablet-768.webp) |
| other | rail-992 | 0% | [other--japan-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-rail-992.png) |
| other | laptop-1024 | 0% | [other--japan-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-laptop-1024.png) |
| other | desktop-1440 | 0% | [other--japan-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/other--japan-desktop-1440.webp) |
| other | wide-1920 | 0% | [other--japan-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-wide-1920.png) |
| other | mobile-390 | 5% | [other--japan-theme-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/other--japan-theme-mobile-390.webp) |
| other | sm-640 | 0% | [other--japan-theme-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-theme-sm-640.png) |
| other | tablet-768 | 0% | [other--japan-theme-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/other--japan-theme-tablet-768.webp) |
| other | rail-992 | 0% | [other--japan-theme-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-theme-rail-992.png) |
| other | laptop-1024 | 0% | [other--japan-theme-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-theme-laptop-1024.png) |
| other | desktop-1440 | 0% | [other--japan-theme-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/other--japan-theme-desktop-1440.webp) |
| other | wide-1920 | 0% | [other--japan-theme-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-theme-wide-1920.png) |
| other | mobile-390 | 0% | [other--municipalities-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/other--municipalities-mobile-390.webp) |
| other | sm-640 | 0% | [other--municipalities-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-sm-640.png) |
| other | tablet-768 | 0% | [other--municipalities-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/other--municipalities-tablet-768.webp) |
| other | rail-992 | 0% | [other--municipalities-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-rail-992.png) |
| other | laptop-1024 | 0% | [other--municipalities-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-laptop-1024.png) |
| other | desktop-1440 | 0% | [other--municipalities-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/other--municipalities-desktop-1440.webp) |
| other | wide-1920 | 0% | [other--municipalities-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-wide-1920.png) |
| other | mobile-390 | 0% | [other--municipalities-theme-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/other--municipalities-theme-mobile-390.webp) |
| other | sm-640 | 0% | [other--municipalities-theme-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-theme-sm-640.png) |
| other | tablet-768 | 0% | [other--municipalities-theme-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/other--municipalities-theme-tablet-768.webp) |
| other | rail-992 | 0% | [other--municipalities-theme-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-theme-rail-992.png) |
| other | laptop-1024 | 0% | [other--municipalities-theme-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-theme-laptop-1024.png) |
| other | desktop-1440 | 0% | [other--municipalities-theme-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/other--municipalities-theme-desktop-1440.webp) |
| other | wide-1920 | 0% | [other--municipalities-theme-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-theme-wide-1920.png) |
| other | mobile-390 | 0% | [other--municipalities-ranking-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/other--municipalities-ranking-mobile-390.webp) |
| other | sm-640 | 0% | [other--municipalities-ranking-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-ranking-sm-640.png) |
| other | tablet-768 | 0% | [other--municipalities-ranking-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/other--municipalities-ranking-tablet-768.webp) |
| other | rail-992 | 0% | [other--municipalities-ranking-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-ranking-rail-992.png) |
| other | laptop-1024 | 0% | [other--municipalities-ranking-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-ranking-laptop-1024.png) |
| other | desktop-1440 | 0% | [other--municipalities-ranking-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/other--municipalities-ranking-desktop-1440.webp) |
| other | wide-1920 | 0% | [other--municipalities-ranking-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-ranking-wide-1920.png) |
| municipality | mobile-390 | 4% | [municipality-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/municipality-mobile-390.webp) |
| municipality | sm-640 | 6% | [municipality-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality-sm-640.png) |
| municipality | tablet-768 | 4% | [municipality-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/municipality-tablet-768.webp) |
| municipality | rail-992 | 6% | [municipality-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality-rail-992.png) |
| municipality | laptop-1024 | 6% | [municipality-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality-laptop-1024.png) |
| municipality | desktop-1440 | 6% | [municipality-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/municipality-desktop-1440.webp) |
| municipality | wide-1920 | 2% | [municipality-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality-wide-1920.png) |
| other | mobile-390 | 1% | [other-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/other-mobile-390.webp) |
| other | sm-640 | 1% | [other-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other-sm-640.png) |
| other | tablet-768 | 1% | [other-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/other-tablet-768.webp) |
| other | rail-992 | 1% | [other-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other-rail-992.png) |
| other | laptop-1024 | 1% | [other-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other-laptop-1024.png) |
| other | desktop-1440 | 4% | [other-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-03/other-desktop-1440.webp) |
| other | wide-1920 | 3% | [other-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other-wide-1920.png) |

## UI 指摘の場所

- `/`
  - small_text: 10px「1位」
  - small_text: 10px「cm」
  - small_text: 10px「2023年」
  - small_text: 10px「1位」
  - small_text: 10px「個」
  - small_text: 10px「2024年」
  - small_text: 10px「1位」
  - small_text: 10px「時間」
  - small_text: 10px「2024年」
  - small_text: 10px「1位」
- `/ranking`
  - small_text: 10px「1位」
  - small_text: 10px「cm」
  - small_text: 10px「2023年」
  - small_text: 10px「1位」
  - small_text: 10px「個」
  - small_text: 10px「2024年」
  - small_text: 10px「1位」
  - small_text: 10px「時間」
  - small_text: 10px「2024年」
  - small_text: 10px「1位」
- `/geo/population-land-price`
  - internal_jargon: 保存則 ×3
  - internal_jargon: lineage ×1
- `/geo/population-flood-risk`
  - internal_jargon: 保存則 ×3
  - internal_jargon: lineage ×1
- `/geo/population-station-access`
  - internal_jargon: 保存則 ×3
  - internal_jargon: lineage ×1
- `/geo/population-snow-designation`
  - internal_jargon: 保存則 ×6
  - internal_jargon: lineage ×1
- `/geo/population-landslide-exposure`
  - internal_jargon: 保存則 ×6
  - internal_jargon: lineage ×1
- `/geo/population-public-facility-access`
  - internal_jargon: 保存則 ×5
  - internal_jargon: lineage ×1
- `/geo/population-land-price/47/overlap`
  - internal_jargon: 保存則 ×3
  - internal_jargon: lineage ×1
- `/geo/population-land-price/27/overlap`
  - internal_jargon: 保存則 ×3
  - internal_jargon: lineage ×1
- `/geo/population-flood-risk/15/overlap`
  - internal_jargon: 保存則 ×3
  - internal_jargon: lineage ×1
- `/geo/population-flood-risk/13/overlap`
  - internal_jargon: 保存則 ×3
  - internal_jargon: lineage ×1
- `/geo/population-flood-risk/01/overlap`
  - internal_jargon: 保存則 ×3
  - internal_jargon: lineage ×1
- `/geo/population-station-access/13/overlap`
  - internal_jargon: 保存則 ×3
  - internal_jargon: lineage ×1
- `/geo/population-station-access/01/overlap`
  - internal_jargon: 保存則 ×3
  - internal_jargon: lineage ×1
- `/themes/population-dynamics`
  - small_text: 10px「出生数」
  - small_text: 10px「死亡数」
  - small_text: 10px「外国人転入者数」
  - small_text: 10px「外国人転出者数」
  - small_text: 10px「出典: 厚生労働白書 (令和7年版) /」
- `/themes/aging-society`
  - unit_symbol_mixing: % ×12 / ％ ×1
- `/themes/local-economy`
  - unit_symbol_mixing: % ×4 / ％ ×1
- `/themes/railway`
  - internal_jargon: 保存則 ×1
- `/themes/climate`
  - internal_jargon: 保存則 ×1
- `/themes/geographic-access`
  - internal_jargon: 保存則 ×1
- `/themes/environmental-quality`
  - unit_symbol_mixing: % ×1 / ％ ×6
- `/themes/landslide-exposure`
  - internal_jargon: 保存則 ×1
- `/themes/tsunami-exposure`
  - internal_jargon: 保存則 ×1
- `/areas/01000`
  - internal_jargon: 保存則 ×3
  - small_text: 10px「15歳未満」
  - small_text: 10px「15〜64歳」
  - small_text: 10px「65歳以上」
  - small_text: 10px「高齢化率（65歳以上）」
  - small_text: 10px「年少人口割合（15歳未満）」
  - small_text: 10px「65歳以上世帯員のいる世帯」
  - small_text: 10px「65歳以上単独世帯」
  - small_text: 10px「高齢夫婦のみ世帯」
  - small_text: 10px「※」
  - small_text: 10px「※」
- `/areas/02000`
  - internal_jargon: 保存則 ×3
- `/areas/03000`
  - internal_jargon: 保存則 ×3
- `/areas/04000`
  - internal_jargon: 保存則 ×3
- `/areas/05000`
  - internal_jargon: 保存則 ×3
- `/areas/06000`
  - internal_jargon: 保存則 ×3
- `/areas/07000`
  - internal_jargon: 保存則 ×3
  - degraded_image: https://storage.stats47.jp/app/areas/07000/specialty/nameko.webp (HTTP 404)
- `/areas/08000`
  - internal_jargon: 保存則 ×3
- `/areas/09000`
  - internal_jargon: 保存則 ×3
- `/areas/10000`
  - internal_jargon: 保存則 ×3
  - degraded_image: https://storage.stats47.jp/app/areas/10000/specialty/brix-nine.webp (HTTP 404)
  - degraded_image: https://storage.stats47.jp/app/areas/10000/specialty/aka-imo.webp (HTTP 404)
- `/areas/11000`
  - internal_jargon: 保存則 ×3
- `/areas/12000`
  - internal_jargon: 保存則 ×3
  - degraded_image: https://storage.stats47.jp/app/areas/12000/specialty/tomisato-suika.webp (HTTP 404)
  - degraded_image: https://storage.stats47.jp/app/areas/12000/specialty/shiro-takenoko.webp (HTTP 404)
  - degraded_image: https://storage.stats47.jp/app/areas/12000/specialty/mineoka-gyunyu.webp (HTTP 404)
- `/areas/13000`
  - internal_jargon: 保存則 ×3
  - small_text: 10px「15歳未満」
  - small_text: 10px「15〜64歳」
  - small_text: 10px「65歳以上」
  - small_text: 10px「高齢化率（65歳以上）」
  - small_text: 10px「年少人口割合（15歳未満）」
  - small_text: 10px「65歳以上世帯員のいる世帯」
  - small_text: 10px「65歳以上単独世帯」
  - small_text: 10px「高齢夫婦のみ世帯」
  - small_text: 10px「※」
  - small_text: 10px「※」
- `/areas/14000`
  - internal_jargon: 保存則 ×3
- `/areas/15000`
  - internal_jargon: 保存則 ×3
- `/areas/16000`
  - internal_jargon: 保存則 ×3
- `/areas/17000`
  - internal_jargon: 保存則 ×3
- `/areas/18000`
  - internal_jargon: 保存則 ×3
- `/areas/19000`
  - internal_jargon: 保存則 ×3
  - degraded_image: https://storage.stats47.jp/app/areas/19000/specialty/yugao.webp (HTTP 404)
- `/areas/20000`
  - internal_jargon: 保存則 ×3
- `/areas/21000`
  - internal_jargon: 保存則 ×3
- `/areas/22000`
  - internal_jargon: 保存則 ×3
  - degraded_image: https://storage.stats47.jp/app/areas/22000/specialty/midori-mai.webp (HTTP 404)
  - degraded_image: https://storage.stats47.jp/app/areas/22000/specialty/kajiki.webp (HTTP 404)
  - degraded_image: https://storage.stats47.jp/app/areas/22000/specialty/me-kyabetsu.webp (HTTP 404)
- `/areas/23000`
  - internal_jargon: 保存則 ×3
- `/areas/24000`
  - internal_jargon: 保存則 ×3
  - degraded_image: https://storage.stats47.jp/app/areas/24000/specialty/ise-hijiki.webp (HTTP 404)
  - degraded_image: https://storage.stats47.jp/app/areas/24000/specialty/ao-sanori.webp (HTTP 404)
- `/areas/25000`
  - internal_jargon: 保存則 ×3
- `/areas/26000`
  - internal_jargon: 保存則 ×3
- ほか 3048 URL (latest.json の ui_findings を参照)
