# MLIT KSJ（国土数値情報）モジュール

国土交通省「国土数値情報ダウンロードサービス」の GIS データを、ダウンロード → TopoJSON 変換 → R2 保存するパイプライン。

- **ソース**: https://nlftp.mlit.go.jp/ksj/index.html
- **スキル**: `/fetch-mlit-ksj`

## 使い方

```bash
# データセット一覧
npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts --list

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

## 登録済みデータセット（42件）

### 国土（水・土地）

| ID | データ名 | 型 | 範囲 | ライセンス | stats47カテゴリ |
|---|---|---|---|---|---|
| W09 | 湖沼 | polygon | national | 商用可 | landweather |
| W01 | ダム | point | national | 非商用 | — |
| W05 | 河川 | line | prefecture | 非商用 | — |
| C23 | 海岸線 | line | prefecture | 非商用 | — |
| G04-a | 標高・傾斜度3次メッシュ | mesh | mesh | 商用可 | — |
| L03-a | 土地利用3次メッシュ | mesh | mesh | CC BY 4.0 | — |
| L01 | 地価公示 | point | national | CC BY 4.0 | economy |
| L02 | 都道府県地価調査 | point | national | CC BY 4.0 | economy |
| A13 | 森林地域 | polygon | prefecture | CC BY 4.0（一部制限） | agriculture |
| A12 | 農業地域 | polygon | prefecture | CC BY 4.0（一部制限） | agriculture |

### 政策区域

| ID | データ名 | 型 | 範囲 | ライセンス | stats47カテゴリ |
|---|---|---|---|---|---|
| N03 | 行政区域 | polygon | national | CC BY 4.0 | — |
| A16 | DID人口集中地区 | polygon | national | 商用可 | population |
| A38 | 医療圏 | polygon | national | CC BY 4.0 | socialsecurity |
| A29 | 用途地域 | polygon | prefecture | CC BY 4.0（一部制限） | infrastructure |
| A27 | 小学校区 | polygon | prefecture | CC BY 4.0（一部制限） | educationsports |
| A32 | 中学校区 | polygon | prefecture | CC BY 4.0（一部制限） | educationsports |
| A17 | 過疎地域 | polygon | prefecture | 商用可 | population |
| A22 | 豪雪地帯 | polygon | prefecture | 商用可 | landweather |

### 災害・防災

| ID | データ名 | 型 | 範囲 | ライセンス | stats47カテゴリ |
|---|---|---|---|---|---|
| A31b | 洪水浸水想定区域 | polygon | mesh | CC BY 4.0 | safetyenvironment |
| A33 | 土砂災害警戒区域 | polygon | prefecture | CC BY 4.0（一部制限） | safetyenvironment |
| A40 | 津波浸水想定 | polygon | prefecture | CC BY 4.0（一部制限） | safetyenvironment |
| A10 | 自然公園地域 | polygon | prefecture | CC BY 4.0（一部制限） | safetyenvironment |

### 施設

| ID | データ名 | 型 | 範囲 | ライセンス | stats47カテゴリ |
|---|---|---|---|---|---|
| P04 | 医療機関 | point | prefecture | CC BY 4.0 | socialsecurity |
| P29 | 学校 | point | prefecture | CC BY 4.0 | educationsports |
| P05 | 市町村役場等・公的集会施設 | point | prefecture | CC BY 4.0 | — |
| P14 | 福祉施設 | point | prefecture | CC BY 4.0（一部制限） | socialsecurity |
| P11 | バス停留所 | point | prefecture | CC BY 4.0 | infrastructure |
| P36 | 高速バス停留所 | point | prefecture | CC BY 4.0 | infrastructure |
| P17 | 消防署 | point | prefecture | 非商用 | safetyenvironment |
| P18 | 警察署 | point | prefecture | 非商用 | safetyenvironment |
| P03 | 発電施設 | point | national | 非商用 | energy |
| P35 | 道の駅 | point | national | 非商用 | tourism |
| P12 | 観光資源 | point | national | 非商用 | tourism |
| P13 | 都市公園 | polygon | prefecture | 非商用 | infrastructure |

### 交通

| ID | データ名 | 型 | 範囲 | ライセンス | stats47カテゴリ |
|---|---|---|---|---|---|
| N02 | 鉄道 | line | national | CC BY 4.0 | infrastructure |
| S12 | 駅別乗降客数 | point | national | CC BY 4.0 | infrastructure |
| N06 | 高速道路時系列 | line | national | CC BY 4.0（一部制限） | infrastructure |
| N07 | バスルート | line | prefecture | CC BY 4.0 | infrastructure |
| C28 | 空港 | point | national | 商用可 | infrastructure |
| C02 | 港湾 | point | national | 非商用 | infrastructure |
| C09 | 漁港 | point | national | 非商用 | agriculture |

### 各種統計

| ID | データ名 | 型 | 範囲 | ライセンス | stats47カテゴリ |
|---|---|---|---|---|---|
| mesh1000r6 | 1kmメッシュ将来推計人口(R6) | mesh | prefecture | CC BY 4.0 | population |

## ダウンロード済みデータ

| ID | データ名 | バージョン | ファイル数 | サイズ | 主な内容 |
|---|---|---|---|---|---|
| N02 | 鉄道 | 22, 24 | 4 | 16MB | 路線区間 21,932 + 駅 10,235 |
| S12 | 駅別乗降客数 | 24 | 1 | 9.6MB | 10,531 駅 |
| N06 | 高速道路 | 20 | 2 | 1MB | 区間 1,420 + JCT 2,388 |
| C28 | 空港 | 07 | 4 | 500KB | 100 空港（区域・基準点・ターミナル・調査） |
| C09 | 漁港 | 06 | 2 | 1.4MB | 2,931 漁港 |
| W01 | ダム | 14 | 1 | 956KB | 2,749 ダム |
| W09 | 湖沼 | 05 | 1 | 316KB | 556 湖沼 |
| P03 | 発電施設 | 13 | 10 | 5.7MB | 太陽光 10,654 + 水力 698 + 火力 390 + 風力 417 + 原子力 68 + ... |
| P12 | 観光資源 | 14 | 125 | 8.3MB | 全国観光地（都道府県別 + 種別別） |
| P35 | 道の駅 | 18 | 1 | 696KB | 1,145 施設 |
| L01 | 地価公示 | 25 | 1 | 75MB | 25,563 地点（属性が多くサイズ大） |
| L02 | 都道府県地価調査 | 25 | 1 | 59MB | 21,431 地点 |

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
├── types.ts           # KsjDatasetDef, KsjPipelineOptions 等の型定義
├── registry.ts        # 全42データセットの定義（ID・URL・ジオメトリ型・ライセンス等）
├── property-map.ts    # KSJ 属性コード → 人間可読名マッピング（N02_001 → railwayType）
├── r2-path.ts         # R2 保存パス構築
├── downloader.ts      # zip ダウンロード・GeoJSON/Shapefile 抽出
├── converter.ts       # GeoJSON → TopoJSON 変換（簡略化含む）
├── pipeline.ts        # オーケストレーター
├── index.ts           # Public API エクスポート
├── adapters/
│   └── fetch-ksj-from-local.ts  # ローカル R2 から TopoJSON 読み込み
└── scripts/
    └── run-pipeline.ts          # CLI エントリポイント
```

## 新しいデータセットの追加方法

1. **registry.ts** にデータセット定義を追加:
   - `dataId`, `name`, `downloadUrlPattern`, `geojsonDirInZip`, `geometryType`, `simplifyOptions` 等
   - URL パターンは https://jpksj-api.kmproj.com/datasets/{ID}.json で確認可能

2. **property-map.ts** にプロパティマッピングを追加（任意）:
   - 属性定義の参照: https://nlftp.mlit.go.jp/ksj/gml/codelist/shape_property_table2.xlsx

3. パイプライン実行:
   ```bash
   npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts {新DATA_ID}
   ```

## ライセンスと出典表示

公開ページで使用する場合は以下の出典表示が必要:

> 出典: 国土交通省「国土数値情報（{データ名}）」

- **CC BY 4.0 / 商用可**: stats47 で自由に利用可能
- **CC BY 4.0（一部制限）**: 個別に制限内容を確認
- **非商用**: R2 に保存するが、公開可否は別途判断
