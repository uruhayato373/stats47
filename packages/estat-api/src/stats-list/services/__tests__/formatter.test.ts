/**
 * e-Stat Stats List Formatter のテスト
 *
 * 統計表リストレスポンスの整形とデータ変換を行う関数群のテスト。
 * ドキュメント「docs/05_テスト戦略/13_estat-api.md」に準拠。
 */

import { describe, expect, it } from "vitest";

import { EstatStatsListFormatter } from "../formatter";

import type {
  EstatStatsListResponse,
  StatsListSearchResult,
  StatsListTableInfo,
  EstatTableListItem,
} from "../../types";

describe("EstatStatsListFormatter", () => {
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
        TABLE_INF: [
          {
            "@id": "0000010101",
            STAT_NAME: {
              "@code": "00200502",
              $: "社会・人口統計体系",
            },
            GOV_ORG: {
              "@code": "00200",
              $: "総務省",
            },
            STATISTICS_NAME: "都道府県データ 基礎データ",
            TITLE: {
              "@no": "0000010101",
              $: "Ａ　人口・世帯",
            },
            CYCLE: "年度次",
            SURVEY_DATE: "2020",
            OPEN_DATE: "2021-01-01",
            SMALL_AREA: "0",
            OVERALL_TOTAL_NUMBER: 1000,
            UPDATED_DATE: "2021-01-01",
            MAIN_CATEGORY: {
              "@code": "99",
              $: "その他",
            },
            SUB_CATEGORY: {
              "@code": "99",
              $: "その他",
            },
          },
          {
            "@id": "0000020201",
            STAT_NAME: {
              "@code": "00200503",
              $: "社会・人口統計体系",
            },
            GOV_ORG: {
              "@code": "00200",
              $: "総務省",
            },
            STATISTICS_NAME: "市区町村データ 基礎データ",
            TITLE: {
              "@no": "0000020201",
              $: "Ｂ　人口・世帯",
            },
            CYCLE: "年度次",
            SURVEY_DATE: "2020",
            OPEN_DATE: "2021-01-01",
            SMALL_AREA: "1",
            OVERALL_TOTAL_NUMBER: 2000,
            UPDATED_DATE: "2021-01-01",
          },
        ],
      },
    },
  };

  describe("formatStatsListData", () => {
    it("should format stats list response correctly", () => {
      const result = EstatStatsListFormatter.formatStatsListData(
        mockStatsListResponse
      );

      expect(result).toBeDefined();
      expect(result.totalCount).toBe(2);
      expect(result.tables).toBeInstanceOf(Array);
      expect(result.tables.length).toBe(2);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.fromNumber).toBe(1);
      expect(result.pagination.toNumber).toBe(2);
    });

    it("should handle pagination information", () => {
      const responseWithPagination: EstatStatsListResponse = {
        ...mockStatsListResponse,
        GET_STATS_LIST: {
          ...mockStatsListResponse.GET_STATS_LIST,
          DATALIST_INF: {
            ...mockStatsListResponse.GET_STATS_LIST.DATALIST_INF,
            RESULT_INF: {
              FROM_NUMBER: 1,
              TO_NUMBER: 2,
              NEXT_KEY: 3,
            },
          },
        },
      };

      const result = EstatStatsListFormatter.formatStatsListData(
        responseWithPagination
      );

      expect(result.pagination.nextKey).toBe(3);
    });

    it("should handle empty table list", () => {
      const emptyResponse: EstatStatsListResponse = {
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
            NUMBER: 0,
            RESULT_INF: {
              FROM_NUMBER: 0,
              TO_NUMBER: 0,
              NEXT_KEY: undefined,
            },
          },
        },
      };

      const result = EstatStatsListFormatter.formatStatsListData(
        emptyResponse
      );

      expect(result.totalCount).toBe(0);
      expect(result.tables).toEqual([]);
      expect(result.pagination.fromNumber).toBe(0);
      expect(result.pagination.toNumber).toBe(0);
    });

    it("should handle single table item", () => {
      const singleTableResponse: EstatStatsListResponse = {
        ...mockStatsListResponse,
        GET_STATS_LIST: {
          ...mockStatsListResponse.GET_STATS_LIST,
          DATALIST_INF: {
            ...mockStatsListResponse.GET_STATS_LIST.DATALIST_INF,
            NUMBER: 1,
            RESULT_INF: {
              FROM_NUMBER: 1,
              TO_NUMBER: 1,
              NEXT_KEY: undefined,
            },
            TABLE_INF: Array.isArray(mockStatsListResponse.GET_STATS_LIST.DATALIST_INF.TABLE_INF)
              ? mockStatsListResponse.GET_STATS_LIST.DATALIST_INF.TABLE_INF[0]
              : mockStatsListResponse.GET_STATS_LIST.DATALIST_INF.TABLE_INF,
          },
        },
      };

      const result = EstatStatsListFormatter.formatStatsListData(
        singleTableResponse
      );

      expect(result.totalCount).toBe(1);
      expect(result.tables.length).toBe(1);
    });
  });

  describe("formatTableInfo", () => {
    it("should format table info correctly", () => {
      const tableInf = mockStatsListResponse.GET_STATS_LIST.DATALIST_INF
        .TABLE_INF;
      const tableInfo = Array.isArray(tableInf) ? tableInf[0] : tableInf;

      if (!tableInfo) {
        throw new Error("Table info not found");
      }

      const result = EstatStatsListFormatter.formatTableInfo(tableInfo);

      expect(result.id).toBe("0000010101");
      expect(result.statName).toBe("社会・人口統計体系");
      expect(result.govOrg).toBe("総務省");
      expect(result.statisticsName).toBe("都道府県データ 基礎データ");
      expect(result.title).toBe("Ａ　人口・世帯");
      expect(result.cycle).toBe("年度次");
      expect(result.surveyDate).toBe("2020");
      expect(result.openDate).toBe("2021-01-01");
      expect(result.smallArea).toBe("0");
      expect(result.totalNumber).toBe(1000);
      expect(result.updatedDate).toBe("2021-01-01");
    });

    it("should handle optional fields", () => {
      const tableInf = mockStatsListResponse.GET_STATS_LIST.DATALIST_INF
        .TABLE_INF;
      const tableInfo = Array.isArray(tableInf) ? tableInf[0] : tableInf;

      if (!tableInfo) {
        throw new Error("Table info not found");
      }

      const result = EstatStatsListFormatter.formatTableInfo(tableInfo);

      expect(result.mainCategory).toBeDefined();
      expect(result.mainCategory?.code).toBe("99");
      expect(result.mainCategory?.name).toBe("その他");
      expect(result.subCategory).toBeDefined();
      expect(result.subCategory?.code).toBe("99");
      expect(result.subCategory?.name).toBe("その他");
    });

    it("should handle missing optional fields", () => {
      const tableInfoWithoutOptional = {
        "@id": "0000010101",
        STAT_NAME: {
          "@code": "00200502",
          $: "社会・人口統計体系",
        },
        GOV_ORG: {
          "@code": "00200",
          $: "総務省",
        },
        STATISTICS_NAME: "都道府県データ 基礎データ",
        TITLE: {
          "@no": "0000010101",
          $: "Ａ　人口・世帯",
        },
      };

      const result = EstatStatsListFormatter.formatTableInfo(
        tableInfoWithoutOptional as unknown as EstatTableListItem
      );

      expect(result.id).toBe("0000010101");
      expect(result.mainCategory).toBeUndefined();
      expect(result.subCategory).toBeUndefined();
    });
  });

  describe("extractMetadata", () => {
    it("should extract metadata correctly", () => {
      const result = EstatStatsListFormatter.extractMetadata(
        mockStatsListResponse
      );

      expect(result.status).toBe(0);
      expect(result.errorMessage).toBe("正常に終了しました。");
      expect(result.date).toBe("2024-01-01T00:00:00.000+09:00");
      expect(result.totalCount).toBe(2);
      expect(result.fromNumber).toBe(1);
      expect(result.toNumber).toBe(2);
    });
  });

  describe("groupByField", () => {
    it("should group tables by field", () => {
      const result = EstatStatsListFormatter.formatStatsListData(
        mockStatsListResponse
      );

      const grouped = EstatStatsListFormatter.groupByField(result.tables);

      expect(grouped).toBeDefined();
      expect(Object.keys(grouped).length).toBeGreaterThan(0);
    });
  });

  describe("groupByYear", () => {
    it("should group tables by year", () => {
      const result = EstatStatsListFormatter.formatStatsListData(
        mockStatsListResponse
      );

      const grouped = EstatStatsListFormatter.groupByYear(result.tables);

      expect(grouped).toBeDefined();
      expect(Object.keys(grouped).length).toBeGreaterThan(0);
    });
  });

  describe("groupByOrganization", () => {
    it("should group tables by organization", () => {
      const result = EstatStatsListFormatter.formatStatsListData(
        mockStatsListResponse
      );

      const grouped = EstatStatsListFormatter.groupByOrganization(result.tables);

      expect(grouped).toBeDefined();
      expect(Object.keys(grouped).length).toBeGreaterThan(0);
    });
  });

  describe("groupByCycle", () => {
    it("should group tables by cycle", () => {
      const result = EstatStatsListFormatter.formatStatsListData(
        mockStatsListResponse
      );

      const grouped = EstatStatsListFormatter.groupByCycle(result.tables);

      expect(grouped).toBeDefined();
      expect(Object.keys(grouped).length).toBeGreaterThan(0);
    });
  });

  describe("sortResults", () => {
    it("should sort by surveyDate", () => {
      const result = EstatStatsListFormatter.formatStatsListData(
        mockStatsListResponse
      );

      const sorted = EstatStatsListFormatter.sortResults(
        result.tables,
        "surveyDate",
        "desc"
      );

      expect(sorted).toBeInstanceOf(Array);
      expect(sorted.length).toBe(result.tables.length);
    });

    it("should sort by openDate", () => {
      const result = EstatStatsListFormatter.formatStatsListData(
        mockStatsListResponse
      );

      const sorted = EstatStatsListFormatter.sortResults(
        result.tables,
        "openDate",
        "asc"
      );

      expect(sorted).toBeInstanceOf(Array);
    });

    it("should sort by updatedDate", () => {
      const result = EstatStatsListFormatter.formatStatsListData(
        mockStatsListResponse
      );

      const sorted = EstatStatsListFormatter.sortResults(
        result.tables,
        "updatedDate",
        "desc"
      );

      expect(sorted).toBeInstanceOf(Array);
    });

    it("should sort by statName", () => {
      const result = EstatStatsListFormatter.formatStatsListData(
        mockStatsListResponse
      );

      const sorted = EstatStatsListFormatter.sortResults(
        result.tables,
        "statName",
        "asc"
      );

      expect(sorted).toBeInstanceOf(Array);
    });
  });

  describe("filterResults", () => {
    it("should filter by cycle", () => {
      const result = EstatStatsListFormatter.formatStatsListData(
        mockStatsListResponse
      );

      const filtered = EstatStatsListFormatter.filterResults(result.tables, {
        cycleFilter: ["年度次"],
      });

      expect(filtered).toBeInstanceOf(Array);
      filtered.forEach((table) => {
        expect(table.cycle).toBe("年度次");
      });
    });

    it("should filter by date range", () => {
      const result = EstatStatsListFormatter.formatStatsListData(
        mockStatsListResponse
      );

      const filtered = EstatStatsListFormatter.filterResults(result.tables, {
        dateRange: {
          from: "2020-01-01",
          to: "2020-12-31",
        },
      });

      expect(filtered).toBeInstanceOf(Array);
    });
  });

  describe("formatDetailedTableInfo", () => {
    it("should format detailed table info", () => {
      const tableInf = mockStatsListResponse.GET_STATS_LIST.DATALIST_INF
        .TABLE_INF;
      const tableInfo = Array.isArray(tableInf) ? tableInf[0] : tableInf;

      if (!tableInfo) {
        throw new Error("Table info not found");
      }

      const result = EstatStatsListFormatter.formatDetailedTableInfo(tableInfo);

      expect(result).toBeDefined();
      expect(result.id).toBe("0000010101");
      expect(result).toHaveProperty("collectArea");
      expect(result).toHaveProperty("description");
      expect(result).toHaveProperty("statisticsNameSpec");
    });
  });
});

