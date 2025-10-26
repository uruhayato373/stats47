# Geoshape ドメイン - 技術ドキュメント

## 概要

Geoshape ドメインは、地理データ（TopoJSON/GeoJSON）の取得、変換、管理を担当する支援ドメインです。NII（国立情報学研究所）の Geoshape API を活用し、都道府県と市区町村の両方の地理データに対応しています。

## アーキテクチャ

### ドメイン構造

```
src/features/gis/geoshape/
├── config/           # 設定管理
├── repositories/      # データソース抽象化
├── services/         # ビジネスロジック
├── types/           # 型定義
└── utils/           # ユーティリティ
```

### データフロー

```
Client → GeoshapeService → GeoshapeRepository → DataSources
   ↓
TopoJSON → GeoJSON変換 → Client
```

## NII Geoshape API 構造

### 都道府県データ

**URL**: `https://geoshape.ex.nii.ac.jp/city/topojson/20230101/jp_pref.l.topojson`

- 全国の都道府県境界データ
- 低解像度（low）のみ対応
- ファイル形式: TopoJSON

### 市区町村データ

**URL**: `https://geoshape.ex.nii.ac.jp/city/topojson/20230101/{prefCode}/{prefCode}_city_{version}.i.topojson`

- `prefCode`: 都道府県コード（2 桁、例: "28"）
- `version`:
  - `dc`: 政令指定都市統合版（merged）
  - なし: 政令指定都市分割版（split）

**例**:

- 兵庫県統合版: `28/28_city_dc.i.topojson`
- 兵庫県分割版: `28/28_city.i.topojson`

## サービスレイヤー構成

### GeoshapeService（純粋な関数）

地理データの取得を提供する純粋な関数のコレクションです。TopoJSON を直接返却し、D3.js 側で`topojson.feature()`を使用して GeoJSON に変換します。

#### 主要関数

- **fetchPrefectureTopology()**: 都道府県の TopoJSON トポロジーを取得
- **fetchMunicipalityTopology()**: 市区町村の TopoJSON トポロジーを取得
- **fetchTopologyByAreaCode()**: 地域コードに基づいて TopoJSON トポロジーを取得
- **checkDataSources()**: データソースの可用性をチェック
- **getCacheStatus()**: キャッシュステータスを構築

#### 使用例

```typescript
import {
  fetchPrefectureTopology,
  fetchMunicipalityTopology,
} from "@/features/gis/geoshape/services/geoshape-service";
import * as topojson from "topojson-client";

// 都道府県データを取得
const topology = await fetchPrefectureTopology({
  useCache: true,
});

// D3.js側でGeoJSONに変換
const geojson = topojson.feature(
  topology,
  topology.objects[Object.keys(topology.objects)[0]]
) as GeoJSON.FeatureCollection;

// 兵庫県の市区町村データを取得（統合版）
const municipalityTopology = await fetchMunicipalityTopology("28", "merged");
```

## リポジトリレイヤー構成

### GeoshapeRepository（純粋な関数）

データソースの抽象化とフォールバック戦略を提供する純粋な関数のコレクションです。

#### 主要関数

- **fetchTopology()**: TopoJSON データを取得（汎用メソッド）
- **clearGeoshapeCache()**: キャッシュをクリア
- **buildCacheStatus()**: キャッシュステータスを構築
- **checkDataSources()**: データソースの可用性をチェック

#### フォールバック戦略

1. **メモリキャッシュ**: 24 時間有効
2. **Mock データソース**: 開発環境でのみ使用
3. **R2 ストレージ**: Cloudflare R2 からの取得
4. **外部 API**: NII Geoshape API からの取得

#### 使用例

```typescript
import {
  fetchTopology,
  clearGeoshapeCache,
} from "@/features/gis/geoshape/repositories/geoshape-repository";

// TopoJSONデータを取得
const result = await fetchTopology("prefecture", undefined, "merged");

// キャッシュをクリア
clearGeoshapeCache();
```

## ユーティリティレイヤー構成

### TopojsonConverter（純粋な関数）

TopoJSON の妥当性検証を提供する純粋な関数のコレクションです。D3.js 側で`topojson.feature()`を使用して変換を行うため、変換関数は不要になりました。

#### 主要関数

- **validateTopojson()**: TopoJSON の妥当性を検証

#### 使用例

```typescript
import { validateTopojson } from "@/features/gis/geoshape/utils/topojson-converter";

// TopoJSONの妥当性を検証
if (validateTopojson(data)) {
  // 有効なTopoJSONデータ
}
```

## データソース

### MockDataSource

開発環境でのテスト用データソース

- ローカルファイルから TopoJSON を読み込み
- 開発時の高速化とオフライン対応

### R2DataSource

Cloudflare R2 ストレージからのデータ取得

- 本番環境での高速データ取得
- CDN 経由での配信

### ExternalDataSource

NII Geoshape API からの直接取得

- 最新データの取得
- フォールバック時の最終手段

## 型定義

### 主要な型

```typescript
// 地域タイプ
export type AreaType = "country" | "prefecture" | "municipality";

// 市区町村版タイプ
export type MunicipalityVersion = "merged" | "split";

// 都道府県Feature
export interface PrefectureFeature extends GeoJSON.Feature {
  properties: {
    prefCode: string;
    prefName: string;
    [key: string]: any;
  };
}

// 市区町村Feature
export interface MunicipalityFeature extends GeoJSON.Feature {
  properties: {
    municipalityCode: string;
    municipalityName: string;
    prefCode: string;
    [key: string]: any;
  };
}

// 取得オプション
export interface FetchOptions {
  useCache?: boolean;
  forceRefresh?: boolean;
}

// 取得結果
export interface FetchResult<T> {
  data: T;
  source: "memory" | "mock" | "r2" | "external";
  timestamp: number;
}
```

## エラーハンドリング

### エラー種別

1. **データソースエラー**: すべてのデータソースが失敗
2. **変換エラー**: TopoJSON から GeoJSON への変換失敗
3. **検証エラー**: データの妥当性チェック失敗
4. **ネットワークエラー**: 外部 API 接続失敗

### エラーハンドリング例

```typescript
try {
  const features = await fetchPrefectureFeatures();
  // 成功時の処理
} catch (error) {
  if (error instanceof Error) {
    console.error("Geoshape error:", error.message);
    // エラー処理
  }
}
```

## パフォーマンス最適化

### キャッシュ戦略

- **メモリキャッシュ**: 24 時間有効期限
- **R2 ストレージ**: CDN 経由での高速配信
- **フォールバック**: 段階的なデータソース切り替え

### データサイズ最適化

- **低解像度データ**: 表示用途に最適化
- **TopoJSON 形式**: GeoJSON より軽量
- **圧縮**: gzip 圧縮による転送量削減

## テスト戦略

### 単体テスト

- 純粋な関数のテストが容易
- モックデータでの動作確認
- エッジケースの検証

### 統合テスト

- データソース間の切り替えテスト
- フォールバック戦略の検証
- エラーハンドリングの確認

## 今後の拡張予定

### 機能拡張

1. **高解像度データ**: 必要に応じて高解像度データの対応
2. **GeoJSON 変換**: TopoJSON から GeoJSON への双方向変換
3. **データ更新**: 定期的なデータ更新機能
4. **カスタムデータ**: ユーザー独自の地理データ対応

### パフォーマンス改善

1. **ストリーミング**: 大きなデータのストリーミング読み込み
2. **並列処理**: 複数データソースの並列取得
3. **インデックス**: 地理データの空間インデックス

## まとめ

Geoshape ドメインは、純粋な関数ベースの設計により、テスト容易性と保守性を向上させています。TopoJSON を直接使用することで、中間変換を削除し、パフォーマンスを向上させています。NII Geoshape API を活用した段階的なフォールバック戦略により、高い可用性とパフォーマンスを実現しています。

### TopoJSON 直接使用のメリット

1. **パフォーマンス向上**: 中間変換が不要になり、処理速度が向上
2. **コードの簡素化**: 不要な変換ロジックを削除
3. **TopoJSON の圧縮メリット**: TopoJSON は GeoJSON より軽量で転送効率が良い
4. **責務の明確化**:
   - Geoshape サービス: TopoJSON の取得のみ
   - D3.js: TopoJSON の変換と描画
5. **保守性向上**: 変換ロジックが一箇所（D3.js 側）に集約される

## 型定義

### 基本型

```typescript
// 地域タイプ（Areaドメインからインポート）
export type AreaType = "country" | "prefecture" | "municipality";

// 市区町村版タイプ
export type MunicipalityVersion = "merged" | "split";
```

### データ取得オプション

```typescript
export interface FetchOptions {
  /** 地域レベル（"country"は都道府県と同じデータを使用） */
  areaType?: AreaType;
  /** 都道府県コード（2桁）- municipalityで必須 */
  prefCode?: string;
  /** 市区町村版タイプ */
  municipalityVersion?: MunicipalityVersion;
  /** キャッシュを使用するか */
  useCache?: boolean;
  /** 強制再取得 */
  forceRefresh?: boolean;
}
```

### GeoJSON 型

```typescript
// 都道府県Feature
export interface PrefectureFeature extends GeoJSON.Feature {
  properties: {
    prefCode: string;
    prefName: string;
    [key: string]: any;
  };
}

// 市区町村Feature
export interface MunicipalityFeature extends GeoJSON.Feature {
  properties: {
    cityCode: string;
    cityName: string;
    prefCode: string;
    prefName: string;
    [key: string]: any;
  };
}
```

## 主要クラス

### GeoshapeService

地理データの取得と変換を提供するメインサービス。

```typescript
export class GeoshapeService {
  // 都道府県データ取得
  static async fetchPrefectureFeatures(
    options?: FetchOptions
  ): Promise<PrefectureFeatureCollection>;

  // 市区町村データ取得
  static async fetchMunicipalityFeatures(
    prefCode: string,
    version?: MunicipalityVersion,
    options?: FetchOptions
  ): Promise<MunicipalityFeatureCollection>;

  // 地域コードから適切なデータを取得
  static async fetchFeaturesByAreaCode(
    areaCode: string,
    version?: MunicipalityVersion,
    options?: FetchOptions
  ): Promise<PrefectureFeatureCollection | MunicipalityFeatureCollection>;

  // 特定の都道府県を検索
  static async findPrefectureFeature(
    prefCode: string,
    options?: FetchOptions
  ): Promise<PrefectureFeature | null>;

  // 都道府県コードリストを取得
  static async listPrefectureCodes(options?: FetchOptions): Promise<string[]>;

  // 都道府県名リストを取得
  static async listPrefectureNames(options?: FetchOptions): Promise<string[]>;

  // 都道府県マッピングを構築
  static async buildPrefectureMapping(
    options?: FetchOptions
  ): Promise<Record<string, string>>;
}
```

### GeoshapeRepository

データソースの抽象化とフォールバック戦略を提供。

```typescript
export class GeoshapeRepository {
  // 汎用データ取得メソッド
  static async fetchTopology(
    areaType: AreaType,
    prefCode?: string,
    version?: MunicipalityVersion,
    options?: FetchOptions
  ): Promise<FetchResult<TopoJSONTopology>>;

  // キャッシュステータスを構築
  static buildCacheStatus(): {
    memoryCache: number;
    r2Available: boolean;
    externalAvailable: boolean;
  };
}
```

### データソース

#### ExternalDataSource

NII の Geoshape API からデータを取得。

#### MockDataSource

ローカルの Mock データからデータを取得。

#### R2DataSource

Cloudflare R2 ストレージからデータを取得・保存。

## ユーティリティ

### AreaCodeConverter

地域コードの変換と検証を提供。

```typescript
// 5桁地域コードから2桁都道府県コードを抽出
export function extractPrefCodeFrom5Digit(areaCode: string): string;

// 2桁都道府県コードから5桁地域コードに変換
export function convertPrefCodeTo5Digit(prefCode: string): string;

// 地域コードから地域タイプを判定
export function determineAreaTypeFromCode(areaCode: string): AreaType;

// 地域コードの妥当性をチェック
export function validateAreaCode(areaCode: string): boolean;

// 都道府県コードの妥当性をチェック
export function validatePrefCode(prefCode: string): boolean;
```

### TopojsonConverter

TopoJSON から GeoJSON への変換を提供。

```typescript
export class TopojsonConverter {
  static toGeoJSON(topology: TopoJSONTopology): GeoJSON.FeatureCollection;
}
```

## 使用例

### 都道府県データの取得

```typescript
import { GeoshapeService } from "@/features/gis/geoshape/services/geoshape-service";

// 都道府県データを取得
const prefectureFeatures = await GeoshapeService.fetchPrefectureFeatures();

// 特定の都道府県を検索
const tokyoFeature = await GeoshapeService.findPrefectureFeature("13");

// 都道府県コードリストを取得
const prefCodes = await GeoshapeService.listPrefectureCodes();

// 都道府県マッピングを構築
const prefMapping = await GeoshapeService.buildPrefectureMapping();
```

### 市区町村データの取得

```typescript
// 兵庫県の市区町村データ（統合版）を取得
const hyogoFeatures = await GeoshapeService.fetchMunicipalityFeatures(
  "28",
  "merged"
);

// 兵庫県の市区町村データ（分割版）を取得
const hyogoFeaturesSplit = await GeoshapeService.fetchMunicipalityFeatures(
  "28",
  "split"
);
```

### 地域コードからデータを取得

```typescript
import { determineAreaTypeFromCode } from "@/features/gis/geoshape/utils/area-code-converter";

const areaCode = "28000"; // 兵庫県
const features = await GeoshapeService.fetchFeaturesByAreaCode(
  areaCode,
  "merged"
);
```

## フォールバック戦略

データ取得は以下の順序でフォールバックします：

1. **メモリキャッシュ** - 既に取得済みのデータ
2. **Mock データ** - 開発環境でのローカルデータ
3. **R2 ストレージ** - キャッシュされたデータ
4. **外部 API** - NII の Geoshape API

## 設定

### 環境変数

```bash
# Mockデータを使用するか
NEXT_PUBLIC_USE_MOCK_DATA=true
```

### 設定ファイル

```typescript
export const geoshapeConfig: GeoshapeConfig = {
  mockDataPath: "/data/mock/gis/geoshape/jp_pref.l.topojson",
  externalApiUrl: "https://geoshape.ex.nii.ac.jp",
  r2BucketPath: "geoshape/cache/2023",
  defaultResolution: "low",
  cacheMaxAge: 86400, // 24時間
};
```

## エラーハンドリング

- データソースの失敗時は次のソースに自動フォールバック
- すべてのソースが失敗した場合はエラーをスロー
- ログ出力でデバッグ情報を提供

## パフォーマンス

- メモリキャッシュによる高速アクセス
- R2 ストレージによる永続化キャッシュ
- 非同期処理による非ブロッキング操作
- 24 時間のキャッシュ有効期限

## 今後の拡張

- 中・高解像度データの対応
- 他の地理データソースの追加
- リアルタイムデータ更新
- 地理データの検索・フィルタリング機能
