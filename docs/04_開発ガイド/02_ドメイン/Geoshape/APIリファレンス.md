# Geoshape ドメイン - API リファレンス

## 概要

このドキュメントでは、Geoshape ドメインの API について詳細に説明します。型定義、サービス、リポジトリ、ユーティリティの各 API を網羅的に解説します。

## 型定義

### TopoJSON 型

#### `TopoJSONTopology`

TopoJSON トポロジーオブジェクトの型定義。

```typescript
interface TopoJSONTopology {
  type: "Topology";
  objects: Record<string, TopoJSONGeometryCollection>;
  arcs: number[][][];
  transform?: {
    scale: [number, number];
    translate: [number, number];
  };
  bbox?: [number, number, number, number];
  metadata?: Record<string, any>;
}
```

**プロパティ**:

- `type`: 常に "Topology"
- `objects`: ジオメトリコレクションのマップ
- `arcs`: 座標アークの配列
- `transform`: 座標変換情報（オプション）
- `bbox`: 境界ボックス（オプション）
- `metadata`: メタデータ（オプション）

#### `PrefectureFeature`

都道府県の GeoJSON Feature 型。

```typescript
interface PrefectureFeature extends GeoJSON.Feature {
  type: "Feature";
  properties: {
    prefCode: string;
    prefName: string;
    [key: string]: any;
  };
  geometry: GeoJSON.Geometry;
}
```

**プロパティ**:

- `type`: 常に "Feature"
- `properties.prefCode`: 都道府県コード（例: "13000"）
- `properties.prefName`: 都道府県名（例: "東京都"）
- `geometry`: GeoJSON ジオメトリオブジェクト

### 設定型

#### `GeoshapeConfig`

Geoshape ドメインの設定。

```typescript
interface GeoshapeConfig {
  mockDataPath: string;
  externalApiUrl: string;
  r2BucketPath: string;
  cacheMaxAge: number;
}
```

**プロパティ**:

- `mockDataPath`: Mock データのパス
- `externalApiUrl`: 外部 API のベース URL
- `r2BucketPath`: R2 ストレージのバケットパス
- `cacheMaxAge`: キャッシュ有効期限（秒）

#### `FetchOptions`

データ取得オプション。

```typescript
interface FetchOptions {
  resolution?: ResolutionLevel;
  useCache?: boolean;
  forceRefresh?: boolean;
}
```

**プロパティ**:

- `resolution`: 解像度レベル（"low" | "medium" | "high"）
- `useCache`: キャッシュを使用するか（デフォルト: true）
- `forceRefresh`: 強制再取得（デフォルト: false）

#### `FetchResult<T>`

データ取得結果。

```typescript
interface FetchResult<T> {
  data: T;
  source: DataSourceType;
  cached: boolean;
  fetchedAt: Date;
}
```

**プロパティ**:

- `data`: 取得したデータ
- `source`: データソース（"mock" | "r2" | "external"）
- `cached`: キャッシュヒットしたか
- `fetchedAt`: 取得時刻

## サービス API

### `GeoshapeService`

地理データの取得を提供するメインサービス。TopoJSON を直接返却し、D3.js 側で`topojson.feature()`を使用して GeoJSON に変換します。

#### `fetchPrefectureTopology(options?: FetchOptions): Promise<TopoJSONTopology>`

都道府県の TopoJSON トポロジーを取得。

**パラメータ**:

- `options`: 取得オプション（オプション）

**戻り値**: 都道府県の TopoJSON トポロジー

**例**:

```typescript
import { fetchPrefectureTopology } from "@/features/gis/geoshape/services/geoshape-service";
import * as topojson from "topojson-client";

const topology = await fetchPrefectureTopology({
  useCache: true,
});

// D3.js側でGeoJSONに変換
const objectName = Object.keys(topology.objects)[0];
const geojson = topojson.feature(
  topology,
  topology.objects[objectName]
) as GeoJSON.FeatureCollection;

console.log(geojson.features.length); // 47
```

#### `fetchMunicipalityTopology(prefCode: string, version?: MunicipalityVersion, options?: FetchOptions): Promise<TopoJSONTopology>`

市区町村の TopoJSON トポロジーを取得。

**パラメータ**:

- `prefCode`: 都道府県コード（2 桁）
- `version`: 市区町村版タイプ（"merged" | "split"）
- `options`: 取得オプション（オプション）

**戻り値**: 市区町村の TopoJSON トポロジー

**例**:

```typescript
import { fetchMunicipalityTopology } from "@/features/gis/geoshape/services/geoshape-service";
import * as topojson from "topojson-client";

// 兵庫県の市区町村データを取得（統合版）
const topology = await fetchMunicipalityTopology("28", "merged");

// D3.js側でGeoJSONに変換
const objectName = Object.keys(topology.objects)[0];
const geojson = topojson.feature(
  topology,
  topology.objects[objectName]
) as GeoJSON.FeatureCollection;

console.log(geojson.features.length); // 兵庫県の市区町村数
```

#### `fetchTopologyByAreaCode(areaCode: string, version?: MunicipalityVersion, options?: FetchOptions): Promise<TopoJSONTopology>`

地域コードに基づいて TopoJSON トポロジーを取得。

**パラメータ**:

- `areaCode`: 地域コード（5 桁）
- `version`: 市区町村版タイプ（"merged" | "split"）
- `options`: 取得オプション（オプション）

**戻り値**: TopoJSON トポロジー

**例**:

```typescript
import { fetchTopologyByAreaCode } from "@/features/gis/geoshape/services/geoshape-service";

// 都道府県コードの場合
const prefectureTopology = await fetchTopologyByAreaCode("13000");

// 市区町村コードの場合
const municipalityTopology = await fetchTopologyByAreaCode("13101", "merged");
```

#### `checkDataSources(areaType: AreaType, prefCode?: string, version?: MunicipalityVersion): Promise<{mock: boolean; r2: boolean; external: boolean}>`

データソースの可用性をチェック。

**パラメータ**:

- `areaType`: 地域タイプ
- `prefCode`: 都道府県コード（2 桁、オプション）
- `version`: 市区町村版タイプ（オプション）

**戻り値**: 各データソースの可用性

**例**:

```typescript
const availability = await checkDataSources("prefecture");
console.log(availability); // { mock: true, r2: false, external: true }
```

#### `getCacheStatus(): {memoryCache: number; r2Available: boolean; externalAvailable: boolean}`

キャッシュステータスを構築。

**戻り値**: キャッシュステータス

**例**:

```typescript
const status = getCacheStatus();
console.log(status); // { memoryCache: 2, r2Available: false, externalAvailable: true }
```

#### `getPrefectureMapping(options?: FetchOptions): Promise<Record<string, string>>`

都道府県コードと名前のマッピングを取得。

**パラメータ**:

- `options`: 取得オプション（オプション）

**戻り値**: 都道府県コードと名前のマッピング

**例**:

```typescript
const mapping = await GeoshapeService.getPrefectureMapping();
console.log(mapping["13000"]); // "東京都"
```

#### `checkDataSources(): Promise<{mock: boolean, r2: boolean, external: boolean}>`

データソースの可用性をチェック。

**戻り値**: 各データソースの可用性

**例**:

```typescript
const sources = await GeoshapeService.checkDataSources();
console.log("R2利用可能:", sources.r2);
```

#### `clearCache(): void`

キャッシュをクリア。

**例**:

```typescript
GeoshapeService.clearCache();
```

#### `getCacheStatus(): {memoryCache: number, r2Available: boolean, externalAvailable: boolean}`

キャッシュステータスを取得。

**戻り値**: キャッシュステータス

**例**:

```typescript
const status = GeoshapeService.getCacheStatus();
console.log("メモリキャッシュ数:", status.memoryCache);
```

## リポジトリ API

### `GeoshapeRepository`

データソースの抽象化とフォールバック戦略を提供。

#### `getPrefectureTopology(options?: FetchOptions): Promise<FetchResult<TopoJSONTopology>>`

都道府県 TopoJSON データを取得（3 段階フォールバック）。

**パラメータ**:

- `options`: 取得オプション（オプション）

**戻り値**: TopoJSON データと取得情報

**例**:

```typescript
const result = await GeoshapeRepository.getPrefectureTopology({
  resolution: "low",
  useCache: true,
});
console.log("データソース:", result.source);
console.log("キャッシュヒット:", result.cached);
```

#### `clearMemoryCache(): void`

メモリキャッシュをクリア。

**例**:

```typescript
GeoshapeRepository.clearMemoryCache();
```

#### `getCacheStatus(): {memoryCache: number, r2Available: boolean, externalAvailable: boolean}`

キャッシュステータスを取得。

**戻り値**: キャッシュステータス

#### `checkDataSources(): Promise<{mock: boolean, r2: boolean, external: boolean}>`

データソースの可用性をチェック。

**戻り値**: 各データソースの可用性

## データソース API

### `MockDataSource`

Mock データソース。

#### `fetch(resolution: ResolutionLevel): Promise<TopoJSONTopology>`

Mock データを取得。

**パラメータ**:

- `resolution`: 解像度レベル

**戻り値**: TopoJSON データ

### `R2DataSource`

R2 ストレージデータソース。

#### `fetch(resolution: ResolutionLevel): Promise<TopoJSONTopology | null>`

R2 ストレージからデータを取得。

**パラメータ**:

- `resolution`: 解像度レベル

**戻り値**: TopoJSON データ、存在しない場合は null

#### `save(data: TopoJSONTopology, resolution: ResolutionLevel): Promise<void>`

R2 ストレージにデータを保存。

**パラメータ**:

- `data`: 保存する TopoJSON データ
- `resolution`: 解像度レベル

#### `delete(resolution: ResolutionLevel): Promise<void>`

R2 ストレージからデータを削除。

**パラメータ**:

- `resolution`: 解像度レベル

#### `isAvailable(): Promise<boolean>`

R2 ストレージが利用可能かチェック。

**戻り値**: 利用可能なら true

### `ExternalDataSource`

外部 API データソース。

#### `fetch(resolution: ResolutionLevel): Promise<TopoJSONTopology>`

外部 API からデータを取得。

**パラメータ**:

- `resolution`: 解像度レベル

**戻り値**: TopoJSON データ

#### `isAvailable(): Promise<boolean>`

外部 API が利用可能かチェック。

**戻り値**: 利用可能なら true

## ユーティリティ API

### `validateTopojson(topology: unknown): topology is TopoJSONTopology`

TopoJSON の妥当性を検証。

**パラメータ**:

- `topology`: 検証するオブジェクト

**戻り値**: TopoJSON トポロジーかどうかの型ガード

**例**:

```typescript
import { validateTopojson } from "@/features/gis/geoshape/utils/topojson-converter";

if (validateTopojson(data)) {
  // 有効なTopoJSONデータ
  console.log("TopoJSON is valid");
} else {
  console.error("Invalid TopoJSON format");
}
```

### TopoJSON → GeoJSON 変換（D3.js 側）

TopoJSON から GeoJSON への変換は、D3.js 側で`topojson.feature()`を使用して行います。

**例**:

```typescript
import * as topojson from "topojson-client";

// TopoJSONを取得
const topology = await fetchPrefectureTopology();

// D3.js側でGeoJSONに変換
const objectName = Object.keys(topology.objects)[0];
const geojson = topojson.feature(
  topology,
  topology.objects[objectName]
) as GeoJSON.FeatureCollection;

// 都道府県コードと名前を正規化（D3.js側で実装）
const normalizedFeatures = geojson.features.map((feature) => {
  const properties = feature.properties || {};

  // 都道府県コードを抽出（5桁形式に正規化）
  const code = properties.N03_007 || properties.prefCode || properties.code;
  const prefCode = code ? `${String(code).padStart(2, "0")}000` : "00000";

  // 都道府県名を抽出
  const prefName =
    properties.N03_001 || properties.prefName || properties.name || "不明";

  return {
    ...feature,
    properties: {
      ...properties,
      prefCode,
      prefName,
    },
  };
});
```

## 設定 API

### `geoshapeConfig`

Geoshape 設定オブジェクト。

```typescript
const geoshapeConfig: GeoshapeConfig = {
  mockDataPath: "/data/mock/gis/geoshape/jp_pref.l.topojson",
  externalApiUrl: "https://geoshape.ex.nii.ac.jp",
  r2BucketPath: "geoshape/cache/2023",
  cacheMaxAge: 86400,
};
```

### `isMockEnvironment(): boolean`

Mock 環境かどうかを判定。

**戻り値**: Mock 環境なら true

### `buildGeoshapeExternalUrl(resolution: ResolutionLevel): string`

外部 API の URL を構築。

**パラメータ**:

- `resolution`: 解像度レベル

**戻り値**: 完全な URL

### `buildR2Key(resolution: ResolutionLevel): string`

R2 ストレージのキーを構築。

**パラメータ**:

- `resolution`: 解像度レベル

**戻り値**: R2 オブジェクトキー

## エラーハンドリング

### エラータイプ

#### `GeoshapeError`

基本エラークラス。

```typescript
class GeoshapeError extends Error {
  constructor(message: string, public code?: string);
}
```

#### `DataSourceError`

データソースエラー。

```typescript
class DataSourceError extends GeoshapeError {
  constructor(message: string, public source: string);
}
```

#### `CacheError`

キャッシュエラー。

```typescript
class CacheError extends GeoshapeError {
  constructor(message: string);
}
```

### エラー処理例

```typescript
try {
  const features = await GeoshapeService.getPrefectureFeatures();
} catch (error) {
  if (error instanceof DataSourceError) {
    console.error("データソースエラー:", error.source, error.message);
  } else if (error instanceof CacheError) {
    console.error("キャッシュエラー:", error.message);
  } else {
    console.error("その他のエラー:", error.message);
  }
}
```

## 使用例

### 基本的な地図表示

```typescript
import { GeoshapeService } from "@/features/gis/geoshape/services/geoshape-service";

async function loadMapData() {
  try {
    const features = await GeoshapeService.getPrefectureFeatures({
      resolution: "low",
      useCache: true,
    });

    // 地図に表示
    renderMap(features);
  } catch (error) {
    console.error("データ取得エラー:", error);
  }
}
```

### 特定の都道府県の取得

```typescript
import { GeoshapeService } from "@/features/gis/geoshape/services/geoshape-service";

async function loadTokyoData() {
  const tokyo = await GeoshapeService.getPrefectureFeature("13000");
  if (tokyo) {
    console.log("東京都のデータ:", tokyo);
  }
}
```

### データソースの可用性チェック

```typescript
import { GeoshapeService } from "@/features/gis/geoshape/services/geoshape-service";

async function checkAvailability() {
  const sources = await GeoshapeService.checkDataSources();

  if (sources.mock) {
    console.log("Mockデータが利用可能");
  }
  if (sources.r2) {
    console.log("R2ストレージが利用可能");
  }
  if (sources.external) {
    console.log("外部APIが利用可能");
  }
}
```
