import { describe, expect, test } from "vitest";

import { areaThemeDescription, getAreaThemeHighlights } from "../area-theme-highlights";

describe("getAreaThemeHighlights", () => {
  const data = {
    indicatorDataMap: {
      income: {
        rankingItem: { unit: "千円" },
        rankingValues: [
          { areaCode: "13000", value: 700, unit: "千円", yearName: "2024年" },
          { areaCode: "28000", value: 620, unit: "千円", yearName: "2024年", rank: 9 },
        ],
      },
      ratio: {
        rankingItem: { unit: "倍" },
        rankingValues: [
          { areaCode: "28000", value: 1.2, unit: "倍", yearName: "2023年" },
        ],
      },
    },
  };
  // 画面の指標カードと同じ並び (テーマの tabIndicators) と短い名前で返す (2026-10-30)
  const indicators = [
    { rankingKey: "ratio", tabLabel: "求人倍率" },
    { rankingKey: "missing", tabLabel: "配信に無い指標" },
    { rankingKey: "income", tabLabel: "実収入" },
  ];

  test("テーマの指標の並びと短い名前で、指定県に存在する実測値だけを返す", () => {
    expect(getAreaThemeHighlights(data, "28000", indicators)).toEqual([
      { key: "ratio", title: "求人倍率", value: 1.2, unit: "倍", yearName: "2023年", rank: null },
      { key: "income", title: "実収入", value: 620, unit: "千円", yearName: "2024年", rank: 9 },
    ]);
  });

  test("対象県の観測値が無ければ空配列", () => {
    expect(getAreaThemeHighlights(data, "47000", indicators)).toEqual([]);
  });
});

// 2026-10-30: 県のページの説明文は定型で数字が無かった。その県の主な値と順位を先頭に置く
describe("areaThemeDescription", () => {
  const highlights = [
    { key: "a", title: "空き家比率", value: 14.7, unit: "%", yearName: "2023年", rank: 31 },
    { key: "b", title: "持ち家比率", value: 74.9, unit: "%", yearName: "2023年", rank: 3 },
    { key: "c", title: "3 件目", value: 1, unit: "戸", yearName: "2023年", rank: 1 },
  ];

  test("値と年と全国の順位を 2 件まで先頭に置き、テーマの説明を続ける", () => {
    const text = areaThemeDescription("富山県", "住宅の余り方を比較する。", highlights);
    expect(text.startsWith("富山県の空き家比率は14.7%（2023年・全国31位）、持ち家比率は74.9%（2023年・全国3位）。")).toBe(true);
    expect(text).toContain("住宅の余り方を比較する。");
    expect(text).not.toContain("3 件目");
  });

  test("値は数値タイルと同じく小数 2 桁までに丸める", () => {
    expect(areaThemeDescription("兵庫県", "説明。", [{ ...highlights[0], value: 30.124 }])).toContain("空き家比率は30.12%");
  });

  test("順位が無い値は順位を書かず、値が無ければテーマの説明だけにする", () => {
    expect(areaThemeDescription("兵庫県", "説明。", [{ ...highlights[0], rank: null }])).toContain("14.7%（2023年）");
    expect(areaThemeDescription("兵庫県", "説明。", []).startsWith("兵庫県における説明。")).toBe(true);
  });
});

