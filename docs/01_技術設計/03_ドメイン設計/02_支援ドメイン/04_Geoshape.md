# Geoshape ドメイン

## 概要

Geoshape リポジトリの歴史的行政区域データセット β 版の管理を担当するドメインです。TopoJSON データの取得・キャッシュ・提供を行います。

## ドメインの責務

- **歴史的行政区域 TopoJSON データの取得**: Geoshape API からのデータ取得
- **R2 ストレージへのキャッシュ管理**: 効率的なデータ配信のためのキャッシュ戦略
- **解像度別データ管理**: low/medium/high/full の解像度レベル管理
- **データソース表記管理**: CODH、CC BY 4.0 ライセンスの適切な表記

## ディレクトリ構造

```
src/lib/geoshape/
├── model/
│   ├── GeoshapeData.ts          # TopoJSONデータの集約ルート
│   ├── HistoricalArea.ts         # 歴史的行政区域
│   ├── Resolution.ts             # 解像度（Value Object）
│   ├── BoundingBox.ts            # 境界ボックス
│   └── DataAttribution.ts       # データ出典情報
├── service/
│   ├── GeoshapeService.ts        # ドメインサービス
│   ├── GeoshapeFetchService.ts   # API取得サービス
│   └── GeoshapeCacheService.ts   # キャッシュサービス
└── repository/
    └── GeoshapeRepository.ts     # R2ストレージアクセス
```

## 主要エンティティ

### GeoshapeData

TopoJSON データの集約ルートエンティティ

**プロパティ**:

- `id`: データセット ID
- `year`: 対象年度（YYYYMMDD 形式）
- `level`: 行政レベル（prefecture/municipality）
- `resolution`: 解像度レベル
- `topoJsonData`: TopoJSON 形式の地理データ
- `metadata`: メタデータ（取得日時、データソース等）

**ビジネスメソッド**:

- `getAreaById(areaId: string)`: 指定 ID の行政区域を取得
- `getAreasByYear(year: string)`: 指定年度の全行政区域を取得
- `getBoundingBox()`: データ全体の境界ボックスを取得

### HistoricalArea

歴史的行政区域エンティティ

**プロパティ**:

- `id`: 行政区域 ID
- `name`: 行政区域名称
- `year`: 対象年度
- `prefectureCode`: 都道府県コード
- `municipalityCode`: 市区町村コード
- `geometry`: 境界データ（TopoJSON 形式）
- `centroid`: 重心座標

**ビジネスメソッド**:

- `getCentroid()`: 重心座標を取得
- `getBoundingBox()`: 境界ボックスを取得
- `isValidForYear(year: string)`: 指定年度で有効かチェック

## 主要値オブジェクト

### Resolution

解像度レベルを表す値オブジェクト

**値**:

- `l`: 低解像度（low）- 軽量、概要表示用
- `c`: 中解像度（medium）- バランス重視
- `h`: 高解像度（high）- 詳細表示用
- `f`: 完全解像度（full）- 最高品質

**メソッド**:

- `getDisplayName()`: 表示名を取得
- `getFileSize()`: 推定ファイルサイズを取得
- `isAppropriateForZoom(zoomLevel: number)`: ズームレベルに適しているかチェック

### DataAttribution

データ出典情報を表す値オブジェクト

**プロパティ**:

- `source`: データソース名（"歴史的行政区域データセット β 版"）
- `provider`: 提供者（"GeoNLP プロジェクト、CODH"）
- `license`: ライセンス（"CC BY 4.0"）
- `url`: データソース URL
- `attributionText`: 出典表記テキスト

**メソッド**:

- `getAttributionText()`: 出典表記テキストを生成
- `isValidLicense()`: ライセンスが有効かチェック

## 主要サービス

### GeoshapeService

ドメインサービスのメインクラス

**責務**:

- TopoJSON データの取得・変換
- 解像度の動的選択
- データの検証・正規化

**主要メソッド**:

- `getTopoJsonData(year: string, level: string, resolution: Resolution): Promise<GeoshapeData>`
- `selectOptimalResolution(zoomLevel: number, useCase: string): Resolution`
- `validateTopoJsonData(data: any): boolean`

### GeoshapeFetchService

Geoshape API からのデータ取得サービス

**責務**:

- Geoshape API との通信
- URL 生成とパラメータ管理
- エラーハンドリング

**主要メソッド**:

- `fetchTopoJson(year: string, level: string, resolution: Resolution): Promise<TopoJSON>`
- `buildApiUrl(year: string, level: string, resolution: Resolution): string`
- `handleApiError(error: Error): void`

### GeoshapeCacheService

R2 ストレージでのキャッシュ管理サービス

**責務**:

- キャッシュの保存・取得・削除
- TTL 管理
- キャッシュ統計の収集

**主要メソッド**:

- `getCachedData(cacheKey: string): Promise<GeoshapeData | null>`
- `setCachedData(cacheKey: string, data: GeoshapeData, ttl: number): Promise<void>`
- `invalidateCache(pattern: string): Promise<void>`
- `getCacheStats(): Promise<CacheStatistics>`

## データソース仕様

### 提供元情報

- **データセット名**: 歴史的行政区域データセット β 版
- **提供者**: GeoNLP プロジェクト、ROIS-DS 人文学オープンデータ共同利用センター（CODH）
- **ライセンス**: CC BY 4.0
- **URL**: https://geoshape.ex.nii.ac.jp/

### API 仕様

**URL 形式**:

```
https://geoshape.ex.nii.ac.jp/city/topojson/{YYYYMMDD}/jp_{level}.{resolution}.topojson
```

**パラメータ**:

- `YYYYMMDD`: 対象年度（例: 20230101）
- `level`: 行政レベル（pref: 都道府県、city: 市区町村）
- `resolution`: 解像度（l/c/h/f）

**対象期間**: 1889 年（市制・町村制）〜現在

### 解像度仕様

| 解像度 | 説明       | 用途               | 推定サイズ |
| ------ | ---------- | ------------------ | ---------- |
| l      | 低解像度   | 概要表示、モバイル | ~1MB       |
| c      | 中解像度   | 標準表示           | ~5MB       |
| h      | 高解像度   | 詳細表示           | ~15MB      |
| f      | 完全解像度 | 最高品質           | ~50MB      |

## 技術的特徴

### キャッシュ戦略

- **R2 ストレージ**: Cloudflare R2 での永続キャッシュ
- **TTL**: 30 日（データ更新頻度に基づく）
- **キャッシュキー**: `geoshape:{year}:{level}:{resolution}`
- **圧縮**: gzip 圧縮でストレージ効率化

### パフォーマンス最適化

- **解像度の動的選択**: ズームレベルと用途に応じた最適解像度の自動選択
- **遅延読み込み**: 必要なデータのみを段階的に読み込み
- **CDN 配信**: Cloudflare CDN による高速配信

### データ品質管理

- **バリデーション**: TopoJSON 形式の検証
- **メタデータ管理**: 取得日時、データソース、バージョン情報の記録
- **エラーハンドリング**: API 障害時のフォールバック戦略

## 関連ドメイン

### Area ドメイン

- **関係**: 地域コードによる地理データの検索
- **連携**: 地域コードから Geoshape データへの変換

### Visualization ドメイン

- **関係**: コロプレス地図での可視化
- **連携**: TopoJSON データの地図表示への変換

### DataIntegration ドメイン

- **関係**: 外部 API 統合の共通基盤
- **連携**: キャッシュ戦略の統一、エラーハンドリングの共通化

## 将来の拡張性

### 他の GIS データソースの追加

将来的に国土数値情報等の他の GIS データソースを追加する場合は、以下の方針で対応：

1. **新しいドメインの作成**: `KsjData`ドメイン等として独立したドメインを作成
2. **共通インターフェース**: 地理データの共通インターフェースを定義
3. **統合サービス**: 複数データソースを統合する上位サービス層の実装

### データソースの拡張

- **時系列データ**: 年度別データの効率的な管理
- **属性データ**: 行政区域の属性情報（人口、面積等）の統合
- **境界データ**: より詳細な境界データ（町丁・字レベル）の対応
