---
title: データ取得実装ガイド
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/estat-api
  - implementation
---

# データ取得実装ガイド

## 概要

e-Stat APIからデータを効率的に取得するための実装パターンとベストプラクティスについて説明します。

## 基本的なデータ取得パターン

### 1. 単一統計表の取得

```typescript
import { EstatStatsDataService } from '@/lib/estat';

async function fetchSingleStatsData(statsDataId: string) {
  try {
    const data = await EstatStatsDataService.getAndFormatStatsData(statsDataId);
    
    console.log('取得したデータ:', {
      valueCount: data.values.length,
      areaCount: data.areas.length,
      categoryCount: data.categories.length,
      yearCount: data.years.length
    });
    
    return data;
  } catch (error) {
    console.error('データ取得エラー:', error);
    throw error;
  }
}
```

### 2. フィルタリング付きデータ取得

```typescript
interface DataFetchOptions {
  categoryFilter?: string;
  yearFilter?: string;
  areaFilter?: string;
  limit?: number;
}

async function fetchFilteredData(
  statsDataId: string, 
  options: DataFetchOptions
) {
  const data = await EstatStatsDataService.getAndFormatStatsData(
    statsDataId,
    {
      categoryFilter: options.categoryFilter,
      yearFilter: options.yearFilter,
      areaFilter: options.areaFilter,
      limit: options.limit || 10000
    }
  );
  
  return data;
}

// 使用例
const populationData = await fetchFilteredData('0000010101', {
  categoryFilter: 'A1101', // 総人口
  yearFilter: '2023',      // 2023年
  limit: 1000
});
```

### 3. 都道府県データの取得

```typescript
async function fetchPrefectureData(statsDataId: string, year: string) {
  const data = await EstatStatsDataService.getPrefectureData(
    statsDataId,
    {
      yearFilter: year,
      categoryFilter: 'A1101' // 総人口
    }
  );
  
  // 人口順でソート
  return data.sort((a, b) => (b.value || 0) - (a.value || 0));
}

// 使用例
const prefectureRanking = await fetchPrefectureData('0000010101', '2023');
console.log('都道府県別人口ランキング:', prefectureRanking.slice(0, 10));
```

## 高度なデータ取得パターン

### 1. 複数年度のデータ取得

```typescript
async function fetchMultiYearData(
  statsDataId: string,
  years: string[],
  options: DataFetchOptions = {}
) {
  const results = await Promise.allSettled(
    years.map(async (year) => {
      const data = await EstatStatsDataService.getAndFormatStatsData(
        statsDataId,
        {
          ...options,
          yearFilter: year
        }
      );
      
      return {
        year,
        data,
        success: true
      };
    })
  );
  
  return results.map((result, index) => ({
    year: years[index],
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value.data : null,
    error: result.status === 'rejected' ? result.reason : null
  }));
}

// 使用例
const multiYearData = await fetchMultiYearData(
  '0000010101',
  ['2020', '2021', '2022', '2023'],
  { categoryFilter: 'A1101', areaFilter: '13000' }
);
```

### 2. バッチ処理でのデータ取得

```typescript
interface BatchFetchOptions {
  statsDataIds: string[];
  concurrency?: number;
  delayMs?: number;
}

async function batchFetchData(options: BatchFetchOptions) {
  const { statsDataIds, concurrency = 3, delayMs = 1000 } = options;
  const results = [];
  
  // チャンクに分割
  for (let i = 0; i < statsDataIds.length; i += concurrency) {
    const chunk = statsDataIds.slice(i, i + concurrency);
    
    // 並列処理
    const chunkResults = await Promise.allSettled(
      chunk.map(async (statsDataId) => {
        const data = await EstatStatsDataService.getAndFormatStatsData(statsDataId);
        return { statsDataId, data };
      })
    );
    
    results.push(...chunkResults);
    
    // レート制限対応のため待機
    if (i + concurrency < statsDataIds.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results.map((result, index) => ({
    statsDataId: statsDataIds[index],
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value.data : null,
    error: result.status === 'rejected' ? result.reason : null
  }));
}
```

### 3. 条件付きデータ取得

```typescript
interface ConditionalFetchOptions {
  statsDataId: string;
  conditions: {
    category?: string[];
    year?: string[];
    area?: string[];
  };
  limit?: number;
}

async function fetchConditionalData(options: ConditionalFetchOptions) {
  const { statsDataId, conditions, limit = 10000 } = options;
  
  // 利用可能な年度を取得
  const availableYears = await EstatStatsDataService.getAvailableYears(statsDataId);
  
  // 条件に合致する年度をフィルタ
  const targetYears = conditions.year 
    ? conditions.year.filter(year => availableYears.includes(year))
    : availableYears;
  
  if (targetYears.length === 0) {
    throw new Error('指定された年度のデータがありません');
  }
  
  // 各年度のデータを取得
  const results = await Promise.allSettled(
    targetYears.map(async (year) => {
      const data = await EstatStatsDataService.getAndFormatStatsData(
        statsDataId,
        {
          categoryFilter: conditions.category?.join(','),
          yearFilter: year,
          areaFilter: conditions.area?.join(','),
          limit
        }
      );
      
      return { year, data };
    })
  );
  
  return results
    .filter((result): result is PromiseFulfilledResult<any> => 
      result.status === 'fulfilled'
    )
    .map(result => result.value);
}
```

## パフォーマンス最適化

### 1. キャッシュを活用したデータ取得

```typescript
class CachedDataFetcher {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5分

  async fetchWithCache(
    statsDataId: string,
    options: DataFetchOptions = {}
  ) {
    const cacheKey = this.generateCacheKey(statsDataId, options);
    
    // キャッシュをチェック
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      console.log('キャッシュから取得:', cacheKey);
      return cached.data;
    }
    
    // データを取得
    console.log('APIから取得:', cacheKey);
    const data = await EstatStatsDataService.getAndFormatStatsData(
      statsDataId,
      options
    );
    
    // キャッシュに保存
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  }
  
  private generateCacheKey(statsDataId: string, options: DataFetchOptions): string {
    return `${statsDataId}-${JSON.stringify(options)}`;
  }
  
  clearCache() {
    this.cache.clear();
  }
}

// 使用例
const fetcher = new CachedDataFetcher();
const data = await fetcher.fetchWithCache('0000010101', {
  categoryFilter: 'A1101',
  yearFilter: '2023'
});
```

### 2. 並列処理の最適化

```typescript
class ParallelDataFetcher {
  private concurrency: number;
  private delayMs: number;

  constructor(concurrency = 3, delayMs = 1000) {
    this.concurrency = concurrency;
    this.delayMs = delayMs;
  }

  async fetchMultiple(
    requests: Array<{ statsDataId: string; options?: DataFetchOptions }>
  ) {
    const results = [];
    
    for (let i = 0; i < requests.length; i += this.concurrency) {
      const chunk = requests.slice(i, i + this.concurrency);
      
      const chunkResults = await Promise.allSettled(
        chunk.map(async ({ statsDataId, options }) => {
          const data = await EstatStatsDataService.getAndFormatStatsData(
            statsDataId,
            options
          );
          return { statsDataId, data };
        })
      );
      
      results.push(...chunkResults);
      
      // レート制限対応
      if (i + this.concurrency < requests.length) {
        await this.delay(this.delayMs);
      }
    }
    
    return results;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 3. プログレッシブデータ取得

```typescript
interface ProgressiveFetchOptions {
  statsDataId: string;
  options: DataFetchOptions;
  batchSize: number;
  onProgress?: (progress: number) => void;
}

async function fetchProgressiveData(options: ProgressiveFetchOptions) {
  const { statsDataId, options: fetchOptions, batchSize, onProgress } = options;
  
  // まず件数を取得
  const countData = await EstatStatsDataService.getAndFormatStatsData(
    statsDataId,
    { ...fetchOptions, limit: 1 }
  );
  
  const totalCount = countData.values.length;
  const batches = Math.ceil(totalCount / batchSize);
  
  const allData = [];
  
  for (let i = 0; i < batches; i++) {
    const batchData = await EstatStatsDataService.getAndFormatStatsData(
      statsDataId,
      {
        ...fetchOptions,
        startPosition: i * batchSize + 1,
        limit: batchSize
      }
    );
    
    allData.push(...batchData.values);
    
    // プログレスコールバック
    if (onProgress) {
      const progress = ((i + 1) / batches) * 100;
      onProgress(progress);
    }
    
    // レート制限対応
    if (i < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return {
    values: allData,
    totalCount,
    batches
  };
}
```

## エラーハンドリング

### 1. リトライ機能付きデータ取得

```typescript
interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

async function fetchWithRetry(
  statsDataId: string,
  options: DataFetchOptions = {},
  retryOptions: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  }
) {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= retryOptions.maxRetries; attempt++) {
    try {
      const data = await EstatStatsDataService.getAndFormatStatsData(
        statsDataId,
        options
      );
      
      console.log(`データ取得成功 (試行 ${attempt}/${retryOptions.maxRetries})`);
      return data;
      
    } catch (error) {
      lastError = error as Error;
      console.warn(`データ取得失敗 (試行 ${attempt}/${retryOptions.maxRetries}):`, error);
      
      if (attempt === retryOptions.maxRetries) {
        break;
      }
      
      // 指数バックオフで待機
      const delay = Math.min(
        retryOptions.baseDelay * Math.pow(retryOptions.backoffMultiplier, attempt - 1),
        retryOptions.maxDelay
      );
      
      console.log(`${delay}ms待機後に再試行...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`データ取得に失敗しました (${retryOptions.maxRetries}回試行): ${lastError.message}`);
}
```

### 2. フォールバック機能

```typescript
interface FallbackOptions {
  primaryStatsDataId: string;
  fallbackStatsDataId: string;
  options: DataFetchOptions;
}

async function fetchWithFallback(fallbackOptions: FallbackOptions) {
  const { primaryStatsDataId, fallbackStatsDataId, options } = fallbackOptions;
  
  try {
    // プライマリデータソースから取得
    console.log('プライマリデータソースから取得中...');
    const data = await EstatStatsDataService.getAndFormatStatsData(
      primaryStatsDataId,
      options
    );
    
    return {
      data,
      source: 'primary',
      statsDataId: primaryStatsDataId
    };
    
  } catch (error) {
    console.warn('プライマリデータソースでエラー:', error);
    
    try {
      // フォールバックデータソースから取得
      console.log('フォールバックデータソースから取得中...');
      const data = await EstatStatsDataService.getAndFormatStatsData(
        fallbackStatsDataId,
        options
      );
      
      return {
        data,
        source: 'fallback',
        statsDataId: fallbackStatsDataId,
        originalError: error
      };
      
    } catch (fallbackError) {
      console.error('フォールバックデータソースでもエラー:', fallbackError);
      throw new Error(`データ取得に失敗しました。プライマリ: ${error.message}, フォールバック: ${fallbackError.message}`);
    }
  }
}
```

## データ検証

### 1. データ品質チェック

```typescript
interface DataQualityCheck {
  hasData: boolean;
  dataCount: number;
  hasNullValues: boolean;
  nullValueCount: number;
  hasValidNumbers: boolean;
  invalidNumberCount: number;
  warnings: string[];
}

function checkDataQuality(data: any): DataQualityCheck {
  const warnings: string[] = [];
  let nullValueCount = 0;
  let invalidNumberCount = 0;
  
  // データの存在チェック
  if (!data || !data.values || data.values.length === 0) {
    warnings.push('データが存在しません');
    return {
      hasData: false,
      dataCount: 0,
      hasNullValues: true,
      nullValueCount: 0,
      hasValidNumbers: false,
      invalidNumberCount: 0,
      warnings
    };
  }
  
  // 各値の品質チェック
  data.values.forEach((item: any, index: number) => {
    if (item.value === null || item.value === undefined) {
      nullValueCount++;
    } else if (typeof item.value === 'number' && (isNaN(item.value) || !isFinite(item.value))) {
      invalidNumberCount++;
    }
  });
  
  // 警告の生成
  if (nullValueCount > 0) {
    warnings.push(`${nullValueCount}件のNULL値が含まれています`);
  }
  
  if (invalidNumberCount > 0) {
    warnings.push(`${invalidNumberCount}件の無効な数値が含まれています`);
  }
  
  if (data.values.length < 10) {
    warnings.push('データ件数が少ないです（10件未満）');
  }
  
  return {
    hasData: true,
    dataCount: data.values.length,
    hasNullValues: nullValueCount > 0,
    nullValueCount,
    hasValidNumbers: invalidNumberCount === 0,
    invalidNumberCount,
    warnings
  };
}

// 使用例
const data = await EstatStatsDataService.getAndFormatStatsData('0000010101');
const quality = checkDataQuality(data);
console.log('データ品質:', quality);
```

### 2. データ整合性チェック

```typescript
function validateDataConsistency(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 地域コードの整合性チェック
  const areaCodes = new Set(data.areas.map((area: any) => area.code));
  const valueAreaCodes = new Set(data.values.map((value: any) => value.areaCode));
  
  const invalidAreaCodes = [...valueAreaCodes].filter(code => !areaCodes.has(code));
  if (invalidAreaCodes.length > 0) {
    errors.push(`無効な地域コード: ${invalidAreaCodes.join(', ')}`);
  }
  
  // カテゴリコードの整合性チェック
  const categoryCodes = new Set(data.categories.map((cat: any) => cat.code));
  const valueCategoryCodes = new Set(data.values.map((value: any) => value.categoryCode));
  
  const invalidCategoryCodes = [...valueCategoryCodes].filter(code => !categoryCodes.has(code));
  if (invalidCategoryCodes.length > 0) {
    errors.push(`無効なカテゴリコード: ${invalidCategoryCodes.join(', ')}`);
  }
  
  // 年度の整合性チェック
  const years = new Set(data.years.map((year: any) => year.code));
  const valueYears = new Set(data.values.map((value: any) => value.timeCode));
  
  const invalidYears = [...valueYears].filter(year => !years.has(year));
  if (invalidYears.length > 0) {
    errors.push(`無効な年度: ${invalidYears.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

## 使用例

### 1. ダッシュボード用データ取得

```typescript
async function fetchDashboardData() {
  const fetcher = new CachedDataFetcher();
  
  try {
    // 複数の統計データを並列取得
    const [populationData, gdpData, employmentData] = await Promise.all([
      fetcher.fetchWithCache('0000010101', { categoryFilter: 'A1101', yearFilter: '2023' }),
      fetcher.fetchWithCache('0000010201', { categoryFilter: 'A1101', yearFilter: '2023' }),
      fetcher.fetchWithCache('0000010301', { categoryFilter: 'A1101', yearFilter: '2023' })
    ]);
    
    return {
      population: populationData,
      gdp: gdpData,
      employment: employmentData,
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('ダッシュボードデータ取得エラー:', error);
    throw error;
  }
}
```

### 2. レポート生成用データ取得

```typescript
async function fetchReportData(statsDataId: string, yearRange: string[]) {
  const parallelFetcher = new ParallelDataFetcher(2, 2000); // 2並列、2秒間隔
  
  const requests = yearRange.map(year => ({
    statsDataId,
    options: { categoryFilter: 'A1101', yearFilter: year }
  }));
  
  const results = await parallelFetcher.fetchMultiple(requests);
  
  // 成功した結果のみを返す
  return results
    .filter((result): result is PromiseFulfilledResult<any> => 
      result.status === 'fulfilled'
    )
    .map(result => result.value);
}
```

## 関連ドキュメント

- [API統合ガイド](api-integration.md)
- [データ整形実装](data-formatting.md)
- [エラーハンドリング実装](error-handling.md)
- [ベストプラクティス](best-practices.md)
