# ページ品質監査 Latest — 2026-10-30

- モード: full / 対象 9138 URL / commit 1571f943714de2b705f39982ffb11449e6803461
- 違反: **error 7805 / warning 7495**

## テンプレート別集計

| テンプレート | URL数 | error | warning |
|---|---|---|---|
| home | 1 | 0 | 5 |
| ranking | 2460 | 2460 | 1032 |
| prefecture-list | 1 | 3 | 4 |
| theme | 57 | 52 | 60 |
| geo-analysis | 72 | 186 | 82 |
| other | 1335 | 1726 | 114 |
| prefecture-detail | 2538 | 1792 | 2755 |
| blog | 1 | 1 | 3 |
| blog-article | 765 | 1075 | 903 |
| category | 17 | 1 | 30 |
| survey | 150 | 301 | 92 |
| municipality | 1741 | 208 | 2415 |

## 違反の詳細

上位 100 件 (error を先に) / 全 15300 件。全件は R2 `state/page-quality/latest.json` (`npm run state:pull -- page-quality`)。

| URL | metric | 実測 | 前回 | 閾値 | 種別 |
|---|---|---|---|---|---|
| `/areas` | html_bytes (delta_pct) | 110.8 | 131052 | <= 30 | 🚨 |
| `/areas` | rsc_bytes (delta_pct) | 39.6 | 63002 | <= 30 | 🚨 |
| `/areas` | dom_nodes (delta_pct) | 80.2 | 509 | <= 30 | 🚨 |
| `/themes` | html_bytes (delta_pct) | 93.4 | 155427 | <= 30 | 🚨 |
| `/themes` | rsc_bytes (delta_pct) | 33.8 | 86864 | <= 30 | 🚨 |
| `/themes` | dom_nodes (delta_pct) | 96 | 425 | <= 30 | 🚨 |
| `/themes` | duplicate_link_ratio (absolute) | 0.4103 | - | <= 0.3 | 🚨 |
| `/geo` | console_errors (absolute) | 3 | - | <= 0 | 🚨 |
| `/geo` | page_errors (absolute) | 3 | - | <= 0 | 🚨 |
| `/geo/compare` | html_bytes (delta_pct) | 146.5 | 96383 | <= 30 | 🚨 |
| `/geo/compare` | rsc_bytes (delta_pct) | 40.8 | 61143 | <= 30 | 🚨 |
| `/geo/compare` | dom_nodes (delta_pct) | 165.3 | 248 | <= 30 | 🚨 |
| `/geo/method` | html_bytes (delta_pct) | 125.8 | 112446 | <= 30 | 🚨 |
| `/geo/method` | dom_nodes (delta_pct) | 124.3 | 329 | <= 30 | 🚨 |
| `/geo/data-catalog` | html_bytes (delta_pct) | 125.1 | 114511 | <= 30 | 🚨 |
| `/geo/data-catalog` | dom_nodes (delta_pct) | 105.1 | 395 | <= 30 | 🚨 |
| `/geo/layers/population-mesh` | dom_nodes (delta_pct) | 66.7 | 438 | <= 30 | 🚨 |
| `/geo/layers/residential-land-price` | html_bytes (delta_pct) | 79.8 | 184595 | <= 30 | 🚨 |
| `/geo/layers/residential-land-price` | dom_nodes (delta_pct) | 107 | 343 | <= 30 | 🚨 |
| `/geo/layers/station-points` | html_bytes (delta_pct) | 79 | 186401 | <= 30 | 🚨 |
| `/geo/layers/station-points` | dom_nodes (delta_pct) | 107 | 343 | <= 30 | 🚨 |
| `/geo/population-land-price` | dom_nodes (delta_pct) | 33.7 | 1133 | <= 30 | 🚨 |
| `/geo/population-flood-risk` | html_bytes (delta_pct) | 32.6 | 392633 | <= 30 | 🚨 |
| `/geo/population-flood-risk` | dom_nodes (delta_pct) | 41.8 | 894 | <= 30 | 🚨 |
| `/geo/population-station-access` | html_bytes (delta_pct) | 39.1 | 329436 | <= 30 | 🚨 |
| `/geo/population-station-access` | dom_nodes (delta_pct) | 44 | 884 | <= 30 | 🚨 |
| `/geo/population-snow-designation` | html_bytes (delta_pct) | 55 | 282936 | <= 30 | 🚨 |
| `/geo/population-snow-designation` | dom_nodes (delta_pct) | 45.1 | 881 | <= 30 | 🚨 |
| `/geo/population-landslide-exposure` | html_bytes (delta_pct) | 38.8 | 400977 | <= 30 | 🚨 |
| `/geo/population-landslide-exposure` | dom_nodes (delta_pct) | 42 | 874 | <= 30 | 🚨 |
| `/geo/population-low-elevation` | dom_nodes (delta_pct) | 38.6 | 954 | <= 30 | 🚨 |
| `/geo/population-public-facility-access` | html_bytes (delta_pct) | 39.1 | 400104 | <= 30 | 🚨 |
| `/geo/population-land-price/47/overlap` | dom_nodes (delta_pct) | 33.6 | 1133 | <= 30 | 🚨 |
| `/geo/population-land-price/27/overlap` | dom_nodes (delta_pct) | 33.6 | 1133 | <= 30 | 🚨 |
| `/geo/population-flood-risk/15/overlap` | html_bytes (delta_pct) | 32.5 | 393685 | <= 30 | 🚨 |
| `/geo/population-flood-risk/15/overlap` | dom_nodes (delta_pct) | 41.9 | 893 | <= 30 | 🚨 |
| `/geo/population-flood-risk/13/overlap` | html_bytes (delta_pct) | 32.5 | 393685 | <= 30 | 🚨 |
| `/geo/population-flood-risk/13/overlap` | dom_nodes (delta_pct) | 41.9 | 893 | <= 30 | 🚨 |
| `/geo/population-flood-risk/01/overlap` | html_bytes (delta_pct) | 32.5 | 393685 | <= 30 | 🚨 |
| `/geo/population-flood-risk/01/overlap` | dom_nodes (delta_pct) | 41.9 | 893 | <= 30 | 🚨 |
| `/geo/population-station-access/13/overlap` | html_bytes (delta_pct) | 38.9 | 330426 | <= 30 | 🚨 |
| `/geo/population-station-access/13/overlap` | dom_nodes (delta_pct) | 44.1 | 883 | <= 30 | 🚨 |
| `/geo/population-station-access/01/overlap` | html_bytes (delta_pct) | 38.9 | 330426 | <= 30 | 🚨 |
| `/geo/population-station-access/01/overlap` | dom_nodes (delta_pct) | 44.1 | 883 | <= 30 | 🚨 |
| `/geo/datasets/G04-a` | html_bytes (delta_pct) | 108.2 | 197548 | <= 30 | 🚨 |
| `/geo/datasets/G04-a` | dom_nodes (delta_pct) | 52.2 | 812 | <= 30 | 🚨 |
| `/geo/datasets/G04-a` | duplicate_link_ratio (absolute) | 0.3173 | - | <= 0.3 | 🚨 |
| `/geo/datasets/L01` | html_bytes (delta_pct) | 122 | 173155 | <= 30 | 🚨 |
| `/geo/datasets/L01` | dom_nodes (delta_pct) | 54.8 | 781 | <= 30 | 🚨 |
| `/geo/datasets/L01` | duplicate_link_ratio (absolute) | 0.3173 | - | <= 0.3 | 🚨 |
| `/geo/datasets/L02` | html_bytes (delta_pct) | 122.2 | 172923 | <= 30 | 🚨 |
| `/geo/datasets/L02` | dom_nodes (delta_pct) | 55 | 778 | <= 30 | 🚨 |
| `/geo/datasets/L02` | duplicate_link_ratio (absolute) | 0.3173 | - | <= 0.3 | 🚨 |
| `/geo/datasets/L03-a` | html_bytes (delta_pct) | 111.5 | 191804 | <= 30 | 🚨 |
| `/geo/datasets/L03-a` | dom_nodes (delta_pct) | 52.4 | 811 | <= 30 | 🚨 |
| `/geo/datasets/L03-a` | duplicate_link_ratio (absolute) | 0.3173 | - | <= 0.3 | 🚨 |
| `/geo/datasets/W09` | html_bytes (delta_pct) | 122.2 | 172903 | <= 30 | 🚨 |
| `/geo/datasets/W09` | dom_nodes (delta_pct) | 55 | 778 | <= 30 | 🚨 |
| `/geo/datasets/W09` | duplicate_link_ratio (absolute) | 0.3173 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A16` | html_bytes (delta_pct) | 121.5 | 173901 | <= 30 | 🚨 |
| `/geo/datasets/A16` | dom_nodes (delta_pct) | 54.8 | 781 | <= 30 | 🚨 |
| `/geo/datasets/A16` | duplicate_link_ratio (absolute) | 0.3173 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A17` | html_bytes (delta_pct) | 116.7 | 182255 | <= 30 | 🚨 |
| `/geo/datasets/A17` | dom_nodes (delta_pct) | 53 | 805 | <= 30 | 🚨 |
| `/geo/datasets/A17` | duplicate_link_ratio (absolute) | 0.3173 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A22` | html_bytes (delta_pct) | 119 | 178765 | <= 30 | 🚨 |
| `/geo/datasets/A22` | dom_nodes (delta_pct) | 53.4 | 801 | <= 30 | 🚨 |
| `/geo/datasets/A22` | duplicate_link_ratio (absolute) | 0.3173 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A31b` | duplicate_link_ratio (absolute) | 0.3206 | - | <= 0.3 | 🚨 |
| `/geo/datasets/A38` | html_bytes (delta_pct) | 106.5 | 200772 | <= 30 | 🚨 |
| `/geo/datasets/A38` | dom_nodes (delta_pct) | 51.5 | 822 | <= 30 | 🚨 |
| `/geo/datasets/A38` | duplicate_link_ratio (absolute) | 0.3173 | - | <= 0.3 | 🚨 |
| `/geo/datasets/N03` | html_bytes (delta_pct) | 111.9 | 190082 | <= 30 | 🚨 |
| `/geo/datasets/N03` | dom_nodes (delta_pct) | 52.9 | 804 | <= 30 | 🚨 |
| `/geo/datasets/N03` | duplicate_link_ratio (absolute) | 0.3173 | - | <= 0.3 | 🚨 |
| `/geo/datasets/P04` | html_bytes (delta_pct) | 115.4 | 184337 | <= 30 | 🚨 |
| `/geo/datasets/P04` | dom_nodes (delta_pct) | 52.5 | 814 | <= 30 | 🚨 |
| `/geo/datasets/P04` | duplicate_link_ratio (absolute) | 0.3173 | - | <= 0.3 | 🚨 |
| `/geo/datasets/P05` | html_bytes (delta_pct) | 117.2 | 181466 | <= 30 | 🚨 |
| `/geo/datasets/P05` | dom_nodes (delta_pct) | 53.2 | 802 | <= 30 | 🚨 |
| `/geo/datasets/P05` | duplicate_link_ratio (absolute) | 0.3173 | - | <= 0.3 | 🚨 |
| `/geo/datasets/P11` | html_bytes (delta_pct) | 118.5 | 179577 | <= 30 | 🚨 |
| `/geo/datasets/P11` | dom_nodes (delta_pct) | 53.6 | 796 | <= 30 | 🚨 |
| `/geo/datasets/P11` | duplicate_link_ratio (absolute) | 0.3173 | - | <= 0.3 | 🚨 |
| `/geo/datasets/P29` | html_bytes (delta_pct) | 115.7 | 183949 | <= 30 | 🚨 |
| `/geo/datasets/P29` | dom_nodes (delta_pct) | 52.7 | 811 | <= 30 | 🚨 |
| `/geo/datasets/P29` | duplicate_link_ratio (absolute) | 0.3173 | - | <= 0.3 | 🚨 |
| `/geo/datasets/P36` | html_bytes (delta_pct) | 118.6 | 179410 | <= 30 | 🚨 |
| `/geo/datasets/P36` | dom_nodes (delta_pct) | 53.6 | 796 | <= 30 | 🚨 |
| `/geo/datasets/P36` | duplicate_link_ratio (absolute) | 0.3173 | - | <= 0.3 | 🚨 |
| `/geo/datasets/C28` | html_bytes (delta_pct) | 119.6 | 177952 | <= 30 | 🚨 |
| `/geo/datasets/C28` | dom_nodes (delta_pct) | 53.2 | 804 | <= 30 | 🚨 |
| `/geo/datasets/C28` | duplicate_link_ratio (absolute) | 0.3173 | - | <= 0.3 | 🚨 |
| `/geo/datasets/N02` | html_bytes (delta_pct) | 121.1 | 177577 | <= 30 | 🚨 |
| `/geo/datasets/N02` | dom_nodes (delta_pct) | 53.5 | 807 | <= 30 | 🚨 |
| `/geo/datasets/N02` | duplicate_link_ratio (absolute) | 0.3158 | - | <= 0.3 | 🚨 |
| `/geo/datasets/N07` | html_bytes (delta_pct) | 119.1 | 178694 | <= 30 | 🚨 |
| `/geo/datasets/N07` | dom_nodes (delta_pct) | 53.8 | 793 | <= 30 | 🚨 |
| `/geo/datasets/N07` | duplicate_link_ratio (absolute) | 0.3173 | - | <= 0.3 | 🚨 |
| `/geo/datasets/S12` | html_bytes (delta_pct) | 120.3 | 175631 | <= 30 | 🚨 |

## 代表URLのスクショ (先週比の変化)

| テンプレート | 端末 | 先週比 | スクショ |
|---|---|---|---|
| home | mobile-390 | 29% | [home-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/home-mobile-390.webp) |
| home | sm-640 | 27% | [home-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/home-sm-640.png) |
| home | tablet-768 | 21% | [home-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/home-tablet-768.webp) |
| home | rail-992 | 14% | [home-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/home-rail-992.png) |
| home | laptop-1024 | 22% | [home-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/home-laptop-1024.png) |
| home | desktop-1440 | 11% | [home-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/home-desktop-1440.webp) |
| home | wide-1920 | 9% | [home-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/home-wide-1920.png) |
| ranking | mobile-390 | 67% | [ranking--index-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/ranking--index-mobile-390.webp) |
| ranking | sm-640 | 67% | [ranking--index-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--index-sm-640.png) |
| ranking | tablet-768 | 56% | [ranking--index-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/ranking--index-tablet-768.webp) |
| ranking | rail-992 | 54% | [ranking--index-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--index-rail-992.png) |
| ranking | laptop-1024 | 25% | [ranking--index-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--index-laptop-1024.png) |
| ranking | desktop-1440 | 62% | [ranking--index-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/ranking--index-desktop-1440.webp) |
| ranking | wide-1920 | 60% | [ranking--index-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--index-wide-1920.png) |
| prefecture-list | mobile-390 | 15% | [prefecture-list-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/prefecture-list-mobile-390.webp) |
| prefecture-list | sm-640 | 14% | [prefecture-list-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-list-sm-640.png) |
| prefecture-list | tablet-768 | 15% | [prefecture-list-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/prefecture-list-tablet-768.webp) |
| prefecture-list | rail-992 | 13% | [prefecture-list-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-list-rail-992.png) |
| prefecture-list | laptop-1024 | 13% | [prefecture-list-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-list-laptop-1024.png) |
| prefecture-list | desktop-1440 | 15% | [prefecture-list-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/prefecture-list-desktop-1440.webp) |
| prefecture-list | wide-1920 | 16% | [prefecture-list-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-list-wide-1920.png) |
| theme | mobile-390 | 10% | [theme--index-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/theme--index-mobile-390.webp) |
| theme | sm-640 | 11% | [theme--index-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--index-sm-640.png) |
| theme | tablet-768 | 9% | [theme--index-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/theme--index-tablet-768.webp) |
| theme | rail-992 | 9% | [theme--index-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--index-rail-992.png) |
| theme | laptop-1024 | 11% | [theme--index-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--index-laptop-1024.png) |
| theme | desktop-1440 | 7% | [theme--index-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/theme--index-desktop-1440.webp) |
| theme | wide-1920 | 5% | [theme--index-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--index-wide-1920.png) |
| geo-analysis | mobile-390 | 14% | [geo-analysis-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/geo-analysis-mobile-390.webp) |
| geo-analysis | sm-640 | 28% | [geo-analysis-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis-sm-640.png) |
| geo-analysis | tablet-768 | 22% | [geo-analysis-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/geo-analysis-tablet-768.webp) |
| geo-analysis | rail-992 | 7% | [geo-analysis-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis-rail-992.png) |
| geo-analysis | laptop-1024 | 7% | [geo-analysis-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis-laptop-1024.png) |
| geo-analysis | desktop-1440 | 12% | [geo-analysis-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/geo-analysis-desktop-1440.webp) |
| geo-analysis | wide-1920 | 10% | [geo-analysis-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis-wide-1920.png) |
| geo-analysis | mobile-390 | 11% | [geo-analysis--compare-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/geo-analysis--compare-mobile-390.webp) |
| geo-analysis | sm-640 | 8% | [geo-analysis--compare-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--compare-sm-640.png) |
| geo-analysis | tablet-768 | 10% | [geo-analysis--compare-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/geo-analysis--compare-tablet-768.webp) |
| geo-analysis | rail-992 | 9% | [geo-analysis--compare-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--compare-rail-992.png) |
| geo-analysis | laptop-1024 | 15% | [geo-analysis--compare-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--compare-laptop-1024.png) |
| geo-analysis | desktop-1440 | 6% | [geo-analysis--compare-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/geo-analysis--compare-desktop-1440.webp) |
| geo-analysis | wide-1920 | 6% | [geo-analysis--compare-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--compare-wide-1920.png) |
| geo-analysis | mobile-390 | 14% | [geo-analysis--layer-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/geo-analysis--layer-mobile-390.webp) |
| geo-analysis | sm-640 | 14% | [geo-analysis--layer-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--layer-sm-640.png) |
| geo-analysis | tablet-768 | 14% | [geo-analysis--layer-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/geo-analysis--layer-tablet-768.webp) |
| geo-analysis | rail-992 | 17% | [geo-analysis--layer-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--layer-rail-992.png) |
| geo-analysis | laptop-1024 | 16% | [geo-analysis--layer-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--layer-laptop-1024.png) |
| geo-analysis | desktop-1440 | 16% | [geo-analysis--layer-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/geo-analysis--layer-desktop-1440.webp) |
| geo-analysis | wide-1920 | 13% | [geo-analysis--layer-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--layer-wide-1920.png) |
| geo-analysis | mobile-390 | 15% | [geo-analysis--analysis-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/geo-analysis--analysis-mobile-390.webp) |
| geo-analysis | sm-640 | 13% | [geo-analysis--analysis-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-sm-640.png) |
| geo-analysis | tablet-768 | 13% | [geo-analysis--analysis-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/geo-analysis--analysis-tablet-768.webp) |
| geo-analysis | rail-992 | 14% | [geo-analysis--analysis-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-rail-992.png) |
| geo-analysis | laptop-1024 | 16% | [geo-analysis--analysis-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-laptop-1024.png) |
| geo-analysis | desktop-1440 | 14% | [geo-analysis--analysis-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/geo-analysis--analysis-desktop-1440.webp) |
| geo-analysis | wide-1920 | 11% | [geo-analysis--analysis-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-wide-1920.png) |
| geo-analysis | mobile-390 | 14% | [geo-analysis--analysis-pref-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/geo-analysis--analysis-pref-mobile-390.webp) |
| geo-analysis | sm-640 | 11% | [geo-analysis--analysis-pref-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-pref-sm-640.png) |
| geo-analysis | tablet-768 | 11% | [geo-analysis--analysis-pref-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/geo-analysis--analysis-pref-tablet-768.webp) |
| geo-analysis | rail-992 | 11% | [geo-analysis--analysis-pref-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-pref-rail-992.png) |
| geo-analysis | laptop-1024 | 14% | [geo-analysis--analysis-pref-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-pref-laptop-1024.png) |
| geo-analysis | desktop-1440 | 11% | [geo-analysis--analysis-pref-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/geo-analysis--analysis-pref-desktop-1440.webp) |
| geo-analysis | wide-1920 | 8% | [geo-analysis--analysis-pref-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-pref-wide-1920.png) |
| geo-analysis | mobile-390 | 17% | [geo-analysis--dataset-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/geo-analysis--dataset-mobile-390.webp) |
| geo-analysis | sm-640 | 18% | [geo-analysis--dataset-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--dataset-sm-640.png) |
| geo-analysis | tablet-768 | 18% | [geo-analysis--dataset-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/geo-analysis--dataset-tablet-768.webp) |
| geo-analysis | rail-992 | 16% | [geo-analysis--dataset-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--dataset-rail-992.png) |
| geo-analysis | laptop-1024 | 21% | [geo-analysis--dataset-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--dataset-laptop-1024.png) |
| geo-analysis | desktop-1440 | 15% | [geo-analysis--dataset-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/geo-analysis--dataset-desktop-1440.webp) |
| geo-analysis | wide-1920 | 12% | [geo-analysis--dataset-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--dataset-wide-1920.png) |
| other | mobile-390 | 14% | [other--about-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other--about-mobile-390.webp) |
| other | sm-640 | 12% | [other--about-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--about-sm-640.png) |
| other | tablet-768 | 17% | [other--about-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other--about-tablet-768.webp) |
| other | rail-992 | 17% | [other--about-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--about-rail-992.png) |
| other | laptop-1024 | 10% | [other--about-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--about-laptop-1024.png) |
| other | desktop-1440 | 17% | [other--about-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other--about-desktop-1440.webp) |
| other | wide-1920 | 18% | [other--about-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--about-wide-1920.png) |
| other | mobile-390 | 12% | [other--products-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other--products-mobile-390.webp) |
| other | sm-640 | 9% | [other--products-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--products-sm-640.png) |
| other | tablet-768 | 11% | [other--products-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other--products-tablet-768.webp) |
| other | rail-992 | 9% | [other--products-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--products-rail-992.png) |
| other | laptop-1024 | 9% | [other--products-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--products-laptop-1024.png) |
| other | desktop-1440 | 8% | [other--products-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other--products-desktop-1440.webp) |
| other | wide-1920 | 7% | [other--products-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--products-wide-1920.png) |
| other | mobile-390 | 11% | [other--product-item-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other--product-item-mobile-390.webp) |
| other | sm-640 | 11% | [other--product-item-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--product-item-sm-640.png) |
| other | tablet-768 | 9% | [other--product-item-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other--product-item-tablet-768.webp) |
| other | rail-992 | 9% | [other--product-item-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--product-item-rail-992.png) |
| other | laptop-1024 | 12% | [other--product-item-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--product-item-laptop-1024.png) |
| other | desktop-1440 | 6% | [other--product-item-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other--product-item-desktop-1440.webp) |
| other | wide-1920 | 5% | [other--product-item-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--product-item-wide-1920.png) |
| theme | mobile-390 | 9% | [theme-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/theme-mobile-390.webp) |
| theme | sm-640 | 9% | [theme-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme-sm-640.png) |
| theme | tablet-768 | 9% | [theme-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/theme-tablet-768.webp) |
| theme | rail-992 | 10% | [theme-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme-rail-992.png) |
| theme | laptop-1024 | 8% | [theme-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme-laptop-1024.png) |
| theme | desktop-1440 | 9% | [theme-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/theme-desktop-1440.webp) |
| theme | wide-1920 | 8% | [theme-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme-wide-1920.png) |
| theme | mobile-390 | 15% | [theme--real-income-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/theme--real-income-mobile-390.webp) |
| theme | sm-640 | 13% | [theme--real-income-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--real-income-sm-640.png) |
| theme | tablet-768 | 9% | [theme--real-income-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/theme--real-income-tablet-768.webp) |
| theme | rail-992 | 9% | [theme--real-income-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--real-income-rail-992.png) |
| theme | laptop-1024 | 6% | [theme--real-income-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--real-income-laptop-1024.png) |
| theme | desktop-1440 | 7% | [theme--real-income-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/theme--real-income-desktop-1440.webp) |
| theme | wide-1920 | 6% | [theme--real-income-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme--real-income-wide-1920.png) |
| prefecture-detail | mobile-390 | 9% | [prefecture-detail--hokkaido-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/prefecture-detail--hokkaido-mobile-390.webp) |
| prefecture-detail | sm-640 | 9% | [prefecture-detail--hokkaido-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--hokkaido-sm-640.png) |
| prefecture-detail | tablet-768 | 9% | [prefecture-detail--hokkaido-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/prefecture-detail--hokkaido-tablet-768.webp) |
| prefecture-detail | rail-992 | 11% | [prefecture-detail--hokkaido-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--hokkaido-rail-992.png) |
| prefecture-detail | laptop-1024 | 12% | [prefecture-detail--hokkaido-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--hokkaido-laptop-1024.png) |
| prefecture-detail | desktop-1440 | 10% | [prefecture-detail--hokkaido-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/prefecture-detail--hokkaido-desktop-1440.webp) |
| prefecture-detail | wide-1920 | 8% | [prefecture-detail--hokkaido-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--hokkaido-wide-1920.png) |
| prefecture-detail | mobile-390 | 9% | [prefecture-detail-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/prefecture-detail-mobile-390.webp) |
| prefecture-detail | sm-640 | 9% | [prefecture-detail-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail-sm-640.png) |
| prefecture-detail | tablet-768 | 8% | [prefecture-detail-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/prefecture-detail-tablet-768.webp) |
| prefecture-detail | rail-992 | 9% | [prefecture-detail-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail-rail-992.png) |
| prefecture-detail | laptop-1024 | 11% | [prefecture-detail-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail-laptop-1024.png) |
| prefecture-detail | desktop-1440 | 10% | [prefecture-detail-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/prefecture-detail-desktop-1440.webp) |
| prefecture-detail | wide-1920 | 8% | [prefecture-detail-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail-wide-1920.png) |
| prefecture-detail | mobile-390 | 9% | [prefecture-detail--okinawa-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/prefecture-detail--okinawa-mobile-390.webp) |
| prefecture-detail | sm-640 | 9% | [prefecture-detail--okinawa-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--okinawa-sm-640.png) |
| prefecture-detail | tablet-768 | 9% | [prefecture-detail--okinawa-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/prefecture-detail--okinawa-tablet-768.webp) |
| prefecture-detail | rail-992 | 10% | [prefecture-detail--okinawa-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--okinawa-rail-992.png) |
| prefecture-detail | laptop-1024 | 12% | [prefecture-detail--okinawa-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--okinawa-laptop-1024.png) |
| prefecture-detail | desktop-1440 | 10% | [prefecture-detail--okinawa-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/prefecture-detail--okinawa-desktop-1440.webp) |
| prefecture-detail | wide-1920 | 8% | [prefecture-detail--okinawa-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--okinawa-wide-1920.png) |
| prefecture-detail | mobile-390 | 18% | [prefecture-detail--theme-geo-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/prefecture-detail--theme-geo-mobile-390.webp) |
| prefecture-detail | sm-640 | 23% | [prefecture-detail--theme-geo-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-geo-sm-640.png) |
| prefecture-detail | tablet-768 | 22% | [prefecture-detail--theme-geo-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/prefecture-detail--theme-geo-tablet-768.webp) |
| prefecture-detail | rail-992 | 22% | [prefecture-detail--theme-geo-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-geo-rail-992.png) |
| prefecture-detail | laptop-1024 | 20% | [prefecture-detail--theme-geo-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-geo-laptop-1024.png) |
| prefecture-detail | desktop-1440 | 21% | [prefecture-detail--theme-geo-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/prefecture-detail--theme-geo-desktop-1440.webp) |
| prefecture-detail | wide-1920 | 17% | [prefecture-detail--theme-geo-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-geo-wide-1920.png) |
| prefecture-detail | mobile-390 | 9% | [prefecture-detail--theme-population-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/prefecture-detail--theme-population-mobile-390.webp) |
| prefecture-detail | sm-640 | 9% | [prefecture-detail--theme-population-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-population-sm-640.png) |
| prefecture-detail | tablet-768 | 9% | [prefecture-detail--theme-population-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/prefecture-detail--theme-population-tablet-768.webp) |
| prefecture-detail | rail-992 | 10% | [prefecture-detail--theme-population-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-population-rail-992.png) |
| prefecture-detail | laptop-1024 | 8% | [prefecture-detail--theme-population-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-population-laptop-1024.png) |
| prefecture-detail | desktop-1440 | 9% | [prefecture-detail--theme-population-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/prefecture-detail--theme-population-desktop-1440.webp) |
| prefecture-detail | wide-1920 | 7% | [prefecture-detail--theme-population-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-population-wide-1920.png) |
| prefecture-detail | mobile-390 | 16% | [prefecture-detail--theme-care-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/prefecture-detail--theme-care-mobile-390.webp) |
| prefecture-detail | sm-640 | 17% | [prefecture-detail--theme-care-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-care-sm-640.png) |
| prefecture-detail | tablet-768 | 13% | [prefecture-detail--theme-care-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/prefecture-detail--theme-care-tablet-768.webp) |
| prefecture-detail | rail-992 | 12% | [prefecture-detail--theme-care-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-care-rail-992.png) |
| prefecture-detail | laptop-1024 | 11% | [prefecture-detail--theme-care-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-care-laptop-1024.png) |
| prefecture-detail | desktop-1440 | 10% | [prefecture-detail--theme-care-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/prefecture-detail--theme-care-desktop-1440.webp) |
| prefecture-detail | wide-1920 | 8% | [prefecture-detail--theme-care-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-care-wide-1920.png) |
| ranking | mobile-390 | 13% | [ranking--single-year-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/ranking--single-year-mobile-390.webp) |
| ranking | sm-640 | 16% | [ranking--single-year-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--single-year-sm-640.png) |
| ranking | tablet-768 | 18% | [ranking--single-year-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/ranking--single-year-tablet-768.webp) |
| ranking | rail-992 | 19% | [ranking--single-year-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--single-year-rail-992.png) |
| ranking | laptop-1024 | 15% | [ranking--single-year-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--single-year-laptop-1024.png) |
| ranking | desktop-1440 | 14% | [ranking--single-year-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/ranking--single-year-desktop-1440.webp) |
| ranking | wide-1920 | 10% | [ranking--single-year-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--single-year-wide-1920.png) |
| ranking | mobile-390 | 8% | [ranking--old-2years-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/ranking--old-2years-mobile-390.webp) |
| ranking | sm-640 | 9% | [ranking--old-2years-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--old-2years-sm-640.png) |
| ranking | tablet-768 | 15% | [ranking--old-2years-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/ranking--old-2years-tablet-768.webp) |
| ranking | rail-992 | 13% | [ranking--old-2years-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--old-2years-rail-992.png) |
| ranking | laptop-1024 | 12% | [ranking--old-2years-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--old-2years-laptop-1024.png) |
| ranking | desktop-1440 | 11% | [ranking--old-2years-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/ranking--old-2years-desktop-1440.webp) |
| ranking | wide-1920 | 12% | [ranking--old-2years-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--old-2years-wide-1920.png) |
| ranking | mobile-390 | 10% | [ranking--kakei-city-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/ranking--kakei-city-mobile-390.webp) |
| ranking | sm-640 | 11% | [ranking--kakei-city-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--kakei-city-sm-640.png) |
| ranking | tablet-768 | 19% | [ranking--kakei-city-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/ranking--kakei-city-tablet-768.webp) |
| ranking | rail-992 | 18% | [ranking--kakei-city-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--kakei-city-rail-992.png) |
| ranking | laptop-1024 | 15% | [ranking--kakei-city-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--kakei-city-laptop-1024.png) |
| ranking | desktop-1440 | 10% | [ranking--kakei-city-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/ranking--kakei-city-desktop-1440.webp) |
| ranking | wide-1920 | 8% | [ranking--kakei-city-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--kakei-city-wide-1920.png) |
| ranking | mobile-390 | 10% | [ranking--negative-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/ranking--negative-mobile-390.webp) |
| ranking | sm-640 | 9% | [ranking--negative-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--negative-sm-640.png) |
| ranking | tablet-768 | 15% | [ranking--negative-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/ranking--negative-tablet-768.webp) |
| ranking | rail-992 | 14% | [ranking--negative-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--negative-rail-992.png) |
| ranking | laptop-1024 | 11% | [ranking--negative-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--negative-laptop-1024.png) |
| ranking | desktop-1440 | 8% | [ranking--negative-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/ranking--negative-desktop-1440.webp) |
| ranking | wide-1920 | 6% | [ranking--negative-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--negative-wide-1920.png) |
| ranking | mobile-390 | 11% | [ranking--long-title-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/ranking--long-title-mobile-390.webp) |
| ranking | sm-640 | 24% | [ranking--long-title-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--long-title-sm-640.png) |
| ranking | tablet-768 | 20% | [ranking--long-title-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/ranking--long-title-tablet-768.webp) |
| ranking | rail-992 | 17% | [ranking--long-title-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--long-title-rail-992.png) |
| ranking | laptop-1024 | 15% | [ranking--long-title-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--long-title-laptop-1024.png) |
| ranking | desktop-1440 | 16% | [ranking--long-title-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/ranking--long-title-desktop-1440.webp) |
| ranking | wide-1920 | 12% | [ranking--long-title-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--long-title-wide-1920.png) |
| ranking | mobile-390 | 10% | [ranking-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/ranking-mobile-390.webp) |
| ranking | sm-640 | 8% | [ranking-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking-sm-640.png) |
| ranking | tablet-768 | 15% | [ranking-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/ranking-tablet-768.webp) |
| ranking | rail-992 | 14% | [ranking-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking-rail-992.png) |
| ranking | laptop-1024 | 12% | [ranking-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking-laptop-1024.png) |
| ranking | desktop-1440 | 11% | [ranking-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/ranking-desktop-1440.webp) |
| ranking | wide-1920 | 11% | [ranking-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking-wide-1920.png) |
| blog | mobile-390 | 32% | [blog-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/blog-mobile-390.webp) |
| blog | sm-640 | 28% | [blog-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-sm-640.png) |
| blog | tablet-768 | 31% | [blog-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/blog-tablet-768.webp) |
| blog | rail-992 | 26% | [blog-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-rail-992.png) |
| blog | laptop-1024 | 25% | [blog-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-laptop-1024.png) |
| blog | desktop-1440 | 24% | [blog-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/blog-desktop-1440.webp) |
| blog | wide-1920 | 19% | [blog-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-wide-1920.png) |
| blog-article | mobile-390 | 11% | [blog-article-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/blog-article-mobile-390.webp) |
| blog-article | sm-640 | 9% | [blog-article-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article-sm-640.png) |
| blog-article | tablet-768 | 7% | [blog-article-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/blog-article-tablet-768.webp) |
| blog-article | rail-992 | 6% | [blog-article-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article-rail-992.png) |
| blog-article | laptop-1024 | 6% | [blog-article-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article-laptop-1024.png) |
| blog-article | desktop-1440 | 5% | [blog-article-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/blog-article-desktop-1440.webp) |
| blog-article | wide-1920 | 4% | [blog-article-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article-wide-1920.png) |
| blog-article | mobile-390 | 21% | [blog-article--charts-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/blog-article--charts-mobile-390.webp) |
| blog-article | sm-640 | 17% | [blog-article--charts-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article--charts-sm-640.png) |
| blog-article | tablet-768 | 15% | [blog-article--charts-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/blog-article--charts-tablet-768.webp) |
| blog-article | rail-992 | 13% | [blog-article--charts-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article--charts-rail-992.png) |
| blog-article | laptop-1024 | 12% | [blog-article--charts-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article--charts-laptop-1024.png) |
| blog-article | desktop-1440 | 9% | [blog-article--charts-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/blog-article--charts-desktop-1440.webp) |
| blog-article | wide-1920 | 7% | [blog-article--charts-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article--charts-wide-1920.png) |
| category | mobile-390 | 26% | [category--landweather-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/category--landweather-mobile-390.webp) |
| category | sm-640 | 21% | [category--landweather-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category--landweather-sm-640.png) |
| category | tablet-768 | 7% | [category--landweather-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/category--landweather-tablet-768.webp) |
| category | rail-992 | 14% | [category--landweather-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category--landweather-rail-992.png) |
| category | laptop-1024 | 15% | [category--landweather-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category--landweather-laptop-1024.png) |
| category | desktop-1440 | 6% | [category--landweather-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/category--landweather-desktop-1440.webp) |
| category | wide-1920 | 4% | [category--landweather-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category--landweather-wide-1920.png) |
| category | mobile-390 | 11% | [category-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/category-mobile-390.webp) |
| category | sm-640 | 11% | [category-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category-sm-640.png) |
| category | tablet-768 | 8% | [category-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/category-tablet-768.webp) |
| category | rail-992 | 9% | [category-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category-rail-992.png) |
| category | laptop-1024 | 7% | [category-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category-laptop-1024.png) |
| category | desktop-1440 | 6% | [category-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/category-desktop-1440.webp) |
| category | wide-1920 | 5% | [category-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/category-wide-1920.png) |
| survey | mobile-390 | 9% | [survey--index-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/survey--index-mobile-390.webp) |
| survey | sm-640 | 5% | [survey--index-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--index-sm-640.png) |
| survey | tablet-768 | 8% | [survey--index-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/survey--index-tablet-768.webp) |
| survey | rail-992 | 6% | [survey--index-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--index-rail-992.png) |
| survey | laptop-1024 | 8% | [survey--index-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--index-laptop-1024.png) |
| survey | desktop-1440 | 7% | [survey--index-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/survey--index-desktop-1440.webp) |
| survey | wide-1920 | 5% | [survey--index-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--index-wide-1920.png) |
| survey | mobile-390 | 8% | [survey-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/survey-mobile-390.webp) |
| survey | sm-640 | 17% | [survey-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey-sm-640.png) |
| survey | tablet-768 | 6% | [survey-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/survey-tablet-768.webp) |
| survey | rail-992 | 5% | [survey-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey-rail-992.png) |
| survey | laptop-1024 | 5% | [survey-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey-laptop-1024.png) |
| survey | desktop-1440 | 4% | [survey-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/survey-desktop-1440.webp) |
| survey | wide-1920 | 3% | [survey-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey-wide-1920.png) |
| survey | mobile-390 | 10% | [survey--police-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/survey--police-mobile-390.webp) |
| survey | sm-640 | 21% | [survey--police-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--police-sm-640.png) |
| survey | tablet-768 | 6% | [survey--police-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/survey--police-tablet-768.webp) |
| survey | rail-992 | 5% | [survey--police-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--police-rail-992.png) |
| survey | laptop-1024 | 6% | [survey--police-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--police-laptop-1024.png) |
| survey | desktop-1440 | 8% | [survey--police-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/survey--police-desktop-1440.webp) |
| survey | wide-1920 | 9% | [survey--police-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey--police-wide-1920.png) |
| municipality | mobile-390 | 9% | [municipality--designated-city-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/municipality--designated-city-mobile-390.webp) |
| municipality | sm-640 | 8% | [municipality--designated-city-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--designated-city-sm-640.png) |
| municipality | tablet-768 | 7% | [municipality--designated-city-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/municipality--designated-city-tablet-768.webp) |
| municipality | rail-992 | 6% | [municipality--designated-city-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--designated-city-rail-992.png) |
| municipality | laptop-1024 | 6% | [municipality--designated-city-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--designated-city-laptop-1024.png) |
| municipality | desktop-1440 | 5% | [municipality--designated-city-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/municipality--designated-city-desktop-1440.webp) |
| municipality | wide-1920 | 4% | [municipality--designated-city-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--designated-city-wide-1920.png) |
| municipality | mobile-390 | 9% | [municipality-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/municipality-mobile-390.webp) |
| municipality | sm-640 | 8% | [municipality-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality-sm-640.png) |
| municipality | tablet-768 | 7% | [municipality-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/municipality-tablet-768.webp) |
| municipality | rail-992 | 6% | [municipality-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality-rail-992.png) |
| municipality | laptop-1024 | 6% | [municipality-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality-laptop-1024.png) |
| municipality | desktop-1440 | 5% | [municipality-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/municipality-desktop-1440.webp) |
| municipality | wide-1920 | 4% | [municipality-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality-wide-1920.png) |
| municipality | mobile-390 | 9% | [municipality--village-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/municipality--village-mobile-390.webp) |
| municipality | sm-640 | 8% | [municipality--village-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--village-sm-640.png) |
| municipality | tablet-768 | 7% | [municipality--village-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/municipality--village-tablet-768.webp) |
| municipality | rail-992 | 6% | [municipality--village-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--village-rail-992.png) |
| municipality | laptop-1024 | 6% | [municipality--village-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--village-laptop-1024.png) |
| municipality | desktop-1440 | 5% | [municipality--village-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/municipality--village-desktop-1440.webp) |
| municipality | wide-1920 | 4% | [municipality--village-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality--village-wide-1920.png) |
| other | mobile-390 | 10% | [other--japan-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other--japan-mobile-390.webp) |
| other | sm-640 | 9% | [other--japan-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-sm-640.png) |
| other | tablet-768 | 9% | [other--japan-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other--japan-tablet-768.webp) |
| other | rail-992 | 8% | [other--japan-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-rail-992.png) |
| other | laptop-1024 | 8% | [other--japan-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-laptop-1024.png) |
| other | desktop-1440 | 8% | [other--japan-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other--japan-desktop-1440.webp) |
| other | wide-1920 | 6% | [other--japan-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-wide-1920.png) |
| other | mobile-390 | 16% | [other--japan-theme-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other--japan-theme-mobile-390.webp) |
| other | sm-640 | 11% | [other--japan-theme-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-theme-sm-640.png) |
| other | tablet-768 | 10% | [other--japan-theme-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other--japan-theme-tablet-768.webp) |
| other | rail-992 | 46% | [other--japan-theme-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-theme-rail-992.png) |
| other | laptop-1024 | 9% | [other--japan-theme-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-theme-laptop-1024.png) |
| other | desktop-1440 | 44% | [other--japan-theme-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other--japan-theme-desktop-1440.webp) |
| other | wide-1920 | 44% | [other--japan-theme-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--japan-theme-wide-1920.png) |
| other | mobile-390 | 9% | [other--municipalities-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other--municipalities-mobile-390.webp) |
| other | sm-640 | 7% | [other--municipalities-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-sm-640.png) |
| other | tablet-768 | 6% | [other--municipalities-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other--municipalities-tablet-768.webp) |
| other | rail-992 | 5% | [other--municipalities-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-rail-992.png) |
| other | laptop-1024 | 6% | [other--municipalities-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-laptop-1024.png) |
| other | desktop-1440 | 5% | [other--municipalities-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other--municipalities-desktop-1440.webp) |
| other | wide-1920 | 4% | [other--municipalities-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-wide-1920.png) |
| other | mobile-390 | 9% | [other--municipalities-theme-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other--municipalities-theme-mobile-390.webp) |
| other | sm-640 | 7% | [other--municipalities-theme-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-theme-sm-640.png) |
| other | tablet-768 | 6% | [other--municipalities-theme-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other--municipalities-theme-tablet-768.webp) |
| other | rail-992 | 5% | [other--municipalities-theme-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-theme-rail-992.png) |
| other | laptop-1024 | 7% | [other--municipalities-theme-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-theme-laptop-1024.png) |
| other | desktop-1440 | 5% | [other--municipalities-theme-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other--municipalities-theme-desktop-1440.webp) |
| other | wide-1920 | 4% | [other--municipalities-theme-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-theme-wide-1920.png) |
| other | mobile-390 | 14% | [other--municipalities-ranking-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other--municipalities-ranking-mobile-390.webp) |
| other | sm-640 | 16% | [other--municipalities-ranking-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-ranking-sm-640.png) |
| other | tablet-768 | 10% | [other--municipalities-ranking-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other--municipalities-ranking-tablet-768.webp) |
| other | rail-992 | 10% | [other--municipalities-ranking-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-ranking-rail-992.png) |
| other | laptop-1024 | 12% | [other--municipalities-ranking-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-ranking-laptop-1024.png) |
| other | desktop-1440 | 10% | [other--municipalities-ranking-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other--municipalities-ranking-desktop-1440.webp) |
| other | wide-1920 | 8% | [other--municipalities-ranking-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-ranking-wide-1920.png) |
| other | mobile-390 | 比較元なし | [other--municipalities-pref-ranking-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other--municipalities-pref-ranking-mobile-390.webp) |
| other | sm-640 | 比較元なし | [other--municipalities-pref-ranking-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-pref-ranking-sm-640.png) |
| other | tablet-768 | 比較元なし | [other--municipalities-pref-ranking-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other--municipalities-pref-ranking-tablet-768.webp) |
| other | rail-992 | 比較元なし | [other--municipalities-pref-ranking-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-pref-ranking-rail-992.png) |
| other | laptop-1024 | 比較元なし | [other--municipalities-pref-ranking-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-pref-ranking-laptop-1024.png) |
| other | desktop-1440 | 比較元なし | [other--municipalities-pref-ranking-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other--municipalities-pref-ranking-desktop-1440.webp) |
| other | wide-1920 | 比較元なし | [other--municipalities-pref-ranking-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-pref-ranking-wide-1920.png) |
| other | mobile-390 | 比較元なし | [other--municipalities-pref-ranking-tokyo-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other--municipalities-pref-ranking-tokyo-mobile-390.webp) |
| other | sm-640 | 比較元なし | [other--municipalities-pref-ranking-tokyo-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-pref-ranking-tokyo-sm-640.png) |
| other | tablet-768 | 比較元なし | [other--municipalities-pref-ranking-tokyo-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other--municipalities-pref-ranking-tokyo-tablet-768.webp) |
| other | rail-992 | 比較元なし | [other--municipalities-pref-ranking-tokyo-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-pref-ranking-tokyo-rail-992.png) |
| other | laptop-1024 | 比較元なし | [other--municipalities-pref-ranking-tokyo-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-pref-ranking-tokyo-laptop-1024.png) |
| other | desktop-1440 | 比較元なし | [other--municipalities-pref-ranking-tokyo-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other--municipalities-pref-ranking-tokyo-desktop-1440.webp) |
| other | wide-1920 | 比較元なし | [other--municipalities-pref-ranking-tokyo-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-pref-ranking-tokyo-wide-1920.png) |
| other | mobile-390 | 11% | [other-mobile-390.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other-mobile-390.webp) |
| other | sm-640 | 12% | [other-sm-640.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other-sm-640.png) |
| other | tablet-768 | 25% | [other-tablet-768.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other-tablet-768.webp) |
| other | rail-992 | 30% | [other-rail-992.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other-rail-992.png) |
| other | laptop-1024 | 12% | [other-laptop-1024.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other-laptop-1024.png) |
| other | desktop-1440 | 25% | [other-desktop-1440.webp](https://storage.stats47.jp/state/page-quality/screenshots/2026-10-30/other-desktop-1440.webp) |
| other | wide-1920 | 27% | [other-wide-1920.png](https://storage.stats47.jp/state/page-quality/screenshots/latest/other-wide-1920.png) |

## UI 指摘の場所

- `/`
  - clipped_text: a.flex.items-center.justify-center "神奈川"
  - a11y: color-contrast (serious, 1 箇所)
  - a11y: frame-title (serious, 1 箇所)
  - a11y: link-name (serious, 3 箇所)
  - responsive@desktop-1440 clipped_text: a.flex.items-center.justify-center "神奈川"
- `/ranking`
  - a11y: color-contrast (serious, 1 箇所)
  - a11y: image-alt (critical, 1 箇所)
  - a11y: link-name (serious, 1 箇所)
- `/areas`
  - a11y: image-alt (critical, 1 箇所)
  - a11y: link-name (serious, 1 箇所)
  - title_changed: 「都道府県から統計を見る \| Stats47 \| 統計で見る都道府県」→「都道府県から統計を見る \| 統計で見る都道府県」
- `/geo`
  - a11y: aria-valid-attr (critical, 1 箇所)
  - title_changed: 「地域データ分析 \| stats47 \| 統計で見る都道府県」→「地域データ分析 \| 統計で見る都道府県」
- `/geo/compare`
  - title_changed: 「あなたの県を人口・地価・洪水・駅で比較 \| stats47地域分析 \| 統計で見る都道府県」→「あなたの県を人口・地価・洪水・駅で比較 \| 地域分析 \| 統計で見る都道府県」
- `/geo/method`
  - title_changed: 「GeoAI地域分析の方法・限界 \| stats47 \| 統計で見る都道府県」→「GeoAI地域分析の方法・限界 \| 統計で見る都道府県」
- `/geo/data-catalog`
  - title_changed: 「空間分析で使うデータ・出典 \| stats47 \| 統計で見る都道府県」→「空間分析で使うデータ・出典 \| 統計で見る都道府県」
- `/geo/layers`
  - title_changed: 「GISを探す \| stats47 \| 統計で見る都道府県」→「GISを探す \| 統計で見る都道府県」
- `/geo/layers/population-mesh`
  - title_changed: 「1kmメッシュの人口の地図 \| stats47 \| 統計で見る都道府県」→「1kmメッシュの人口の地図 \| 統計で見る都道府県」
- `/geo/layers/residential-land-price`
  - title_changed: 「住宅地の地価公示地点の地図 \| stats47 \| 統計で見る都道府県」→「住宅地の地価公示地点の地図 \| 統計で見る都道府県」
- `/geo/layers/station-points`
  - title_changed: 「駅の代表点の地図 \| stats47 \| 統計で見る都道府県」→「駅の代表点の地図 \| 統計で見る都道府県」
- `/geo/population-land-price`
  - overlapping_tap_target: button.cn-tabs-trigger.relative.inline-flex "住宅地点と人口の重なり" ⇄ button.cn-button.group/button.inline-flex "人口最多メッシュ周辺"
  - overlapping_tap_target: button.cn-tabs-trigger.relative.inline-flex "住宅地点と人口の重なり" ⇄ button.cn-button.group/button.inline-flex "離島を含む全県"
  - title_changed: 「住宅地点と将来人口 \| stats47地域分析 \| 統計で見る都道府県」→「住宅地点と将来人口 \| 地域分析 \| 統計で見る都道府県」
- `/geo/population-flood-risk`
  - title_changed: 「人口と洪水浸水想定 \| stats47地域分析 \| 統計で見る都道府県」→「人口と洪水浸水想定 \| 地域分析 \| 統計で見る都道府県」
- `/geo/population-station-access`
  - title_changed: 「人口と駅アクセス \| stats47地域分析 \| 統計で見る都道府県」→「人口と駅アクセス \| 地域分析 \| 統計で見る都道府県」
- `/geo/population-snow-designation`
  - title_changed: 「豪雪指定区域と人口 \| stats47地域分析 \| 統計で見る都道府県」→「豪雪指定区域と人口 \| 地域分析 \| 統計で見る都道府県」
- `/geo/population-landslide-exposure`
  - title_changed: 「土砂災害指定区域と人口・公共施設 \| stats47地域分析 \| 統計で見る都道府県」→「土砂災害指定区域と人口・公共施設 \| 地域分析 \| 統計で見る都道府県」
- `/geo/population-low-elevation`
  - title_changed: 「標高の低い土地に住む人口 \| stats47地域分析 \| 統計で見る都道府県」→「標高の低い土地に住む人口 \| 地域分析 \| 統計で見る都道府県」
- `/geo/population-public-facility-access`
  - title_changed: 「公共施設への距離と人口 \| stats47地域分析 \| 統計で見る都道府県」→「公共施設への距離と人口 \| 地域分析 \| 統計で見る都道府県」
- `/geo/population-flood-risk/15/overlap`
  - overlapping_tap_target: button.cn-tabs-trigger.relative.inline-flex "浸水包含の判定結果" ⇄ button.cn-button.group/button.inline-flex "人口最多メッシュ周辺"
  - overlapping_tap_target: button.cn-tabs-trigger.relative.inline-flex "浸水包含の判定結果" ⇄ button.cn-button.group/button.inline-flex "離島を含む全県"
  - a11y: image-alt (critical, 1 箇所)
  - a11y: link-name (serious, 1 箇所)
- `/geo/population-station-access/13/overlap`
  - title_changed: 「東京都の駅800m圏との重なり \| stats47地域分析 \| 統計で見る都道府県」→「東京都の駅800m圏との重なり \| 地域分析 \| 統計で見る都道府県」
- `/geo/population-station-access/01/overlap`
  - title_changed: 「北海道の駅800m圏との重なり \| stats47地域分析 \| 統計で見る都道府県」→「北海道の駅800m圏との重なり \| 地域分析 \| 統計で見る都道府県」
- `/geo/datasets/G04-a`
  - title_changed: 「標高・傾斜度3次メッシュのGIS地図 \| stats47 \| 統計で見る都道府県」→「標高・傾斜度3次メッシュのGIS地図 \| 統計で見る都道府県」
- `/geo/datasets/L01`
  - title_changed: 「地価公示のGIS地図 \| stats47 \| 統計で見る都道府県」→「地価公示のGIS地図 \| 統計で見る都道府県」
- `/geo/datasets/L02`
  - title_changed: 「都道府県地価調査のGIS地図 \| stats47 \| 統計で見る都道府県」→「都道府県地価調査のGIS地図 \| 統計で見る都道府県」
- `/geo/datasets/L03-a`
  - title_changed: 「土地利用3次メッシュのGIS地図 \| stats47 \| 統計で見る都道府県」→「土地利用3次メッシュのGIS地図 \| 統計で見る都道府県」
- `/geo/datasets/W09`
  - title_changed: 「湖沼のGIS地図 \| stats47 \| 統計で見る都道府県」→「湖沼のGIS地図 \| 統計で見る都道府県」
- `/geo/datasets/A16`
  - title_changed: 「DID人口集中地区のGIS地図 \| stats47 \| 統計で見る都道府県」→「DID人口集中地区のGIS地図 \| 統計で見る都道府県」
- `/geo/datasets/A17`
  - title_changed: 「過疎地域のGIS地図 \| stats47 \| 統計で見る都道府県」→「過疎地域のGIS地図 \| 統計で見る都道府県」
- `/geo/datasets/A22`
  - title_changed: 「豪雪地帯のGIS地図 \| stats47 \| 統計で見る都道府県」→「豪雪地帯のGIS地図 \| 統計で見る都道府県」
- `/geo/datasets/A31b`
  - title_changed: 「洪水浸水想定区域のGIS地図 \| stats47 \| 統計で見る都道府県」→「洪水浸水想定区域のGIS地図 \| 統計で見る都道府県」
- `/geo/datasets/A38`
  - title_changed: 「医療圏のGIS地図 \| stats47 \| 統計で見る都道府県」→「医療圏のGIS地図 \| 統計で見る都道府県」
- `/geo/datasets/N03`
  - title_changed: 「行政区域のGIS地図 \| stats47 \| 統計で見る都道府県」→「行政区域のGIS地図 \| 統計で見る都道府県」
- `/geo/datasets/P04`
  - title_changed: 「医療機関のGIS地図 \| stats47 \| 統計で見る都道府県」→「医療機関のGIS地図 \| 統計で見る都道府県」
- `/geo/datasets/P05`
  - title_changed: 「市町村役場等・公的集会施設のGIS地図 \| stats47 \| 統計で見る都道府県」→「市町村役場等・公的集会施設のGIS地図 \| 統計で見る都道府県」
- `/geo/datasets/P11`
  - title_changed: 「バス停留所のGIS地図 \| stats47 \| 統計で見る都道府県」→「バス停留所のGIS地図 \| 統計で見る都道府県」
- `/geo/datasets/P29`
  - title_changed: 「学校のGIS地図 \| stats47 \| 統計で見る都道府県」→「学校のGIS地図 \| 統計で見る都道府県」
- `/geo/datasets/P36`
  - title_changed: 「高速バス停留所のGIS地図 \| stats47 \| 統計で見る都道府県」→「高速バス停留所のGIS地図 \| 統計で見る都道府県」
- `/geo/datasets/C28`
  - title_changed: 「空港のGIS地図 \| stats47 \| 統計で見る都道府県」→「空港のGIS地図 \| 統計で見る都道府県」
- `/geo/datasets/N02`
  - title_changed: 「鉄道のGIS地図 \| stats47 \| 統計で見る都道府県」→「鉄道のGIS地図 \| 統計で見る都道府県」
- `/geo/datasets/N07`
  - title_changed: 「バスルートのGIS地図 \| stats47 \| 統計で見る都道府県」→「バスルートのGIS地図 \| 統計で見る都道府県」
- `/geo/datasets/S12`
  - title_changed: 「駅別乗降客数のGIS地図 \| stats47 \| 統計で見る都道府県」→「駅別乗降客数のGIS地図 \| 統計で見る都道府県」
- `/geo/datasets/mesh1000r6`
  - title_changed: 「1kmメッシュ将来推計人口(R6)のGIS地図 \| stats47 \| 統計で見る都道府県」→「1kmメッシュ将来推計人口(R6)のGIS地図 \| 統計で見る都道府県」
- `/geo/datasets/A03`
  - title_changed: 「三大都市圏計画区域のGIS地図 \| stats47 \| 統計で見る都道府県」→「三大都市圏計画区域のGIS地図 \| 統計で見る都道府県」
- `/geo/datasets/A09`
  - title_changed: 「都市地域のGIS地図 \| stats47 \| 統計で見る都道府県」→「都市地域のGIS地図 \| 統計で見る都道府県」
- `/geo/datasets/A18`
  - title_changed: 「半島振興対策実施地域のGIS地図 \| stats47 \| 統計で見る都道府県」→「半島振興対策実施地域のGIS地図 \| 統計で見る都道府県」
- `/geo/datasets/A19`
  - title_changed: 「離島振興対策実施地域のGIS地図 \| stats47 \| 統計で見る都道府県」→「離島振興対策実施地域のGIS地図 \| 統計で見る都道府県」
- `/geo/datasets/A23`
  - title_changed: 「特殊土壌地帯のGIS地図 \| stats47 \| 統計で見る都道府県」→「特殊土壌地帯のGIS地図 \| 統計で見る都道府県」
- `/geo/datasets/A24`
  - title_changed: 「振興山村のGIS地図 \| stats47 \| 統計で見る都道府県」→「振興山村のGIS地図 \| 統計で見る都道府県」
- `/geo/datasets/A25`
  - title_changed: 「特定農山村地域のGIS地図 \| stats47 \| 統計で見る都道府県」→「特定農山村地域のGIS地図 \| 統計で見る都道府県」
- `/geo/datasets/A30a5`
  - title_changed: 「土砂災害・雪崩メッシュのGIS地図 \| stats47 \| 統計で見る都道府県」→「土砂災害・雪崩メッシュのGIS地図 \| 統計で見る都道府県」
- ほか 792 URL (latest.json の ui_findings を参照)
