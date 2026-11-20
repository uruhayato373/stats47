# ページ品質監査 Latest — 2026-11-20

- モード: full / 対象 9549 URL / commit 75ae2099f89bc1d62f4577506811843af20802c0
- 違反: **error 248 / warning 3823**

## テンプレート別集計

| テンプレート | URL数 | error | warning |
|---|---|---|---|
| home | 1 | 0 | 1 |
| ranking | 2625 | 49 | 30 |
| prefecture-list | 1 | 0 | 2 |
| theme | 57 | 2 | 21 |
| geo-analysis | 238 | 53 | 13 |
| other | 1328 | 3 | 182 |
| prefecture-detail | 2538 | 48 | 685 |
| blog | 1 | 0 | 3 |
| blog-article | 853 | 90 | 1177 |
| category | 17 | 2 | 23 |
| survey | 149 | 0 | 90 |
| municipality | 1741 | 1 | 1596 |

## 違反の詳細

上位 100 件 (error を先に) / 全 4071 件。全件は R2 `state/page-quality/latest.json` (`npm run state:pull -- page-quality`)。

| URL | metric | 実測 | 前回 | 閾値 | 種別 |
|---|---|---|---|---|---|
| `/ranking` | console_errors (absolute) | 1 | - | <= 0 | 🚨 |
| `/themes` | duplicate_link_ratio (absolute) | 0.4177 | - | <= 0.3 | 🚨 |
| `/geo` | console_errors (absolute) | 3 | - | <= 0 | 🚨 |
| `/geo` | page_errors (absolute) | 3 | - | <= 0 | 🚨 |
| `/geo/population-land-price` | console_errors (absolute) | 3 | - | <= 0 | 🚨 |
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
| `/themes/real-income` | page_errors (absolute) | 1 | - | <= 0 | 🚨 |
| `/areas/01000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/02000/landslide-exposure` | console_errors (absolute) | 1 | - | <= 0 | 🚨 |
| `/areas/02000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/03000/household-food-spending` | http_status (absolute) | -1 | - | < 400 | 🚨 |
| `/areas/04000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/05000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/06000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/07000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/08000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/09000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/10000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/11000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/12000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/13000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/14000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/15000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/16000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/17000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/18000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/19000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/20000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/21000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/22000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/23000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/24000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/25000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/26000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/27000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/29000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/30000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/31000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/33000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/34000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/35000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/36000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/37000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/38000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/39000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/40000/labor-mobility` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/40000/forestry-timber` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/40000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/41000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/42000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |
| `/areas/43000/household-food-spending` | http_status (absolute) | 503 | - | < 400 | 🚨 |

## 代表URLのスクショ (先週比の変化)

| テンプレート | 端末 | 先週比 | スクショ |
|---|---|---|---|
| home | mobile-390 | 15% | [home-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/home-mobile-390.webp) |
| home | sm-640 | 13% | [home-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/home-sm-640.png) |
| home | tablet-768 | 13% | [home-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/home-tablet-768.webp) |
| home | rail-992 | 14% | [home-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/home-rail-992.png) |
| home | laptop-1024 | 10% | [home-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/home-laptop-1024.png) |
| home | desktop-1440 | 9% | [home-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/home-desktop-1440.webp) |
| home | wide-1920 | 9% | [home-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/home-wide-1920.png) |
| ranking | mobile-390 | 5% | [ranking--index-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/ranking--index-mobile-390.webp) |
| ranking | sm-640 | 3% | [ranking--index-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--index-sm-640.png) |
| ranking | tablet-768 | 4% | [ranking--index-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/ranking--index-tablet-768.webp) |
| ranking | rail-992 | 5% | [ranking--index-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--index-rail-992.png) |
| ranking | laptop-1024 | 4% | [ranking--index-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--index-laptop-1024.png) |
| ranking | desktop-1440 | 6% | [ranking--index-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/ranking--index-desktop-1440.webp) |
| ranking | wide-1920 | 6% | [ranking--index-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--index-wide-1920.png) |
| prefecture-list | mobile-390 | 4% | [prefecture-list-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/prefecture-list-mobile-390.webp) |
| prefecture-list | sm-640 | 3% | [prefecture-list-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-list-sm-640.png) |
| prefecture-list | tablet-768 | 2% | [prefecture-list-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/prefecture-list-tablet-768.webp) |
| prefecture-list | rail-992 | 2% | [prefecture-list-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-list-rail-992.png) |
| prefecture-list | laptop-1024 | 2% | [prefecture-list-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-list-laptop-1024.png) |
| prefecture-list | desktop-1440 | 2% | [prefecture-list-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/prefecture-list-desktop-1440.webp) |
| prefecture-list | wide-1920 | 1% | [prefecture-list-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-list-wide-1920.png) |
| theme | mobile-390 | 31% | [theme--index-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/theme--index-mobile-390.webp) |
| theme | sm-640 | 28% | [theme--index-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--index-sm-640.png) |
| theme | tablet-768 | 34% | [theme--index-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/theme--index-tablet-768.webp) |
| theme | rail-992 | 37% | [theme--index-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--index-rail-992.png) |
| theme | laptop-1024 | 19% | [theme--index-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--index-laptop-1024.png) |
| theme | desktop-1440 | 28% | [theme--index-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/theme--index-desktop-1440.webp) |
| theme | wide-1920 | 26% | [theme--index-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--index-wide-1920.png) |
| geo-analysis | mobile-390 | 0% | [geo-analysis-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/geo-analysis-mobile-390.webp) |
| geo-analysis | sm-640 | 0% | [geo-analysis-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis-sm-640.png) |
| geo-analysis | tablet-768 | 0% | [geo-analysis-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/geo-analysis-tablet-768.webp) |
| geo-analysis | rail-992 | 0% | [geo-analysis-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis-rail-992.png) |
| geo-analysis | laptop-1024 | 0% | [geo-analysis-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis-laptop-1024.png) |
| geo-analysis | desktop-1440 | 0% | [geo-analysis-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/geo-analysis-desktop-1440.webp) |
| geo-analysis | wide-1920 | 0% | [geo-analysis-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis-wide-1920.png) |
| geo-analysis | mobile-390 | 0% | [geo-analysis--compare-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/geo-analysis--compare-mobile-390.webp) |
| geo-analysis | sm-640 | 0% | [geo-analysis--compare-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--compare-sm-640.png) |
| geo-analysis | tablet-768 | 0% | [geo-analysis--compare-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/geo-analysis--compare-tablet-768.webp) |
| geo-analysis | rail-992 | 0% | [geo-analysis--compare-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--compare-rail-992.png) |
| geo-analysis | laptop-1024 | 0% | [geo-analysis--compare-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--compare-laptop-1024.png) |
| geo-analysis | desktop-1440 | 0% | [geo-analysis--compare-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/geo-analysis--compare-desktop-1440.webp) |
| geo-analysis | wide-1920 | 0% | [geo-analysis--compare-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--compare-wide-1920.png) |
| geo-analysis | mobile-390 | 0% | [geo-analysis--layer-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/geo-analysis--layer-mobile-390.webp) |
| geo-analysis | sm-640 | 0% | [geo-analysis--layer-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--layer-sm-640.png) |
| geo-analysis | tablet-768 | 16% | [geo-analysis--layer-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/geo-analysis--layer-tablet-768.webp) |
| geo-analysis | rail-992 | 0% | [geo-analysis--layer-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--layer-rail-992.png) |
| geo-analysis | laptop-1024 | 0% | [geo-analysis--layer-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--layer-laptop-1024.png) |
| geo-analysis | desktop-1440 | 0% | [geo-analysis--layer-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/geo-analysis--layer-desktop-1440.webp) |
| geo-analysis | wide-1920 | 0% | [geo-analysis--layer-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--layer-wide-1920.png) |
| geo-analysis | mobile-390 | 6% | [geo-analysis--analysis-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/geo-analysis--analysis-mobile-390.webp) |
| geo-analysis | sm-640 | 6% | [geo-analysis--analysis-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-sm-640.png) |
| geo-analysis | tablet-768 | 4% | [geo-analysis--analysis-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/geo-analysis--analysis-tablet-768.webp) |
| geo-analysis | rail-992 | 5% | [geo-analysis--analysis-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-rail-992.png) |
| geo-analysis | laptop-1024 | 3% | [geo-analysis--analysis-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-laptop-1024.png) |
| geo-analysis | desktop-1440 | 4% | [geo-analysis--analysis-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/geo-analysis--analysis-desktop-1440.webp) |
| geo-analysis | wide-1920 | 3% | [geo-analysis--analysis-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-wide-1920.png) |
| geo-analysis | mobile-390 | 8% | [geo-analysis--analysis-pref-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/geo-analysis--analysis-pref-mobile-390.webp) |
| geo-analysis | sm-640 | 7% | [geo-analysis--analysis-pref-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-pref-sm-640.png) |
| geo-analysis | tablet-768 | 6% | [geo-analysis--analysis-pref-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/geo-analysis--analysis-pref-tablet-768.webp) |
| geo-analysis | rail-992 | 6% | [geo-analysis--analysis-pref-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-pref-rail-992.png) |
| geo-analysis | laptop-1024 | 5% | [geo-analysis--analysis-pref-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-pref-laptop-1024.png) |
| geo-analysis | desktop-1440 | 5% | [geo-analysis--analysis-pref-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/geo-analysis--analysis-pref-desktop-1440.webp) |
| geo-analysis | wide-1920 | 4% | [geo-analysis--analysis-pref-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-pref-wide-1920.png) |
| geo-analysis | mobile-390 | 0% | [geo-analysis--dataset-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/geo-analysis--dataset-mobile-390.webp) |
| geo-analysis | sm-640 | 0% | [geo-analysis--dataset-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--dataset-sm-640.png) |
| geo-analysis | tablet-768 | 0% | [geo-analysis--dataset-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/geo-analysis--dataset-tablet-768.webp) |
| geo-analysis | rail-992 | 0% | [geo-analysis--dataset-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--dataset-rail-992.png) |
| geo-analysis | laptop-1024 | 0% | [geo-analysis--dataset-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--dataset-laptop-1024.png) |
| geo-analysis | desktop-1440 | 0% | [geo-analysis--dataset-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/geo-analysis--dataset-desktop-1440.webp) |
| geo-analysis | wide-1920 | 0% | [geo-analysis--dataset-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--dataset-wide-1920.png) |
| other | mobile-390 | 13% | [other--about-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--about-mobile-390.webp) |
| other | sm-640 | 8% | [other--about-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--about-sm-640.png) |
| other | tablet-768 | 8% | [other--about-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--about-tablet-768.webp) |
| other | rail-992 | 7% | [other--about-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--about-rail-992.png) |
| other | laptop-1024 | 6% | [other--about-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--about-laptop-1024.png) |
| other | desktop-1440 | 5% | [other--about-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--about-desktop-1440.webp) |
| other | wide-1920 | 4% | [other--about-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--about-wide-1920.png) |
| other | mobile-390 | 0% | [other--products-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--products-mobile-390.webp) |
| other | sm-640 | 0% | [other--products-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--products-sm-640.png) |
| other | tablet-768 | 0% | [other--products-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--products-tablet-768.webp) |
| other | rail-992 | 0% | [other--products-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--products-rail-992.png) |
| other | laptop-1024 | 0% | [other--products-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--products-laptop-1024.png) |
| other | desktop-1440 | 0% | [other--products-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--products-desktop-1440.webp) |
| other | wide-1920 | 0% | [other--products-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--products-wide-1920.png) |
| other | mobile-390 | 0% | [other--product-item-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--product-item-mobile-390.webp) |
| other | sm-640 | 0% | [other--product-item-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--product-item-sm-640.png) |
| other | tablet-768 | 0% | [other--product-item-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--product-item-tablet-768.webp) |
| other | rail-992 | 0% | [other--product-item-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--product-item-rail-992.png) |
| other | laptop-1024 | 0% | [other--product-item-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--product-item-laptop-1024.png) |
| other | desktop-1440 | 0% | [other--product-item-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--product-item-desktop-1440.webp) |
| other | wide-1920 | 0% | [other--product-item-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--product-item-wide-1920.png) |
| other | mobile-390 | 11% | [other--privacy-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--privacy-mobile-390.webp) |
| other | sm-640 | 8% | [other--privacy-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--privacy-sm-640.png) |
| other | tablet-768 | 6% | [other--privacy-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--privacy-tablet-768.webp) |
| other | rail-992 | 5% | [other--privacy-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--privacy-rail-992.png) |
| other | laptop-1024 | 5% | [other--privacy-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--privacy-laptop-1024.png) |
| other | desktop-1440 | 4% | [other--privacy-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--privacy-desktop-1440.webp) |
| other | wide-1920 | 4% | [other--privacy-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--privacy-wide-1920.png) |
| other | mobile-390 | 0% | [other--terms-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--terms-mobile-390.webp) |
| other | sm-640 | 0% | [other--terms-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--terms-sm-640.png) |
| other | tablet-768 | 0% | [other--terms-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--terms-tablet-768.webp) |
| other | rail-992 | 0% | [other--terms-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--terms-rail-992.png) |
| other | laptop-1024 | 0% | [other--terms-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--terms-laptop-1024.png) |
| other | desktop-1440 | 0% | [other--terms-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--terms-desktop-1440.webp) |
| other | wide-1920 | 0% | [other--terms-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--terms-wide-1920.png) |
| theme | mobile-390 | 8% | [theme-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/theme-mobile-390.webp) |
| theme | sm-640 | 12% | [theme-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme-sm-640.png) |
| theme | tablet-768 | 6% | [theme-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/theme-tablet-768.webp) |
| theme | rail-992 | 1% | [theme-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme-rail-992.png) |
| theme | laptop-1024 | 3% | [theme-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme-laptop-1024.png) |
| theme | desktop-1440 | 1% | [theme-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/theme-desktop-1440.webp) |
| theme | wide-1920 | 0% | [theme-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme-wide-1920.png) |
| theme | mobile-390 | 23% | [theme--real-income-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/theme--real-income-mobile-390.webp) |
| theme | sm-640 | 18% | [theme--real-income-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--real-income-sm-640.png) |
| theme | tablet-768 | 19% | [theme--real-income-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/theme--real-income-tablet-768.webp) |
| theme | rail-992 | 12% | [theme--real-income-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--real-income-rail-992.png) |
| theme | laptop-1024 | 15% | [theme--real-income-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--real-income-laptop-1024.png) |
| theme | desktop-1440 | 10% | [theme--real-income-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/theme--real-income-desktop-1440.webp) |
| theme | wide-1920 | 9% | [theme--real-income-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--real-income-wide-1920.png) |
| prefecture-detail | mobile-390 | 26% | [prefecture-detail--hokkaido-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/prefecture-detail--hokkaido-mobile-390.webp) |
| prefecture-detail | sm-640 | 14% | [prefecture-detail--hokkaido-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--hokkaido-sm-640.png) |
| prefecture-detail | tablet-768 | 12% | [prefecture-detail--hokkaido-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/prefecture-detail--hokkaido-tablet-768.webp) |
| prefecture-detail | rail-992 | 12% | [prefecture-detail--hokkaido-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--hokkaido-rail-992.png) |
| prefecture-detail | laptop-1024 | 11% | [prefecture-detail--hokkaido-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--hokkaido-laptop-1024.png) |
| prefecture-detail | desktop-1440 | 10% | [prefecture-detail--hokkaido-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/prefecture-detail--hokkaido-desktop-1440.webp) |
| prefecture-detail | wide-1920 | 8% | [prefecture-detail--hokkaido-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--hokkaido-wide-1920.png) |
| prefecture-detail | mobile-390 | 25% | [prefecture-detail-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/prefecture-detail-mobile-390.webp) |
| prefecture-detail | sm-640 | 15% | [prefecture-detail-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail-sm-640.png) |
| prefecture-detail | tablet-768 | 14% | [prefecture-detail-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/prefecture-detail-tablet-768.webp) |
| prefecture-detail | rail-992 | 13% | [prefecture-detail-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail-rail-992.png) |
| prefecture-detail | laptop-1024 | 12% | [prefecture-detail-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail-laptop-1024.png) |
| prefecture-detail | desktop-1440 | 12% | [prefecture-detail-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/prefecture-detail-desktop-1440.webp) |
| prefecture-detail | wide-1920 | 10% | [prefecture-detail-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail-wide-1920.png) |
| prefecture-detail | mobile-390 | 25% | [prefecture-detail--okinawa-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/prefecture-detail--okinawa-mobile-390.webp) |
| prefecture-detail | sm-640 | 14% | [prefecture-detail--okinawa-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--okinawa-sm-640.png) |
| prefecture-detail | tablet-768 | 11% | [prefecture-detail--okinawa-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/prefecture-detail--okinawa-tablet-768.webp) |
| prefecture-detail | rail-992 | 12% | [prefecture-detail--okinawa-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--okinawa-rail-992.png) |
| prefecture-detail | laptop-1024 | 10% | [prefecture-detail--okinawa-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--okinawa-laptop-1024.png) |
| prefecture-detail | desktop-1440 | 10% | [prefecture-detail--okinawa-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/prefecture-detail--okinawa-desktop-1440.webp) |
| prefecture-detail | wide-1920 | 7% | [prefecture-detail--okinawa-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--okinawa-wide-1920.png) |
| prefecture-detail | mobile-390 | 15% | [prefecture-detail--theme-geo-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/prefecture-detail--theme-geo-mobile-390.webp) |
| prefecture-detail | sm-640 | 0% | [prefecture-detail--theme-geo-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-geo-sm-640.png) |
| prefecture-detail | tablet-768 | 0% | [prefecture-detail--theme-geo-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/prefecture-detail--theme-geo-tablet-768.webp) |
| prefecture-detail | rail-992 | 0% | [prefecture-detail--theme-geo-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-geo-rail-992.png) |
| prefecture-detail | laptop-1024 | 0% | [prefecture-detail--theme-geo-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-geo-laptop-1024.png) |
| prefecture-detail | desktop-1440 | 0% | [prefecture-detail--theme-geo-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/prefecture-detail--theme-geo-desktop-1440.webp) |
| prefecture-detail | wide-1920 | 0% | [prefecture-detail--theme-geo-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-geo-wide-1920.png) |
| prefecture-detail | mobile-390 | 10% | [prefecture-detail--theme-population-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/prefecture-detail--theme-population-mobile-390.webp) |
| prefecture-detail | sm-640 | 7% | [prefecture-detail--theme-population-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-population-sm-640.png) |
| prefecture-detail | tablet-768 | 4% | [prefecture-detail--theme-population-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/prefecture-detail--theme-population-tablet-768.webp) |
| prefecture-detail | rail-992 | 4% | [prefecture-detail--theme-population-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-population-rail-992.png) |
| prefecture-detail | laptop-1024 | 2% | [prefecture-detail--theme-population-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-population-laptop-1024.png) |
| prefecture-detail | desktop-1440 | 3% | [prefecture-detail--theme-population-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/prefecture-detail--theme-population-desktop-1440.webp) |
| prefecture-detail | wide-1920 | 1% | [prefecture-detail--theme-population-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-population-wide-1920.png) |
| prefecture-detail | mobile-390 | 23% | [prefecture-detail--theme-care-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/prefecture-detail--theme-care-mobile-390.webp) |
| prefecture-detail | sm-640 | 15% | [prefecture-detail--theme-care-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-care-sm-640.png) |
| prefecture-detail | tablet-768 | 16% | [prefecture-detail--theme-care-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/prefecture-detail--theme-care-tablet-768.webp) |
| prefecture-detail | rail-992 | 15% | [prefecture-detail--theme-care-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-care-rail-992.png) |
| prefecture-detail | laptop-1024 | 12% | [prefecture-detail--theme-care-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-care-laptop-1024.png) |
| prefecture-detail | desktop-1440 | 14% | [prefecture-detail--theme-care-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/prefecture-detail--theme-care-desktop-1440.webp) |
| prefecture-detail | wide-1920 | 14% | [prefecture-detail--theme-care-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-care-wide-1920.png) |
| ranking | mobile-390 | 8% | [ranking--single-year-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/ranking--single-year-mobile-390.webp) |
| ranking | sm-640 | 5% | [ranking--single-year-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--single-year-sm-640.png) |
| ranking | tablet-768 | 5% | [ranking--single-year-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/ranking--single-year-tablet-768.webp) |
| ranking | rail-992 | 4% | [ranking--single-year-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--single-year-rail-992.png) |
| ranking | laptop-1024 | 4% | [ranking--single-year-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--single-year-laptop-1024.png) |
| ranking | desktop-1440 | 3% | [ranking--single-year-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/ranking--single-year-desktop-1440.webp) |
| ranking | wide-1920 | 2% | [ranking--single-year-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--single-year-wide-1920.png) |
| ranking | mobile-390 | 12% | [ranking--old-2years-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/ranking--old-2years-mobile-390.webp) |
| ranking | sm-640 | 13% | [ranking--old-2years-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--old-2years-sm-640.png) |
| ranking | tablet-768 | 16% | [ranking--old-2years-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/ranking--old-2years-tablet-768.webp) |
| ranking | rail-992 | 24% | [ranking--old-2years-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--old-2years-rail-992.png) |
| ranking | laptop-1024 | 9% | [ranking--old-2years-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--old-2years-laptop-1024.png) |
| ranking | desktop-1440 | 10% | [ranking--old-2years-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/ranking--old-2years-desktop-1440.webp) |
| ranking | wide-1920 | 8% | [ranking--old-2years-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--old-2years-wide-1920.png) |
| ranking | mobile-390 | 20% | [ranking--kakei-city-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/ranking--kakei-city-mobile-390.webp) |
| ranking | sm-640 | 11% | [ranking--kakei-city-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--kakei-city-sm-640.png) |
| ranking | tablet-768 | 13% | [ranking--kakei-city-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/ranking--kakei-city-tablet-768.webp) |
| ranking | rail-992 | 11% | [ranking--kakei-city-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--kakei-city-rail-992.png) |
| ranking | laptop-1024 | 11% | [ranking--kakei-city-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--kakei-city-laptop-1024.png) |
| ranking | desktop-1440 | 7% | [ranking--kakei-city-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/ranking--kakei-city-desktop-1440.webp) |
| ranking | wide-1920 | 8% | [ranking--kakei-city-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--kakei-city-wide-1920.png) |
| ranking | mobile-390 | 21% | [ranking--negative-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/ranking--negative-mobile-390.webp) |
| ranking | sm-640 | 12% | [ranking--negative-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--negative-sm-640.png) |
| ranking | tablet-768 | 14% | [ranking--negative-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/ranking--negative-tablet-768.webp) |
| ranking | rail-992 | 11% | [ranking--negative-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--negative-rail-992.png) |
| ranking | laptop-1024 | 8% | [ranking--negative-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--negative-laptop-1024.png) |
| ranking | desktop-1440 | 6% | [ranking--negative-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/ranking--negative-desktop-1440.webp) |
| ranking | wide-1920 | 5% | [ranking--negative-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--negative-wide-1920.png) |
| ranking | mobile-390 | 7% | [ranking--long-title-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/ranking--long-title-mobile-390.webp) |
| ranking | sm-640 | 5% | [ranking--long-title-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--long-title-sm-640.png) |
| ranking | tablet-768 | 5% | [ranking--long-title-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/ranking--long-title-tablet-768.webp) |
| ranking | rail-992 | 5% | [ranking--long-title-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--long-title-rail-992.png) |
| ranking | laptop-1024 | 4% | [ranking--long-title-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--long-title-laptop-1024.png) |
| ranking | desktop-1440 | 3% | [ranking--long-title-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/ranking--long-title-desktop-1440.webp) |
| ranking | wide-1920 | 2% | [ranking--long-title-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--long-title-wide-1920.png) |
| ranking | mobile-390 | 21% | [ranking-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/ranking-mobile-390.webp) |
| ranking | sm-640 | 12% | [ranking-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking-sm-640.png) |
| ranking | tablet-768 | 14% | [ranking-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/ranking-tablet-768.webp) |
| ranking | rail-992 | 11% | [ranking-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking-rail-992.png) |
| ranking | laptop-1024 | 12% | [ranking-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking-laptop-1024.png) |
| ranking | desktop-1440 | 6% | [ranking-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/ranking-desktop-1440.webp) |
| ranking | wide-1920 | 5% | [ranking-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking-wide-1920.png) |
| blog | mobile-390 | 43% | [blog-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/blog-mobile-390.webp) |
| blog | sm-640 | 35% | [blog-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-sm-640.png) |
| blog | tablet-768 | 45% | [blog-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/blog-tablet-768.webp) |
| blog | rail-992 | 35% | [blog-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-rail-992.png) |
| blog | laptop-1024 | 39% | [blog-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-laptop-1024.png) |
| blog | desktop-1440 | 22% | [blog-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/blog-desktop-1440.webp) |
| blog | wide-1920 | 21% | [blog-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-wide-1920.png) |
| blog-article | mobile-390 | 10% | [blog-article-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/blog-article-mobile-390.webp) |
| blog-article | sm-640 | 9% | [blog-article-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article-sm-640.png) |
| blog-article | tablet-768 | 8% | [blog-article-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/blog-article-tablet-768.webp) |
| blog-article | rail-992 | 6% | [blog-article-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article-rail-992.png) |
| blog-article | laptop-1024 | 6% | [blog-article-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article-laptop-1024.png) |
| blog-article | desktop-1440 | 5% | [blog-article-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/blog-article-desktop-1440.webp) |
| blog-article | wide-1920 | 4% | [blog-article-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article-wide-1920.png) |
| blog-article | mobile-390 | 0% | [blog-article--charts-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/blog-article--charts-mobile-390.webp) |
| blog-article | sm-640 | 8% | [blog-article--charts-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article--charts-sm-640.png) |
| blog-article | tablet-768 | 5% | [blog-article--charts-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/blog-article--charts-tablet-768.webp) |
| blog-article | rail-992 | 4% | [blog-article--charts-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article--charts-rail-992.png) |
| blog-article | laptop-1024 | 4% | [blog-article--charts-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article--charts-laptop-1024.png) |
| blog-article | desktop-1440 | 3% | [blog-article--charts-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/blog-article--charts-desktop-1440.webp) |
| blog-article | wide-1920 | 2% | [blog-article--charts-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article--charts-wide-1920.png) |
| category | mobile-390 | 10% | [category--landweather-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/category--landweather-mobile-390.webp) |
| category | sm-640 | 9% | [category--landweather-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category--landweather-sm-640.png) |
| category | tablet-768 | 9% | [category--landweather-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/category--landweather-tablet-768.webp) |
| category | rail-992 | 9% | [category--landweather-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category--landweather-rail-992.png) |
| category | laptop-1024 | 7% | [category--landweather-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category--landweather-laptop-1024.png) |
| category | desktop-1440 | 6% | [category--landweather-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/category--landweather-desktop-1440.webp) |
| category | wide-1920 | 5% | [category--landweather-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category--landweather-wide-1920.png) |
| category | mobile-390 | 9% | [category-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/category-mobile-390.webp) |
| category | sm-640 | 8% | [category-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category-sm-640.png) |
| category | tablet-768 | 9% | [category-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/category-tablet-768.webp) |
| category | rail-992 | 9% | [category-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category-rail-992.png) |
| category | laptop-1024 | 7% | [category-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category-laptop-1024.png) |
| category | desktop-1440 | 6% | [category-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/category-desktop-1440.webp) |
| category | wide-1920 | 5% | [category-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category-wide-1920.png) |
| survey | mobile-390 | 8% | [survey--index-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/survey--index-mobile-390.webp) |
| survey | sm-640 | 5% | [survey--index-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--index-sm-640.png) |
| survey | tablet-768 | 8% | [survey--index-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/survey--index-tablet-768.webp) |
| survey | rail-992 | 6% | [survey--index-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--index-rail-992.png) |
| survey | laptop-1024 | 7% | [survey--index-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--index-laptop-1024.png) |
| survey | desktop-1440 | 6% | [survey--index-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/survey--index-desktop-1440.webp) |
| survey | wide-1920 | 5% | [survey--index-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--index-wide-1920.png) |
| survey | mobile-390 | 26% | [survey-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/survey-mobile-390.webp) |
| survey | sm-640 | 16% | [survey-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey-sm-640.png) |
| survey | tablet-768 | 18% | [survey-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/survey-tablet-768.webp) |
| survey | rail-992 | 17% | [survey-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey-rail-992.png) |
| survey | laptop-1024 | 17% | [survey-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey-laptop-1024.png) |
| survey | desktop-1440 | 15% | [survey-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/survey-desktop-1440.webp) |
| survey | wide-1920 | 13% | [survey-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey-wide-1920.png) |
| survey | mobile-390 | 26% | [survey--police-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/survey--police-mobile-390.webp) |
| survey | sm-640 | 18% | [survey--police-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--police-sm-640.png) |
| survey | tablet-768 | 20% | [survey--police-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/survey--police-tablet-768.webp) |
| survey | rail-992 | 17% | [survey--police-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--police-rail-992.png) |
| survey | laptop-1024 | 17% | [survey--police-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--police-laptop-1024.png) |
| survey | desktop-1440 | 15% | [survey--police-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/survey--police-desktop-1440.webp) |
| survey | wide-1920 | 13% | [survey--police-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--police-wide-1920.png) |
| municipality | mobile-390 | 6% | [municipality--designated-city-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/municipality--designated-city-mobile-390.webp) |
| municipality | sm-640 | 6% | [municipality--designated-city-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--designated-city-sm-640.png) |
| municipality | tablet-768 | 0% | [municipality--designated-city-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/municipality--designated-city-tablet-768.webp) |
| municipality | rail-992 | 4% | [municipality--designated-city-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--designated-city-rail-992.png) |
| municipality | laptop-1024 | 0% | [municipality--designated-city-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--designated-city-laptop-1024.png) |
| municipality | desktop-1440 | 3% | [municipality--designated-city-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/municipality--designated-city-desktop-1440.webp) |
| municipality | wide-1920 | 2% | [municipality--designated-city-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--designated-city-wide-1920.png) |
| municipality | mobile-390 | 6% | [municipality-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/municipality-mobile-390.webp) |
| municipality | sm-640 | 6% | [municipality-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality-sm-640.png) |
| municipality | tablet-768 | 0% | [municipality-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/municipality-tablet-768.webp) |
| municipality | rail-992 | 4% | [municipality-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality-rail-992.png) |
| municipality | laptop-1024 | 0% | [municipality-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality-laptop-1024.png) |
| municipality | desktop-1440 | 3% | [municipality-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/municipality-desktop-1440.webp) |
| municipality | wide-1920 | 2% | [municipality-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality-wide-1920.png) |
| municipality | mobile-390 | 6% | [municipality--village-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/municipality--village-mobile-390.webp) |
| municipality | sm-640 | 6% | [municipality--village-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--village-sm-640.png) |
| municipality | tablet-768 | 0% | [municipality--village-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/municipality--village-tablet-768.webp) |
| municipality | rail-992 | 4% | [municipality--village-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--village-rail-992.png) |
| municipality | laptop-1024 | 0% | [municipality--village-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--village-laptop-1024.png) |
| municipality | desktop-1440 | 3% | [municipality--village-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/municipality--village-desktop-1440.webp) |
| municipality | wide-1920 | 2% | [municipality--village-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--village-wide-1920.png) |
| other | mobile-390 | 9% | [other--japan-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--japan-mobile-390.webp) |
| other | sm-640 | 0% | [other--japan-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-sm-640.png) |
| other | tablet-768 | 0% | [other--japan-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--japan-tablet-768.webp) |
| other | rail-992 | 0% | [other--japan-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-rail-992.png) |
| other | laptop-1024 | 0% | [other--japan-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-laptop-1024.png) |
| other | desktop-1440 | 0% | [other--japan-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--japan-desktop-1440.webp) |
| other | wide-1920 | 0% | [other--japan-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-wide-1920.png) |
| other | mobile-390 | 8% | [other--municipalities-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--municipalities-mobile-390.webp) |
| other | sm-640 | 10% | [other--municipalities-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-sm-640.png) |
| other | tablet-768 | 6% | [other--municipalities-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--municipalities-tablet-768.webp) |
| other | rail-992 | 4% | [other--municipalities-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-rail-992.png) |
| other | laptop-1024 | 5% | [other--municipalities-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-laptop-1024.png) |
| other | desktop-1440 | 3% | [other--municipalities-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--municipalities-desktop-1440.webp) |
| other | wide-1920 | 2% | [other--municipalities-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-wide-1920.png) |
| other | mobile-390 | 1% | [other--municipalities-theme-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--municipalities-theme-mobile-390.webp) |
| other | sm-640 | 0% | [other--municipalities-theme-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-theme-sm-640.png) |
| other | tablet-768 | 0% | [other--municipalities-theme-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--municipalities-theme-tablet-768.webp) |
| other | rail-992 | 0% | [other--municipalities-theme-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-theme-rail-992.png) |
| other | laptop-1024 | 0% | [other--municipalities-theme-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-theme-laptop-1024.png) |
| other | desktop-1440 | 0% | [other--municipalities-theme-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--municipalities-theme-desktop-1440.webp) |
| other | wide-1920 | 0% | [other--municipalities-theme-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-theme-wide-1920.png) |
| other | mobile-390 | 28% | [other--municipalities-ranking-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--municipalities-ranking-mobile-390.webp) |
| other | sm-640 | 31% | [other--municipalities-ranking-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-ranking-sm-640.png) |
| other | tablet-768 | 31% | [other--municipalities-ranking-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--municipalities-ranking-tablet-768.webp) |
| other | rail-992 | 16% | [other--municipalities-ranking-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-ranking-rail-992.png) |
| other | laptop-1024 | 14% | [other--municipalities-ranking-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-ranking-laptop-1024.png) |
| other | desktop-1440 | 26% | [other--municipalities-ranking-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--municipalities-ranking-desktop-1440.webp) |
| other | wide-1920 | 25% | [other--municipalities-ranking-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-ranking-wide-1920.png) |
| other | mobile-390 | 比較元なし | [other--municipalities-ranking-product-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--municipalities-ranking-product-mobile-390.webp) |
| other | sm-640 | 比較元なし | [other--municipalities-ranking-product-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-ranking-product-sm-640.png) |
| other | tablet-768 | 比較元なし | [other--municipalities-ranking-product-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--municipalities-ranking-product-tablet-768.webp) |
| other | rail-992 | 比較元なし | [other--municipalities-ranking-product-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-ranking-product-rail-992.png) |
| other | laptop-1024 | 比較元なし | [other--municipalities-ranking-product-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-ranking-product-laptop-1024.png) |
| other | desktop-1440 | 比較元なし | [other--municipalities-ranking-product-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--municipalities-ranking-product-desktop-1440.webp) |
| other | wide-1920 | 比較元なし | [other--municipalities-ranking-product-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-ranking-product-wide-1920.png) |
| other | mobile-390 | 35% | [other--municipalities-pref-ranking-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--municipalities-pref-ranking-mobile-390.webp) |
| other | sm-640 | 38% | [other--municipalities-pref-ranking-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-pref-ranking-sm-640.png) |
| other | tablet-768 | 39% | [other--municipalities-pref-ranking-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--municipalities-pref-ranking-tablet-768.webp) |
| other | rail-992 | 38% | [other--municipalities-pref-ranking-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-pref-ranking-rail-992.png) |
| other | laptop-1024 | 38% | [other--municipalities-pref-ranking-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-pref-ranking-laptop-1024.png) |
| other | desktop-1440 | 38% | [other--municipalities-pref-ranking-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--municipalities-pref-ranking-desktop-1440.webp) |
| other | wide-1920 | 38% | [other--municipalities-pref-ranking-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-pref-ranking-wide-1920.png) |
| other | mobile-390 | 9% | [other-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other-mobile-390.webp) |
| other | sm-640 | 8% | [other-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other-sm-640.png) |
| other | tablet-768 | 7% | [other-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other-tablet-768.webp) |
| other | rail-992 | 7% | [other-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other-rail-992.png) |
| other | laptop-1024 | 5% | [other-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other-laptop-1024.png) |
| other | desktop-1440 | 7% | [other-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other-desktop-1440.webp) |
| other | wide-1920 | 8% | [other-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other-wide-1920.png) |
| other | mobile-390 | 41% | [other--municipalities-pref-ranking-tokyo-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--municipalities-pref-ranking-tokyo-mobile-390.webp) |
| other | sm-640 | 44% | [other--municipalities-pref-ranking-tokyo-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-pref-ranking-tokyo-sm-640.png) |
| other | tablet-768 | 45% | [other--municipalities-pref-ranking-tokyo-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--municipalities-pref-ranking-tokyo-tablet-768.webp) |
| other | rail-992 | 41% | [other--municipalities-pref-ranking-tokyo-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-pref-ranking-tokyo-rail-992.png) |
| other | laptop-1024 | 40% | [other--municipalities-pref-ranking-tokyo-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-pref-ranking-tokyo-laptop-1024.png) |
| other | desktop-1440 | 42% | [other--municipalities-pref-ranking-tokyo-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--municipalities-pref-ranking-tokyo-desktop-1440.webp) |
| other | wide-1920 | 41% | [other--municipalities-pref-ranking-tokyo-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-pref-ranking-tokyo-wide-1920.png) |
| other | mobile-390 | 7% | [other--japan-theme-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--japan-theme-mobile-390.webp) |
| other | sm-640 | 7% | [other--japan-theme-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-theme-sm-640.png) |
| other | tablet-768 | 2% | [other--japan-theme-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--japan-theme-tablet-768.webp) |
| other | rail-992 | 0% | [other--japan-theme-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-theme-rail-992.png) |
| other | laptop-1024 | 0% | [other--japan-theme-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-theme-laptop-1024.png) |
| other | desktop-1440 | 0% | [other--japan-theme-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--japan-theme-desktop-1440.webp) |
| other | wide-1920 | 0% | [other--japan-theme-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-theme-wide-1920.png) |
| other | mobile-390 | 1% | [other--search-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--search-mobile-390.webp) |
| other | sm-640 | 0% | [other--search-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--search-sm-640.png) |
| other | tablet-768 | 0% | [other--search-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--search-tablet-768.webp) |
| other | rail-992 | 0% | [other--search-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--search-rail-992.png) |
| other | laptop-1024 | 1% | [other--search-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--search-laptop-1024.png) |
| other | desktop-1440 | 0% | [other--search-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-11-20/other--search-desktop-1440.webp) |
| other | wide-1920 | 0% | [other--search-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--search-wide-1920.png) |

## UI 指摘の場所

- `/geo`
  - a11y: aria-valid-attr (critical, 1 箇所)
- `/geo/layers/population-mesh`
  - small_text: 10px「0人」
  - small_text: 10px「1〜99人」
  - small_text: 10px「100〜999人」
  - small_text: 10px「1,000〜4,999人」
  - small_text: 10px「5,000人以上」
- `/geo/population-land-price`
  - a11y: image-alt (critical, 1 箇所)
  - a11y: link-name (serious, 1 箇所)
- `/privacy`
  - a11y: frame-title (serious, 1 箇所)
  - a11y: image-alt (critical, 2 箇所)
  - a11y: link-name (serious, 1 箇所)
- `/themes/population-dynamics`
  - clipped_text: div.relative.flex.w-full "stats47Toggle Sidebar{"@context":"https:"
  - a11y: color-contrast (serious, 1 箇所)
  - a11y: frame-title (serious, 1 箇所)
  - a11y: link-name (serious, 5 箇所)
  - small_text: 10px「出典: 厚生労働白書 (令和7年版) /」
- `/themes/real-income`
  - line_grid: mixed-cell    div.min-w-0 space-y-4 \| 全国の主要指標 手取りの月収は県でいくらか 可処分所得 53 :: div
  - a11y: frame-title (serious, 2 箇所)
  - a11y: image-alt (critical, 4 箇所)
  - a11y: link-name (serious, 2 箇所)
- `/areas/01000`
  - a11y: color-contrast (serious, 1 箇所)
  - a11y: image-alt (critical, 1 箇所)
  - a11y: link-name (serious, 1 箇所)
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
- `/areas/37000`
  - title_changed: 「香川県の統計データ｜給油所数（道路実延長100km当たり） 全国4位｜47都道府県比較 \| 統計で見る都道府県」→「香川県の統計データ｜生うどん・そばへの支出 全国1位｜47都道府県比較 \| 統計で見る都道府県」
- `/areas/39000`
  - degraded_image: https://storage.stats47.jp/app/areas/39000/specialty/monpa-ebi.webp (HTTP 404)
- `/areas/43000`
  - degraded_image: https://storage.stats47.jp/app/areas/43000/specialty/shichijo-melon.webp (HTTP 404)
- `/areas/45000`
  - degraded_image: https://storage.stats47.jp/app/areas/45000/specialty/miyazaki-jidokko.webp (HTTP 404)
  - degraded_image: https://storage.stats47.jp/app/areas/45000/specialty/miyazaki-boshiitake.webp (HTTP 404)
- `/areas/46000`
  - title_changed: 「鹿児島県の統計データ｜年平均気温 全国2位｜47都道府県比較 \| 統計で見る都道府県」→「鹿児島県の統計データ｜鶏肉への支出 全国1位｜47都道府県比較 \| 統計で見る都道府県」
- `/areas/13000/population-dynamics`
  - clipped_text: div.relative.flex.w-full "stats47Toggle Sidebar{"@context":"https:"
  - line_grid: mixed-cell    div.min-w-0 space-y-4 \| 詳細を見る 人口 統計データを調べる 社会科学書を探す 東京 :: div,div
  - small_text: 10px「出生数」
  - small_text: 10px「死亡数」
  - small_text: 10px「外国人転入者数」
  - small_text: 10px「外国人転出者数」
  - small_text: 10px「出典: 厚生労働白書 (令和7年版) /」
- `/areas/47000/long-term-care`
  - clipped_text: div.relative.flex.w-full "stats47Toggle Sidebar{"@context":"https:"
  - line_grid: mixed-cell    div.min-w-0 space-y-4 \| 詳細を見る 介護施設を探す 医療保険を比較 保険を見直す 沖 :: div,div
- `/ranking/convenience-store-sales`
  - title_changed: 「コンビニエンスストア販売額ランキング都道府県【2025年】｜1位東京都（155,869百万円） \| 統計で見る都道府県」→「コンビニエンスストア販売額（年計）ランキング都道府県 \| 統計で見る都道府県」
- `/ranking/electricity-generation-capacity`
  - title_changed: 「発電電力量ランキング都道府県【2023年】｜1位千葉県（80,635,294Ｍｗｈ） \| 統計で見る都道府県」→「発電電力量ランキング都道府県【2023年】｜1位千葉県（80,635,294MWh） \| 統計で見る都道府県」
- `/ranking/junior-high-club-per100-swimming`
  - a11y: color-contrast (serious, 17 箇所)
  - a11y: frame-title (serious, 1 箇所)
  - a11y: image-alt (critical, 3 箇所)
  - a11y: link-name (serious, 2 箇所)
- `/ranking/national-pension-full-exemption-rate`
  - a11y: color-contrast (serious, 17 箇所)
  - a11y: frame-title (serious, 1 箇所)
  - a11y: image-alt (critical, 3 箇所)
  - a11y: link-name (serious, 2 箇所)
  - a11y: nested-interactive (serious, 1 箇所)
- `/ranking/natto-consumption-expenditure`
  - clipped_text: div.relative.flex.w-full "stats47Toggle Sidebar{"@context":"https:"
  - a11y: color-contrast (serious, 17 箇所)
  - a11y: image-alt (critical, 1 箇所)
  - a11y: link-name (serious, 1 箇所)
  - a11y: nested-interactive (serious, 1 箇所)
- `/ranking/population-growth-rate`
  - clipped_text: div.relative.flex.w-full "stats47Toggle Sidebar{"@context":"https:"
  - a11y: color-contrast (serious, 17 箇所)
  - a11y: frame-title (serious, 1 箇所)
  - a11y: image-alt (critical, 1 箇所)
  - a11y: link-name (serious, 5 箇所)
  - a11y: nested-interactive (serious, 1 箇所)
- `/ranking/smartphone-usage-rate-by-sex`
  - clipped_text: div.relative.flex.w-full "stats47Toggle Sidebar{"@context":"https:"
  - a11y: color-contrast (serious, 16 箇所)
  - a11y: frame-title (serious, 1 箇所)
  - a11y: image-alt (critical, 2 箇所)
  - a11y: link-name (serious, 1 箇所)
- `/ranking/total-population`
  - clipped_text: div.relative.flex.w-full "stats47Toggle Sidebar{"@context":"https:"
  - a11y: color-contrast (serious, 17 箇所)
  - a11y: frame-title (serious, 1 箇所)
  - a11y: link-name (serious, 3 箇所)
  - a11y: nested-interactive (serious, 1 箇所)
- `/blog`
  - a11y: frame-title (serious, 1 箇所)
  - a11y: link-name (serious, 4 箇所)
  - small_text: 10px「183」
  - small_text: 10px「91」
  - small_text: 10px「75」
  - small_text: 10px「51」
  - small_text: 10px「34」
  - small_text: 10px「27」
  - small_text: 10px「22」
  - small_text: 10px「21」
  - small_text: 10px「19」
  - small_text: 10px「17」
- `/blog/2050-population-flood-exposure`
  - internal_jargon: 保存則 ×5
  - broken_image: https://storage.stats47.jp/app/blog/2050-population-flood-exposure/data/flood-tile-grid-dark.svg (HTTP 404)
- `/blog/2050-population-map-reading`
  - internal_jargon: 保存則 ×1
- `/blog/2050-station-access-population`
  - internal_jargon: 保存則 ×8
  - broken_image: https://storage.stats47.jp/app/blog/2050-station-access-population/data/station-access-2050-map-dark.svg (HTTP 404)
- `/blog/academic-achievement-lifestyle-habits`
  - blog_svg_text: https://storage.stats47.jp/app/blog/academic-achievement-lifestyle-habits/data/tutoring-math-scatter.svg (1 件: はみ出し "出典：国立教育政策研究所「全国学力・学…" right +460px)
  - blog_svg_text: https://storage.stats47.jp/app/blog/academic-achievement-lifestyle-habits/data/tutoring-math-scatter-dark.svg (1 件: はみ出し "出典：国立教育政策研究所「全国学力・学…" right +460px)
  - blog_svg_text: https://storage.stats47.jp/app/blog/academic-achievement-lifestyle-habits/data/breakfast-math-scatter.svg (1 件: はみ出し "出典：国立教育政策研究所「全国学力・学…" right +460px)
  - blog_svg_text: https://storage.stats47.jp/app/blog/academic-achievement-lifestyle-habits/data/breakfast-math-scatter-dark.svg (1 件: はみ出し "出典：国立教育政策研究所「全国学力・学…" right +460px)
  - blog_svg_text: https://storage.stats47.jp/app/blog/academic-achievement-lifestyle-habits/data/study-1h-math-scatter.svg (1 件: はみ出し "出典：国立教育政策研究所「全国学力・学…" right +460px)
  - blog_svg_text: https://storage.stats47.jp/app/blog/academic-achievement-lifestyle-habits/data/study-1h-math-scatter-dark.svg (1 件: はみ出し "出典：国立教育政策研究所「全国学力・学…" right +460px)
- `/blog/academic-achievement-test-prefecture-ranking`
  - blog_svg_text: https://storage.stats47.jp/app/blog/academic-achievement-test-prefecture-ranking/data/academic-achievement-ranking.svg (2 件: はみ出し "全国学力テスト平均正答率ランキング" right +208px / はみ出し "公立小学校6年生の国語・算数と公立中学…" right +79px)
  - blog_svg_text: https://storage.stats47.jp/app/blog/academic-achievement-test-prefecture-ranking/data/academic-achievement-ranking-dark.svg (2 件: はみ出し "全国学力テスト平均正答率ランキング" right +208px / はみ出し "公立小学校6年生の国語・算数と公立中学…" right +79px)
- `/blog/adult-sneakers-consumption-expenditure-prefecture-gap`
  - blog_svg_text: https://storage.stats47.jp/app/blog/adult-sneakers-consumption-expenditure-prefecture-gap/data/adult-sneakers-consumption-expenditure-prefecture-gap-prefecture-rankings.svg (1 件: はみ出し "大人用運動靴消費支出額ランキング" right +136px)
  - blog_svg_text: https://storage.stats47.jp/app/blog/adult-sneakers-consumption-expenditure-prefecture-gap/data/adult-sneakers-consumption-expenditure-prefecture-gap-prefecture-rankings-dark.svg (1 件: はみ出し "大人用運動靴消費支出額ランキング" right +136px)
- `/blog/advancement-plus-employment-rate-prefecture`
  - blog_svg_text: https://storage.stats47.jp/app/blog/advancement-plus-employment-rate-prefecture/data/advancement-rate-ranking.svg (1 件: はみ出し "高等学校卒業者の進学率ランキング" right +136px)
  - blog_svg_text: https://storage.stats47.jp/app/blog/advancement-plus-employment-rate-prefecture/data/advancement-rate-ranking-dark.svg (1 件: はみ出し "高等学校卒業者の進学率ランキング" right +136px)
  - blog_svg_text: https://storage.stats47.jp/app/blog/advancement-plus-employment-rate-prefecture/data/job-ratio-ranking.svg (1 件: はみ出し "高等学校卒業者に占める就職者の割合ラン…" right +568px)
  - blog_svg_text: https://storage.stats47.jp/app/blog/advancement-plus-employment-rate-prefecture/data/job-ratio-ranking-dark.svg (1 件: はみ出し "高等学校卒業者に占める就職者の割合ラン…" right +568px)
  - blog_svg_text: https://storage.stats47.jp/app/blog/advancement-plus-employment-rate-prefecture/data/combined-index-ranking.svg (1 件: はみ出し "進学率＋就職者割合の合成指数ランキング" right +352px)
  - blog_svg_text: https://storage.stats47.jp/app/blog/advancement-plus-employment-rate-prefecture/data/combined-index-ranking-dark.svg (1 件: はみ出し "進学率＋就職者割合の合成指数ランキング" right +352px)
- `/blog/aging-solo-living-crisis`
  - blog_svg_text: https://storage.stats47.jp/app/blog/aging-solo-living-crisis/data/aging-solo-ranking.svg (1 件: はみ出し "65歳以上世帯員の単独世帯の割合ランキ…" right +431px)
  - blog_svg_text: https://storage.stats47.jp/app/blog/aging-solo-living-crisis/data/aging-solo-ranking-dark.svg (1 件: はみ出し "65歳以上世帯員の単独世帯の割合ランキ…" right +431px)
- `/blog/agriculture-output-employment-productivity-gap`
  - blog_svg_text: https://storage.stats47.jp/app/blog/agriculture-output-employment-productivity-gap/data/agricultural-output-per-worker-2014-ranking.svg (1 件: はみ出し "就業人口1人あたり農業産出額（参考値）…" right +680px)
  - blog_svg_text: https://storage.stats47.jp/app/blog/agriculture-output-employment-productivity-gap/data/agricultural-output-per-worker-2014-ranking-dark.svg (1 件: はみ出し "就業人口1人あたり農業産出額（参考値）…" right +680px)
- `/blog/aichi-food-culture`
  - title_changed: 「愛知の食卓｜ウイスキー消費支出額1位5,733円・生うどん3位・みそ43位、2024年家計調査 \| 統計で見る都道府県」→「愛知の食卓｜生うどん・そば4,328円・みそ2,316円・ウイスキー1,533円、2025年家計調査 \| 統計で見る都道府県」
- `/blog/air-conditioner-consumption-quantity-prefecture-gap`
  - title_changed: 「エアコン消費量ランキング 都道府県別 2024年 \| 統計で見る都道府県」→「エアコン消費量ランキング 都道府県別 2025年｜新潟が最多、香川は43位 \| 統計で見る都道府県」
- `/blog/airport-count-vs-physical-disability-rehabilitation`
  - blog_svg_text: https://storage.stats47.jp/app/blog/airport-count-vs-physical-disability-rehabilitation/data/physical-disability-rehabilitation-facility-residents-prefecture-rankings.svg (1 件: はみ出し "身体障害者更生援護施設在所者数ランキング" right +424px)
  - blog_svg_text: https://storage.stats47.jp/app/blog/airport-count-vs-physical-disability-rehabilitation/data/physical-disability-rehabilitation-facility-residents-prefecture-rankings-dark.svg (1 件: はみ出し "身体障害者更生援護施設在所者数ランキング" right +424px)
- `/blog/alcohol-prefecture-map`
  - broken_image: https://storage.stats47.jp/app/blog/alcohol-prefecture-map/data/alcohol-consumption-ranking-dark.svg (HTTP 404)
  - broken_image: https://storage.stats47.jp/app/blog/alcohol-prefecture-map/data/alcohol-consumption-map-dark.svg (HTTP 404)
  - broken_image: https://storage.stats47.jp/app/blog/alcohol-prefecture-map/data/shochu-consumption-ranking-dark.svg (HTTP 404)
- `/blog/aquaculture-harvest-prefecture-gap`
  - broken_image: https://storage.stats47.jp/app/blog/aquaculture-harvest-prefecture-gap/data/aquaculture-harvest-prefecture-gap-prefecture-rankings-dark.svg (HTTP 404)
  - broken_image: https://storage.stats47.jp/app/blog/aquaculture-harvest-prefecture-gap/data/aquaculture-harvest-prefecture-gap-map-dark.svg (HTTP 404)
- `/blog/automobile-related-group-consumption-expenditure-prefecture`
  - blog_svg_text: https://storage.stats47.jp/app/blog/automobile-related-group-consumption-expenditure-prefecture/data/automobile-related-group-consumption-expenditure-prefecture-prefecture-rankings.svg (1 件: はみ出し "自動車等関係費消費支出額ランキング" right +208px)
  - blog_svg_text: https://storage.stats47.jp/app/blog/automobile-related-group-consumption-expenditure-prefecture/data/automobile-related-group-consumption-expenditure-prefecture-prefecture-rankings-dark.svg (1 件: はみ出し "自動車等関係費消費支出額ランキング" right +208px)
- `/blog/automotive-industry-transformation-map`
  - blog_svg_text: https://storage.stats47.jp/app/blog/automotive-industry-transformation-map/data/manufacturing-shipment-ranking.svg (1 件: はみ出し "製造品出荷額等（全業種合計）ランキング" right +352px)
  - blog_svg_text: https://storage.stats47.jp/app/blog/automotive-industry-transformation-map/data/manufacturing-shipment-ranking-dark.svg (1 件: はみ出し "製造品出荷額等（全業種合計）ランキング" right +352px)
- `/blog/average-height-primary-school-fifth-grade-male-vs-other`
  - blog_svg_text: https://storage.stats47.jp/app/blog/average-height-primary-school-fifth-grade-male-vs-other/data/other-processed-fish-ext-consumption-expenditure-prefecture-rankings.svg (1 件: はみ出し "他の魚介加工品のその他消費支出額ランキ…" right +496px)
  - blog_svg_text: https://storage.stats47.jp/app/blog/average-height-primary-school-fifth-grade-male-vs-other/data/other-processed-fish-ext-consumption-expenditure-prefecture-rankings-dark.svg (1 件: はみ出し "他の魚介加工品のその他消費支出額ランキ…" right +496px)
- `/blog/avg-height-high-school-2nd-male-vs-fish-pickled-consumption`
  - blog_svg_text: https://storage.stats47.jp/app/blog/avg-height-high-school-2nd-male-vs-fish-pickled-consumption/data/fish-pickled-consumption-expenditure-prefecture-rankings.svg (1 件: はみ出し "魚介の漬物消費支出額ランキング" right +64px)
  - blog_svg_text: https://storage.stats47.jp/app/blog/avg-height-high-school-2nd-male-vs-fish-pickled-consumption/data/fish-pickled-consumption-expenditure-prefecture-rankings-dark.svg (1 件: はみ出し "魚介の漬物消費支出額ランキング" right +64px)
- ほか 492 URL (latest.json の ui_findings を参照)
