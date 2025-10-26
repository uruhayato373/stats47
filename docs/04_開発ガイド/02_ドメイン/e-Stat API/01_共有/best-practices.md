---
title: e-Stat API ベストプラクティス
created: 2025-01-18
updated: 2025-01-18
tags:
  - domain/estat-api
  - shared
  - best-practices
---

# e-Stat API ベストプラクティス

## 概要

e-Stat API ドメインで開発を行う際のベストプラクティスとガイドラインです。

## コード品質

### 1. 型安全性

```typescript
// 良い例: 明確な型定義
interface StatsDataOptions {
  categoryFilter?: string;
  yearFilter?: string;
  areaFilter?: string;
  limit?: number;
}

// 悪い例: any型の使用
function getStatsData(options: any) {
  // ...
}
```

### 2. エラーハンドリング

```typescript
// 良い例: 適切なエラーハンドリング
try {
  const data = await EstatStatsDataService.getAndFormatStatsData(statsDataId);
  return data;
} catch (error) {
  if (error instanceof EstatStatsDataFetchError) {
    console.error("データ取得エラー:", error.message);
    throw error;
  }
  throw new EstatStatsDataFetchError(
    "予期しないエラーが発生しました",
    statsDataId,
    error
  );
}

// 悪い例: エラーの無視
const data = await EstatStatsDataService.getAndFormatStatsData(statsDataId);
// エラーが発生しても処理が続行される
```

### 3. 非同期処理

```typescript
// 良い例: Promise.allSettledを使用
const results = await Promise.allSettled(
  statsDataIds.map((id) => EstatStatsDataService.getAndFormatStatsData(id))
);

const successful = results
  .filter(
    (result): result is PromiseFulfilledResult<FormattedStatsData> =>
      result.status === "fulfilled"
  )
  .map((result) => result.value);

// 悪い例: 順次処理
for (const id of statsDataIds) {
  const data = await EstatStatsDataService.getAndFormatStatsData(id);
  // 非効率
}
```

## パフォーマンス

### 1. フィルタリングの活用

```typescript
// 良い例: 必要なデータのみを取得
const data = await EstatStatsDataService.getAndFormatStatsData(statsDataId, {
  categoryFilter: "A1101",
  yearFilter: "2020",
  areaFilter: "13000",
});

// 悪い例: 全データを取得してから絞り込み
const allData = await EstatStatsDataService.getAndFormatStatsData(statsDataId);
const filteredData = allData.values.filter(
  (v) =>
    v.dimensions.categories.cat01 === "A1101" &&
    v.dimensions.time === "2020" &&
    v.dimensions.area === "13000"
);
```

### 2. キャッシュの活用

```typescript
// 良い例: キャッシュを活用
const getCachedStatsData = async (statsDataId: string) => {
  const cacheKey = `stats-data-${statsDataId}`;
  const cached = await cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const data = await EstatStatsDataService.getAndFormatStatsData(statsDataId);
  await cache.set(cacheKey, data, { ttl: 3600 }); // 1時間キャッシュ
  return data;
};
```

### 3. バッチ処理

```typescript
// 良い例: バッチ処理で効率化
const processMultipleStatsData = async (statsDataIds: string[]) => {
  const batchSize = 10;
  const batches = chunk(statsDataIds, batchSize);

  const results = [];
  for (const batch of batches) {
    const batchResults = await Promise.allSettled(
      batch.map((id) => EstatStatsDataService.getAndFormatStatsData(id))
    );
    results.push(...batchResults);

    // レート制限を考慮した待機
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return results;
};
```

## セキュリティ

### 1. 入力検証

```typescript
// 良い例: 入力値の検証
const validateStatsDataId = (id: string): boolean => {
  return /^\d{10}$/.test(id);
};

const getStatsData = async (statsDataId: string) => {
  if (!validateStatsDataId(statsDataId)) {
    throw new EstatIdValidationError("無効な統計表IDです", statsDataId);
  }

  return await EstatStatsDataService.getAndFormatStatsData(statsDataId);
};
```

### 2. API キーの管理

```typescript
// 良い例: 環境変数からAPIキーを取得
const getApiKey = (): string => {
  const apiKey = process.env.NEXT_PUBLIC_ESTAT_APP_ID;
  if (!apiKey) {
    throw new Error("ESTAT_APP_ID environment variable is not set");
  }
  return apiKey;
};

// 悪い例: ハードコードされたAPIキー
const API_KEY = "your-api-key-here";
```

### 3. レート制限

```typescript
// 良い例: レート制限の実装
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async checkLimit(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter((time) => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const waitTime = this.windowMs - (now - this.requests[0]);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.requests.push(now);
  }
}
```

## テスト

### 1. 単体テスト

```typescript
// 良い例: 包括的なテスト
describe("EstatStatsDataService", () => {
  it("should fetch and format stats data correctly", async () => {
    const mockResponse = createMockStatsDataResponse();
    jest.spyOn(estatAPI, "getStatsData").mockResolvedValue(mockResponse);

    const result = await EstatStatsDataService.getAndFormatStatsData(
      "0000010101"
    );

    expect(result.values).toHaveLength(1);
    expect(result.dimensions.areas).toHaveLength(1);
    expect(result.dimensions.years).toHaveLength(1);
  });

  it("should handle API errors gracefully", async () => {
    jest
      .spyOn(estatAPI, "getStatsData")
      .mockRejectedValue(new Error("API Error"));

    await expect(
      EstatStatsDataService.getAndFormatStatsData("0000010101")
    ).rejects.toThrow(EstatStatsDataFetchError);
  });
});
```

### 2. 統合テスト

```typescript
// 良い例: 統合テスト
describe("Stats Data Integration", () => {
  it("should work end-to-end with real API", async () => {
    const result = await EstatStatsDataService.getAndFormatStatsData(
      "0000010101"
    );

    expect(result).toBeDefined();
    expect(result.values).toBeInstanceOf(Array);
    expect(result.dimensions).toBeDefined();
  });
});
```

### 3. モックの活用

```typescript
// 良い例: 適切なモック
const mockMetaInfoResponse: EstatMetaInfoResponse = {
  GET_META_INFO: {
    RESULT: { STATUS: 0 },
    METADATA_INF: {
      TABLE_INF: {
        STAT_NAME: { $: "人口推計" },
        TITLE: { $: "年齢別人口" },
      },
    },
  },
};

jest.spyOn(estatAPI, "getMetaInfo").mockResolvedValue(mockMetaInfoResponse);
```

## ドキュメント

### 1. JSDoc コメント

````typescript
/**
 * 統計データを取得して整形します
 * @param statsDataId - 統計表ID（10桁の数字）
 * @param options - 取得オプション
 * @returns 整形済みの統計データ
 * @throws {EstatIdValidationError} 無効な統計表IDの場合
 * @throws {EstatStatsDataFetchError} API取得に失敗した場合
 * @example
 * ```typescript
 * const data = await getAndFormatStatsData('0000010101', {
 *   categoryFilter: 'A1101',
 *   yearFilter: '2020'
 * });
 * ```
 */
export async function getAndFormatStatsData(
  statsDataId: string,
  options?: StatsDataOptions
): Promise<FormattedStatsData> {
  // 実装
}
````

### 2. README の更新

````markdown
## 使用方法

### 基本的な使用例

```typescript
import { EstatStatsDataService } from "@/infrastructure/estat-api/stats-data";

// 統計データを取得
const data = await EstatStatsDataService.getAndFormatStatsData("0000010101");
```
````

### エラーハンドリング

```typescript
try {
  const data = await EstatStatsDataService.getAndFormatStatsData(statsDataId);
} catch (error) {
  if (error instanceof EstatStatsDataFetchError) {
    console.error("データ取得エラー:", error.message);
  }
}
```

````

## デバッグ

### 1. ログの活用

```typescript
// 良い例: 構造化されたログ
const logStatsDataRequest = (statsDataId: string, options: StatsDataOptions) => {
  console.log('Stats data request:', {
    statsDataId,
    options,
    timestamp: new Date().toISOString()
  });
};
````

### 2. デバッグフラグ

```typescript
// 良い例: デバッグモードの制御
const DEBUG = process.env.NEXT_PUBLIC_ESTAT_DEBUG === "true";

const debugLog = (message: string, data?: unknown) => {
  if (DEBUG) {
    console.log(`[EstatAPI Debug] ${message}`, data);
  }
};
```

## メンテナンス

### 1. 依存関係の管理

```json
{
  "dependencies": {
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

### 2. バージョン管理

```typescript
// 良い例: バージョン情報の管理
export const ESTAT_API_VERSION = "3.0";
export const LIBRARY_VERSION = "1.0.0";

const getUserAgent = () => {
  return `Stats47-API-Client/${LIBRARY_VERSION} (Estat-API/${ESTAT_API_VERSION})`;
};
```

### 3. 後方互換性

```typescript
// 良い例: 後方互換性の維持
interface StatsDataOptions {
  categoryFilter?: string;
  yearFilter?: string;
  areaFilter?: string;
  // 新しいオプションはオプショナルに
  newOption?: string;
}

// 古いAPIとの互換性を保つ
const getStatsData = (statsDataId: string, options?: StatsDataOptions) => {
  // 実装
};
```

## 関連ドキュメント

- [エラーハンドリング戦略](error-handling.md)
- [API 仕様](api-endpoints.md)
- [型システム](type-system.md)
- [meta-info 実装ガイド](../meta-info/implementation/)
- [stats-data 実装ガイド](../stats-data/implementation/)
- [stats-list 実装ガイド](../stats-list/implementation/)
