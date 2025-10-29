---
title: API統合ガイド
created: 2025-10-16
updated: 2025-10-27
tags:
  - domain/estat-api
  - api
  - integration
---

# API 統合ガイド

## 概要

このドキュメントでは、e-Stat API の統合方法について包括的に説明します。エンドポイントの仕様、Next.js 統合、データ取得パターン、パフォーマンス最適化まで、API 利用に必要なすべての情報を網羅しています。

## 目次

1. [e-Stat API エンドポイント](#e-stat-apiエンドポイント)
2. [Next.js API Routes での統合](#nextjs-api-routes-での統合)
3. [クライアントサイドでの使用](#クライアントサイドでの使用)
4. [データ取得パターン](#データ取得パターン)
5. [認証とセキュリティ](#認証とセキュリティ)
6. [パフォーマンス最適化](#パフォーマンス最適化)
7. [エラーハンドリング](#エラーハンドリング)

---

# 第 1 章: e-Stat API エンドポイント

## 基本情報

### 環境変数

```bash
# .env.local
NEXT_PUBLIC_ESTAT_APP_ID=your-actual-app-id
```

## e-Stat API エンドポイント

### 1. 統計リスト取得 (GET_STATS_LIST)

**エンドポイント**: `/getStatsList`

**用途**: 統計表の一覧情報を取得

**パラメータ**:

- `appId`: アプリケーション ID（必須）
- `lang`: 言語設定（J: 日本語、E: 英語）
- `surveyYears`: 調査年月
- `openYears`: 公開年月
- `statsField`: 統計分野
- `statsCode`: 政府統計コード
- `searchWord`: 検索キーワード
- `startPosition`: 開始位置
- `limit`: 取得件数

### 2. メタ情報取得 (GET_META_INFO)

**エンドポイント**: `/getMetaInfo`

**用途**: 統計表のメタ情報（分類情報、地域情報、時間軸情報など）を取得

**パラメータ**:

- `appId`: アプリケーション ID（必須）
- `statsDataId`: 統計データ ID（必須）
- `metaGetFlg`: メタデータ取得フラグ（Y/N）
- `cntGetFlg`: 件数取得フラグ（Y/N）

### 3. 統計データ取得 (GET_STATS_DATA)

**エンドポイント**: `/getStatsData`

**用途**: 統計表の実際のデータを取得

**パラメータ**:

- `appId`: アプリケーション ID（必須）
- `statsDataId`: 統計データ ID（必須）
- `metaGetFlg`: メタデータ取得フラグ（Y/N）
- `cntGetFlg`: 件数取得フラグ（Y/N）
- `cdCat01-15`: カテゴリコード（最大 15 種類）
- `cdArea`: 地域コード
- `cdTime`: 時間軸コード
- `startPosition`: 開始位置
- `limit`: 取得件数

## 内部 API エンドポイント

### 統計データ関連

#### 統計データ取得

```http
GET /api/stats/data
```

**パラメータ**:

- `statsDataId`: 統計データ ID（必須）
- `categoryFilter`: カテゴリフィルタ
- `yearFilter`: 年度フィルタ
- `areaFilter`: 地域フィルタ
- `limit`: 取得件数

**レスポンス**:

```json
{
  "success": true,
  "data": {
    "values": [...],
    "areas": [...],
    "categories": [...],
    "years": [...]
  }
}
```

## エラーハンドリング

### HTTP ステータスコード

- `200`: 成功
- `400`: リクエストエラー
- `401`: 認証エラー
- `403`: アクセス拒否
- `404`: データが見つからない
- `429`: レート制限
- `500`: サーバーエラー

### エラーレスポンス形式

```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATS_DATA_ID",
    "message": "統計データIDが無効です",
    "details": {
      "statsDataId": "invalid-id",
      "expectedFormat": "10桁の数字"
    }
  }
}
```

## レート制限

### e-Stat API 制限

- **1 日あたり**: 1,000 回
- **1 時間あたり**: 100 回（推奨）
- **同時接続**: 5 接続まで

### 内部 API 制限

- **統計データ取得**: 1 分あたり 60 回
- **メタ情報取得**: 1 分あたり 30 回
- **ランキングデータ取得**: 1 分あたり 120 回

---

# 第 2 章: Next.js API Routes での統合

## 1. 統計データ取得 API

`src/app/api/stats/data/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { EstatStatsDataFetcher } from "@/features/estat-api/stats-data";
import { z } from "zod";

// リクエストスキーマ
const GetStatsDataSchema = z.object({
  statsDataId: z
    .string()
    .regex(/^\d{10}$/, "統計表IDは10桁の数字である必要があります"),
  categoryFilter: z.string().optional(),
  yearFilter: z.string().optional(),
  areaFilter: z.string().optional(),
  limit: z.number().min(1).max(10000).optional().default(10000),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // パラメータの検証
    const params = GetStatsDataSchema.parse({
      statsDataId: searchParams.get("statsDataId"),
      categoryFilter: searchParams.get("categoryFilter"),
      yearFilter: searchParams.get("yearFilter"),
      areaFilter: searchParams.get("areaFilter"),
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : undefined,
    });

    // 統計データを取得（Fetcherを使用）
    const data = await EstatStatsDataFetcher.fetchAndFormat(
      params.statsDataId,
      {
        categoryFilter: params.categoryFilter,
        yearFilter: params.yearFilter,
        areaFilter: params.areaFilter,
        limit: params.limit,
      }
    );

    return NextResponse.json({
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        statsDataId: params.statsDataId,
      },
    });
  } catch (error) {
    console.error("統計データ取得エラー:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "パラメータが無効です",
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "サーバー内部エラーが発生しました",
        },
      },
      { status: 500 }
    );
  }
}
```

## 2. 統計リスト検索 API

`src/app/api/stats/list/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { EstatStatsListFetcher } from "@/features/estat-api/stats-list";
import { z } from "zod";

const GetStatsListSchema = z.object({
  searchWord: z.string().min(1).max(100),
  limit: z.number().min(1).max(100).optional().default(20),
  startPosition: z.number().min(1).optional().default(1),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params = GetStatsListSchema.parse({
      searchWord: searchParams.get("searchWord"),
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : undefined,
      startPosition: searchParams.get("startPosition")
        ? parseInt(searchParams.get("startPosition")!)
        : undefined,
    });

    // 統計リストを取得（Fetcherを使用）
    const result = await EstatStatsListFetcher.searchByKeyword(
      params.searchWord,
      { limit: params.limit, startPosition: params.startPosition }
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("統計リスト取得エラー:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "サーバー内部エラーが発生しました",
        },
      },
      { status: 500 }
    );
  }
}
```

---

# 第 3 章: クライアントサイドでの使用

## 1. カスタムフックの作成

`src/hooks/useStatsData.ts`

```typescript
import { useState, useEffect } from "react";

interface UseStatsDataOptions {
  statsDataId: string;
  categoryFilter?: string;
  yearFilter?: string;
  areaFilter?: string;
  limit?: number;
  enabled?: boolean;
}

interface UseStatsDataResult {
  data: any | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useStatsData(options: UseStatsDataOptions): UseStatsDataResult {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!options.enabled) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        statsDataId: options.statsDataId,
        ...(options.categoryFilter && {
          categoryFilter: options.categoryFilter,
        }),
        ...(options.yearFilter && { yearFilter: options.yearFilter }),
        ...(options.areaFilter && { areaFilter: options.areaFilter }),
        ...(options.limit && { limit: options.limit.toString() }),
      });

      const response = await fetch(`/api/stats/data?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "データ取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    options.statsDataId,
    options.categoryFilter,
    options.yearFilter,
    options.areaFilter,
    options.limit,
    options.enabled,
  ]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
```

## 2. React コンポーネントでの使用

`src/components/StatsDataDisplay.tsx`

```typescript
"use client";

import { useStatsData } from "@/hooks/useStatsData";
import { useState } from "react";

interface StatsDataDisplayProps {
  statsDataId: string;
}

export function StatsDataDisplay({ statsDataId }: StatsDataDisplayProps) {
  const [filters, setFilters] = useState({
    categoryFilter: "",
    yearFilter: "",
    areaFilter: "",
  });

  const { data, loading, error, refetch } = useStatsData({
    statsDataId,
    ...filters,
    enabled: true,
  });

  if (loading) {
    return <div>データを読み込み中...</div>;
  }

  if (error) {
    return (
      <div>
        <p>エラー: {error}</p>
        <button onClick={refetch}>再試行</button>
      </div>
    );
  }

  if (!data) {
    return <div>データがありません</div>;
  }

  return (
    <div>
      <h3>統計データ ({data.values.length}件)</h3>
      <table>
        <thead>
          <tr>
            <th>地域</th>
            <th>カテゴリ</th>
            <th>年度</th>
            <th>値</th>
            <th>単位</th>
          </tr>
        </thead>
        <tbody>
          {data.values.map((item: any, index: number) => (
            <tr key={index}>
              <td>{item.areaName}</td>
              <td>{item.categoryName}</td>
              <td>{item.timeName}</td>
              <td>{item.value?.toLocaleString()}</td>
              <td>{item.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

# 第 4 章: データ取得パターン

## 基本的なデータ取得パターン

### 1. 単一統計表の取得

```typescript
import { EstatStatsDataFetcher } from "@/features/estat-api/stats-data";

async function fetchSingleStatsData(statsDataId: string) {
  try {
    const data = await EstatStatsDataFetcher.fetchAndFormat(statsDataId);

    console.log("取得したデータ:", {
      valueCount: data.values.length,
      areaCount: data.areas.length,
      categoryCount: data.categories.length,
      yearCount: data.years.length,
    });

    return data;
  } catch (error) {
    console.error("データ取得エラー:", error);
    throw error;
  }
}
```

### 2. フィルタリング付きデータ取得

```typescript
import { EstatStatsDataFetcher } from "@/features/estat-api/stats-data";
import type { FetchOptions } from "@/features/estat-api/stats-data/types";

async function fetchFilteredData(statsDataId: string, options: FetchOptions) {
  const data = await EstatStatsDataFetcher.fetchAndFormat(statsDataId, {
    categoryFilter: options.categoryFilter,
    yearFilter: options.yearFilter,
    areaFilter: options.areaFilter,
    limit: options.limit || 10000,
  });

  return data;
}
```

// 使用例
const populationData = await fetchFilteredData("0000010101", {
categoryFilter: "A1101", // 総人口
yearFilter: "2023", // 2023 年
limit: 1000,
});

````

## 高度なデータ取得パターン

### 1. 複数年度のデータ取得

```typescript
import { EstatStatsDataFetcher } from "@/features/estat-api/stats-data";
import type { FetchOptions } from "@/features/estat-api/stats-data/types";

async function fetchMultiYearData(
  statsDataId: string,
  years: string[],
  options: FetchOptions = {}
) {
  const results = await Promise.allSettled(
    years.map(async (year) => {
      const data = await EstatStatsDataFetcher.fetchAndFormat(statsDataId, {
        ...options,
        yearFilter: year,
      });

      return {
        year,
        data,
        success: true,
      };
    })
  );

  return results.map((result, index) => ({
    year: years[index],
    success: result.status === "fulfilled",
    data: result.status === "fulfilled" ? result.value.data : null,
    error: result.status === "rejected" ? result.reason : null,
  }));
}
````

### 2. バッチ処理でのデータ取得

```typescript
import { EstatStatsDataFetcher } from "@/features/estat-api/stats-data";

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
        const data = await EstatStatsDataFetcher.fetchAndFormat(statsDataId);
        return { statsDataId, data };
      })
    );

    results.push(...chunkResults);

    // レート制限対応のため待機
    if (i + concurrency < statsDataIds.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results.map((result, index) => ({
    statsDataId: statsDataIds[index],
    success: result.status === "fulfilled",
    data: result.status === "fulfilled" ? result.value.data : null,
    error: result.status === "rejected" ? result.reason : null,
  }));
}
```

---

# 第 5 章: 認証とセキュリティ

## 1. API キーの管理

`src/infrastructure/auth/api-key.ts`

```typescript
export class ApiKeyManager {
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
        throw new Error("ESTAT_APP_ID is not configured");
      }
    }

    return this.apiKey;
  }

  validateApiKey(apiKey: string): boolean {
    return /^[a-zA-Z0-9]{32}$/.test(apiKey);
  }
}
```

## 2. レート制限の実装

`src/infrastructure/rate-limit.ts`

```typescript
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> =
    new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async checkLimit(identifier: string): Promise<boolean> {
    const now = Date.now();
    const current = this.requests.get(identifier);

    if (!current || now > current.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return true;
    }

    if (current.count >= this.config.maxRequests) {
      return false;
    }

    current.count++;
    return true;
  }

  getRemainingRequests(identifier: string): number {
    const current = this.requests.get(identifier);
    if (!current) return this.config.maxRequests;

    const now = Date.now();
    if (now > current.resetTime) return this.config.maxRequests;

    return Math.max(0, this.config.maxRequests - current.count);
  }
}

// グローバルレート制限インスタンス
export const rateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1分
  maxRequests: 60, // 1分間に60リクエスト
});
```

---

# 第 6 章: パフォーマンス最適化

## 1. キャッシュを活用したデータ取得

```typescript
class CachedDataFetcher {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5分

  async fetchWithCache(statsDataId: string, options: DataFetchOptions = {}) {
    const cacheKey = this.generateCacheKey(statsDataId, options);

    // キャッシュをチェック
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      console.log("キャッシュから取得:", cacheKey);
      return cached.data;
    }

    // データを取得
    console.log("APIから取得:", cacheKey);
    const data = await EstatStatsDataService.getAndFormatStatsData(
      statsDataId,
      options
    );

    // キャッシュに保存
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    return data;
  }

  private generateCacheKey(
    statsDataId: string,
    options: DataFetchOptions
  ): string {
    return `${statsDataId}-${JSON.stringify(options)}`;
  }

  clearCache() {
    this.cache.clear();
  }
}
```

## 2. 並列処理の最適化

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
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

---

# 第 7 章: エラーハンドリング

## 1. リトライ機能付きデータ取得

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
    backoffMultiplier: 2,
  }
) {
  let lastError: Error;

  for (let attempt = 1; attempt <= retryOptions.maxRetries; attempt++) {
    try {
      const data = await EstatStatsDataService.getAndFormatStatsData(
        statsDataId,
        options
      );

      console.log(
        `データ取得成功 (試行 ${attempt}/${retryOptions.maxRetries})`
      );
      return data;
    } catch (error) {
      lastError = error as Error;
      console.warn(
        `データ取得失敗 (試行 ${attempt}/${retryOptions.maxRetries}):`,
        error
      );

      if (attempt === retryOptions.maxRetries) {
        break;
      }

      // 指数バックオフで待機
      const delay = Math.min(
        retryOptions.baseDelay *
          Math.pow(retryOptions.backoffMultiplier, attempt - 1),
        retryOptions.maxDelay
      );

      console.log(`${delay}ms待機後に再試行...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(
    `データ取得に失敗しました (${retryOptions.maxRetries}回試行): ${lastError.message}`
  );
}
```

## 2. フォールバック機能

```typescript
interface FallbackOptions {
  primaryStatsDataId: string;
  fallbackStatsDataId: string;
  options: DataFetchOptions;
}

async function fetchWithFallback(fallbackOptions: FallbackOptions) {
  const { primaryStatsDataId, fallbackStatsDataId, options } = fallbackOptions;

  try {
    console.log("プライマリデータソースから取得中...");
    const data = await EstatStatsDataService.getAndFormatStatsData(
      primaryStatsDataId,
      options
    );

    return {
      data,
      source: "primary",
      statsDataId: primaryStatsDataId,
    };
  } catch (error) {
    console.warn("プライマリデータソースでエラー:", error);

    try {
      console.log("フォールバックデータソースから取得中...");
      const data = await EstatStatsDataService.getAndFormatStatsData(
        fallbackStatsDataId,
        options
      );

      return {
        data,
        source: "fallback",
        statsDataId: fallbackStatsDataId,
        originalError: error,
      };
    } catch (fallbackError) {
      console.error("フォールバックデータソースでもエラー:", fallbackError);
      throw new Error(
        `データ取得に失敗しました。プライマリ: ${error.message}, フォールバック: ${fallbackError.message}`
      );
    }
  }
}
```

## 関連ドキュメント

- [開始ガイド](01_開始ガイド.md)
- [型システム](02_型システム.md)
- [エラーハンドリング](05_エラーハンドリング.md)
- [ベストプラクティス](06_ベストプラクティス.md)
- [使用例](08_使用例.md)
