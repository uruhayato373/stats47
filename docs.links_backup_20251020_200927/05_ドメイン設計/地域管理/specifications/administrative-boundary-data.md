---
title: 行政区域データ管理仕様
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/area
  - specifications
  - administrative-boundaries
  - geoshape
  - data-management
---

# 行政区域データ管理仕様

## 概要

stats47 プロジェクトにおける行政区域データ（都道府県・市区町村）の管理方針と実装仕様を定義します。Geoshape データセットを基盤とし、e-Stat 地域コードとの統合、データバージョン管理、効率的なデータアクセスを実現します。

## データ格納ディレクトリ構造

### ディレクトリ構成

```
src/data/geoshape/
├── prefectures/
│   ├── jp_pref.topojson          # 日本全国都道府県（TopoJSON）
│   └── jp_pref.geojson           # 日本全国都道府県（GeoJSON）
├── municipalities/
│   ├── 01_city.topojson          # 北海道市区町村
│   ├── 01_city.geojson           # 北海道市区町村（GeoJSON）
│   ├── 13_city.topojson          # 東京都市区町村
│   ├── 13_city.geojson           # 東京都市区町村（GeoJSON）
│   ├── ...
│   ├── 47_city.topojson          # 沖縄県市区町村
│   └── 47_city.geojson           # 沖縄県市区町村（GeoJSON）
├── municipalities-merged/         # 政令指定都市統合版
│   ├── 01_city_dc.topojson       # 北海道（政令指定都市統合版）
│   ├── 01_city_dc.geojson        # 北海道（政令指定都市統合版）
│   ├── ...
│   ├── 47_city_dc.topojson       # 沖縄県（政令指定都市統合版）
│   └── 47_city_dc.geojson        # 沖縄県（政令指定都市統合版）
├── historical/                   # 歴史的データ（将来拡張）
│   ├── 1889/
│   ├── 1920/
│   └── ...
└── metadata/
    ├── version.json              # データバージョン情報
    ├── license.json              # ライセンス情報
    ├── area-code-mapping.json    # 地域コードマッピング
    ├── data-catalog.json         # データカタログ
    └── quality-report.json       # データ品質レポート
```

### ファイル命名規則

```typescript
interface FileNamingConvention {
  // 都道府県データ
  prefecture: {
    topojson: "jp_pref.topojson";
    geojson: "jp_pref.geojson";
  };

  // 市区町村データ
  municipality: {
    topojson: "{prefectureCode}_city.topojson";
    geojson: "{prefectureCode}_city.geojson";
  };

  // 政令指定都市統合版
  municipalityMerged: {
    topojson: "{prefectureCode}_city_dc.topojson";
    geojson: "{prefectureCode}_city_dc.geojson";
  };

  // 歴史的データ（将来拡張）
  historical: {
    topojson: "{prefectureCode}_city_{year}.topojson";
    geojson: "{prefectureCode}_city_{year}.geojson";
  };
}
```

## データバージョン管理方針

### バージョン情報構造

```typescript
interface DataVersionInfo {
  version: string; // データバージョン（例: "2024.03.31"）
  releaseDate: string; // リリース日
  sourceVersion: string; // Geoshape ソースバージョン
  lastUpdated: string; // 最終更新日時
  dataTypes: {
    prefectures: DataTypeInfo;
    municipalities: DataTypeInfo;
    municipalitiesMerged: DataTypeInfo;
  };
  statistics: {
    totalPrefectures: number; // 都道府県数
    totalMunicipalities: number; // 市区町村数
    totalFeatures: number; // 総フィーチャー数
    totalFileSize: number; // 総ファイルサイズ（bytes）
  };
  checksums: {
    [fileName: string]: string; // ファイルチェックサム
  };
}

interface DataTypeInfo {
  count: number; // データ件数
  lastModified: string; // 最終更新日時
  format: "topojson" | "geojson"; // データ形式
  size: number; // ファイルサイズ
  quality: "high" | "medium" | "low"; // データ品質
}
```

### バージョン管理戦略

1. **メジャーバージョン**: 年単位（例: 2024）
2. **マイナーバージョン**: 月単位（例: 03）
3. **パッチバージョン**: 日単位（例: 31）
4. **ビルド番号**: 同一日の複数更新（例: 01, 02）

```typescript
// バージョン管理の実装例
export class DataVersionManager {
  private static readonly VERSION_PATTERN =
    /^(\d{4})\.(\d{2})\.(\d{2})(?:\.(\d{2}))?$/;

  /**
   * バージョン文字列の解析
   */
  static parseVersion(version: string): {
    year: number;
    month: number;
    day: number;
    build?: number;
  } {
    const match = version.match(this.VERSION_PATTERN);
    if (!match) {
      throw new Error(`Invalid version format: ${version}`);
    }

    return {
      year: parseInt(match[1]),
      month: parseInt(match[2]),
      day: parseInt(match[3]),
      build: match[4] ? parseInt(match[4]) : undefined,
    };
  }

  /**
   * バージョン比較
   */
  static compareVersions(version1: string, version2: string): number {
    const v1 = this.parseVersion(version1);
    const v2 = this.parseVersion(version2);

    if (v1.year !== v2.year) return v1.year - v2.year;
    if (v1.month !== v2.month) return v1.month - v2.month;
    if (v1.day !== v2.day) return v1.day - v2.day;
    if (v1.build !== v2.build) return (v1.build || 0) - (v2.build || 0);

    return 0;
  }

  /**
   * 最新バージョンの確認
   */
  static async checkLatestVersion(): Promise<string> {
    try {
      const response = await fetch("/api/geoshape/version");
      const versionInfo = await response.json();
      return versionInfo.version;
    } catch (error) {
      console.warn("Failed to check latest version:", error);
      return "2024.03.31"; // フォールバック
    }
  }
}
```

## 都道府県・市区町村・政令指定都市の扱い

### 地域レベル定義

```typescript
enum AreaLevel {
  NATIONAL = "national", // 全国レベル
  PREFECTURE = "prefecture", // 都道府県レベル
  MUNICIPALITY = "municipality", // 市区町村レベル
  MUNICIPALITY_MERGED = "municipality_merged", // 政令指定都市統合版
}

interface AreaLevelConfig {
  level: AreaLevel;
  dataFile: string;
  objectName: string;
  featureCount: number;
  bounds: GeographicBounds;
  supportedYears?: number[]; // 歴史的データ対応
}
```

### 地域データ管理

```typescript
export class AdministrativeBoundaryManager {
  private static readonly AREA_CONFIGS: Record<AreaLevel, AreaLevelConfig> = {
    [AreaLevel.NATIONAL]: {
      level: AreaLevel.NATIONAL,
      dataFile: "jp_pref.topojson",
      objectName: "jp_pref",
      featureCount: 47,
      bounds: { north: 45.5, south: 24.0, east: 146.0, west: 129.0 },
    },
    [AreaLevel.PREFECTURE]: {
      level: AreaLevel.PREFECTURE,
      dataFile: "jp_pref.topojson",
      objectName: "jp_pref",
      featureCount: 47,
      bounds: { north: 45.5, south: 24.0, east: 146.0, west: 129.0 },
    },
    [AreaLevel.MUNICIPALITY]: {
      level: AreaLevel.MUNICIPALITY,
      dataFile: "{prefectureCode}_city.topojson",
      objectName: "{prefectureCode}_city",
      featureCount: 0, // 都道府県により異なる
      bounds: { north: 0, south: 0, east: 0, west: 0 }, // 都道府県により異なる
    },
    [AreaLevel.MUNICIPALITY_MERGED]: {
      level: AreaLevel.MUNICIPALITY_MERGED,
      dataFile: "{prefectureCode}_city_dc.topojson",
      objectName: "{prefectureCode}_city_dc",
      featureCount: 0, // 都道府県により異なる
      bounds: { north: 0, south: 0, east: 0, west: 0 }, // 都道府県により異なる
    },
  };

  /**
   * 地域レベルに応じたデータファイルパスを取得
   */
  static getDataFilePath(level: AreaLevel, prefectureCode?: string): string {
    const config = this.AREA_CONFIGS[level];

    if (!config) {
      throw new Error(`Unsupported area level: ${level}`);
    }

    let filePath = config.dataFile;

    // プレースホルダーの置換
    if (prefectureCode) {
      const paddedCode = prefectureCode.padStart(2, "0");
      filePath = filePath.replace("{prefectureCode}", paddedCode);
    }

    return `src/data/geoshape/${this.getSubDirectory(level)}/${filePath}`;
  }

  /**
   * 地域レベルに応じたサブディレクトリを取得
   */
  private static getSubDirectory(level: AreaLevel): string {
    switch (level) {
      case AreaLevel.NATIONAL:
      case AreaLevel.PREFECTURE:
        return "prefectures";
      case AreaLevel.MUNICIPALITY:
        return "municipalities";
      case AreaLevel.MUNICIPALITY_MERGED:
        return "municipalities-merged";
      default:
        throw new Error(`Unsupported area level: ${level}`);
    }
  }

  /**
   * 都道府県コードの検証
   */
  static validatePrefectureCode(code: string): boolean {
    const numCode = parseInt(code);
    return numCode >= 1 && numCode <= 47;
  }

  /**
   * 市区町村コードの検証
   */
  static validateMunicipalityCode(code: string): boolean {
    if (code.length !== 5) return false;

    const prefectureCode = code.substring(0, 2);
    const municipalityCode = code.substring(2);

    return (
      this.validatePrefectureCode(prefectureCode) && municipalityCode !== "000"
    );
  }
}
```

## 歴史的データの管理

### タイムスライダー対応

```typescript
interface HistoricalDataConfig {
  year: number;
  description: string;
  dataSource: string;
  coverage: {
    prefectures: number;
    municipalities: number;
  };
  changes: {
    merged: string[]; // 合併された市区町村
    split: string[]; // 分割された市区町村
    renamed: string[]; // 名称変更された市区町村
  };
}

export class HistoricalDataManager {
  private static readonly HISTORICAL_YEARS = [
    1889, 1920, 1947, 1953, 1968, 1975, 1980, 1985, 1990, 1995, 2000, 2005,
    2010, 2015, 2020, 2023,
  ];

  /**
   * 利用可能な歴史的年の一覧を取得
   */
  static getAvailableYears(): number[] {
    return [...this.HISTORICAL_YEARS];
  }

  /**
   * 指定年のデータ設定を取得
   */
  static getHistoricalConfig(year: number): HistoricalDataConfig | null {
    const configs: Record<number, HistoricalDataConfig> = {
      2023: {
        year: 2023,
        description: "最新の行政区域（2023年）",
        dataSource: "Geoshape 2024.03.31",
        coverage: { prefectures: 47, municipalities: 1898 },
        changes: { merged: [], split: [], renamed: [] },
      },
      2020: {
        year: 2020,
        description: "2020年国勢調査時点の行政区域",
        dataSource: "Geoshape Historical",
        coverage: { prefectures: 47, municipalities: 1900 },
        changes: { merged: ["13101", "13102"], split: [], renamed: [] },
      },
      // 他の年の設定...
    };

    return configs[year] || null;
  }

  /**
   * タイムスライダーの設定を取得
   */
  static getTimeSliderConfig(): {
    min: number;
    max: number;
    step: number;
    marks: Record<number, string>;
  } {
    const years = this.getAvailableYears();

    return {
      min: Math.min(...years),
      max: Math.max(...years),
      step: 1,
      marks: years.reduce((acc, year) => {
        acc[year] = year.toString();
        return acc;
      }, {} as Record<number, string>),
    };
  }
}
```

## データ更新ワークフロー

### 更新プロセス

```typescript
export class DataUpdateWorkflow {
  /**
   * データ更新の実行
   */
  static async executeUpdate(): Promise<UpdateResult> {
    try {
      // 1. 最新バージョンの確認
      const latestVersion = await this.checkLatestVersion();
      const currentVersion = await this.getCurrentVersion();

      if (this.compareVersions(latestVersion, currentVersion) <= 0) {
        return { success: true, message: "Already up to date" };
      }

      // 2. データのダウンロード
      const downloadResult = await this.downloadLatestData(latestVersion);

      // 3. データの検証
      const validationResult = await this.validateData(downloadResult);

      if (!validationResult.isValid) {
        throw new Error(
          `Data validation failed: ${validationResult.errors.join(", ")}`
        );
      }

      // 4. データの変換（TopoJSON → GeoJSON）
      const conversionResult = await this.convertData(downloadResult);

      // 5. データの保存
      await this.saveData(conversionResult);

      // 6. メタデータの更新
      await this.updateMetadata(latestVersion);

      // 7. キャッシュのクリア
      await this.clearCache();

      return {
        success: true,
        message: `Updated to version ${latestVersion}`,
        version: latestVersion,
        statistics: conversionResult.statistics,
      };
    } catch (error) {
      console.error("Data update failed:", error);
      return {
        success: false,
        message: error.message,
        error: error,
      };
    }
  }

  /**
   * データのダウンロード
   */
  private static async downloadLatestData(
    version: string
  ): Promise<DownloadResult> {
    const baseUrl = "https://geoshape.ex.nii.ac.jp/city/choropleth";
    const files = [
      "jp_pref.topojson",
      // 各都道府県の市区町村データ
      ...Array.from(
        { length: 47 },
        (_, i) => `${(i + 1).toString().padStart(2, "0")}_city.topojson`
      ),
      // 政令指定都市統合版
      ...Array.from(
        { length: 47 },
        (_, i) => `${(i + 1).toString().padStart(2, "0")}_city_dc.topojson`
      ),
    ];

    const downloadPromises = files.map(async (file) => {
      const url = `${baseUrl}/${file}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to download ${file}: ${response.statusText}`);
      }

      return {
        fileName: file,
        data: await response.json(),
        size: response.headers.get("content-length") || "0",
      };
    });

    const results = await Promise.all(downloadPromises);

    return {
      version,
      files: results,
      totalSize: results.reduce((sum, file) => sum + parseInt(file.size), 0),
    };
  }

  /**
   * データの検証
   */
  private static async validateData(
    downloadResult: DownloadResult
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    // ファイル数の検証
    const expectedFileCount = 1 + 47 + 47; // 都道府県 + 市区町村 + 政令指定都市統合版
    if (downloadResult.files.length !== expectedFileCount) {
      errors.push(
        `Expected ${expectedFileCount} files, got ${downloadResult.files.length}`
      );
    }

    // 各ファイルの検証
    for (const file of downloadResult.files) {
      try {
        this.validateTopoJSON(file.data);
      } catch (error) {
        errors.push(`Invalid TopoJSON in ${file.fileName}: ${error.message}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * TopoJSON の検証
   */
  private static validateTopoJSON(data: any): void {
    if (!data.type || data.type !== "Topology") {
      throw new Error("Invalid TopoJSON: missing or invalid type");
    }

    if (!data.objects || typeof data.objects !== "object") {
      throw new Error("Invalid TopoJSON: missing objects");
    }

    if (!Array.isArray(data.arcs)) {
      throw new Error("Invalid TopoJSON: missing arcs");
    }
  }
}

interface UpdateResult {
  success: boolean;
  message: string;
  version?: string;
  statistics?: any;
  error?: Error;
}

interface DownloadResult {
  version: string;
  files: Array<{
    fileName: string;
    data: any;
    size: string;
  }>;
  totalSize: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
```

## e-Stat 地域コードとの統合

### 地域コードマッピング

```typescript
export class AreaCodeIntegration {
  private static readonly AREA_CODE_MAPPING = new Map<string, AreaCodeInfo>();

  /**
   * 地域コードマッピングの初期化
   */
  static async initializeMapping(): Promise<void> {
    try {
      const response = await fetch("/api/area-codes/mapping");
      const mapping = await response.json();

      for (const [code, info] of Object.entries(mapping)) {
        this.AREA_CODE_MAPPING.set(code, info as AreaCodeInfo);
      }
    } catch (error) {
      console.error("Failed to initialize area code mapping:", error);
      throw error;
    }
  }

  /**
   * e-Stat 地域コードから Geoshape ID への変換
   */
  static convertEstatToGeoshape(estatCode: string): string {
    const info = this.AREA_CODE_MAPPING.get(estatCode);
    return info?.geoshapeId || estatCode;
  }

  /**
   * Geoshape ID から e-Stat 地域コードへの変換
   */
  static convertGeoshapeToEstat(geoshapeId: string): string {
    for (const [code, info] of this.AREA_CODE_MAPPING) {
      if (info.geoshapeId === geoshapeId) {
        return code;
      }
    }
    return geoshapeId;
  }

  /**
   * 地域レベルに応じたコードの正規化
   */
  static normalizeAreaCode(code: string, level: AreaLevel): string {
    switch (level) {
      case AreaLevel.PREFECTURE:
        return code.padStart(2, "0") + "000";
      case AreaLevel.MUNICIPALITY:
        return code.padStart(5, "0");
      default:
        return code;
    }
  }
}

interface AreaCodeInfo {
  estatCode: string;
  geoshapeId: string;
  name: string;
  level: AreaLevel;
  parentCode?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}
```

## データインポート・エクスポートツール

### インポートツール

```typescript
export class DataImportTool {
  /**
   * Geoshape データのインポート
   */
  static async importGeoshapeData(
    sourceUrl: string,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    try {
      // 1. データのダウンロード
      const rawData = await this.downloadData(sourceUrl);

      // 2. データの検証
      const validation = await this.validateData(rawData, options);

      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
      }

      // 3. データの変換
      const convertedData = await this.convertData(rawData, options);

      // 4. データの保存
      const saveResult = await this.saveData(convertedData, options);

      return {
        success: true,
        importedFiles: saveResult.files,
        statistics: saveResult.statistics,
        warnings: validation.warnings,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error,
      };
    }
  }

  /**
   * カスタムデータのインポート
   */
  static async importCustomData(
    file: File,
    format: "geojson" | "topojson" | "shapefile",
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    try {
      const rawData = await this.parseFile(file, format);
      const validation = await this.validateCustomData(rawData, options);

      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
      }

      const convertedData = await this.convertCustomData(rawData, options);
      const saveResult = await this.saveData(convertedData, options);

      return {
        success: true,
        importedFiles: saveResult.files,
        statistics: saveResult.statistics,
        warnings: validation.warnings,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error,
      };
    }
  }
}

interface ImportOptions {
  targetLevel?: AreaLevel;
  prefectureCode?: string;
  year?: number;
  format?: "topojson" | "geojson";
  validateGeometry?: boolean;
  normalizeCoordinates?: boolean;
}

interface ImportResult {
  success: boolean;
  importedFiles?: string[];
  statistics?: any;
  warnings?: string[];
  error?: string;
  details?: any;
}
```

### エクスポートツール

```typescript
export class DataExportTool {
  /**
   * データのエクスポート
   */
  static async exportData(
    level: AreaLevel,
    prefectureCode?: string,
    format: "geojson" | "topojson" | "csv" = "geojson"
  ): Promise<ExportResult> {
    try {
      // 1. データの読み込み
      const data = await this.loadData(level, prefectureCode);

      // 2. データの変換
      const convertedData = await this.convertForExport(data, format);

      // 3. ファイルの生成
      const fileContent = await this.generateFile(convertedData, format);

      // 4. ダウンロードの実行
      const fileName = this.generateFileName(level, prefectureCode, format);
      this.downloadFile(fileContent, fileName);

      return {
        success: true,
        fileName,
        size: fileContent.length,
        format,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error,
      };
    }
  }

  /**
   * バッチエクスポート
   */
  static async batchExport(
    levels: AreaLevel[],
    format: "geojson" | "topojson" = "geojson"
  ): Promise<BatchExportResult> {
    const results: ExportResult[] = [];

    for (const level of levels) {
      if (
        level === AreaLevel.MUNICIPALITY ||
        level === AreaLevel.MUNICIPALITY_MERGED
      ) {
        // 市区町村データは都道府県ごとにエクスポート
        for (let i = 1; i <= 47; i++) {
          const prefectureCode = i.toString().padStart(2, "0");
          const result = await this.exportData(level, prefectureCode, format);
          results.push(result);
        }
      } else {
        const result = await this.exportData(level, undefined, format);
        results.push(result);
      }
    }

    return {
      success: results.every((r) => r.success),
      results,
      totalFiles: results.length,
      successfulFiles: results.filter((r) => r.success).length,
    };
  }
}

interface ExportResult {
  success: boolean;
  fileName?: string;
  size?: number;
  format?: string;
  error?: string;
  details?: any;
}

interface BatchExportResult {
  success: boolean;
  results: ExportResult[];
  totalFiles: number;
  successfulFiles: number;
}
```

## データ検証とテスト

### 検証フレームワーク

```typescript
export class DataValidationFramework {
  /**
   * 包括的なデータ検証
   */
  static async validateAllData(): Promise<ValidationReport> {
    const results: ValidationResult[] = [];

    // 1. 都道府県データの検証
    results.push(await this.validatePrefectureData());

    // 2. 市区町村データの検証
    for (let i = 1; i <= 47; i++) {
      const prefectureCode = i.toString().padStart(2, "0");
      results.push(await this.validateMunicipalityData(prefectureCode));
    }

    // 3. 政令指定都市統合版の検証
    for (let i = 1; i <= 47; i++) {
      const prefectureCode = i.toString().padStart(2, "0");
      results.push(await this.validateMergedMunicipalityData(prefectureCode));
    }

    // 4. 地域コードマッピングの検証
    results.push(await this.validateAreaCodeMapping());

    // 5. メタデータの検証
    results.push(await this.validateMetadata());

    return this.generateReport(results);
  }

  /**
   * 都道府県データの検証
   */
  private static async validatePrefectureData(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const data = await this.loadData(AreaLevel.PREFECTURE);

      // フィーチャー数の検証
      if (data.features.length !== 47) {
        errors.push(`Expected 47 prefectures, got ${data.features.length}`);
      }

      // 地域コードの検証
      const codes = new Set<string>();
      for (const feature of data.features) {
        const code = feature.properties?.estatCode;
        if (!code) {
          errors.push("Missing estatCode in prefecture feature");
        } else if (codes.has(code)) {
          errors.push(`Duplicate estatCode: ${code}`);
        } else {
          codes.add(code);
        }
      }

      // ジオメトリの検証
      for (const feature of data.features) {
        if (!feature.geometry) {
          errors.push("Missing geometry in prefecture feature");
        } else {
          const geomValidation = this.validateGeometry(feature.geometry);
          if (!geomValidation.isValid) {
            errors.push(...geomValidation.errors);
          }
        }
      }
    } catch (error) {
      errors.push(`Failed to load prefecture data: ${error.message}`);
    }

    return {
      category: "prefecture",
      isValid: errors.length === 0,
      errors,
      warnings,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * ジオメトリの検証
   */
  private static validateGeometry(geometry: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!geometry.type) {
      errors.push("Missing geometry type");
    }

    if (!geometry.coordinates) {
      errors.push("Missing coordinates");
    }

    // 座標の検証
    if (geometry.coordinates) {
      const coordValidation = this.validateCoordinates(geometry.coordinates);
      if (!coordValidation.isValid) {
        errors.push(...coordValidation.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 座標の検証
   */
  private static validateCoordinates(coordinates: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 日本の範囲内かチェック
    const japanBounds = {
      north: 45.5,
      south: 24.0,
      east: 146.0,
      west: 129.0,
    };

    const validatePoint = (point: number[]) => {
      const [lng, lat] = point;

      if (lat < japanBounds.south || lat > japanBounds.north) {
        errors.push(`Latitude out of bounds: ${lat}`);
      }

      if (lng < japanBounds.west || lng > japanBounds.east) {
        errors.push(`Longitude out of bounds: ${lng}`);
      }
    };

    // 座標配列の再帰的検証
    const validateCoords = (coords: any) => {
      if (Array.isArray(coords)) {
        if (typeof coords[0] === "number") {
          validatePoint(coords);
        } else {
          coords.forEach(validateCoords);
        }
      }
    };

    validateCoords(coordinates);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

interface ValidationResult {
  category: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  timestamp: string;
}

interface ValidationReport {
  overallValid: boolean;
  results: ValidationResult[];
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    totalErrors: number;
    totalWarnings: number;
  };
  generatedAt: string;
}
```

## まとめ

この行政区域データ管理仕様により、以下の機能が実現されます：

1. **体系的なデータ管理**: 階層化されたディレクトリ構造とファイル命名規則
2. **バージョン管理**: データの更新履歴と品質管理
3. **多様な地域レベル対応**: 都道府県・市区町村・政令指定都市統合版
4. **歴史的データ対応**: タイムスライダーによる過去の行政区域表示
5. **e-Stat 統合**: 地域コードの相互変換とマッピング
6. **データ品質保証**: 包括的な検証フレームワークとテスト
7. **効率的な更新**: 自動化されたデータ更新ワークフロー

この仕様に基づいて、高品質で信頼性の高い行政区域データ管理システムを構築できます。

---

**作成日**: 2025-10-16  
**最終更新日**: 2025-10-16  
**バージョン**: 1.0.0  
**承認者**: 開発チーム  
**ステータス**: 承認済み
