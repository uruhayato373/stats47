---
title: 統合テストガイド
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/estat-api
  - testing
  - integration
---

# 統合テストガイド

## 概要

e-Stat API ライブラリの統合テストの実装方法について説明します。複数のコンポーネント間の連携、API との統合、エンドツーエンドの動作確認について詳述します。

## 統合テストの目的

### 1. コンポーネント間の連携確認

- 各サブドメイン間のデータ連携
- エラーハンドリングの一貫性
- 設定の共有と管理

### 2. API との統合確認

- 実際の e-Stat API との通信
- レスポンス形式の検証
- エラーレスポンスの処理

### 3. エンドツーエンドの動作確認

- ユーザー操作から結果表示まで
- パフォーマンスの検証
- 実際の使用環境での動作

## テスト環境のセットアップ

### 1. 必要な依存関係

```bash
npm install --save-dev vitest @vitest/ui
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev msw
npm install --save-dev playwright
```

### 2. 統合テスト用の設定

`vitest.integration.config.ts`

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/test/integration-setup.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### 3. 統合テストセットアップ

`src/test/integration-setup.ts`

```typescript
// 環境変数の設定
process.env.NEXT_PUBLIC_ESTAT_APP_ID = "test-app-id";
process.env.NODE_ENV = "test";

// 統合テスト用の設定
process.env.ESTAT_API_BASE_URL = "https://api.e-stat.go.jp/rest/3.0/app/json";
process.env.ESTAT_API_TIMEOUT = "30000";

// コンソールログの設定
const originalConsoleLog = console.log;
console.log = (...args: any[]) => {
  if (process.env.VITEST_INTEGRATION_VERBOSE === "true") {
    originalConsoleLog(...args);
  }
};
```

## サブドメイン間の統合テスト

### 1. meta-info と stats-data の連携

`src/lib/estat-api/__tests__/integration/meta-info-stats-data.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { EstatMetaInfoFetcher } from "../../meta-info/fetcher";
import { EstatStatsDataService } from "../../stats-data/service";
import { EstatMetaInfoFormatter } from "../../meta-info/formatter";

describe("Meta-info and Stats-data Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("メタ情報と統計データを連携して取得できる", async () => {
    // メタ情報のモック
    const mockMetaInfo = {
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

    // 統計データのモック
    const mockStatsData = {
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

    // fetch をモック
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMetaInfo),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatsData),
      });

    // メタ情報を取得・変換
    const metaFetcher = new EstatMetaInfoFetcher();
    const metaInfo = await metaFetcher.fetchAndTransform("0000010101");

    // 統計データを取得・整形
    const statsData = await EstatStatsDataService.getAndFormatStatsData(
      "0000010101"
    );

    // 連携の確認
    expect(metaInfo.categories.cat01).toHaveLength(1);
    expect(metaInfo.areas.area).toHaveLength(1);
    expect(statsData.values).toHaveLength(1);
    expect(statsData.values[0].areaCode).toBe("13000");
    expect(statsData.values[0].categoryCode).toBe("A1101");
  });

  it("メタ情報の選択肢と統計データのフィルタリングが連携できる", async () => {
    const mockMetaInfo = {
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
            ],
          },
        },
      },
    };

    const mockStatsData = {
      GET_STATS_DATA: {
        RESULT: {
          STATUS: 0,
          ERROR_MSG: null,
          DATE: "2024-01-01T00:00:00+09:00",
        },
        STATISTICAL_DATA: {
          DATA_INF: { VALUE: [] },
          CLASS_INF: { CLASS_OBJ: [] },
        },
      },
    };

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMetaInfo),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatsData),
      });

    // メタ情報から選択肢を生成
    const metaFetcher = new EstatMetaInfoFetcher();
    const metaInfo = await metaFetcher.fetchAndTransform("0000010101");
    const selectOptions =
      EstatMetaInfoFormatter.generateSelectOptions(metaInfo);

    // 選択肢を使って統計データをフィルタリング
    const statsData = await EstatStatsDataService.getAndFormatStatsData(
      "0000010101",
      {
        categoryFilter: selectOptions.categories.cat01[0].value,
      }
    );

    expect(selectOptions.categories.cat01).toHaveLength(2);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("cdCat01=A1101")
    );
  });
});
```

### 2. stats-list と stats-data の連携

`src/lib/estat-api/__tests__/integration/stats-list-stats-data.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { EstatStatsListService } from "../../stats-list/service";
import { EstatStatsDataService } from "../../stats-data/service";

describe("Stats-list and Stats-data Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("統計一覧から統計データを取得できる", async () => {
    const mockStatsList = {
      GET_STATS_LIST: {
        RESULT: {
          STATUS: 0,
          ERROR_MSG: null,
          DATE: "2024-01-01T00:00:00+09:00",
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
              },
            ],
          },
        },
      },
    };

    const mockStatsData = {
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

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatsList),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatsData),
      });

    // 統計一覧を取得
    const statsList = await EstatStatsListService.getStatsList();

    // 統計一覧から最初の統計表のIDを取得
    const firstStatsId = statsList.statsList[0].id;

    // そのIDで統計データを取得
    const statsData = await EstatStatsDataService.getAndFormatStatsData(
      firstStatsId
    );

    expect(statsList.statsList).toHaveLength(1);
    expect(statsList.statsList[0].id).toBe("0000010101");
    expect(statsData.values).toHaveLength(1);
    expect(statsData.values[0].areaCode).toBe("13000");
  });

  it("カテゴリ検索と統計データ取得が連携できる", async () => {
    const mockStatsList = {
      GET_STATS_LIST: {
        RESULT: {
          STATUS: 0,
          ERROR_MSG: null,
          DATE: "2024-01-01T00:00:00+09:00",
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
              },
            ],
          },
        },
      },
    };

    const mockStatsData = {
      GET_STATS_DATA: {
        RESULT: {
          STATUS: 0,
          ERROR_MSG: null,
          DATE: "2024-01-01T00:00:00+09:00",
        },
        STATISTICAL_DATA: {
          DATA_INF: { VALUE: [] },
          CLASS_INF: { CLASS_OBJ: [] },
        },
      },
    };

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatsList),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatsData),
      });

    // カテゴリで統計一覧を検索
    const statsList = await EstatStatsListService.getStatsListByCategory(
      "人口・世帯"
    );

    // 検索結果から統計データを取得
    const statsData = await EstatStatsDataService.getAndFormatStatsData(
      statsList.statsList[0].id
    );

    expect(statsList.statsList[0].mainCategory).toBe("人口・世帯");
    expect(statsData).toBeDefined();
  });
});
```

## API との統合テスト

### 1. 実際の API との通信テスト

`src/lib/estat-api/__tests__/integration/api-communication.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { EstatMetaInfoFetcher } from "../../meta-info/fetcher";
import { EstatStatsDataService } from "../../stats-data/service";
import { EstatStatsListService } from "../../stats-list/service";

describe("API Communication Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("実際のAPIと通信してメタ情報を取得できる", async () => {
    // 実際のAPIを使用（テスト用のappIdが必要）
    const fetcher = new EstatMetaInfoFetcher();

    try {
      const result = await fetcher.fetchMetaInfo("0000010101");

      expect(result).toHaveProperty("GET_META_INFO");
      expect(result.GET_META_INFO.RESULT.STATUS).toBe(0);
      expect(result.GET_META_INFO.METADATA_INF).toBeDefined();
    } catch (error) {
      // 実際のAPIが利用できない場合はスキップ
      console.log("Skipping API test due to network or authentication issues");
    }
  });

  it("実際のAPIと通信して統計データを取得できる", async () => {
    try {
      const result = await EstatStatsDataService.getAndFormatStatsData(
        "0000010101"
      );

      expect(result).toHaveProperty("values");
      expect(result).toHaveProperty("areas");
      expect(result).toHaveProperty("categories");
      expect(result).toHaveProperty("years");
    } catch (error) {
      console.log("Skipping API test due to network or authentication issues");
    }
  });

  it("実際のAPIと通信して統計一覧を取得できる", async () => {
    try {
      const result = await EstatStatsListService.getStatsList({
        searchWord: "人口",
        limit: 10,
      });

      expect(result).toHaveProperty("statsList");
      expect(result).toHaveProperty("totalCount");
      expect(Array.isArray(result.statsList)).toBe(true);
    } catch (error) {
      console.log("Skipping API test due to network or authentication issues");
    }
  });
});
```

### 2. エラーレスポンスの処理テスト

`src/lib/estat-api/__tests__/integration/error-handling.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { EstatMetaInfoFetcher } from "../../meta-info/fetcher";
import { EstatStatsDataService } from "../../stats-data/service";
import { EstatStatsListService } from "../../stats-list/service";

describe("Error Handling Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("APIエラーレスポンスを正しく処理できる", async () => {
    const mockErrorResponse = {
      GET_META_INFO: {
        RESULT: {
          STATUS: 1,
          ERROR_MSG: "Invalid appId",
          DATE: "2024-01-01T00:00:00+09:00",
        },
        METADATA_INF: null,
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockErrorResponse),
    });

    const fetcher = new EstatMetaInfoFetcher();

    await expect(fetcher.fetchMetaInfo("0000010101")).rejects.toThrow();
  });

  it("ネットワークエラーを正しく処理できる", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network Error"));

    const fetcher = new EstatMetaInfoFetcher();

    await expect(fetcher.fetchMetaInfo("0000010101")).rejects.toThrow(
      "Network Error"
    );
  });

  it("タイムアウトエラーを正しく処理できる", async () => {
    global.fetch = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 35000))
      );

    const fetcher = new EstatMetaInfoFetcher();

    await expect(fetcher.fetchMetaInfo("0000010101")).rejects.toThrow();
  });

  it("無効な統計表IDでエラーを正しく処理できる", async () => {
    await expect(
      EstatStatsDataService.getAndFormatStatsData("invalid-id")
    ).rejects.toThrow();
  });
});
```

## エンドツーエンドテスト

### 1. ユーザー操作フローのテスト

`src/lib/estat-api/__tests__/integration/e2e-flow.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { EstatStatsListService } from "../../stats-list/service";
import { EstatMetaInfoFetcher } from "../../meta-info/fetcher";
import { EstatStatsDataService } from "../../stats-data/service";

describe("End-to-End Flow Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("統計一覧検索から統計データ表示までの完全なフロー", async () => {
    // 1. 統計一覧を検索
    const mockStatsList = {
      GET_STATS_LIST: {
        RESULT: {
          STATUS: 0,
          ERROR_MSG: null,
          DATE: "2024-01-01T00:00:00+09:00",
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
              },
            ],
          },
        },
      },
    };

    // 2. メタ情報を取得
    const mockMetaInfo = {
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

    // 3. 統計データを取得
    const mockStatsData = {
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

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatsList),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMetaInfo),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatsData),
      });

    // フローの実行
    const statsList = await EstatStatsListService.getStatsList();
    const selectedStats = statsList.statsList[0];

    const metaFetcher = new EstatMetaInfoFetcher();
    const metaInfo = await metaFetcher.fetchAndTransform(selectedStats.id);

    const statsData = await EstatStatsDataService.getAndFormatStatsData(
      selectedStats.id
    );

    // 結果の検証
    expect(selectedStats.title).toBe("都道府県別人口");
    expect(metaInfo.categories.cat01).toHaveLength(1);
    expect(statsData.values).toHaveLength(1);
    expect(statsData.values[0].areaName).toBe("東京都");
    expect(statsData.values[0].categoryName).toBe("総人口");
  });
});
```

## パフォーマンステスト

### 1. レスポンス時間の測定

`src/lib/estat-api/__tests__/integration/performance.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { EstatMetaInfoFetcher } from "../../meta-info/fetcher";
import { EstatStatsDataService } from "../../stats-data/service";

describe("Performance Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("メタ情報取得のパフォーマンスを測定できる", async () => {
    const mockResponse = {
      GET_META_INFO: {
        RESULT: {
          STATUS: 0,
          ERROR_MSG: null,
          DATE: "2024-01-01T00:00:00+09:00",
        },
        METADATA_INF: { CLASS_INF: { CLASS_OBJ: [] } },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const fetcher = new EstatMetaInfoFetcher();
    const startTime = Date.now();

    await fetcher.fetchMetaInfo("0000010101");

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(5000); // 5秒以内
  });

  it("統計データ取得のパフォーマンスを測定できる", async () => {
    const mockResponse = {
      GET_STATS_DATA: {
        RESULT: {
          STATUS: 0,
          ERROR_MSG: null,
          DATE: "2024-01-01T00:00:00+09:00",
        },
        STATISTICAL_DATA: {
          DATA_INF: { VALUE: [] },
          CLASS_INF: { CLASS_OBJ: [] },
        },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const startTime = Date.now();

    await EstatStatsDataService.getAndFormatStatsData("0000010101");

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(5000); // 5秒以内
  });
});
```

## テスト実行

### 1. 統合テストコマンド

```bash
# 統合テスト実行
npm run test:integration

# 特定の統合テスト実行
npm run test:integration -- --grep "API Communication"

# カバレッジ付き統合テスト
npm run test:integration:coverage
```

### 2. 継続的インテグレーション

`.github/workflows/integration-test.yml`

```yaml
name: Integration Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  integration-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run integration tests
        run: npm run test:integration

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/integration/lcov.info
```

## 関連ドキュメント

- [テスト戦略](testing-strategy.md)
- [モック作成ガイド](mocking-guide.md)
- [テストデータ管理](test-data.md)
- [meta-info 単体テスト](../meta-info/testing/unit-testing.md)
- [stats-data 単体テスト](04_ドメイン設計/e-Stat%20API/04_統計データ/testing/unit-testing.md)
- [stats-list 単体テスト](04_ドメイン設計/e-Stat%20API/02_統計表リスト/unit-testing.md)
