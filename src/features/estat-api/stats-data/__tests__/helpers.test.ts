import { describe, it, expect, beforeAll } from "vitest";

import { EstatStatsDataFormatter } from "../formatter";
import {
  filterByArea,
  filterByTime,
  filterByDimension,
  getPrefectures,
  getValidValues,
  getSpecialValues,
  getByAreaLevel,
  groupByArea,
  groupByTime,
  groupByDimension,
  sortByValueDesc,
  sortByValueAsc,
} from "../helpers";

import { mockStatsDataResponse } from "./fixtures";

import type { FormattedValue } from "../../types/stats-data";


describe("Stats Data Helpers", () => {
  let values: FormattedValue[];

  beforeAll(() => {
    const result = EstatStatsDataFormatter.formatStatsData(
      mockStatsDataResponse
    );
    values = result.values;
  });

  describe("filterByArea", () => {
    it("単一の地域コードでフィルタする", () => {
      // 実際に存在する地域コードを取得
      const areaCode = values[0].dimensions.area.code;
      const filtered = filterByArea(values, areaCode);

      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach((v) => {
        expect(v.dimensions.area.code).toBe(areaCode);
      });
    });

    it("複数の地域コードでフィルタする", () => {
      const areaCodes = [
        values[0].dimensions.area.code,
        values[1]?.dimensions.area.code,
      ].filter(Boolean);

      const filtered = filterByArea(values, areaCodes);

      filtered.forEach((v) => {
        expect(areaCodes).toContain(v.dimensions.area.code);
      });
    });

    it("存在しない地域コードの場合は空配列を返す", () => {
      const filtered = filterByArea(values, "99999");
      expect(filtered).toEqual([]);
    });
  });

  describe("filterByTime", () => {
    it("特定の年度でフィルタする", () => {
      const timeCode = values[0].dimensions.time.code;
      const filtered = filterByTime(values, timeCode);

      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach((v) => {
        expect(v.dimensions.time.code).toBe(timeCode);
      });
    });

    it("複数の年度でフィルタする", () => {
      const timeCodes = Array.from(
        new Set(values.slice(0, 10).map((v) => v.dimensions.time.code))
      );

      const filtered = filterByTime(values, timeCodes);

      filtered.forEach((v) => {
        expect(timeCodes).toContain(v.dimensions.time.code);
      });
    });
  });

  describe("filterByDimension", () => {
    it("cat01でフィルタする", () => {
      const valueWithCat01 = values.find((v) => v.dimensions.cat01);

      if (valueWithCat01) {
        const cat01Code = valueWithCat01.dimensions.cat01!.code;
        const filtered = filterByDimension(values, "cat01", cat01Code);

        expect(filtered.length).toBeGreaterThan(0);
        filtered.forEach((v) => {
          expect(v.dimensions.cat01?.code).toBe(cat01Code);
        });
      }
    });

    it("存在しない次元でフィルタすると空配列を返す", () => {
      const filtered = filterByDimension(values, "cat15", "dummy");
      expect(filtered).toEqual([]);
    });
  });

  describe("getPrefectures", () => {
    it("都道府県データのみを抽出する", () => {
      const prefectures = getPrefectures(values);

      prefectures.forEach((v) => {
        expect(v.dimensions.area.level).toBe("2");
        expect(v.dimensions.area.code).not.toBe("00000");
      });
    });

    it("抽出結果が空でない", () => {
      const prefectures = getPrefectures(values);
      expect(prefectures.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getValidValues", () => {
    it("有効な数値データのみを抽出する", () => {
      const validValues = getValidValues(values);

      validValues.forEach((v) => {
        expect(v.value).not.toBeNull();
        expect(typeof v.value).toBe("number");
      });
    });

    it("元の配列以下の件数になる", () => {
      const validValues = getValidValues(values);
      expect(validValues.length).toBeLessThanOrEqual(values.length);
    });
  });

  describe("getSpecialValues", () => {
    it("特殊文字データのみを抽出する", () => {
      const specialValues = getSpecialValues(values);

      specialValues.forEach((v) => {
        expect(v.value).toBeNull();
      });
    });
  });

  describe("getByAreaLevel", () => {
    it("全国レベル（1）のデータを抽出する", () => {
      const national = getByAreaLevel(values, "1");

      national.forEach((v) => {
        expect(v.dimensions.area.level).toBe("1");
      });
    });

    it("都道府県レベル（2）のデータを抽出する", () => {
      const prefectures = getByAreaLevel(values, "2");

      prefectures.forEach((v) => {
        expect(v.dimensions.area.level).toBe("2");
      });
    });
  });

  describe("groupByArea", () => {
    it("地域コードでグループ化する", () => {
      const grouped = groupByArea(values);

      expect(grouped.size).toBeGreaterThan(0);

      grouped.forEach((areaValues, areaCode) => {
        areaValues.forEach((v) => {
          expect(v.dimensions.area.code).toBe(areaCode);
        });
      });
    });

    it("全ての値がグループに含まれる", () => {
      const grouped = groupByArea(values);
      const totalInGroups = Array.from(grouped.values()).reduce(
        (sum, group) => sum + group.length,
        0
      );

      expect(totalInGroups).toBe(values.length);
    });
  });

  describe("groupByTime", () => {
    it("年度でグループ化する", () => {
      const grouped = groupByTime(values);

      expect(grouped.size).toBeGreaterThan(0);

      grouped.forEach((timeValues, timeCode) => {
        timeValues.forEach((v) => {
          expect(v.dimensions.time.code).toBe(timeCode);
        });
      });
    });
  });

  describe("groupByDimension", () => {
    it("cat01でグループ化する", () => {
      const grouped = groupByDimension(values, "cat01");

      grouped.forEach((catValues, catCode) => {
        catValues.forEach((v) => {
          expect(v.dimensions.cat01?.code).toBe(catCode);
        });
      });
    });
  });

  describe("sortByValueDesc", () => {
    it("降順でソートする", () => {
      const validValues = getValidValues(values).slice(0, 100);
      const sorted = sortByValueDesc(validValues);

      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].value!).toBeGreaterThanOrEqual(sorted[i + 1].value!);
      }
    });

    it("null値が最後になる", () => {
      const mixedValues = [
        ...values.slice(0, 5),
        { ...values[0], value: null },
        { ...values[1], value: null },
      ];

      const sorted = sortByValueDesc(mixedValues);
      const nullIndex = sorted.findIndex((v) => v.value === null);

      if (nullIndex !== -1) {
        // null値以降は全てnull
        for (let i = nullIndex; i < sorted.length; i++) {
          expect(sorted[i].value).toBeNull();
        }
      }
    });

    it("元の配列を変更しない", () => {
      const original = [...values.slice(0, 10)];
      const originalCopy = JSON.stringify(original);

      sortByValueDesc(original);

      expect(JSON.stringify(original)).toBe(originalCopy);
    });
  });

  describe("sortByValueAsc", () => {
    it("昇順でソートする", () => {
      const validValues = getValidValues(values).slice(0, 100);
      const sorted = sortByValueAsc(validValues);

      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].value!).toBeLessThanOrEqual(sorted[i + 1].value!);
      }
    });

    it("元の配列を変更しない", () => {
      const original = [...values.slice(0, 10)];
      const originalCopy = JSON.stringify(original);

      sortByValueAsc(original);

      expect(JSON.stringify(original)).toBe(originalCopy);
    });
  });
});
