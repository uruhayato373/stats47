# ページ品質監査 Latest — 2026-11-13

- モード: full / 対象 9535 URL / commit 830b0ef06756e6c7c2b734b9e75dff617c121e64
- 違反: **error 910 / warning 4410**

## テンプレート別集計

| テンプレート | URL数 | error | warning |
|---|---|---|---|
| home | 1 | 0 | 4 |
| ranking | 2597 | 0 | 359 |
| prefecture-list | 1 | 0 | 2 |
| theme | 57 | 2 | 102 |
| geo-analysis | 238 | 53 | 15 |
| other | 1334 | 690 | 117 |
| prefecture-detail | 2538 | 58 | 703 |
| blog | 1 | 0 | 3 |
| blog-article | 861 | 95 | 1275 |
| category | 17 | 9 | 24 |
| survey | 149 | 3 | 93 |
| municipality | 1741 | 0 | 1713 |

## 違反の詳細

上位 100 件 (error を先に) / 全 5320 件。全件は R2 `state/page-quality/latest.json` (`npm run state:pull -- page-quality`)。

| URL | metric | 実測 | 前回 | 閾値 | 種別 |
|---|---|---|---|---|---|
| `/themes` | duplicate_link_ratio (absolute) | 0.4177 | - | <= 0.3 | 🚨 |
| `/geo` | console_errors (absolute) | 3 | - | <= 0 | 🚨 |
| `/geo` | page_errors (absolute) | 3 | - | <= 0 | 🚨 |
| `/geo/layers/population-mesh` | console_errors (absolute) | 1 | - | <= 0 | 🚨 |
| `/geo/datasets/G04-a` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/L01` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/L02` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/L03-a` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/W09` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A16` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A17` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A22` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A31b` | duplicate_link_ratio (absolute) | 0.3175 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A38` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/N03` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/P04` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/P05` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/P11` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/P29` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/P36` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/C28` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/N02` | duplicate_link_ratio (absolute) | 0.3128 | - | <= 0.3 | 🚨 |
| `/geo/datasets/N07` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/S12` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/mesh1000r6` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A03` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A09` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A18` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A19` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A23` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A24` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A25` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A30a5` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A31a` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A42` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A43` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A44` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A45` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A51` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A52` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A53` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A54` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A55` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/G04-c` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/G04-d` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/G08` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/L03-b` | duplicate_link_ratio (absolute) | 0.3128 | - | <= 0.3 | 🚨 |
| `/geo/datasets/L03-b-c` | duplicate_link_ratio (absolute) | 0.3128 | - | <= 0.3 | 🚨 |
| `/geo/datasets/L03-b-u` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/N08` | duplicate_link_ratio (absolute) | 0.3128 | - | <= 0.3 | 🚨 |
| `/geo/datasets/S05-d` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/S10a` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/m250r6` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/geo/datasets/m500r6` | duplicate_link_ratio (absolute) | 0.3143 | - | <= 0.3 | 🚨 |
| `/products` | rsc_bytes (delta_pct) | 33.5 | 154269 | <= 30 | 🚨 |
| `/themes/local-finance` | html_bytes (delta_pct) | 35 | 866160 | <= 30 | 🚨 |
| `/areas/47000` | page_errors (absolute) | 1 | - | <= 0 | 🚨 |
| `/areas/01000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/02000/population-dynamics` | http_status (absolute) | -1 | - | < 400 | 🚨 |
| `/areas/02000/healthcare` | http_status (absolute) | -1 | - | < 400 | 🚨 |
| `/areas/02000/safety` | http_status (absolute) | -1 | - | < 400 | 🚨 |
| `/areas/02000/occupation-salary` | http_status (absolute) | -1 | - | < 400 | 🚨 |
| `/areas/02000/single-parent-households` | http_status (absolute) | -1 | - | < 400 | 🚨 |
| `/areas/02000/geographic-access` | http_status (absolute) | -1 | - | < 400 | 🚨 |
| `/areas/02000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/03000/labor-wages` | http_status (absolute) | -1 | - | < 400 | 🚨 |
| `/areas/03000/innovation-patents` | http_status (absolute) | -1 | - | < 400 | 🚨 |
| `/areas/03000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/04000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/05000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/06000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/07000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/08000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/09000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/10000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/11000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/12000/aging-society` | http_status (absolute) | -1 | - | < 400 | 🚨 |
| `/areas/12000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/13000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/14000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/15000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/16000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/17000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/18000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/19000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/20000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/21000/water-services` | http_status (absolute) | -1 | - | < 400 | 🚨 |
| `/areas/21000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/22000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/23000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/24000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/25000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/26000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/27000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/28000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/29000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/30000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/31000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/32000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/33000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |

## 代表URLのスクショ (先週比の変化)

| テンプレート | 端末 | 先週比 | スクショ |
|---|---|---|---|
| home | mobile-390 | 13% | [home-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/home-mobile-390.webp) |
| home | sm-640 | 13% | [home-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/home-sm-640.png) |
| home | tablet-768 | 12% | [home-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/home-tablet-768.webp) |
| home | rail-992 | 13% | [home-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/home-rail-992.png) |
| home | laptop-1024 | 12% | [home-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/home-laptop-1024.png) |
| home | desktop-1440 | 10% | [home-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/home-desktop-1440.webp) |
| home | wide-1920 | 11% | [home-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/home-wide-1920.png) |
| ranking | mobile-390 | 0% | [ranking--index-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/ranking--index-mobile-390.webp) |
| ranking | sm-640 | 1% | [ranking--index-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--index-sm-640.png) |
| ranking | tablet-768 | 8% | [ranking--index-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/ranking--index-tablet-768.webp) |
| ranking | rail-992 | 2% | [ranking--index-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--index-rail-992.png) |
| ranking | laptop-1024 | 1% | [ranking--index-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--index-laptop-1024.png) |
| ranking | desktop-1440 | 2% | [ranking--index-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/ranking--index-desktop-1440.webp) |
| ranking | wide-1920 | 2% | [ranking--index-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--index-wide-1920.png) |
| prefecture-list | mobile-390 | 5% | [prefecture-list-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/prefecture-list-mobile-390.webp) |
| prefecture-list | sm-640 | 3% | [prefecture-list-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-list-sm-640.png) |
| prefecture-list | tablet-768 | 1% | [prefecture-list-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/prefecture-list-tablet-768.webp) |
| prefecture-list | rail-992 | 1% | [prefecture-list-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-list-rail-992.png) |
| prefecture-list | laptop-1024 | 1% | [prefecture-list-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-list-laptop-1024.png) |
| prefecture-list | desktop-1440 | 13% | [prefecture-list-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/prefecture-list-desktop-1440.webp) |
| prefecture-list | wide-1920 | 13% | [prefecture-list-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-list-wide-1920.png) |
| theme | mobile-390 | 5% | [theme--index-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/theme--index-mobile-390.webp) |
| theme | sm-640 | 1% | [theme--index-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--index-sm-640.png) |
| theme | tablet-768 | 0% | [theme--index-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/theme--index-tablet-768.webp) |
| theme | rail-992 | 0% | [theme--index-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--index-rail-992.png) |
| theme | laptop-1024 | 1% | [theme--index-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--index-laptop-1024.png) |
| theme | desktop-1440 | 7% | [theme--index-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/theme--index-desktop-1440.webp) |
| theme | wide-1920 | 9% | [theme--index-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--index-wide-1920.png) |
| geo-analysis | mobile-390 | 5% | [geo-analysis-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/geo-analysis-mobile-390.webp) |
| geo-analysis | sm-640 | 4% | [geo-analysis-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis-sm-640.png) |
| geo-analysis | tablet-768 | 4% | [geo-analysis-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/geo-analysis-tablet-768.webp) |
| geo-analysis | rail-992 | 4% | [geo-analysis-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis-rail-992.png) |
| geo-analysis | laptop-1024 | 3% | [geo-analysis-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis-laptop-1024.png) |
| geo-analysis | desktop-1440 | 3% | [geo-analysis-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/geo-analysis-desktop-1440.webp) |
| geo-analysis | wide-1920 | 2% | [geo-analysis-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis-wide-1920.png) |
| geo-analysis | mobile-390 | 2% | [geo-analysis--compare-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/geo-analysis--compare-mobile-390.webp) |
| geo-analysis | sm-640 | 2% | [geo-analysis--compare-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--compare-sm-640.png) |
| geo-analysis | tablet-768 | 1% | [geo-analysis--compare-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/geo-analysis--compare-tablet-768.webp) |
| geo-analysis | rail-992 | 1% | [geo-analysis--compare-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--compare-rail-992.png) |
| geo-analysis | laptop-1024 | 1% | [geo-analysis--compare-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--compare-laptop-1024.png) |
| geo-analysis | desktop-1440 | 1% | [geo-analysis--compare-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/geo-analysis--compare-desktop-1440.webp) |
| geo-analysis | wide-1920 | 1% | [geo-analysis--compare-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--compare-wide-1920.png) |
| geo-analysis | mobile-390 | 1% | [geo-analysis--layer-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/geo-analysis--layer-mobile-390.webp) |
| geo-analysis | sm-640 | 10% | [geo-analysis--layer-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--layer-sm-640.png) |
| geo-analysis | tablet-768 | 16% | [geo-analysis--layer-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/geo-analysis--layer-tablet-768.webp) |
| geo-analysis | rail-992 | 10% | [geo-analysis--layer-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--layer-rail-992.png) |
| geo-analysis | laptop-1024 | 9% | [geo-analysis--layer-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--layer-laptop-1024.png) |
| geo-analysis | desktop-1440 | 10% | [geo-analysis--layer-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/geo-analysis--layer-desktop-1440.webp) |
| geo-analysis | wide-1920 | 9% | [geo-analysis--layer-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--layer-wide-1920.png) |
| geo-analysis | mobile-390 | 10% | [geo-analysis--analysis-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/geo-analysis--analysis-mobile-390.webp) |
| geo-analysis | sm-640 | 10% | [geo-analysis--analysis-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-sm-640.png) |
| geo-analysis | tablet-768 | 9% | [geo-analysis--analysis-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/geo-analysis--analysis-tablet-768.webp) |
| geo-analysis | rail-992 | 10% | [geo-analysis--analysis-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-rail-992.png) |
| geo-analysis | laptop-1024 | 8% | [geo-analysis--analysis-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-laptop-1024.png) |
| geo-analysis | desktop-1440 | 8% | [geo-analysis--analysis-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/geo-analysis--analysis-desktop-1440.webp) |
| geo-analysis | wide-1920 | 7% | [geo-analysis--analysis-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-wide-1920.png) |
| geo-analysis | mobile-390 | 9% | [geo-analysis--analysis-pref-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/geo-analysis--analysis-pref-mobile-390.webp) |
| geo-analysis | sm-640 | 7% | [geo-analysis--analysis-pref-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-pref-sm-640.png) |
| geo-analysis | tablet-768 | 6% | [geo-analysis--analysis-pref-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/geo-analysis--analysis-pref-tablet-768.webp) |
| geo-analysis | rail-992 | 7% | [geo-analysis--analysis-pref-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-pref-rail-992.png) |
| geo-analysis | laptop-1024 | 6% | [geo-analysis--analysis-pref-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-pref-laptop-1024.png) |
| geo-analysis | desktop-1440 | 5% | [geo-analysis--analysis-pref-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/geo-analysis--analysis-pref-desktop-1440.webp) |
| geo-analysis | wide-1920 | 4% | [geo-analysis--analysis-pref-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-pref-wide-1920.png) |
| geo-analysis | mobile-390 | 0% | [geo-analysis--dataset-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/geo-analysis--dataset-mobile-390.webp) |
| geo-analysis | sm-640 | 0% | [geo-analysis--dataset-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--dataset-sm-640.png) |
| geo-analysis | tablet-768 | 0% | [geo-analysis--dataset-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/geo-analysis--dataset-tablet-768.webp) |
| geo-analysis | rail-992 | 0% | [geo-analysis--dataset-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--dataset-rail-992.png) |
| geo-analysis | laptop-1024 | 0% | [geo-analysis--dataset-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--dataset-laptop-1024.png) |
| geo-analysis | desktop-1440 | 0% | [geo-analysis--dataset-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/geo-analysis--dataset-desktop-1440.webp) |
| geo-analysis | wide-1920 | 0% | [geo-analysis--dataset-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--dataset-wide-1920.png) |
| other | mobile-390 | 3% | [other--about-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--about-mobile-390.webp) |
| other | sm-640 | 3% | [other--about-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--about-sm-640.png) |
| other | tablet-768 | 3% | [other--about-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--about-tablet-768.webp) |
| other | rail-992 | 3% | [other--about-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--about-rail-992.png) |
| other | laptop-1024 | 4% | [other--about-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--about-laptop-1024.png) |
| other | desktop-1440 | 3% | [other--about-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--about-desktop-1440.webp) |
| other | wide-1920 | 3% | [other--about-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--about-wide-1920.png) |
| other | mobile-390 | 8% | [other--products-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--products-mobile-390.webp) |
| other | sm-640 | 6% | [other--products-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--products-sm-640.png) |
| other | tablet-768 | 8% | [other--products-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--products-tablet-768.webp) |
| other | rail-992 | 7% | [other--products-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--products-rail-992.png) |
| other | laptop-1024 | 6% | [other--products-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--products-laptop-1024.png) |
| other | desktop-1440 | 5% | [other--products-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--products-desktop-1440.webp) |
| other | wide-1920 | 4% | [other--products-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--products-wide-1920.png) |
| other | mobile-390 | 71% | [other--product-item-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--product-item-mobile-390.webp) |
| other | sm-640 | 64% | [other--product-item-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--product-item-sm-640.png) |
| other | tablet-768 | 67% | [other--product-item-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--product-item-tablet-768.webp) |
| other | rail-992 | 67% | [other--product-item-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--product-item-rail-992.png) |
| other | laptop-1024 | 66% | [other--product-item-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--product-item-laptop-1024.png) |
| other | desktop-1440 | 68% | [other--product-item-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--product-item-desktop-1440.webp) |
| other | wide-1920 | 68% | [other--product-item-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--product-item-wide-1920.png) |
| other | mobile-390 | 比較元なし | [other--privacy-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--privacy-mobile-390.webp) |
| other | sm-640 | 比較元なし | [other--privacy-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--privacy-sm-640.png) |
| other | tablet-768 | 比較元なし | [other--privacy-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--privacy-tablet-768.webp) |
| other | rail-992 | 比較元なし | [other--privacy-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--privacy-rail-992.png) |
| other | laptop-1024 | 比較元なし | [other--privacy-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--privacy-laptop-1024.png) |
| other | desktop-1440 | 比較元なし | [other--privacy-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--privacy-desktop-1440.webp) |
| other | wide-1920 | 比較元なし | [other--privacy-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--privacy-wide-1920.png) |
| other | mobile-390 | 比較元なし | [other--terms-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--terms-mobile-390.webp) |
| other | sm-640 | 比較元なし | [other--terms-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--terms-sm-640.png) |
| other | tablet-768 | 比較元なし | [other--terms-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--terms-tablet-768.webp) |
| other | rail-992 | 比較元なし | [other--terms-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--terms-rail-992.png) |
| other | laptop-1024 | 比較元なし | [other--terms-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--terms-laptop-1024.png) |
| other | desktop-1440 | 比較元なし | [other--terms-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--terms-desktop-1440.webp) |
| other | wide-1920 | 比較元なし | [other--terms-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--terms-wide-1920.png) |
| theme | mobile-390 | 10% | [theme-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/theme-mobile-390.webp) |
| theme | sm-640 | 13% | [theme-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme-sm-640.png) |
| theme | tablet-768 | 11% | [theme-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/theme-tablet-768.webp) |
| theme | rail-992 | 11% | [theme-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme-rail-992.png) |
| theme | laptop-1024 | 8% | [theme-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme-laptop-1024.png) |
| theme | desktop-1440 | 5% | [theme-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/theme-desktop-1440.webp) |
| theme | wide-1920 | 4% | [theme-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme-wide-1920.png) |
| theme | mobile-390 | 24% | [theme--real-income-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/theme--real-income-mobile-390.webp) |
| theme | sm-640 | 15% | [theme--real-income-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--real-income-sm-640.png) |
| theme | tablet-768 | 16% | [theme--real-income-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/theme--real-income-tablet-768.webp) |
| theme | rail-992 | 14% | [theme--real-income-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--real-income-rail-992.png) |
| theme | laptop-1024 | 12% | [theme--real-income-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--real-income-laptop-1024.png) |
| theme | desktop-1440 | 14% | [theme--real-income-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/theme--real-income-desktop-1440.webp) |
| theme | wide-1920 | 25% | [theme--real-income-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--real-income-wide-1920.png) |
| prefecture-detail | mobile-390 | 20% | [prefecture-detail--hokkaido-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/prefecture-detail--hokkaido-mobile-390.webp) |
| prefecture-detail | sm-640 | 14% | [prefecture-detail--hokkaido-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--hokkaido-sm-640.png) |
| prefecture-detail | tablet-768 | 18% | [prefecture-detail--hokkaido-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/prefecture-detail--hokkaido-tablet-768.webp) |
| prefecture-detail | rail-992 | 21% | [prefecture-detail--hokkaido-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--hokkaido-rail-992.png) |
| prefecture-detail | laptop-1024 | 17% | [prefecture-detail--hokkaido-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--hokkaido-laptop-1024.png) |
| prefecture-detail | desktop-1440 | 19% | [prefecture-detail--hokkaido-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/prefecture-detail--hokkaido-desktop-1440.webp) |
| prefecture-detail | wide-1920 | 18% | [prefecture-detail--hokkaido-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--hokkaido-wide-1920.png) |
| prefecture-detail | mobile-390 | 20% | [prefecture-detail-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/prefecture-detail-mobile-390.webp) |
| prefecture-detail | sm-640 | 14% | [prefecture-detail-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail-sm-640.png) |
| prefecture-detail | tablet-768 | 18% | [prefecture-detail-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/prefecture-detail-tablet-768.webp) |
| prefecture-detail | rail-992 | 20% | [prefecture-detail-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail-rail-992.png) |
| prefecture-detail | laptop-1024 | 16% | [prefecture-detail-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail-laptop-1024.png) |
| prefecture-detail | desktop-1440 | 18% | [prefecture-detail-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/prefecture-detail-desktop-1440.webp) |
| prefecture-detail | wide-1920 | 17% | [prefecture-detail-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail-wide-1920.png) |
| prefecture-detail | mobile-390 | 19% | [prefecture-detail--okinawa-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/prefecture-detail--okinawa-mobile-390.webp) |
| prefecture-detail | sm-640 | 14% | [prefecture-detail--okinawa-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--okinawa-sm-640.png) |
| prefecture-detail | tablet-768 | 17% | [prefecture-detail--okinawa-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/prefecture-detail--okinawa-tablet-768.webp) |
| prefecture-detail | rail-992 | 19% | [prefecture-detail--okinawa-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--okinawa-rail-992.png) |
| prefecture-detail | laptop-1024 | 16% | [prefecture-detail--okinawa-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--okinawa-laptop-1024.png) |
| prefecture-detail | desktop-1440 | 18% | [prefecture-detail--okinawa-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/prefecture-detail--okinawa-desktop-1440.webp) |
| prefecture-detail | wide-1920 | 16% | [prefecture-detail--okinawa-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--okinawa-wide-1920.png) |
| prefecture-detail | mobile-390 | 13% | [prefecture-detail--theme-geo-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/prefecture-detail--theme-geo-mobile-390.webp) |
| prefecture-detail | sm-640 | 12% | [prefecture-detail--theme-geo-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-geo-sm-640.png) |
| prefecture-detail | tablet-768 | 8% | [prefecture-detail--theme-geo-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/prefecture-detail--theme-geo-tablet-768.webp) |
| prefecture-detail | rail-992 | 6% | [prefecture-detail--theme-geo-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-geo-rail-992.png) |
| prefecture-detail | laptop-1024 | 6% | [prefecture-detail--theme-geo-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-geo-laptop-1024.png) |
| prefecture-detail | desktop-1440 | 5% | [prefecture-detail--theme-geo-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/prefecture-detail--theme-geo-desktop-1440.webp) |
| prefecture-detail | wide-1920 | 4% | [prefecture-detail--theme-geo-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-geo-wide-1920.png) |
| prefecture-detail | mobile-390 | 12% | [prefecture-detail--theme-population-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/prefecture-detail--theme-population-mobile-390.webp) |
| prefecture-detail | sm-640 | 10% | [prefecture-detail--theme-population-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-population-sm-640.png) |
| prefecture-detail | tablet-768 | 11% | [prefecture-detail--theme-population-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/prefecture-detail--theme-population-tablet-768.webp) |
| prefecture-detail | rail-992 | 13% | [prefecture-detail--theme-population-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-population-rail-992.png) |
| prefecture-detail | laptop-1024 | 8% | [prefecture-detail--theme-population-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-population-laptop-1024.png) |
| prefecture-detail | desktop-1440 | 4% | [prefecture-detail--theme-population-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/prefecture-detail--theme-population-desktop-1440.webp) |
| prefecture-detail | wide-1920 | 5% | [prefecture-detail--theme-population-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-population-wide-1920.png) |
| prefecture-detail | mobile-390 | 16% | [prefecture-detail--theme-care-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/prefecture-detail--theme-care-mobile-390.webp) |
| prefecture-detail | sm-640 | 11% | [prefecture-detail--theme-care-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-care-sm-640.png) |
| prefecture-detail | tablet-768 | 10% | [prefecture-detail--theme-care-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/prefecture-detail--theme-care-tablet-768.webp) |
| prefecture-detail | rail-992 | 11% | [prefecture-detail--theme-care-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-care-rail-992.png) |
| prefecture-detail | laptop-1024 | 10% | [prefecture-detail--theme-care-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-care-laptop-1024.png) |
| prefecture-detail | desktop-1440 | 8% | [prefecture-detail--theme-care-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/prefecture-detail--theme-care-desktop-1440.webp) |
| prefecture-detail | wide-1920 | 7% | [prefecture-detail--theme-care-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-care-wide-1920.png) |
| ranking | mobile-390 | 18% | [ranking--single-year-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/ranking--single-year-mobile-390.webp) |
| ranking | sm-640 | 13% | [ranking--single-year-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--single-year-sm-640.png) |
| ranking | tablet-768 | 14% | [ranking--single-year-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/ranking--single-year-tablet-768.webp) |
| ranking | rail-992 | 12% | [ranking--single-year-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--single-year-rail-992.png) |
| ranking | laptop-1024 | 9% | [ranking--single-year-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--single-year-laptop-1024.png) |
| ranking | desktop-1440 | 9% | [ranking--single-year-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/ranking--single-year-desktop-1440.webp) |
| ranking | wide-1920 | 7% | [ranking--single-year-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--single-year-wide-1920.png) |
| ranking | mobile-390 | 15% | [ranking--old-2years-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/ranking--old-2years-mobile-390.webp) |
| ranking | sm-640 | 16% | [ranking--old-2years-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--old-2years-sm-640.png) |
| ranking | tablet-768 | 15% | [ranking--old-2years-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/ranking--old-2years-tablet-768.webp) |
| ranking | rail-992 | 18% | [ranking--old-2years-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--old-2years-rail-992.png) |
| ranking | laptop-1024 | 7% | [ranking--old-2years-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--old-2years-laptop-1024.png) |
| ranking | desktop-1440 | 12% | [ranking--old-2years-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/ranking--old-2years-desktop-1440.webp) |
| ranking | wide-1920 | 11% | [ranking--old-2years-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--old-2years-wide-1920.png) |
| ranking | mobile-390 | 19% | [ranking--kakei-city-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/ranking--kakei-city-mobile-390.webp) |
| ranking | sm-640 | 14% | [ranking--kakei-city-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--kakei-city-sm-640.png) |
| ranking | tablet-768 | 13% | [ranking--kakei-city-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/ranking--kakei-city-tablet-768.webp) |
| ranking | rail-992 | 12% | [ranking--kakei-city-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--kakei-city-rail-992.png) |
| ranking | laptop-1024 | 10% | [ranking--kakei-city-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--kakei-city-laptop-1024.png) |
| ranking | desktop-1440 | 8% | [ranking--kakei-city-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/ranking--kakei-city-desktop-1440.webp) |
| ranking | wide-1920 | 8% | [ranking--kakei-city-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--kakei-city-wide-1920.png) |
| ranking | mobile-390 | 20% | [ranking--negative-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/ranking--negative-mobile-390.webp) |
| ranking | sm-640 | 15% | [ranking--negative-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--negative-sm-640.png) |
| ranking | tablet-768 | 15% | [ranking--negative-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/ranking--negative-tablet-768.webp) |
| ranking | rail-992 | 14% | [ranking--negative-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--negative-rail-992.png) |
| ranking | laptop-1024 | 8% | [ranking--negative-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--negative-laptop-1024.png) |
| ranking | desktop-1440 | 9% | [ranking--negative-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/ranking--negative-desktop-1440.webp) |
| ranking | wide-1920 | 7% | [ranking--negative-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--negative-wide-1920.png) |
| ranking | mobile-390 | 18% | [ranking--long-title-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/ranking--long-title-mobile-390.webp) |
| ranking | sm-640 | 14% | [ranking--long-title-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--long-title-sm-640.png) |
| ranking | tablet-768 | 15% | [ranking--long-title-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/ranking--long-title-tablet-768.webp) |
| ranking | rail-992 | 13% | [ranking--long-title-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--long-title-rail-992.png) |
| ranking | laptop-1024 | 10% | [ranking--long-title-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--long-title-laptop-1024.png) |
| ranking | desktop-1440 | 12% | [ranking--long-title-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/ranking--long-title-desktop-1440.webp) |
| ranking | wide-1920 | 11% | [ranking--long-title-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--long-title-wide-1920.png) |
| ranking | mobile-390 | 23% | [ranking-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/ranking-mobile-390.webp) |
| ranking | sm-640 | 16% | [ranking-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking-sm-640.png) |
| ranking | tablet-768 | 14% | [ranking-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/ranking-tablet-768.webp) |
| ranking | rail-992 | 14% | [ranking-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking-rail-992.png) |
| ranking | laptop-1024 | 13% | [ranking-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking-laptop-1024.png) |
| ranking | desktop-1440 | 10% | [ranking-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/ranking-desktop-1440.webp) |
| ranking | wide-1920 | 8% | [ranking-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking-wide-1920.png) |
| blog | mobile-390 | 44% | [blog-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/blog-mobile-390.webp) |
| blog | sm-640 | 33% | [blog-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-sm-640.png) |
| blog | tablet-768 | 46% | [blog-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/blog-tablet-768.webp) |
| blog | rail-992 | 34% | [blog-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-rail-992.png) |
| blog | laptop-1024 | 39% | [blog-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-laptop-1024.png) |
| blog | desktop-1440 | 23% | [blog-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/blog-desktop-1440.webp) |
| blog | wide-1920 | 23% | [blog-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-wide-1920.png) |
| blog-article | mobile-390 | 4% | [blog-article-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/blog-article-mobile-390.webp) |
| blog-article | sm-640 | 7% | [blog-article-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article-sm-640.png) |
| blog-article | tablet-768 | 5% | [blog-article-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/blog-article-tablet-768.webp) |
| blog-article | rail-992 | 4% | [blog-article-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article-rail-992.png) |
| blog-article | laptop-1024 | 4% | [blog-article-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article-laptop-1024.png) |
| blog-article | desktop-1440 | 4% | [blog-article-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/blog-article-desktop-1440.webp) |
| blog-article | wide-1920 | 3% | [blog-article-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article-wide-1920.png) |
| blog-article | mobile-390 | 7% | [blog-article--charts-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/blog-article--charts-mobile-390.webp) |
| blog-article | sm-640 | 11% | [blog-article--charts-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article--charts-sm-640.png) |
| blog-article | tablet-768 | 13% | [blog-article--charts-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/blog-article--charts-tablet-768.webp) |
| blog-article | rail-992 | 11% | [blog-article--charts-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article--charts-rail-992.png) |
| blog-article | laptop-1024 | 11% | [blog-article--charts-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article--charts-laptop-1024.png) |
| blog-article | desktop-1440 | 9% | [blog-article--charts-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/blog-article--charts-desktop-1440.webp) |
| blog-article | wide-1920 | 7% | [blog-article--charts-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article--charts-wide-1920.png) |
| category | mobile-390 | 13% | [category--landweather-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/category--landweather-mobile-390.webp) |
| category | sm-640 | 14% | [category--landweather-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category--landweather-sm-640.png) |
| category | tablet-768 | 13% | [category--landweather-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/category--landweather-tablet-768.webp) |
| category | rail-992 | 8% | [category--landweather-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category--landweather-rail-992.png) |
| category | laptop-1024 | 6% | [category--landweather-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category--landweather-laptop-1024.png) |
| category | desktop-1440 | 6% | [category--landweather-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/category--landweather-desktop-1440.webp) |
| category | wide-1920 | 6% | [category--landweather-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category--landweather-wide-1920.png) |
| category | mobile-390 | 9% | [category-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/category-mobile-390.webp) |
| category | sm-640 | 14% | [category-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category-sm-640.png) |
| category | tablet-768 | 11% | [category-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/category-tablet-768.webp) |
| category | rail-992 | 8% | [category-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category-rail-992.png) |
| category | laptop-1024 | 6% | [category-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category-laptop-1024.png) |
| category | desktop-1440 | 6% | [category-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/category-desktop-1440.webp) |
| category | wide-1920 | 6% | [category-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category-wide-1920.png) |
| survey | mobile-390 | 3% | [survey--index-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/survey--index-mobile-390.webp) |
| survey | sm-640 | 3% | [survey--index-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--index-sm-640.png) |
| survey | tablet-768 | 0% | [survey--index-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/survey--index-tablet-768.webp) |
| survey | rail-992 | 0% | [survey--index-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--index-rail-992.png) |
| survey | laptop-1024 | 0% | [survey--index-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--index-laptop-1024.png) |
| survey | desktop-1440 | 0% | [survey--index-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/survey--index-desktop-1440.webp) |
| survey | wide-1920 | 0% | [survey--index-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--index-wide-1920.png) |
| survey | mobile-390 | 18% | [survey-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/survey-mobile-390.webp) |
| survey | sm-640 | 13% | [survey-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey-sm-640.png) |
| survey | tablet-768 | 15% | [survey-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/survey-tablet-768.webp) |
| survey | rail-992 | 12% | [survey-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey-rail-992.png) |
| survey | laptop-1024 | 13% | [survey-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey-laptop-1024.png) |
| survey | desktop-1440 | 11% | [survey-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/survey-desktop-1440.webp) |
| survey | wide-1920 | 10% | [survey-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey-wide-1920.png) |
| survey | mobile-390 | 21% | [survey--police-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/survey--police-mobile-390.webp) |
| survey | sm-640 | 17% | [survey--police-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--police-sm-640.png) |
| survey | tablet-768 | 18% | [survey--police-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/survey--police-tablet-768.webp) |
| survey | rail-992 | 15% | [survey--police-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--police-rail-992.png) |
| survey | laptop-1024 | 16% | [survey--police-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--police-laptop-1024.png) |
| survey | desktop-1440 | 13% | [survey--police-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/survey--police-desktop-1440.webp) |
| survey | wide-1920 | 11% | [survey--police-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--police-wide-1920.png) |
| municipality | mobile-390 | 比較元なし | [municipality--designated-city-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/municipality--designated-city-mobile-390.webp) |
| municipality | sm-640 | 6% | [municipality--designated-city-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--designated-city-sm-640.png) |
| municipality | tablet-768 | 5% | [municipality--designated-city-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/municipality--designated-city-tablet-768.webp) |
| municipality | rail-992 | 4% | [municipality--designated-city-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--designated-city-rail-992.png) |
| municipality | laptop-1024 | 4% | [municipality--designated-city-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--designated-city-laptop-1024.png) |
| municipality | desktop-1440 | 3% | [municipality--designated-city-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/municipality--designated-city-desktop-1440.webp) |
| municipality | wide-1920 | 2% | [municipality--designated-city-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--designated-city-wide-1920.png) |
| municipality | mobile-390 | 6% | [municipality-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/municipality-mobile-390.webp) |
| municipality | sm-640 | 6% | [municipality-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality-sm-640.png) |
| municipality | tablet-768 | 5% | [municipality-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/municipality-tablet-768.webp) |
| municipality | rail-992 | 4% | [municipality-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality-rail-992.png) |
| municipality | laptop-1024 | 4% | [municipality-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality-laptop-1024.png) |
| municipality | desktop-1440 | 3% | [municipality-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/municipality-desktop-1440.webp) |
| municipality | wide-1920 | 2% | [municipality-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality-wide-1920.png) |
| municipality | mobile-390 | 6% | [municipality--village-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/municipality--village-mobile-390.webp) |
| municipality | sm-640 | 6% | [municipality--village-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--village-sm-640.png) |
| municipality | tablet-768 | 5% | [municipality--village-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/municipality--village-tablet-768.webp) |
| municipality | rail-992 | 4% | [municipality--village-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--village-rail-992.png) |
| municipality | laptop-1024 | 4% | [municipality--village-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--village-laptop-1024.png) |
| municipality | desktop-1440 | 3% | [municipality--village-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/municipality--village-desktop-1440.webp) |
| municipality | wide-1920 | 2% | [municipality--village-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--village-wide-1920.png) |
| other | mobile-390 | 5% | [other--japan-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--japan-mobile-390.webp) |
| other | sm-640 | 10% | [other--japan-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-sm-640.png) |
| other | tablet-768 | 10% | [other--japan-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--japan-tablet-768.webp) |
| other | rail-992 | 11% | [other--japan-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-rail-992.png) |
| other | laptop-1024 | 10% | [other--japan-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-laptop-1024.png) |
| other | desktop-1440 | 10% | [other--japan-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--japan-desktop-1440.webp) |
| other | wide-1920 | 10% | [other--japan-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-wide-1920.png) |
| other | mobile-390 | 4% | [other--municipalities-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--municipalities-mobile-390.webp) |
| other | sm-640 | 1% | [other--municipalities-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-sm-640.png) |
| other | tablet-768 | 1% | [other--municipalities-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--municipalities-tablet-768.webp) |
| other | rail-992 | 1% | [other--municipalities-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-rail-992.png) |
| other | laptop-1024 | 1% | [other--municipalities-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-laptop-1024.png) |
| other | desktop-1440 | 10% | [other--municipalities-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--municipalities-desktop-1440.webp) |
| other | wide-1920 | 10% | [other--municipalities-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-wide-1920.png) |
| other | mobile-390 | 1% | [other--municipalities-theme-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--municipalities-theme-mobile-390.webp) |
| other | sm-640 | 2% | [other--municipalities-theme-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-theme-sm-640.png) |
| other | tablet-768 | 2% | [other--municipalities-theme-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--municipalities-theme-tablet-768.webp) |
| other | rail-992 | 2% | [other--municipalities-theme-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-theme-rail-992.png) |
| other | laptop-1024 | 2% | [other--municipalities-theme-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-theme-laptop-1024.png) |
| other | desktop-1440 | 16% | [other--municipalities-theme-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--municipalities-theme-desktop-1440.webp) |
| other | wide-1920 | 18% | [other--municipalities-theme-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-theme-wide-1920.png) |
| other | mobile-390 | 27% | [other--municipalities-ranking-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--municipalities-ranking-mobile-390.webp) |
| other | sm-640 | 24% | [other--municipalities-ranking-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-ranking-sm-640.png) |
| other | tablet-768 | 23% | [other--municipalities-ranking-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--municipalities-ranking-tablet-768.webp) |
| other | rail-992 | 3% | [other--municipalities-ranking-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-ranking-rail-992.png) |
| other | laptop-1024 | 3% | [other--municipalities-ranking-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-ranking-laptop-1024.png) |
| other | desktop-1440 | 3% | [other--municipalities-ranking-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--municipalities-ranking-desktop-1440.webp) |
| other | wide-1920 | 2% | [other--municipalities-ranking-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-ranking-wide-1920.png) |
| other | mobile-390 | 4% | [other--municipalities-pref-ranking-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--municipalities-pref-ranking-mobile-390.webp) |
| other | sm-640 | 4% | [other--municipalities-pref-ranking-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-pref-ranking-sm-640.png) |
| other | tablet-768 | 4% | [other--municipalities-pref-ranking-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--municipalities-pref-ranking-tablet-768.webp) |
| other | rail-992 | 4% | [other--municipalities-pref-ranking-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-pref-ranking-rail-992.png) |
| other | laptop-1024 | 3% | [other--municipalities-pref-ranking-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-pref-ranking-laptop-1024.png) |
| other | desktop-1440 | 4% | [other--municipalities-pref-ranking-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--municipalities-pref-ranking-desktop-1440.webp) |
| other | wide-1920 | 3% | [other--municipalities-pref-ranking-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-pref-ranking-wide-1920.png) |
| other | mobile-390 | 5% | [other--municipalities-pref-ranking-tokyo-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--municipalities-pref-ranking-tokyo-mobile-390.webp) |
| other | sm-640 | 3% | [other--municipalities-pref-ranking-tokyo-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-pref-ranking-tokyo-sm-640.png) |
| other | tablet-768 | 4% | [other--municipalities-pref-ranking-tokyo-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--municipalities-pref-ranking-tokyo-tablet-768.webp) |
| other | rail-992 | 3% | [other--municipalities-pref-ranking-tokyo-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-pref-ranking-tokyo-rail-992.png) |
| other | laptop-1024 | 3% | [other--municipalities-pref-ranking-tokyo-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-pref-ranking-tokyo-laptop-1024.png) |
| other | desktop-1440 | 3% | [other--municipalities-pref-ranking-tokyo-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--municipalities-pref-ranking-tokyo-desktop-1440.webp) |
| other | wide-1920 | 2% | [other--municipalities-pref-ranking-tokyo-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-pref-ranking-tokyo-wide-1920.png) |
| other | mobile-390 | 0% | [other-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other-mobile-390.webp) |
| other | sm-640 | 1% | [other-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other-sm-640.png) |
| other | tablet-768 | 2% | [other-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other-tablet-768.webp) |
| other | rail-992 | 1% | [other-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other-rail-992.png) |
| other | laptop-1024 | 1% | [other-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other-laptop-1024.png) |
| other | desktop-1440 | 15% | [other-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other-desktop-1440.webp) |
| other | wide-1920 | 18% | [other-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other-wide-1920.png) |
| other | mobile-390 | 52% | [other--japan-theme-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--japan-theme-mobile-390.webp) |
| other | sm-640 | 44% | [other--japan-theme-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-theme-sm-640.png) |
| other | tablet-768 | 30% | [other--japan-theme-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--japan-theme-tablet-768.webp) |
| other | rail-992 | 47% | [other--japan-theme-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-theme-rail-992.png) |
| other | laptop-1024 | 13% | [other--japan-theme-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-theme-laptop-1024.png) |
| other | desktop-1440 | 38% | [other--japan-theme-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--japan-theme-desktop-1440.webp) |
| other | wide-1920 | 38% | [other--japan-theme-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-theme-wide-1920.png) |
| other | mobile-390 | 比較元なし | [other--search-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--search-mobile-390.webp) |
| other | sm-640 | 比較元なし | [other--search-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--search-sm-640.png) |
| other | tablet-768 | 比較元なし | [other--search-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--search-tablet-768.webp) |
| other | rail-992 | 比較元なし | [other--search-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--search-rail-992.png) |
| other | laptop-1024 | 比較元なし | [other--search-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--search-laptop-1024.png) |
| other | desktop-1440 | 比較元なし | [other--search-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-13/other--search-desktop-1440.webp) |
| other | wide-1920 | 比較元なし | [other--search-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--search-wide-1920.png) |

## UI 指摘の場所

- `/`
  - a11y: aria-command-name (serious, 1 箇所)
  - a11y: frame-title (serious, 1 箇所)
  - small_text: 9px「北海道」
  - small_text: 9px「青森」
  - small_text: 9px「岩手」
  - small_text: 9px「秋田」
  - small_text: 9px「宮城」
  - small_text: 9px「山形」
  - small_text: 9px「福島」
  - small_text: 9px「新潟」
  - small_text: 9px「富山」
  - small_text: 9px「石川」
- `/ranking`
  - clipped_text: div.relative.flex.w-full "stats47Toggle Sidebar{"@context":"https:"
- `/geo`
  - a11y: aria-valid-attr (critical, 1 箇所)
- `/geo/layers/population-mesh`
  - small_text: 10px「0人」
  - small_text: 10px「1〜99人」
  - small_text: 10px「100〜999人」
  - small_text: 10px「1,000〜4,999人」
  - small_text: 10px「5,000人以上」
- `/products/data-muni-manufacturing`
  - title_changed: 「市区町村別 製造品出荷額等 1980〜2023年 CSV＋境界GeoJSON（1,719自治体・最新境域の時系列） \| 統計で見る都道府県」→「市区町村別 製造品出荷額等 \| 統計で見る都道府県」
- `/products/data-p-01`
  - title_changed: 「都道府県別 人口・世帯データ 134指標｜CSV・Excel \| 統計で見る都道府県」→「都道府県別 人口・世帯データ \| 統計で見る都道府県」
- `/products/data-p-02`
  - title_changed: 「都道府県別 賃金・求人・働き方データ 107指標｜CSV・Excel \| 統計で見る都道府県」→「都道府県別 賃金・求人・働き方データ \| 統計で見る都道府県」
- `/products/data-p-03`
  - title_changed: 「都道府県別 宿泊・交通・旅行データ 44指標｜CSV・Excel \| 統計で見る都道府県」→「都道府県別 宿泊・交通・旅行データ \| 統計で見る都道府県」
- `/products/data-p-04`
  - title_changed: 「都道府県別 自治体財政・職員給与データ 119指標｜CSV・Excel \| 統計で見る都道府県」→「都道府県別 自治体財政・職員給与データ \| 統計で見る都道府県」
- `/products/data-p-05`
  - title_changed: 「都道府県別 医療・介護データ 237指標｜CSV・Excel \| 統計で見る都道府県」→「都道府県別 医療・介護データ \| 統計で見る都道府県」
- `/products/data-p-06`
  - title_changed: 「都道府県別 学校・保育・社会教育データ 244指標｜CSV・Excel \| 統計で見る都道府県」→「都道府県別 学校・保育・社会教育データ \| 統計で見る都道府県」
- `/products/data-p-07`
  - title_changed: 「都道府県別 住居費・物価・気候データ 76指標｜CSV・Excel \| 統計で見る都道府県」→「都道府県別 住居費・物価・気候データ \| 統計で見る都道府県」
- `/products/data-p-08`
  - title_changed: 「都道府県別 商業・小売データ 69指標｜CSV・Excel \| 統計で見る都道府県」→「都道府県別 商業・小売データ \| 統計で見る都道府県」
- `/products/data-p-09`
  - title_changed: 「都道府県別 産業・農業・家計データ 132指標｜CSV・Excel \| 統計で見る都道府県」→「都道府県別 産業・経済データ \| 統計で見る都道府県」
- `/products/data-p-10`
  - title_changed: 「都道府県別 防災・交通・インフラデータ 230指標｜CSV・Excel \| 統計で見る都道府県」→「都道府県別 防災・交通・インフラデータ \| 統計で見る都道府県」
- `/products/data-p-11`
  - title_changed: 「都道府県の地図・ランキング素材 28指標｜PNG・SVG・PowerPoint \| 統計で見る都道府県」→「都道府県の地図・ランキング素材 \| 統計で見る都道府県」
- `/products/data-p-12`
  - title_changed: 「47都道府県 統計データ総合集 2,073指標｜CSV・Excel \| 統計で見る都道府県」→「都道府県 統計データ総合集 \| 統計で見る都道府県」
- `/products/data-p-14`
  - title_changed: 「県庁所在市別 家計調査データ 832指標｜品目別 CSV・Excel \| 統計で見る都道府県」→「県庁所在市別 家計・消費データ \| 統計で見る都道府県」
- `/themes/population-dynamics`
  - clipped_text: div.relative.flex.w-full "stats47Toggle Sidebar{"@context":"https:"
  - line_grid: outside-grid  section.rounded-card border border-card-outline bg-background text-c \| 
  - line_grid: mixed-cell    details.[&[open]>summary_.disclosure-vertical]:scale-y-0 \| 白書・統計から見る論点 公的資料の論点から、関連する都道府県 :: summary
  - small_text: 10px「出典: 厚生労働白書 (令和7年版) /」
  - title_changed: 「全国の人口動態 \| 統計で見る都道府県」→「全国の人口動態｜人口増減率の推移と都道府県ランキング \| 統計で見る都道府県」
- `/themes/aging-society`
  - title_changed: 「全国の少子高齢化 \| 統計で見る都道府県」→「全国の少子高齢化｜高齢化率・合計特殊出生率の推移と都道府県ランキング \| 統計で見る都道府県」
- `/themes/living-housing`
  - title_changed: 「全国の暮らし・住まい \| 統計で見る都道府県」→「全国の暮らし・住まい｜空き家率の推移と都道府県ランキング \| 統計で見る都道府県」
- `/themes/local-economy`
  - title_changed: 「全国の地域経済 \| 統計で見る都道府県」→「全国の地域経済｜県内総生産額・1人当たり県民所得の推移と都道府県ランキング \| 統計で見る都道府県」
- `/themes/labor-wages`
  - title_changed: 「全国の労働・賃金 \| 統計で見る都道府県」→「全国の労働・賃金｜最低賃金の推移と都道府県ランキング \| 統計で見る都道府県」
- `/themes/manufacturing`
  - title_changed: 「全国の製造業 \| 統計で見る都道府県」→「全国の製造業｜出荷額の推移と都道府県ランキング \| 統計で見る都道府県」
- `/themes/healthcare`
  - title_changed: 「全国の医療・健康 \| 統計で見る都道府県」→「全国の医療・健康｜医師数・男性平均寿命の推移と都道府県ランキング \| 統計で見る都道府県」
- `/themes/safety`
  - title_changed: 「全国の安全 \| 統計で見る都道府県」→「全国の安全｜刑法犯認知件数・交通事故死者数の推移と都道府県ランキング \| 統計で見る都道府県」
- `/themes/education-culture`
  - title_changed: 「全国の教育・文化 \| 統計で見る都道府県」→「全国の教育・文化｜図書館数・小学校数の推移と都道府県ランキング \| 統計で見る都道府県」
- `/themes/tourism`
  - title_changed: 「全国の観光 \| 統計で見る都道府県」→「全国の観光｜延べ宿泊者数・客室稼働率の推移と都道府県ランキング \| 統計で見る都道府県」
- `/themes/consumer-prices`
  - title_changed: 「全国の物価・消費 \| 統計で見る都道府県」→「全国の物価・消費｜総合・住居の推移と都道府県ランキング \| 統計で見る都道府県」
- `/themes/foreign-residents`
  - title_changed: 「全国の外国人 \| 統計で見る都道府県」→「全国の外国人｜外国人人口の推移と都道府県ランキング \| 統計で見る都道府県」
- `/themes/occupation-salary`
  - title_changed: 「全国の職業別年収 \| 統計で見る都道府県」→「全国の職業別年収｜医師の推移と都道府県ランキング \| 統計で見る都道府県」
- `/themes/real-income`
  - line_grid: outside-grid  section.rounded-card border border-card-outline bg-background text-c \| 
  - line_grid: mixed-cell    details.[&[open]>summary_.disclosure-vertical]:scale-y-0 \| 白書・統計から見る論点 公的資料の論点から、関連する都道府県 :: summary
  - title_changed: 「全国の実質収入・購買力 \| 統計で見る都道府県」→「全国の実質収入・購買力｜可処分所得・実質可処分所得の推移と都道府県ランキング \| 統計で見る都道府県」
- `/themes/labor-mobility`
  - title_changed: 「全国の人材流動性・雇用環境 \| 統計で見る都道府県」→「全国の人材流動性・雇用環境｜離職率・有効求人倍率の推移と都道府県ランキング \| 統計で見る都道府県」
- `/themes/local-finance`
  - title_changed: 「地方財政 \| 統計で見る都道府県」→「全国の地方財政｜財政力指数・実質公債費比率の推移と都道府県ランキング \| 統計で見る都道府県」
- `/themes/fishery-marine`
  - title_changed: 「全国の漁業（水産業） \| 統計で見る都道府県」→「全国の漁業（水産業）｜漁獲量・海面漁業・養殖業産出額の推移と都道府県ランキング \| 統計で見る都道府県」
- `/themes/ports`
  - title_changed: 「全国の港湾 \| 統計で見る都道府県」→「全国の港湾｜海上出入貨物量・コンテナ個数の推移と都道府県ランキング \| 統計で見る都道府県」
- `/themes/railway`
  - title_changed: 「全国の鉄道 \| 統計で見る都道府県」→「全国の鉄道｜JR輸送人員の推移と都道府県ランキング \| 統計で見る都道府県」
- `/themes/roads`
  - title_changed: 「全国の道路 \| 統計で見る都道府県」→「全国の道路｜道路実延長の推移と都道府県ランキング \| 統計で見る都道府県」
- `/themes/climate`
  - title_changed: 「全国の気候 \| 統計で見る都道府県」→「全国の気候｜年間日照時間・年平均気温の推移と都道府県ランキング \| 統計で見る都道府県」
- `/themes/construction-industry`
  - title_changed: 「全国の建設業 \| 統計で見る都道府県」→「全国の建設業｜元請完成工事高・55歳以上の建設業就業者の推移と都道府県ランキング \| 統計で見る都道府県」
- `/themes/waste-recycling`
  - title_changed: 「全国のごみ・リサイクル \| 統計で見る都道府県」→「全国のごみ・リサイクル｜ごみ排出量の推移と都道府県ランキング \| 統計で見る都道府県」
- `/themes/information-industry`
  - title_changed: 「全国の情報通信業 \| 統計で見る都道府県」→「全国の情報通信業｜事業所数の推移と都道府県ランキング \| 統計で見る都道府県」
- `/themes/land-property-market`
  - title_changed: 「全国の不動産取引と地価 \| 統計で見る都道府県」→「全国の不動産取引と地価｜住宅地の取引単価中央値の推移と都道府県ランキング \| 統計で見る都道府県」
- `/themes/agriculture-production`
  - title_changed: 「全国の農業の生産力 \| 統計で見る都道府県」→「全国の農業の生産力｜農業産出額の推移と都道府県ランキング \| 統計で見る都道府県」
- `/themes/forestry-timber`
  - title_changed: 「全国の森林・林業・木材産業 \| 統計で見る都道府県」→「全国の森林・林業・木材産業｜森林面積・林業産出額の推移と都道府県ランキング \| 統計で見る都道府県」
- `/themes/retail-commerce`
  - title_changed: 「全国の商業と小売 \| 統計で見る都道府県」→「全国の商業と小売｜小売業事業所数の推移と都道府県ランキング \| 統計で見る都道府県」
- `/themes/local-services`
  - title_changed: 「全国の飲食・生活関連サービス \| 統計で見る都道府県」→「全国の飲食・生活関連サービス｜飲食店数の推移と都道府県ランキング \| 統計で見る都道府県」
- `/themes/business-demography`
  - title_changed: 「全国の起業と開廃業 \| 統計で見る都道府県」→「全国の起業と開廃業｜開業率の推移と都道府県ランキング \| 統計で見る都道府県」
- `/themes/innovation-patents`
  - title_changed: 「全国の研究開発と特許 \| 統計で見る都道府県」→「全国の研究開発と特許｜特許出願件数の推移と都道府県ランキング \| 統計で見る都道府県」
- `/themes/childcare-services`
  - title_changed: 「全国の保育の需給 \| 統計で見る都道府県」→「全国の保育の需給｜保育所等数の推移と都道府県ランキング \| 統計で見る都道府県」
- ほか 924 URL (latest.json の ui_findings を参照)
