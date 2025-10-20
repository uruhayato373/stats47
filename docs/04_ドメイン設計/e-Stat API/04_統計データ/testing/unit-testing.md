---
title: stats-data 単体テストガイド
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/estat-api
  - subdomain/stats-data
  - testing
---

# stats-data 単体テストガイド

## 概要

stats-data サブドメインの単体テストの実装方法について説明します。EstatStatsDataService と EstatStatsDataFormatter のテスト方法を詳述します。

## テスト環境のセットアップ

### 1. 必要な依存関係

```bash
npm install --save-dev vitest @vitest/ui
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev msw
```

### 2. Vitest 設定

`vitest.config.ts`

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### 3. テストセットアップ

`src/test/setup.ts`

```typescript
// 環境変数の設定
process.env.NEXT_PUBLIC_ESTAT_APP_ID = "test-app-id";

// コンソールログの抑制（テスト時）
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  if (args[0]?.includes?.("Warning:")) {
    return;
  }
  originalConsoleError(...args);
};
```

## EstatStatsDataService のテスト

### 1. 基本テスト

`src/lib/estat-api/stats-data/__tests__/service.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { EstatStatsDataService } from "../service";
import { EstatStatsDataFetchError } from "../../errors";

// モック
vi.mock("../../config", () => ({
  ESTAT_API_CONFIG: {
    baseUrl: "https://api.e-stat.go.jp/rest/3.0/app/json",
    appId: "test-app-id",
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
}));

describe("EstatStatsDataService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAndFormatStatsData", () => {
    it("正常に統計データを取得・整形できる", async () => {
      const mockResponse = {
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

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await EstatStatsDataService.getAndFormatStatsData(
        "0000010101"
      );

      expect(result).toHaveProperty("values");
      expect(result).toHaveProperty("areas");
      expect(result).toHaveProperty("categories");
      expect(result).toHaveProperty("years");
      expect(result.values).toHaveLength(1);
      expect(result.values[0]).toMatchObject({
        areaCode: "13000",
        areaName: "東京都",
        value: 14000000,
        categoryCode: "A1101",
        categoryName: "総人口",
        timeCode: "2023",
        timeName: "2023年",
      });
    });

    it("フィルタリングオプションが正しく適用される", async () => {
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

      await EstatStatsDataService.getAndFormatStatsData("0000010101", {
        categoryFilter: "A1101",
        yearFilter: "2023",
        areaFilter: "13000",
        limit: 100,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?appId=test-app-id&statsDataId=0000010101&metaGetFlg=Y&cntGetFlg=N&cdCat01=A1101&cdTime=2023&cdArea=13000&limit=100"
      );
    });

    it("APIエラー時に適切なエラーを投げる", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
      });

      await expect(
        EstatStatsDataService.getAndFormatStatsData("0000010101")
      ).rejects.toThrow(EstatStatsDataFetchError);
    });

    it("無効な統計表IDでエラーを投げる", async () => {
      await expect(
        EstatStatsDataService.getAndFormatStatsData("invalid-id")
      ).rejects.toThrow();
    });
  });

  describe("getAvailableYears", () => {
    it("利用可能な年度を正しく取得できる", async () => {
      const mockResponse = {
        GET_STATS_DATA: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: null,
            DATE: "2024-01-01T00:00:00+09:00",
          },
          STATISTICAL_DATA: {
            DATA_INF: { VALUE: [] },
            CLASS_INF: {
              CLASS_OBJ: [
                {
                  "@id": "time",
                  "@name": "時間",
                  CLASS: [
                    { "@code": "2020", "@name": "2020年" },
                    { "@code": "2021", "@name": "2021年" },
                    { "@code": "2022", "@name": "2022年" },
                    { "@code": "2023", "@name": "2023年" },
                  ],
                },
              ],
            },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const years = await EstatStatsDataService.getAvailableYears("0000010101");

      expect(years).toEqual(["2020", "2021", "2022", "2023"]);
    });
  });

  describe("getPrefectureData", () => {
    it("都道府県データを正しく取得できる", async () => {
      const mockResponse = {
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
                  "@area": "01000",
                  "@cat01": "A1101",
                  "@time": "2023",
                  $: "5200000",
                },
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
                    { "@code": "01000", "@name": "北海道" },
                    { "@code": "13000", "@name": "東京都" },
                  ],
                },
              ],
            },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const prefectureData = await EstatStatsDataService.getPrefectureData(
        "0000010101",
        { yearFilter: "2023" }
      );

      expect(prefectureData).toHaveLength(2);
      expect(prefectureData[0]).toMatchObject({
        areaCode: "01000",
        areaName: "北海道",
        value: 5200000,
      });
    });
  });
});
```

## EstatStatsDataFormatter のテスト

### 1. 基本テスト

`src/lib/estat-api/stats-data/__tests__/formatter.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { EstatStatsDataFormatter } from "../formatter";
import { EstatStatsDataResponse } from "../../types/stats-data";

describe("EstatStatsDataFormatter", () => {
  describe("formatStatsData", () => {
    it("統計データを正しく整形できる", () => {
      const mockResponse: EstatStatsDataResponse = {
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

      const result = EstatStatsDataFormatter.formatStatsData(mockResponse);

      expect(result).toHaveProperty("values");
      expect(result).toHaveProperty("areas");
      expect(result).toHaveProperty("categories");
      expect(result).toHaveProperty("years");
      expect(result.values).toHaveLength(1);
      expect(result.values[0]).toMatchObject({
        areaCode: "13000",
        areaName: "東京都",
        value: 14000000,
        categoryCode: "A1101",
        categoryName: "総人口",
        timeCode: "2023",
        timeName: "2023年",
      });
    });

    it("空のデータを正しく処理できる", () => {
      const mockResponse: EstatStatsDataResponse = {
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

      const result = EstatStatsDataFormatter.formatStatsData(mockResponse);

      expect(result.values).toEqual([]);
      expect(result.areas).toEqual([]);
      expect(result.categories).toEqual([]);
      expect(result.years).toEqual([]);
    });

    it("NULL値を正しく処理できる", () => {
      const mockResponse: EstatStatsDataResponse = {
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
                  $: null,
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

      const result = EstatStatsDataFormatter.formatStatsData(mockResponse);

      expect(result.values[0].value).toBeNull();
    });
  });

  describe("formatAreas", () => {
    it("地域データを正しく整形できる", () => {
      const rawAreas = [
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
      ];

      const result = EstatStatsDataFormatter.formatAreas(rawAreas);

      expect(result).toEqual([
        { code: "13000", name: "東京都", level: 1 },
        { code: "27000", name: "大阪府", level: 1 },
      ]);
    });

    it("空のデータを正しく処理できる", () => {
      const result = EstatStatsDataFormatter.formatAreas([]);
      expect(result).toEqual([]);
    });
  });

  describe("formatCategories", () => {
    it("分類データを正しく整形できる", () => {
      const rawCategories = [
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
      ];

      const result = EstatStatsDataFormatter.formatCategories(rawCategories);

      expect(result).toEqual([
        { code: "A1101", name: "総人口", level: 1 },
        { code: "A1102", name: "男性人口", level: 1 },
      ]);
    });
  });

  describe("formatYears", () => {
    it("年度データを正しく整形できる", () => {
      const rawYears = [
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
          ],
        },
      ];

      const result = EstatStatsDataFormatter.formatYears(rawYears);

      expect(result).toEqual([
        { code: "2020", name: "2020年" },
        { code: "2021", name: "2021年" },
      ]);
    });
  });

  describe("formatValues", () => {
    it("値データを正しく整形できる", () => {
      const rawValues = [
        {
          "@area": "13000",
          "@cat01": "A1101",
          "@time": "2023",
          $: "14000000",
        },
      ];

      const areas = [{ code: "13000", name: "東京都", level: 1 }];
      const categories = [{ code: "A1101", name: "総人口", level: 1 }];
      const years = [{ code: "2023", name: "2023年" }];

      const result = EstatStatsDataFormatter.formatValues(
        rawValues,
        areas,
        categories,
        years
      );

      expect(result).toEqual([
        {
          areaCode: "13000",
          areaName: "東京都",
          value: 14000000,
          unit: null,
          categoryCode: "A1101",
          categoryName: "総人口",
          timeCode: "2023",
          timeName: "2023年",
        },
      ]);
    });

    it("NULL値を正しく処理できる", () => {
      const rawValues = [
        {
          "@area": "13000",
          "@cat01": "A1101",
          "@time": "2023",
          $: null,
        },
      ];

      const areas = [{ code: "13000", name: "東京都", level: 1 }];
      const categories = [{ code: "A1101", name: "総人口", level: 1 }];
      const years = [{ code: "2023", name: "2023年" }];

      const result = EstatStatsDataFormatter.formatValues(
        rawValues,
        areas,
        categories,
        years
      );

      expect(result[0].value).toBeNull();
    });
  });
});
```

## フィルタリング機能のテスト

### 1. フィルタリングテスト

`src/lib/estat-api/stats-data/__tests__/filtering.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { EstatStatsDataService } from "../service";

describe("Stats Data Filtering", () => {
  describe("categoryFilter", () => {
    it("分類フィルタが正しく適用される", async () => {
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

      await EstatStatsDataService.getAndFormatStatsData("0000010101", {
        categoryFilter: "A1101",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("cdCat01=A1101")
      );
    });
  });

  describe("yearFilter", () => {
    it("年度フィルタが正しく適用される", async () => {
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

      await EstatStatsDataService.getAndFormatStatsData("0000010101", {
        yearFilter: "2023",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("cdTime=2023")
      );
    });
  });

  describe("areaFilter", () => {
    it("地域フィルタが正しく適用される", async () => {
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

      await EstatStatsDataService.getAndFormatStatsData("0000010101", {
        areaFilter: "13000",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("cdArea=13000")
      );
    });
  });

  describe("limit", () => {
    it("制限数が正しく適用される", async () => {
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

      await EstatStatsDataService.getAndFormatStatsData("0000010101", {
        limit: 100,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("limit=100")
      );
    });
  });
});
```

## テストデータの管理

### 1. テストデータファクトリ

`src/lib/estat-api/stats-data/__tests__/fixtures/index.ts`

```typescript
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

export const mockFormattedStatsData = {
  values: [
    {
      areaCode: "13000",
      areaName: "東京都",
      value: 14000000,
      unit: null,
      categoryCode: "A1101",
      categoryName: "総人口",
      timeCode: "2023",
      timeName: "2023年",
    },
    {
      areaCode: "27000",
      areaName: "大阪府",
      value: 8800000,
      unit: null,
      categoryCode: "A1101",
      categoryName: "総人口",
      timeCode: "2023",
      timeName: "2023年",
    },
  ],
  areas: [
    { code: "13000", name: "東京都", level: 1 },
    { code: "27000", name: "大阪府", level: 1 },
  ],
  categories: [{ code: "A1101", name: "総人口", level: 1 }],
  years: [{ code: "2023", name: "2023年" }],
};
```

## テスト実行

### 1. テストコマンド

```bash
# 全テスト実行
npm test

# 特定のファイルのテスト
npm test stats-data

# カバレッジ付きテスト
npm run test:coverage

# ウォッチモード
npm run test:watch
```

### 2. テスト結果の確認

```bash
# カバレッジレポートの確認
npm run test:coverage

# テスト結果の詳細表示
npm test -- --reporter=verbose
```

## 関連ドキュメント

- [テスト戦略](testing-strategy.md)
- [統合テスト](integration-testing.md)
- [モック作成ガイド](mocking-guide.md)
- [テストデータ管理](test-data.md)
- [stats-data 概要](04_ドメイン設計/e-Stat%20API/04_統計データ/overview.md)
- [stats-data 実装ガイド](../implementation/)
