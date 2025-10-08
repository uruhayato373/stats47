## 人口関連統計データまとめ

### 総人口に関するデータ

`src/data/mapping.csv` から抽出した総人口に関するデータは以下の通りです。

| stats_data_id | cat01     | item_name    | unit | ascending |
| :------------ | :-------- | :----------- | :--- | :-------- |
| 0000010201    | #A011000  | 総人口       | 万人 | False     |
| 0000010201    | #A0110001 | 総人口（男） | 万人 | False     |
| 0000010201    | #A0110002 | 総人口（女） | 万人 | False     |
| 0000010101    | A1101     | 総人口       | 人   | False     |
| 0000010101    | A110101   | 総人口（男） | 人   | False     |
| 0000010101    | A110102   | 総人口（女） | 人   | False     |

### 人口密度・集中地区に関するデータ

| stats_data_id | cat01   | item_name                                             | unit   | ascending |
| :------------ | :------ | :---------------------------------------------------- | :----- | :-------- |
| 0000010201    | #A01201 | 総面積１ km2 当たり人口密度                           | 人     | False     |
| 0000010201    | #A01202 | 可住地面積１ km2 当たり人口密度                       | 人     | False     |
| 0000010201    | #A01302 | 昼夜間人口比率                                        | ％     | False     |
| 0000010201    | #A01401 | 人口集中地区人口比率                                  | ％     | False     |
| 0000010201    | #A01402 | 人口集中地区面積比率                                  | ％     | False     |
| 0000010201    | #A01403 | 人口集中地区人口密度（人口集中地区面積１ km2 当たり） | 人     | False     |
| 0000010201    | #A01404 | 人口集中地区面積の変化率                              | ％     | False     |
| 0000010101    | A1801   | 人口集中地区人口                                      | 人     | False     |
| 0000010101    | A180101 | 人口集中地区人口（男）                                | 人     | False     |
| 0000010101    | A180102 | 人口集中地区人口（女）                                | 人     | False     |
| 0000010101    | A1802   | 人口集中地区面積                                      | ｋｍ 2 | False     |

### 人口構成・性比に関するデータ

| stats_data_id | cat01   | item_name                   | item_code                           | unit |
| :------------ | :------ | :-------------------------- | :---------------------------------- | :--- |
| 0000010201    | #A02101 | 人口性比（総数）            | sex-ratio-total                     | ‐    |
| 0000010201    | #A02102 | 人口性比（15 歳未満人口）   | sex-young-population-ratio          | ‐    |
| 0000010201    | #A02103 | 人口性比（15 ～ 64 歳人口） | sex-production-age-population-ratio | ‐    |
| 0000010201    | #A02104 | 人口性比（65 歳以上人口）   | sex-old-population-ratio            | ‐    |
| 0000010101    | A192002 | 人口性比（総数）            | sex-ratio-total                     | ‐    |

### 人口増減に関するデータ

| stats_data_id | cat01   | item_name  | item_code              | unit |
| :------------ | :------ | :--------- | :--------------------- | :--- |
| 0000010201    | #A05101 | 人口増減率 | population-growth-rate | ％   |
| 0000010101    | A192003 | 人口増減率 | population-growth-rate | ‰    |

### 出生・死亡に関するデータ

#### 出生関連

| stats_data_id | cat01   | item_name                        | item_code              | unit |
| :------------ | :------ | :------------------------------- | :--------------------- | :--- |
| 0000010101    | A4101   | 出生数                           | births                 | 人   |
| 0000010101    | A410101 | 出生数（男）                     | births-male            | 人   |
| 0000010101    | A410102 | 出生数（女）                     | births-female          | 人   |
| 0000010101    | A410201 | 出生数（母親の年齢 15 歳未満）   | births-mother-under-15 | 人   |
| 0000010101    | A410202 | 出生数（母親の年齢 15 ～ 19 歳） | births-mother-15-19    | 人   |
| 0000010101    | A410203 | 出生数（母親の年齢 20 ～ 24 歳） | births-mother-20-24    | 人   |
| 0000010101    | A410204 | 出生数（母親の年齢 25 ～ 29 歳） | births-mother-25-29    | 人   |
| 0000010101    | A410205 | 出生数（母親の年齢 30 ～ 34 歳） | births-mother-30-34    | 人   |
| 0000010101    | A410206 | 出生数（母親の年齢 35 ～ 39 歳） | births-mother-35-39    | 人   |
| 0000010101    | A410207 | 出生数（母親の年齢 40 ～ 44 歳） | births-mother-40-44    | 人   |
| 0000010101    | A410208 | 出生数（母親の年齢 45 ～ 49 歳） | births-mother-45-49    | 人   |
| 0000010101    | A410209 | 出生数（母親の年齢 50 歳以上）   | births-mother-50-plus  | 人   |
| 0000010101    | A4103   | 合計特殊出生率                   | total-fertility-rate   | ‐    |
| 0000010201    | #A05203 | 合計特殊出生率                   | total-fertility-rate   | ‐    |

#### 死亡関連

| stats_data_id | cat01   | item_name                   | item_code           | unit |
| :------------ | :------ | :-------------------------- | :------------------ | :--- |
| 0000010101    | A4200   | 死亡数                      | death-count         | 人   |
| 0000010101    | A420001 | 死亡数（男）                | deaths-male         | 人   |
| 0000010101    | A420002 | 死亡数（女）                | deaths-female       | 人   |
| 0000010101    | A4201   | 死亡数（0 ～ 4 歳）         | deaths-0-4          | 人   |
| 0000010101    | A420101 | 死亡数（0 ～ 4 歳）（男）   | deaths-0-4-male     | 人   |
| 0000010101    | A420102 | 死亡数（0 ～ 4 歳）（女）   | deaths-0-4-female   | 人   |
| 0000010101    | A4202   | 死亡数（5 ～ 9 歳）         | deaths-5-9          | 人   |
| 0000010101    | A420201 | 死亡数（5 ～ 9 歳）（男）   | deaths-5-9-male     | 人   |
| 0000010101    | A420202 | 死亡数（5 ～ 9 歳）（女）   | deaths-5-9-female   | 人   |
| 0000010101    | A4203   | 死亡数（10 ～ 14 歳）       | deaths-10-14        | 人   |
| 0000010101    | A420301 | 死亡数（10 ～ 14 歳）（男） | deaths-10-14-male   | 人   |
| 0000010101    | A420302 | 死亡数（10 ～ 14 歳）（女） | deaths-10-14-female | 人   |
| 0000010101    | A4204   | 死亡数（15 ～ 19 歳）       | deaths-15-19        | 人   |
| 0000010101    | A420401 | 死亡数（15 ～ 19 歳）（男） | deaths-15-19-male   | 人   |
| 0000010101    | A420402 | 死亡数（15 ～ 19 歳）（女） | deaths-15-19-female | 人   |
| 0000010101    | A4205   | 死亡数（20 ～ 24 歳）       | deaths-20-24        | 人   |
| 0000010101    | A420501 | 死亡数（20 ～ 24 歳）（男） | deaths-20-24-male   | 人   |
| 0000010101    | A420502 | 死亡数（20 ～ 24 歳）（女） | deaths-20-24-female | 人   |
| 0000010101    | A4206   | 死亡数（25 ～ 29 歳）       | deaths-25-29        | 人   |
| 0000010101    | A420601 | 死亡数（25 ～ 29 歳）（男） | deaths-25-29-male   | 人   |
| 0000010101    | A420602 | 死亡数（25 ～ 29 歳）（女） | deaths-25-29-female | 人   |
| 0000010101    | A4207   | 死亡数（30 ～ 34 歳）       | deaths-30-34        | 人   |
| 0000010101    | A420701 | 死亡数（30 ～ 34 歳）（男） | deaths-30-34-male   | 人   |
| 0000010101    | A420702 | 死亡数（30 ～ 34 歳）（女） | deaths-30-34-female | 人   |
| 0000010101    | A4208   | 死亡数（35 ～ 39 歳）       | deaths-35-39        | 人   |
| 0000010101    | A420801 | 死亡数（35 ～ 39 歳）（男） | deaths-35-39-male   | 人   |
| 0000010101    | A420802 | 死亡数（35 ～ 39 歳）（女） | deaths-35-39-female | 人   |

#### 自然増減・出生率・死亡率関連

| stats_data_id | cat01   | item_name  | item_code             | unit |
| :------------ | :------ | :--------- | :-------------------- | :--- |
| 0000010201    | #A05201 | 自然増減率 | natural-increase-rate | ％   |
| 0000010101    | A4401   | 自然増減率 | natural-increase-rate | ‰    |

### 婚姻・離婚に関するデータ

| stats_data_id | cat01   | item_name                | item_code                      | unit |
| :------------ | :------ | :----------------------- | :----------------------------- | :--- |
| 0000010101    | A9101   | 婚姻件数                 | marriages                      | 組   |
| 0000010101    | A9201   | 離婚件数                 | divorces                       | 組   |
| 0000010201    | #A06601 | 婚姻率（人口千人当たり） | marriages-per-total-population | ‐    |
| 0000010201    | #A06602 | 離婚率（人口千人当たり） | divorces-per-total-population  | ‐    |

### 世帯に関するデータ

| stats_data_id | cat01 | item_name | item_code  | unit |
| :------------ | :---- | :-------- | :--------- | :--- |
| 0000010101    | A7101 | 世帯数    | households | 世帯 |

### 外国人人口に関するデータ

| stats_data_id | cat01     | item_name                                      | item_code                             | unit |
| :------------ | :-------- | :--------------------------------------------- | :------------------------------------ | :--- |
| 0000010201    | #A01601   | 外国人人口（人口 10 万人当たり）               | foreign-resident-count-per-100k       | 人   |
| 0000010201    | #A0160101 | 外国人人口（韓国、朝鮮）（人口 10 万人当たり） | foreign-resident-count-korea-per-100k | 人   |
| 0000010201    | #A0160102 | 外国人人口（中国）（人口 10 万人当たり）       | foreign-resident-count-china-per-100k | 人   |
| 0000010201    | #A0160103 | 外国人人口（アメリカ）（人口 10 万人当たり）   | foreign-resident-count-usa-per-100k   | 人   |

### 将来推計人口に関するデータ

| stats_data_id | cat01     | item_name               | item_code              | unit |
| :------------ | :-------- | :---------------------- | :--------------------- | :--- |
| 0000010201    | #A0191001 | 将来推計人口（2020 年） | future-population-2020 | 人   |
| 0000010201    | #A0191002 | 将来推計人口（2025 年） | future-population-2025 | 人   |
| 0000010201    | #A0191003 | 将来推計人口（2030 年） | future-population-2030 | 人   |
| 0000010201    | #A0191004 | 将来推計人口（2035 年） | future-population-2035 | 人   |

## 経済・労働関連統計データまとめ

### 経済指標に関するデータ

#### 県内総生産・県民所得関連

| stats_data_id | cat01   | item_name                                        | item_code                                        | unit |
| :------------ | :------ | :----------------------------------------------- | :----------------------------------------------- | :--- |
| 0000010203    | #C01101 | 県内総生産額対前年増加率（平成 17 年基準）       | gdp-growth-rate-pref-h17                         | ％   |
| 0000010203    | #C01105 | 県民所得対前年増加率（平成 17 年基準）           | prefectural-income-growth-rate-h17               | ％   |
| 0000010203    | #C01106 | 県民総所得対前年増加率（名目）（平成 17 年基準） | gross-prefectural-income-growth-rate-nominal-h17 | ％   |
| 0000010203    | #C01107 | 県民総所得対前年増加率（実質）（平成 17 年基準） | gross-prefectural-income-growth-rate-real-h17    | ％   |
| 0000010203    | #C01111 | 県内総生産額対前年増加率（平成 23 年基準）       | gdp-growth-rate-pref-h23                         | ％   |
| 0000010203    | #C01115 | 県民所得対前年増加率（平成 23 年基準）           | prefectural-income-growth-rate-h23               | ％   |
| 0000010203    | #C01116 | 県民総所得対前年増加率（名目）（平成 23 年基準） | gross-prefectural-income-growth-rate-nominal-h23 | ％   |
| 0000010203    | #C01121 | 県内総生産額対前年増加率（平成 27 年基準）       | gdp-growth-rate-pref-h27                         | ％   |
| 0000010203    | #C01125 | 県民所得対前年増加率（平成 27 年基準）           | prefectural-income-growth-rate-h27               | ％   |
| 0000010203    | #C01126 | 県民総所得対前年増加率（名目）（平成 27 年基準） | gross-prefectural-income-growth-rate-nominal-h27 | ％   |
| 0000010203    | #C01301 | 1 人当たり県民所得（平成 17 年基準）             | per-capita-prefectural-income-h17                | 千円 |
| 0000010203    | #C01311 | 1 人当たり県民所得（平成 23 年基準）             | per-capita-prefectural-income-h23                | 千円 |
| 0000010203    | #C01321 | 1 人当たり県民所得（平成 27 年基準）             | per-capita-prefectural-income-h27                | 千円 |

#### 産業構造関連

| stats_data_id | cat01   | item_name                                             | item_code                                     | unit |
| :------------ | :------ | :---------------------------------------------------- | :-------------------------------------------- | :--- |
| 0000010203    | #C02102 | 第 2 次産業事業所数構成比（事業所・企業統計調査結果） | secondary-industry-establishment-ratio-census | ％   |
| 0000010203    | #C02103 | 第 3 次産業事業所数構成比（事業所・企業統計調査結果） | tertiary-industry-establishment-ratio-census  | ％   |
| 0000010203    | #C02104 | 第 2 次産業事業所数構成比                             | secondary-industry-establishment-ratio        | ％   |
| 0000010203    | #C02105 | 第 3 次産業事業所数構成比                             | tertiary-industry-establishment-ratio         | ％   |
| 0000010203    | #C02206 | 従業者 1 ～ 4 人の事業所割合（民営）                  | establishment-ratio-1-4-employees-private     | ％   |
| 0000010203    | #C02207 | 従業者 5 ～ 9 人の事業所割合（民営）                  | establishment-ratio-5-9-employees-private     | ％   |

### 労働・賃金に関するデータ

#### 労働力・就業関連

| stats_data_id | cat01     | item_name                                        | item_code                                | unit |
| :------------ | :-------- | :----------------------------------------------- | :--------------------------------------- | :--- |
| 0000010206    | #F0110101 | 労働力人口比率（男）                             | labor-force-population-ratio-man         | ％   |
| 0000010206    | #F0110102 | 労働力人口比率（女）                             | labor-force-population-ratio-woman       | ％   |
| 0000010206    | #F01102   | 就業者比率                                       | employed-people-ratio                    | ％   |
| 0000010206    | #F01201   | 第 1 次産業就業者比率                            | employed-people-ratio-primary            | ％   |
| 0000010206    | #F01202   | 第 2 次産業就業者比率                            | employed-people-ratio-secondary          | ％   |
| 0000010206    | #F01203   | 第 3 次産業就業者比率                            | employed-people-ratio-tertiary           | ％   |
| 0000010206    | #F01204   | 第 2 次産業及び第 3 次産業就業者比率（対就業者） | secondary-employed-people-ratio-tertiary | ％   |
| 0000010206    | #F01301   | 完全失業率                                       | unemployment-rate                        | ％   |
| 0000010206    | #F0130101 | 完全失業率（男）                                 | unemployment-rate-man                    | ％   |
| 0000010206    | #F0130102 | 完全失業率（女）                                 | unemployment-rate-woman                  | ％   |
| 0000010206    | #F01503   | 共働き世帯割合                                   | dual-income-household-ratio              | ％   |
| 0000010206    | #F02301   | 雇用者比率                                       | employee-ratio                           | ％   |
| 0000010206    | #F02501   | 県内就業者比率                                   | in-prefecture-employed-people-ratio      | ％   |
| 0000010206    | #F0260101 | 出稼者比率（販売農家）                           | migrant-worker-ratio-sales-farm          | ％   |
| 0000010206    | #F02701   | 他市区町村への通勤者比率                         | commuter-ratio-to-other-municipalities   | ％   |
| 0000010206    | #F02702   | 他市区町村からの通勤者比率                       | commuter-ratio-from-other-municipalities | ％   |
| 0000010206    | #F03101   | 就職率                                           | employment-rate                          | ％   |
| 0000010206    | #F03102   | 県外就職者比率（～ 2018）                        | employed-outside-the-prefecture-pre2018  | ％   |
| 0000010206    | #F0310201 | 県外就職者比率                                   | employed-outside-the-prefecture          | ％   |

### 教育・文化・スポーツに関するデータ

#### 教育施設関連

| stats_data_id | cat01     | item_name                                       | item_code                                        | unit |
| :------------ | :-------- | :---------------------------------------------- | :----------------------------------------------- | :--- |
| 0000010205    | #E0110101 | 小学校数（6 ～ 11 歳人口 10 万人当たり）        | elementary-school-count-per-100k-6-11            | 校   |
| 0000010205    | #E0110102 | 中学校数（12 ～ 14 歳人口 10 万人当たり）       | junior-high-school-count-per-100k-12-14          | 校   |
| 0000010205    | #E0110103 | 高等学校数（15 ～ 17 歳人口 10 万人当たり）     | high-school-count-per-100k-15-17                 | 校   |
| 0000010205    | #E0110104 | 幼稚園数（3 ～ 5 歳人口 10 万人当たり）         | kindergarten-count-per-100k-3-5                  | 園   |
| 0000010205    | #E0110105 | 保育所等数（0 ～ 5 歳人口 10 万人当たり）       | nursery-count-per-100k-0-5                       | 所   |
| 0000010205    | #E0110106 | 認定こども園数（0 ～ 5 歳人口 10 万人当たり）   | certified-childcare-center-count-per-100k-0-5    | 園   |
| 0000010205    | #E0110107 | 義務教育学校数（6 ～ 14 歳人口 10 万人当たり）  | compulsory-education-school-count-per-100k-6-14  | 校   |
| 0000010205    | #E0110108 | 中等教育学校数（12 ～ 17 歳人口 10 万人当たり） | secondary-education-school-count-per-100k-12-17  | 校   |
| 0000010205    | #E0110201 | 小学校数（可住地面積 100km2 当たり）            | elementary-school-count-per-100km2-habitable     | 校   |
| 0000010205    | #E0110202 | 中学校数（可住地面積 100km2 当たり）            | junior-high-school-count-per-100km2-habitable    | 校   |
| 0000010205    | #E0110203 | 高等学校数（可住地面積 100km2 当たり）          | high-school-count-per-100km2-habitable           | 校   |
| 0000010205    | #E01303   | 公立高等学校割合                                | public-high-school-ratio                         | ％   |
| 0000010205    | #E01304   | 公立幼稚園割合                                  | public-kindergarten-ratio                        | ％   |
| 0000010205    | #E01305   | 公営保育所等割合                                | public-nursery-ratio                             | ％   |
| 0000010205    | #E02601   | 公立小学校屋内運動場設置率                      | public-elementary-school-gym-installation-rate   | ％   |
| 0000010205    | #E02602   | 公立中学校屋内運動場設置率                      | public-junior-high-school-gym-installation-rate  | ％   |
| 0000010205    | #E02701   | 公立小学校プール設置率                          | public-elementary-school-pool-installation-rate  | ％   |
| 0000010205    | #E02702   | 公立中学校プール設置率                          | public-junior-high-school-pool-installation-rate | ％   |
| 0000010205    | #E02703   | 公立高等学校プール設置率                        | public-high-school-pool-installation-rate        | ％   |

#### 文化・スポーツ施設関連

| stats_data_id | cat01     | item_name                                                 | item_code                                           | unit      |
| :------------ | :-------- | :-------------------------------------------------------- | :-------------------------------------------------- | :-------- |
| 0000010207    | #G01101   | 公民館数（人口 100 万人当たり）                           | public-hall-count-per-million                       | 館        |
| 0000010207    | #G01104   | 図書館数（人口 100 万人当たり）                           | library-count-per-million                           | 館        |
| 0000010207    | #G01107   | 博物館数（人口 100 万人当たり）                           | museum-count-per-million                            | 館        |
| 0000010207    | #G01109   | 青少年教育施設数（人口 100 万人当たり）                   | youth-education-facility-count-per-million          | 所        |
| 0000010207    | #G01321   | 社会体育施設数（人口 100 万人当たり）                     | community-sports-facility-count-per-million         | 施設      |
| 0000010207    | #G01323   | 多目的運動広場数（公共）（人口 100 万人当たり）           | public-multipurpose-sports-ground-count-per-million | 施設      |
| 0000010207    | #G01325   | 体育館数（公共）（人口 100 万人当たり）                   | public-gymnasium-count-per-million                  | 施設      |
| 0000010207    | #G01326   | 水泳プール数（屋内，屋外）（公共）（人口 100 万人当たり） | public-swimming-pool-count-per-million              | 施設      |
| 0000010207    | #G03201   | 青少年学級・講座数（人口 100 万人当たり）                 | youth-class-lecture-count-per-million               | 学級･講座 |
| 0000010207    | #G03203   | 成人一般学級・講座数（人口 100 万人当たり）               | adult-class-lecture-count-per-million               | 学級･講座 |
| 0000010207    | #G0320501 | 女性学級・講座数（女性人口 100 万人当たり）               | female-class-lecture-count-per-million-female       | 学級･講座 |
| 0000010207    | #G03207   | 高齢者学級・講座数（人口 100 万人当たり）                 | elderly-class-lecture-count-per-million             | 学級･講座 |
| 0000010207    | #G04101   | ボランティア活動の年間行動者率（15 歳以上）               | volunteer-activity-annual-participation-rate-15plus | ％        |
| 0000010207    | #G041011  | ボランティア活動の年間行動者率（10 歳以上）               | volunteer-activity-annual-participation-rate-10plus | ％        |
| 0000010207    | #G042111  | スポーツの年間行動者率（10 歳以上）                       | sports-annual-participation-rate-10plus             | ％        |
| 0000010207    | #G0430501 | 一般旅券発行件数（人口千人当たり）                        | passport-issuance-count-per-thousand                | 件        |
| 0000010207    | #G04306   | 旅行・行楽の年間行動者率（15 歳以上）                     | travel-leisure-annual-participation-rate-15plus     | ％        |
| 0000010207    | #G043061  | 旅行・行楽の年間行動者率（10 歳以上）                     | travel-leisure-annual-participation-rate-10plus     | ％        |
| 0000010207    | #G04307   | 海外旅行の年間行動者率（15 歳以上）                       | overseas-travel-annual-participation-rate-15plus    | ％        |

## 社会基盤・住宅・安全関連統計データまとめ

### 住宅・建設に関するデータ

#### 住宅数・住宅構造関連

| stats_data_id | cat01   | item_name                                | item_code                     | unit |
| :------------ | :------ | :--------------------------------------- | :---------------------------- | :--- |
| 0000010108    | H1100   | 総住宅数                                 | total-housing-units           | 戸   |
| 0000010108    | H1101   | 居住世帯あり住宅数                       | occupied-housing-units        | 戸   |
| 0000010108    | H1102   | 居住世帯なし住宅数                       | vacant-housing-units          | 戸   |
| 0000010108    | H110201 | 一時現在者のみ住宅数                     | temporary-residents-only      | 戸   |
| 0000010108    | H110202 | 空き家数                                 | vacant-houses                 | 戸   |
| 0000010108    | H110203 | 建築中住宅数                             | under-construction-housing    | 戸   |
| 0000010108    | H1201   | 専用住宅数                               | exclusive-residential-units   | 戸   |
| 0000010108    | H1203   | 店舗その他の併用住宅数                   | mixed-use-housing-units       | 戸   |
| 0000010108    | H1310   | 持ち家数                                 | owner-occupied-housing        | 戸   |
| 0000010108    | H1320   | 借家数                                   | rental-housing-units          | 戸   |
| 0000010108    | H1321   | 公営・都市再生機構（ＵＲ）・公社の借家数 | public-rental-housing         | 戸   |
| 0000010108    | H132101 | 公営の借家数                             | public-housing-units          | 戸   |
| 0000010108    | H132102 | 都市再生機構（ＵＲ）・公社の借家数       | ur-public-corporation-housing | 戸   |
| 0000010108    | H1322   | 民営借家数                               | private-rental-housing        | 戸   |
| 0000010108    | H1323   | 給与住宅数                               | company-housing-units         | 戸   |
| 0000010108    | H1401   | 一戸建住宅数                             | detached-houses               | 戸   |
| 0000010108    | H140101 | 一戸建住宅数（木造）                     | detached-wooden-houses        | 戸   |
| 0000010108    | H140102 | 一戸建住宅数（非木造）                   | detached-non-wooden-houses    | 戸   |
| 0000010108    | H1402   | 長屋建住宅数                             | row-houses                    | 戸   |

### 社会保障・衛生に関するデータ

#### 健康・寿命関連

| stats_data_id | cat01 | item_name               | item_code                         | unit |
| :------------ | :---- | :---------------------- | :-------------------------------- | :--- |
| 0000010109    | I1101 | 平均余命（0 歳）（男）  | life-expectancy-at-birth-male     | 年   |
| 0000010109    | I1102 | 平均余命（0 歳）（女）  | life-expectancy-at-birth-female   | 年   |
| 0000010109    | I1201 | 平均余命（20 歳）（男） | life-expectancy-at-20-male        | 年   |
| 0000010109    | I1202 | 平均余命（20 歳）（女） | average-life-expectancy-female    | 年   |
| 0000010109    | I1301 | 平均余命（40 歳）（男） | life-expectancy-at-40-male        | 年   |
| 0000010109    | I1302 | 平均余命（40 歳）（女） | life-expectancy-at-40-female      | 年   |
| 0000010109    | I1401 | 平均余命（60 歳）（男） | life-expectancy-at-60-male        | 年   |
| 0000010109    | I1402 | 平均余命（60 歳）（女） | life-expectancy-at-60-female      | 年   |
| 0000010109    | I1501 | 平均余命（65 歳）（男） | average-life-expectancy-male-65   | 年   |
| 0000010109    | I1502 | 平均余命（65 歳）（女） | average-life-expectancy-female-65 | 年   |
| 0000010109    | I1601 | 健康寿命（男）          | health-life-expectancy-male       | 年   |
| 0000010109    | I1602 | 健康寿命（女）          | health-life-expectancy-female     | 年   |

#### 健康診断・保健関連

| stats_data_id | cat01   | item_name                                                  | item_code                                             | unit |
| :------------ | :------ | :--------------------------------------------------------- | :---------------------------------------------------- | :--- |
| 0000010109    | I210101 | 健康診断受診者数（保健所及び市区町村実施分）（結核）       | health-checkup-tuberculosis                           | 人   |
| 0000010109    | I210104 | 健康診断受診者数（保健所及び市区町村実施分）（生活習慣病） | health-checkup-lifestyle-disease                      | 人   |
| 0000010109    | I210110 | 健康診断受診者数（保健所実施分）                           | health-checkup-public-health-center                   | 人   |
| 0000010109    | I210112 | 健康診断受診者数（保健所実施分・精神）                     | health-checkup-public-health-center-mental            | 人   |
| 0000010109    | I210114 | 健康診断受診者数（保健所実施分・生活習慣病）               | health-checkup-public-health-center-lifestyle-disease | 人   |
| 0000010109    | I210115 | 健康診断受診者数（保健所実施分・妊産婦）                   | health-checkup-public-health-center-maternal          | 人   |
| 0000010109    | I210116 | 健康診断受診者数（保健所実施分・乳幼児）                   | health-checkup-public-health-center-infant            | 人   |

### 生活保護・福祉に関するデータ

#### 生活保護関連

| stats_data_id | cat01     | item_name                                                | item_code                                          | unit |
| :------------ | :-------- | :------------------------------------------------------- | :------------------------------------------------- | :--- |
| 0000010210    | #J01101   | 生活保護被保護実世帯数（月平均一般世帯千世帯当たり）     | households-on-public-assistance-per-1000           | 世帯 |
| 0000010210    | #J01107   | 生活保護被保護実人員（月平均人口千人当たり）             | persons-on-public-assistance-per-1000              | 人   |
| 0000010210    | #J0110803 | 生活保護教育扶助人員（月平均人口千人当たり）             | public-assistance-education-beneficiaries-per-1000 | 人   |
| 0000010210    | #J0110804 | 生活保護医療扶助人員（月平均人口千人当たり）             | public-assistance-medical-beneficiaries-per-1000   | 人   |
| 0000010210    | #J0110805 | 生活保護住宅扶助人員（月平均人口千人当たり）             | public-assistance-housing-beneficiaries-per-1000   | 人   |
| 0000010210    | #J0110806 | 生活保護介護扶助人員（月平均人口千人当たり）             | public-assistance-nursing-beneficiaries-per-1000   | 人   |
| 0000010210    | #J0110902 | 生活保護被保護高齢者数（月平均 65 歳以上人口千人当たり） | elderly-on-public-assistance-per-1000-65plus       | 人   |
| 0000010210    | #J01200   | 身体障害者手帳交付数（人口千人当たり）                   | physical-disability-certificates-issued-per-1000   | 人   |

#### 福祉施設関連

| stats_data_id | cat01    | item_name                                          | item_code                                                | unit |
| :------------ | :------- | :------------------------------------------------- | :------------------------------------------------------- | :--- |
| 0000010210    | #J02101  | 保護施設数（生活保護被保護実人員 10 万人当たり）   | welfare-facilities-count-per-100k-on-assistance          | 所   |
| 0000010210    | #J022011 | 老人ホーム数（65 歳以上人口 10 万人当たり）        | nursing-home-count-per-100k-65plus                       | 所   |
| 0000010210    | #J02202  | 老人福祉センター数（65 歳以上人口 10 万人当たり）  | senior-welfare-center-count-per-100k-65plus              | 所   |
| 0000010210    | #J02203  | 老人憩の家数（65 歳以上人口 10 万人当たり）        | senior-recreation-home-count-per-100k-65plus             | 所   |
| 0000010210    | #J02204  | 有料老人ホーム数（65 歳以上人口 10 万人当たり）    | paid-nursing-home-count-per-100k-65plus                  | 所   |
| 0000010210    | #J02205  | 介護老人福祉施設数（65 歳以上人口 10 万人当たり）  | nursing-welfare-facility-count-per-100k-65plus           | 所   |
| 0000010210    | #J02301  | 身体障害者更生援護施設数（人口 100 万人当たり）    | physical-disability-rehabilitation-facility-count-per-1m | 所   |
| 0000010210    | #J02401  | 知的障害者援護施設数（人口 100 万人当たり）        | intellectual-disability-support-facility-count-per-1m    | 所   |
| 0000010210    | #J02501  | 児童福祉施設等数（人口 10 万人当たり）             | child-welfare-facility-count-per-100k                    | 所   |
| 0000010210    | #J03101  | 保護施設従事者数（生活保護被保護実人員千人当たり） | welfare-facility-staff-per-1000-on-assistance            | 人   |
| 0000010210    | #J032011 | 老人ホーム従事者数（65 歳以上人口 10 万人当たり）  | nursing-home-staff-per-100k-65plus                       | 人   |

### 消防・安全に関するデータ

#### 消防関連

| stats_data_id | cat01   | item_name                                          | item_code                                              | unit |
| :------------ | :------ | :------------------------------------------------- | :----------------------------------------------------- | :--- |
| 0000010211    | #K01102 | 消防署数（可住地面積 100km2 当たり）               | fire-department-count-per-100-km2                      | 署   |
| 0000010211    | #K01104 | 消防団・分団数（可住地面積 100km2 当たり）         | fire-department-branch-count-per-100-km2               | 団   |
| 0000010211    | #K01105 | 消防ポンプ自動車等現有数（人口 10 万人当たり）     | fire-department-pump-car-count-per-100-thousand-people | 台   |
| 0000010211    | #K01107 | 消防水利数（人口 10 万人当たり）                   | fire-department-water-count-per-100-thousand-people    | 所   |
| 0000010211    | #K01301 | 消防関係人員数（人口 10 万人当たり）               | fire-related-personnel-count-per-100k                  | 人   |
| 0000010211    | #K01302 | 消防吏員数（人口 10 万人当たり）                   | fire-department-member-count-per-100-thousand-people   | 人   |
| 0000010211    | #K01401 | 消防機関出動回数（人口 10 万人当たり）             | fire-department-dispatch-count-per-100-thousand-people | 回   |
| 0000010211    | #K01402 | 火災のための消防機関出動回数（人口 10 万人当たり） | fire-dispatch-for-building-fire-count-per-100k         | 回   |

#### 火災・交通事故関連

| stats_data_id | cat01   | item_name                                  | item_code                                          | unit |
| :------------ | :------ | :----------------------------------------- | :------------------------------------------------- | :--- |
| 0000010211    | #K02101 | 火災出火件数（人口 10 万人当たり）         | building-fire-count-per-100-thousand-people        | 件   |
| 0000010211    | #K02103 | 建物火災出火件数（人口 10 万人当たり）     | building-fire-count-per-100k                       | 件   |
| 0000010211    | #K02203 | 火災死傷者数（人口 10 万人当たり）         | fire-damage-casualties-per-population              | 人   |
| 0000010211    | #K02205 | 建物火災損害額（人口 1 人当たり）          | building-fire-damage-amount-per-person             | 円   |
| 0000010211    | #K02301 | 火災り災世帯数（建物火災 100 件当たり）    | fire-damage-household-count-per-100-building-fires | 世帯 |
| 0000010211    | #K02303 | 火災死傷者数（建物火災 100 件当たり）      | fire-damage-casualties-per-accident                | 人   |
| 0000010211    | #K02306 | 建物火災損害額（建物火災 1 件当たり）      | building-fire-damage-amount-per-building-fire      | 万円 |
| 0000010211    | #K03102 | 立体横断施設数（道路実延長千 km 当たり）   | grade-separated-pedestrian-crossings-per-1000-km   | 所   |
| 0000010211    | #K04101 | 交通事故発生件数（人口 10 万人当たり）     | traffic-accident-count-per-population              | 件   |
| 0000010211    | #K04102 | 交通事故発生件数（道路実延長千 km 当たり） | traffic-accident-count-per-1000-km                 | 件   |
| 0000010211    | #K04105 | 交通事故死傷者数（人口 10 万人当たり）     | traffic-accident-casualties-per-population         | 人   |

### 家計・消費に関するデータ

#### 収入・支出関連

| stats_data_id | cat01     | item_name                                                             | item_code                                                           | unit |
| :------------ | :-------- | :-------------------------------------------------------------------- | :------------------------------------------------------------------ | :--- |
| 0000010212    | #L01100   | 農家総所得                                                            | total-farm-household-income                                         | 千円 |
| 0000010212    | #L0110101 | 農業所得割合                                                          | agricultural-income-ratio                                           | ％   |
| 0000010212    | #L0110102 | 農外所得割合                                                          | non-agricultural-income-ratio                                       | ％   |
| 0000010212    | #L01201   | 実収入（二人以上の世帯のうち勤労者世帯）（1 世帯当たり 1 か月間）     | actual-income-worker-households-per-month                           | 千円 |
| 0000010212    | #L01204   | 世帯主収入（二人以上の世帯のうち勤労者世帯）（1 世帯当たり 1 か月間） | household-head-income-worker-households-per-month                   | 千円 |
| 0000010212    | #L02101   | 農家世帯の家計費（1 世帯当たり 1 か月間）                             | farm-household-expenditure-per-month                                | 千円 |
| 0000010212    | #L02211   | 消費支出（二人以上の世帯）（1 世帯当たり 1 か月間）                   | consumption-expenditure-multi-person-households-per-month           | 千円 |
| 0000010212    | #L02411   | 食料費割合（二人以上の世帯）                                          | food-expenditure-ratio-multi-person-households                      | ％   |
| 0000010212    | #L02412   | 住居費割合（二人以上の世帯）                                          | housing-expenditure-ratio-multi-person-households                   | ％   |
| 0000010212    | #L02413   | 光熱・水道費割合（二人以上の世帯）                                    | utilities-expenditure-ratio-multi-person-households                 | ％   |
| 0000010212    | #L02414   | 家具・家事用品費割合（二人以上の世帯）                                | furniture-household-goods-expenditure-ratio-multi-person-households | ％   |
| 0000010212    | #L02415   | 被服及び履物費割合（二人以上の世帯）                                  | clothing-footwear-expenditure-ratio-multi-person-households         | ％   |
| 0000010212    | #L02416   | 保健医療費割合（二人以上の世帯）                                      | healthcare-expenditure-ratio-multi-person-households                | ％   |
| 0000010212    | #L02417   | 交通・通信費割合（二人以上の世帯）                                    | transport-communication-expenditure-ratio-multi-person-households   | ％   |
| 0000010212    | #L02418   | 教育費割合（二人以上の世帯）                                          | education-expenditure-ratio-multi-person-households                 | ％   |
| 0000010212    | #L02419   | 教養娯楽費割合（二人以上の世帯）                                      | culture-recreation-expenditure-ratio-multi-person-households        | ％   |
| 0000010212    | #L02420   | その他の消費支出割合（二人以上の世帯）                                | other-consumption-expenditure-ratio-multi-person-households         | ％   |
| 0000010212    | #L02601   | 農家世帯の平均消費性向                                                | average-propensity-to-consume-of-farm-households                    | ％   |
| 0000010212    | #L02602   | 平均消費性向（二人以上の世帯のうち勤労者世帯）                        | avg-propensity-to-consume-worker-households                         | ％   |

## 国土・気象関連統計データまとめ

### 面積・土地利用に関するデータ

#### 総面積・可住地面積関連

| stats_data_id | cat01    | item_name                        | item_code                                               | unit        |
| :------------ | :------- | :------------------------------- | :------------------------------------------------------ | :---------- |
| 0000010202    | #B011001 | 総面積（北方地域及び竹島を含む） | total-area-including-northern-territories-and-takeshima | １００Ｋ m2 |
| 0000010202    | #B01101  | 面積割合（全国面積に占める割合） | area-ratio-of-total                                     | ％          |
| 0000010202    | #B01301  | 可住地面積割合                   | habitable-area-ratio                                    | ％          |
| 0000010102    | B1101    | 総面積（北方地域及び竹島を除く） | total-area-excluding-northern-territories-and-takeshima | ｈａ        |
| 0000010102    | B1102    | 総面積（北方地域及び竹島を含む） | total-area-including-northern-territories-and-takeshima | ｈａ        |
| 0000010102    | B1103    | 可住地面積                       | habitable-area                                          | ｈａ        |
| 0000010102    | B1104    | 主要湖沼面積                     | major-lake-area                                         | ｈａ        |

#### 森林・自然環境関連

| stats_data_id | cat01   | item_name            | item_code                             | unit |
| :------------ | :------ | :------------------- | :------------------------------------ | :--- |
| 0000010202    | #B01202 | 森林面積割合         | forest-area-ratio                     | ％   |
| 0000010202    | #B01204 | 自然公園面積割合     | nature-park-area-ratio                | ％   |
| 0000010102    | B1105   | 林野面積             | forest-area                           | ｈａ |
| 0000010102    | B1106   | 森林面積             | woodland-area                         | ｈａ |
| 0000010102    | B1107   | 森林以外の草生地面積 | non-forest-grassland-area             | ｈａ |
| 0000010102    | B1108   | 自然環境保全地域面積 | natural-environment-conservation-area | ｈａ |

#### 土地評価・課税関連

| stats_data_id | cat01     | item_name                      | item_code                                  | unit |
| :------------ | :-------- | :----------------------------- | :----------------------------------------- | :--- |
| 0000010202    | #B01401   | 評価総地積割合（課税対象土地） | total-assessed-land-area-ratio             | ％   |
| 0000010202    | #B0140101 | 評価総地積割合（田）           | total-assessed-land-area-ratio-paddy       | ％   |
| 0000010202    | #B0140102 | 評価総地積割合（畑）           | total-assessed-land-area-ratio-field       | ％   |
| 0000010202    | #B0140103 | 評価総地積割合（宅地）         | total-assessed-land-area-ratio-residential | ％   |
| 0000010102    | B1201     | 評価総地積（課税対象土地）     | total-assessed-land-area                   | ｍ 2 |
| 0000010102    | B120101   | 評価総地積（田）               | total-assessed-land-area-paddy             | ｍ 2 |
| 0000010102    | B120102   | 評価総地積（畑）               | total-assessed-land-area-field             | ｍ 2 |

### 気象に関するデータ

#### 気温・湿度関連

| stats_data_id | cat01   | item_name                              | item_code                 | unit |
| :------------ | :------ | :------------------------------------- | :------------------------ | :--- |
| 0000010202    | #B02101 | 年平均気温                             | average-temperature       | ﾟ C  |
| 0000010202    | #B02102 | 最高気温（日最高気温の月平均の最高値） | maximum-temperature       | ﾟ C  |
| 0000010202    | #B02103 | 最低気温（日最低気温の月平均の最低値） | lowest-temperature        | ﾟ C  |
| 0000010202    | #B02201 | 年平均相対湿度                         | average-relative-humidity | ％   |

#### 降水・日照関連

| stats_data_id | cat01   | item_name        | item_code                 | unit |
| :------------ | :------ | :--------------- | :------------------------ | :--- |
| 0000010202    | #B02301 | 快晴日数（年間） | annual-clear-days         | 日   |
| 0000010202    | #B02303 | 降水日数（年間） | annual-precipitation-days | 日   |
| 0000010202    | #B02304 | 雪日数（年間）   | annual-snow-days          | 日   |
| 0000010202    | #B02401 | 日照時間（年間） | annual-sunshine-duration  | 時間 |
| 0000010202    | #B02402 | 降水量（年間）   | annual-precipitation      | mm   |
