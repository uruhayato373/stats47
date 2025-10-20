---
title: e-Stat API エラーハンドリング戦略
created: 2025-01-18
updated: 2025-01-18
tags:
  - domain/estat-api
  - shared
  - error-handling
---

# e-Stat API エラーハンドリング戦略

## 概要

e-Stat API ドメイン全体で一貫したエラーハンドリングを提供するための戦略とガイドラインです。

## エラークラス階層

### 基本エラークラス

```typescript
// 基底エラークラス
export class EstatApiError extends Error {
  constructor(
    message: string,
    public readonly statsDataId?: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = "EstatApiError";
  }
}

// メタ情報取得エラー
export class EstatMetaInfoFetchError extends EstatApiError {
  constructor(message: string, statsDataId?: string, originalError?: unknown) {
    super(message, statsDataId, originalError);
    this.name = "EstatMetaInfoFetchError";
  }
}

// 統計データ取得エラー
export class EstatStatsDataFetchError extends EstatApiError {
  constructor(message: string, statsDataId?: string, originalError?: unknown) {
    super(message, statsDataId, originalError);
    this.name = "EstatStatsDataFetchError";
  }
}

// 統計リスト取得エラー
export class EstatStatsListFetchError extends EstatApiError {
  constructor(message: string, originalError?: unknown) {
    super(message, undefined, originalError);
    this.name = "EstatStatsListFetchError";
  }
}

// データ変換エラー
export class EstatDataTransformError extends EstatApiError {
  constructor(message: string, statsDataId?: string, originalError?: unknown) {
    super(message, statsDataId, originalError);
    this.name = "EstatDataTransformError";
  }
}

// バッチ処理エラー
export class EstatBatchProcessError extends EstatApiError {
  constructor(message: string, statsDataId?: string, originalError?: unknown) {
    super(message, statsDataId, originalError);
    this.name = "EstatBatchProcessError";
  }
}

// ID検証エラー
export class EstatIdValidationError extends EstatApiError {
  constructor(message: string, statsDataId?: string) {
    super(message, statsDataId);
    this.name = "EstatIdValidationError";
  }
}
```

## エラーハンドリングパターン

### 1. API 取得エラー

```typescript
try {
  const response = await estatAPI.getMetaInfo({ statsDataId });
  return response;
} catch (error) {
  throw new EstatMetaInfoFetchError(
    `メタ情報の取得に失敗しました: ${
      error instanceof Error ? error.message : "Unknown error"
    }`,
    statsDataId,
    error
  );
}
```

### 2. データ変換エラー

```typescript
try {
  return EstatMetaInfoFormatter.parseCompleteMetaInfo(metaInfo);
} catch (error) {
  throw new EstatDataTransformError(
    `メタ情報の変換に失敗しました: ${
      error instanceof Error ? error.message : "Unknown error"
    }`,
    statsDataId,
    error
  );
}
```

### 3. バッチ処理エラー

```typescript
const batchResults = await Promise.allSettled(
  batch.map(async (id) => {
    try {
      const result = await processSingleItem(id);
      return { statsDataId: id, success: true, result };
    } catch (error) {
      return {
        statsDataId: id,
        success: false,
        error: error instanceof Error ? error.message : "Processing failed",
      };
    }
  })
);
```

## エラーログ戦略

### ログレベル

```typescript
// エラーログの例
console.error("EstatApiError:", {
  name: error.name,
  message: error.message,
  statsDataId: error.statsDataId,
  stack: error.stack,
  originalError: error.originalError,
});
```

### 構造化ログ

```typescript
interface ErrorLogEntry {
  timestamp: string;
  level: "error" | "warn" | "info";
  service: string;
  operation: string;
  statsDataId?: string;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: Record<string, unknown>;
}

const logError = (error: EstatApiError, context?: Record<string, unknown>) => {
  const logEntry: ErrorLogEntry = {
    timestamp: new Date().toISOString(),
    level: "error",
    service: "estat-api",
    operation: "data-fetch",
    statsDataId: error.statsDataId,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
  };

  console.error(JSON.stringify(logEntry));
};
```

## リトライ戦略

### 指数バックオフ

```typescript
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries exceeded");
};
```

### 条件付きリトライ

```typescript
const shouldRetry = (error: unknown): boolean => {
  if (error instanceof EstatApiError) {
    // ネットワークエラーやタイムアウトはリトライ
    return (
      error.message.includes("timeout") || error.message.includes("network")
    );
  }
  return false;
};
```

## エラー回復戦略

### 1. フォールバックデータ

```typescript
const getStatsDataWithFallback = async (statsDataId: string) => {
  try {
    return await EstatStatsDataService.getAndFormatStatsData(statsDataId);
  } catch (error) {
    if (error instanceof EstatStatsDataFetchError) {
      // キャッシュされたデータを返す
      const cachedData = await getCachedData(statsDataId);
      if (cachedData) {
        console.warn("Using cached data due to API error:", error.message);
        return cachedData;
      }
    }
    throw error;
  }
};
```

### 2. 部分的な成功

```typescript
const processBatchWithPartialSuccess = async (ids: string[]) => {
  const results = [];
  const errors = [];

  for (const id of ids) {
    try {
      const result = await processSingleItem(id);
      results.push(result);
    } catch (error) {
      errors.push({ id, error: error.message });
    }
  }

  return {
    results,
    errors,
    successCount: results.length,
    failureCount: errors.length,
  };
};
```

## 監視とアラート

### エラー率の監視

```typescript
class ErrorMonitor {
  private errorCounts = new Map<string, number>();
  private totalRequests = 0;

  recordError(error: EstatApiError) {
    const key = error.name;
    this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);
    this.totalRequests++;

    // エラー率が閾値を超えた場合のアラート
    if (this.getErrorRate() > 0.1) {
      this.alertHighErrorRate();
    }
  }

  getErrorRate(): number {
    const totalErrors = Array.from(this.errorCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    );
    return totalErrors / this.totalRequests;
  }
}
```

### ヘルスチェック

```typescript
const healthCheck = async (): Promise<{
  status: "healthy" | "degraded" | "unhealthy";
  details: Record<string, unknown>;
}> => {
  try {
    // 簡単なAPI呼び出しでヘルスチェック
    await estatAPI.getStatsList({ limit: 1 });
    return { status: "healthy", details: {} };
  } catch (error) {
    return {
      status: "unhealthy",
      details: { error: error.message },
    };
  }
};
```

## テストでのエラーハンドリング

### エラーのモック

```typescript
// テストでのエラーモック
const mockEstatApiError = (message: string, statsDataId?: string) => {
  const error = new EstatMetaInfoFetchError(message, statsDataId);
  return error;
};

// エラーハンドリングのテスト
it("should handle API errors gracefully", async () => {
  const error = mockEstatApiError("API timeout", "0000010101");

  // エラーが適切に処理されることを確認
  expect(error.name).toBe("EstatMetaInfoFetchError");
  expect(error.statsDataId).toBe("0000010101");
});
```

### エラー回復のテスト

```typescript
it("should fallback to cached data on API error", async () => {
  // API呼び出しをモックしてエラーを発生させる
  jest
    .spyOn(EstatStatsDataService, "getAndFormatStatsData")
    .mockRejectedValue(new EstatStatsDataFetchError("API error"));

  // キャッシュされたデータをモック
  const cachedData = { values: [] };
  jest.spyOn(cache, "get").mockResolvedValue(cachedData);

  const result = await getStatsDataWithFallback("0000010101");
  expect(result).toEqual(cachedData);
});
```

## ベストプラクティス

### 1. エラーの分類

- **一時的なエラー**: リトライ可能
- **永続的なエラー**: リトライ不可、ユーザーに通知
- **データエラー**: ログに記録、デフォルト値で継続

### 2. エラーメッセージ

- ユーザーフレンドリーなメッセージ
- 技術的な詳細はログに記録
- エラーの原因と対処法を明記

### 3. ログの管理

- 構造化されたログ形式
- 適切なログレベル
- 個人情報の除外

### 4. 監視とアラート

- エラー率の監視
- 異常なパターンの検出
- 適切なアラート設定

## 関連ドキュメント

- [API 仕様](api-endpoints.md)
- [型システム](type-system.md)
- [ベストプラクティス](04_ドメイン設計/e-Stat%20API/01_共有/best-practices.md)
- [meta-info 実装ガイド](../meta-info/implementation/)
- [stats-data 実装ガイド](../stats-data/implementation/)
- [stats-list 実装ガイド](../stats-list/implementation/)
