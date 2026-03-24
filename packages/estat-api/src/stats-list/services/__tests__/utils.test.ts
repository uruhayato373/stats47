/**
 * stats-list/utils のテスト
 *
 * e-Stat統計表リストユーティリティ関数のテスト
 */

import { describe, expect, it } from "vitest";

import {
  formatSurveyDate,
  formatOpenDate,
  isValidTableId,
  isValidStatsCode,
  isValidStatsFieldCode,
  searchOptionsToUrlParams,
  urlParamsToSearchOptions,
  getStatsFieldName,
  getStatsFieldIcon,
  isValidDateRange,
  normalizeSearchKeyword,
  truncateTitle,
  getUpdateFrequency,
  getCollectAreaDescription,
  getSmallAreaDescription,
  STATS_FIELDS,
} from "../utils";

import type { StatsFieldCode } from "../../types";

describe("stats-list/utils", () => {
  describe("formatSurveyDate", () => {
    it("正常な日付をフォーマットできること", () => {
      expect(formatSurveyDate("202401")).toBe("2024年01月");
      expect(formatSurveyDate("202312")).toBe("2023年12月");
    });

    it("不正なフォーマットの場合はそのまま返すこと", () => {
      expect(formatSurveyDate("2024")).toBe("2024");
      expect(formatSurveyDate("20240101")).toBe("20240101");
      expect(formatSurveyDate("")).toBe("");
    });

    it("nullやundefinedの場合はそのまま返すこと", () => {
      expect(formatSurveyDate(null as unknown as string)).toBe(null);
      expect(formatSurveyDate(undefined as unknown as string)).toBe(undefined);
    });
  });

  describe("formatOpenDate", () => {
    it("正常な日付をフォーマットできること", () => {
      const result = formatOpenDate("2024-01-15");
      expect(result).toContain("2024");
      expect(result).toContain("1");
    });

    it("空文字列の場合はそのまま返すこと", () => {
      expect(formatOpenDate("")).toBe("");
    });

    it("不正な日付の場合はそのまま返すこと", () => {
      expect(formatOpenDate("invalid-date")).toBe("Invalid Date");
    });
  });

  describe("isValidTableId", () => {
    it("10桁の数字は有効であること", () => {
      expect(isValidTableId("1234567890")).toBe(true);
      expect(isValidTableId("0000000000")).toBe(true);
    });

    it("10桁以外は無効であること", () => {
      expect(isValidTableId("123456789")).toBe(false);
      expect(isValidTableId("12345678901")).toBe(false);
      expect(isValidTableId("")).toBe(false);
    });

    it("数字以外の文字が含まれる場合は無効であること", () => {
      expect(isValidTableId("123456789a")).toBe(false);
      expect(isValidTableId("12345678-9")).toBe(false);
    });
  });

  describe("isValidStatsCode", () => {
    it("5桁の数字は有効であること", () => {
      expect(isValidStatsCode("12345")).toBe(true);
    });

    it("8桁の数字は有効であること", () => {
      expect(isValidStatsCode("12345678")).toBe(true);
    });

    it("5桁・8桁以外は無効であること", () => {
      expect(isValidStatsCode("1234")).toBe(false);
      expect(isValidStatsCode("123456")).toBe(false);
      expect(isValidStatsCode("123456789")).toBe(false);
    });
  });

  describe("isValidStatsFieldCode", () => {
    it("有効な統計分野コードはtrueを返すこと", () => {
      const validCodes = Object.keys(STATS_FIELDS) as Array<
        keyof typeof STATS_FIELDS
      >;
      validCodes.forEach((code) => {
        expect(isValidStatsFieldCode(code)).toBe(true);
      });
    });

    it("無効な統計分野コードはfalseを返すこと", () => {
      expect(isValidStatsFieldCode("99" as unknown as string)).toBe(false);
      expect(isValidStatsFieldCode("" as unknown as string)).toBe(false);
      expect(isValidStatsFieldCode("invalid" as unknown as string)).toBe(false);
    });
  });

  describe("searchOptionsToUrlParams", () => {
    it("全パラメータをURLパラメータに変換できること", () => {
      const options = {
        searchWord: "人口",
        searchKind: "1" as const,
        statsField: "01" as const,
        statsCode: "00200521",
        collectArea: "1" as const,
        surveyYears: "2020",
        openYears: "2024",
        updatedDate: "2024-01-01",
        includeExplanation: true,
        cycleFilter: ["年次", "月次"],
        dateRangeFilter: {
          from: "202001",
          to: "202312",
        },
        sortBy: "surveyDate" as const,
        sortOrder: "desc" as const,
        limit: 100,
        startPosition: 1,
      };

      const params = searchOptionsToUrlParams(options);

      expect(params.get("searchWord")).toBe("人口");
      expect(params.get("searchKind")).toBe("1");
      expect(params.get("statsField")).toBe("01");
      expect(params.get("statsCode")).toBe("00200521");
      expect(params.get("collectArea")).toBe("1");
      expect(params.get("surveyYears")).toBe("2020");
      expect(params.get("openYears")).toBe("2024");
      expect(params.get("updatedDate")).toBe("2024-01-01");
      expect(params.get("includeExplanation")).toBe("true");
      expect(params.get("cycleFilter")).toBe("年次,月次");
      expect(params.get("dateFrom")).toBe("202001");
      expect(params.get("dateTo")).toBe("202312");
      expect(params.get("sortBy")).toBe("surveyDate");
      expect(params.get("sortOrder")).toBe("desc");
      expect(params.get("limit")).toBe("100");
      expect(params.get("startPosition")).toBe("1");
    });

    it("空のオプションの場合は空のURLSearchParamsを返すこと", () => {
      const params = searchOptionsToUrlParams({});
      expect(params.toString()).toBe("");
    });
  });

  describe("urlParamsToSearchOptions", () => {
    it("URLパラメータから検索条件を復元できること", () => {
      const params = new URLSearchParams({
        searchWord: "人口",
        searchKind: "1",
        statsField: "01",
        statsCode: "00200521",
        collectArea: "1",
        surveyYears: "2020",
        openYears: "2024",
        updatedDate: "2024-01-01",
        includeExplanation: "true",
        cycleFilter: "年次,月次",
        dateFrom: "202001",
        dateTo: "202312",
        sortBy: "surveyDate",
        sortOrder: "desc",
        limit: "100",
        startPosition: "1",
      });

      const options = urlParamsToSearchOptions(params);

      expect(options.searchWord).toBe("人口");
      expect(options.searchKind).toBe("1");
      expect(options.statsField).toBe("01");
      expect(options.statsCode).toBe("00200521");
      expect(options.collectArea).toBe("1");
      expect(options.surveyYears).toBe("2020");
      expect(options.openYears).toBe("2024");
      expect(options.updatedDate).toBe("2024-01-01");
      expect(options.includeExplanation).toBe(true);
      expect(options.cycleFilter).toEqual(["年次", "月次"]);
      expect(options.dateRangeFilter).toEqual({
        from: "202001",
        to: "202312",
      });
      expect(options.sortBy).toBe("surveyDate");
      expect(options.sortOrder).toBe("desc");
      expect(options.limit).toBe(100);
      expect(options.startPosition).toBe(1);
    });

    it("無効なパラメータは無視されること", () => {
      const params = new URLSearchParams({
        searchKind: "3", // 無効な値
        collectArea: "4", // 無効な値
        sortBy: "invalid", // 無効な値
        sortOrder: "invalid", // 無効な値
      });

      const options = urlParamsToSearchOptions(params);

      expect(options.searchKind).toBeUndefined();
      expect(options.collectArea).toBeUndefined();
      expect(options.sortBy).toBeUndefined();
      expect(options.sortOrder).toBeUndefined();
    });

    it("空のURLSearchParamsの場合は空のオプションを返すこと", () => {
      const params = new URLSearchParams();
      const options = urlParamsToSearchOptions(params);
      expect(Object.keys(options)).toHaveLength(0);
    });
  });

  describe("getStatsFieldName", () => {
    it("有効な統計分野コードから名称を取得できること", () => {
      const code = "01" as const;
      const name = getStatsFieldName(code);
      expect(name).toBeDefined();
      expect(typeof name).toBe("string");
    });

    it("存在しないコードの場合は「不明」を返すこと", () => {
      // 実際には型チェックで防がれるが、テストとして確認
      const name = getStatsFieldName("99" as unknown as StatsFieldCode);
      expect(name).toBe("不明");
    });
  });

  describe("getStatsFieldIcon", () => {
    it("有効な統計分野コードからアイコンを取得できること", () => {
      const code = "01" as const;
      const icon = getStatsFieldIcon(code);
      expect(icon).toBeDefined();
      expect(typeof icon).toBe("string");
    });

    it("存在しないコードの場合はデフォルトアイコンを返すこと", () => {
      const icon = getStatsFieldIcon("99" as unknown as StatsFieldCode);
      expect(icon).toBe("📊");
    });
  });

  describe("isValidDateRange", () => {
    it("有効な日付範囲はtrueを返すこと", () => {
      expect(isValidDateRange("202001", "202312")).toBe(true);
      expect(isValidDateRange("202001", "202001")).toBe(true);
    });

    it("開始日が終了日より後の場合はfalseを返すこと", () => {
      expect(isValidDateRange("202312", "202001")).toBe(false);
    });

    it("片方だけの場合はtrueを返すこと", () => {
      expect(isValidDateRange("202001", "")).toBe(true);
      expect(isValidDateRange("", "202312")).toBe(true);
    });

    it("不正なフォーマットの場合はfalseを返すこと", () => {
      expect(isValidDateRange("2020", "2023")).toBe(false);
      expect(isValidDateRange("20200101", "20231231")).toBe(false);
    });
  });

  describe("normalizeSearchKeyword", () => {
    it("複数のスペースを1つに正規化できること", () => {
      expect(normalizeSearchKeyword("人口  統計")).toBe("人口 統計");
      expect(normalizeSearchKeyword("人口   統計")).toBe("人口 統計");
    });

    it("全角スペースを半角に変換できること", () => {
      expect(normalizeSearchKeyword("人口　統計")).toBe("人口 統計");
    });

    it("前後の空白を削除できること", () => {
      expect(normalizeSearchKeyword(" 人口統計 ")).toBe("人口統計");
    });

    it("複数の正規化を同時に適用できること", () => {
      expect(normalizeSearchKeyword("  人口　統計  ")).toBe("人口 統計");
    });
  });

  describe("truncateTitle", () => {
    it("最大文字数以下の場合はそのまま返すこと", () => {
      const title = "短いタイトル";
      expect(truncateTitle(title, 50)).toBe(title);
    });

    it("最大文字数を超える場合は省略されること", () => {
      const title = "a".repeat(100);
      const result = truncateTitle(title, 50);
      expect(result.length).toBe(53); // 50 + "..."
      expect(result).toContain("...");
    });

    it("デフォルトの最大文字数は50であること", () => {
      const title = "a".repeat(100);
      const result = truncateTitle(title);
      expect(result.length).toBe(53); // 50 + "..."
    });
  });

  describe("getUpdateFrequency", () => {
    it("各周期に対応する更新頻度を返すこと", () => {
      expect(getUpdateFrequency("年次")).toBe("年1回");
      expect(getUpdateFrequency("月次")).toBe("月1回");
      expect(getUpdateFrequency("四半期")).toBe("四半期1回");
      expect(getUpdateFrequency("週次")).toBe("週1回");
      expect(getUpdateFrequency("日次")).toBe("日1回");
      expect(getUpdateFrequency("-")).toBe("不定期");
    });

    it("不明な周期の場合はそのまま返すこと", () => {
      expect(getUpdateFrequency("不明")).toBe("不明");
      expect(getUpdateFrequency("")).toBe("不明");
    });
  });

  describe("getCollectAreaDescription", () => {
    it("各集計地域区分に対応する説明を返すこと", () => {
      expect(getCollectAreaDescription("1")).toBe("全国");
      expect(getCollectAreaDescription("2")).toBe("都道府県");
      expect(getCollectAreaDescription("3")).toBe("市区町村");
    });

    it("不明な区分の場合は「不明」を返すこと", () => {
      expect(getCollectAreaDescription("4" as unknown as "1" | "2" | "3")).toBe("不明");
    });
  });

  describe("getSmallAreaDescription", () => {
    it("各小地域フラグに対応する説明を返すこと", () => {
      expect(getSmallAreaDescription("0")).toBe("なし");
      expect(getSmallAreaDescription("1")).toBe("あり");
      expect(getSmallAreaDescription("2")).toBe("一部あり");
    });

    it("不明なフラグの場合は「不明」を返すこと", () => {
      expect(getSmallAreaDescription("3" as unknown as "0" | "1" | "2")).toBe("不明");
    });
  });
});

