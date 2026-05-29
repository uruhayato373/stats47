---
type: theme-chart-planning
date: 2026-05-26
theme_key: safety
status: drafted
research_sources:
  - https://www.npa.go.jp/toukei/seianki/R06/r06keihouhantoukeisiryou.pdf
  - https://www.npa.go.jp/publications/statistics/kikakubunseki/r6_jyosei.pdf
  - https://vdata.nikkei.com/newsgraphics/crime-statistics/
  - https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/hukushi_kaigo/seikatsuhogo/jisatsu/jisatsuhakusyo2024.html
  - https://www.mhlw.go.jp/content/2024-1-1-05.pdf
  - https://www.fdma.go.jp/publication/hakusho/r6/
  - https://www.nippon.com/ja/japan-data/h02662/
tags: [theme-charts, safety]
---

# 安全 (safety) — チャート構成設計

> 25 metrics と最多のため、5 つの panelTab (治安/交通/火災・救急/災害/自殺・事故) ごとに「全国推移 line」を 1 枚ずつ追加する設計とする。

## 0. 結論サマリ

左コロプレスで「犯罪率 (penal-code-offenses-recognized-per-1000)」(2024 年) を地図表示、右に **(A) 全国推移ライン (刑法犯認知件数 1990→2024 で 280 万件 → 74 万件と 1/4 に減少)**、**(B) 罪種別構成比パイ (窃盗 / 粗暴 / 凶悪 / 知能 / その他)**、**(C) 上下位 5 県バー (大阪 912 vs 岩手 240 件 / 10 万人 で 3.8 倍差)** の 3 枚を縦に積む。5 panelTab すべてに timeseries chart を追加する。

## 1. 既存 metric 棚卸し

| rankingKey | shortLabel | role | panelTab | 想定 chart_type | chart_target | データ可用性メモ |
|---|---|---|---|---|---|---|
| `penal-code-offenses-recognized-per-1000` | 犯罪率 | primary | 治安 | choropleth + line + bar | prefecture / national | 警察庁 犯罪統計 (年次, 1990-2024) |
| `serious-crime-per-100k` | 凶悪犯 | primary | 治安 | choropleth + line | prefecture / national | 同上 |
| `criminal-recognition-count` | 認知件数 | secondary | 治安 | choropleth | prefecture | 同上 |
| `violent-crime-per-100k` | 粗暴犯 | secondary | 治安 | choropleth | prefecture | 同上 |
| `criminal-arrest-rate` | 検挙率 | secondary | 治安 | choropleth + line | prefecture / national | 同上 (1990 60% → 2024 40% 推移) |
| `intellectual-crime-per-100k` | 知能犯 | context | 治安 | choropleth | prefecture | 同上 |
| `theft-offenses-recognized-per-1000` | 窃盗率 | context | 治安 | choropleth | prefecture | 同上 |
| `theft-criminal-arrest-rate` | 窃盗検挙率 | context | 治安 | choropleth | prefecture | 同上 |
| `juvenile-criminal-arrest-person-per-population` | 少年犯罪率 | secondary | 治安 | choropleth + line | prefecture / national | 同上 (戦後ピーク → 激減) |
| `drug-enforcement-arrest-count-per-population` | 薬物検挙 | context | 治安 | choropleth | prefecture | 同上 |
| `traffic-accident-deaths-per-100k` | 交通死者 | primary | 交通 | choropleth + line + bar | prefecture / national | 警察庁 交通事故統計 (1948-2025) |
| `traffic-accident-count-per-population` | 交通事故率 | secondary | 交通 | choropleth | prefecture | 同上 |
| `traffic-accident-count` | 事故件数 | context | 交通 | choropleth + line | national | 同上 |
| `traffic-accident-deaths-per-100-accidents` | 致死率 | context | 交通 | choropleth | prefecture | 同上 (地方ほど高い) |
| `traffic-accident-injuries-per-100k` | 負傷者率 | context | 交通 | choropleth | prefecture | 同上 |
| `traffic-accident-casualties-elderly-65plus` | 高齢者事故 | secondary | 交通 | choropleth + bar | prefecture | 同上 |
| `building-fire-count-per-100-thousand-people` | 火災 | secondary | 火災・救急 | choropleth + line | prefecture / national | 消防庁 火災年報 (年次) |
| `fire-deaths-per-100k` | 火災死者 | secondary | 火災・救急 | choropleth | prefecture | 同上 |
| `fire-damage-casualties-per-population` | 火災被害 | context | 火災・救急 | choropleth | prefecture | 同上 |
| `annual-emergency-dispatches-per-1000` | 救急出動 | secondary | 火災・救急 | choropleth + line | prefecture / national | 消防白書 (急増中、2024 年で 760 万件) |
| `disaster-damage-amount-per-person` | 災害被害額 | context | 災害 | choropleth + bar | prefecture | 内閣府 防災白書 (年により震災影響大) |
| `suicide-rate-per-100k` | 自殺率 | secondary | 自殺・事故 | choropleth + line + bar | prefecture / national | 警察庁 自殺統計・厚労省 (1978-2024) |
| `suicides-per-100k` | 自殺者数 | context | 自殺・事故 | choropleth | prefecture | 同上 |
| `accidental-deaths-per-100k` | 事故死 | secondary | 自殺・事故 | choropleth | prefecture | 人口動態統計 |
| `police-officer-count-per-population` | 警察官数 | context | 治安 | choropleth | prefecture | 警察庁 |

## 2. 推奨レイアウト

### 2-1. メインビュー (左 60%)

**コロプレス地図**: `penal-code-offenses-recognized-per-1000` (犯罪率, 2024 年)

- 配色: 赤系発散カラースケール (高いほど赤、全国平均 ~5.9 件/1000 を白)
- ホバー時: 県名 + 犯罪率 + 全国順位

### 2-2. サブパネル (右 40%) — 縦 3 段

#### (A) 全国推移ライン

**何を見せるか**: 全国の刑法犯認知件数推移 (1990-2024)

- データ源: 警察庁 犯罪統計 (年次)
- curiosity gap: **「2002 年 285 万件のピーク → 2024 年 74 万件、4 分の 1 まで減ったのに体感治安は悪化」**
- 必要データ: `app/themes/safety/timeseries/criminal-recognition-count.json`
  ```json
  { "metricKey": "criminal-recognition-count", "scope": "national",
    "unit": "件", "series": [{ "year": 1990, "value": 1636628 }, ..., { "year": 2024, "value": 737679 }] }
  ```

#### (B) 罪種別構成比パイチャート

**何を見せるか**: 2024 年刑法犯 74 万件の **罪種別内訳**

| 罪種 | 件数目安 | 割合 | 注目度 |
|---|---|---|---|
| 窃盗犯 | 約 50 万件 | 68% | 圧倒的シェア |
| 粗暴犯 | 約 6 万件 | 8% | 暴行・傷害 |
| 知能犯 | 約 5 万件 | 7% | 詐欺急増中 |
| 凶悪犯 | 約 6 千件 | 1% | 殺人・強盗 |
| その他 | 約 12 万件 | 16% | 器物損壊等 |

- データ源: 警察庁 犯罪統計 罪種別
- 必要データ: `app/themes/safety/breakdown/crime-types.json`

#### (C) 上下位 5 県バーチャート

**何を見せるか**: 犯罪率 TOP 5 + BOTTOM 5

```
大阪府    9.12 ‰ ▰▰▰▰▰▰▰▰▰▰▰
群馬県    7.8  ‰ ▰▰▰▰▰▰▰▰▰
茨城県    7.5  ‰ ▰▰▰▰▰▰▰▰▰
埼玉県    7.2  ‰ ▰▰▰▰▰▰▰▰
愛知県    7.0  ‰ ▰▰▰▰▰▰▰▰
─ 全国平均 5.9 ‰ ─
秋田県    2.8  ‰ ▰▰▰
長崎県    2.7  ‰ ▰▰▰
鹿児島県  2.6  ‰ ▰▰▰
青森県    2.5  ‰ ▰▰▰
岩手県    2.4  ‰ ▰▰
```

### 2-3. パネルタブ — 既存 5 タブ維持 + 各タブに line 追加

| タブ | metrics (既存) | 追加チャート提案 |
|---|---|---|
| **治安** | penal-code / serious / violent / juvenile / theft / drug / police | line: 検挙率の全国推移 (1990 約 60% → 2024 約 40%、低下傾向)<br>line: 少年犯罪率の戦後推移 (ピークから激減) |
| **交通** | traffic-deaths / count / casualties / elderly / injuries | line: 交通事故死者数の全国推移 (1970 年 16,765 人 → 2025 年 2,547 人で **過去最少**)<br>bar: 致死率上下位 5 県 (滋賀 3.85 vs 東京 0.95、4 倍差) |
| **火災・救急** | building-fire / fire-deaths / fire-damage / emergency | line: 救急出動件数の全国推移 (2000 年比約 1.5 倍、高齢化が要因)<br>line: 火災件数の全国推移 (減少基調) |
| **災害** | disaster-damage | bar: 災害被害額 上位 5 県 (震災・水害発生年で偏る)<br>line: 全国災害被害額の年次推移 (1995, 2011, 2018, 2024 のピーク) |
| **自殺・事故** | suicide-rate / suicides / accidental-deaths | line: 自殺率の全国推移 (1998-2003 ピーク 25 → 2024 約 17)<br>bar: 自殺率上下位 5 県 (山梨・秋田 vs 神奈川・京都) |
| **考察** | (空) | (本文記事用) |

## 3. 参考にしたサイト (リサーチ結果)

- [警察庁: 令和6年の刑法犯に関する統計資料 (PDF)](https://www.npa.go.jp/toukei/seianki/R06/r06keihouhantoukeisiryou.pdf) — 都道府県別認知・検挙件数の公式表。罪種別×県別マトリクスがそのまま使える
- [警察庁: 令和6年の犯罪情勢 (PDF)](https://www.npa.go.jp/publications/statistics/kikakubunseki/r6_jyosei.pdf) — 全国推移ラインの公式チャート構成 (1990→2024)。本論記事の構成見本
- [日経: 厳しさ増す犯罪情勢 データが映す日本の治安](https://vdata.nikkei.com/newsgraphics/crime-statistics/) — 「認知件数は減ったのに体感治安悪化」という curiosity gap を打ち出す手法
- [厚労省: 令和6年版自殺対策白書](https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/hukushi_kaigo/seikatsuhogo/jisatsu/jisatsuhakusyo2024.html) — 都道府県別自殺率の標準集計表
- [厚労省: 令和5年の都道府県別の自殺の状況 (PDF)](https://www.mhlw.go.jp/content/2024-1-1-05.pdf) — 県別自殺率の地図化テンプレ
- [消防庁: 令和6年版 消防白書](https://www.fdma.go.jp/publication/hakusho/r6/) — 火災件数・救急出動の都道府県別附属資料。救急出動推移ラインの公式版
- [nippon.com: 2025年中の交通事故死者数は過去最少の2547人](https://www.nippon.com/ja/japan-data/h02662/) — 「過去最少」を curiosity gap として打ち出す。滋賀 3.85 vs 東京 0.95 の県別格差表現も参考

## 4. 必要データ (Phase 3 で追加 export)

| データ種別 | 対象 metric_key | scope | 提案 R2 キー | 元データ |
|---|---|---|---|---|
| timeseries (national) | `criminal-recognition-count` | 1990-2024 (35 点) | `app/themes/safety/timeseries/criminal-recognition-count.json` | 警察庁 犯罪統計 |
| timeseries (national) | `criminal-arrest-rate` | 1990-2024 | `app/themes/safety/timeseries/criminal-arrest-rate.json` | 同上 |
| timeseries (national) | `juvenile-criminal-arrest-person-per-population` | 1990-2024 | `app/themes/safety/timeseries/juvenile-arrest.json` | 同上 |
| timeseries (national) | `traffic-accident-deaths-per-100k` | 1948-2025 (78 点) | `app/themes/safety/timeseries/traffic-deaths.json` | 警察庁 交通事故統計 |
| timeseries (national) | `traffic-accident-count` | 1990-2025 | `app/themes/safety/timeseries/traffic-count.json` | 同上 |
| timeseries (national) | `annual-emergency-dispatches-per-1000` | 2000-2024 | `app/themes/safety/timeseries/emergency-dispatches.json` | 消防白書 |
| timeseries (national) | `building-fire-count-per-100-thousand-people` | 1995-2024 | `app/themes/safety/timeseries/fire-count.json` | 消防白書 火災年報 |
| timeseries (national) | `disaster-damage-amount-per-person` | 1995-2024 | `app/themes/safety/timeseries/disaster-damage.json` | 内閣府 防災白書 |
| timeseries (national) | `suicide-rate-per-100k` | 1978-2024 | `app/themes/safety/timeseries/suicide-rate.json` | 警察庁 自殺統計・厚労省 |
| breakdown (pie) | `criminal-recognition-count` | 2024 | `app/themes/safety/breakdown/crime-types.json` | 警察庁 罪種別 |
| breakdown (pie) | `traffic-accident-casualties-elderly-65plus` | 2024 | `app/themes/safety/breakdown/traffic-age.json` | 警察庁 年齢層別 |
| breakdown (pie) | `suicide-rate-per-100k` | 2024 | `app/themes/safety/breakdown/suicide-motive.json` | 厚労省 自殺原因別 |

→ `app/themes/safety/charts.json` 1 ファイル統合案 (fetch 回数削減)。Phase 3 設計時判断。

## 5. 新規 metric 提案 (TS リスト外)

| 候補 metric | 理由 | データ源 |
|---|---|---|
| `fraud-recognition-per-100k` (詐欺認知率) | 特殊詐欺の急増は重要トピック。都市部 (東京/大阪) 集中の典型例で curiosity gap 強い | 警察庁 犯罪統計 詐欺別 |
| `pedestrian-traffic-death-ratio` (歩行者交通死者比率) | 地方ほど高齢歩行者死亡が多い構造を可視化 | 警察庁 交通事故統計 状態別 |
| `suicide-rate-youth-15-29` (若年層自殺率) | 全年齢では低下したが 15-29 歳のみ上昇という逆転現象 | 厚労省 自殺対策白書 年齢層別 |

特に **若年層自殺率** は「全体減少 vs 若年増加」の逆説で強い curiosity gap が作れる。

## 6. SEO / curiosity gap 観点

タイトル / description で打ち出すべき意外な事実 (`.claude/rules/blog-quality-standards.md` 準拠):

1. **「犯罪は 2002 年から 4 分の 1 に減ったのに、なぜ体感治安は悪化したのか?」** — 逆説 + 疑問形
2. **「犯罪率 大阪 9.1‰ vs 岩手 2.4‰ で 3.8 倍格差、最少は東北 4 県が独占」** — 倍率 + 地域偏り
3. **「交通事故死者は過去最少 2,547 人、それでも滋賀は東京の 4 倍危険」** — 過去最少 + 県別逆転
4. **「自殺率は山梨・秋田が高い、なぜ「美しい県」で自殺が多いのか?」** — 疑問形 + 矛盾
5. **「救急出動は 25 年で 1.5 倍、高齢化で消防が悲鳴」** — 構造的真因

theme description (D1 themes.description) 推奨書き換え:

> 「刑法犯認知件数は 2002 年のピーク 285 万件から 2024 年 74 万件へ 4 分の 1 に減少──だが大阪と岩手で 3.8 倍格差、自殺率は山梨・秋田が高い。47 都道府県の治安・交通・火災・自殺を地図とランキングで比較。」

## 7. 残課題 / 要検証

- [ ] 警察庁 犯罪統計の e-Stat statsDataId (罪種別×都道府県×年次) を `/inspect-estat-meta` で確認 — 罪種別構成 pie の元データ
- [ ] 交通事故死者の 1948 年からの全国時系列が e-Stat にあるか、それとも警察庁 PDF を手動投入か検討
- [ ] 救急出動件数の都道府県別 timeseries は消防白書 PDF からの抽出になる可能性 — exporter 工数要見積もり
- [ ] 災害被害額は年により極端な偏り (1995 阪神, 2011 東日本, 2018 西日本豪雨) があるため、line より「移動平均 + イベントマーカー」表示の方が読みやすいか UI 検討
- [ ] 自殺統計は警察庁 (速報) と厚労省 (人口動態) で集計が異なる — どちらをマスタにするか確認
- [ ] 25 metrics は theme 内最多のため、UI のタブ切替パフォーマンス (R2 fetch 並列化) を Phase 3 で計測

## 関連ファイル

- 親 INDEX: [`README.md`](./README.md)
- 見本: [`living-housing.md`](./living-housing.md)
- D1 schema: `packages/database/src/schema/themes.ts`
- 既存 TS source: `packages/types/src/indicator-sets/safety.ts`
- 親計画: `docs/02_実装計画/theme-dashboard-plan.md`
