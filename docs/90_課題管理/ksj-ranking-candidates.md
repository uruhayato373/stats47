# GIS データから作成可能な都道府県ランキング候補

e-Stat に存在せず、国土数値情報（KSJ）・国土交通データプラットフォーム（MCP）のデータを都道府県別に集計して作成できるランキング候補。

## A. ダウンロード済み KSJ データから作成可能

| # | ランキング案 | rankingKey 案 | ソース | features | カテゴリ |
|---|---|---|---|---|---|
| 1 | ダム数 | dam-count | W01 Dam | 2,749 | infrastructure |
| 2 | 道の駅数 | roadside-station-count | P35 | 1,145 | tourism |
| 3 | 漁港数 | fishing-port-count | C09 FishingPort | 2,931 | agriculture |
| 4 | 鉄道駅数 | railway-station-count | N02 Station | 10,235 | infrastructure |
| 5 | 高速道路 IC・JCT 数 | expressway-junction-count | N06 Joint | 2,388 | infrastructure |
| 6 | 観光資源数 | tourism-resource-count | P12 | 19,140 | tourism |
| 7 | 湖沼数 | lake-count | W09 Lake | 556 | landweather |
| 8 | 空港数 | airport-count | C28 Airport | 100 | infrastructure |
| 9 | 原子力発電所数 | nuclear-power-plant-count | P03 NuclearPowerPlant | 68 | energy |
| 10 | 火力発電所数 | thermal-power-plant-count | P03 ThermalPowerPlant | 390 | energy |
| 11 | 水力発電所数 | hydroelectric-power-plant-count | P03 GeneralHydroelectricPowerPlant | 698 | energy |
| 12 | 太陽光発電施設数 | photovoltaic-power-plant-count | P03 PhotovoltaicPowerPlant | 10,654 | energy |
| 13 | 風力発電施設数（施設ベース） | wind-power-plant-count | P03 WindPowerPlant | 417 | energy |
| 14 | 地熱発電施設数 | geothermal-power-plant-count | P03 GeothermalPowerPlant | 19 | energy |
| 15 | バイオマス発電施設数 | biomass-power-station-count | P03 BiomassPowerStation | 400 | energy |
| 16 | 揚水発電所数 | pumped-storage-plant-count | P03 PumpedStorageHydroelectricPlant | 46 | energy |

## B. D1 既存データから作成可能

| # | ランキング案 | rankingKey 案 | ソース | features | カテゴリ |
|---|---|---|---|---|---|
| 17 | 港湾数 | port-count | D1 ports テーブル | 699 | infrastructure |

## C. MCP（国土交通データプラットフォーム）から取得可能

| # | ランキング案 | rankingKey 案 | MCP データセット | 件数 | カテゴリ | 備考 |
|---|---|---|---|---|---|---|
| 18 | 港湾数（海しる） | port-count-msil | msil_harbor | 1,269 | infrastructure | D1 の 699件より詳細 |
| 19 | 灯台数 | lighthouse-count | msil_lighthouse | 3,207 | infrastructure | 海上保安庁データ |
| 20 | 島数 | island-count | msil_island | 1,334 | landweather | 有人・無人島含む |
| 21 | 海上保安部署等数 | coast-guard-office-count | msil_coast_guard_hq | 191 | safetyenvironment | 海保施設 |
| 22 | 橋梁数 | bridge-count | rsdb_bridge | 10,000+ | infrastructure | 道路施設点検 DB |
| 23 | トンネル数 | tunnel-count | rsdb_tunnel | 10,000+ | infrastructure | 道路施設点検 DB |
| 24 | 横断歩道橋数 | pedestrian-deck-count | rsdb_pedestrian_deck | 10,000+ | infrastructure | 道路施設点検 DB |
| 25 | 係留施設数 | berth-count | cyport berth | 1,525 | infrastructure | サイバーポート |
| 26 | 自然災害伝承碑数 | disaster-monument-count | ndm | 2,377 | safetyenvironment | 過去の災害記録 |
| 27 | ダム便覧（詳細） | dam-directory-count | dhb | 2,476 | infrastructure | W01 の補完データ |
| 28 | 雨量観測所数 | rain-gauge-count | hwq_rain | 2,278 | landweather | 水文水質 DB |
| 29 | 水位観測所数 | water-level-gauge-count | hwq_stage | 1,869 | landweather | 水文水質 DB |
| 30 | GTFS 公共交通事業者数 | gtfs-operator-count | gtfs | 561 | infrastructure | バス・鉄道事業者 |
| 31 | 都道府県間OD交通量 | od-traffic-volume | rdpf od_ar | 1,908 | infrastructure | 道路データ PF |
| 32 | インフラみらいマップ施設数 | infra-future-map-count | imm_imm | 1,217 | infrastructure | 老朽化インフラ |

## D. 追加 KSJ ダウンロードで作成可能

| # | ランキング案 | rankingKey 案 | KSJ ID | カテゴリ | 備考 |
|---|---|---|---|---|---|
| 33 | ヘリポート数 | heliport-count | N11 | infrastructure | 10,000+。非商用 |
| 34 | 燃料給油所（ガソリンスタンド）数 | gas-station-count | P07 | infrastructure | 10,000+。非商用 |
| 35 | 研究機関数 | research-institution-count | P16 | educationsports | 10,000+。非商用 |
| 36 | 文化施設数 | cultural-facility-count | P27 | educationsports | 10,000+。非商用 |
| 37 | 都道府県指定文化財数 | prefectural-cultural-property-count | P32 | tourism | 10,000+。非商用 |
| 38 | 地場産業関連施設数 | local-industry-facility-count | P24 | commercial | 6,856。非商用 |
| 39 | 物流拠点数 | logistics-hub-count | P31 | commercial | 8,350。非商用 |
| 40 | 集客施設数 | attraction-facility-count | P33 | tourism | 10,000+。非商用 |
| 41 | ニュータウン数 | new-town-count | P26 | infrastructure | 2,012。非商用 |
| 42 | 避難施設数 | evacuation-facility-count | P20 | safetyenvironment | 10,000+。非商用 |
| 43 | 工業用地数 | industrial-land-count | L05 | commercial | 3,539。非商用 |
| 44 | 公共施設数 | public-facility-count | P02 | infrastructure | 10,000+。非商用 |
| 45 | 浄水場数 | water-purification-plant-count | P21 | infrastructure | 9,976。非商用 |
| 46 | 下水処理場数 | sewage-treatment-plant-count | P22 | infrastructure | 2,185。非商用 |
| 47 | 一般廃棄物処理施設数 | waste-disposal-facility-count | P15 | safetyenvironment | 6,617。非商用 |
| 48 | 産業廃棄物処理施設数 | industrial-waste-facility-count | P15 | safetyenvironment | 10,000+。非商用 |
| 49 | バス停留所数 | bus-stop-count | P11 | infrastructure | CC BY 4.0 |
| 50 | 高速バス停留所数 | express-bus-stop-count | P36 | infrastructure | CC BY 4.0。9,224 |
| 51 | 消防署数 | fire-station-count | P17 | safetyenvironment | 5,712。非商用 |
| 52 | 警察署数 | police-station-count | P18 | safetyenvironment | 10,000+。非商用 |
| 53 | 郵便局数 | post-office-count | P30 | infrastructure | 10,000+。非商用 |
| 54 | 医療機関数（施設ベース） | medical-facility-count-ksj | P04 | socialsecurity | CC BY 4.0。e-Stat にも類似あり |
| 55 | 学校数（施設ベース） | school-count-ksj | P29 | educationsports | CC BY 4.0。e-Stat にも類似あり |
| 56 | 福祉施設数 | welfare-facility-count | P14 | socialsecurity | CC BY 4.0（一部制限） |
| 57 | 都市公園数 | urban-park-count-ksj | P13 | infrastructure | 非商用 |
| 58 | 国・都道府県の機関数 | government-office-count | P28 | infrastructure | 10,000+。非商用 |
| 59 | 市区町村役場数 | municipal-office-count | P34 | infrastructure | 5,774。非商用 |
| 60 | 地域資源数 | regional-resource-count | P19 | tourism | 10,000+。非商用 |
| 61 | 竜巻発生地点数 | tornado-occurrence-count | A30b | safetyenvironment | 1,476。非商用 |
| 62 | 景観重要建造物数 | landscape-important-building-count | A35c | tourism | 253。非商用 |
| 63 | 景観重要樹木数 | landscape-important-tree-count | A35c | landweather | 295。非商用 |

## カテゴリ別サマリ

| カテゴリ | stats47 カテゴリキー | 候補数 | 主なランキング |
|---|---|---|---|
| エネルギー | energy | 8 | 原子力/火力/水力/太陽光/風力/地熱/バイオマス/揚水 |
| 社会基盤 | infrastructure | 25 | ダム、港湾、駅、IC/JCT、空港、灯台、橋梁、トンネル、ヘリポート、GS、浄水場、下水処理場、バス停、郵便局、GTFS |
| 観光 | tourism | 7 | 道の駅、観光資源、文化財、集客施設、景観重要建造物、地域資源 |
| 農林水産 | agriculture | 1 | 漁港 |
| 商業 | commercial | 2 | 地場産業施設、物流拠点、工業用地 |
| 国土・気象 | landweather | 4 | 湖沼、島、雨量観測所、水位観測所 |
| 安全・環境 | safetyenvironment | 8 | 消防署、警察署、海保、避難施設、廃棄物処理、自然災害伝承碑、竜巻 |
| 社会保障 | socialsecurity | 2 | 医療機関、福祉施設 |
| 教育・文化 | educationsports | 3 | 学校、研究機関、文化施設 |

## 注意事項

- e-Stat に「病院数」「学校数」等の公式集計値がある場合は、そちらを優先すべき（#54, #55 は重複の可能性）
- 非商用ライセンスのデータは公開可否を別途確認
- P03（発電施設）は 2013 年時点。最新状況とは乖離がある可能性
- MCP データ（C セクション）は件数上限 10,000 の可能性あり。`get_all_data` で全件取得が必要
- 施設数だけでなく「人口あたり施設数」「面積あたり施設数」の正規化ランキングも作成可能
- 集計には各 feature の属性 `DPF:prefecture_code` を使用。ない場合は座標から逆ジオコーディング

## データソース別の取得方法

| ソース | 取得方法 | 都道府県コード |
|---|---|---|
| A. KSJ（ダウンロード済み） | ローカル TopoJSON から集計 | 座標 or 属性から判定 |
| B. D1 既存データ | SQL 集計 | `prefecture_code` カラム |
| C. MCP | `search_by_attribute` + `get_all_data` | `DPF:prefecture_code` 属性 |
| D. KSJ（追加ダウンロード） | `/fetch-mlit-ksj` → TopoJSON 集計 | 座標 or 属性から判定 |

## 実装手順

1. データ取得（ソース種別に応じて A〜D のいずれか）
2. 都道府県コードで集計（件数カウント）
3. `/register-ranking` で ranking_items + ranking_data に登録
4. 必要に応じて人口/面積で正規化した派生ランキングも作成
