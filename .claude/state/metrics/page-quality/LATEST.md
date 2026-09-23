# ページ品質監査 Latest — 2026-09-23

- モード: full / 対象 6229 URL / commit 113b0485d50cebb1432c7b37c5ec16ff9eb257d1
- 違反: **error 2898 / warning 4393**

## テンプレート別集計

| テンプレート | URL数 | error | warning |
|---|---|---|---|
| home | 1 | 1 | 2 |
| ranking | 2170 | 677 | 2768 |
| prefecture-list | 1 | 0 | 1 |
| theme | 56 | 32 | 31 |
| geo-analysis | 71 | 54 | 6 |
| other | 307 | 3 | 42 |
| prefecture-detail | 2491 | 1456 | 1330 |
| blog | 606 | 606 | 112 |
| category | 17 | 11 | 9 |
| survey | 148 | 58 | 91 |
| municipality | 361 | 0 | 1 |

## 違反の詳細

上位 100 件 (error を先に) / 全 7291 件。全件は R2 `state/page-quality/latest.json` (`npm run state:pull -- page-quality`)。

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
| home | mobile | 比較元なし | [home-mobile.png](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-23/home-mobile.png) |
| home | desktop | 比較元なし | [home-desktop.png](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-23/home-desktop.png) |
| prefecture-list | mobile | 比較元なし | [prefecture-list-mobile.png](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-23/prefecture-list-mobile.png) |
| prefecture-list | desktop | 比較元なし | [prefecture-list-desktop.png](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-23/prefecture-list-desktop.png) |
| geo-analysis | mobile | 比較元なし | [geo-analysis-mobile.png](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-23/geo-analysis-mobile.png) |
| geo-analysis | desktop | 比較元なし | [geo-analysis-desktop.png](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-23/geo-analysis-desktop.png) |
| theme | mobile | 比較元なし | [theme-mobile.png](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-23/theme-mobile.png) |
| theme | desktop | 比較元なし | [theme-desktop.png](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-23/theme-desktop.png) |
| prefecture-detail | mobile | 比較元なし | [prefecture-detail-mobile.png](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-23/prefecture-detail-mobile.png) |
| prefecture-detail | desktop | 比較元なし | [prefecture-detail-desktop.png](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-23/prefecture-detail-desktop.png) |
| ranking | mobile | 比較元なし | [ranking-mobile.png](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-23/ranking-mobile.png) |
| ranking | desktop | 比較元なし | [ranking-desktop.png](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-23/ranking-desktop.png) |
| blog | mobile | 比較元なし | [blog-mobile.png](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-23/blog-mobile.png) |
| blog | desktop | 比較元なし | [blog-desktop.png](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-23/blog-desktop.png) |
| category | mobile | 比較元なし | [category-mobile.png](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-23/category-mobile.png) |
| category | desktop | 比較元なし | [category-desktop.png](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-23/category-desktop.png) |
| survey | mobile | 比較元なし | [survey-mobile.png](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-23/survey-mobile.png) |
| survey | desktop | 比較元なし | [survey-desktop.png](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-23/survey-desktop.png) |
| municipality | mobile | 比較元なし | [municipality-mobile.png](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-23/municipality-mobile.png) |
| municipality | desktop | 比較元なし | [municipality-desktop.png](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-23/municipality-desktop.png) |
| other | mobile | 比較元なし | [other-mobile.png](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-23/other-mobile.png) |
| other | desktop | 比較元なし | [other-desktop.png](https://storage.stats47.jp/state/page-quality/screenshots/2026-09-23/other-desktop.png) |

## UI 指摘の場所

- `/`
  - overlapping_tap_target: a.rounded-none.border.bg-card "漁業就業者数が最も多い県は？1位北海道19,938人2023年" ⇄ button.inline-flex.items-center.justify-center
  - overlapping_tap_target: a.rounded-none.border.bg-card "学力トップは東京｜なぜ都市部と北陸が並ぶ?統計ブログ" ⇄ button.inline-flex.items-center.justify-center
  - overlapping_tap_target: a.rounded-none.border.bg-card "子育て・教育で選びたい教育環境や文化資源を都道府県で比較する" ⇄ button.inline-flex.items-center.justify-center
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
- `/survey/census`
  - a11y: button-name (critical, 1 箇所)
