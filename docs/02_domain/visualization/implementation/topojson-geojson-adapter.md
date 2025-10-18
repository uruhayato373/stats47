---
title: TopoJSON/GeoJSONアダプター実装仕様
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/visualization
  - implementation
  - topojson
  - geojson
  - adapter-pattern
  - geoshape
---

# TopoJSON/GeoJSON アダプター実装仕様

## 概要

Geoshape データセットの TopoJSON 形式データを GeoJSON 形式に変換し、Leaflet 地図コンポーネントで利用するためのアダプター実装仕様を定義します。topojson-client ライブラリを活用し、効率的なデータ変換とパフォーマンス最適化を実現します。

## TopoJSON 形式の概要

### TopoJSON とは

TopoJSON は、GeoJSON を拡張した地理データ形式で、以下の特徴があります：

1. **ファイルサイズ削減**: 座標の重複を排除し、約 70%のサイズ削減
2. **トポロジー情報**: 隣接するポリゴン間の境界線を共有
3. **効率的な表現**: 大規模な地理データに適している
4. **変換可能**: GeoJSON 形式に容易に変換可能

### TopoJSON の構造

```typescript
interface TopoJSONStructure {
  type: "Topology";
  objects: {
    [key: string]:
      | TopoJSON.GeometryCollection
      | TopoJSON.LineString
      | TopoJSON.MultiLineString
      | TopoJSON.Point
      | TopoJSON.MultiPoint
      | TopoJSON.Polygon
      | TopoJSON.MultiPolygon;
  };
  arcs: number[][][];
  bbox?: number[];
  transform?: {
    scale: [number, number];
    translate: [number, number];
  };
}
```

### Geoshape TopoJSON の特徴

```typescript
// Geoshape TopoJSONの例（都道府県データ）
interface GeoshapeTopoJSON {
  type: "Topology";
  objects: {
    jp_pref: {
      type: "GeometryCollection";
      geometries: Array<{
        type: "Polygon" | "MultiPolygon";
        properties: {
          N03_001: string; // 都道府県名
          N03_002?: string; // 都道府県名（カナ）
          N03_003?: string; // 都道府県名（英字）
          N03_004: string; // 都道府県コード
        };
        arcs: number[][];
      }>;
    };
  };
  arcs: number[][][];
  bbox: [number, number, number, number];
  transform: {
    scale: [number, number];
    translate: [number, number];
  };
}
```

## 必須ライブラリ

### package.json への追加

```json
{
  "dependencies": {
    "topojson-client": "^3.1.0",
    "topojson-server": "^3.0.1"
  },
  "devDependencies": {
    "@types/topojson-client": "^3.1.0"
  }
}
```

### 型定義のインポート

```typescript
import * as topojson from "topojson-client";
import { Topology, GeometryCollection } from "topojson-specification";
import { Feature, FeatureCollection, Geometry } from "geojson";
```

## TopoJSON → GeoJSON 変換実装

### 基本的な変換関数

```typescript
export class TopoJSONConverter {
  /**
   * TopoJSONをGeoJSONに変換
   */
  static convertToGeoJSON(
    topology: Topology,
    objectName: string
  ): FeatureCollection {
    const geometryCollection = topology.objects[
      objectName
    ] as GeometryCollection;

    if (!geometryCollection) {
      throw new Error(`Object '${objectName}' not found in topology`);
    }

    const features: Feature[] = geometryCollection.geometries.map(
      (geometry) => {
        const geoJSONGeometry = topojson.feature(topology, geometry);

        return {
          type: "Feature",
          geometry: geoJSONGeometry.geometry,
          properties: {
            ...geometry.properties,
            // 地域コードの正規化
            areaCode: this.normalizeAreaCode(geometry.properties),
            // 地域名の正規化
            areaName: this.normalizeAreaName(geometry.properties),
          },
        };
      }
    );

    return {
      type: "FeatureCollection",
      features,
    };
  }

  /**
   * 複数のオブジェクトを一度に変換
   */
  static convertMultipleObjects(
    topology: Topology,
    objectNames: string[]
  ): Record<string, FeatureCollection> {
    const result: Record<string, FeatureCollection> = {};

    objectNames.forEach((objectName) => {
      try {
        result[objectName] = this.convertToGeoJSON(topology, objectName);
      } catch (error) {
        console.warn(`Failed to convert object '${objectName}':`, error);
      }
    });

    return result;
  }

  /**
   * 地域コードの正規化
   */
  private static normalizeAreaCode(properties: any): string {
    // Geoshapeの地域コードフィールドを正規化
    const codeFields = ["N03_004", "N03_007", "N03_008"];

    for (const field of codeFields) {
      if (properties[field]) {
        return properties[field].toString().padStart(5, "0");
      }
    }

    return "";
  }

  /**
   * 地域名の正規化
   */
  private static normalizeAreaName(properties: any): string {
    // 地域名フィールドの優先順位
    const nameFields = ["N03_001", "N03_002", "N03_003"];

    for (const field of nameFields) {
      if (properties[field]) {
        return properties[field].toString();
      }
    }

    return "";
  }
}
```

### 地域コードプロパティの抽出

```typescript
export class AreaCodeExtractor {
  /**
   * Geoshapeプロパティから地域コードを抽出
   */
  static extractAreaCode(properties: any): {
    estatCode: string;
    geoshapeId: string;
    name: string;
    level: "prefecture" | "municipality";
  } {
    const estatCode = this.extractEstatCode(properties);
    const geoshapeId = this.extractGeoshapeId(properties);
    const name = this.extractName(properties);
    const level = this.determineLevel(estatCode);

    return {
      estatCode,
      geoshapeId,
      name,
      level,
    };
  }

  /**
   * e-Stat地域コードの抽出
   */
  private static extractEstatCode(properties: any): string {
    // 都道府県コード（2桁）
    if (properties.N03_004) {
      return properties.N03_004.toString().padStart(2, "0") + "000";
    }

    // 市区町村コード（5桁）
    if (properties.N03_007) {
      return properties.N03_007.toString().padStart(5, "0");
    }

    return "";
  }

  /**
   * Geoshape IDの抽出
   */
  private static extractGeoshapeId(properties: any): string {
    const estatCode = this.extractEstatCode(properties);

    if (estatCode.length === 5) {
      const prefectureCode = estatCode.substring(0, 2);
      const municipalityCode = estatCode.substring(2);
      return `${prefectureCode}_${municipalityCode}`;
    }

    return estatCode.substring(0, 2);
  }

  /**
   * 地域名の抽出
   */
  private static extractName(properties: any): string {
    return properties.N03_001 || properties.N03_002 || properties.N03_003 || "";
  }

  /**
   * 地域レベルの判定
   */
  private static determineLevel(
    estatCode: string
  ): "prefecture" | "municipality" {
    return estatCode.endsWith("000") ? "prefecture" : "municipality";
  }
}
```

## ポリゴン簡略化レベルの制御

### 簡略化レベル定義

```typescript
enum SimplificationLevel {
  HIGH_DETAIL = 0.0001, // 高詳細（ファイルサイズ大）
  MEDIUM_DETAIL = 0.001, // 中詳細（推奨）
  LOW_DETAIL = 0.01, // 低詳細（ファイルサイズ小）
  VERY_LOW_DETAIL = 0.1, // 非常に低詳細（高速表示）
}

interface SimplificationConfig {
  level: SimplificationLevel;
  preserveTopology: boolean;
  maxVertices?: number;
}
```

### 簡略化実装

```typescript
import * as topojson from "topojson-server";
import * as topojsonSimplify from "topojson-simplify";

export class PolygonSimplifier {
  /**
   * TopoJSONの簡略化
   */
  static simplifyTopology(
    topology: Topology,
    config: SimplificationConfig
  ): Topology {
    const simplified = topojsonSimplify.simplify(topology, config.level);

    if (config.preserveTopology) {
      return topojsonSimplify.presimplify(simplified);
    }

    return simplified;
  }

  /**
   * ズームレベルに応じた簡略化
   */
  static simplifyForZoomLevel(topology: Topology, zoomLevel: number): Topology {
    let simplificationLevel: SimplificationLevel;

    if (zoomLevel <= 5) {
      simplificationLevel = SimplificationLevel.VERY_LOW_DETAIL;
    } else if (zoomLevel <= 8) {
      simplificationLevel = SimplificationLevel.LOW_DETAIL;
    } else if (zoomLevel <= 12) {
      simplificationLevel = SimplificationLevel.MEDIUM_DETAIL;
    } else {
      simplificationLevel = SimplificationLevel.HIGH_DETAIL;
    }

    return this.simplifyTopology(topology, {
      level: simplificationLevel,
      preserveTopology: true,
    });
  }

  /**
   * ファイルサイズに応じた簡略化
   */
  static simplifyForFileSize(
    topology: Topology,
    targetSizeKB: number
  ): Topology {
    const currentSizeKB = JSON.stringify(topology).length / 1024;

    if (currentSizeKB <= targetSizeKB) {
      return topology;
    }

    const ratio = targetSizeKB / currentSizeKB;
    let simplificationLevel: SimplificationLevel;

    if (ratio < 0.1) {
      simplificationLevel = SimplificationLevel.VERY_LOW_DETAIL;
    } else if (ratio < 0.3) {
      simplificationLevel = SimplificationLevel.LOW_DETAIL;
    } else if (ratio < 0.7) {
      simplificationLevel = SimplificationLevel.MEDIUM_DETAIL;
    } else {
      simplificationLevel = SimplificationLevel.HIGH_DETAIL;
    }

    return this.simplifyTopology(topology, {
      level: simplificationLevel,
      preserveTopology: true,
    });
  }
}
```

## Leaflet 統合のための変換パイプライン

### 変換パイプライン

```typescript
export class GeoshapeToLeafletPipeline {
  /**
   * Geoshape TopoJSONをLeaflet用GeoJSONに変換
   */
  static async convertForLeaflet(
    topology: Topology,
    objectName: string,
    options: ConversionOptions = {}
  ): Promise<FeatureCollection> {
    try {
      // 1. TopoJSON → GeoJSON 変換
      const geoJSON = TopoJSONConverter.convertToGeoJSON(topology, objectName);

      // 2. 地域コードの正規化
      const normalizedGeoJSON = this.normalizeAreaCodes(geoJSON);

      // 3. 座標系の変換（必要に応じて）
      const transformedGeoJSON = options.transformCoordinates
        ? this.transformCoordinates(normalizedGeoJSON, options.coordinateSystem)
        : normalizedGeoJSON;

      // 4. プロパティの最適化
      const optimizedGeoJSON = this.optimizeProperties(transformedGeoJSON);

      // 5. バリデーション
      this.validateGeoJSON(optimizedGeoJSON);

      return optimizedGeoJSON;
    } catch (error) {
      console.error("Failed to convert Geoshape data for Leaflet:", error);
      throw error;
    }
  }

  /**
   * 地域コードの正規化
   */
  private static normalizeAreaCodes(
    geoJSON: FeatureCollection
  ): FeatureCollection {
    return {
      ...geoJSON,
      features: geoJSON.features.map((feature) => ({
        ...feature,
        properties: {
          ...feature.properties,
          // e-Stat互換の地域コード
          estatCode: AreaCodeExtractor.extractAreaCode(feature.properties)
            .estatCode,
          // Geoshape ID
          geoshapeId: AreaCodeExtractor.extractAreaCode(feature.properties)
            .geoshapeId,
          // 地域名
          name: AreaCodeExtractor.extractAreaCode(feature.properties).name,
          // 地域レベル
          level: AreaCodeExtractor.extractAreaCode(feature.properties).level,
        },
      })),
    };
  }

  /**
   * 座標系の変換
   */
  private static transformCoordinates(
    geoJSON: FeatureCollection,
    targetSystem: "WGS84" | "JGD2000" | "WebMercator"
  ): FeatureCollection {
    // 座標系変換の実装
    // 実際の実装では、proj4js等のライブラリを使用
    return geoJSON;
  }

  /**
   * プロパティの最適化
   */
  private static optimizeProperties(
    geoJSON: FeatureCollection
  ): FeatureCollection {
    return {
      ...geoJSON,
      features: geoJSON.features.map((feature) => ({
        ...feature,
        properties: {
          // Leafletで必要な最小限のプロパティのみ保持
          id: feature.properties?.estatCode || feature.properties?.geoshapeId,
          name: feature.properties?.name,
          areaCode: feature.properties?.estatCode,
          level: feature.properties?.level,
          // 統計データ用のプレースホルダー
          value: null,
          category: null,
        },
      })),
    };
  }

  /**
   * GeoJSONのバリデーション
   */
  private static validateGeoJSON(geoJSON: FeatureCollection): void {
    if (!geoJSON.features || !Array.isArray(geoJSON.features)) {
      throw new Error("Invalid GeoJSON: features array is missing");
    }

    geoJSON.features.forEach((feature, index) => {
      if (!feature.geometry) {
        throw new Error(`Invalid GeoJSON: feature ${index} has no geometry`);
      }

      if (!feature.properties) {
        throw new Error(`Invalid GeoJSON: feature ${index} has no properties`);
      }
    });
  }
}

interface ConversionOptions {
  transformCoordinates?: boolean;
  coordinateSystem?: "WGS84" | "JGD2000" | "WebMercator";
  simplificationLevel?: SimplificationLevel;
  preserveTopology?: boolean;
}
```

## パフォーマンス最適化手法

### 1. 遅延読み込み

```typescript
export class LazyTopoJSONLoader {
  private static cache = new Map<string, Promise<Topology>>();

  /**
   * 遅延読み込みでTopoJSONを取得
   */
  static async loadTopology(
    dataId: string,
    forceReload: boolean = false
  ): Promise<Topology> {
    if (!forceReload && this.cache.has(dataId)) {
      return this.cache.get(dataId)!;
    }

    const loadPromise = this.fetchTopology(dataId);
    this.cache.set(dataId, loadPromise);

    return loadPromise;
  }

  private static async fetchTopology(dataId: string): Promise<Topology> {
    const url = `https://geoshape.ex.nii.ac.jp/city/choropleth/${dataId}.topojson`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch TopoJSON: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error(`Failed to load TopoJSON for ${dataId}:`, error);
      throw error;
    }
  }

  /**
   * キャッシュのクリア
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * 特定のデータのキャッシュをクリア
   */
  static clearCacheFor(dataId: string): void {
    this.cache.delete(dataId);
  }
}
```

### 2. ストリーミング変換

```typescript
export class StreamingTopoJSONConverter {
  /**
   * ストリーミングでTopoJSONを変換
   */
  static async *convertStreaming(
    topology: Topology,
    objectName: string,
    batchSize: number = 100
  ): AsyncGenerator<Feature[], void, unknown> {
    const geometryCollection = topology.objects[
      objectName
    ] as GeometryCollection;

    if (!geometryCollection) {
      throw new Error(`Object '${objectName}' not found in topology`);
    }

    const geometries = geometryCollection.geometries;

    for (let i = 0; i < geometries.length; i += batchSize) {
      const batch = geometries.slice(i, i + batchSize);

      const features = batch.map((geometry) => {
        const geoJSONGeometry = topojson.feature(topology, geometry);

        return {
          type: "Feature" as const,
          geometry: geoJSONGeometry.geometry,
          properties: {
            ...geometry.properties,
            areaCode: AreaCodeExtractor.extractAreaCode(geometry.properties)
              .estatCode,
            name: AreaCodeExtractor.extractAreaCode(geometry.properties).name,
            level: AreaCodeExtractor.extractAreaCode(geometry.properties).level,
          },
        };
      });

      yield features;
    }
  }
}
```

### 3. Web Worker での変換

```typescript
// topojson-worker.ts
export class TopoJSONWorker {
  private worker: Worker;

  constructor() {
    this.worker = new Worker(
      new URL("./topojson-worker.worker.ts", import.meta.url)
    );
  }

  /**
   * Web WorkerでTopoJSONを変換
   */
  convertTopology(
    topology: Topology,
    objectName: string
  ): Promise<FeatureCollection> {
    return new Promise((resolve, reject) => {
      const messageId = Math.random().toString(36);

      const handleMessage = (event: MessageEvent) => {
        if (event.data.id === messageId) {
          this.worker.removeEventListener("message", handleMessage);

          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.result);
          }
        }
      };

      this.worker.addEventListener("message", handleMessage);

      this.worker.postMessage({
        id: messageId,
        topology,
        objectName,
      });
    });
  }

  /**
   * Workerの終了
   */
  terminate(): void {
    this.worker.terminate();
  }
}

// topojson-worker.worker.ts
self.onmessage = function (event) {
  const { id, topology, objectName } = event.data;

  try {
    const geoJSON = TopoJSONConverter.convertToGeoJSON(topology, objectName);

    self.postMessage({
      id,
      result: geoJSON,
    });
  } catch (error) {
    self.postMessage({
      id,
      error: error.message,
    });
  }
};
```

## エラーハンドリング

### エラー種別と対応

```typescript
enum TopoJSONErrorType {
  PARSE_ERROR = "PARSE_ERROR",
  CONVERSION_ERROR = "CONVERSION_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  CACHE_ERROR = "CACHE_ERROR",
}

export class TopoJSONErrorHandler {
  /**
   * エラーハンドリング
   */
  static handleError(error: Error, context: string): void {
    const errorType = this.classifyError(error);

    switch (errorType) {
      case TopoJSONErrorType.PARSE_ERROR:
        console.error(`TopoJSON parse error in ${context}:`, error);
        // フォールバックデータの使用
        break;

      case TopoJSONErrorType.CONVERSION_ERROR:
        console.error(`TopoJSON conversion error in ${context}:`, error);
        // 簡略化レベルの調整
        break;

      case TopoJSONErrorType.VALIDATION_ERROR:
        console.error(`TopoJSON validation error in ${context}:`, error);
        // データの修復またはスキップ
        break;

      case TopoJSONErrorType.NETWORK_ERROR:
        console.error(`Network error in ${context}:`, error);
        // キャッシュからの復旧
        break;

      case TopoJSONErrorType.CACHE_ERROR:
        console.warn(`Cache error in ${context}:`, error);
        // ネットワークからの再取得
        break;

      default:
        console.error(`Unknown error in ${context}:`, error);
    }
  }

  /**
   * エラーの分類
   */
  private static classifyError(error: Error): TopoJSONErrorType {
    if (error.message.includes("parse") || error.message.includes("JSON")) {
      return TopoJSONErrorType.PARSE_ERROR;
    }

    if (
      error.message.includes("convert") ||
      error.message.includes("transform")
    ) {
      return TopoJSONErrorType.CONVERSION_ERROR;
    }

    if (
      error.message.includes("validate") ||
      error.message.includes("invalid")
    ) {
      return TopoJSONErrorType.VALIDATION_ERROR;
    }

    if (error.message.includes("fetch") || error.message.includes("network")) {
      return TopoJSONErrorType.NETWORK_ERROR;
    }

    if (error.message.includes("cache") || error.message.includes("storage")) {
      return TopoJSONErrorType.CACHE_ERROR;
    }

    return TopoJSONErrorType.PARSE_ERROR; // デフォルト
  }
}
```

## まとめ

この TopoJSON/GeoJSON アダプター実装仕様により、以下の機能が実現されます：

1. **効率的なデータ変換**: TopoJSON から GeoJSON への高速変換
2. **パフォーマンス最適化**: 遅延読み込み、ストリーミング、Web Worker
3. **柔軟な簡略化**: ズームレベルやファイルサイズに応じた最適化
4. **堅牢なエラーハンドリング**: 各種エラーに対する適切な対応
5. **Leaflet 統合**: 地図コンポーネントでの直接利用

この仕様に基づいて、Geoshape データを効率的に Leaflet 地図で可視化できます。

---

**作成日**: 2025-10-16  
**最終更新日**: 2025-10-16  
**バージョン**: 1.0.0  
**承認者**: 開発チーム  
**ステータス**: 承認済み
