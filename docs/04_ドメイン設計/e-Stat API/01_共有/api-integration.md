---
title: API統合ガイド
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/estat-api
  - implementation
---

# API 統合ガイド

## 概要

e-Stat API を Next.js アプリケーションに統合する方法について説明します。API Routes、クライアントサイドでの使用、認証、エラーハンドリングについて詳述します。

## Next.js API Routes での統合

### 1. 統計データ取得 API

`src/app/api/stats/data/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { EstatStatsDataService } from "@/lib/estat";
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

    // 統計データを取得
    const data = await EstatStatsDataService.getAndFormatStatsData(
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

### 2. 統計リスト検索 API

`src/app/api/stats/list/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { EstatStatsListService } from "@/lib/estat";
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

    const result = await EstatStatsListService.getAndFormatStatsList(params);

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

### 3. メタ情報取得 API

`src/app/api/metainfo/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { EstatMetaInfoService } from "@/lib/estat";
import { z } from "zod";

const GetMetaInfoSchema = z.object({
  statsDataId: z.string().regex(/^\d{10}$/),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params = GetMetaInfoSchema.parse({
      statsDataId: searchParams.get("statsDataId"),
    });

    // D1Databaseのインスタンスを取得（Cloudflare Workers環境）
    const db = getD1Database();
    const metaService = new EstatMetaInfoService(db);

    const metaInfo = await metaService.getMetaInfo(params.statsDataId);

    return NextResponse.json({
      success: true,
      data: metaInfo,
    });
  } catch (error) {
    console.error("メタ情報取得エラー:", error);

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

## クライアントサイドでの使用

### 1. カスタムフックの作成

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

### 2. React コンポーネントでの使用

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

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

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
      <div className="filters">
        <input
          type="text"
          placeholder="カテゴリフィルタ"
          value={filters.categoryFilter}
          onChange={(e) => handleFilterChange("categoryFilter", e.target.value)}
        />
        <input
          type="text"
          placeholder="年度フィルタ"
          value={filters.yearFilter}
          onChange={(e) => handleFilterChange("yearFilter", e.target.value)}
        />
        <input
          type="text"
          placeholder="地域フィルタ"
          value={filters.areaFilter}
          onChange={(e) => handleFilterChange("areaFilter", e.target.value)}
        />
      </div>

      <div className="data-display">
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
    </div>
  );
}
```

## 認証とセキュリティ

### 1. API キーの管理

`src/lib/auth/api-key.ts`

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

### 2. レート制限の実装

`src/lib/rate-limit.ts`

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

### 3. API Routes でのレート制限適用

```typescript
import { rateLimiter } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // クライアントIPを取得
  const clientIP =
    request.ip || request.headers.get("x-forwarded-for") || "unknown";

  // レート制限チェック
  const allowed = await rateLimiter.checkLimit(clientIP);
  if (!allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "レート制限に達しました",
          details: {
            remaining: rateLimiter.getRemainingRequests(clientIP),
            resetTime: new Date(Date.now() + 60 * 1000).toISOString(),
          },
        },
      },
      { status: 429 }
    );
  }

  // 通常の処理を続行
  // ...
}
```

## エラーハンドリング

### 1. 統一エラーレスポンス

`src/lib/errors/api-error.ts`

```typescript
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super("VALIDATION_ERROR", message, 400, details);
  }
}

export class EstatApiError extends ApiError {
  constructor(message: string, public statsDataId?: string) {
    super("ESTAT_API_ERROR", message, 502);
  }
}

export class RateLimitError extends ApiError {
  constructor(remaining: number, resetTime: number) {
    super("RATE_LIMIT_EXCEEDED", "レート制限に達しました", 429, {
      remaining,
      resetTime: new Date(resetTime).toISOString(),
    });
  }
}
```

### 2. エラーハンドラーミドルウェア

`src/lib/errors/error-handler.ts`

```typescript
import { NextResponse } from "next/server";
import {
  ApiError,
  ValidationError,
  EstatApiError,
  RateLimitError,
} from "./api-error";

export function handleApiError(error: unknown): NextResponse {
  console.error("API Error:", error);

  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof EstatApiError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: {
            statsDataId: error.statsDataId,
          },
        },
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof RateLimitError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  // 予期しないエラー
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
```

## パフォーマンス最適化

### 1. レスポンスキャッシュ

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const statsDataId = searchParams.get("statsDataId");

  // キャッシュキーを生成
  const cacheKey = `stats-data-${statsDataId}`;

  // キャッシュをチェック（Cloudflare KVやRedisなど）
  const cached = await getCachedData(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        "Cache-Control": "public, max-age=3600", // 1時間キャッシュ
        "X-Cache": "HIT",
      },
    });
  }

  // データを取得
  const data = await EstatStatsDataService.getAndFormatStatsData(statsDataId!);

  // キャッシュに保存
  await setCachedData(cacheKey, data, 3600);

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "X-Cache": "MISS",
    },
  });
}
```

### 2. 並列処理

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const statsDataIds = searchParams.getAll("statsDataId");

  if (statsDataIds.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISSING_PARAMETER",
          message: "statsDataId is required",
        },
      },
      { status: 400 }
    );
  }

  try {
    // 並列で複数の統計データを取得
    const results = await Promise.allSettled(
      statsDataIds.map((id) => EstatStatsDataService.getAndFormatStatsData(id))
    );

    const data = results.map((result, index) => ({
      statsDataId: statsDataIds[index],
      success: result.status === "fulfilled",
      data: result.status === "fulfilled" ? result.value : null,
      error: result.status === "rejected" ? result.reason.message : null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error);
  }
}
```

## テスト

### 1. API Routes のテスト

`src/app/api/stats/data/__tests__/route.test.ts`

```typescript
import { GET } from "../route";
import { EstatStatsDataService } from "@/lib/estat";

// モック
jest.mock("@/lib/estat");
const mockEstatStatsDataService = EstatStatsDataService as jest.Mocked<
  typeof EstatStatsDataService
>;

describe("/api/stats/data", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("正常に統計データを取得できる", async () => {
    const mockData = {
      values: [{ areaCode: "13000", areaName: "東京都", value: 14000000 }],
      areas: [],
      categories: [],
      years: [],
    };

    mockEstatStatsDataService.getAndFormatStatsData.mockResolvedValue(mockData);

    const request = new Request(
      "http://localhost/api/stats/data?statsDataId=0000010101"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockData);
  });

  it("無効な統計表IDでエラーを返す", async () => {
    const request = new Request(
      "http://localhost/api/stats/data?statsDataId=invalid"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });
});
```

## 関連ドキュメント

- [データ取得実装](data-fetching.md)
- [エラーハンドリング](error-handling.md)
- [ベストプラクティス](best-practices%201.md)
- [使用例](examples.md)
- [開始ガイド](04_ドメイン設計/e-Stat%20API/01_共有/getting-started.md)
