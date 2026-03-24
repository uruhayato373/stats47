/**
 * e-Stat Stats List Fetcher のテスト
 *
 * パラメータ構築、HTTP通信モック、エラーハンドリングを行う関数群のテスト。
 * ドキュメント「docs/05_テスト戦略/13_estat-api.md」に準拠。
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { EstatStatsListFetcher } from "../fetcher";

// HTTP通信をモック
vi.mock("../../../core/client/http-client", () => ({
  executeHttpRequest: vi.fn(),
}));

// 設定をモック
vi.mock("../../../core/config", () => ({
  ESTAT_API: {
    BASE_URL: "https://api.e-stat.go.jp/rest/3.0/app",
    DEFAULT_LANG: "J",
    DATA_FORMAT: "JSON",
  },
  ESTAT_API_CONFIG: {
    REQUEST_TIMEOUT_MS: 1000,
  },
  ESTAT_APP_ID: "test-app-id",
  ESTAT_ENDPOINTS: {
    GET_STATS_LIST: "/json/getStatsList",
  },
}));

import { executeHttpRequest } from "../../../core/client/http-client";

import type { EstatStatsListResponse } from "../../types";

describe("EstatStatsListFetcher", () => {
  const mockStatsListResponse: EstatStatsListResponse = {
    GET_STATS_LIST: {
      RESULT: {
        STATUS: 0,
        ERROR_MSG: "正常に終了しました。",
        DATE: "2024-01-01T00:00:00.000+09:00",
      },
      PARAMETER: {
        LANG: "J",
        DATA_FORMAT: "J",
        SEARCH_KIND: "1",
        REPLACE_SP_CHARS: "0",
      },
      DATALIST_INF: {
        NUMBER: 2,
        RESULT_INF: {
          FROM_NUMBER: 1,
          TO_NUMBER: 2,
          NEXT_KEY: undefined,
        },
        TABLE_INF: [],
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchStatsList", () => {
    it("should fetch stats list successfully", async () => {
      vi.mocked(executeHttpRequest).mockResolvedValue(mockStatsListResponse);

      const result = await EstatStatsListFetcher.fetchStatsList({
        limit: 100,
        startPosition: 1,
      });

      expect(result).toEqual(mockStatsListResponse);
      expect(executeHttpRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          appId: "test-app-id",
          lang: "J",
          dataFormat: "JSON",
          limit: 100,
          startPosition: 1,
        }),
        1000
      );
    });

    it("should map parameter names correctly", async () => {
      vi.mocked(executeHttpRequest).mockResolvedValue(mockStatsListResponse);

      await EstatStatsListFetcher.fetchStatsList({
        statsField: "001",
        statsCode: "00200502",
        searchWord: "人口",
        limit: 100,
        startPosition: 1,
      });

      expect(executeHttpRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          statsField: "001",
          statsCode: "00200502",
          searchWord: "人口",
          limit: 100,
          startPosition: 1,
        }),
        1000
      );
    });

    it("should handle STATUS=1 warning", async () => {
      const warningResponse = {
        ...mockStatsListResponse,
        GET_STATS_LIST: {
          ...mockStatsListResponse.GET_STATS_LIST,
          RESULT: {
            STATUS: 1,
            ERROR_MSG: "一部にエラーがあります",
            DATE: "2024-01-01T00:00:00.000+09:00",
          },
        },
      };

      vi.mocked(executeHttpRequest).mockResolvedValue(warningResponse);

      const result = await EstatStatsListFetcher.fetchStatsList({
        limit: 100,
      });

      expect(result).toEqual(warningResponse);
    });

    it("should handle STATUS>=100 error", async () => {
      const errorResponse = {
        ...mockStatsListResponse,
        GET_STATS_LIST: {
          ...mockStatsListResponse.GET_STATS_LIST,
          RESULT: {
            STATUS: 100,
            ERROR_MSG: "Invalid appId",
            DATE: "2024-01-01T00:00:00.000+09:00",
          },
        },
      };

      vi.mocked(executeHttpRequest).mockResolvedValue(errorResponse);

      await expect(
        EstatStatsListFetcher.fetchStatsList({ limit: 100 })
      ).rejects.toThrow("統計表リストの取得に失敗しました");
    });

    it("should handle network errors", async () => {
      vi.mocked(executeHttpRequest).mockRejectedValue(
        new Error("Network error")
      );

      await expect(
        EstatStatsListFetcher.fetchStatsList({ limit: 100 })
      ).rejects.toThrow("統計表リストの取得に失敗しました");
    });

    it("should handle invalid app ID error", async () => {
      vi.mocked(executeHttpRequest).mockRejectedValue(
        new Error("アプリケーションIDが指定されていません")
      );

      await expect(
        EstatStatsListFetcher.fetchStatsList({ limit: 100 })
      ).rejects.toThrow("アプリケーションIDが指定されていません");
    });

    it("should handle no data found error", async () => {
      vi.mocked(executeHttpRequest).mockRejectedValue(
        new Error("該当するデータが存在しません")
      );

      await expect(
        EstatStatsListFetcher.fetchStatsList({ limit: 100 })
      ).rejects.toThrow("該当するデータが存在しません");
    });

    it("should handle invalid parameter error", async () => {
      vi.mocked(executeHttpRequest).mockRejectedValue(
        new Error("パラメータが不正です")
      );

      await expect(
        EstatStatsListFetcher.fetchStatsList({ limit: 100 })
      ).rejects.toThrow("パラメータが不正です");
    });
  });

  describe("searchByKeyword", () => {
    it("should search by keyword", async () => {
      vi.mocked(executeHttpRequest).mockResolvedValue(mockStatsListResponse);

      const result = await EstatStatsListFetcher.searchByKeyword("人口", {
        limit: 100,
      });

      expect(result).toEqual(mockStatsListResponse);
      expect(executeHttpRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          searchWord: "人口",
          limit: 100,
        }),
        1000
      );
    });
  });

  describe("searchByStatsCode", () => {
    it("should search by stats code", async () => {
      vi.mocked(executeHttpRequest).mockResolvedValue(mockStatsListResponse);

      const result = await EstatStatsListFetcher.searchByStatsCode(
        "00200502",
        { limit: 100 }
      );

      expect(result).toEqual(mockStatsListResponse);
      expect(executeHttpRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          statsCode: "00200502",
          limit: 100,
        }),
        1000
      );
    });
  });

  describe("searchByField", () => {
    it("should search by field", async () => {
      vi.mocked(executeHttpRequest).mockResolvedValue(mockStatsListResponse);

      const result = await EstatStatsListFetcher.searchByField("001", {
        limit: 100,
      });

      expect(result).toEqual(mockStatsListResponse);
      expect(executeHttpRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          statsField: "001",
          limit: 100,
        }),
        1000
      );
    });
  });

  describe("searchByCollectArea", () => {
    it("should search by collect area", async () => {
      vi.mocked(executeHttpRequest).mockResolvedValue(mockStatsListResponse);

      const result = await EstatStatsListFetcher.searchByCollectArea("2", {
        limit: 100,
      });

      expect(result).toEqual(mockStatsListResponse);
      expect(executeHttpRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          collectArea: "2",
          limit: 100,
        }),
        1000
      );
    });
  });

  describe("fetchAllWithPaging", () => {
    it("should fetch all data with paging", async () => {
      vi.mocked(executeHttpRequest).mockResolvedValue(mockStatsListResponse);

      const result = await EstatStatsListFetcher.fetchAllWithPaging({
        limit: 100,
      });

      expect(result).toBeDefined();
      expect(executeHttpRequest).toHaveBeenCalled();
    });
  });
});

