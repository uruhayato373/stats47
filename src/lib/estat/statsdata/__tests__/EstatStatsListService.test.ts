import { describe, it, expect, vi } from "vitest";
import { EstatStatsListService } from "../../statslist/EstatStatsListService";

// Mock estatAPI
vi.mock("@/services/estat-api", () => ({
  estatAPI: {
    getStatsList: vi.fn(),
  },
}));

describe("EstatStatsListService", () => {
  describe("formatStatsList", () => {
    it("should format stats list correctly", () => {
      const mockResponse = {
        GET_STATS_LIST: {
          DATALIST_INF: {
            LIST_INF: {
              TABLE_INF: [
                {
                  "@id": "0000010101",
                  STAT_NAME: { $: "人口推計" },
                  TITLE: {
                    $: "人口推計 / 人口推計 / 都道府県，年齢（５歳階級），男女別人口",
                  },
                  GOV_ORG: { $: "総務省" },
                  STATISTICS_NAME: "人口推計",
                  SURVEY_DATE: "2020年10月",
                  UPDATED_DATE: "2021-03-31",
                },
                {
                  "@id": "0000010102",
                  STAT_NAME: { $: "国勢調査" },
                  TITLE: {
                    $: "国勢調査 / 人口等基本集計 / 男女，年齢，配偶関係",
                  },
                  GOV_ORG: { $: "総務省" },
                  STATISTICS_NAME: "国勢調査",
                  SURVEY_DATE: "2020年10月",
                  UPDATED_DATE: "2021-11-30",
                },
              ],
            },
          },
        },
      };

      const result = EstatStatsListService.formatStatsList(mockResponse as any);

      expect(result).toHaveLength(2);

      // Check first item
      expect(result[0]).toEqual({
        id: "0000010101",
        statName: "人口推計",
        title: "人口推計 / 人口推計 / 都道府県，年齢（５歳階級），男女別人口",
        govOrg: "総務省",
        statisticsName: "人口推計",
        surveyDate: "2020年10月",
        updatedDate: "2021-03-31",
        description: undefined,
      });

      // Check second item
      expect(result[1]).toEqual({
        id: "0000010102",
        statName: "国勢調査",
        title: "国勢調査 / 人口等基本集計 / 男女，年齢，配偶関係",
        govOrg: "総務省",
        statisticsName: "国勢調査",
        surveyDate: "2020年10月",
        updatedDate: "2021-11-30",
        description: undefined,
      });
    });

    it("should handle single table response", () => {
      const mockResponse = {
        GET_STATS_LIST: {
          DATALIST_INF: {
            LIST_INF: {
              TABLE_INF: {
                "@id": "0000010101",
                STAT_NAME: { $: "人口推計" },
                TITLE: { $: "人口推計" },
                GOV_ORG: { $: "総務省" },
                STATISTICS_NAME: "人口推計",
                SURVEY_DATE: "2020年10月",
                UPDATED_DATE: "2021-03-31",
              },
            },
          },
        },
      };

      const result = EstatStatsListService.formatStatsList(mockResponse as any);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("0000010101");
    });

    it("should handle empty response", () => {
      const mockResponse = {
        GET_STATS_LIST: {
          DATALIST_INF: {
            LIST_INF: {
              TABLE_INF: [],
            },
          },
        },
      };

      const result = EstatStatsListService.formatStatsList(mockResponse as any);

      expect(result).toEqual([]);
    });

    it("should handle missing optional fields", () => {
      const mockResponse = {
        GET_STATS_LIST: {
          DATALIST_INF: {
            LIST_INF: {
              TABLE_INF: [
                {
                  "@id": "0000010101",
                  // Missing some optional fields
                },
              ],
            },
          },
        },
      };

      const result = EstatStatsListService.formatStatsList(mockResponse as any);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "0000010101",
        statName: "",
        title: "",
        govOrg: "",
        statisticsName: "",
        surveyDate: "",
        updatedDate: "",
        description: undefined,
      });
    });
  });

  describe("getStatsListRaw", () => {
    it("should call estatAPI with correct default parameters", async () => {
      const { estatAPI } = await import("@/services/estat-api");
      const mockResponse = { GET_STATS_LIST: {} };
      (estatAPI.getStatsList as any).mockResolvedValue(mockResponse);

      const result = await EstatStatsListService.getStatsListRaw();

      expect(estatAPI.getStatsList).toHaveBeenCalledWith({
        searchKind: "1",
        startPosition: 1,
        limit: 20,
      });
      expect(result).toBe(mockResponse);
    });

    it("should call estatAPI with custom parameters", async () => {
      const { estatAPI } = await import("@/services/estat-api");
      const mockResponse = { GET_STATS_LIST: {} };
      (estatAPI.getStatsList as any).mockResolvedValue(mockResponse);

      const options = {
        searchWord: "人口",
        searchKind: "2",
        startPosition: 10,
        limit: 50,
      };

      await EstatStatsListService.getStatsListRaw(options);

      expect(estatAPI.getStatsList).toHaveBeenCalledWith({
        searchKind: "2",
        startPosition: 10,
        limit: 50,
        searchWord: "人口",
      });
    });

    it("should throw error when API call fails", async () => {
      const { estatAPI } = await import("@/services/estat-api");
      const errorMessage = "API Error";
      (estatAPI.getStatsList as any).mockRejectedValue(new Error(errorMessage));

      await expect(EstatStatsListService.getStatsListRaw()).rejects.toThrow(
        "統計データリストの取得に失敗しました: API Error"
      );
    });
  });

  describe("getAndFormatStatsList", () => {
    it("should get and format stats list in one call", async () => {
      const { estatAPI } = await import("@/services/estat-api");
      const mockResponse = {
        GET_STATS_LIST: {
          DATALIST_INF: {
            LIST_INF: {
              TABLE_INF: [
                {
                  "@id": "0000010101",
                  STAT_NAME: { $: "人口推計" },
                  TITLE: { $: "人口推計" },
                  GOV_ORG: { $: "総務省" },
                  STATISTICS_NAME: "人口推計",
                  SURVEY_DATE: "2020年10月",
                  UPDATED_DATE: "2021-03-31",
                },
              ],
            },
          },
        },
      };
      (estatAPI.getStatsList as any).mockResolvedValue(mockResponse);

      const result = await EstatStatsListService.getAndFormatStatsList();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("0000010101");
      expect(result[0].statName).toBe("人口推計");
    });
  });
});
