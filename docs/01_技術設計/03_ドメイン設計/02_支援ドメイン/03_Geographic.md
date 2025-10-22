# Geographic ドメイン

## 概要

地理データの管理を担当するドメインです。GeoJSON/TopoJSONデータの取得・保存・キャッシュ、およびデータソース表記を管理します。

## ドメインの責務

- **地理形状データの管理**: GeoJSON/TopoJSONデータの取得・保存・キャッシュ
- **データソース表記管理**: 地理データの出典・ライセンス情報の管理
- **地理データの最適化**: 解像度別データ管理とパフォーマンス最適化
- **Single Source of Truth**: 地理データの唯一の情報源として機能

## ディレクトリ構造

```
src/lib/geographic/
├── shape/              # 地理形状サブドメイン
│   ├── model/
│   │   ├── GeoShape.ts
│   │   ├── BoundingBox.ts
│   │   ├── Centroid.ts
│   │   ├── TopoJsonData.ts
│   │   └── Resolution.ts
│   ├── service/
│   │   ├── GeoShapeService.ts
│   │   └── GeoshapeFetchService.ts
│   └── repositories/
│       └── GeoShapeRepository.ts
│
├── historical/         # 歴史的地理データサブドメイン
│   ├── model/
│   │   ├── HistoricalGeoShape.ts
│   │   ├── HistoricalArea.ts
│   │   ├── AreaChange.ts
│   │   └── ChangeType.ts
│   ├── service/
│   │   └── HistoricalGeoShapeService.ts
│   └── repositories/
│       └── HistoricalGeoShapeRepository.ts
│
└── attribution/        # データソース表記サブドメイン
    ├── model/
    │   ├── DataSourceAttribution.ts
    │   ├── DataSource.ts
    │   └── License.ts
    └── service/
        └── AttributionService.ts
```

## サブドメイン

### 1. Shape（地理形状）

**責務**: 地理形状データの取得・保存・キャッシュ

**主要エンティティ**:
- `GeoShape`: 地理形状データの集約ルート
- `TopoJsonData`: TopoJSON形式の地理データ
- `BoundingBox`: 地理データの境界ボックス
- `Centroid`: 地理データの重心座標

**主要値オブジェクト**:
- `Resolution`: 地理データの解像度
  - 具体例: `low`（低解像度）, `medium`（中解像度）, `high`（高解像度）, `full`（完全解像度）
  - 制約: 4段階の解像度レベル
  - 用途: パフォーマンス最適化、表示用途に応じたデータ選択

**主要サービス**:
- `GeoShapeService`: 地理形状データの取得・変換
- `GeoshapeFetchService`: 外部APIからの地理データ取得

### 2. Historical（歴史的地理データ）

**責務**: 歴史的な地理データの管理

**主要エンティティ**:
- `HistoricalGeoShape`: 歴史的な地理形状データ
- `HistoricalArea`: 歴史的な行政区画
- `AreaChange`: 行政区画の変更履歴

**主要値オブジェクト**:
- `ChangeType`: 変更タイプ
  - 具体例: `merge`（合併）, `split`（分割）, `rename`（名称変更）, `abolish`（廃止）
  - 制約: 定義済みの変更タイプのみ
  - 用途: 行政区画変更の分類

**主要サービス**:
- `HistoricalGeoShapeService`: 歴史的地理データの管理

### 3. Attribution（データソース表記）

**責務**: 地理データの出典・ライセンス情報の管理

**主要エンティティ**:
- `DataSourceAttribution`: データソース表記の集約ルート
- `DataSource`: データソース情報
- `License`: ライセンス情報

**主要サービス**:
- `AttributionService`: データソース表記の管理

## 関連ドメイン

- **Area ドメイン**: 地域コードによる地理データの検索
- **Ranking ドメイン**: 地域別統計データの分析

## 技術的特徴

- **Single Source of Truth**: 地理データの唯一の情報源
- **キャッシュ戦略**: 解像度別データの効率的な管理
- **外部API統合**: e-Stat API、国土地理院API等との連携
- **パフォーマンス最適化**: 必要に応じた解像度の動的選択
