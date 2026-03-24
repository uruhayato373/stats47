import { describe, expect, it } from "vitest";
import type { RankingValue } from "../../types";
import { computeCalculatedValues } from "../compute-calculated-values";

const makeValue = (areaCode: string, value: number, yearCode = "2020"): RankingValue => ({
  areaCode,
  areaName: `Area ${areaCode}`,
  areaType: "prefecture",
  yearCode,
  yearName: `${yearCode}年`,
  categoryCode: "test",
  categoryName: "テスト",
  value,
  unit: "人",
  rank: 1,
});

const baseOptions = {
  type: "ratio" as const,
  categoryCode: "result",
  categoryName: "結果",
  unit: "%",
};

describe("computeCalculatedValues", () => {
  describe("デフォルト動作 (keyBy: yearCode_areaCode)", () => {
    it("比率（ratio）計算が正しく行われること", () => {
      const numerators = [makeValue("01000",100), makeValue("02000",200)];
      const denominators = [makeValue("01000",50), makeValue("02000",0)]; // 02は分母0

      const result = computeCalculatedValues(numerators, denominators, baseOptions);

      expect(result).toHaveLength(1); // 02は分母0なので除外
      expect(result[0].areaCode).toBe("01000");
      expect(result[0].value).toBe(2); // 100 / 50
      expect(result[0].categoryCode).toBe("result");
      expect(result[0].categoryName).toBe("結果");
      expect(result[0].unit).toBe("%");
    });

    it("per_capitaタイプもratioと同じ計算を行うこと", () => {
      const numerators = [makeValue("01000",100)];
      const denominators = [makeValue("01000",50)];

      const result = computeCalculatedValues(numerators, denominators, {
        ...baseOptions,
        type: "per_capita",
      });

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(2);
    });

    it("年度ミスマッチの場合は除外されること", () => {
      const numerators = [makeValue("01000",100, "2020")];
      const denominators = [makeValue("01000",50, "2021")]; // 年度が違う

      const result = computeCalculatedValues(numerators, denominators, baseOptions);

      expect(result).toHaveLength(0);
    });

    it("対応する分母データがない場合は除外されること", () => {
      const result = computeCalculatedValues([makeValue("01000",100)], [], baseOptions);
      expect(result).toHaveLength(0);
    });

    it("分母が0の場合はスキップされること", () => {
      const numerators = [makeValue("01000",100), makeValue("02000",200)];
      const denominators = [makeValue("01000",0), makeValue("02000",100)];

      const result = computeCalculatedValues(numerators, denominators, baseOptions);

      expect(result).toHaveLength(1);
      expect(result[0].areaCode).toBe("02000");
    });

    it("空の分子に対して空配列を返すこと", () => {
      const result = computeCalculatedValues([], [makeValue("01000",100)], baseOptions);
      expect(result).toHaveLength(0);
    });

    it("rankフィールドが除去されること", () => {
      const numerators = [makeValue("01000",100)];
      const denominators = [makeValue("01000",50)];

      const result = computeCalculatedValues(numerators, denominators, baseOptions);

      expect(result[0]).not.toHaveProperty("rank");
    });
  });

  describe("keyBy: areaCode オプション", () => {
    it("年度が異なっても地域コードが一致すれば計算されること", () => {
      const numerators = [makeValue("01000",100, "2020")];
      const denominators = [makeValue("01000",50, "2021")]; // 年度違い

      const result = computeCalculatedValues(numerators, denominators, {
        ...baseOptions,
        keyBy: "areaCode",
      });

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(2); // 100 / 50
    });

    it("地域コードが一致しない場合は除外されること", () => {
      const numerators = [makeValue("01000",100)];
      const denominators = [makeValue("02000",50)]; // 地域コード違い

      const result = computeCalculatedValues(numerators, denominators, {
        ...baseOptions,
        keyBy: "areaCode",
      });

      expect(result).toHaveLength(0);
    });
  });

  describe("scaleFactor オプション", () => {
    it("scaleFactor を適用した値が返ること", () => {
      const numerators = [makeValue("01000",100)];
      const denominators = [makeValue("01000",1000)];

      const result = computeCalculatedValues(numerators, denominators, {
        ...baseOptions,
        keyBy: "areaCode",
        scaleFactor: 100000, // 人口10万人あたり
      });

      expect(result).toHaveLength(1);
      expect(result[0].value).toBeCloseTo(10000); // (100/1000) * 100000
    });

    it("scaleFactor が未指定の場合は1として扱われること", () => {
      const numerators = [makeValue("01000",100)];
      const denominators = [makeValue("01000",50)];

      const result = computeCalculatedValues(numerators, denominators, {
        ...baseOptions,
        keyBy: "areaCode",
      });

      expect(result[0].value).toBe(2); // scaleFactor=1 なので 100/50 = 2
    });
  });
});
