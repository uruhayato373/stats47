import { describe, it, expect, beforeAll } from "vitest";
import { EstatStatsDataFormatter } from "../formatter";
import { parseEstatValue } from "../../types/stats-data";
import type { EstatStatsDataResponse, FormattedEstatData } from "../../types";
import { mockStatsDataResponse } from "./fixtures";

describe("EstatStatsDataFormatter", () => {
  let response: EstatStatsDataResponse;
  let result: FormattedEstatData;

  beforeAll(() => {
    response = mockStatsDataResponse;
    result = EstatStatsDataFormatter.formatStatsData(response);
  });

  describe("formatStatsData", () => {
    it("統計データを正しく整形する", () => {
      expect(result).toBeDefined();
      expect(result.values).toBeInstanceOf(Array);
      expect(result.values.length).toBeGreaterThan(0);
    });

    it("tableInfo を正しく抽出する", () => {
      expect(result.tableInfo).toBeDefined();
      expect(result.tableInfo.id).toBeTruthy();
      expect(result.tableInfo.title).toBeTruthy();
      expect(result.tableInfo.statName).toBeTruthy();
    });

    it("全次元（area, time）が必須で存在する", () => {
      const firstValue = result.values[0];

      expect(firstValue.dimensions.area).toBeDefined();
      expect(firstValue.dimensions.time).toBeDefined();
      expect(firstValue.dimensions.area.code).toBeTruthy();
      expect(firstValue.dimensions.area.name).toBeTruthy();
      expect(firstValue.dimensions.time.code).toBeTruthy();
      expect(firstValue.dimensions.time.name).toBeTruthy();
    });

    it("オプション次元（cat01等）を抽出する", () => {
      const valuesWithCat01 = result.values.filter((v) => v.dimensions.cat01);

      if (valuesWithCat01.length > 0) {
        const firstWithCat01 = valuesWithCat01[0];
        expect(firstWithCat01.dimensions.cat01?.code).toBeTruthy();
        expect(firstWithCat01.dimensions.cat01?.name).toBeTruthy();
      }
    });

    it("地域の階層レベルを正しく抽出する", () => {
      const areasWithLevel = result.values.filter(
        (v) => v.dimensions.area.level
      );

      if (areasWithLevel.length > 0) {
        const levels = areasWithLevel.map((v) => v.dimensions.area.level);
        levels.forEach((level) => {
          expect(["1", "2", "3", undefined]).toContain(level);
        });
      }
    });

    it("メタデータを正しく生成する", () => {
      expect(result.metadata).toBeDefined();
      expect(result.metadata.stats.totalRecords).toBe(result.values.length);
      expect(result.metadata.stats.validValues).toBeGreaterThanOrEqual(0);
      expect(result.metadata.stats.nullValues).toBeGreaterThanOrEqual(0);
      expect(result.metadata.quality?.completenessScore).toBeGreaterThanOrEqual(
        0
      );
      expect(result.metadata.quality?.completenessScore).toBeLessThanOrEqual(
        100
      );
    });

    it("データ範囲情報を正しく計算する", () => {
      if (result.metadata.range) {
        expect(result.metadata.range.years).toBeDefined();
        expect(result.metadata.range.areas).toBeDefined();
        expect(result.metadata.range.categories).toBeDefined();

        expect(result.metadata.range.years.count).toBeGreaterThan(0);
        expect(result.metadata.range.areas.count).toBeGreaterThan(0);
      }
    });

    it("注記情報を抽出する", () => {
      expect(result.notes).toBeDefined();
      expect(Array.isArray(result.notes)).toBe(true);
    });
  });

  describe("parseEstatValue", () => {
    it("数値文字列を正しくパースする", () => {
      expect(parseEstatValue("1234")).toBe(1234);
      expect(parseEstatValue("1234.5")).toBe(1234.5);
      expect(parseEstatValue("0")).toBe(0);
      expect(parseEstatValue("0.0")).toBe(0);
      expect(parseEstatValue("-100")).toBe(-100);
    });

    it("特殊文字をnullに変換する", () => {
      expect(parseEstatValue("***")).toBeNull();
      expect(parseEstatValue("-")).toBeNull();
      expect(parseEstatValue("X")).toBeNull();
      expect(parseEstatValue("…")).toBeNull();
    });

    it("空文字列をnullに変換する", () => {
      expect(parseEstatValue("")).toBeNull();
      expect(parseEstatValue("   ")).toBeNull();
      expect(parseEstatValue("\t")).toBeNull();
    });

    it("不正な値をnullに変換する", () => {
      expect(parseEstatValue("abc")).toBeNull();
      // 注: parseFloat('123abc')は123を返すため、これは有効な数値として扱われる
      expect(parseEstatValue("abc123")).toBeNull();
    });
  });

  describe("パフォーマンステスト", () => {
    it("データ処理を妥当な時間内で完了する", () => {
      const startTime = performance.now();
      EstatStatsDataFormatter.formatStatsData(response);
      const endTime = performance.now();

      const processingTime = endTime - startTime;
      console.log(
        `処理時間: ${processingTime.toFixed(2)}ms (${result.values.length}件)`
      );

      // データ件数に応じて調整（1秒以内）
      expect(processingTime).toBeLessThan(1000);
    });

    it("処理速度を測定する", () => {
      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        EstatStatsDataFormatter.formatStatsData(response);
        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / iterations;
      const recordsPerSecond = (result.values.length / avgTime) * 1000;

      console.log(`平均処理時間: ${avgTime.toFixed(2)}ms`);
      console.log(`処理速度: ${recordsPerSecond.toFixed(0)}件/秒`);

      // 最低でも1000件/秒以上
      expect(recordsPerSecond).toBeGreaterThan(1000);
    });
  });

  describe("エッジケース", () => {
    it("空のvalues配列でもエラーにならない", () => {
      const emptyResponse = {
        ...response,
        GET_STATS_DATA: {
          ...response.GET_STATS_DATA,
          STATISTICAL_DATA: {
            ...response.GET_STATS_DATA.STATISTICAL_DATA,
            DATA_INF: {
              VALUE: [],
            },
          },
        },
      };

      expect(() => {
        EstatStatsDataFormatter.formatStatsData(emptyResponse as any);
      }).not.toThrow();
    });
  });
});
