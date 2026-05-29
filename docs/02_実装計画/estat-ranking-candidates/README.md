---
type: implementation-plan
date: 2026-05-29
status: draft
tags: [estat, metrics, ranking, survey]
---

# e-Stat 網羅調査: 未 metric 化の都道府県/市区町村ランキング候補

社会・人口統計体系 (SSDS) を SSOT に、既存 metrics/*.ts と e-Stat カタログを突き合わせ、
まだ metric 化されていない都道府県/市区町村ランキング候補を洗い出した結果。

> **第一フェーズ (候補洗い出し) の成果物**。metrics/*.ts の生成・投入はこのリストを承認後に次フェーズで行う。

## 調査方法 (再現可能)

1. **既存 metric の source 抽出**: `packages/data-configs/src/metrics/*.ts` 全 2,209 件から
   `(kind, statsDataId, cdCat01, entities)` を抽出 → 使用済 `(statsDataId, cdCat01)` 集合を構築
2. **カタログ列挙**: e-Stat `getStatsList?statsCode=00200502` で SSDS の全 59 テーブルを取得
   (都道府県/市区町村 × 基礎データ/社会生活統計指標)
3. **指標 (cdCat01) 列挙**: 59 テーブルそれぞれに `getMetaInfo` を実行し、全 7,065 個の指標スロットを取得
4. **概念単位で dedup**: cdCat01 コードで概念を集約 (市区町村テーブルのコードは都道府県の部分集合、
   基礎データと社会生活統計指標はコード体系が別)。base-year 違いの重複 (平成17年基準 等) は vintage フラグで除外
5. **差分 = 候補**: 使用済 pair を除いた残りを opportunity type 別に分類

> **DB について**: 当初 `npm run db:pull` でカタログ DB を取得予定だったが、R2 に `database/stats47.sqlite`
> が未 seed (3 バケット stats47 / stats47-cache / doboku-note いずれにも `database/` prefix なし) のため取得不可。
> 代替として e-Stat API (getStatsList / getMetaInfo) を直接叩いた。API はカタログ DB の真の SSOT であり、
> より網羅的かつ最新。env 4 種 + e-Stat 到達 (HTTP 200) は検証済。

## サマリ

| 項目 | 件数 |
|---|---|
| 既存 metric 総数 | 2,209 (うち e-Stat: 1,464 / 家計調査: 675 / external: 68) |
| 既存が参照する unique statsDataId | 130 |
| SSDS テーブル数 (カタログ) | 59 |
| 指標スロット総数 (table × cat01) | 7,065 |
| 使用済 (statsDataId+cdCat01 完全一致) | 1,198 |
| **未利用候補 (概念 dedup 後)** | **4,332** |
| └ うち非 vintage (採用推奨) | **4,232** |
| └ うち base-year 重複等 vintage (後回し) | 100 |

### 対応 entity 別 (非 vintage 4,232)

| 区分 | 件数 |
|---|---|
| 都道府県ランキング成立 | 4,224 |
| 市区町村ランキング成立 | 864 |
| 都道府県・市区町村 両方成立 | 856 |

> 市区町村が 864 と少ないのは、SSDS 市区町村テーブルが都道府県より指標数が絞られているため
> (市区町村 cat01 は都道府県の部分集合)。都道府県は SSDS の指標をほぼ網羅的にランキング化できる。

### opportunity type 別 (非 vintage)

| type | 件数 | 意味 |
|---|---|---|
| NEW pref | 3,368 | 都道府県のみ新規 |
| NEW pref+city | 714 | 都道府県・市区町村とも新規 |
| ADD city (pref exists) | 141 | **既存の都道府県ランキングに市区町村版を追加 (最易・実証済需要)** |
| NEW city | 8 | 市区町村のみ |
| ADD pref (city exists) | 1 | 都道府県版を追加 |

## カテゴリ別内訳 (非 vintage, SSDS 大分類 A–M)

| カテゴリ | 候補数 | ADD city | NEW pref+city | NEW pref |
|---|---|---|---|---|
| 人口・世帯 | 625 | 37 | 117 | 468 |
| 自然環境 | 35 | 7 | 3 | 25 |
| 経済基盤 | 358 | 30 | 170 | 158 |
| 行政基盤 | 104 | 3 | 75 | 22 |
| 教育 | 491 | 8 | 16 | 467 |
| 労働 | 541 | 9 | 65 | 467 |
| 文化・スポーツ | 225 | 2 | 2 | 221 |
| 居住 | 479 | 29 | 195 | 253 |
| 健康・医療 | 388 | 10 | 14 | 364 |
| 福祉・社会保障 | 353 | 4 | 57 | 292 |
| 安全 | 155 | 2 | 0 | 153 |
| 家計 | 264 | 0 | 0 | 264 |
| 生活時間 | 214 | 0 | 0 | 214 |

## 量産の優先順位案

### Tier 1 — ADD city (141 件): 既存都道府県ランキングの市区町村版
最優先。pref 版が既に存在 = 需要実証済 & タイトル/SEO テンプレ流用可。同一 cdCat01 を
市区町村テーブル (`0000020301` 社会生活統計指標 / `0000020201` 基礎データ) で取得するだけ。
データ存在は spot-check 済 (例: `#A05307 転入超過率` 市区町村版は 1,913 値・2020 年で取得確認)。
代表例: 転入超過率・転入率・転出率 / 完全失業率 / 持ち家比率 / 空き家比率 / 核家族世帯割合 /
第1〜3次産業就業者比率 / 小売店数・飲食店数 (人口千人当たり)。

### Tier 2 — NEW pref+city (714 件): 都道府県+市区町村 同時新規
人口・世帯 (117) / 居住 (195) / 経済基盤 (170) / 行政基盤 (75) に集中。1 指標で 2 ページ
(pref + city ランキング) 作れるため投資対効果が高い。

### Tier 3 — NEW pref (3,368 件): 都道府県のみ新規
教育 (467) / 労働 (467) / 健康・医療 (364) / 家計 (264) / 生活時間 (214) が厚い。
SSDS 都道府県指標の大半。granular な産業別内訳が多く含まれるため、metric 化時は
「総数/比率系を優先、産業細分は需要を見て選別」が現実的。

### 薄いカテゴリ (既存 metric が少なく伸びしろ大)
プロジェクト category 分布で international(8) / miningindustry(11) / ict(17) / energy(21) /
tourism(40) / landweather(41) が薄い。SSDS では **自然環境 (候補35)** が最も飽和に近く、
**家計 (264) / 生活時間 (214) / 文化・スポーツ (225)** は SSDS 内で未開拓かつ読み物需要が高い。

## 推奨 launch batch (120 件)

カテゴリ横断でスコアリング (需要 tier × opportunity × series、産業細分はペナルティ) し、
カテゴリ偏重を避けるため 1 カテゴリ最大 18 件で 120 件を選抜。
→ `launch-batch-120.csv`

### Top 50 (launch batch 上位)

| # | カテゴリ | cdCat01 | 指標 | 単位 | opportunity |
|---|---|---|---|---|---|
| 1 | 人口・世帯 | #A01404 | #A01404_人口集中地区面積の変化率 | ％ | ADD city (pref exists) |
| 2 | 人口・世帯 | #A05301 | #A05301_転入超過率（日本人移動者） | ％ | ADD city (pref exists) |
| 3 | 人口・世帯 | #A05302 | #A05302_転入率（日本人移動者） | ％ | ADD city (pref exists) |
| 4 | 人口・世帯 | #A05303 | #A05303_転出率（日本人移動者） | ％ | ADD city (pref exists) |
| 5 | 人口・世帯 | #A05307 | #A05307_転入超過率 | ％ | ADD city (pref exists) |
| 6 | 人口・世帯 | #A05308 | #A05308_転入率 | ％ | ADD city (pref exists) |
| 7 | 人口・世帯 | #A05309 | #A05309_転出率 | ％ | ADD city (pref exists) |
| 8 | 人口・世帯 | #A06202 | #A06202_核家族世帯割合 | ％ | ADD city (pref exists) |
| 9 | 自然環境 | #B01301 | #B01301_可住地面積割合 | ％ | ADD city (pref exists) |
| 10 | 労働 | #F01102 | #F01102_就業者比率 | ％ | ADD city (pref exists) |
| 11 | 労働 | #F01201 | #F01201_第1次産業就業者比率 | ％ | ADD city (pref exists) |
| 12 | 労働 | #F01202 | #F01202_第2次産業就業者比率 | ％ | ADD city (pref exists) |
| 13 | 労働 | #F01203 | #F01203_第3次産業就業者比率 | ％ | ADD city (pref exists) |
| 14 | 労働 | #F01301 | #F01301_完全失業率 | ％ | ADD city (pref exists) |
| 15 | 労働 | #F02701 | #F02701_他市区町村への通勤者比率 | ％ | ADD city (pref exists) |
| 16 | 労働 | #F02702 | #F02702_他市区町村からの通勤者比率 | ％ | ADD city (pref exists) |
| 17 | 居住 | #H01301 | #H01301_持ち家比率 | ％ | ADD city (pref exists) |
| 18 | 居住 | #H01405 | #H01405_空き家比率 | ％ | ADD city (pref exists) |
| 19 | 居住 | #H06127 | #H06127_小売店数（人口千人当たり） | 店 | ADD city (pref exists) |
| 20 | 居住 | #H06130 | #H06130_飲食店数（人口千人当たり） | 店 | ADD city (pref exists) |
| 21 | 人口・世帯 | A1101 | 総人口 | 人 | ADD city (pref exists) |
| 22 | 人口・世帯 | #A01403 | #A01403_人口集中地区人口密度（人口集中地区面積１km2当たり） | 人 | ADD city (pref exists) |
| 23 | 人口・世帯 | #A0191001 | #A0191001_将来推計人口（2020年） | 人 | ADD city (pref exists) |
| 24 | 人口・世帯 | #A0191002 | #A0191002_将来推計人口（2025年） | 人 | ADD city (pref exists) |
| 25 | 人口・世帯 | #A0191003 | #A0191003_将来推計人口（2030年） | 人 | ADD city (pref exists) |
| 26 | 人口・世帯 | #A0191004 | #A0191004_将来推計人口（2035年） | 人 | ADD city (pref exists) |
| 27 | 人口・世帯 | #A0191005 | #A0191005_将来推計人口（2040年） | 人 | ADD city (pref exists) |
| 28 | 人口・世帯 | #A0191006 | #A0191006_将来推計人口（2045年） | 人 | ADD city (pref exists) |
| 29 | 人口・世帯 | #A0191007 | #A0191007_将来推計人口（2050年） | 人 | ADD city (pref exists) |
| 30 | 人口・世帯 | #A0411001 | #A0411001_未婚者割合（15歳以上人口） | ％ | ADD city (pref exists) |
| 31 | 自然環境 | B1101 | 総面積（北方地域及び竹島を除く） | ｈａ | ADD city (pref exists) |
| 32 | 自然環境 | B1103 | 可住地面積 | ｈａ | ADD city (pref exists) |
| 33 | 自然環境 | B1104 | 主要湖沼面積 | ｈａ | ADD city (pref exists) |
| 34 | 自然環境 | B1105 | 林野面積 | ｈａ | ADD city (pref exists) |
| 35 | 自然環境 | B1106 | 森林面積 | ｈａ | ADD city (pref exists) |
| 36 | 自然環境 | B1201 | 評価総地積（課税対象土地） | ｍ2 | ADD city (pref exists) |
| 37 | 経済基盤 | C120120 | 納税義務者数（所得割） | 人 | ADD city (pref exists) |
| 38 | 経済基盤 | C120130 | 納税義務者数（均等割） | 人 | ADD city (pref exists) |
| 39 | 経済基盤 | C2101 | 事業所数（事業所・企業統計調査結果） | 所 | ADD city (pref exists) |
| 40 | 経済基盤 | C2107 | 事業所数（経済センサス‐基礎調査結果） | 事業所 | ADD city (pref exists) |
| 41 | 経済基盤 | C210722 | 事業所数（医療、福祉） | 所 | ADD city (pref exists) |
| 42 | 経済基盤 | C3101 | 農業産出額 | 百万円 | ADD city (pref exists) |
| 43 | 経済基盤 | C3107 | 耕地面積 | ｈａ | ADD city (pref exists) |
| 44 | 経済基盤 | C3109 | 耕地放棄面積 | ｈａ | ADD city (pref exists) |
| 45 | 経済基盤 | C3403 | 製造業事業所数 | 事業所 | ADD city (pref exists) |
| 46 | 経済基盤 | C3404 | 製造業従業者数 | 人 | ADD city (pref exists) |
| 47 | 経済基盤 | C5405 | 標準価格（平均価格）（工業地） | 円／ｍ2 | ADD city (pref exists) |
| 48 | 経済基盤 | C6101 | 売上金額（民営） | 百万円 | ADD city (pref exists) |
| 49 | 行政基盤 | D1202 | 一般行政部門職員数（市区町村） | 人 | ADD city (pref exists) |
| 50 | 行政基盤 | D2205 | 基準財政収入額（市町村財政） | 千円 | ADD city (pref exists) |

## 成果物ファイル

| ファイル | 内容 |
|---|---|
| `candidates-all.csv` | 全候補 4,332 件 (概念 dedup 後、vintage 含む)。列: code/indicator/unit/category/series/opp/prefAvail/cityAvail/prefUsed/cityUsed/vintage/prefId/cityId |
| `launch-batch-120.csv` | 推奨 launch batch 120 件 (スコア付き) |

## 留意点 / 次フェーズ前の確認事項

- **データ年次の鮮度**: SSDS には旧年次で更新停止した指標も含まれる。metric 化時に `getStatsData` で
  最新年の値存在を個別確認する (本調査では代表 spot-check のみ)。
- **正規化方針**: 基礎データ系 (絶対値: 人/百万円/所) は per_population / per_area 等の正規化が前提。
  社会生活統計指標系 (`#` prefix, 既に比率・密度) はそのままランキング可。
- **産業細分の取捨**: 県内総生産額・事業所数などは産業別に 10〜20 細分される。全部 metric 化すると
  低需要ページが量産されるため、総数+主要産業に絞る判断を batch 単位で行う。
- **SSDS 外の e-Stat**: 賃金構造基本統計調査・社会生活基本調査など cat 多次元の調査は本調査の対象外
  (SSDS が大半を pref/city 指標として再集約済)。職業別賃金など別軸が欲しい場合は別途調査。
- このリスト承認後、Tier 1 → Tier 2 の順で metrics/*.ts 生成 + `/page-data-batch` 投入に進む。
