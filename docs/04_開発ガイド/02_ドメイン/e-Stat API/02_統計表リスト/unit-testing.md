---
title: stats-list 単体テストガイド
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/estat-api
  - subdomain/stats-list
  - testing
---

# stats-list 単体テストガイド

## 概要

stats-list サブドメインの単体テストの実装方法について説明します。EstatStatsListService と EstatStatsListFormatter のテスト方法を詳述します。

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
    setupFiles: ["./src/config/test.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### 3. テストセットアップ

`src/config/test.setup.ts`

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

## EstatStatsListService のテスト

### 1. 基本テスト

`src/infrastructure/estat-api/stats-list/__tests__/service.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { EstatStatsListService } from "../service";
import { EstatStatsListFetchError } from "../../errors";

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

describe("EstatStatsListService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getStatsList", () => {
    it("正常に統計一覧を取得できる", async () => {
      const mockResponse = {
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

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await EstatStatsListService.getStatsList();

      expect(result).toHaveProperty("statsList");
      expect(result).toHaveProperty("totalCount");
      expect(result.statsList).toHaveLength(2);
      expect(result.statsList[0]).toMatchObject({
        id: "0000010101",
        statName: "人口推計",
        title: "都道府県別人口",
        cycle: "年次",
        surveyDate: "2023年",
        govOrg: "総務省",
        collectArea: "全国",
        mainCategory: "人口・世帯",
        subCategory: "人口",
        updatedDate: "2024-01-01",
      });
    });

    it("検索オプションが正しく適用される", async () => {
      const mockResponse = {
        GET_STATS_LIST: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: null,
            DATE: "2024-01-01T00:00:00+09:00",
          },
          DATALIST_INF: {
            NUMBER: 0,
            RESULT: { INF: [] },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await EstatStatsListService.getStatsList({
        searchWord: "人口",
        surveyYears: "2023",
        openYears: "2023",
        statsField: "人口・世帯",
        statsField2: "人口",
        govOrg: "総務省",
        cycle: "年次",
        dataType: "統計データ",
        format: "JSON",
        lang: "J",
        startPosition: 1,
        limit: 100,
        sortField: "UPDATED_DATE",
        sortKind: "DESC",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList?appId=test-app-id&searchWord=人口&surveyYears=2023&openYears=2023&statsField=人口・世帯&statsField2=人口&govOrg=総務省&cycle=年次&dataType=統計データ&format=JSON&lang=J&startPosition=1&limit=100&sortField=UPDATED_DATE&sortKind=DESC"
      );
    });

    it("APIエラー時に適切なエラーを投げる", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
      });

      await expect(EstatStatsListService.getStatsList()).rejects.toThrow(
        EstatStatsListFetchError
      );
    });

    it("ネットワークエラー時に適切なエラーを投げる", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network Error"));

      await expect(EstatStatsListService.getStatsList()).rejects.toThrow(
        EstatStatsListFetchError
      );
    });
  });

  describe("searchStatsList", () => {
    it("検索語で統計一覧を検索できる", async () => {
      const mockResponse = {
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

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await EstatStatsListService.searchStatsList("人口");

      expect(result.statsList).toHaveLength(1);
      expect(result.statsList[0].title).toContain("人口");
    });
  });

  describe("getStatsListByCategory", () => {
    it("カテゴリで統計一覧を取得できる", async () => {
      const mockResponse = {
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

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await EstatStatsListService.getStatsListByCategory(
        "人口・世帯"
      );

      expect(result.statsList).toHaveLength(1);
      expect(result.statsList[0].mainCategory).toBe("人口・世帯");
    });
  });
});
```

## EstatStatsListFormatter のテスト

### 1. 基本テスト

`src/infrastructure/estat-api/stats-list/__tests__/formatter.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { EstatStatsListFormatter } from "../formatter";
import { EstatStatsListResponse } from "../../types/stats-list";

describe("EstatStatsListFormatter", () => {
  describe("formatStatsList", () => {
    it("統計一覧を正しく整形できる", () => {
      const mockResponse: EstatStatsListResponse = {
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

      const result = EstatStatsListFormatter.formatStatsList(mockResponse);

      expect(result).toHaveProperty("statsList");
      expect(result).toHaveProperty("totalCount");
      expect(result.statsList).toHaveLength(2);
      expect(result.statsList[0]).toMatchObject({
        id: "0000010101",
        statName: "人口推計",
        title: "都道府県別人口",
        cycle: "年次",
        surveyDate: "2023年",
        govOrg: "総務省",
        collectArea: "全国",
        mainCategory: "人口・世帯",
        subCategory: "人口",
        updatedDate: "2024-01-01",
      });
    });

    it("空のデータを正しく処理できる", () => {
      const mockResponse: EstatStatsListResponse = {
        GET_STATS_LIST: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: null,
            DATE: "2024-01-01T00:00:00+09:00",
          },
          DATALIST_INF: {
            NUMBER: 0,
            RESULT: { INF: [] },
          },
        },
      };

      const result = EstatStatsListFormatter.formatStatsList(mockResponse);

      expect(result.statsList).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });

  describe("formatStatsItem", () => {
    it("統計項目を正しく整形できる", () => {
      const rawItem = {
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
      };

      const result = EstatStatsListFormatter.formatStatsItem(rawItem);

      expect(result).toMatchObject({
        id: "0000010101",
        statName: "人口推計",
        title: "都道府県別人口",
        cycle: "年次",
        surveyDate: "2023年",
        govOrg: "総務省",
        collectArea: "全国",
        mainCategory: "人口・世帯",
        subCategory: "人口",
        updatedDate: "2024-01-01",
      });
    });

    it("NULL値を正しく処理できる", () => {
      const rawItem = {
        "@id": "0000010101",
        STAT_NAME: "人口推計",
        TITLE: null,
        CYCLE: "年次",
        SURVEY_DATE: "2023年",
        GOV_ORG: "総務省",
        STATISTICS_NAME: "人口推計",
        TITLE_SPEC: null,
        CYCLE_SPEC: "年次",
        SURVEY_DATE_SPEC: "2023年",
        GOV_ORG_SPEC: "総務省",
        COLLECT_AREA: "全国",
        MAIN_CATEGORY: "人口・世帯",
        SUB_CATEGORY: "人口",
        OVERALL_TOTAL_NUMBER: 1,
        UPDATED_DATE: "2024-01-01",
      };

      const result = EstatStatsListFormatter.formatStatsItem(rawItem);

      expect(result.title).toBeNull();
    });
  });

  describe("filterByCategory", () => {
    it("カテゴリで正しくフィルタリングできる", () => {
      const statsList = [
        {
          id: "0000010101",
          statName: "人口推計",
          title: "都道府県別人口",
          cycle: "年次",
          surveyDate: "2023年",
          govOrg: "総務省",
          collectArea: "全国",
          mainCategory: "人口・世帯",
          subCategory: "人口",
          updatedDate: "2024-01-01",
        },
        {
          id: "0000010102",
          statName: "経済統計",
          title: "GDP統計",
          cycle: "年次",
          surveyDate: "2023年",
          govOrg: "内閣府",
          collectArea: "全国",
          mainCategory: "経済",
          subCategory: "GDP",
          updatedDate: "2024-01-01",
        },
      ];

      const result = EstatStatsListFormatter.filterByCategory(
        statsList,
        "人口・世帯"
      );

      expect(result).toHaveLength(1);
      expect(result[0].mainCategory).toBe("人口・世帯");
    });
  });

  describe("sortByDate", () => {
    it("日付で正しくソートできる", () => {
      const statsList = [
        {
          id: "0000010101",
          statName: "人口推計",
          title: "都道府県別人口",
          cycle: "年次",
          surveyDate: "2023年",
          govOrg: "総務省",
          collectArea: "全国",
          mainCategory: "人口・世帯",
          subCategory: "人口",
          updatedDate: "2024-01-01",
        },
        {
          id: "0000010102",
          statName: "経済統計",
          title: "GDP統計",
          cycle: "年次",
          surveyDate: "2023年",
          govOrg: "内閣府",
          collectArea: "全国",
          mainCategory: "経済",
          subCategory: "GDP",
          updatedDate: "2024-01-02",
        },
      ];

      const result = EstatStatsListFormatter.sortByDate(statsList, "DESC");

      expect(result[0].updatedDate).toBe("2024-01-02");
      expect(result[1].updatedDate).toBe("2024-01-01");
    });
  });
});
```

## 検索機能のテスト

### 1. 検索テスト

`src/infrastructure/estat-api/stats-list/__tests__/search.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { EstatStatsListService } from "../service";

describe("Stats List Search", () => {
  describe("searchWord", () => {
    it("検索語が正しく適用される", async () => {
      const mockResponse = {
        GET_STATS_LIST: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: null,
            DATE: "2024-01-01T00:00:00+09:00",
          },
          DATALIST_INF: {
            NUMBER: 0,
            RESULT: { INF: [] },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await EstatStatsListService.getStatsList({
        searchWord: "人口",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("searchWord=人口")
      );
    });
  });

  describe("surveyYears", () => {
    it("調査年が正しく適用される", async () => {
      const mockResponse = {
        GET_STATS_LIST: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: null,
            DATE: "2024-01-01T00:00:00+09:00",
          },
          DATALIST_INF: {
            NUMBER: 0,
            RESULT: { INF: [] },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await EstatStatsListService.getStatsList({
        surveyYears: "2023",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("surveyYears=2023")
      );
    });
  });

  describe("statsField", () => {
    it("統計分野が正しく適用される", async () => {
      const mockResponse = {
        GET_STATS_LIST: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: null,
            DATE: "2024-01-01T00:00:00+09:00",
          },
          DATALIST_INF: {
            NUMBER: 0,
            RESULT: { INF: [] },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await EstatStatsListService.getStatsList({
        statsField: "人口・世帯",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("statsField=人口・世帯")
      );
    });
  });

  describe("govOrg", () => {
    it("政府機関が正しく適用される", async () => {
      const mockResponse = {
        GET_STATS_LIST: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: null,
            DATE: "2024-01-01T00:00:00+09:00",
          },
          DATALIST_INF: {
            NUMBER: 0,
            RESULT: { INF: [] },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await EstatStatsListService.getStatsList({
        govOrg: "総務省",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("govOrg=総務省")
      );
    });
  });

  describe("pagination", () => {
    it("ページネーションが正しく適用される", async () => {
      const mockResponse = {
        GET_STATS_LIST: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: null,
            DATE: "2024-01-01T00:00:00+09:00",
          },
          DATALIST_INF: {
            NUMBER: 0,
            RESULT: { INF: [] },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await EstatStatsListService.getStatsList({
        startPosition: 21,
        limit: 20,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("startPosition=21&limit=20")
      );
    });
  });
});
```

## テストデータの管理

### 1. テストデータファクトリ

`src/infrastructure/estat-api/stats-list/__tests__/fixtures/index.ts`

```typescript
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

export const mockFormattedStatsList = {
  statsList: [
    {
      id: "0000010101",
      statName: "人口推計",
      title: "都道府県別人口",
      cycle: "年次",
      surveyDate: "2023年",
      govOrg: "総務省",
      collectArea: "全国",
      mainCategory: "人口・世帯",
      subCategory: "人口",
      updatedDate: "2024-01-01",
    },
    {
      id: "0000010102",
      statName: "人口推計",
      title: "市区町村別人口",
      cycle: "年次",
      surveyDate: "2023年",
      govOrg: "総務省",
      collectArea: "全国",
      mainCategory: "人口・世帯",
      subCategory: "人口",
      updatedDate: "2024-01-01",
    },
  ],
  totalCount: 2,
};
```

## テスト実行

### 1. テストコマンド

```bash
# 全テスト実行
npm test

# 特定のファイルのテスト
npm test stats-list

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
- [stats-list 概要](04_ドメイン設計/e-Stat%20API/02_統計表リスト/overview.md)
- [stats-list 実装ガイド](../implementation/)
