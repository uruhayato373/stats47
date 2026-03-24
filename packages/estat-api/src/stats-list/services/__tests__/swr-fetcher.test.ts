/**
 * e-Stat Stats List SWR Fetcher のテスト
 *
 * SWR用fetcher関数、キャッシュ戦略、エラーハンドリングを行う関数群のテスト。
 * ドキュメント「docs/05_テスト戦略/13_estat-api.md」に準拠。
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  statsListFetcher,
  statsListFetcherWithErrorHandling,
} from "../swr-fetcher";

import type { EstatStatsListResponse } from "../../types";

// サービスをモック
vi.mock("../cache-key", () => ({
  parseStatsListCacheKey: vi.fn(),
}));

vi.mock("../fetcher", () => ({
  EstatStatsListFetcher: {
    searchByKeyword: vi.fn(),
    searchByStatsCode: vi.fn(),
    searchByField: vi.fn(),
    searchByCollectArea: vi.fn(),
    fetchStatsList: vi.fn(),
  },
}));

vi.mock("../formatter", () => ({
  EstatStatsListFormatter: {
    formatStatsListData: vi.fn(),
  },
}));

import { parseStatsListCacheKey } from "../cache-key";
import { EstatStatsListFetcher } from "../fetcher";
import { EstatStatsListFormatter } from "../formatter";

import type { StatsListSearchResult } from "../../types";

describe("stats-list swr-fetcher", () => {
  const mockSearchResult: StatsListSearchResult = {
    totalCount: 2,
    tables: [],
    pagination: {
      fromNumber: 1,
      toNumber: 2,
      nextKey: undefined,
    },
  };

  const mockStatsListResponse = {
    GET_STATS_LIST: {
      RESULT: {
        STATUS: 0,
        ERROR_MSG: "正常に終了しました。",
        DATE: "2024-01-01T00:00:00.000+09:00",
      },
      DATALIST_INF: {
        NUMBER: 2,
        RESULT_INF: {
          FROM_NUMBER: 1,
          TO_NUMBER: 2,
        },
        TABLE_INF: [],
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("statsListFetcher", () => {
    it("should fetch stats list by keyword", async () => {
      vi.mocked(parseStatsListCacheKey).mockReturnValue({
        searchWord: "人口",
        limit: 100,
      });
      vi.mocked(EstatStatsListFetcher.searchByKeyword).mockResolvedValue(
        mockStatsListResponse as unknown as EstatStatsListResponse
      );
      vi.mocked(EstatStatsListFormatter.formatStatsListData).mockReturnValue(
        mockSearchResult
      );

      const result = await statsListFetcher(
        "/stats-list?searchWord=人口&limit=100"
      );

      expect(result).toEqual(mockSearchResult);
      expect(EstatStatsListFetcher.searchByKeyword).toHaveBeenCalledWith(
        "人口",
        {
          limit: 100,
        }
      );
    });

    it("should fetch stats list by stats code", async () => {
      vi.mocked(parseStatsListCacheKey).mockReturnValue({
        statsCode: "00200502",
        limit: 100,
      });
      vi.mocked(EstatStatsListFetcher.searchByStatsCode).mockResolvedValue(
        mockStatsListResponse as unknown as EstatStatsListResponse
      );
      vi.mocked(EstatStatsListFormatter.formatStatsListData).mockReturnValue(
        mockSearchResult
      );

      const result = await statsListFetcher(
        "/stats-list?statsCode=00200502&limit=100"
      );

      expect(result).toEqual(mockSearchResult);
      expect(EstatStatsListFetcher.searchByStatsCode).toHaveBeenCalledWith(
        "00200502",
        {
          limit: 100,
        }
      );
    });

    it("should fetch stats list by field", async () => {
      vi.mocked(parseStatsListCacheKey).mockReturnValue({
        statsField: "001",
        limit: 100,
      });
      vi.mocked(EstatStatsListFetcher.searchByField).mockResolvedValue(
        mockStatsListResponse as unknown as EstatStatsListResponse
      );
      vi.mocked(EstatStatsListFormatter.formatStatsListData).mockReturnValue(
        mockSearchResult
      );

      const result = await statsListFetcher(
        "/stats-list?statsField=001&limit=100"
      );

      expect(result).toEqual(mockSearchResult);
      expect(EstatStatsListFetcher.searchByField).toHaveBeenCalledWith(
        "001",
        {
          limit: 100,
        }
      );
    });

    it("should fetch stats list by collect area", async () => {
      vi.mocked(parseStatsListCacheKey).mockReturnValue({
        collectArea: "2",
        limit: 100,
      });
      vi.mocked(EstatStatsListFetcher.searchByCollectArea).mockResolvedValue(
        mockStatsListResponse as unknown as EstatStatsListResponse
      );
      vi.mocked(EstatStatsListFormatter.formatStatsListData).mockReturnValue(
        mockSearchResult
      );

      const result = await statsListFetcher(
        "/stats-list?collectArea=2&limit=100"
      );

      expect(result).toEqual(mockSearchResult);
      expect(EstatStatsListFetcher.searchByCollectArea).toHaveBeenCalledWith(
        "2",
        {
          limit: 100,
        }
      );
    });

    it("should fetch stats list with default search", async () => {
      vi.mocked(parseStatsListCacheKey).mockReturnValue({
        limit: 100,
      });
      vi.mocked(EstatStatsListFetcher.fetchStatsList).mockResolvedValue(
        mockStatsListResponse as unknown as EstatStatsListResponse
      );
      vi.mocked(EstatStatsListFormatter.formatStatsListData).mockReturnValue(
        mockSearchResult
      );

      const result = await statsListFetcher("/stats-list?limit=100");

      expect(result).toEqual(mockSearchResult);
      expect(EstatStatsListFetcher.fetchStatsList).toHaveBeenCalledWith({
        limit: 100,
      });
    });

    it("should throw error for invalid cache key", async () => {
      vi.mocked(parseStatsListCacheKey).mockReturnValue(null);

      await expect(
        statsListFetcher("invalid-cache-key")
      ).rejects.toThrow("無効なキャッシュキー");
    });

    it("should handle errors", async () => {
      vi.mocked(parseStatsListCacheKey).mockReturnValue({
        limit: 100,
      });
      vi.mocked(EstatStatsListFetcher.fetchStatsList).mockRejectedValue(
        new Error("API error")
      );

      await expect(statsListFetcher("/stats-list?limit=100")).rejects.toThrow(
        "API error"
      );
    });
  });

  describe("statsListFetcherWithErrorHandling", () => {
    it("should fetch stats list successfully", async () => {
      vi.mocked(parseStatsListCacheKey).mockReturnValue({
        limit: 100,
      });
      vi.mocked(EstatStatsListFetcher.fetchStatsList).mockResolvedValue(
        mockStatsListResponse as unknown as EstatStatsListResponse
      );
      vi.mocked(EstatStatsListFormatter.formatStatsListData).mockReturnValue(
        mockSearchResult
      );

      const result = await statsListFetcherWithErrorHandling(
        "/stats-list?limit=100"
      );

      expect(result).toEqual(mockSearchResult);
    });

    it("should handle errors with error message", async () => {
      vi.mocked(parseStatsListCacheKey).mockReturnValue({
        limit: 100,
      });
      vi.mocked(EstatStatsListFetcher.fetchStatsList).mockRejectedValue(
        new Error("API error")
      );

      await expect(
        statsListFetcherWithErrorHandling("/stats-list?limit=100")
      ).rejects.toThrow("API error");
    });

    it("should handle non-Error exceptions", async () => {
      vi.mocked(parseStatsListCacheKey).mockReturnValue({
        limit: 100,
      });
      vi.mocked(EstatStatsListFetcher.fetchStatsList).mockRejectedValue(
        "String error"
      );

      await expect(
        statsListFetcherWithErrorHandling("/stats-list?limit=100")
      ).rejects.toThrow("統計表リストの取得に失敗しました");
    });
  });
});

