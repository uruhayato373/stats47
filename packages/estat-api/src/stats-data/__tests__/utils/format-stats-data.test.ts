import { beforeAll, describe, expect, it } from "vitest";

import { formatStatsData } from "../../utils/format-stats-data";

import type { EstatStatsDataResponse, FormattedEstatData } from "../../types";

// stats-data/0000010101.json は 20MB 超のため gitignore。CI では空オブジェクトになる。
// eslint-disable-next-line @typescript-eslint/no-require-imports
const rawFixture = (() => { try { return require("../fixtures/0000010101.json"); } catch { return null; } })();

describe("統計データの整形 (formatStatsData)", () => {
  let response: EstatStatsDataResponse;
  let result: FormattedEstatData;

  beforeAll(() => {
    if (!rawFixture) return;
    response = rawFixture as unknown as EstatStatsDataResponse;
    result = formatStatsData(response);
  });

  it("統計データを正しく整形する", () => {
    if (!rawFixture) return;
    expect(result).toBeDefined();
    expect(result.values).toBeInstanceOf(Array);
    expect(result.values.length).toBeGreaterThan(0);
  });

  it("tableInfo を正しく抽出する", () => {
    if (!rawFixture) return;
    expect(result.tableInfo).toBeDefined();
    expect(result.tableInfo.id).toBeTruthy();
    expect(result.tableInfo.title).toBeTruthy();
    expect(result.tableInfo.statName).toBeTruthy();
  });

  it("全次元（area, time）が必須で存在する", () => {
    if (!rawFixture) return;
    const firstValue = result.values[0];

    expect(firstValue.dimensions.area).toBeDefined();
    expect(firstValue.dimensions.time).toBeDefined();
    if (firstValue.dimensions.area && firstValue.dimensions.time) {
      expect(firstValue.dimensions.area.code).toBeTruthy();
      expect(firstValue.dimensions.area.name).toBeTruthy();
      expect(firstValue.dimensions.time.code).toBeTruthy();
      expect(firstValue.dimensions.time.name).toBeTruthy();
    }
  });

  it("オプション次元（cat01等）を抽出する", () => {
    if (!rawFixture) return;
    const valuesWithCat01 = result.values.filter(
      (v) => v.dimensions.cat01 && v.dimensions.cat01.code !== ""
    );

    if (valuesWithCat01.length > 0) {
      const firstWithCat01 = valuesWithCat01[0];
      expect(firstWithCat01.dimensions.cat01?.code).toBeTruthy();
      expect(firstWithCat01.dimensions.cat01?.name).toBeTruthy();
    }
  });

  it("地域の階層レベルを正しく抽出する", () => {
    if (!rawFixture) return;
    const areasWithLevel = result.values.filter((v) => v.dimensions.area?.level);

    if (areasWithLevel.length > 0) {
      const levels = areasWithLevel.map((v) => v.dimensions.area?.level);
      levels.forEach((level) => {
        expect(["1", "2", "3", undefined]).toContain(level);
      });
    }
  });

  it("注記情報を抽出する", () => {
    if (!rawFixture) return;
    expect(result.notes).toBeDefined();
    expect(Array.isArray(result.notes)).toBe(true);
  });

  describe("パフォーマンステスト", () => {
    it("データ処理を妥当な時間内で完了する", () => {
      if (!rawFixture) return;
      const startTime = performance.now();
      formatStatsData(response);
      const endTime = performance.now();

      const processingTime = endTime - startTime;
      console.log(
        `処理時間: ${processingTime.toFixed(2)}ms (${result.values.length}件)`
      );

      expect(processingTime).toBeLessThan(1000);
    });

    it("処理速度を測定する", () => {
      if (!rawFixture) return;
      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        formatStatsData(response);
        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / iterations;
      const recordsPerSecond = (result.values.length / avgTime) * 1000;

      console.log(`平均処理時間: ${avgTime.toFixed(2)}ms`);
      console.log(`処理速度: ${recordsPerSecond.toFixed(0)}件/秒`);

      expect(recordsPerSecond).toBeGreaterThan(1000);
    });
  });

  describe("エッジケース", () => {
    it("空のvalues配列でもエラーにならない", () => {
      if (!rawFixture) return;
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
        formatStatsData(emptyResponse as unknown as EstatStatsDataResponse);
      }).not.toThrow();
    });
  });
});
