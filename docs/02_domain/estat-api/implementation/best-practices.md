---
title: ベストプラクティス
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/estat-api
  - implementation
---

# ベストプラクティス

## 概要

e-Stat APIライブラリを使用する際のベストプラクティスについて説明します。パフォーマンス、セキュリティ、保守性、エラーハンドリングの観点から最適な実装方法を詳述します。

## パフォーマンス最適化

### 1. 効率的なデータ取得

#### 必要なデータのみを取得

```typescript
// ❌ 悪い例: 全データを取得してからフィルタリング
const allData = await EstatStatsDataService.getAndFormatStatsData('0000010101');
const filteredData = allData.values.filter(item => 
  item.areaCode === '13000' && item.timeCode === '2023'
);

// ✅ 良い例: APIレベルでフィルタリング
const filteredData = await EstatStatsDataService.getAndFormatStatsData(
  '0000010101',
  {
    areaFilter: '13000',
    yearFilter: '2023',
    limit: 1000
  }
);
```

#### 適切な制限値の設定

```typescript
// ❌ 悪い例: 制限なしで大量データを取得
const data = await EstatStatsDataService.getAndFormatStatsData('0000010101');

// ✅ 良い例: 必要に応じて制限を設定
const data = await EstatStatsDataService.getAndFormatStatsData(
  '0000010101',
  { limit: 10000 } // 適切な制限値
);
```

### 2. キャッシュ戦略

#### メモリキャッシュの実装

```typescript
class StatsDataCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5分

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // メモリ使用量を制御
  clearOldEntries() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}
```

#### 分散キャッシュの活用

```typescript
// Cloudflare KVやRedisを使用した分散キャッシュ
class DistributedCache {
  constructor(private kv: KVNamespace) {}

  async get(key: string) {
    const cached = await this.kv.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key: string, data: any, ttl: number = 3600) {
    await this.kv.put(key, JSON.stringify(data), {
      expirationTtl: ttl
    });
  }
}
```

### 3. 並列処理の最適化

#### 適切な並列数の設定

```typescript
class OptimizedDataFetcher {
  private concurrency: number;
  private delayMs: number;

  constructor() {
    // 環境に応じて並列数を調整
    this.concurrency = process.env.NODE_ENV === 'production' ? 5 : 3;
    this.delayMs = 1000; // レート制限対応
  }

  async fetchMultiple(requests: Array<{ statsDataId: string; options?: any }>) {
    const results = [];
    
    for (let i = 0; i < requests.length; i += this.concurrency) {
      const chunk = requests.slice(i, i + this.concurrency);
      
      const chunkResults = await Promise.allSettled(
        chunk.map(req => this.fetchSingle(req))
      );
      
      results.push(...chunkResults);
      
      // レート制限対応
      if (i + this.concurrency < requests.length) {
        await this.delay(this.delayMs);
      }
    }
    
    return results;
  }

  private async fetchSingle(request: { statsDataId: string; options?: any }) {
    return EstatStatsDataService.getAndFormatStatsData(
      request.statsDataId,
      request.options
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## セキュリティ

### 1. 入力検証

#### パラメータの検証

```typescript
import { z } from 'zod';

const StatsDataParamsSchema = z.object({
  statsDataId: z.string().regex(/^\d{10}$/, '統計表IDは10桁の数字である必要があります'),
  categoryFilter: z.string().regex(/^[A-Z]\d{4}$/, 'カテゴリコードの形式が無効です').optional(),
  yearFilter: z.string().regex(/^\d{4}$/, '年度は4桁の数字である必要があります').optional(),
  areaFilter: z.string().regex(/^\d{5}$/, '地域コードは5桁の数字である必要があります').optional(),
  limit: z.number().min(1).max(100000).optional()
});

function validateStatsDataParams(params: any) {
  try {
    return StatsDataParamsSchema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('パラメータが無効です', error.errors);
    }
    throw error;
  }
}
```

#### SQLインジェクション対策

```typescript
class SafeDatabaseQuery {
  constructor(private db: D1Database) {}

  async getMetadataByStatsId(statsDataId: string) {
    // パラメータ化クエリを使用
    const stmt = this.db.prepare(`
      SELECT * FROM estat_metainfo 
      WHERE stats_data_id = ? 
      ORDER BY created_at DESC
    `);
    
    return await stmt.bind(statsDataId).all();
  }

  // ❌ 危険な例: 文字列連結
  async unsafeQuery(statsDataId: string) {
    const query = `SELECT * FROM estat_metainfo WHERE stats_data_id = '${statsDataId}'`;
    return await this.db.exec(query);
  }
}
```

### 2. APIキーの管理

#### 環境変数の適切な管理

```typescript
class ApiKeyManager {
  private static instance: ApiKeyManager;
  private apiKey: string | null = null;

  private constructor() {}

  static getInstance(): ApiKeyManager {
    if (!ApiKeyManager.instance) {
      ApiKeyManager.instance = new ApiKeyManager();
    }
    return ApiKeyManager.instance;
  }

  getApiKey(): string {
    if (!this.apiKey) {
      this.apiKey = process.env.NEXT_PUBLIC_ESTAT_APP_ID;
      
      if (!this.apiKey) {
        throw new Error('ESTAT_APP_ID is not configured');
      }
      
      if (!this.validateApiKey(this.apiKey)) {
        throw new Error('Invalid API key format');
      }
    }
    
    return this.apiKey;
  }

  private validateApiKey(apiKey: string): boolean {
    return /^[a-zA-Z0-9]{32}$/.test(apiKey);
  }
}
```

### 3. レート制限の実装

```typescript
class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private config = {
    windowMs: 60 * 1000, // 1分
    maxRequests: 60,     // 1分間に60リクエスト
    blockDuration: 5 * 60 * 1000 // 5分間ブロック
  };

  async checkLimit(identifier: string): Promise<boolean> {
    const now = Date.now();
    const current = this.requests.get(identifier);

    if (!current || now > current.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs
      });
      return true;
    }

    if (current.count >= this.config.maxRequests) {
      // ブロック期間を延長
      current.resetTime = now + this.config.blockDuration;
      return false;
    }

    current.count++;
    return true;
  }
}
```

## エラーハンドリング

### 1. 階層的エラーハンドリング

```typescript
class ErrorHandler {
  static handle(error: unknown, context: string): ApiError {
    console.error(`Error in ${context}:`, error);

    if (error instanceof EstatApiError) {
      return new ApiError(
        'ESTAT_API_ERROR',
        `e-Stat API error: ${error.message}`,
        502,
        { context, statsDataId: error.statsDataId }
      );
    }

    if (error instanceof ValidationError) {
      return new ApiError(
        'VALIDATION_ERROR',
        `Validation error: ${error.message}`,
        400,
        { context, details: error.details }
      );
    }

    if (error instanceof DatabaseError) {
      return new ApiError(
        'DATABASE_ERROR',
        `Database error: ${error.message}`,
        500,
        { context, originalError: error.originalError?.message }
      );
    }

    // 予期しないエラー
    return new ApiError(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      500,
      { context, error: String(error) }
    );
  }
}
```

### 2. リトライ戦略

```typescript
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

class RetryableOperation {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'RATE_LIMIT'],
      ...config
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (!this.shouldRetry(error, attempt)) {
          break;
        }

        if (attempt < this.config.maxRetries) {
          const delay = this.calculateDelay(attempt);
          console.log(`Retrying in ${delay}ms (attempt ${attempt}/${this.config.maxRetries})`);
          await this.delay(delay);
        }
      }
    }

    throw lastError!;
  }

  private shouldRetry(error: any, attempt: number): boolean {
    if (attempt >= this.config.maxRetries) return false;
    
    if (error instanceof ApiError) {
      return this.config.retryableErrors.includes(error.code);
    }
    
    return true;
  }

  private calculateDelay(attempt: number): number {
    const delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);
    return Math.min(delay, this.config.maxDelay);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## 保守性

### 1. 設定の外部化

```typescript
interface EstatConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  cache: {
    ttl: number;
    maxSize: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

class ConfigManager {
  private static config: EstatConfig;

  static getConfig(): EstatConfig {
    if (!this.config) {
      this.config = {
        api: {
          baseUrl: process.env.ESTAT_API_BASE_URL || 'https://api.e-stat.go.jp/rest/3.0/app/json',
          timeout: parseInt(process.env.ESTAT_API_TIMEOUT || '30000'),
          retries: parseInt(process.env.ESTAT_API_RETRIES || '3')
        },
        cache: {
          ttl: parseInt(process.env.CACHE_TTL || '300000'), // 5分
          maxSize: parseInt(process.env.CACHE_MAX_SIZE || '100')
        },
        rateLimit: {
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'), // 1分
          maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '60')
        }
      };
    }
    
    return this.config;
  }
}
```

### 2. ログ戦略

```typescript
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private static level: LogLevel = LogLevel.INFO;

  static setLevel(level: LogLevel) {
    this.level = level;
  }

  static debug(message: string, context?: any) {
    if (this.level <= LogLevel.DEBUG) {
      console.log(`[DEBUG] ${message}`, context);
    }
  }

  static info(message: string, context?: any) {
    if (this.level <= LogLevel.INFO) {
      console.log(`[INFO] ${message}`, context);
    }
  }

  static warn(message: string, context?: any) {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, context);
    }
  }

  static error(message: string, context?: any) {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, context);
    }
  }
}
```

### 3. 型安全性の確保

```typescript
// 厳密な型定義
interface StrictStatsDataParams {
  statsDataId: string;
  categoryFilter?: string;
  yearFilter?: string;
  areaFilter?: string;
  limit?: number;
}

// 型ガード関数
function isStatsDataParams(obj: any): obj is StrictStatsDataParams {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.statsDataId === 'string' &&
    /^\d{10}$/.test(obj.statsDataId) &&
    (obj.categoryFilter === undefined || typeof obj.categoryFilter === 'string') &&
    (obj.yearFilter === undefined || typeof obj.yearFilter === 'string') &&
    (obj.areaFilter === undefined || typeof obj.areaFilter === 'string') &&
    (obj.limit === undefined || (typeof obj.limit === 'number' && obj.limit > 0))
  );
}

// 使用例
function processStatsDataRequest(params: unknown) {
  if (!isStatsDataParams(params)) {
    throw new ValidationError('Invalid parameters');
  }
  
  // ここでparamsは型安全
  return EstatStatsDataService.getAndFormatStatsData(params.statsDataId, params);
}
```

## テスト戦略

### 1. テストの構造化

```typescript
describe('EstatStatsDataService', () => {
  describe('正常系', () => {
    it('統計データを正しく取得できる', async () => {
      // テスト実装
    });
  });

  describe('異常系', () => {
    it('無効な統計表IDでエラーを投げる', async () => {
      // テスト実装
    });
  });

  describe('境界値', () => {
    it('制限値の境界で正しく動作する', async () => {
      // テスト実装
    });
  });
});
```

### 2. モックの適切な使用

```typescript
// 外部依存のモック
jest.mock('@/services/estat-api');
const mockEstatApiClient = EstatApiClient as jest.Mocked<typeof EstatApiClient>;

// テストデータのファクトリ
class TestDataFactory {
  static createRawStatsData(overrides: any = {}) {
    return {
      GET_STATS_DATA: {
        RESULT: { STATUS: 0, ERROR_MSG: null, DATE: '2024-01-01T00:00:00+09:00' },
        STATISTICAL_DATA: {
          DATA_INF: { VALUE: [] },
          CLASS_INF: { CLASS_OBJ: [] }
        },
        ...overrides
      }
    };
  }
}
```

## 監視とメトリクス

### 1. パフォーマンス監視

```typescript
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  recordTiming(operation: string, duration: number) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    this.metrics.get(operation)!.push(duration);
  }

  getAverageTiming(operation: string): number {
    const timings = this.metrics.get(operation) || [];
    return timings.reduce((sum, time) => sum + time, 0) / timings.length;
  }

  getMetrics() {
    const result: Record<string, any> = {};
    
    for (const [operation, timings] of this.metrics.entries()) {
      result[operation] = {
        count: timings.length,
        average: this.getAverageTiming(operation),
        min: Math.min(...timings),
        max: Math.max(...timings)
      };
    }
    
    return result;
  }
}
```

### 2. ヘルスチェック

```typescript
class HealthChecker {
  async checkApiHealth(): Promise<boolean> {
    try {
      const response = await fetch('https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList?appId=test&searchWord=test&limit=1');
      return response.ok;
    } catch {
      return false;
    }
  }

  async checkDatabaseHealth(db: D1Database): Promise<boolean> {
    try {
      const result = await db.prepare('SELECT 1').first();
      return result !== null;
    } catch {
      return false;
    }
  }

  async getHealthStatus(): Promise<{
    api: boolean;
    database: boolean;
    overall: boolean;
  }> {
    const [api, database] = await Promise.all([
      this.checkApiHealth(),
      this.checkDatabaseHealth(this.db)
    ]);

    return {
      api,
      database,
      overall: api && database
    };
  }
}
```

## 関連ドキュメント

- [データ取得実装](data-fetching.md)
- [エラーハンドリング実装](error-handling.md)
- [パフォーマンス最適化](performance-optimization.md)
- [テスト戦略](../testing/testing-strategy.md)
