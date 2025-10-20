---
title: モック作成ガイド
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/estat-api
  - testing
  - mocking
---

# モック作成ガイド

## 概要

e-Stat API ライブラリのテストで使用するモックの作成方法について説明します。API レスポンス、エラーケース、テストデータの管理について詳述します。

## モックの目的

### 1. 外部依存の分離

- e-Stat API との通信をモック化
- ネットワークエラーのシミュレーション
- テストの安定性と速度の向上

### 2. テストケースの制御

- 特定のレスポンスパターンのテスト
- エラーケースの再現
- 境界値テストの実装

### 3. 開発環境の独立性

- インターネット接続不要
- API 制限の回避
- 一貫したテスト結果

## モックライブラリの選択

### 1. Vitest (推奨)

```bash
npm install --save-dev vitest
```

**メリット:**

- TypeScript 対応
- 高速実行
- 豊富なモック機能
- 統合テスト対応

### 2. MSW (Mock Service Worker)

```bash
npm install --save-dev msw
```

**メリット:**

- 実際の HTTP リクエストをインターセプト
- ブラウザと Node.js の両方で動作
- より現実的なテスト環境

## API レスポンスのモック

### 1. 基本的なモック構造

`src/test/mocks/estat-api-responses.ts`

```typescript
export const mockEstatMetaInfoResponse = {
  GET_META_INFO: {
    RESULT: {
      STATUS: 0,
      ERROR_MSG: null,
      DATE: "2024-01-01T00:00:00+09:00",
    },
    METADATA_INF: {
      CLASS_INF: {
        CLASS_OBJ: [
          {
            "@id": "cat01",
            "@name": "分類",
            CLASS: [
              {
                "@code": "A1101",
                "@name": "総人口",
                "@level": "1",
              },
              {
                "@code": "A1102",
                "@name": "男性人口",
                "@level": "1",
              },
            ],
          },
          {
            "@id": "area",
            "@name": "地域",
            CLASS: [
              {
                "@code": "13000",
                "@name": "東京都",
                "@level": "1",
              },
              {
                "@code": "27000",
                "@name": "大阪府",
                "@level": "1",
              },
            ],
          },
          {
            "@id": "time",
            "@name": "時間",
            CLASS: [
              {
                "@code": "2020",
                "@name": "2020年",
              },
              {
                "@code": "2021",
                "@name": "2021年",
              },
              {
                "@code": "2022",
                "@name": "2022年",
              },
            ],
          },
        ],
      },
    },
  },
};

export const mockEstatStatsDataResponse = {
  GET_STATS_DATA: {
    RESULT: {
      STATUS: 0,
      ERROR_MSG: null,
      DATE: "2024-01-01T00:00:00+09:00",
    },
    STATISTICAL_DATA: {
      DATA_INF: {
        VALUE: [
          {
            "@area": "13000",
            "@cat01": "A1101",
            "@time": "2023",
            $: "14000000",
          },
          {
            "@area": "27000",
            "@cat01": "A1101",
            "@time": "2023",
            $: "8800000",
          },
        ],
      },
      CLASS_INF: {
        CLASS_OBJ: [
          {
            "@id": "area",
            "@name": "地域",
            CLASS: [
              {
                "@code": "13000",
                "@name": "東京都",
              },
              {
                "@code": "27000",
                "@name": "大阪府",
              },
            ],
          },
          {
            "@id": "cat01",
            "@name": "分類",
            CLASS: [
              {
                "@code": "A1101",
                "@name": "総人口",
              },
            ],
          },
          {
            "@id": "time",
            "@name": "時間",
            CLASS: [
              {
                "@code": "2023",
                "@name": "2023年",
              },
            ],
          },
        ],
      },
    },
  },
};

export const mockEstatStatsListResponse = {
  GET_STATS_LIST: {
    RESULT: {
      STATUS: 0,
      ERROR_MSG: null,
      DATE: "2024-01-01T00:00:00+09:00",
    },
    DATALIST_INF: {
      NUMBER: 2,
      RESULT: {
        INF: [
          {
            "@id": "0000010101",
            STAT_NAME: "人口推計",
            TITLE: "都道府県別人口",
            CYCLE: "年次",
            SURVEY_DATE: "2023年",
            GOV_ORG: "総務省",
            STATISTICS_NAME: "人口推計",
            TITLE_SPEC: "都道府県別人口",
            CYCLE_SPEC: "年次",
            SURVEY_DATE_SPEC: "2023年",
            GOV_ORG_SPEC: "総務省",
            COLLECT_AREA: "全国",
            MAIN_CATEGORY: "人口・世帯",
            SUB_CATEGORY: "人口",
            OVERALL_TOTAL_NUMBER: 1,
            UPDATED_DATE: "2024-01-01",
          },
          {
            "@id": "0000010102",
            STAT_NAME: "人口推計",
            TITLE: "市区町村別人口",
            CYCLE: "年次",
            SURVEY_DATE: "2023年",
            GOV_ORG: "総務省",
            STATISTICS_NAME: "人口推計",
            TITLE_SPEC: "市区町村別人口",
            CYCLE_SPEC: "年次",
            SURVEY_DATE_SPEC: "2023年",
            GOV_ORG_SPEC: "総務省",
            COLLECT_AREA: "全国",
            MAIN_CATEGORY: "人口・世帯",
            SUB_CATEGORY: "人口",
            OVERALL_TOTAL_NUMBER: 1,
            UPDATED_DATE: "2024-01-01",
          },
        ],
      },
    },
  },
};
```

### 2. エラーレスポンスのモック

`src/test/mocks/error-responses.ts`

```typescript
export const mockApiErrorResponse = {
  GET_META_INFO: {
    RESULT: {
      STATUS: 1,
      ERROR_MSG: "Invalid appId",
      DATE: "2024-01-01T00:00:00+09:00",
    },
    METADATA_INF: null,
  },
};

export const mockNetworkError = new Error("Network Error");

export const mockTimeoutError = new Error("Request timeout");

export const mockValidationError = {
  GET_META_INFO: {
    RESULT: {
      STATUS: 1,
      ERROR_MSG: "Invalid statsDataId format",
      DATE: "2024-01-01T00:00:00+09:00",
    },
    METADATA_INF: null,
  },
};
```

## Vitest でのモック実装

### 1. fetch のモック

`src/test/mocks/fetch-mock.ts`

```typescript
import { vi } from "vitest";
import { mockEstatMetaInfoResponse } from "./estat-api-responses";

export const createFetchMock = (
  response: any,
  options: {
    ok?: boolean;
    status?: number;
    statusText?: string;
  } = {}
) => {
  return vi.fn().mockResolvedValue({
    ok: options.ok ?? true,
    status: options.status ?? 200,
    statusText: options.statusText ?? "OK",
    json: () => Promise.resolve(response),
  });
};

export const createErrorFetchMock = (error: Error) => {
  return vi.fn().mockRejectedValue(error);
};

// 使用例
export const setupMetaInfoMock = () => {
  global.fetch = createFetchMock(mockEstatMetaInfoResponse);
};

export const setupErrorMock = () => {
  global.fetch = createErrorFetchMock(new Error("Network Error"));
};
```

### 2. 設定のモック

`src/test/mocks/config-mock.ts`

```typescript
import { vi } from "vitest";

export const mockEstatApiConfig = {
  baseUrl: "https://api.e-stat.go.jp/rest/3.0/app/json",
  appId: "test-app-id",
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  batchSize: 5,
  delayBetweenBatches: 1000,
};

export const setupConfigMock = () => {
  vi.mock("../../lib/estat-api/config", () => ({
    ESTAT_API_CONFIG: mockEstatApiConfig,
    validateConfig: vi.fn().mockReturnValue(true),
  }));
};
```

### 3. データベースのモック

`src/test/mocks/database-mock.ts`

```typescript
import { vi } from "vitest";

export const createMockD1Database = () => {
  return {
    prepare: vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnThis(),
      run: vi.fn().mockResolvedValue({ success: true }),
      all: vi.fn().mockResolvedValue([]),
      first: vi.fn().mockResolvedValue(null),
    }),
    exec: vi.fn().mockResolvedValue({ success: true }),
  };
};

export const createMockDatabaseWithData = (data: any[]) => {
  return {
    prepare: vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnThis(),
      run: vi.fn().mockResolvedValue({ success: true }),
      all: vi.fn().mockResolvedValue(data),
      first: vi.fn().mockResolvedValue(data[0] || null),
    }),
    exec: vi.fn().mockResolvedValue({ success: true }),
  };
};
```

## MSW でのモック実装

### 1. ハンドラーの定義

`src/test/mocks/handlers.ts`

```typescript
import { http, HttpResponse } from "msw";
import { mockEstatMetaInfoResponse } from "./estat-api-responses";

export const handlers = [
  // メタ情報取得
  http.get(
    "https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo",
    ({ request }) => {
      const url = new URL(request.url);
      const statsDataId = url.searchParams.get("statsDataId");

      if (statsDataId === "0000010101") {
        return HttpResponse.json(mockEstatMetaInfoResponse);
      }

      return HttpResponse.json(
        {
          GET_META_INFO: {
            RESULT: {
              STATUS: 1,
              ERROR_MSG: "Invalid statsDataId",
              DATE: "2024-01-01T00:00:00+09:00",
            },
            METADATA_INF: null,
          },
        },
        { status: 400 }
      );
    }
  ),

  // 統計データ取得
  http.get(
    "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData",
    ({ request }) => {
      const url = new URL(request.url);
      const statsDataId = url.searchParams.get("statsDataId");

      if (statsDataId === "0000010101") {
        return HttpResponse.json(mockEstatStatsDataResponse);
      }

      return HttpResponse.json(
        {
          GET_STATS_DATA: {
            RESULT: {
              STATUS: 1,
              ERROR_MSG: "Invalid statsDataId",
              DATE: "2024-01-01T00:00:00+09:00",
            },
            STATISTICAL_DATA: null,
          },
        },
        { status: 400 }
      );
    }
  ),

  // 統計一覧取得
  http.get("https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList", () => {
    return HttpResponse.json(mockEstatStatsListResponse);
  }),

  // エラーハンドラー
  http.get("https://api.e-stat.go.jp/rest/3.0/app/json/*", () => {
    return HttpResponse.json(
      {
        error: "Internal Server Error",
      },
      { status: 500 }
    );
  }),
];
```

### 2. サーバーの設定

`src/test/mocks/server.ts`

```typescript
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);

// テスト開始前
export const startMockServer = () => {
  server.listen({
    onUnhandledRequest: "error",
  });
};

// テスト終了後
export const stopMockServer = () => {
  server.close();
};

// リセット
export const resetMockServer = () => {
  server.resetHandlers();
};
```

### 3. テストでの使用

`src/test/setup-msw.ts`

```typescript
import { beforeAll, afterEach, afterAll } from "vitest";
import {
  startMockServer,
  stopMockServer,
  resetMockServer,
} from "./mocks/server";

beforeAll(() => {
  startMockServer();
});

afterEach(() => {
  resetMockServer();
});

afterAll(() => {
  stopMockServer();
});
```

## テストデータファクトリ

### 1. 基本的なファクトリ

`src/test/factories/estat-api-factory.ts`

```typescript
export class EstatApiFactory {
  static createMetaInfoResponse(overrides: any = {}) {
    return {
      GET_META_INFO: {
        RESULT: {
          STATUS: 0,
          ERROR_MSG: null,
          DATE: "2024-01-01T00:00:00+09:00",
          ...overrides.RESULT,
        },
        METADATA_INF: {
          CLASS_INF: {
            CLASS_OBJ: [
              {
                "@id": "cat01",
                "@name": "分類",
                CLASS: [
                  {
                    "@code": "A1101",
                    "@name": "総人口",
                    "@level": "1",
                  },
                ],
                ...overrides.CLASS_OBJ?.[0],
              },
            ],
            ...overrides.CLASS_INF,
          },
          ...overrides.METADATA_INF,
        },
      },
    };
  }

  static createStatsDataResponse(overrides: any = {}) {
    return {
      GET_STATS_DATA: {
        RESULT: {
          STATUS: 0,
          ERROR_MSG: null,
          DATE: "2024-01-01T00:00:00+09:00",
          ...overrides.RESULT,
        },
        STATISTICAL_DATA: {
          DATA_INF: {
            VALUE: [
              {
                "@area": "13000",
                "@cat01": "A1101",
                "@time": "2023",
                $: "14000000",
              },
            ],
            ...overrides.DATA_INF,
          },
          CLASS_INF: {
            CLASS_OBJ: [
              {
                "@id": "area",
                "@name": "地域",
                CLASS: [
                  {
                    "@code": "13000",
                    "@name": "東京都",
                  },
                ],
              },
            ],
            ...overrides.CLASS_INF,
          },
          ...overrides.STATISTICAL_DATA,
        },
      },
    };
  }

  static createStatsListResponse(overrides: any = {}) {
    return {
      GET_STATS_LIST: {
        RESULT: {
          STATUS: 0,
          ERROR_MSG: null,
          DATE: "2024-01-01T00:00:00+09:00",
          ...overrides.RESULT,
        },
        DATALIST_INF: {
          NUMBER: 1,
          RESULT: {
            INF: [
              {
                "@id": "0000010101",
                STAT_NAME: "人口推計",
                TITLE: "都道府県別人口",
                CYCLE: "年次",
                SURVEY_DATE: "2023年",
                GOV_ORG: "総務省",
                STATISTICS_NAME: "人口推計",
                TITLE_SPEC: "都道府県別人口",
                CYCLE_SPEC: "年次",
                SURVEY_DATE_SPEC: "2023年",
                GOV_ORG_SPEC: "総務省",
                COLLECT_AREA: "全国",
                MAIN_CATEGORY: "人口・世帯",
                SUB_CATEGORY: "人口",
                OVERALL_TOTAL_NUMBER: 1,
                UPDATED_DATE: "2024-01-01",
                ...overrides.INF?.[0],
              },
            ],
            ...overrides.RESULT,
          },
          ...overrides.DATALIST_INF,
        },
      },
    };
  }
}
```

### 2. エラーケースのファクトリ

`src/test/factories/error-factory.ts`

```typescript
export class ErrorFactory {
  static createApiError(status: number, message: string) {
    return {
      GET_META_INFO: {
        RESULT: {
          STATUS: status,
          ERROR_MSG: message,
          DATE: "2024-01-01T00:00:00+09:00",
        },
        METADATA_INF: null,
      },
    };
  }

  static createNetworkError() {
    return new Error("Network Error");
  }

  static createTimeoutError() {
    return new Error("Request timeout");
  }

  static createValidationError(field: string, value: any) {
    return {
      GET_META_INFO: {
        RESULT: {
          STATUS: 1,
          ERROR_MSG: `Invalid ${field}: ${value}`,
          DATE: "2024-01-01T00:00:00+09:00",
        },
        METADATA_INF: null,
      },
    };
  }
}
```

## モックの管理

### 1. モックのリセット

`src/test/helpers/mock-helpers.ts`

```typescript
import { vi } from "vitest";

export const resetAllMocks = () => {
  vi.clearAllMocks();
  vi.resetAllMocks();
  vi.restoreAllMocks();
};

export const setupMockEnvironment = () => {
  // 環境変数の設定
  process.env.NEXT_PUBLIC_ESTAT_APP_ID = "test-app-id";
  process.env.NODE_ENV = "test";

  // コンソールログの抑制
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
};

export const teardownMockEnvironment = () => {
  resetAllMocks();
  vi.restoreAllMocks();
};
```

### 2. モックの検証

`src/test/helpers/mock-verification.ts`

```typescript
import { vi } from "vitest";

export const verifyFetchCall = (expectedUrl: string, expectedOptions?: any) => {
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining(expectedUrl),
    expectedOptions
  );
};

export const verifyFetchCallCount = (expectedCount: number) => {
  expect(global.fetch).toHaveBeenCalledTimes(expectedCount);
};

export const verifyMockCall = (mockFn: any, expectedArgs: any[]) => {
  expect(mockFn).toHaveBeenCalledWith(...expectedArgs);
};
```

## テストでの使用例

### 1. 基本的な使用

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { EstatMetaInfoFetcher } from "../../meta-info/fetcher";
import { setupMetaInfoMock, setupErrorMock } from "../mocks/fetch-mock";

describe("EstatMetaInfoFetcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常にメタ情報を取得できる", async () => {
    setupMetaInfoMock();

    const fetcher = new EstatMetaInfoFetcher();
    const result = await fetcher.fetchMetaInfo("0000010101");

    expect(result).toBeDefined();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("エラー時に適切にハンドリングできる", async () => {
    setupErrorMock();

    const fetcher = new EstatMetaInfoFetcher();

    await expect(fetcher.fetchMetaInfo("0000010101")).rejects.toThrow();
  });
});
```

### 2. 動的なモック

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { EstatApiFactory } from "../factories/estat-api-factory";

describe("Dynamic Mocking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("異なるレスポンスをテストできる", async () => {
    const mockResponse1 = EstatApiFactory.createMetaInfoResponse({
      CLASS_OBJ: [
        {
          "@id": "cat01",
          "@name": "分類",
          CLASS: [
            {
              "@code": "A1101",
              "@name": "総人口",
              "@level": "1",
            },
          ],
        },
      ],
    });

    const mockResponse2 = EstatApiFactory.createMetaInfoResponse({
      CLASS_OBJ: [
        {
          "@id": "cat01",
          "@name": "分類",
          CLASS: [
            {
              "@code": "A1101",
              "@name": "総人口",
              "@level": "1",
            },
            {
              "@code": "A1102",
              "@name": "男性人口",
              "@level": "1",
            },
          ],
        },
      ],
    });

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse1),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse2),
      });

    // テストの実行
    // ...
  });
});
```

## ベストプラクティス

### 1. モックの設計原則

- **単一責任**: 各モックは特定の目的に特化
- **再利用性**: 複数のテストで使用可能
- **保守性**: 変更が容易で理解しやすい

### 2. モックの命名規則

- `mock` プレフィックスを使用
- 目的を明確に表現
- バージョン管理を考慮

### 3. モックの管理

- 中央集権的な管理
- バージョン管理
- ドキュメント化

## 関連ドキュメント

- [テスト戦略](testing-strategy.md)
- [統合テスト](integration-testing.md)
- [テストデータ管理](test-data.md)
- [meta-info 単体テスト](../meta-info/testing/unit-testing.md)
- [stats-data 単体テスト](../stats-data/testing/unit-testing.md)
- [stats-list 単体テスト](../stats-list/testing/unit-testing.md)
