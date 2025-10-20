---
title: 地理データアダプター仕様書
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/dashboard
  - specifications
  - geographic-data
  - adapter-pattern
  - leaflet
---

# 地理データアダプター仕様書

## 概要

ダッシュボードドメインのアダプターパターンを地理データに拡張し、様々なデータソースから地理情報を取得・変換・統合するための仕様を定義します。Leaflet 統合と連携して、統一された地理データ処理を実現します。

## 地理データアダプターインターフェース

### 基本インターフェース

```typescript
// 地理データアダプターの基本インターフェース
export interface GeographicDataAdapter extends DataAdapter {
  readonly sourceType: "estat" | "gsi" | "osm" | "geojson" | "custom";
  readonly supportsGeographic: true;

  // 地理データ専用メソッド
  fetchGeographicData(
    params: GeographicAdapterParams
  ): Promise<RawGeographicData>;
  transformToGeoJSON(
    data: RawGeographicData
  ): Promise<GeoJSON.FeatureCollection>;
  validateGeographicData(data: RawGeographicData): GeographicValidationResult;
  getGeographicMetadata(
    params: GeographicAdapterParams
  ): Promise<GeographicMetadata>;
}

// 地理データアダプターパラメータ
export interface GeographicAdapterParams extends AdapterParams {
  query: GeographicQuery;
  bounds?: GeographicBounds;
  zoom?: number;
  coordinateSystem?: CoordinateSystem;
}

// 地理データクエリ
export interface GeographicQuery {
  // 基本パラメータ
  areaCode?: string;
  areaLevel?: AreaLevel;
  timeRange?: TimeRange;

  // 地理データ専用パラメータ
  geometry?: GeoJSONGeometry;
  bounds?: GeographicBounds;
  center?: [number, number]; // [lng, lat]
  radius?: number; // メートル

  // データソース固有パラメータ
  [key: string]: any;
}

// 生地理データ
export interface RawGeographicData extends RawDataSourceData {
  source: "estat" | "gsi" | "osm" | "geojson" | "custom";
  data: GeographicSourceData;
  metadata: GeographicDataMetadata;
}

// 地理データソースデータ
export type GeographicSourceData =
  | EstatGeographicData
  | GSIGeographicData
  | OSMGeographicData
  | GeoJSONData
  | CustomGeographicData;

// 地理データメタデータ
export interface GeographicDataMetadata {
  timestamp: string;
  size: number;
  format: "json" | "geojson" | "kml" | "gml";
  coordinateSystem: CoordinateSystem;
  bounds: GeographicBounds;
  featureCount: number;
  source: DataSource;
}

// 地理データ検証結果
export interface GeographicValidationResult extends ValidationResult {
  coordinateSystemValid: boolean;
  boundsValid: boolean;
  geometryValid: boolean;
  spatialIndexValid: boolean;
  errors: GeographicValidationError[];
}

// 地理データ検証エラー
export interface GeographicValidationError {
  type: "coordinate" | "geometry" | "bounds" | "projection";
  message: string;
  featureId?: string;
  coordinates?: [number, number];
}
```

### 座標系と投影法

```typescript
// 座標系定義
export interface CoordinateSystem {
  type: "WGS84" | "JGD2000" | "Tokyo97" | "WebMercator";
  epsg: string;
  name: string;
  bounds: GeographicBounds;
  unit: "degree" | "meter";
}

// 地理的境界
export interface GeographicBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// 座標変換ユーティリティ
export class CoordinateTransformer {
  private static readonly PROJECTIONS = {
    WGS84: {
      epsg: "EPSG:4326",
      bounds: { north: 90, south: -90, east: 180, west: -180 },
    },
    JGD2000: {
      epsg: "EPSG:4612",
      bounds: { north: 46, south: 20, east: 154, west: 122 },
    },
    Tokyo97: {
      epsg: "EPSG:4301",
      bounds: { north: 46, south: 20, east: 154, west: 122 },
    },
    WebMercator: {
      epsg: "EPSG:3857",
      bounds: {
        north: 85.0511,
        south: -85.0511,
        east: 20037508.34,
        west: -20037508.34,
      },
    },
  };

  static transform(
    coordinates: [number, number],
    from: CoordinateSystem,
    to: CoordinateSystem
  ): [number, number] {
    // 座標変換ロジック（proj4js等を使用）
    return this.transformCoordinates(coordinates, from, to);
  }

  static toWebMercator(lat: number, lng: number): [number, number] {
    const x = (lng * 20037508.34) / 180;
    const y =
      Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180);
    const y2 = (y * 20037508.34) / 180;
    return [x, y2];
  }

  static fromWebMercator(x: number, y: number): [number, number] {
    const lng = (x * 180) / 20037508.34;
    const lat =
      (Math.atan(Math.sinh((y * Math.PI) / 20037508.34)) * 180) / Math.PI;
    return [lng, lat];
  }

  private static transformCoordinates(
    coordinates: [number, number],
    from: CoordinateSystem,
    to: CoordinateSystem
  ): [number, number] {
    // 実際の座標変換実装
    // proj4js等のライブラリを使用
    return coordinates; // プレースホルダー
  }
}
```

## データソース別アダプター実装

### 1. e-Stat API 地理データアダプター

```typescript
// e-Stat API地理データアダプター
export class EstatGeographicAdapter implements GeographicDataAdapter {
  readonly sourceType = "estat";
  readonly version = "1.0.0";
  readonly supportsGeographic = true;

  private estatClient: EstatApiClient;
  private transformer: EstatGeographicTransformer;
  private validator: EstatGeographicValidator;

  constructor() {
    this.estatClient = new EstatApiClient();
    this.transformer = new EstatGeographicTransformer();
    this.validator = new EstatGeographicValidator();
  }

  async fetchGeographicData(
    params: GeographicAdapterParams
  ): Promise<RawGeographicData> {
    const { statsDataId, cdCat01, areaCode, ...options } = params.query;

    if (!statsDataId || !cdCat01) {
      throw new Error("statsDataId and cdCat01 are required for e-Stat API");
    }

    const estatParams = {
      appId: process.env.NEXT_PUBLIC_ESTAT_APP_ID,
      statsDataId,
      cdCat01: Array.isArray(cdCat01) ? cdCat01.join(",") : cdCat01,
      cdArea: areaCode || "00000",
      metaGetFlg: "Y",
      cntGetFlg: "N",
      ...options,
    };

    try {
      const response = await this.estatClient.getStatsData(estatParams);

      return {
        source: this.sourceType,
        data: {
          type: "estat",
          response,
          areaCode,
          statsDataId,
          cdCat01,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          size: JSON.stringify(response).length,
          format: "json",
          coordinateSystem: {
            type: "WGS84",
            epsg: "EPSG:4326",
            name: "WGS84",
            bounds: this.getBounds(areaCode),
            unit: "degree",
          },
          bounds: this.getBounds(areaCode),
          featureCount: this.countFeatures(response),
          source: { type: "estat", name: "e-Stat API", version: "3.0" },
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch geographic data from e-Stat API: ${error.message}`
      );
    }
  }

  async transformToGeoJSON(
    data: RawGeographicData
  ): Promise<GeoJSON.FeatureCollection> {
    return this.transformer.transformToGeoJSON(data);
  }

  validateGeographicData(data: RawGeographicData): GeographicValidationResult {
    return this.validator.validate(data);
  }

  async getGeographicMetadata(
    params: GeographicAdapterParams
  ): Promise<GeographicMetadata> {
    return {
      name: "e-Stat API",
      description: "政府統計データAPI（地理データ対応）",
      version: "3.0",
      supportedTypes: ["geographic"],
      supportedAreaLevels: ["national", "prefecture", "municipality"],
      supportedCoordinateSystems: [
        { type: "WGS84", epsg: "EPSG:4326", name: "WGS84" },
        { type: "JGD2000", epsg: "EPSG:4612", name: "日本測地系2000" },
      ],
      supportedTimeRanges: [
        {
          start: "2000-01-01",
          end: new Date().toISOString().split("T")[0],
          frequency: "yearly",
        },
      ],
      rateLimit: {
        requests: 1000,
        period: "day",
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  supports(params: GeographicAdapterParams): boolean {
    return (
      params.source === "estat" &&
      params.query.statsDataId &&
      params.query.cdCat01
    );
  }

  private getBounds(areaCode?: string): GeographicBounds {
    // 地域コードに基づく境界の取得
    if (!areaCode) {
      return { north: 45.5, south: 24.0, east: 146.0, west: 129.0 }; // 日本全体
    }

    // 地域別境界の取得ロジック
    return this.getAreaBounds(areaCode);
  }

  private getAreaBounds(areaCode: string): GeographicBounds {
    // 地域コードから境界を取得する実装
    // 実際の実装では、地域データベースやAPIから取得
    return { north: 35.7, south: 35.6, east: 139.8, west: 139.7 }; // プレースホルダー
  }

  private countFeatures(response: any): number {
    // レスポンスからフィーチャー数をカウント
    return response?.STATISTICAL_DATA?.DATA_INF?.VALUE?.length || 0;
  }
}
```

### 2. 国土地理院 API 地理データアダプター

```typescript
// 国土地理院API地理データアダプター
export class GSIGeographicAdapter implements GeographicDataAdapter {
  readonly sourceType = "gsi";
  readonly version = "1.0.0";
  readonly supportsGeographic = true;

  private gsiClient: GSIApiClient;
  private transformer: GSIGeographicTransformer;
  private validator: GSIGeographicValidator;

  constructor() {
    this.gsiClient = new GSIApiClient();
    this.transformer = new GSIGeographicTransformer();
    this.validator = new GSIGeographicValidator();
  }

  async fetchGeographicData(
    params: GeographicAdapterParams
  ): Promise<RawGeographicData> {
    const { bounds, zoom, ...options } = params;

    if (!bounds) {
      throw new Error("Bounds are required for GSI API");
    }

    const gsiParams = {
      bounds: this.formatBounds(bounds),
      zoom: zoom || 10,
      ...options,
    };

    try {
      const response = await this.gsiClient.getGeographicData(gsiParams);

      return {
        source: this.sourceType,
        data: {
          type: "gsi",
          response,
          bounds,
          zoom,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          size: JSON.stringify(response).length,
          format: "geojson",
          coordinateSystem: {
            type: "JGD2000",
            epsg: "EPSG:4612",
            name: "日本測地系2000",
            bounds,
            unit: "degree",
          },
          bounds,
          featureCount: this.countFeatures(response),
          source: { type: "gsi", name: "国土地理院API", version: "1.0" },
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch geographic data from GSI API: ${error.message}`
      );
    }
  }

  async transformToGeoJSON(
    data: RawGeographicData
  ): Promise<GeoJSON.FeatureCollection> {
    return this.transformer.transformToGeoJSON(data);
  }

  validateGeographicData(data: RawGeographicData): GeographicValidationResult {
    return this.validator.validate(data);
  }

  async getGeographicMetadata(
    params: GeographicAdapterParams
  ): Promise<GeographicMetadata> {
    return {
      name: "国土地理院API",
      description: "国土地理院の地理データAPI",
      version: "1.0",
      supportedTypes: ["geographic"],
      supportedAreaLevels: ["national", "prefecture", "municipality"],
      supportedCoordinateSystems: [
        { type: "JGD2000", epsg: "EPSG:4612", name: "日本測地系2000" },
        { type: "Tokyo97", epsg: "EPSG:4301", name: "日本測地系1997" },
      ],
      supportedTimeRanges: [
        {
          start: "2020-01-01",
          end: new Date().toISOString().split("T")[0],
          frequency: "monthly",
        },
      ],
      rateLimit: {
        requests: 10000,
        period: "day",
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  supports(params: GeographicAdapterParams): boolean {
    return params.source === "gsi" && params.bounds;
  }

  private formatBounds(bounds: GeographicBounds): string {
    return `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`;
  }

  private countFeatures(response: any): number {
    return response?.features?.length || 0;
  }
}
```

### 3. GeoJSON データアダプター

```typescript
// GeoJSONデータアダプター
export class GeoJSONDataAdapter implements GeographicDataAdapter {
  readonly sourceType = "geojson";
  readonly version = "1.0.0";
  readonly supportsGeographic = true;

  private transformer: GeoJSONTransformer;
  private validator: GeoJSONValidator;

  constructor() {
    this.transformer = new GeoJSONTransformer();
    this.validator = new GeoJSONValidator();
  }

  async fetchGeographicData(
    params: GeographicAdapterParams
  ): Promise<RawGeographicData> {
    const { filePath, url, data } = params.query;

    let geoJSONData: GeoJSON.FeatureCollection;

    if (data) {
      geoJSONData = data;
    } else if (filePath) {
      geoJSONData = await this.loadFromFile(filePath);
    } else if (url) {
      geoJSONData = await this.loadFromUrl(url);
    } else {
      throw new Error("filePath, url, or data is required for GeoJSON adapter");
    }

    return {
      source: this.sourceType,
      data: {
        type: "geojson",
        data: geoJSONData,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        size: JSON.stringify(geoJSONData).length,
        format: "geojson",
        coordinateSystem: this.detectCoordinateSystem(geoJSONData),
        bounds: this.calculateBounds(geoJSONData),
        featureCount: geoJSONData.features.length,
        source: { type: "geojson", name: "GeoJSON", version: "1.0" },
      },
    };
  }

  async transformToGeoJSON(
    data: RawGeographicData
  ): Promise<GeoJSON.FeatureCollection> {
    return this.transformer.transformToGeoJSON(data);
  }

  validateGeographicData(data: RawGeographicData): GeographicValidationResult {
    return this.validator.validate(data);
  }

  async getGeographicMetadata(
    params: GeographicAdapterParams
  ): Promise<GeographicMetadata> {
    return {
      name: "GeoJSON",
      description: "GeoJSON形式の地理データ",
      version: "1.0",
      supportedTypes: ["geographic"],
      supportedAreaLevels: ["national", "prefecture", "municipality"],
      supportedCoordinateSystems: [
        { type: "WGS84", epsg: "EPSG:4326", name: "WGS84" },
        { type: "JGD2000", epsg: "EPSG:4612", name: "日本測地系2000" },
      ],
      supportedTimeRanges: [],
      rateLimit: { requests: Infinity, period: "day" },
      lastUpdated: new Date().toISOString(),
    };
  }

  supports(params: GeographicAdapterParams): boolean {
    return (
      params.source === "geojson" &&
      (params.query.filePath || params.query.url || params.query.data)
    );
  }

  private async loadFromFile(
    filePath: string
  ): Promise<GeoJSON.FeatureCollection> {
    // ファイルからGeoJSONを読み込み
    const fs = await import("fs/promises");
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  }

  private async loadFromUrl(url: string): Promise<GeoJSON.FeatureCollection> {
    // URLからGeoJSONを読み込み
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch GeoJSON from ${url}`);
    }
    return response.json();
  }

  private detectCoordinateSystem(
    data: GeoJSON.FeatureCollection
  ): CoordinateSystem {
    // GeoJSONの座標系を検出
    // 実際の実装では、座標値の範囲から座標系を推定
    return {
      type: "WGS84",
      epsg: "EPSG:4326",
      name: "WGS84",
      bounds: this.calculateBounds(data),
      unit: "degree",
    };
  }

  private calculateBounds(data: GeoJSON.FeatureCollection): GeographicBounds {
    let north = -90,
      south = 90,
      east = -180,
      west = 180;

    data.features.forEach((feature) => {
      if (feature.geometry.type === "Point") {
        const [lng, lat] = feature.geometry.coordinates;
        north = Math.max(north, lat);
        south = Math.min(south, lat);
        east = Math.max(east, lng);
        west = Math.min(west, lng);
      }
      // 他のジオメトリタイプの処理も追加
    });

    return { north, south, east, west };
  }
}
```

## 地理データ変換・検証

### 1. 地理データ変換器

```typescript
// 地理データ変換器の基底クラス
export abstract class GeographicTransformer {
  abstract transformToGeoJSON(
    data: RawGeographicData
  ): Promise<GeoJSON.FeatureCollection>;

  protected createFeature(
    geometry: GeoJSONGeometry,
    properties: Record<string, any>,
    id?: string
  ): GeoJSON.Feature {
    return {
      type: "Feature",
      geometry,
      properties: {
        id: id || this.generateId(),
        ...properties,
      },
    };
  }

  protected createPoint(coordinates: [number, number]): GeoJSON.Point {
    return {
      type: "Point",
      coordinates,
    };
  }

  protected createPolygon(coordinates: [number, number][][]): GeoJSON.Polygon {
    return {
      type: "Polygon",
      coordinates,
    };
  }

  protected createMultiPolygon(
    coordinates: [number, number][][][]
  ): GeoJSON.MultiPolygon {
    return {
      type: "MultiPolygon",
      coordinates,
    };
  }

  protected transformCoordinates(
    coordinates: [number, number],
    from: CoordinateSystem,
    to: CoordinateSystem
  ): [number, number] {
    return CoordinateTransformer.transform(coordinates, from, to);
  }

  private generateId(): string {
    return `feature_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// e-Stat地理データ変換器
export class EstatGeographicTransformer extends GeographicTransformer {
  async transformToGeoJSON(
    data: RawGeographicData
  ): Promise<GeoJSON.FeatureCollection> {
    const estatData = data.data as EstatGeographicData;
    const features: GeoJSON.Feature[] = [];

    // e-StatデータをGeoJSONフィーチャーに変換
    for (const value of estatData.response.STATISTICAL_DATA.DATA_INF.VALUE) {
      const areaCode = value["@area"];
      const areaName = value["@area_name"];
      const statValue = parseFloat(value["@value"]);

      // 地域コードから座標を取得
      const coordinates = await this.getAreaCoordinates(areaCode);

      if (coordinates) {
        const feature = this.createFeature(
          this.createPoint(coordinates),
          {
            name: areaName,
            value: statValue,
            areaCode,
            source: "estat",
          },
          areaCode
        );

        features.push(feature);
      }
    }

    return {
      type: "FeatureCollection",
      features,
    };
  }

  private async getAreaCoordinates(
    areaCode: string
  ): Promise<[number, number] | null> {
    // 地域コードから座標を取得する実装
    // 実際の実装では、地域データベースから取得
    return [139.6917, 35.6895]; // プレースホルダー（東京）
  }
}
```

### 2. 地理データ検証器

```typescript
// 地理データ検証器の基底クラス
export abstract class GeographicValidator {
  abstract validate(data: RawGeographicData): GeographicValidationResult;

  protected validateCoordinateSystem(
    data: RawGeographicData,
    expected: CoordinateSystem
  ): boolean {
    const actual = data.metadata.coordinateSystem;
    return actual.type === expected.type && actual.epsg === expected.epsg;
  }

  protected validateBounds(data: RawGeographicData): boolean {
    const bounds = data.metadata.bounds;
    return (
      bounds.north > bounds.south &&
      bounds.east > bounds.west &&
      bounds.north <= 90 &&
      bounds.south >= -90 &&
      bounds.east <= 180 &&
      bounds.west >= -180
    );
  }

  protected validateGeometry(feature: GeoJSON.Feature): boolean {
    if (!feature.geometry) return false;

    switch (feature.geometry.type) {
      case "Point":
        return this.validatePoint(feature.geometry);
      case "Polygon":
        return this.validatePolygon(feature.geometry);
      case "MultiPolygon":
        return this.validateMultiPolygon(feature.geometry);
      default:
        return false;
    }
  }

  private validatePoint(geometry: GeoJSON.Point): boolean {
    const [lng, lat] = geometry.coordinates;
    return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
  }

  private validatePolygon(geometry: GeoJSON.Polygon): boolean {
    return geometry.coordinates.every(
      (ring) =>
        ring.length >= 4 &&
        ring[0][0] === ring[ring.length - 1][0] &&
        ring[0][1] === ring[ring.length - 1][1]
    );
  }

  private validateMultiPolygon(geometry: GeoJSON.MultiPolygon): boolean {
    return geometry.coordinates.every((polygon) =>
      this.validatePolygon({ type: "Polygon", coordinates: polygon })
    );
  }
}

// e-Stat地理データ検証器
export class EstatGeographicValidator extends GeographicValidator {
  validate(data: RawGeographicData): GeographicValidationResult {
    const errors: GeographicValidationError[] = [];

    // 座標系の検証
    const coordinateSystemValid = this.validateCoordinateSystem(data, {
      type: "WGS84",
      epsg: "EPSG:4326",
      name: "WGS84",
      bounds: data.metadata.bounds,
      unit: "degree",
    });

    if (!coordinateSystemValid) {
      errors.push({
        type: "coordinate",
        message: "Invalid coordinate system",
      });
    }

    // 境界の検証
    const boundsValid = this.validateBounds(data);

    if (!boundsValid) {
      errors.push({
        type: "bounds",
        message: "Invalid geographic bounds",
      });
    }

    // ジオメトリの検証
    const geoJSON = data.data as EstatGeographicData;
    let geometryValid = true;

    if (geoJSON.response?.STATISTICAL_DATA?.DATA_INF?.VALUE) {
      for (const value of geoJSON.response.STATISTICAL_DATA.DATA_INF.VALUE) {
        const areaCode = value["@area"];
        const coordinates = this.getAreaCoordinates(areaCode);

        if (coordinates) {
          const feature: GeoJSON.Feature = {
            type: "Feature",
            geometry: { type: "Point", coordinates },
            properties: {},
          };

          if (!this.validateGeometry(feature)) {
            geometryValid = false;
            errors.push({
              type: "geometry",
              message: `Invalid geometry for area ${areaCode}`,
              featureId: areaCode,
              coordinates,
            });
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.map((e) => e.message),
      coordinateSystemValid,
      boundsValid,
      geometryValid,
      spatialIndexValid: true, // プレースホルダー
      errors: errors,
    };
  }

  private getAreaCoordinates(areaCode: string): [number, number] | null {
    // 地域コードから座標を取得
    return [139.6917, 35.6895]; // プレースホルダー
  }
}
```

## 地理データレジストリ

```typescript
// 地理データアダプターレジストリ
export class GeographicAdapterRegistry {
  private adapters: Map<string, GeographicDataAdapter> = new Map();

  register(adapter: GeographicDataAdapter): void {
    this.adapters.set(adapter.sourceType, adapter);
  }

  getAdapter(sourceType: string): GeographicDataAdapter | undefined {
    return this.adapters.get(sourceType);
  }

  getBestAdapter(
    params: GeographicAdapterParams
  ): GeographicDataAdapter | undefined {
    // パラメータに基づいて最適なアダプターを選択
    for (const adapter of this.adapters.values()) {
      if (adapter.supports(params)) {
        return adapter;
      }
    }
    return undefined;
  }

  getSupportedSources(): string[] {
    return Array.from(this.adapters.keys());
  }
}

// 地理データサービス
export class GeographicDataService {
  private static registry: GeographicAdapterRegistry;
  private static cache: CacheService;

  static async initialize(): Promise<void> {
    this.registry = new GeographicAdapterRegistry();
    this.cache = new CacheService();

    // アダプターを登録
    this.registry.register(new EstatGeographicAdapter());
    this.registry.register(new GSIGeographicAdapter());
    this.registry.register(new GeoJSONDataAdapter());
  }

  static async fetchGeographicData(
    params: GeographicAdapterParams
  ): Promise<GeographicData> {
    const cacheKey = this.generateCacheKey(params);

    // キャッシュチェック
    const cachedData = await this.cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // アダプター選択
    const adapter = this.registry.getBestAdapter(params);
    if (!adapter) {
      throw new Error(`Unsupported geographic data source: ${params.source}`);
    }

    // データ取得
    const rawData = await adapter.fetchGeographicData(params);

    // データ検証
    const validation = adapter.validateGeographicData(rawData);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors);
    }

    // データ変換
    const geoJSON = await adapter.transformToGeoJSON(rawData);
    const geographicData: GeographicData = {
      type: "geographic",
      features: geoJSON.features,
      bounds: rawData.metadata.bounds,
      baseMap: this.getBaseMapConfig(params.source),
      layers: this.createLayers(geoJSON.features, params),
    };

    // キャッシュ保存
    await this.cache.set(cacheKey, geographicData);

    return geographicData;
  }

  private static generateCacheKey(params: GeographicAdapterParams): string {
    return `geographic:${params.source}:${JSON.stringify(params.query)}`;
  }

  private static getBaseMapConfig(source: string): BaseMapConfig {
    const configs = {
      estat: {
        provider: "osm",
        tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: "© OpenStreetMap contributors",
      },
      gsi: {
        provider: "gsi",
        tileUrl: "https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png",
        attribution: "© 国土地理院",
      },
      geojson: {
        provider: "osm",
        tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: "© OpenStreetMap contributors",
      },
    };

    return configs[source] || configs.osm;
  }

  private static createLayers(
    features: GeoJSON.Feature[],
    params: GeographicAdapterParams
  ): MapLayer[] {
    return [
      {
        id: "main-layer",
        name: "メインレイヤー",
        type: "marker",
        visible: true,
        opacity: 1.0,
        data: features,
        style: {
          color: "#3388ff",
          radius: 8,
        },
      },
    ];
  }
}
```

## まとめ

この地理データアダプター仕様により、以下の機能が実現されます：

1. **統一された地理データ処理**: 様々なデータソースからの地理データを統一されたインターフェースで処理
2. **座標系の自動変換**: 異なる座標系間の自動変換と正規化
3. **データ検証**: 地理データの妥当性検証とエラーハンドリング
4. **キャッシュ機能**: 地理データの効率的なキャッシュと再利用
5. **拡張性**: 新しいデータソースの簡単な追加

既存のダッシュボードアダプターパターンと統合することで、地理データと統計データをシームレスに連携させ、リッチな地図可視化機能を実現できます。

---

**作成日**: 2025-10-16  
**最終更新日**: 2025-10-16  
**バージョン**: 1.0.0  
**承認者**: 開発チーム  
**ステータス**: 承認済み
