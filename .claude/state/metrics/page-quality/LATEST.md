# ページ品質監査 Latest — 2026-09-24

- モード: full / 対象 6229 URL / commit 121cbd9dbca42c5f4bb7bb1e66875f4effeb3974
- 違反: **error 2896 / warning 4397**

## テンプレート別集計

| テンプレート | URL数 | error | warning |
|---|---|---|---|
| home | 1 | 1 | 3 |
| ranking | 2170 | 673 | 2771 |
| prefecture-list | 1 | 0 | 1 |
| theme | 56 | 32 | 32 |
| geo-analysis | 71 | 54 | 6 |
| other | 307 | 3 | 42 |
| prefecture-detail | 2491 | 1458 | 1328 |
| blog | 606 | 606 | 112 |
| category | 17 | 11 | 10 |
| survey | 148 | 58 | 91 |
| municipality | 361 | 0 | 1 |

## 違反の詳細

上位 100 件 (error を先に) / 全 7293 件。全件は R2 `state/page-quality/latest.json` (`npm run state:pull -- page-quality`)。

| URL | metric | 実測 | 前回 | 閾値 | 種別 |
|---|---|---|---|---|---|
| `/` | duplicate_link_ratio (absolute) | 0.4134 | - | <= 0.3 | 🚨 |
| `/ranking` | duplicate_link_ratio (absolute) | 0.3125 | - | <= 0.3 | 🚨 |
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
| `/themes/healthcare` | duplicate_link_ratio (absolute) | 0.5476 | - | <= 0.3 | 🚨 |
| `/themes/safety` | duplicate_link_ratio (absolute) | 0.505 | - | <= 0.3 | 🚨 |
| `/themes/education-culture` | duplicate_link_ratio (absolute) | 0.4854 | - | <= 0.3 | 🚨 |
| `/themes/tourism` | duplicate_link_ratio (absolute) | 0.3846 | - | <= 0.3 | 🚨 |
| `/themes/consumer-prices` | duplicate_link_ratio (absolute) | 0.358 | - | <= 0.3 | 🚨 |
| `/themes/occupation-salary` | duplicate_link_ratio (absolute) | 0.3756 | - | <= 0.3 | 🚨 |
| `/themes/real-income` | duplicate_link_ratio (absolute) | 0.3892 | - | <= 0.3 | 🚨 |
| `/themes/labor-mobility` | duplicate_link_ratio (absolute) | 0.4519 | - | <= 0.3 | 🚨 |
| `/themes/local-finance` | duplicate_link_ratio (absolute) | 0.3478 | - | <= 0.3 | 🚨 |
| `/themes/fishery-marine` | duplicate_link_ratio (absolute) | 0.3459 | - | <= 0.3 | 🚨 |
| `/themes/roads` | duplicate_link_ratio (absolute) | 0.3371 | - | <= 0.3 | 🚨 |
| `/themes/climate` | duplicate_link_ratio (absolute) | 0.3125 | - | <= 0.3 | 🚨 |
| `/themes/construction-industry` | duplicate_link_ratio (absolute) | 0.3774 | - | <= 0.3 | 🚨 |
| `/themes/agriculture-production` | duplicate_link_ratio (absolute) | 0.3677 | - | <= 0.3 | 🚨 |
| `/themes/forestry-timber` | duplicate_link_ratio (absolute) | 0.4181 | - | <= 0.3 | 🚨 |
| `/themes/local-services` | duplicate_link_ratio (absolute) | 0.419 | - | <= 0.3 | 🚨 |
| `/themes/business-demography` | duplicate_link_ratio (absolute) | 0.3083 | - | <= 0.3 | 🚨 |
| `/themes/single-parent-households` | duplicate_link_ratio (absolute) | 0.3099 | - | <= 0.3 | 🚨 |
| `/themes/health-checkups` | duplicate_link_ratio (absolute) | 0.3423 | - | <= 0.3 | 🚨 |
| `/themes/daily-time-use` | duplicate_link_ratio (absolute) | 0.3158 | - | <= 0.3 | 🚨 |
| `/themes/water-services` | duplicate_link_ratio (absolute) | 0.3357 | - | <= 0.3 | 🚨 |
| `/themes/regional-energy` | duplicate_link_ratio (absolute) | 0.4104 | - | <= 0.3 | 🚨 |
| `/themes/environmental-quality` | duplicate_link_ratio (absolute) | 0.4286 | - | <= 0.3 | 🚨 |
| `/themes/cultural-participation` | duplicate_link_ratio (absolute) | 0.3517 | - | <= 0.3 | 🚨 |
| `/themes/sports-participation` | duplicate_link_ratio (absolute) | 0.3832 | - | <= 0.3 | 🚨 |
| `/themes/gender-participation` | duplicate_link_ratio (absolute) | 0.3165 | - | <= 0.3 | 🚨 |
| `/areas/01000/population-dynamics` | duplicate_link_ratio (absolute) | 0.496 | - | <= 0.3 | 🚨 |
| `/areas/01000/aging-society` | duplicate_link_ratio (absolute) | 0.3736 | - | <= 0.3 | 🚨 |
| `/areas/01000/living-housing` | duplicate_link_ratio (absolute) | 0.5331 | - | <= 0.3 | 🚨 |
| `/areas/01000/local-economy` | duplicate_link_ratio (absolute) | 0.3939 | - | <= 0.3 | 🚨 |
| `/areas/01000/labor-wages` | duplicate_link_ratio (absolute) | 0.3563 | - | <= 0.3 | 🚨 |
| `/areas/01000/manufacturing` | duplicate_link_ratio (absolute) | 0.3439 | - | <= 0.3 | 🚨 |
| `/areas/01000/healthcare` | duplicate_link_ratio (absolute) | 0.5515 | - | <= 0.3 | 🚨 |
| `/areas/01000/safety` | duplicate_link_ratio (absolute) | 0.5085 | - | <= 0.3 | 🚨 |
| `/areas/01000/education-culture` | duplicate_link_ratio (absolute) | 0.4762 | - | <= 0.3 | 🚨 |
| `/areas/01000/tourism` | duplicate_link_ratio (absolute) | 0.3864 | - | <= 0.3 | 🚨 |
| `/areas/01000/consumer-prices` | duplicate_link_ratio (absolute) | 0.359 | - | <= 0.3 | 🚨 |
| `/areas/01000/occupation-salary` | duplicate_link_ratio (absolute) | 0.3769 | - | <= 0.3 | 🚨 |

## 代表URLのスクショ (先週比の変化)

| テンプレート | 端末 | 先週比 | スクショ |
|---|---|---|---|
| home | mobile-390 | 0% | [home-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/home-mobile-390.webp) |
| home | sm-640 | 0% | [home-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/home-sm-640.png) |
| home | tablet-768 | 0% | [home-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/home-tablet-768.webp) |
| home | rail-992 | 0% | [home-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/home-rail-992.png) |
| home | laptop-1024 | 0% | [home-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/home-laptop-1024.png) |
| home | desktop-1440 | 0% | [home-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/home-desktop-1440.webp) |
| home | wide-1920 | 0% | [home-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/home-wide-1920.png) |
| prefecture-list | mobile-390 | 0% | [prefecture-list-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/prefecture-list-mobile-390.webp) |
| prefecture-list | sm-640 | 0% | [prefecture-list-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-list-sm-640.png) |
| prefecture-list | tablet-768 | 0% | [prefecture-list-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/prefecture-list-tablet-768.webp) |
| prefecture-list | rail-992 | 0% | [prefecture-list-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-list-rail-992.png) |
| prefecture-list | laptop-1024 | 0% | [prefecture-list-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-list-laptop-1024.png) |
| prefecture-list | desktop-1440 | 0% | [prefecture-list-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/prefecture-list-desktop-1440.webp) |
| prefecture-list | wide-1920 | 0% | [prefecture-list-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-list-wide-1920.png) |
| geo-analysis | mobile-390 | 0% | [geo-analysis-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/geo-analysis-mobile-390.webp) |
| geo-analysis | sm-640 | 0% | [geo-analysis-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis-sm-640.png) |
| geo-analysis | tablet-768 | 0% | [geo-analysis-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/geo-analysis-tablet-768.webp) |
| geo-analysis | rail-992 | 0% | [geo-analysis-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis-rail-992.png) |
| geo-analysis | laptop-1024 | 0% | [geo-analysis-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis-laptop-1024.png) |
| geo-analysis | desktop-1440 | 0% | [geo-analysis-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/geo-analysis-desktop-1440.webp) |
| geo-analysis | wide-1920 | 0% | [geo-analysis-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis-wide-1920.png) |
| theme | mobile-390 | 8% | [theme-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/theme-mobile-390.webp) |
| theme | sm-640 | 4% | [theme-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme-sm-640.png) |
| theme | tablet-768 | 5% | [theme-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/theme-tablet-768.webp) |
| theme | rail-992 | 2% | [theme-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme-rail-992.png) |
| theme | laptop-1024 | 2% | [theme-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme-laptop-1024.png) |
| theme | desktop-1440 | 5% | [theme-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/theme-desktop-1440.webp) |
| theme | wide-1920 | 4% | [theme-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme-wide-1920.png) |
| prefecture-detail | mobile-390 | 0% | [prefecture-detail-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/prefecture-detail-mobile-390.webp) |
| prefecture-detail | sm-640 | 0% | [prefecture-detail-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail-sm-640.png) |
| prefecture-detail | tablet-768 | 0% | [prefecture-detail-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/prefecture-detail-tablet-768.webp) |
| prefecture-detail | rail-992 | 0% | [prefecture-detail-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail-rail-992.png) |
| prefecture-detail | laptop-1024 | 0% | [prefecture-detail-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail-laptop-1024.png) |
| prefecture-detail | desktop-1440 | 0% | [prefecture-detail-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/prefecture-detail-desktop-1440.webp) |
| prefecture-detail | wide-1920 | 0% | [prefecture-detail-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail-wide-1920.png) |
| ranking | mobile-390 | 0% | [ranking-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/ranking-mobile-390.webp) |
| ranking | sm-640 | 0% | [ranking-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking-sm-640.png) |
| ranking | tablet-768 | 0% | [ranking-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/ranking-tablet-768.webp) |
| ranking | rail-992 | 0% | [ranking-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking-rail-992.png) |
| ranking | laptop-1024 | 0% | [ranking-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking-laptop-1024.png) |
| ranking | desktop-1440 | 0% | [ranking-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/ranking-desktop-1440.webp) |
| ranking | wide-1920 | 0% | [ranking-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking-wide-1920.png) |
| blog | mobile-390 | 0% | [blog-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/blog-mobile-390.webp) |
| blog | sm-640 | 0% | [blog-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-sm-640.png) |
| blog | tablet-768 | 0% | [blog-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/blog-tablet-768.webp) |
| blog | rail-992 | 0% | [blog-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-rail-992.png) |
| blog | laptop-1024 | 0% | [blog-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-laptop-1024.png) |
| blog | desktop-1440 | 0% | [blog-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/blog-desktop-1440.webp) |
| blog | wide-1920 | 0% | [blog-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-wide-1920.png) |
| category | mobile-390 | 0% | [category-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/category-mobile-390.webp) |
| category | sm-640 | 0% | [category-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category-sm-640.png) |
| category | tablet-768 | 0% | [category-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/category-tablet-768.webp) |
| category | rail-992 | 0% | [category-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category-rail-992.png) |
| category | laptop-1024 | 0% | [category-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category-laptop-1024.png) |
| category | desktop-1440 | 0% | [category-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/category-desktop-1440.webp) |
| category | wide-1920 | 0% | [category-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category-wide-1920.png) |
| survey | mobile-390 | 0% | [survey-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/survey-mobile-390.webp) |
| survey | sm-640 | 0% | [survey-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey-sm-640.png) |
| survey | tablet-768 | 0% | [survey-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/survey-tablet-768.webp) |
| survey | rail-992 | 0% | [survey-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey-rail-992.png) |
| survey | laptop-1024 | 0% | [survey-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey-laptop-1024.png) |
| survey | desktop-1440 | 0% | [survey-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/survey-desktop-1440.webp) |
| survey | wide-1920 | 0% | [survey-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey-wide-1920.png) |
| municipality | mobile-390 | 0% | [municipality-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/municipality-mobile-390.webp) |
| municipality | sm-640 | 0% | [municipality-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality-sm-640.png) |
| municipality | tablet-768 | 0% | [municipality-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/municipality-tablet-768.webp) |
| municipality | rail-992 | 0% | [municipality-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality-rail-992.png) |
| municipality | laptop-1024 | 0% | [municipality-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality-laptop-1024.png) |
| municipality | desktop-1440 | 0% | [municipality-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/municipality-desktop-1440.webp) |
| municipality | wide-1920 | 0% | [municipality-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality-wide-1920.png) |
| other | mobile-390 | 0% | [other-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/other-mobile-390.webp) |
| other | sm-640 | 0% | [other-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other-sm-640.png) |
| other | tablet-768 | 0% | [other-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/other-tablet-768.webp) |
| other | rail-992 | 0% | [other-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other-rail-992.png) |
| other | laptop-1024 | 0% | [other-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other-laptop-1024.png) |
| other | desktop-1440 | 0% | [other-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-24/other-desktop-1440.webp) |
| other | wide-1920 | 0% | [other-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other-wide-1920.png) |

## UI 指摘の場所

- `/`
  - overlapping_tap_target: a.rounded-none.border.bg-card "漁業就業者数が最も多い県は？1位北海道19,938人2023年" ⇄ button.inline-flex.items-center.justify-center
  - overlapping_tap_target: a.rounded-none.border.bg-card "学力トップは東京｜なぜ都市部と北陸が並ぶ?統計ブログ" ⇄ button.inline-flex.items-center.justify-center
  - overlapping_tap_target: a.rounded-none.border.bg-card "子育て・教育で選びたい教育環境や文化資源を都道府県で比較する" ⇄ button.inline-flex.items-center.justify-center
  - responsive@sm-640 overlapping_tap_target: a.rounded-none.border.bg-card "漁業就業者数が最も多い県は？1位北海道19,938人2023年" ⇄ button.inline-flex.items-center.justify-center
  - responsive@sm-640 overlapping_tap_target: a.rounded-none.border.bg-card "学力トップは東京｜なぜ都市部と北陸が並ぶ?統計ブログ" ⇄ button.inline-flex.items-center.justify-center
  - responsive@sm-640 overlapping_tap_target: a.rounded-none.border.bg-card "子育て・教育で選びたい教育環境や文化資源を都道府県で比較する" ⇄ button.inline-flex.items-center.justify-center
  - responsive@tablet-768 overlapping_tap_target: a.rounded-none.border.bg-card "漁業就業者数が最も多い県は？1位北海道19,938人2023年" ⇄ button.inline-flex.items-center.justify-center
  - responsive@tablet-768 overlapping_tap_target: a.rounded-none.border.bg-card "学力トップは東京｜なぜ都市部と北陸が並ぶ?統計ブログ" ⇄ button.inline-flex.items-center.justify-center
  - responsive@tablet-768 overlapping_tap_target: a.rounded-none.border.bg-card "子育て・教育で選びたい教育環境や文化資源を都道府県で比較する" ⇄ button.inline-flex.items-center.justify-center
  - responsive@rail-992 overlapping_tap_target: a.rounded-none.border.bg-card "漁業就業者数が最も多い県は？1位北海道19,938人2023年" ⇄ button.inline-flex.items-center.justify-center
  - responsive@rail-992 overlapping_tap_target: a.rounded-none.border.bg-card "学力トップは東京｜なぜ都市部と北陸が並ぶ?統計ブログ" ⇄ button.inline-flex.items-center.justify-center
  - responsive@rail-992 overlapping_tap_target: a.rounded-none.border.bg-card "子育て・教育で選びたい教育環境や文化資源を都道府県で比較する" ⇄ button.inline-flex.items-center.justify-center
  - responsive@laptop-1024 overlapping_tap_target: a.rounded-none.border.bg-card "地方交付税が最も多い県は？1位北海道656,171,677千円2022年" ⇄ button.inline-flex.items-center.justify-center
  - responsive@laptop-1024 overlapping_tap_target: a.rounded-none.border.bg-card "進学率だけでは分からない、堅実な県はどこ統計ブログ" ⇄ button.inline-flex.items-center.justify-center
  - responsive@laptop-1024 overlapping_tap_target: a.rounded-none.border.bg-card "年収と物価を比べたい名目と実質の所得・購買力の地域差を見る" ⇄ button.inline-flex.items-center.justify-center
  - responsive@desktop-1440 overlapping_tap_target: a.rounded-none.border.bg-card "精神病床数が最も多い県は？1位東京都20,665床2023年" ⇄ button.inline-flex.items-center.justify-center
  - responsive@desktop-1440 overlapping_tap_target: a.rounded-none.border.bg-card "エンゲル係数で県の豊かさは測れない統計ブログ" ⇄ button.inline-flex.items-center.justify-center
  - responsive@desktop-1440 overlapping_tap_target: a.rounded-none.border.bg-card "高齢化の実態を知りたい高齢化率と社会構造の変化を地域で確かめる" ⇄ button.inline-flex.items-center.justify-center
  - responsive@wide-1920 overlapping_tap_target: a.rounded-none.border.bg-card "精神病床数が最も多い県は？1位東京都20,665床2023年" ⇄ button.inline-flex.items-center.justify-center
  - responsive@wide-1920 overlapping_tap_target: a.rounded-none.border.bg-card "エンゲル係数で県の豊かさは測れない統計ブログ" ⇄ button.inline-flex.items-center.justify-center
  - responsive@wide-1920 overlapping_tap_target: a.rounded-none.border.bg-card "高齢化の実態を知りたい高齢化率と社会構造の変化を地域で確かめる" ⇄ button.inline-flex.items-center.justify-center
- `/themes/population-dynamics`
  - responsive@sm-640 clipped_text: div.h-[360px].lg:h-[400px].overflow-hidden "+−-18.76.6 ‰ Leaflet \| 国土地理院"
  - responsive@tablet-768 clipped_text: div.h-[360px].lg:h-[400px].overflow-hidden "+−-18.76.6 ‰ Leaflet \| 国土地理院"
  - responsive@rail-992 clipped_text: div.h-[360px].lg:h-[400px].overflow-hidden "+−-18.76.6 ‰ Leaflet \| 国土地理院"
- `/areas/07000`
  - degraded_image: https://storage.stats47.jp/app/areas/07000/specialty/nameko.webp (HTTP 404)
- `/areas/10000`
  - degraded_image: https://storage.stats47.jp/app/areas/10000/specialty/brix-nine.webp (HTTP 404)
  - degraded_image: https://storage.stats47.jp/app/areas/10000/specialty/aka-imo.webp (HTTP 404)
- `/areas/12000`
  - degraded_image: https://storage.stats47.jp/app/areas/12000/specialty/tomisato-suika.webp (HTTP 404)
  - degraded_image: https://storage.stats47.jp/app/areas/12000/specialty/shiro-takenoko.webp (HTTP 404)
  - degraded_image: https://storage.stats47.jp/app/areas/12000/specialty/mineoka-gyunyu.webp (HTTP 404)
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
- `/ranking/total-population`
  - a11y: button-name (critical, 1 箇所)
  - a11y: nested-interactive (serious, 1 箇所)
- `/category/population`
  - overlapping_tap_target: a.rounded-none.border.bg-card "日本人人口1位東京都13,463,000人2024年" ⇄ button.inline-flex.items-center.justify-center
  - overlapping_tap_target: a.rounded-none.border.bg-card "人口性比100の境界をどう読み解くか統計ブログ" ⇄ button.inline-flex.items-center.justify-center
  - responsive@sm-640 overlapping_tap_target: a.rounded-none.border.bg-card "日本人人口1位東京都13,463,000人2024年" ⇄ button.inline-flex.items-center.justify-center
  - responsive@sm-640 overlapping_tap_target: a.rounded-none.border.bg-card "人口性比100の境界をどう読み解くか統計ブログ" ⇄ button.inline-flex.items-center.justify-center
  - responsive@tablet-768 overlapping_tap_target: a.rounded-none.border.bg-card "日本人人口1位東京都13,463,000人2024年" ⇄ button.inline-flex.items-center.justify-center
  - responsive@tablet-768 overlapping_tap_target: a.rounded-none.border.bg-card "人口性比100の境界をどう読み解くか統計ブログ" ⇄ button.inline-flex.items-center.justify-center
  - responsive@rail-992 overlapping_tap_target: a.rounded-none.border.bg-card "日本人人口1位東京都13,463,000人2024年" ⇄ button.inline-flex.items-center.justify-center
  - responsive@rail-992 overlapping_tap_target: a.rounded-none.border.bg-card "人口性比100の境界をどう読み解くか統計ブログ" ⇄ button.inline-flex.items-center.justify-center
  - responsive@laptop-1024 overlapping_tap_target: a.rounded-none.border.bg-card "共働き世帯割合1位福井県34.69％2020年" ⇄ button.inline-flex.items-center.justify-center
  - responsive@laptop-1024 overlapping_tap_target: a.rounded-none.border.bg-card "共働き世帯が多い県ほど部屋数も多いのはなぜ？統計ブログ" ⇄ button.inline-flex.items-center.justify-center
  - responsive@desktop-1440 overlapping_tap_target: a.rounded-none.border.bg-card "出生数1位東京都86,348人2023年" ⇄ button.inline-flex.items-center.justify-center
  - responsive@desktop-1440 overlapping_tap_target: a.rounded-none.border.bg-card "外国人が多い街は大都市とは限らない統計ブログ" ⇄ button.inline-flex.items-center.justify-center
  - responsive@wide-1920 overlapping_tap_target: a.rounded-none.border.bg-card "出生数1位東京都86,348人2023年" ⇄ button.inline-flex.items-center.justify-center
  - responsive@wide-1920 overlapping_tap_target: a.rounded-none.border.bg-card "外国人が多い街は大都市とは限らない統計ブログ" ⇄ button.inline-flex.items-center.justify-center
- `/survey/census`
  - a11y: button-name (critical, 1 箇所)
