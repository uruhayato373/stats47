import { describe, expect, it } from "vitest";
import { extractStrengthsAndWeaknesses } from "../extract-strengths-and-weaknesses";

describe("extractStrengthsAndWeaknesses", () => {
  it("ランキング上位5位以内を『強み』として抽出し、順位昇順でソートすること", () => {
    const mockData = [
      { rank: 10, indicator: "Item A" },
      { rank: 3, indicator: "Item B" },
      { rank: 1, indicator: "Item C" },
      { rank: 25, indicator: "Item D" },
      { rank: 5, indicator: "Item E" },
      { rank: 2, indicator: "Item F" },
      { rank: 4, indicator: "Item G" },
    ];

    const { strengths } = extractStrengthsAndWeaknesses(mockData);

    expect(strengths).toHaveLength(5);
    expect(strengths[0].rank).toBe(1);
    expect(strengths[1].rank).toBe(2);
    expect(strengths[2].rank).toBe(3);
    expect(strengths[3].rank).toBe(4);
    expect(strengths[4].rank).toBe(5);
  });

  it("ランキング43位以下を『弱み』として抽出し、順位降順でソートすること", () => {
    const mockData = [
      { rank: 40, indicator: "Item A" },
      { rank: 43, indicator: "Item B" },
      { rank: 47, indicator: "Item C" },
      { rank: 20, indicator: "Item D" },
      { rank: 45, indicator: "Item E" },
      { rank: 44, indicator: "Item F" },
      { rank: 46, indicator: "Item G" },
    ];

    const { weaknesses } = extractStrengthsAndWeaknesses(mockData);

    expect(weaknesses).toHaveLength(5);
    expect(weaknesses[0].rank).toBe(47);
    expect(weaknesses[1].rank).toBe(46);
    expect(weaknesses[2].rank).toBe(45);
    expect(weaknesses[3].rank).toBe(44);
    expect(weaknesses[4].rank).toBe(43);
  });

  it("5件を超える場合も全件抽出されること", () => {
    const mockData = [
      { rank: 1 }, { rank: 2 }, { rank: 3 },
      { rank: 4 }, { rank: 5 }, { rank: 5 },
      { rank: 43 }, { rank: 44 }, { rank: 45 },
      { rank: 46 }, { rank: 47 }, { rank: 47 },
    ];

    const { strengths, weaknesses } = extractStrengthsAndWeaknesses(mockData);

    expect(strengths).toHaveLength(6);
    expect(weaknesses).toHaveLength(6);
  });

  it("該当するデータが5件未満の場合は、全件抽出されること", () => {
    const mockData = [
      { rank: 1 }, { rank: 2 }, { rank: 47 },
    ];

    const { strengths, weaknesses } = extractStrengthsAndWeaknesses(mockData);

    expect(strengths).toHaveLength(2);
    expect(weaknesses).toHaveLength(1);
  });

  it("強み・弱みどちらの条件にも当てはまらないデータは無視されること", () => {
    const mockData = [
      { rank: 6 }, { rank: 20 }, { rank: 42 },
    ];

    const { strengths, weaknesses } = extractStrengthsAndWeaknesses(mockData);

    expect(strengths).toHaveLength(0);
    expect(weaknesses).toHaveLength(0);
  });

  it("空配列を渡すと空の結果が返ること", () => {
    const { strengths, weaknesses } = extractStrengthsAndWeaknesses([]);

    expect(strengths).toHaveLength(0);
    expect(weaknesses).toHaveLength(0);
  });

  it("同一ランクの重複データが正しく処理されること", () => {
    const mockData = [
      { rank: 1, indicator: "A" },
      { rank: 1, indicator: "B" },
      { rank: 47, indicator: "C" },
      { rank: 47, indicator: "D" },
    ];

    const { strengths, weaknesses } = extractStrengthsAndWeaknesses(mockData);

    expect(strengths).toHaveLength(2);
    expect(weaknesses).toHaveLength(2);
  });
});
