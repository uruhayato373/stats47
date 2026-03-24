# e-Stat API 市区町村レベル統計データ調査結果

> 調査日: 2026-03-24

## 現状

- 都道府県ランキング: 1,686件アクティブ
- 市区町村ランキング: 28件アクティブ（うち14件が都道府県版と同一キー）
- 推定追加可能件数: **250〜360件**

## ソース別の追加可能件数

| ソース | 現在 | 追加可能（推定） | 備考 |
|---|---|---|---|
| SSDS 指標テーブル（比率・指数） | 28 | +35〜40 | `0000020301`-`0000020311`、67指標 |
| SSDS 基礎データ（実数） | 0 | +100〜150 | `0000020101`-`0000020111`、821項目 |
| 国勢調査 | 0 | +30〜50 | 592テーブル、約1,965市区町村 |
| 経済センサス-活動調査 | 0 | +20〜30 | 132テーブル、約1,966市区町村 |
| 住宅・土地統計調査（2018年版） | 0 | +20〜30 | 993テーブル、約1,310市区町村 |
| 医療施設調査 | 0 | +5〜10 | 8テーブル |
| 地域保健・健康増進事業報告 | 0 | +5〜10 | 71テーブル |
| 社会教育調査 | 0 | +3〜5 | 7テーブル |

## 市区町村データが利用できない統計調査

| 統計調査名 | 都道府県ランキング数 | 理由 |
|---|---|---|
| 家計調査 | 675 | 都道府県庁所在市のデータのみ |
| 社会生活基本調査 | 72 | 都道府県レベルのみ |
| 県民経済計算 | 30 | 都道府県単位の統計 |
| 労働力調査 | 65 | 都道府県レベルのみ（SSDS経由で基礎データあり） |
| 人口動態調査 | 41 | 都道府県＋指定都市再掲（約166地域）のみ |
| 学校基本調査 | 77 | e-Stat API では都道府県レベルのみ（SSDS経由で基礎データあり） |
| 地方財政統計 | 113 | e-Stat API では市区町村テーブルなし（SSDS経由であり） |

## Tier 1: 即時追加可能（SSDS 指標テーブル、都道府県版と同一キー）

既存の都道府県ランキングと同じ ranking_key で市区町村版を追加できるもの。

| ranking_key 候補 | 指標名 | statsDataId | cdCat01 |
|---|---|---|---|
| daytime-nighttime-population-ratio | 昼夜間人口比率 | 0000020301 | #A01302 |
| child-population-ratio | 15歳未満人口割合 | 0000020301 | #A03504 |
| working-age-population-ratio | 15-64歳人口割合 | 0000020301 | #A03505 |
| unmarried-ratio | 未婚者割合 | 0000020301 | #A0411001 |
| net-migration-rate | 転入超過率 | 0000020301 | #A05301 |
| nuclear-family-ratio | 核家族世帯割合 | 0000020301 | #A06202 |
| elderly-couple-only-ratio | 高齢夫婦のみ世帯割合 | 0000020301 | #A06302 |
| elderly-single-household-ratio | 65歳以上単独世帯割合 | 0000020301 | #A06304 |
| primary-industry-employment-ratio | 第1次産業就業者比率 | 0000020306 | #F01201 |
| secondary-industry-employment-ratio | 第2次産業就業者比率 | 0000020306 | #F01202 |
| tertiary-industry-employment-ratio | 第3次産業就業者比率 | 0000020306 | #F01203 |
| restaurant-count-per-1000 | 飲食店数（人口千人当たり） | 0000020308 | #H06107 |

## Tier 2: SSDS 基礎データからの追加（実数→比率化が必要なものあり）

### A 人口（134項目）

| ranking_key 候補 | 指標名 | cdCat01 |
|---|---|---|
| total-population | 総人口（既存city版あり） | A1101 |
| male-population | 男性人口 | A110101 |
| female-population | 女性人口 | A110102 |
| child-population | 15歳未満人口 | A1301 |
| working-age-population | 15-64歳人口 | A1302 |
| elderly-population | 65歳以上人口 | A1303 |
| foreign-population | 外国人人口 | A1700 |
| births | 出生数 | A4101 |
| deaths | 死亡数 | A4200 |
| in-migration | 転入者数 | A5103 |
| out-migration | 転出者数 | A5104 |
| marriages | 婚姻件数 | A9101 |
| divorces | 離婚件数 | A9201 |
| daytime-population | 昼間人口 | A6107 |
| household-count | 世帯数 | A7101 |
| single-household | 単独世帯数 | A810105 |
| mother-child-household | 母子世帯数 | A8401 |
| father-child-household | 父子世帯数 | A8501 |
| elderly-single-household | 65歳以上単独世帯数 | A8301 |

### C 経済（199項目、主要なもの）

| ranking_key 候補 | 指標名 | cdCat01 |
|---|---|---|
| establishments | 事業所数 | C2107 |
| agricultural-output | 農業産出額 | C3101 |
| manufacturing-shipment | 製造品出荷額等 | C3401 |
| wholesale-sales | 卸売年間商品販売額 | C4101 |
| retail-sales | 小売年間商品販売額 | C4102 |

### D 行政（87項目、主要なもの）

| ranking_key 候補 | 指標名 | cdCat01 |
|---|---|---|
| fiscal-strength-index | 財政力指数 | D2201 |
| current-account-ratio | 経常収支比率 | D2203 |
| real-deficit-ratio | 実質赤字比率 | D2214 |
| consolidated-real-deficit-ratio | 連結実質赤字比率 | D2215 |
| real-debt-service-ratio | 実質公債費比率 | D2211 |
| future-liability-ratio | 将来負担比率 | D2212 |
| revenue-total | 歳入決算総額 | D3201 |
| expenditure-total | 歳出決算総額 | D3203 |
| local-tax | 地方税 | D3401 |

### E 教育（21項目）

| ranking_key 候補 | 指標名 | cdCat01 |
|---|---|---|
| elementary-school-count | 小学校数 | E2101 |
| elementary-school-students | 小学校児童数 | E2501 |
| middle-school-count | 中学校数 | E3101 |
| middle-school-students | 中学校生徒数 | E3501 |
| high-school-count | 高等学校数 | E4101 |
| university-graduate-population | 大学・大学院卒人口 | E9106 |

### F 労働（65項目、主要なもの）

| ranking_key 候補 | 指標名 | cdCat01 |
|---|---|---|
| labor-force | 労働力人口 | F1101 |
| employed-population | 就業者数 | F1102 |
| unemployed-population | 完全失業者数 | F1107 |
| regular-employee-count | 正規職員数 | F2409 |
| part-time-worker-count | パート・アルバイト数 | F2411 |
| commuter-outflow-ratio | 他市区町村通勤者比率 | F02701（新規指標） |
| commuter-inflow-ratio | 他市区町村からの通勤者比率 | F02702（新規指標） |

### H 居住（220項目、主要なもの）

| ranking_key 候補 | 指標名 | cdCat01 |
|---|---|---|
| total-housing | 総住宅数 | H1100 |
| vacant-housing | 空き家数 | H110202 |
| owned-housing | 持ち家数 | H1310 |
| rented-housing | 借家数 | H1320 |
| detached-housing | 一戸建住宅数 | H1401 |
| apartment-housing | 共同住宅数 | H1403 |
| new-housing-starts | 着工新設住宅戸数 | H1800 |
| kei-vehicle-count | 軽自動車等台数 | H7207 |

### I 健康・医療（21項目）

| ranking_key 候補 | 指標名 | cdCat01 |
|---|---|---|
| hospital-count | 病院数 | I5101 |
| clinic-count | 一般診療所数 | I5102 |
| physician-count | 医師数 | I6100 |
| dentist-count | 歯科医師数 | I6200 |
| pharmacist-count | 薬剤師数 | I6300 |

### J 福祉・社会保障（61項目、主要なもの）

| ranking_key 候補 | 指標名 | cdCat01 |
|---|---|---|
| nursery-count | 保育所等数 | J2503 |
| nursery-children | 保育所等在所児数 | J2506 |
| elderly-welfare-facility | 介護老人福祉施設数 | J230121 |
| paid-elderly-home | 有料老人ホーム数 | J230221 |

## Tier 3: 国勢調査・経済センサス等の専門テーブル

| ソース | statsDataId | 内容 |
|---|---|---|
| 国勢調査 | 0003445080 | 世帯の家族類型別世帯数（24類型） |
| 国勢調査 | 0003454499 | 昼夜間人口（年齢×性別） |
| 国勢調査 | 0003445096 | 平均年齢・年齢中位数 |
| 国勢調査 | 0003454512 | 利用交通手段別通勤者数 |
| 国勢調査 | 0003445121 | 住宅所有関係別世帯数 |
| 国勢調査 | 0003445244 | 外国人国籍別人口 |
| 経済センサス | 0003449698 | 事業所数・従業者数（経営組織別） |
| 経済センサス | 0004005661 | 産業中分類別事業所数（134産業） |
| 住宅・土地統計調査 | 0003355290 | 空き家の種類別住宅数 |
| 医療施設調査 | 0003421874 | 病院数・病床数（市区町村別） |

## SSDS テーブル構成

| 層 | statsDataId 範囲 | 内容 | 項目数 | 市区町村数 |
|---|---|---|---|---|
| 基礎データ（01xx系） | `0000020101`-`0000020111` | 実数（人口○人等） | 821 | ~1,913 |
| 基礎データ（02xx系） | `0000020201`-`0000020211` | 同上（別テーブル） | 821 | ~1,913 |
| 指標テーブル（03xx系） | `0000020301`-`0000020311` | 比率・指数 | 67 | ~1,913 |

## 制約事項

1. **家計調査（675件）は市区町村化不可** — 都道府県庁所在市のデータのみ
2. **SSDS の時系列** — 指標テーブルは 1980/1985/.../2023 の11時点。基礎データは44時点
3. **2023年住宅・土地統計調査** — 市区町村データは2018年版のみ。2023年版は21大都市まで
4. **人口動態調査** — 市区町村テーブルはあるが実際は都道府県＋指定都市の約166地域のみ
