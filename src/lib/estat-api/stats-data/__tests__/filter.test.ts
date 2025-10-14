import { describe, it, expect, beforeAll } from "vitest";
import { EstatDataFilter } from "../filter";
import { EstatStatsDataFormatter } from "../formatter";
import type { FormattedValue } from "../../types/stats-data";
import { mockStatsDataResponse } from "./fixtures";

describe("EstatDataFilter", () => {
  let values: FormattedValue[];

  beforeAll(() => {
    const result = EstatStatsDataFormatter.formatStatsData(
      mockStatsDataResponse
    );
    values = result.values;
  });

  describe("getValidValues", () => {
    it("有効な値のみをフィルタする", () => {
      const validValues = EstatDataFilter.getValidValues(values);

      validValues.forEach((v) => {
        expect(v.value).not.toBeNull();
        expect(v.value).not.toBeUndefined();
      });
    });

    it("元の配列以下の件数になる", () => {
      const validValues = EstatDataFilter.getValidValues(values);
      expect(validValues.length).toBeLessThanOrEqual(values.length);
    });

    it("空配列を渡すと空配列を返す", () => {
      const validValues = EstatDataFilter.getValidValues([]);
      expect(validValues).toEqual([]);
    });
  });

  describe("getPrefectureValues", () => {
    it("都道府県データのみをフィルタする", () => {
      const prefectures = EstatDataFilter.getPrefectureValues(values);

      prefectures.forEach((v) => {
        expect(v.dimensions.area.code).toBeTruthy();
        expect(v.dimensions.area.code).not.toBe("00000");
      });
    });

    it("全国データ（00000）を除外する", () => {
      const prefectures = EstatDataFilter.getPrefectureValues(values);
      const nationalData = prefectures.filter(
        (v) => v.dimensions.area.code === "00000"
      );

      expect(nationalData.length).toBe(0);
    });

    it("空配列を渡すと空配列を返す", () => {
      const prefectures = EstatDataFilter.getPrefectureValues([]);
      expect(prefectures).toEqual([]);
    });
  });

  describe("組み合わせテスト", () => {
    it("有効な都道府県データを抽出する", () => {
      const validPrefectures = EstatDataFilter.getPrefectureValues(
        EstatDataFilter.getValidValues(values)
      );

      validPrefectures.forEach((v) => {
        expect(v.value).not.toBeNull();
        expect(v.dimensions.area.code).not.toBe("00000");
      });
    });
  });
});
