import { describe, expect, it } from "vitest";
import { rankByValue } from "../rank-by-value";

const baseFields = {
  yearCode: "2020",
  yearName: "2020年",
  categoryCode: "001",
  categoryName: "テスト",
  unit: "人",
  areaType: "prefecture" as const,
};

function d(areaCode: string, value: number) {
  return { areaCode, areaName: areaCode, value, ...baseFields };
}

describe("rankByValue", () => {
  it("空配列を返す", () => {
    expect(rankByValue([])).toEqual([]);
  });

  it("desc ソート + タイ処理（デフォルト）", () => {
    const data = [d("01000", 100), d("13000", 200), d("27000", 150)];
    const result = rankByValue(data);
    expect(result[0]).toMatchObject({ areaCode: "13000", rank: 1 });
    expect(result[1]).toMatchObject({ areaCode: "27000", rank: 2 });
    expect(result[2]).toMatchObject({ areaCode: "01000", rank: 3 });
  });

  it("asc ソート + タイ処理", () => {
    const data = [d("13000", 200), d("27000", 150), d("01000", 100)];
    const result = rankByValue(data, { direction: "asc" });
    expect(result[0]).toMatchObject({ areaCode: "01000", rank: 1 });
    expect(result[1]).toMatchObject({ areaCode: "27000", rank: 2 });
    expect(result[2]).toMatchObject({ areaCode: "13000", rank: 3 });
  });

  it("同値タイ処理: 同じランクを付与し次を飛ばす", () => {
    const data = [d("01000", 100), d("13000", 100), d("27000", 50)];
    const result = rankByValue(data);
    expect(result[0].rank).toBe(1);
    expect(result[1].rank).toBe(1);
    expect(result[2].rank).toBe(3); // 2位は飛ばす
  });

  it("handleTies: false — 連番ランク", () => {
    const data = [d("01000", 100), d("13000", 100), d("27000", 50)];
    const result = rankByValue(data, { handleTies: false });
    expect(result[0].rank).toBe(1);
    expect(result[1].rank).toBe(2);
    expect(result[2].rank).toBe(3);
  });

  it("NaN 値を末尾に配置する", () => {
    const data = [d("01000", 100), { ...d("13000", 0), value: NaN }, d("27000", 50)];
    const result = rankByValue(data);
    expect(result[result.length - 1].areaCode).toBe("13000");
  });

  it("元の配列を変更しない（不変性）", () => {
    const data = [d("01000", 100), d("13000", 200)];
    const original = [...data];
    rankByValue(data);
    expect(data[0].areaCode).toBe(original[0].areaCode);
    expect(data[1].areaCode).toBe(original[1].areaCode);
  });

  it("1件のみの場合は rank=1", () => {
    const result = rankByValue([d("13000", 200)]);
    expect(result).toHaveLength(1);
    expect(result[0].rank).toBe(1);
  });

  it("asc + 連番（handleTies: false）", () => {
    const data = [d("01000", 100), d("13000", 100), d("27000", 200)];
    const result = rankByValue(data, { direction: "asc", handleTies: false });
    expect(result[0].rank).toBe(1);
    expect(result[1].rank).toBe(2);
    expect(result[2].rank).toBe(3);
    expect(result[2].areaCode).toBe("27000"); // 最大値が末尾
  });

  it("複数タイ: 1,1,3,3,5 パターン", () => {
    const data = [
      d("A", 100), d("B", 100),
      d("C", 80), d("D", 80),
      d("E", 60),
    ];
    const result = rankByValue(data);
    expect(result[0].rank).toBe(1);
    expect(result[1].rank).toBe(1);
    expect(result[2].rank).toBe(3); // 2位は飛ばす
    expect(result[3].rank).toBe(3);
    expect(result[4].rank).toBe(5); // 4位は飛ばす
  });
});
