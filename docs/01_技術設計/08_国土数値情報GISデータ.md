---
type: tech-design
status: active
tags: [gis, mlit, data-source]
---

# MLIT KSJ（国土数値情報）モジュール

国土交通省「国土数値情報ダウンロードサービス」の GIS データを、ダウンロード → TopoJSON 変換 → R2 保存するパイプライン。

- **ソース**: https://nlftp.mlit.go.jp/ksj/index.html
- **スキル**: `/fetch-mlit-ksj`

## 使い方

```bash
# データセット一覧 (D1: gis_datasets、status + 統計値マージ表示)
npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts --list
npx tsx packages/gis/src/mlit-ksj/scripts/list-datasets.ts
npx tsx packages/gis/src/mlit-ksj/scripts/list-datasets.ts --status=imported
npx tsx packages/gis/src/mlit-ksj/scripts/list-datasets.ts --status=available
npx tsx packages/gis/src/mlit-ksj/scripts/list-datasets.ts --category=transport

# RANKINGS を D1 に seed (Phase 2 で hardcode から移管)
npx tsx packages/gis/src/mlit-ksj/scripts/seed-from-registry.ts

# docs/01_技術設計/08_...md の自動セクションを再生成
npx tsx packages/gis/src/mlit-ksj/scripts/generate-docs.ts

# 単一データセット取得（全国）
npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts N02

# 県別データセット（単県）
npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts P04 --pref 13

# 県別データセット（全47都道府県）
npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts P04 --all-prefs

# カテゴリ内の全国データを一括取得
npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts --category transport
```

## パイプライン処理

```
MLIT zip ダウンロード → /tmp/ に保存
  → GeoJSON 抽出（UTF-8/ ディレクトリ優先）
  → GeoJSON 未検出時は Shapefile から自動変換（shapefile ライブラリ使用）
  → プロパティ名リマップ（KSJ コード → 人間可読名）
  → TopoJSON 変換 + 簡略化（topojson-server + topojson-simplify）
  → .local/r2/gis/mlit-ksj/{dataId}/{version}/ に保存
  → _meta.json 生成（出典・ライセンス・ファイル情報）
  → /tmp/ クリーンアップ
```

## 出力先

```
.local/r2/gis/mlit-ksj/
├── {dataId}/
│   └── {version}/
│       ├── _meta.json           # メタデータ
│       ├── national.topojson    # 全国データ（ファイル1つの場合）
│       ├── {元ファイル名}.topojson  # 複数ファイルの場合
│       └── {prefCode}.topojson  # 県別データの場合
```

<!-- AUTO-GENERATED:START -->

<!-- generated: 2026-05-19T22:23:17.668Z by scripts/generate-docs.ts -->

## データセット一覧 (D1: gis_datasets)

状態別件数: available 85 / registered 3 / imported 39 / deprecated 0 (計 127)

### 登録済みデータセット (status='registered' / 'imported')

合計 42 件。

#### 国土(水・土地)

| ID | データ名 | 型 | 範囲 | ライセンス | stats47カテゴリ | ranking |
|---|---|---|---|---|---|---|
| A12 | 農業地域 | polygon | prefecture | CC BY 4.0(一部制限) | agriculture |  |
| A13 | 森林地域 | polygon | prefecture | CC BY 4.0(一部制限) | agriculture |  |
| C23 | 海岸線 | line | prefecture | 非商用 | — |  |
| G04-a | 標高・傾斜度3次メッシュ | mesh | mesh | 商用可 | — |  |
| L01 | 地価公示 | point | national | CC BY 4.0 | economy |  |
| L02 | 都道府県地価調査 | point | national | CC BY 4.0 | economy |  |
| L03-a | 土地利用3次メッシュ | mesh | mesh | CC BY 4.0 | — |  |
| W01 | ダム | point | national | 非商用 | — | ✓ |
| W05 | 河川 | line | prefecture | 非商用 | — |  |
| W09 | 湖沼 | polygon | national | 商用可 | landweather | ✓ |

#### 政策区域

| ID | データ名 | 型 | 範囲 | ライセンス | stats47カテゴリ | ranking |
|---|---|---|---|---|---|---|
| A10 | 自然公園地域 | polygon | prefecture | CC BY 4.0(一部制限) | safetyenvironment |  |
| A16 | DID人口集中地区 | polygon | national | 商用可 | population |  |
| A17 | 過疎地域 | polygon | prefecture | 商用可 | population |  |
| A22 | 豪雪地帯 | polygon | prefecture | 商用可 | landweather |  |
| A27 | 小学校区 | polygon | prefecture | CC BY 4.0(一部制限) | educationsports |  |
| A29 | 用途地域 | polygon | prefecture | CC BY 4.0(一部制限) | infrastructure |  |
| A31b | 洪水浸水想定区域 | polygon | mesh | CC BY 4.0 | safetyenvironment |  |
| A32 | 中学校区 | polygon | prefecture | CC BY 4.0(一部制限) | educationsports |  |
| A33 | 土砂災害警戒区域 | polygon | prefecture | CC BY 4.0(一部制限) | safetyenvironment |  |
| A38 | 医療圏 | polygon | national | CC BY 4.0 | socialsecurity |  |
| A40 | 津波浸水想定 | polygon | prefecture | CC BY 4.0(一部制限) | safetyenvironment |  |
| N03 | 行政区域 | polygon | national | CC BY 4.0 | — |  |

#### 施設

| ID | データ名 | 型 | 範囲 | ライセンス | stats47カテゴリ | ranking |
|---|---|---|---|---|---|---|
| P03 | 発電施設 | point | national | 非商用 | energy | ✓ |
| P04 | 医療機関 | point | prefecture | CC BY 4.0 | socialsecurity |  |
| P05 | 市町村役場等・公的集会施設 | point | prefecture | CC BY 4.0 | — |  |
| P11 | バス停留所 | point | prefecture | CC BY 4.0 | infrastructure |  |
| P12 | 観光資源 | point | national | 非商用 | tourism | ✓ |
| P13 | 都市公園 | polygon | prefecture | 非商用 | infrastructure |  |
| P14 | 福祉施設 | point | prefecture | CC BY 4.0(一部制限) | socialsecurity |  |
| P17 | 消防署 | point | prefecture | 非商用 | safetyenvironment |  |
| P18 | 警察署 | point | prefecture | 非商用 | safetyenvironment |  |
| P29 | 学校 | point | prefecture | CC BY 4.0 | educationsports |  |
| P35 | 道の駅 | point | national | 非商用 | tourism | ✓ |
| P36 | 高速バス停留所 | point | prefecture | CC BY 4.0 | infrastructure |  |

#### 交通

| ID | データ名 | 型 | 範囲 | ライセンス | stats47カテゴリ | ranking |
|---|---|---|---|---|---|---|
| C02 | 港湾 | point | national | 非商用 | infrastructure |  |
| C09 | 漁港 | point | national | 非商用 | agriculture | ✓ |
| C28 | 空港 | point | national | 商用可 | infrastructure | ✓ |
| N02 | 鉄道 | line | national | CC BY 4.0 | infrastructure | ✓ |
| N06 | 高速道路時系列 | line | national | CC BY 4.0(一部制限) | infrastructure | ✓ |
| N07 | バスルート | line | prefecture | CC BY 4.0 | infrastructure |  |
| S12 | 駅別乗降客数 | point | national | CC BY 4.0 | infrastructure |  |

#### 統計

| ID | データ名 | 型 | 範囲 | ライセンス | stats47カテゴリ | ranking |
|---|---|---|---|---|---|---|
| mesh1000r6 | 1kmメッシュ将来推計人口(R6) | mesh | prefecture | CC BY 4.0 | population |  |


### ダウンロード済みデータ (status='imported')

合計 39 件 / 1.4GB

| ID | データ名 | バージョン | ファイル数 | サイズ |
|---|---|---|---|---|
| mesh1000r6 | 1kmメッシュ将来推計人口(R6) | 24 | 47 | 1.0GB |
| A38 | 医療圏 | 20 | 140 | 109MB |
| L01 | 地価公示 | 25 | 1 | 73MB |
| N03 | 行政区域 | 20250101 | 94 | 64MB |
| L02 | 都道府県地価調査 | 25 | 1 | 57MB |
| A40 | 津波浸水想定 | 23 | 1 | 26MB |
| S12 | 駅別乗降客数 | 24 | 1 | 10MB |
| A13 | 森林地域 | 15 | 4 | 9MB |
| N02 | 鉄道 | 24 | 2 | 8MB |
| P12 | 観光資源 | 14 | 125 | 8MB |
| P03 | 発電施設 | 13 | 10 | 5MB |
| P17 | 消防署 | 12 | 2 | 3MB |
| P18 | 警察署 | 12 | 2 | 3MB |
| W05 | 河川 | 09 | 2 | 2MB |
| P14 | 福祉施設 | 23 | 1 | 2MB |
| A12 | 農業地域 | 15 | 2 | 2MB |
| C09 | 漁港 | 06 | 2 | 1MB |
| A16 | DID人口集中地区 | 20 | 1 | 1MB |
| A33 | 土砂災害警戒区域 | 23 | 1 | 1MB |
| P11 | バス停留所 | 22 | 1 | 1MB |
| N06 | 高速道路時系列 | 20 | 2 | 954KB |
| W01 | ダム | 14 | 1 | 863KB |
| C23 | 海岸線 | 06 | 1 | 794KB |
| N07 | バスルート | 22 | 1 | 786KB |
| C02 | 港湾 | 08 | 3 | 723KB |
| P35 | 道の駅 | 18 | 1 | 690KB |
| A29 | 用途地域 | 19 | 18 | 676KB |
| A17 | 過疎地域 | 17 | 1 | 586KB |
| P04 | 医療機関 | 20 | 1 | 530KB |
| C28 | 空港 | 07 | 4 | 480KB |
| A10 | 自然公園地域 | 15 | 42 | 358KB |
| W09 | 湖沼 | 05 | 1 | 309KB |
| P29 | 学校 | 23 | 1 | 242KB |
| A27 | 小学校区 | 16 | 2 | 221KB |
| P13 | 都市公園 | 11 | 1 | 193KB |
| A32 | 中学校区 | 16 | 2 | 158KB |
| P05 | 市町村役場等・公的集会施設 | 22 | 1 | 157KB |
| A22 | 豪雪地帯 | 16 | 1 | 14KB |
| P36 | 高速バス停留所 | 23 | 1 | 13KB |

### 候補一覧 (status='available'、stats47 未登録)

合計 85 件。stats47 への取り込み候補。

| ID | データ名 | カテゴリ | ライセンス |
|---|---|---|---|
| A11 | 自然保全地域 | 施設 | 未確認 |
| A15 | 鳥獣保護区 | 施設 | 未確認 |
| A28 | 世界自然遺産 | 施設 | 未確認 |
| A34 | 世界文化遺産 | 施設 | 未確認 |
| L05 | 工業用地 | 施設 | 未確認 |
| P02 | 公共施設 | 施設 | 未確認 |
| P07 | 燃料給油所 | 施設 | 未確認 |
| P09 | 宿泊容量メッシュ | 施設 | 未確認 |
| P15 | 廃棄物処理施設 | 施設 | 未確認 |
| P16 | 研究機関 | 施設 | 未確認 |
| P19 | 地域資源 | 施設 | 未確認 |
| P21 | 上水道関連施設 | 施設 | 未確認 |
| P22 | 下水道関連施設 | 施設 | 未確認 |
| P24 | 地場産業関連施設 | 施設 | 未確認 |
| P26 | ニュータウン | 施設 | 未確認 |
| P27 | 文化施設 | 施設 | 未確認 |
| P28 | 国・都道府県の機関 | 施設 | 未確認 |
| P30 | 郵便局 | 施設 | 未確認 |
| P31 | 物流拠点 | 施設 | 未確認 |
| P32 | 都道府県指定文化財 | 施設 | 未確認 |
| P33 | 集客施設 | 施設 | 未確認 |
| P34 | 市区町村役場 | 施設 | 未確認 |
| A45 | 国有林野 | 国土(水・土地) | 未確認 |
| A54 | 大規模盛土造成地 | 国土(水・土地) | 未確認 |
| G04-c | 標高・傾斜度4次メッシュ | 国土(水・土地) | 未確認 |
| G04-d | 標高・傾斜度5次メッシュ | 国土(水・土地) | 未確認 |
| G08 | 低位地帯 | 国土(水・土地) | 未確認 |
| L03-b | 土地利用細分メッシュ | 国土(水・土地) | 未確認 |
| L03-b-c | 土地利用詳細メッシュ | 国土(水・土地) | 未確認 |
| L03-b-u | 都市地域土地利用細分メッシュ | 国土(水・土地) | 未確認 |
| P23 | 海岸保全施設 | 国土(水・土地) | 未確認 |
| W07 | 流域メッシュ | 国土(水・土地) | 未確認 |
| A03 | 三大都市圏計画区域 | 政策区域 | 未確認 |
| A09 | 都市地域 | 政策区域 | 未確認 |
| A18 | 半島振興対策実施地域 | 政策区域 | 未確認 |
| A18s-a | 半島振興対策実施地域統計情報 | 政策区域 | 未確認 |
| A19 | 離島振興対策実施地域 | 政策区域 | 未確認 |
| A19s | 離島振興対策実施地域統計情報 | 政策区域 | 未確認 |
| A20 | 奄美群島 | 政策区域 | 未確認 |
| A20s | 奄美群島統計情報 | 政策区域 | 未確認 |
| A21 | 小笠原諸島 | 政策区域 | 未確認 |
| A21s | 小笠原諸島統計情報 | 政策区域 | 未確認 |
| A22-m | 豪雪地帯（気象データ） | 政策区域 | 未確認 |
| A22s | 豪雪地帯統計情報 | 政策区域 | 未確認 |
| A23 | 特殊土壌地帯 | 政策区域 | 未確認 |
| A24 | 振興山村 | 政策区域 | 未確認 |
| A25 | 特定農山村地域 | 政策区域 | 未確認 |
| A30a5 | 土砂災害・雪崩メッシュ | 政策区域 | 未確認 |
| A30b | 竜巻等の突風 | 政策区域 | 未確認 |
| A31a | 洪水浸水想定区域（河川単位） | 政策区域 | 未確認 |
| A35a | 景観計画区域 | 政策区域 | 未確認 |
| A35b | 景観地区・準景観地区 | 政策区域 | 未確認 |
| A35c | 景観重要建造物・樹木 | 政策区域 | 未確認 |
| A37 | 半島循環道路 | 政策区域 | 未確認 |
| A39 | 密集市街地 | 政策区域 | 未確認 |
| A42 | 歴史的風土保存区域 | 政策区域 | 未確認 |
| A43 | 伝統的建造物群保存地区 | 政策区域 | 未確認 |
| A44 | 歴史的風致維持向上計画の重点地区 | 政策区域 | 未確認 |
| A46 | 地すべり防止区域 | 政策区域 | 未確認 |
| A47 | 急傾斜地崩壊危険区域 | 政策区域 | 未確認 |
| A48 | 災害危険区域 | 政策区域 | 未確認 |
| A49 | 高潮浸水想定区域 | 政策区域 | 未確認 |
| A50 | 立地適正化計画区域 | 政策区域 | 未確認 |
| A51 | 雨水出水（内水）浸水想定区域 | 政策区域 | 未確認 |
| A52 | 砂防指定地 | 政策区域 | 未確認 |
| A53 | 多段階浸水想定 | 政策区域 | 未確認 |
| A55 | 都市計画決定情報 | 政策区域 | 未確認 |
| G02 | 平年値（気候）メッシュ | 政策区域 | 未確認 |
| P20 | 避難施設 | 政策区域 | 未確認 |
| m1kr6 | 1kmメッシュ別将来推計人口（R6国政局推計） | 統計 | 未確認 |
| m250r6 | 250mメッシュ別将来推計人口（R6国政局推計） | 統計 | 未確認 |
| m500r6 | 500mメッシュ別将来推計人口（R6国政局推計） | 統計 | 未確認 |
| N04 | 道路密度・道路延長メッシュ | 交通 | 未確認 |
| N05 | 鉄道時系列 | 交通 | 未確認 |
| N08 | 空港時系列 | 交通 | 未確認 |
| N09 | 定期旅客航路 | 交通 | 未確認 |
| N10 | 緊急輸送道路 | 交通 | 未確認 |
| N11 | ヘリポート | 交通 | 未確認 |
| N12 | 重要物流道路 | 交通 | 未確認 |
| S05-a | 発生・集中量 | 交通 | 未確認 |
| S05-b | ＯＤ量 | 交通 | 未確認 |
| S05-c | 交通流動量_駅別乗降数 | 交通 | 未確認 |
| S05-d | 貨物旅客地域流動量 | 交通 | 未確認 |
| S10a | 港湾間流通量・海上経路 | 交通 | 未確認 |
| S10b | 空港間流通量 | 交通 | 未確認 |

<!-- AUTO-GENERATED:END -->

## ジオメトリ型別の実装パターン

| 型 | 既存実装例 | Leaflet コンポーネント |
|---|---|---|
| **point** | PortLeafletMap, FishingPortLeafletMap | CircleMarker + Tooltip |
| **line** | （新規） | GeoJSON + Polyline style |
| **polygon** | LeafletChoroplethMap, ChoroplethGeoJsonLayer | GeoJSON + fillColor/fillOpacity |
| **mesh** | （新規） | Canvas ヒートマップ or GeoJSON グリッド |

## モジュール構成

```
packages/gis/src/mlit-ksj/
├── types.ts           # KsjCodeConfig, KsjResolvedDataset, KsjPipelineOptions 等の型定義
├── registry.ts        # KSJ_CODE_CONFIG (downloadUrlPattern/propertyMap/simplifyOptions のみ)
│                        # 純メタは D1 gis_datasets に集約 (Phase 2 で縮小)
├── property-map.ts    # KSJ 属性コード → 人間可読名マッピング（N02_001 → railwayType）
├── r2-path.ts         # R2 保存パス構築
├── downloader.ts      # zip ダウンロード・GeoJSON/Shapefile 抽出
├── converter.ts       # GeoJSON → TopoJSON 変換（簡略化含む）
├── pipeline.ts        # オーケストレーター
├── index.ts           # Public API エクスポート
├── adapters/
│   └── fetch-ksj-from-local.ts  # ローカル R2 から TopoJSON 読み込み
└── scripts/
    ├── run-pipeline.ts          # パイプライン CLI エントリポイント (D1 status='registered' 必須)
    ├── list-datasets.ts         # gis_datasets テーブル一覧 CLI (status 集計付き)
    ├── seed-from-registry.ts    # RANKINGS を D1 (is_ranking_target/ranking_config) に seed
    ├── generate-docs.ts         # docs/01_技術設計/08_...md の自動セクションを D1 から生成
    └── register-ksj-rankings.ts # is_ranking_target=1 から metrics/stats を生成
```

## ジオメトリの目視確認

旧 `/gis/[dataId]` ビューア（2026-05 削除）の代替として、変換後 TopoJSON を確認する場合:

- `.local/r2/gis/mlit-ksj/{dataId}/{version}/*.topojson` を [geojson.io](https://geojson.io) にドラッグ＆ドロップ
- VS Code の GeoJSON プレビュー拡張で開く
- TopoJSON → GeoJSON 変換が必要な場合は `npx topo2geo` 等

## 新しいデータセットの追加方法

Phase 2 以降は真実源を D1 gis_datasets に一本化しました。新規データセットは以下の順序で追加します。

1. **D1 gis_datasets に行を追加** (status='registered', 純メタを設定):
   ```sql
   INSERT INTO gis_datasets (
     data_id, name, name_en, category, geometry_type, coverage,
     license, latest_version, estimated_size, stats47_category,
     attribution, status
   ) VALUES (
     'X99', '新データセット名', 'New Dataset', 'land', 'point', 'national',
     'cc-by-4.0', '24', '~5MB', 'population',
     '国土交通省国土数値情報ダウンロードサイト', 'registered'
   );
   ```
   - Phase 3 で seed-ksj-catalog.ts により status='available' で既に投入されている場合は
     `UPDATE gis_datasets SET status='registered' WHERE data_id='X99'` のみで OK

2. **registry.ts (`KSJ_CODE_CONFIG`) にコード設定を追加**:
   - `dataId`, `downloadUrlPattern`, `geojsonDirInZip`, `propertyMap`, `simplifyOptions` (省略可)
   - URL パターンは https://jpksj-api.kmproj.com/datasets/{ID}.json で確認可能

3. **property-map.ts** にプロパティマッピングを追加(任意):
   - 属性定義の参照: https://nlftp.mlit.go.jp/ksj/gml/codelist/shape_property_table2.xlsx

4. パイプライン実行 (D1 が自動 UPDATE され status='imported' に):
   ```bash
   npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts {新DATA_ID}
   ```

## ライセンスと出典表示

公開ページで使用する場合は以下の出典表示が必要:

> 出典: 国土交通省「国土数値情報（{データ名}）」

- **CC BY 4.0 / 商用可**: stats47 で自由に利用可能
- **CC BY 4.0（一部制限）**: 個別に制限内容を確認
- **非商用**: R2 に保存するが、公開可否は別途判断
