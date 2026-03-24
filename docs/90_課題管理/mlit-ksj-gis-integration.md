# 国土数値情報（MLIT KSJ）全データ統合計画

## 概要

国土交通省「国土数値情報ダウンロードサービス」の全約100データセットをダウンロード → TopoJSON 変換 → R2 保存し、stats47 の GIS プラットフォームとして統合する。ライセンス種別に関わらず全データを整理し、段階的に機能化する。

**ソース**: https://nlftp.mlit.go.jp/ksj/index.html
**データ一覧**: https://nlftp.mlit.go.jp/ksj/gml/gml_datalist.html

## 背景

- stats47 は `packages/gis`（geoshape/mlit）+ `packages/visualization`（D3/Leaflet）で都道府県・市区町村 TopoJSON 描画基盤を保有
- 港湾統計・漁港で Leaflet ポイントマップ（CircleMarker）の実装パターンが確立済み
- テーマダッシュボードでコロプレスマップ + ドリルダウンが稼働中
- 国土数値情報を統合することで、ランキングデータを「地図で見る」体験に昇華できる

## ダウンロード自動化の技術調査結果

### ダウンロード方式

- **認証不要**: 直接 HTTP GET でzip取得可能。レート制限も確認されていない
- **公式 API は廃止**: 旧 API（`/ksj/api/`）は 404。手動 or スクリプトでダウンロード
- **サードパーティ API あり**: `https://jpksj-api.kmproj.com/` がデータセットメタデータを JSON で提供
  - `GET /datasets.json` → 全126データセット一覧
  - `GET /datasets/{ID}.json` → バージョン履歴
  - `GET /datasets/{ID}/{VERSION}.json` → ファイル URL・属性メタデータ

### ダウンロード URL パターン

```
https://nlftp.mlit.go.jp/ksj/gml/data/{DATA_ID}/{DATA_ID}-{YEAR}/{FILENAME}.zip
```

| データセット | URL例 | サイズ |
|---|---|---|
| N02（鉄道） | `.../N02/N02-22/N02-22_GML.zip` | 16.7MB |
| N03（行政区域・全国） | `.../N03/N03-2025/N03-20250101_GML.zip` | 603MB |
| N03（行政区域・県別） | `.../N03/N03-2025/N03-20250101_01_GML.zip` | 54.7MB |
| P04（医療機関・県別） | `.../P04/P04-20/P04-20_01_GML.zip` | 1.0MB |
| S12（駅別乗降客数） | `.../S12/S12-24/S12-24_GML.zip` | 4.2MB |

### zip 内構造

新しいデータセット（v3.x 以降）は GeoJSON 同梱:

```
UTF-8/
  {ID}-{YY}_*.geojson    ← これを使う
  {ID}-{YY}_*.shp/shx/dbf/prj
Shift-JIS/
  ...
```

古いデータセットは Shapefile のみ → ogr2ogr で GeoJSON 変換が必要。

### 既存ツール

| ツール | 言語 | 状態 |
|---|---|---|
| jpksj-api (KotobaMedia) | Web API | 稼働中。メタデータ取得に最適 |
| jpksj-to-sql (KotobaMedia) | Rust | 稼働中。ETag キャッシュ対応の最も完成されたツール |
| kokudosuuchi | R | アーカイブ済み（旧API依存） |
| ksj (PyPI) | Python | 旧API依存で非機能 |
| **npm パッケージは存在しない** | — | stats47 が自前実装する領域 |

## 全データセットカタログ（100データセット）

### ジオメトリタイプ分類

全データセットを GIS 表現形式で分類する。これが実装パターンの選択に直結する。

#### Type A: ポイントデータ（施設・地点） — 35件

既存パターン: `FishingPortLeafletMap` / `PortLeafletMap`（CircleMarker）

| Data ID | データ名 | 全国/県別 | ライセンス | 想定サイズ |
|---|---|---|---|---|
| P04 | 医療機関 | 県別 | CC BY 4.0 | ~1MB/県 |
| P29 | 学校 | 県別 | CC BY 4.0 | ~1MB/県 |
| P05 | 市町村役場等・公的集会施設 | 県別 | CC BY 4.0 | ~0.5MB/県 |
| P14 | 福祉施設 | 県別 | CC BY 4.0（一部制限） | ~0.5MB/県 |
| P11 | バス停留所 | 県別 | CC BY 4.0 | ~2MB/県 |
| P36 | 高速バス停留所 | 県別 | CC BY 4.0 | ~0.3MB/県 |
| S12 | 駅別乗降客数 | 全国 | CC BY 4.0 | ~4MB |
| L01 | 地価公示 | 全国/県別 | CC BY 4.0 | ~10MB |
| L02 | 都道府県地価調査 | 全国/県別 | CC BY 4.0 | ~8MB |
| C28 | 空港 | 全国 | 商用可 | ~0.5MB |
| N08 | 空港時系列 | 全国 | 商用可 | ~1MB |
| W01 | ダム | 全国 | 非商用 | ~1MB |
| W09 | 湖沼 | 全国 | 商用可 | ~2MB |
| C02 | 港湾 | 全国 | 非商用 | ~1MB |
| C09 | 漁港 | 全国 | 非商用 | ~1MB |
| P28 | 国・都道府県の機関 | 県別 | 非商用 | ~0.3MB/県 |
| P34 | 市区町村役場 | 県別 | 非商用 | ~0.2MB/県 |
| P02 | 公共施設 | 県別 | 非商用 | ~0.5MB/県 |
| P18 | 警察署 | 県別 | 非商用 | ~0.2MB/県 |
| P17 | 消防署 | 県別 | 非商用 | ~0.2MB/県 |
| P30 | 郵便局 | 県別 | 非商用 | ~0.5MB/県 |
| P27 | 文化施設 | 県別 | 非商用 | ~0.3MB/県 |
| P21 | 上水道関連施設 | 県別 | 非商用 | ~0.3MB/県 |
| P22 | 下水道関連施設 | 県別 | 非商用 | ~0.3MB/県 |
| P15 | 廃棄物処理施設 | 県別 | 非商用 | ~0.2MB/県 |
| P03 | 発電施設 | 全国 | 非商用 | ~1MB |
| P07 | 燃料給油所 | 県別 | 非商用 | ~0.5MB/県 |
| P16 | 研究機関 | 県別 | 非商用 | ~0.2MB/県 |
| P24 | 地場産業関連施設 | 全国 | 非商用 | ~0.5MB |
| P31 | 物流拠点 | 県別 | 非商用 | ~0.3MB/県 |
| P33 | 集客施設 | 県別 | 非商用 | ~0.3MB/県 |
| P35 | 道の駅 | 全国 | 非商用 | ~1MB |
| P12 | 観光資源 | 全国/県別 | 非商用 | ~2MB |
| P19 | 地域資源 | 県別 | 非商用 | ~0.5MB/県 |
| N11 | ヘリポート | 県別 | 非商用 | ~0.1MB/県 |

#### Type B: ラインデータ（道路・鉄道・河川） — 10件

既存パターン: なし（新規実装。GeoJSON LineString → Leaflet Polyline）

| Data ID | データ名 | 全国/県別 | ライセンス | 想定サイズ |
|---|---|---|---|---|
| N02 | 鉄道 | 全国 | CC BY 4.0 | ~17MB |
| N06 | 高速道路時系列 | 全国 | CC BY 4.0（一部制限） | ~10MB |
| N07 | バスルート | 県別 | CC BY 4.0 | ~5MB/県 |
| W05 | 河川 | 県別 | 非商用 | ~10MB/県 |
| C23 | 海岸線 | 県別 | 非商用 | ~5MB/県 |
| N10 | 緊急輸送道路 | 県別 | 非商用 | ~3MB/県 |
| N12 | 重要物流道路 | 県別 | 非商用 | ~3MB/県 |
| N09 | 定期旅客航路 | 全国 | 非商用 | ~2MB |
| S10a | 港湾間流通量・海上経路 | 全国 | 商用可 | ~3MB |
| A37 | 半島循環道路 | 県別 | 非商用 | ~1MB/県 |

#### Type C: ポリゴンデータ（行政区域・用途地域・災害区域） — 40件

既存パターン: `LeafletChoroplethMap` / `ChoroplethGeoJsonLayer`（塗り分け）

| Data ID | データ名 | 全国/県別 | ライセンス | 想定サイズ |
|---|---|---|---|---|
| N03 | 行政区域 | 全国/県別 | CC BY 4.0 | ~600MB(全国) |
| A09 | 都市地域 | 県別 | CC BY 4.0 | ~5MB/県 |
| A29 | 用途地域 | 県別 | CC BY 4.0（一部制限） | ~10MB/県 |
| A55 | 都市計画決定情報 | 県別 | CC BY 4.0 | ~20MB/県 |
| A31b | 洪水浸水想定区域（メッシュ） | メッシュ | CC BY 4.0 | ~20MB |
| A31a | 洪水浸水想定区域（河川） | 地方/県別 | CC BY 4.0 | ~10MB |
| A33 | 土砂災害警戒区域 | 県別 | CC BY 4.0（一部制限） | ~15MB/県 |
| A40 | 津波浸水想定 | 県別 | CC BY 4.0（一部制限） | ~10MB/県 |
| A49 | 高潮浸水想定区域 | 県別 | CC BY 4.0（一部制限） | ~5MB/県 |
| A48 | 災害危険区域 | 県別 | CC BY 4.0（一部制限） | ~3MB/県 |
| A46 | 地すべり防止区域 | 県別 | CC BY 4.0（一部制限） | ~5MB/県 |
| A47 | 急傾斜地崩壊危険区域 | 県別 | CC BY 4.0（一部制限） | ~5MB/県 |
| A52 | 砂防指定地 | 県別 | CC BY 4.0 | ~3MB/県 |
| A53 | 多段階浸水想定 | 地方整備局 | CC BY 4.0 | ~10MB |
| A51 | 雨水出水浸水想定区域 | 市区町村 | CC BY 4.0 | ~5MB |
| A54 | 大規模盛土造成地 | 県別 | CC BY 4.0 | ~5MB/県 |
| A50 | 立地適正化計画区域 | 県別 | CC BY 4.0（一部制限） | ~3MB/県 |
| A10 | 自然公園地域 | 県別 | CC BY 4.0（一部制限） | ~5MB/県 |
| A11 | 自然保全地域 | 県別 | CC BY 4.0（一部制限） | ~2MB/県 |
| A13 | 森林地域 | 県別 | CC BY 4.0（一部制限） | ~10MB/県 |
| A45 | 国有林野 | 県別 | CC BY 4.0 | ~5MB/県 |
| A12 | 農業地域 | 県別 | CC BY 4.0（一部制限） | ~5MB/県 |
| A16 | DID人口集中地区 | 県別 | 商用可 | ~5MB/県 |
| A17 | 過疎地域 | 県別 | 商用可 | ~3MB/県 |
| A22 | 豪雪地帯 | 県別 | 商用可 | ~3MB/県 |
| A24 | 振興山村 | 県別 | 商用可 | ~2MB/県 |
| A25 | 特定農山村地域 | 県別 | 商用可 | ~2MB/県 |
| A18 | 半島振興対策実施地域 | 県別 | 商用可 | ~2MB/県 |
| A19 | 離島振興対策実施地域 | 県別 | 商用可 | ~1MB/県 |
| A23 | 特殊土壌地帯 | 県別 | 商用可 | ~2MB/県 |
| A03 | 三大都市圏計画区域 | 関東/中部/近畿 | CC BY 4.0 | ~5MB |
| A38 | 医療圏 | 全国/県別 | CC BY 4.0 | ~3MB |
| A27 | 小学校区 | 県別 | CC BY 4.0（一部制限） | ~5MB/県 |
| A32 | 中学校区 | 県別 | CC BY 4.0（一部制限） | ~3MB/県 |
| A42 | 歴史的風土保存区域 | 全国 | CC BY 4.0 | ~1MB |
| A43 | 伝統的建造物群保存地区 | 全国 | CC BY 4.0 | ~1MB |
| A44 | 歴史的風致維持向上計画 | 全国 | CC BY 4.0 | ~1MB |
| A35a | 景観計画区域 | 県別 | 非商用 | ~3MB/県 |
| A35b | 景観地区・準景観地区 | 県別 | 非商用 | ~1MB/県 |
| A39 | 密集市街地 | 全国 | 非商用 | ~2MB |
| P13 | 都市公園 | 県別 | 非商用 | ~3MB/県 |
| P26 | ニュータウン | 県別 | 非商用 | ~1MB/県 |
| A15 | 鳥獣保護区 | 県別 | 非商用 | ~5MB/県 |
| P20 | 避難施設 | 県別 | 非商用 | ~0.5MB/県 |
| L05 | 工業用地 | 県別 | 非商用 | ~2MB/県 |

#### Type D: メッシュデータ（統計・気候・標高） — 15件

既存パターン: なし（新規実装。グリッドセル → Canvas/SVG ヒートマップ）

| Data ID | データ名 | 範囲 | ライセンス | 想定サイズ |
|---|---|---|---|---|
| mesh1000r6 | 1kmメッシュ将来推計人口（R6） | 全国/県別 | CC BY 4.0 | ~50MB(全国) |
| mesh500r6 | 500mメッシュ将来推計人口（R6） | 全国/県別 | CC BY 4.0 | ~200MB(全国) |
| mesh250r6 | 250mメッシュ将来推計人口（R6） | 全国/県別 | CC BY 4.0 | ~500MB(全国) |
| mesh1000h30 | 1kmメッシュ将来推計人口（H30） | 県別 | CC BY 4.0 | ~50MB |
| mesh500h30 | 500mメッシュ将来推計人口（H30） | 県別 | CC BY 4.0 | ~200MB |
| L03-a | 土地利用3次メッシュ | メッシュ | CC BY 4.0 | ~30MB |
| L03-b | 土地利用細分メッシュ | メッシュ | CC BY 4.0 | ~100MB |
| L03-b-u | 都市地域土地利用細分メッシュ | メッシュ | CC BY 4.0 | ~80MB |
| L03-b-c | 土地利用詳細メッシュ | メッシュ | CC BY 4.0 | ~60MB |
| L03-b_r | 土地利用細分メッシュ（ラスタ版） | メッシュ | 商用可 | ~50MB |
| G04-a | 標高・傾斜度3次メッシュ | メッシュ | 商用可 | ~100MB |
| G04-c | 標高・傾斜度4次メッシュ | メッシュ | 商用可 | ~300MB |
| G04-d | 標高・傾斜度5次メッシュ | メッシュ | 商用可 | ~800MB |
| G02 | 平年値（気候）メッシュ | メッシュ | 非商用 | ~50MB |
| A30a5 | 土砂災害・雪崩メッシュ | メッシュ | 商用可 | ~30MB |
| G08 | 低位地帯 | 県別 | 商用可 | ~3MB/県 |
| N04 | 道路密度メッシュ | メッシュ | 非商用 | ~20MB |
| W07 | 流域メッシュ | メッシュ | 非商用 | ~10MB |
| P09 | 宿泊容量メッシュ | メッシュ | 非商用 | ~10MB |

#### Type E: その他（統計・時系列・フロー） — 10件

| Data ID | データ名 | 範囲 | ライセンス |
|---|---|---|---|
| N05 | 鉄道時系列 | 全国 | 非商用 |
| S10b | 空港間流通量 | 全国 | 非商用 |
| S05-a | パーソントリップ発生・集中量 | 圏域 | 非商用 |
| S05-b | パーソントリップOD量 | 圏域 | 非商用 |
| S05-c | 交通流動量_駅別乗降数 | 圏域 | 非商用 |
| S05-d | 貨物旅客地域流動量 | 全国 | 商用可 |
| A19s | 離島統計情報 | 県別 | 非商用 |
| A20/A20s | 奄美群島・統計 | 鹿児島 | 非商用 |
| A21/A21s | 小笠原諸島・統計 | 東京 | 非商用 |
| A18s-a | 半島統計情報 | 全国 | 非商用 |
| A22s | 豪雪地帯統計情報 | 県別 | 非商用 |
| A22-m | 豪雪地帯気象データ | 県別 | 非商用 |
| A30b | 竜巻等の突風 | 全国 | 非商用 |
| P32 | 都道府県指定文化財 | 県別 | 非商用 |
| A34 | 世界文化遺産 | 全国 | 非商用 |
| A28 | 世界自然遺産 | 全国 | 非商用 |
| A35c | 景観重要建造物・樹木 | 県別 | 非商用 |
| P23 | 海岸保全施設 | 県別 | 非商用 |

## 技術アーキテクチャ

### 全体構成

```
[Phase 0: パイプライン構築]
  jpksj-api → メタデータ取得 → データセット定義ファイル生成
  MLIT zip → 解凍 → GeoJSON抽出(UTF-8) → topojson-simplify → R2保存

[Phase 1: データ基盤]
  R2: gis/mlit-ksj/{dataId}/{version}/*.topojson
  D1: ksj_datasets / ksj_layers テーブル（メタデータ・レイヤー定義）

[Phase 2: 表示基盤]
  packages/gis/src/mlit-ksj/ — データ取得・変換ロジック
  packages/visualization/ — 新レンダラ追加（Line/Mesh 対応）
  apps/web/src/features/gis-explorer/ — 統合 GIS ビューア

[Phase 3: 機能統合]
  各ランキングページにレイヤーオーバーレイ
  テーマダッシュボードに GIS レイヤー切替
  独立 GIS ページ群（防災マップ、施設マップ等）
```

### Phase 0: データパイプライン構築

#### 0-1. packages/gis への mlit-ksj モジュール追加

```
packages/gis/
├── src/
│   ├── geoshape/          # 既存
│   ├── mlit/              # 既存
│   └── mlit-ksj/          # 新規
│       ├── index.ts
│       ├── types.ts           # KsjDataset, KsjLayer, KsjGeometryType 型定義
│       ├── registry.ts        # 全100データセットの定義（ID・名前・ジオメトリ型・ライセンス・属性マッピング）
│       ├── jpksj-api.ts       # jpksj-api.kmproj.com からメタデータ取得
│       ├── downloader.ts      # zip ダウンロード・解凍・GeoJSON 抽出
│       ├── converter.ts       # GeoJSON → TopoJSON 変換（simplify パラメータはデータ型別）
│       ├── property-map.ts    # KSJ プロパティ名（P04_001等）→ 人間可読名へのマッピング
│       └── r2-path.ts         # R2 パス構築
└── package.json               # 追加依存: unzipper, node-fetch (or undici)
```

#### 0-2. データセット定義（registry.ts）

```typescript
interface KsjDatasetDef {
  dataId: string;           // "N02", "P04", ...
  name: string;             // "鉄道", "医療機関", ...
  nameEn: string;           // "Railways", "Medical Facilities"
  category: KsjCategory;    // "land" | "policy" | "facility" | "transport" | "statistics"
  subcategory: string;      // "水域", "行政地域", ...
  geometryType: "point" | "line" | "polygon" | "mesh" | "mixed";
  coverage: "national" | "prefecture" | "mesh" | "region";
  license: "cc-by-4.0" | "cc-by-4.0-partial" | "commercial-ok" | "non-commercial";
  latestVersion: string;    // "2024", "20250101", etc.
  downloadPattern: string;  // URL テンプレート
  propertyMap: Record<string, string>;  // "P04_001" → "facilityName"
  simplifyOptions: {
    quantize: number;       // データ型別: point=1e6, line=1e5, polygon=1e5, mesh=1e4
    simplify: number;       // point=0, line=1e-7, polygon=1e-7, mesh=1e-6
  };
  stats47Category?: string; // stats47 カテゴリキーとの紐付け
  estimatedSize: string;    // "~1MB/県", "~17MB"
}
```

#### 0-3. 変換パイプライン

```
入力: KsjDatasetDef + (全国 or 都道府県コード)
  ↓
1. jpksj-api からダウンロード URL を解決
  ↓
2. zip をダウンロード → /tmp/ に解凍
  ↓
3. UTF-8 の .geojson を検出（なければ .shp を ogr2ogr で変換）
  ↓
4. GeoJSON を読み込み、プロパティ名を正規化（property-map.ts）
  ↓
5. topojson-server (geo2topo) → topojson-simplify (presimplify + simplify + quantize)
   ※ パラメータはデータセット定義の simplifyOptions を使用
  ↓
6. .local/r2/gis/mlit-ksj/{dataId}/{version}/{filename}.topojson に保存
  ↓
7. _meta.json を更新（データセットID・バージョン・ファイル数・総サイズ・変換日）
```

**Shapefile 変換が必要な場合のフォールバック:**

```
brew install gdal  # ogr2ogr が必要
ogr2ogr -f GeoJSON -t_srs EPSG:4326 output.geojson input.shp
```

#### 0-4. 実行スキル

新スキル `/fetch-mlit-ksj` を作成:

```
/fetch-mlit-ksj N02              # 単一データセット
/fetch-mlit-ksj P04 --pref 13    # 東京のみ
/fetch-mlit-ksj --all            # 全データセット（注意: 大容量）
/fetch-mlit-ksj --category transport  # カテゴリ単位
/fetch-mlit-ksj --list           # ダウンロード済み/未済の一覧
```

### R2 保存構造

```
.local/r2/gis/
├── mlit/                         # 既存: 行政区域（geoshape → TopoJSON）
│   └── 20240101/
│       ├── prefecture.topojson
│       ├── jp_city.topojson
│       └── {01-47}/
└── mlit-ksj/                     # 新規: 国土数値情報 全データ
    ├── _meta.json                # 全データセットのインデックス
    │
    ├── # === Type A: ポイントデータ ===
    ├── P04/                      # 医療機関
    │   └── 2020/
    │       ├── _meta.json        # バージョン情報・属性定義
    │       ├── 01.topojson       # 北海道
    │       ├── 02.topojson       # 青森
    │       └── ...47.topojson    # 沖縄
    ├── S12/                      # 駅別乗降客数
    │   └── 2024/
    │       └── national.topojson
    ├── L01/                      # 地価公示
    │   └── 2026/
    │       └── national.topojson
    │
    ├── # === Type B: ラインデータ ===
    ├── N02/                      # 鉄道
    │   └── 2022/
    │       └── national.topojson
    ├── N07/                      # バスルート
    │   └── 2022/
    │       ├── 01.topojson
    │       └── ...
    │
    ├── # === Type C: ポリゴンデータ ===
    ├── A29/                      # 用途地域
    │   └── 2024/
    │       ├── 01.topojson
    │       └── ...
    ├── A31b/                     # 洪水浸水想定
    │   └── 2024/
    │       └── national.topojson
    │
    ├── # === Type D: メッシュデータ ===
    ├── mesh1000r6/               # 将来推計人口1km
    │   └── 2024/
    │       ├── 01.topojson       # 県別分割（メッシュは巨大なので）
    │       └── ...
    └── L03-a/                    # 土地利用メッシュ
        └── 2021/
            ├── 5339.topojson     # メッシュ番号単位
            └── ...
```

**R2 容量見積もり:**

| データ型 | 生GeoJSON | TopoJSON変換後 | ファイル数 |
|---|---|---|---|
| Type A ポイント（35種） | ~5GB | ~500MB | ~1,200 |
| Type B ライン（10種） | ~3GB | ~300MB | ~300 |
| Type C ポリゴン（40種） | ~30GB | ~3GB | ~1,500 |
| Type D メッシュ（15種） | ~20GB | ~2GB | ~800 |
| **合計** | **~58GB** | **~6GB** | **~3,800** |

### Phase 1: DB スキーマ（メタデータ管理）

#### ksj_datasets テーブル

```sql
CREATE TABLE ksj_datasets (
  data_id TEXT PRIMARY KEY,              -- "N02", "P04"
  name TEXT NOT NULL,                    -- "鉄道"
  name_en TEXT NOT NULL,                 -- "Railways"
  category TEXT NOT NULL,                -- "transport"
  subcategory TEXT NOT NULL,             -- "鉄道"
  geometry_type TEXT NOT NULL,           -- "point" | "line" | "polygon" | "mesh"
  coverage TEXT NOT NULL,                -- "national" | "prefecture" | "mesh"
  license TEXT NOT NULL,                 -- "cc-by-4.0" | "non-commercial" etc.
  latest_version TEXT,                   -- "2024"
  total_files INTEGER DEFAULT 0,
  total_size_bytes INTEGER DEFAULT 0,
  stats47_category TEXT,                 -- stats47 カテゴリキーとの紐付け
  downloaded_at TEXT,                    -- 最終ダウンロード日時
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### ksj_layers テーブル（GIS ビューア用レイヤー定義）

```sql
CREATE TABLE ksj_layers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  layer_key TEXT UNIQUE NOT NULL,         -- "railway", "medical-facilities"
  name TEXT NOT NULL,                     -- "鉄道路線"
  description TEXT,
  icon TEXT,                              -- Lucide icon name
  datasets TEXT NOT NULL,                 -- JSON: ["N02", "S12"]（複合レイヤーに対応）
  geometry_type TEXT NOT NULL,
  render_config TEXT NOT NULL,            -- JSON: 色・サイズ・フィルタ等の描画設定
  category TEXT NOT NULL,                 -- "transport" | "disaster" | "facility" etc.
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Phase 2: 表示基盤

#### 2-1. packages/visualization への追加

```
packages/visualization/src/leaflet/
├── components/
│   ├── LeafletChoroplethMap.tsx          # 既存: ポリゴン塗り分け
│   ├── ChoroplethGeoJsonLayer.tsx        # 既存: GeoJSON レイヤー
│   ├── KsjPointLayer.tsx                 # 新規: ポイントデータ汎用レイヤー
│   ├── KsjLineLayer.tsx                  # 新規: ラインデータ汎用レイヤー
│   ├── KsjPolygonLayer.tsx              # 新規: ポリゴンオーバーレイレイヤー
│   ├── KsjMeshLayer.tsx                 # 新規: メッシュヒートマップレイヤー
│   └── KsjLayerSwitcher.tsx             # 新規: レイヤー表示切替パネル
└── hooks/
    ├── useTopoJsonToGeoJson.ts           # 既存
    └── useKsjLayer.ts                    # 新規: KSJ レイヤーのロード・キャッシュ
```

#### 2-2. apps/web の新規 feature

```
apps/web/src/features/
├── gis-explorer/                     # 統合 GIS ビューア（メイン）
│   ├── components/
│   │   ├── GisExplorerPage.tsx           # 全画面地図 + サイドパネル
│   │   ├── LayerPanel.tsx                # レイヤー一覧・切替パネル
│   │   ├── LayerLegend.tsx               # 凡例
│   │   ├── FeaturePopup.tsx              # 地物クリック時の詳細ポップアップ
│   │   └── GisExplorerMap.tsx            # Leaflet マップ本体
│   ├── lib/
│   │   ├── gis-explorer-loader.ts        # ksj_layers からレイヤー定義をロード
│   │   └── layer-data-fetcher.ts         # R2 から TopoJSON をオンデマンド取得
│   └── types/
│       └── index.ts
│
├── disaster-map/                     # 防災マップ（専用ページ）
│   ├── components/
│   │   ├── DisasterMapPage.tsx
│   │   └── DisasterMapClient.tsx
│   └── lib/
│       └── disaster-layers.ts            # 洪水(A31) + 土砂(A33) + 津波(A40) + 高潮(A49) の統合
│
├── facility-map/                     # 施設マップ（専用ページ）
│   ├── components/
│   │   ├── FacilityMapPage.tsx
│   │   └── FacilityMapClient.tsx
│   └── lib/
│       └── facility-layers.ts            # 医療(P04) + 学校(P29) + 消防(P17) + 警察(P18) 等
│
└── transport-map/                    # 交通マップ（専用ページ）
    ├── components/
    │   ├── TransportMapPage.tsx
    │   └── TransportMapClient.tsx
    └── lib/
        └── transport-layers.ts           # 鉄道(N02) + バス(N07) + 空港(C28) + 駅(S12)
```

#### 2-3. ページルーティング

```
/gis                    # GIS Explorer（全レイヤー閲覧可能な統合ビューア）
/gis/disaster           # 防災マップ
/gis/facilities         # 施設マップ
/gis/transport          # 交通マップ
/gis/land-use           # 土地利用マップ
/gis/population         # 人口メッシュマップ
```

### Phase 3: 既存機能との統合

#### 3-1. ランキングページへのレイヤーオーバーレイ

既存のランキング詳細ページ（`/ranking/prefecture/{key}`）の地図に、関連 GIS レイヤーを追加表示:

| ランキングカテゴリ | 追加レイヤー |
|---|---|
| socialsecurity（社会保障） | P04 医療機関, P14 福祉施設, A38 医療圏 |
| educationsports（教育） | P29 学校, A27 小学校区, A32 中学校区 |
| safetyenvironment（安全・環境） | A31 洪水, A33 土砂, A40 津波, P20 避難施設 |
| infrastructure（社会基盤） | N02 鉄道, N07 バス, P21 上水道, P22 下水道 |
| economy（経済） | L01 地価公示, A29 用途地域, A16 DID |
| population（人口） | mesh1000r6 将来推計人口, A17 過疎地域 |
| tourism（観光） | P12 観光資源, P35 道の駅, A34 世界文化遺産 |
| agriculture（農業） | A12 農業地域, A13 森林地域 |

#### 3-2. テーマダッシュボードへの統合

既存の `ThemeLeafletMap` に KSJ レイヤー切替ボタンを追加。ランキングのコロプレスマップに施設分布ポイントを重ねて表示。

#### 3-3. ブログ記事用チャート

`/generate-article-charts` スキルで KSJ データを活用した地図チャートを生成可能に。

## 実装フェーズ（詳細スケジュール）

### Phase 0: パイプライン構築（基盤）

| # | タスク | 依存 | 成果物 |
|---|---|---|---|
| 0-1 | `packages/gis/src/mlit-ksj/` モジュール作成（types, registry） | — | 全100データセット定義 |
| 0-2 | jpksj-api クライアント実装 | 0-1 | メタデータ取得 |
| 0-3 | ダウンローダー実装（zip → GeoJSON 抽出） | 0-2 | downloader.ts |
| 0-4 | コンバーター実装（GeoJSON → TopoJSON） | 0-1 | converter.ts |
| 0-5 | プロパティマッピング（KSJ 属性名 → 人間可読名） | 0-1 | property-map.ts |
| 0-6 | `/fetch-mlit-ksj` スキル作成 | 0-3, 0-4 | スキル定義 |
| 0-7 | PoC: N02（鉄道）を1件通して変換・保存 | 0-6 | 検証完了 |

### Phase 1: 全データ取得・R2 整理

| # | タスク | 依存 | 成果物 |
|---|---|---|---|
| 1-1 | Type A ポイントデータ全取得（35種） | 0-7 | ~500MB in R2 |
| 1-2 | Type B ラインデータ全取得（10種） | 0-7 | ~300MB in R2 |
| 1-3 | Type C ポリゴンデータ全取得（40種） | 0-7 | ~3GB in R2 |
| 1-4 | Type D メッシュデータ全取得（15種） | 0-7 | ~2GB in R2 |
| 1-5 | DB スキーマ作成（ksj_datasets / ksj_layers） | — | マイグレーション |
| 1-6 | メタデータ DB 登録 | 1-1〜1-4, 1-5 | 100レコード |
| 1-7 | `_meta.json` + データセット品質検証 | 1-1〜1-4 | 破損・空ファイル検出 |

### Phase 2: 表示基盤構築

| # | タスク | 依存 | 成果物 |
|---|---|---|---|
| 2-1 | KsjPointLayer コンポーネント | 1-1 | ポイント汎用レイヤー |
| 2-2 | KsjLineLayer コンポーネント | 1-2 | ライン汎用レイヤー |
| 2-3 | KsjPolygonLayer コンポーネント | 1-3 | ポリゴン汎用レイヤー |
| 2-4 | KsjMeshLayer コンポーネント | 1-4 | メッシュヒートマップ |
| 2-5 | KsjLayerSwitcher + useKsjLayer | 2-1〜2-4 | レイヤー切替 UI |
| 2-6 | GIS Explorer ページ（`/gis`） | 2-5 | 統合ビューア |
| 2-7 | レイヤー定義（ksj_layers テーブル投入） | 1-6, 2-5 | 表示可能レイヤー |

### Phase 3: 専用ページ・既存統合

| # | タスク | 依存 | 成果物 |
|---|---|---|---|
| 3-1 | 防災マップ（`/gis/disaster`） | 2-3, 2-5 | 洪水+土砂+津波+高潮 統合 |
| 3-2 | 施設マップ（`/gis/facilities`） | 2-1, 2-5 | 医療+学校+消防+警察 統合 |
| 3-3 | 交通マップ（`/gis/transport`） | 2-1, 2-2, 2-5 | 鉄道+バス+空港+駅 統合 |
| 3-4 | ランキングページにレイヤーオーバーレイ追加 | 2-5 | 関連レイヤーの自動表示 |
| 3-5 | テーマダッシュボードに KSJ レイヤー統合 | 2-5 | ThemeLeafletMap 拡張 |
| 3-6 | 人口メッシュマップ（`/gis/population`） | 2-4 | 将来推計人口可視化 |
| 3-7 | 土地利用マップ（`/gis/land-use`） | 2-3, 2-4 | 土地利用メッシュ+区域 |

## ライセンス対応方針

全データを R2 に取り込むが、ライセンス種別に応じて表示時に対応する:

| ライセンス | R2 保存 | 公開サイト表示 | 出典表示 |
|---|---|---|---|
| CC BY 4.0 | ○ | ○ | 「出典: 国土交通省国土数値情報」 |
| CC BY 4.0（一部制限） | ○ | ○（制限内容を個別確認） | 同上 + 制限事項注記 |
| 商用可 | ○ | ○ | 「出典: 国土交通省国土数値情報」 |
| 非商用 | ○ | 要判断（※） | 同上 |

**※ 非商用データについて:**
- stats47 が非商用（個人プロジェクト・教育目的）であれば利用可能
- 収益化（AdSense 等）との整合性は別途確認が必要
- R2 には全データを保存しておき、公開可否は `ksj_datasets.is_active` フラグで制御

## 留意事項

1. **ファイルサイズ管理**: メッシュデータ（Type D）は巨大。県別分割 + 適切な simplify で Web 配信に適したサイズに
2. **座標系**: GeoJSON は通常 WGS84（EPSG:4326）だが、一部 JGD2011 のものがある。ogr2ogr で `-t_srs EPSG:4326` を指定
3. **属性コード**: KSJ のプロパティ名は `P04_001` のようなコード。`shape_property_table2.xlsx` を参照して property-map.ts でマッピング
4. **キャッシュ戦略**: TopoJSON ファイルは R2 → CDN でキャッシュ。レイヤーの遅延ロード（ユーザーが ON にした時に初めて fetch）
5. **パフォーマンス**: バス停留所（P11）は全国で数十万件。県別分割 + クラスタリング（Leaflet.markerCluster）が必須
6. **GDAL 依存**: 古いデータセットで GeoJSON 同梱なしの場合のみ必要。`brew install gdal`
7. **出典表示**: 全ページのフッターまたは地図内に「出典: 国土交通省国土数値情報ダウンロードサイト」を表示

## 属性情報リファレンス

- 全データセットの属性定義: https://nlftp.mlit.go.jp/ksj/gml/codelist/shape_property_table2.xlsx
- データ一覧 PDF: https://nlftp.mlit.go.jp/ksj/gml/datalist/ksjdata_datalist.pdf
- R7年度公開スケジュール: https://nlftp.mlit.go.jp/ksj/pdf/R7_release.pdf
- サードパーティ API: https://jpksj-api.kmproj.com/datasets.json
