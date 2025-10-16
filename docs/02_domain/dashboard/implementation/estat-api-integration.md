# e-Stat API統合ガイド

## 概要

このガイドでは、ダッシュボードドメインでe-Stat APIを統合する方法について説明します。全国・都道府県・市区町村の3階層すべてでe-Stat APIからデータを取得し、適切に表示するための実装方法を学習できます。

## e-Stat APIの基本

### 1. API概要

e-Stat APIは、日本の政府統計データを提供するREST APIです。以下の主要なエンドポイントがあります：

- **getStatsData**: 統計データの取得
- **getMetaInfo**: メタ情報の取得
- **getStatsList**: 統計一覧の取得
- **getDataCatalog**: データカタログの取得

### 2. 認証

```typescript
// 環境変数の設定
const ESTAT_APP_ID = process.env.NEXT_PUBLIC_ESTAT_APP_ID;

if (!ESTAT_APP_ID) {
  throw new Error('ESTAT_APP_ID is not defined');
}
```

### 3. 基本パラメータ

```typescript
interface EstatApiParams {
  appId: string;
  statsDataId: string;
  cdCat01?: string;
  cdArea?: string;
  metaGetFlg?: 'Y' | 'N';
  cntGetFlg?: 'Y' | 'N';
  startPosition?: number;
  limit?: number;
}
```

## 階層別データ取得

### 1. 全国レベルデータ取得

```typescript
// 全国データの取得
export async function fetchNationalData(
  statsDataId: string,
  categoryCode: string
): Promise<NationalData> {
  const params: EstatApiParams = {
    appId: ESTAT_APP_ID,
    statsDataId: statsDataId,
    cdCat01: categoryCode,
    cdArea: '00000', // 全国
    metaGetFlg: 'Y',
    cntGetFlg: 'N'
  };
  
  const response = await fetch('https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return formatNationalData(data);
}
```

### 2. 都道府県レベルデータ取得

```typescript
// 都道府県データの取得
export async function fetchPrefectureData(
  statsDataId: string,
  categoryCode: string,
  prefectureCode: string
): Promise<PrefectureData> {
  const params: EstatApiParams = {
    appId: ESTAT_APP_ID,
    statsDataId: statsDataId,
    cdCat01: categoryCode,
    cdArea: prefectureCode, // 都道府県コード
    metaGetFlg: 'Y',
    cntGetFlg: 'N'
  };
  
  const response = await fetch('https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return formatPrefectureData(data);
}
```

### 3. 市区町村レベルデータ取得

```typescript
// 市区町村データの取得
export async function fetchMunicipalityData(
  statsDataId: string,
  categoryCode: string,
  municipalityCode: string
): Promise<MunicipalityData> {
  const params: EstatApiParams = {
    appId: ESTAT_APP_ID,
    statsDataId: statsDataId,
    cdCat01: categoryCode,
    cdArea: municipalityCode, // 市区町村コード
    metaGetFlg: 'Y',
    cntGetFlg: 'N'
  };
  
  const response = await fetch('https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return formatMunicipalityData(data);
}
```

## データ取得サービス

### 1. EstatDataService

```typescript
// src/lib/services/EstatDataService.ts
export class EstatDataService {
  private static cache = new Map<string, CachedData>();
  private static readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24時間
  
  static async getStatsData(
    statsDataId: string,
    categoryCode: string,
    areaCode: string
  ): Promise<EstatData> {
    const cacheKey = this.generateCacheKey(statsDataId, categoryCode, areaCode);
    
    // キャッシュチェック
    const cachedData = this.cache.get(cacheKey);
    if (cachedData && !this.isExpired(cachedData)) {
      return cachedData.data;
    }
    
    // API呼び出し
    const data = await this.fetchFromApi(statsDataId, categoryCode, areaCode);
    
    // キャッシュ保存
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL
    });
    
    return data;
  }
  
  private static async fetchFromApi(
    statsDataId: string,
    categoryCode: string,
    areaCode: string
  ): Promise<EstatData> {
    const params: EstatApiParams = {
      appId: ESTAT_APP_ID,
      statsDataId: statsDataId,
      cdCat01: categoryCode,
      cdArea: areaCode,
      metaGetFlg: 'Y',
      cntGetFlg: 'N'
    };
    
    const response = await fetch('https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      throw new EstatApiError(`HTTP error! status: ${response.status}`, {
        statsDataId,
        categoryCode,
        areaCode,
        status: response.status
      });
    }
    
    const data = await response.json();
    return this.formatData(data);
  }
  
  private static formatData(rawData: any): EstatData {
    const values = rawData.STATISTICAL_DATA.DATA_INF.VALUE || [];
    const areas = rawData.STATISTICAL_DATA.CLASS_INF.CLASS_OBJ.find(
      (obj: any) => obj['@id'] === 'cat01'
    )?.CLASS || [];
    const categories = rawData.STATISTICAL_DATA.CLASS_INF.CLASS_OBJ.find(
      (obj: any) => obj['@id'] === 'cat01'
    )?.CLASS || [];
    const years = rawData.STATISTICAL_DATA.CLASS_INF.CLASS_OBJ.find(
      (obj: any) => obj['@id'] === 'time'
    )?.CLASS || [];
    
    return {
      values: values.map((value: any) => ({
        areaCode: value['@area'],
        value: parseFloat(value['$']),
        unit: value['@unit'],
        categoryCode: value['@cat01'],
        categoryName: categories.find((cat: any) => cat['@code'] === value['@cat01'])?.['$'],
        timeCode: value['@time'],
        timeName: years.find((year: any) => year['@code'] === value['@time'])?.['$']
      })),
      areas,
      categories,
      years,
      metadata: {
        statsDataId: rawData.STATISTICAL_DATA.TABLE_INF.STATISTICS_NAME,
        lastUpdated: new Date().toISOString(),
        source: 'e-Stat API'
      }
    };
  }
  
  private static generateCacheKey(
    statsDataId: string,
    categoryCode: string,
    areaCode: string
  ): string {
    return `estat:${statsDataId}:${categoryCode}:${areaCode}`;
  }
  
  private static isExpired(cachedData: CachedData): boolean {
    return Date.now() - cachedData.timestamp > cachedData.ttl;
  }
}
```

### 2. エラーハンドリング

```typescript
// src/lib/errors/EstatApiError.ts
export class EstatApiError extends Error {
  public readonly statsDataId: string;
  public readonly categoryCode: string;
  public readonly areaCode: string;
  public readonly status?: number;
  
  constructor(
    message: string,
    context: {
      statsDataId: string;
      categoryCode: string;
      areaCode: string;
      status?: number;
    }
  ) {
    super(message);
    this.name = 'EstatApiError';
    this.statsDataId = context.statsDataId;
    this.categoryCode = context.categoryCode;
    this.areaCode = context.areaCode;
    this.status = context.status;
  }
}
```

## データ取得フック

### 1. useEstatData

```typescript
// src/hooks/useEstatData.ts
import { useState, useEffect } from 'react';
import { EstatDataService } from '@/lib/services/EstatDataService';

export function useEstatData(
  params: { statsDataId: string; cdCat01: string },
  areaCode: string
) {
  const [data, setData] = useState<EstatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await EstatDataService.getStatsData(
          params.statsDataId,
          params.cdCat01,
          areaCode
        );
        
        setData(result);
      } catch (err) {
        setError(err as Error);
        console.error('Estat data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [params.statsDataId, params.cdCat01, areaCode]);
  
  return { data, loading, error };
}
```

### 2. useEstatTimeSeriesData

```typescript
// src/hooks/useEstatTimeSeriesData.ts
import { useState, useEffect } from 'react';
import { EstatDataService } from '@/lib/services/EstatDataService';

export function useEstatTimeSeriesData(
  params: { statsDataId: string; cdCat01: string },
  areaCode: string,
  years: string[]
) {
  const [data, setData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const promises = years.map(async (year) => {
          const result = await EstatDataService.getStatsData(
            params.statsDataId,
            params.cdCat01,
            areaCode
          );
          
          const yearData = result.values.find(
            (value) => value.timeCode === year
          );
          
          return {
            year,
            value: yearData?.value || 0
          };
        });
        
        const results = await Promise.all(promises);
        setData(results);
      } catch (err) {
        setError(err as Error);
        console.error('Estat time series data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [params.statsDataId, params.cdCat01, areaCode, years]);
  
  return { data, loading, error };
}
```

### 3. useEstatMultiTimeSeriesData

```typescript
// src/hooks/useEstatMultiTimeSeriesData.ts
import { useState, useEffect } from 'react';
import { EstatDataService } from '@/lib/services/EstatDataService';

export function useEstatMultiTimeSeriesData(
  params: { statsDataId: string; cdCat01: string[] },
  areaCode: string,
  years: string[]
) {
  const [data, setData] = useState<MultiTimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const promises = params.cdCat01.map(async (categoryCode) => {
          const result = await EstatDataService.getStatsData(
            params.statsDataId,
            categoryCode,
            areaCode
          );
          
          const timeSeriesData = years.map((year) => {
            const yearData = result.values.find(
              (value) => value.timeCode === year
            );
            
            return {
              year,
              value: yearData?.value || 0
            };
          });
          
          return {
            categoryCode,
            data: timeSeriesData
          };
        });
        
        const results = await Promise.all(promises);
        
        // データを結合
        const combinedData = years.map((year) => {
          const yearData: any = { year };
          results.forEach((result) => {
            const yearValue = result.data.find((item) => item.year === year);
            yearData[result.categoryCode] = yearValue?.value || 0;
          });
          return yearData;
        });
        
        setData(combinedData);
      } catch (err) {
        setError(err as Error);
        console.error('Estat multi time series data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [params.statsDataId, params.cdCat01, areaCode, years]);
  
  return { data, loading, error };
}
```

## 統計表IDとカテゴリコードの管理

### 1. 統計表IDの定義

```typescript
// src/config/estat-config.ts
export const ESTAT_CONFIG = {
  population: {
    basicPopulation: {
      statsDataId: '0000010101',
      categories: {
        totalPopulation: 'A1101',
        malePopulation: 'A110101',
        femalePopulation: 'A110102',
        dayNightRatio: 'A6108'
      }
    },
    households: {
      statsDataId: '0000010102',
      categories: {
        totalHouseholds: 'A1101',
        singlePersonHouseholds: 'A110101',
        nuclearFamilyHouseholds: 'A110102'
      }
    }
  },
  economy: {
    gdp: {
      statsDataId: '0000010201',
      categories: {
        totalGDP: 'A1101',
        perCapitaGDP: 'A110101'
      }
    }
  }
} as const;
```

### 2. カテゴリコードの取得

```typescript
// src/lib/utils/estat-utils.ts
export function getEstatConfig(
  category: string,
  subcategory: string
): EstatConfig | null {
  const categoryConfig = ESTAT_CONFIG[category as keyof typeof ESTAT_CONFIG];
  if (!categoryConfig) return null;
  
  const subcategoryConfig = categoryConfig[subcategory as keyof typeof categoryConfig];
  if (!subcategoryConfig) return null;
  
  return subcategoryConfig;
}

export function getCategoryCode(
  category: string,
  subcategory: string,
  metric: string
): string | null {
  const config = getEstatConfig(category, subcategory);
  if (!config) return null;
  
  return config.categories[metric as keyof typeof config.categories] || null;
}
```

## キャッシュ戦略

### 1. メモリキャッシュ

```typescript
// src/lib/cache/MemoryCache.ts
export class MemoryCache {
  private cache = new Map<string, CachedData>();
  private readonly defaultTTL: number;
  
  constructor(defaultTTL: number = 24 * 60 * 60 * 1000) {
    this.defaultTTL = defaultTTL;
  }
  
  get(key: string): any | null {
    const cachedData = this.cache.get(key);
    if (!cachedData) return null;
    
    if (this.isExpired(cachedData)) {
      this.cache.delete(key);
      return null;
    }
    
    return cachedData.data;
  }
  
  set(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  private isExpired(cachedData: CachedData): boolean {
    return Date.now() - cachedData.timestamp > cachedData.ttl;
  }
}
```

### 2. R2キャッシュ

```typescript
// src/lib/cache/R2Cache.ts
export class R2Cache {
  private r2: R2Bucket;
  private readonly defaultTTL: number;
  
  constructor(r2: R2Bucket, defaultTTL: number = 24 * 60 * 60 * 1000) {
    this.r2 = r2;
    this.defaultTTL = defaultTTL;
  }
  
  async get(key: string): Promise<any | null> {
    try {
      const object = await this.r2.get(key);
      if (!object) return null;
      
      const data = await object.json();
      if (this.isExpired(data)) {
        await this.r2.delete(key);
        return null;
      }
      
      return data.data;
    } catch (error) {
      console.error('R2 cache get error:', error);
      return null;
    }
  }
  
  async set(key: string, data: any, ttl?: number): Promise<void> {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl: ttl || this.defaultTTL
      };
      
      await this.r2.put(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error('R2 cache set error:', error);
    }
  }
  
  async delete(key: string): Promise<void> {
    try {
      await this.r2.delete(key);
    } catch (error) {
      console.error('R2 cache delete error:', error);
    }
  }
  
  private isExpired(cachedData: CachedData): boolean {
    return Date.now() - cachedData.timestamp > cachedData.ttl;
  }
}
```

## エラーハンドリング

### 1. エラーレベルの定義

```typescript
// src/lib/errors/ErrorLevel.ts
export enum ErrorLevel {
  CRITICAL = 'critical',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export interface ErrorContext {
  statsDataId?: string;
  categoryCode?: string;
  areaCode?: string;
  originalError?: any;
}
```

### 2. エラーハンドラー

```typescript
// src/lib/errors/ErrorHandler.ts
export class ErrorHandler {
  static handleEstatApiError(error: EstatApiError): DashboardError {
    return {
      level: ErrorLevel.ERROR,
      code: 'ESTAT_API_ERROR',
      message: '統計データの取得に失敗しました',
      details: {
        statsDataId: error.statsDataId,
        categoryCode: error.categoryCode,
        areaCode: error.areaCode,
        status: error.status,
        originalError: error.message
      },
      timestamp: new Date()
    };
  }
  
  static handleNetworkError(error: Error): DashboardError {
    return {
      level: ErrorLevel.ERROR,
      code: 'NETWORK_ERROR',
      message: 'ネットワークエラーが発生しました',
      details: {
        originalError: error.message
      },
      timestamp: new Date()
    };
  }
  
  static handleValidationError(error: ValidationError): DashboardError {
    return {
      level: ErrorLevel.WARNING,
      code: 'VALIDATION_ERROR',
      message: 'データの検証に失敗しました',
      details: {
        validationErrors: error.errors,
        originalError: error.message
      },
      timestamp: new Date()
    };
  }
}
```

## パフォーマンス最適化

### 1. 並列データ取得

```typescript
// src/lib/services/ParallelDataFetcher.ts
export class ParallelDataFetcher {
  static async fetchMultipleData(
    requests: Array<{
      statsDataId: string;
      categoryCode: string;
      areaCode: string;
    }>
  ): Promise<Array<{ data: EstatData | null; error: Error | null }>> {
    const concurrency = 3; // 同時実行数
    const results: Array<{ data: EstatData | null; error: Error | null }> = [];
    
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      
      const batchResults = await Promise.allSettled(
        batch.map(async (request) => {
          try {
            const data = await EstatDataService.getStatsData(
              request.statsDataId,
              request.categoryCode,
              request.areaCode
            );
            return { data, error: null };
          } catch (error) {
            return { data: null, error: error as Error };
          }
        })
      );
      
      results.push(
        ...batchResults.map(result => 
          result.status === 'fulfilled' ? result.value : { data: null, error: result.reason }
        )
      );
      
      // レート制限対応のため待機
      if (i + concurrency < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }
}
```

### 2. プリフェッチ

```typescript
// src/lib/services/DataPrefetcher.ts
export class DataPrefetcher {
  static async prefetchRelatedData(
    category: string,
    subcategory: string,
    areaCode: string
  ): Promise<void> {
    const areaLevel = determineAreaLevel(areaCode);
    const config = getEstatConfig(category, subcategory);
    
    if (!config) return;
    
    // 関連データのプリフェッチ
    const prefetchPromises: Promise<any>[] = [];
    
    if (areaLevel === 'national') {
      // 主要都道府県のデータをプリフェッチ
      const majorPrefectures = ['13000', '27000', '23000']; // 東京、大阪、愛知
      prefetchPromises.push(
        ...majorPrefectures.map(prefCode => 
          this.prefetchPrefectureData(category, subcategory, prefCode, config)
        )
      );
    } else if (areaLevel === 'prefecture') {
      // 主要市区町村のデータをプリフェッチ
      const majorMunicipalities = await getMajorMunicipalities(areaCode);
      prefetchPromises.push(
        ...majorMunicipalities.map(muniCode => 
          this.prefetchMunicipalityData(category, subcategory, muniCode, config)
        )
      );
    }
    
    // 非同期でプリフェッチを実行
    Promise.allSettled(prefetchPromises).catch(console.error);
  }
  
  private static async prefetchPrefectureData(
    category: string,
    subcategory: string,
    prefectureCode: string,
    config: EstatConfig
  ): Promise<void> {
    const cacheKey = `prefetch:${category}:${subcategory}:${prefectureCode}`;
    // プリフェッチロジックの実装
  }
  
  private static async prefetchMunicipalityData(
    category: string,
    subcategory: string,
    municipalityCode: string,
    config: EstatConfig
  ): Promise<void> {
    const cacheKey = `prefetch:${category}:${subcategory}:${municipalityCode}`;
    // プリフェッチロジックの実装
  }
}
```

## テスト

### 1. サービステスト

```typescript
// EstatDataService.test.ts
import { EstatDataService } from './EstatDataService';

describe('EstatDataService', () => {
  beforeEach(() => {
    // キャッシュをクリア
    EstatDataService.clearCache();
  });
  
  it('should fetch data successfully', async () => {
    const data = await EstatDataService.getStatsData(
      '0000010101',
      'A1101',
      '00000'
    );
    
    expect(data).toBeDefined();
    expect(data.values).toBeInstanceOf(Array);
    expect(data.metadata.source).toBe('e-Stat API');
  });
  
  it('should use cache for subsequent requests', async () => {
    const firstCall = await EstatDataService.getStatsData(
      '0000010101',
      'A1101',
      '00000'
    );
    
    const secondCall = await EstatDataService.getStatsData(
      '0000010101',
      'A1101',
      '00000'
    );
    
    expect(firstCall).toBe(secondCall); // 同じオブジェクトを返す
  });
  
  it('should handle API errors gracefully', async () => {
    await expect(
      EstatDataService.getStatsData('invalid', 'A1101', '00000')
    ).rejects.toThrow(EstatApiError);
  });
});
```

### 2. フックテスト

```typescript
// useEstatData.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useEstatData } from './useEstatData';

describe('useEstatData', () => {
  it('should fetch data successfully', async () => {
    const { result } = renderHook(() => 
      useEstatData({ statsDataId: '0000010101', cdCat01: 'A1101' }, '00000')
    );
    
    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.data).toBeDefined();
    expect(result.current.error).toBeNull();
  });
  
  it('should handle errors gracefully', async () => {
    const { result } = renderHook(() => 
      useEstatData({ statsDataId: 'invalid', cdCat01: 'A1101' }, '00000')
    );
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeDefined();
  });
});
```

## まとめ

e-Stat API統合ガイドでは、以下の内容を説明しました：

1. **基本API**: e-Stat APIの基本的な使用方法
2. **階層別取得**: 全国・都道府県・市区町村の3階層でのデータ取得
3. **サービス層**: データ取得サービスの実装
4. **フック**: Reactフックを使ったデータ取得
5. **キャッシュ**: メモリとR2を使ったキャッシュ戦略
6. **エラーハンドリング**: 包括的なエラー処理
7. **パフォーマンス**: 並列取得とプリフェッチによる最適化
8. **テスト**: サービスとフックのテスト方法

これらの実装により、e-Stat APIから効率的にデータを取得し、ダッシュボードで表示することができます。
