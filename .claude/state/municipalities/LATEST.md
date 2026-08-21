# 市区町村スコープ分離 WP0 棚卸し

生成: 2026-08-21T06:36:06.167Z (read-only・コード / R2 / URL は未変更)
再生成: `npx tsx .claude/scripts/municipalities/build-wp0-inventory.ts`

## metric 分類 (active)

| bucket | 件数 |
|---|---:|
| pref-only | 1999 |
| city-only | 19 |
| both | 165 |
| other | 10 |

市区町村候補 (city-only + both) = **184 件**

## R2 artifact (`app/stats/<key>/cities.json`)

| availability | 件数 |
|---|---:|
| present | 180 |
| absent | 4 |
| undetermined | 0 |

**`undetermined` は「取れなかった」であって「無い」ではない。** 母集団から外さずに再取得する。

## entity 母集団 (`packages/area/src/data/cities.json`)

- 総数 1913 / 自治体 (level 2) **1719** / 政令市の行政区 (level 3) 194
- 政令市本体 21 件
- 重複 code 0 件 / 親不明の行政区 0 件
- 行政区の `prefCode` は親の県ではなく**親の市コード**を指す: 全件で確認
- 東京23特別区: cities.json に 23 区は個別に無く「特別区部」1 件へ集約されている。doc 44 の pilot 規則が言う『東京23特別区を含む』は現状のデータでは満たせない

## 現行 URL 面

- `/municipalities` 系 route: **無い**
- areas 配下の page.tsx: 5 件
- 公開 city allowlist の定義箇所: apps/web/src/app/sitemap.ts, apps/web/src/features/area-profile/constants/stage-1-cities.ts
- sitemap が city に言及: true

## 配信 payload の母集団 (present 180 件の最新年)

- 政令市の**行政区を含む** artifact: **178 件**
- 政令市の**本体と行政区が同居**する artifact: **178 件** (素の件数だけ見ると二重計上に気づけない)
- cities.json に無い code を含む artifact: 0 件

行政区は自治体ではないので、municipality ランキングの母集団に入れると
「札幌市」と「札幌市中央区」が同じ表に並ぶ。WP1 の entity policy はここを機械的に落とす。

## pilot 候補 (entity 1000 以上・重複ゼロ・未知 code ゼロ)

| key | 最新年 | entity 数 | 自治体 | 行政区 | 本体と区の同居 | null 率 | zero 率 | 単位 |
|---|---|---:|---:|---:|---:|---:|---:|---|
| crime-rate-per-1k | 2005 | 1913 | 1719 | 194 | 21 | 0 | 0.0335 | 件 |
| elderly-population-ratio | 2020 | 1913 | 1719 | 194 | 21 | 0 | 0.0016 | ％ |
| fiscal-strength-index | 2021 | 1913 | 1719 | 194 | 21 | 0 | 0.1019 | 指数 |
| foreign-population-per-100k | 2020 | 1913 | 1719 | 194 | 21 | 0 | 0.0037 | 人 |
| general-hospital-per-100k | 2020 | 1913 | 1719 | 194 | 21 | 0 | 0.2441 | 施設 |
| housing-floor-area | 2023 | 1913 | 1719 | 194 | 21 | 0 | 0.3576 | m² |
| manufacturing-net-value-added-private | 2020 | 1913 | 1719 | 194 | 21 | 0.0465 | 0.0022 | 百万円 |
| manufacturing-sales-private | 2020 | 1913 | 1719 | 194 | 21 | 0.0434 | 0.0016 | 百万円 |
| manufacturing-shipment | 2022 | 1913 | 1719 | 194 | 21 | 0 | 0.0387 | 百万円 |
| per-taxpayer-income | 2023 | 1913 | 1719 | 194 | 21 | 0 | 0.0894 | 千円 |
| population-density-habitable | 2020 | 1913 | 1719 | 194 | 21 | 0 | 0.0016 | 人 |
| retail-stores-per | 2006 | 1913 | 1719 | 194 | 21 | 0 | 0.0157 | 店 |

地方財政は財政主体の監査が終わるまで pilot にしない (doc 44 の pilot 規則)。
