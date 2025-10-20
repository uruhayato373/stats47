---
title: アダプター実装ガイド
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/dashboard
  - implementation
  - adapter-pattern
  - guide
---

# アダプター実装ガイド

## 概要

このガイドでは、ダッシュボードデータソース抽象化のためのアダプター実装方法を説明します。各データソース（e-Stat API、CSV、独自 API 等）に対応するアダプターの作成手順、ベストプラクティス、テスト戦略を提供します。

## アダプター実装の基本手順

### 1. 基本構造の作成

新しいアダプターを作成する際は、以下の基本構造に従います：

```typescript
// src/lib/dashboard/adapters/[source-type]/[source-name]-adapter.ts
import { DataAdapter, AdapterParams, RawDataSourceData, DashboardData, ValidationResult, DataSourceMetadata } from '@/lib/dashboard/core/interfaces';

export class [SourceName]DataAdapter implements DataAdapter {
  readonly sourceType = '[source-type]';
  readonly version = '1.0.0';

  // 必須メソッドの実装
  async fetchData(params: AdapterParams): Promise<RawDataSourceData> {
    // データ取得ロジック
  }

  async transform(data: RawDataSourceData, options?: TransformOptions): Promise<DashboardData> {
    // データ変換ロジック
  }

  validate(data: RawDataSourceData): ValidationResult {
    // データ検証ロジック
  }

  async getMetadata(params: AdapterParams): Promise<DataSourceMetadata> {
    // メタデータ取得ロジック
  }

  supports(params: AdapterParams): boolean {
    // サポート状況確認ロジック
  }
}
```

### 2. インデックスファイルの作成

```typescript
// src/lib/dashboard/adapters/[source-type]/index.ts
export { [SourceName]DataAdapter } from './[source-name]-adapter';
export { [SourceName]Transformer } from './[source-name]-transformer';
export { [SourceName]Validator } from './[source-name]-validator';
```

## 各データソースの実装例

### e-Stat API アダプター

#### 1. アダプター実装

```typescript
// src/lib/dashboard/adapters/estat/estat-adapter.ts
import {
  DataAdapter,
  AdapterParams,
  RawDataSourceData,
  DashboardData,
  ValidationResult,
  DataSourceMetadata,
  DataType,
  AreaLevel,
} from "@/lib/dashboard/core/interfaces";
import { EstatApiClient } from "@/lib/estat-api";
import { EstatTransformer } from "./estat-transformer";
import { EstatValidator } from "./estat-validator";

export class EstatDataAdapter implements DataAdapter {
  readonly sourceType = "estat";
  readonly version = "1.0.0";

  private transformer: EstatTransformer;
  private validator: EstatValidator;

  constructor() {
    this.transformer = new EstatTransformer();
    this.validator = new EstatValidator();
  }

  async fetchData(params: AdapterParams): Promise<RawDataSourceData> {
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
      const response = await EstatApiClient.getStatsData(estatParams);

      return {
        source: this.sourceType,
        data: response,
        metadata: {
          timestamp: new Date().toISOString(),
          size: JSON.stringify(response).length,
          format: "json",
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch data from e-Stat API: ${error.message}`);
    }
  }

  async transform(
    data: RawDataSourceData,
    options?: TransformOptions
  ): Promise<DashboardData> {
    return this.transformer.transform(data, options);
  }

  validate(data: RawDataSourceData): ValidationResult {
    return this.validator.validate(data);
  }

  async getMetadata(params: AdapterParams): Promise<DataSourceMetadata> {
    return {
      name: "e-Stat API",
      description: "政府統計データAPI",
      version: "3.0",
      supportedTypes: [
        "timeSeries",
        "ranking",
        "comparison",
        "distribution",
        "geographic",
      ],
      supportedAreaLevels: ["national", "prefecture", "municipality"],
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

  supports(params: AdapterParams): boolean {
    return (
      params.source === "estat" &&
      params.query.statsDataId &&
      params.query.cdCat01
    );
  }
}
```

#### 2. データ変換器

```typescript
// src/lib/dashboard/adapters/estat/estat-transformer.ts
import {
  RawDataSourceData,
  DashboardData,
  DataValue,
  DataMetadata,
  DataType,
  AreaLevel,
} from "@/lib/dashboard/core/types";
import { TransformOptions } from "@/lib/dashboard/core/interfaces";

export class EstatTransformer {
  transform(
    data: RawDataSourceData,
    options?: TransformOptions
  ): DashboardData {
    const estatData = data.data.GET_STATS_DATA.STATISTICAL_DATA;
    const { VALUE } = estatData.DATA_INF;
    const { CLASS_OBJ } = estatData.CLASS_INF;

    // クラス情報のマッピング
    const classMaps = this.createClassMaps(CLASS_OBJ);

    // データ値の変換
    const values = this.transformValues(VALUE, classMaps);

    // メタデータの抽出
    const metadata = this.extractMetadata(estatData, classMaps, options);

    // データタイプの判定
    const dataType = this.determineDataType(values, options);

    return {
      type: dataType,
      values,
      metadata,
    };
  }

  private createClassMaps(
    CLASS_OBJ: any[]
  ): Record<string, Map<string, string>> {
    const maps: Record<string, Map<string, string>> = {};

    CLASS_OBJ.forEach((obj) => {
      const id = obj["@id"];
      if (obj.CLASS && Array.isArray(obj.CLASS)) {
        maps[id] = new Map(obj.CLASS.map((c: any) => [c["@code"], c["@name"]]));
      }
    });

    return maps;
  }

  private transformValues(
    VALUE: any[],
    classMaps: Record<string, Map<string, string>>
  ): DataValue[] {
    return VALUE.map((item, index) => ({
      id: `estat_${index}`,
      areaCode: item["@area"] || "00000",
      areaName: classMaps.area?.get(item["@area"]) || "Unknown",
      categoryCode: item["@cat01"] || "",
      categoryName: classMaps.cat01?.get(item["@cat01"]) || "Unknown",
      timeCode: item["@time"] || "",
      timeName: classMaps.time?.get(item["@time"]) || "Unknown",
      value: this.parseValue(item.$),
      unit: this.extractUnit(item),
      source: {
        type: "estat",
        name: "e-Stat API",
        version: "3.0",
        lastUpdated: new Date().toISOString(),
      },
      metadata: {
        originalValue: item.$,
        originalItem: item,
      },
    }));
  }

  private parseValue(value: any): number | null {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  private extractUnit(item: any): string {
    // 単位情報の抽出ロジック
    // 実装詳細は省略
    return "人"; // デフォルト値
  }

  private extractMetadata(
    estatData: any,
    classMaps: Record<string, Map<string, string>>,
    options?: TransformOptions
  ): DataMetadata {
    const title = estatData.TABLE_INF?.TITLE || "統計データ";
    const description = estatData.TABLE_INF?.NOTE || "";

    return {
      title,
      description,
      areaLevel: this.determineAreaLevel(options),
      timeRange: this.extractTimeRange(classMaps.time),
      categories: this.extractCategories(classMaps.cat01),
      areas: this.extractAreas(classMaps.area),
      source: {
        type: "estat",
        name: "e-Stat API",
        version: "3.0",
        lastUpdated: new Date().toISOString(),
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  private determineAreaLevel(options?: TransformOptions): AreaLevel {
    if (options?.areaLevel) {
      return options.areaLevel;
    }

    // デフォルトの地域レベル判定ロジック
    return "national";
  }

  private extractTimeRange(timeMap: Map<string, string>): TimeRange {
    const timeCodes = Array.from(timeMap.keys()).sort();

    return {
      start: timeCodes[0] || "2000",
      end: timeCodes[timeCodes.length - 1] || "2023",
      frequency: "yearly",
    };
  }

  private extractCategories(cat01Map: Map<string, string>): CategoryInfo[] {
    return Array.from(cat01Map.entries()).map(([code, name]) => ({
      code,
      name,
      order: parseInt(code) || 0,
    }));
  }

  private extractAreas(areaMap: Map<string, string>): AreaInfo[] {
    return Array.from(areaMap.entries()).map(([code, name]) => ({
      code,
      name,
      level: this.determineAreaLevelFromCode(code),
    }));
  }

  private determineAreaLevelFromCode(code: string): AreaLevel {
    if (code === "00000") return "national";
    if (code.length === 5 && code.endsWith("000")) return "prefecture";
    return "municipality";
  }

  private determineDataType(
    values: DataValue[],
    options?: TransformOptions
  ): DataType {
    if (options?.aggregation) {
      return "ranking";
    }

    const timeCodes = new Set(values.map((v) => v.timeCode));
    if (timeCodes.size > 1) {
      return "timeSeries";
    }

    const areaCodes = new Set(values.map((v) => v.areaCode));
    if (areaCodes.size > 1) {
      return "comparison";
    }

    return "distribution";
  }
}
```

#### 3. データ検証器

```typescript
// src/lib/dashboard/adapters/estat/estat-validator.ts
import {
  RawDataSourceData,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from "@/lib/dashboard/core/interfaces";

export class EstatValidator {
  validate(data: RawDataSourceData): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // 基本構造の検証
      if (!data.data || typeof data.data !== "object") {
        errors.push({
          field: "data",
          message: "Data must be an object",
          code: "INVALID_DATA_TYPE",
        });
        return { isValid: false, errors, warnings };
      }

      const estatData = data.data.GET_STATS_DATA;
      if (!estatData) {
        errors.push({
          field: "data.GET_STATS_DATA",
          message: "Invalid e-Stat API response structure",
          code: "MISSING_GET_STATS_DATA",
        });
        return { isValid: false, errors, warnings };
      }

      // 統計データの検証
      const statisticalData = estatData.STATISTICAL_DATA;
      if (!statisticalData) {
        errors.push({
          field: "data.GET_STATS_DATA.STATISTICAL_DATA",
          message: "Missing STATISTICAL_DATA",
          code: "MISSING_STATISTICAL_DATA",
        });
        return { isValid: false, errors, warnings };
      }

      // DATA_INFの検証
      const dataInf = statisticalData.DATA_INF;
      if (!dataInf || !dataInf.VALUE) {
        errors.push({
          field: "data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE",
          message: "Missing VALUE data",
          code: "MISSING_VALUE_DATA",
        });
        return { isValid: false, errors, warnings };
      }

      // CLASS_INFの検証
      const classInf = statisticalData.CLASS_INF;
      if (!classInf || !classInf.CLASS_OBJ) {
        errors.push({
          field: "data.GET_STATS_DATA.STATISTICAL_DATA.CLASS_INF.CLASS_OBJ",
          message: "Missing CLASS_OBJ data",
          code: "MISSING_CLASS_OBJ",
        });
        return { isValid: false, errors, warnings };
      }

      // データ値の検証
      if (!Array.isArray(dataInf.VALUE)) {
        errors.push({
          field: "data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE",
          message: "VALUE must be an array",
          code: "INVALID_VALUE_ARRAY",
        });
      } else if (dataInf.VALUE.length === 0) {
        warnings.push({
          field: "data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE",
          message: "No data values found",
          code: "EMPTY_VALUE_ARRAY",
        });
      }

      // クラスオブジェクトの検証
      if (!Array.isArray(classInf.CLASS_OBJ)) {
        errors.push({
          field: "data.GET_STATS_DATA.STATISTICAL_DATA.CLASS_INF.CLASS_OBJ",
          message: "CLASS_OBJ must be an array",
          code: "INVALID_CLASS_OBJ_ARRAY",
        });
      }
    } catch (error) {
      errors.push({
        field: "data",
        message: `Validation error: ${error.message}`,
        code: "VALIDATION_EXCEPTION",
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
```

### CSV アダプター

#### 1. アダプター実装

```typescript
// src/lib/dashboard/adapters/csv/csv-adapter.ts
import {
  DataAdapter,
  AdapterParams,
  RawDataSourceData,
  DashboardData,
  ValidationResult,
  DataSourceMetadata,
} from "@/lib/dashboard/core/interfaces";
import { CSVTransformer } from "./csv-transformer";
import { CSVValidator } from "./csv-validator";

export class CSVDataAdapter implements DataAdapter {
  readonly sourceType = "csv";
  readonly version = "1.0.0";

  private transformer: CSVTransformer;
  private validator: CSVValidator;

  constructor() {
    this.transformer = new CSVTransformer();
    this.validator = new CSVValidator();
  }

  async fetchData(params: AdapterParams): Promise<RawDataSourceData> {
    const { url, content } = params.query;

    if (!url && !content) {
      throw new Error(
        "Either url or content must be provided for CSV data source"
      );
    }

    let csvContent: string;

    if (content) {
      csvContent = content;
    } else {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch CSV from ${url}: ${response.statusText}`
        );
      }
      csvContent = await response.text();
    }

    return {
      source: this.sourceType,
      data: csvContent,
      metadata: {
        timestamp: new Date().toISOString(),
        size: csvContent.length,
        format: "csv",
      },
    };
  }

  async transform(
    data: RawDataSourceData,
    options?: TransformOptions
  ): Promise<DashboardData> {
    return this.transformer.transform(data, options);
  }

  validate(data: RawDataSourceData): ValidationResult {
    return this.validator.validate(data);
  }

  async getMetadata(params: AdapterParams): Promise<DataSourceMetadata> {
    return {
      name: "CSV Data Source",
      description: "CSVファイルからのデータ取得",
      version: "1.0",
      supportedTypes: ["timeSeries", "ranking", "comparison", "distribution"],
      supportedAreaLevels: ["national", "prefecture", "municipality"],
      supportedTimeRanges: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  supports(params: AdapterParams): boolean {
    return (
      params.source === "csv" && (params.query.url || params.query.content)
    );
  }
}
```

#### 2. CSV パーサー

```typescript
// src/lib/dashboard/adapters/csv/csv-parser.ts
export interface CSVRow {
  [key: string]: string | number;
}

export class CSVParser {
  parse(csvContent: string, options: ParseOptions = {}): CSVRow[] {
    const { delimiter = ",", hasHeader = true } = options;
    const lines = csvContent.trim().split("\n");

    if (lines.length === 0) {
      return [];
    }

    const rows: CSVRow[] = [];
    let headers: string[] = [];

    if (hasHeader) {
      headers = this.parseLine(lines[0], delimiter);
      lines.shift(); // ヘッダー行を削除
    }

    for (const line of lines) {
      if (line.trim()) {
        const values = this.parseLine(line, delimiter);
        const row: CSVRow = {};

        if (hasHeader) {
          headers.forEach((header, index) => {
            row[header] = this.parseValue(values[index]);
          });
        } else {
          values.forEach((value, index) => {
            row[`column_${index}`] = this.parseValue(value);
          });
        }

        rows.push(row);
      }
    }

    return rows;
  }

  private parseLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  private parseValue(value: string): string | number {
    const trimmed = value.trim();

    // 数値の判定
    if (/^\d+$/.test(trimmed)) {
      return parseInt(trimmed, 10);
    }

    if (/^\d+\.\d+$/.test(trimmed)) {
      return parseFloat(trimmed);
    }

    return trimmed;
  }
}

interface ParseOptions {
  delimiter?: string;
  hasHeader?: boolean;
}
```

### モックデータアダプター

```typescript
// src/lib/dashboard/adapters/mock/mock-adapter.ts
import {
  DataAdapter,
  AdapterParams,
  RawDataSourceData,
  DashboardData,
  ValidationResult,
  DataSourceMetadata,
} from "@/lib/dashboard/core/interfaces";
import { MockDataGenerator } from "./mock-data-generator";

export class MockDataAdapter implements DataAdapter {
  readonly sourceType = "mock";
  readonly version = "1.0.0";

  private generator: MockDataGenerator;

  constructor() {
    this.generator = new MockDataGenerator();
  }

  async fetchData(params: AdapterParams): Promise<RawDataSourceData> {
    const { dataType, areaLevel, timeRange, categories } = params.query;

    const mockData = this.generator.generate({
      dataType: dataType || "timeSeries",
      areaLevel: areaLevel || "national",
      timeRange: timeRange || {
        start: "2020",
        end: "2023",
        frequency: "yearly",
      },
      categories: categories || ["A1101", "A1102"],
      areaCount: 10,
      timePointCount: 4,
    });

    return {
      source: this.sourceType,
      data: mockData,
      metadata: {
        timestamp: new Date().toISOString(),
        size: JSON.stringify(mockData).length,
        format: "json",
      },
    };
  }

  async transform(
    data: RawDataSourceData,
    options?: TransformOptions
  ): Promise<DashboardData> {
    // モックデータの変換ロジック
    // 実装詳細は省略
  }

  validate(data: RawDataSourceData): ValidationResult {
    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }

  async getMetadata(params: AdapterParams): Promise<DataSourceMetadata> {
    return {
      name: "Mock Data Source",
      description: "テスト用のモックデータ",
      version: "1.0",
      supportedTypes: ["timeSeries", "ranking", "comparison", "distribution"],
      supportedAreaLevels: ["national", "prefecture", "municipality"],
      supportedTimeRanges: [
        {
          start: "2020-01-01",
          end: "2023-12-31",
          frequency: "yearly",
        },
      ],
      lastUpdated: new Date().toISOString(),
    };
  }

  supports(params: AdapterParams): boolean {
    return params.source === "mock";
  }
}
```

## テスト戦略

### 1. 単体テスト

```typescript
// src/lib/dashboard/adapters/estat/__tests__/estat-adapter.test.ts
import { EstatDataAdapter } from "../estat-adapter";
import { AdapterParams } from "@/lib/dashboard/core/interfaces";

describe("EstatDataAdapter", () => {
  let adapter: EstatDataAdapter;

  beforeEach(() => {
    adapter = new EstatDataAdapter();
  });

  describe("supports", () => {
    it("should support estat source with required parameters", () => {
      const params: AdapterParams = {
        source: "estat",
        query: {
          statsDataId: "0000010101",
          cdCat01: "A1101",
        },
      };

      expect(adapter.supports(params)).toBe(true);
    });

    it("should not support non-estat source", () => {
      const params: AdapterParams = {
        source: "csv",
        query: { url: "test.csv" },
      };

      expect(adapter.supports(params)).toBe(false);
    });
  });

  describe("fetchData", () => {
    it("should fetch data from e-Stat API", async () => {
      const params: AdapterParams = {
        source: "estat",
        query: {
          statsDataId: "0000010101",
          cdCat01: "A1101",
        },
      };

      const result = await adapter.fetchData(params);

      expect(result.source).toBe("estat");
      expect(result.data).toBeDefined();
      expect(result.metadata).toBeDefined();
    });
  });

  describe("validate", () => {
    it("should validate valid e-Stat data", () => {
      const mockData = {
        source: "estat",
        data: {
          GET_STATS_DATA: {
            STATISTICAL_DATA: {
              DATA_INF: { VALUE: [] },
              CLASS_INF: { CLASS_OBJ: [] },
            },
          },
        },
        metadata: {
          timestamp: new Date().toISOString(),
          size: 100,
          format: "json",
        },
      };

      const result = adapter.validate(mockData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
```

### 2. 統合テスト

```typescript
// src/lib/dashboard/__tests__/integration/data-service.test.ts
import { DashboardDataService } from "../services/data-service";
import { AdapterRegistry } from "../services/adapter-registry";
import { EstatDataAdapter } from "../adapters/estat/estat-adapter";

describe("DashboardDataService Integration", () => {
  let service: DashboardDataService;
  let registry: AdapterRegistry;

  beforeEach(() => {
    registry = new AdapterRegistry();
    registry.register(new EstatDataAdapter());

    service = new DashboardDataService(registry, mockCache, mockErrorHandler);
  });

  it("should fetch and transform data through adapter", async () => {
    const params: AdapterParams = {
      source: "estat",
      query: {
        statsDataId: "0000010101",
        cdCat01: "A1101",
      },
    };

    const result = await service.fetchData(params);

    expect(result.type).toBeDefined();
    expect(result.values).toBeDefined();
    expect(result.metadata).toBeDefined();
  });
});
```

## ベストプラクティス

### 1. エラーハンドリング

```typescript
// アダプター内でのエラーハンドリング
async fetchData(params: AdapterParams): Promise<RawDataSourceData> {
  try {
    // データ取得ロジック
    const response = await this.apiClient.getData(params);
    return this.formatResponse(response);
  } catch (error) {
    if (error instanceof NetworkError) {
      throw new AdapterError('NETWORK_ERROR', 'ネットワークエラーが発生しました', { originalError: error });
    } else if (error instanceof ValidationError) {
      throw new AdapterError('VALIDATION_ERROR', 'パラメータの検証に失敗しました', { originalError: error });
    } else {
      throw new AdapterError('UNKNOWN_ERROR', '予期しないエラーが発生しました', { originalError: error });
    }
  }
}
```

### 2. パフォーマンス最適化

```typescript
// キャッシュの活用
async fetchData(params: AdapterParams): Promise<RawDataSourceData> {
  const cacheKey = this.generateCacheKey(params);

  // キャッシュチェック
  const cached = await this.cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // データ取得
  const data = await this.fetchFromSource(params);

  // キャッシュ保存
  await this.cache.set(cacheKey, data, this.getCacheTTL());

  return data;
}
```

### 3. ログとモニタリング

```typescript
// ログの記録
async fetchData(params: AdapterParams): Promise<RawDataSourceData> {
  const startTime = Date.now();

  try {
    this.logger.info('Fetching data from source', { source: this.sourceType, params });

    const data = await this.fetchFromSource(params);

    const duration = Date.now() - startTime;
    this.logger.info('Data fetched successfully', {
      source: this.sourceType,
      duration,
      dataSize: JSON.stringify(data).length
    });

    return data;
  } catch (error) {
    const duration = Date.now() - startTime;
    this.logger.error('Failed to fetch data', {
      source: this.sourceType,
      duration,
      error: error.message
    });
    throw error;
  }
}
```

## まとめ

このガイドに従ってアダプターを実装することで、以下の効果が期待されます：

1. **一貫性**: 統一されたインターフェースと実装パターン
2. **保守性**: 明確な責任分離とエラーハンドリング
3. **テスタビリティ**: 包括的なテスト戦略
4. **拡張性**: 新しいデータソースの容易な追加
5. **パフォーマンス**: 最適化されたデータ取得とキャッシュ

---

**作成日**: 2025-10-16  
**最終更新日**: 2025-10-16  
**バージョン**: 1.0.0  
**承認者**: 開発チーム  
**ステータス**: 承認済み
