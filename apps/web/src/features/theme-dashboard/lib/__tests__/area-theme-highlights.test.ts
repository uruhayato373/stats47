import { describe, expect, test } from "vitest";

import { getAreaThemeHighlights } from "../area-theme-highlights";

describe("getAreaThemeHighlights", () => {
  const data = {
    indicatorDataMap: {
      income: {
        rankingItem: { title: "実収入", readerLabel: "世帯の実収入", unit: "千円" },
        rankingValues: [
          { areaCode: "13000", value: 700, unit: "千円", yearName: "2024年" },
          { areaCode: "28000", value: 620, unit: "千円", yearName: "2024年" },
        ],
      },
      ratio: {
        rankingItem: { title: "有効求人倍率", unit: "倍" },
        rankingValues: [
          { areaCode: "28000", value: 1.2, unit: "倍", yearName: "2023年" },
        ],
      },
    },
  };

  test("指定県に存在する実測値だけを指標順に返す", () => {
    expect(getAreaThemeHighlights(data, "28000")).toEqual([
      { key: "income", title: "世帯の実収入", value: 620, unit: "千円", yearName: "2024年" },
      { key: "ratio", title: "有効求人倍率", value: 1.2, unit: "倍", yearName: "2023年" },
    ]);
  });

  test("対象県の観測値が無ければ空配列", () => {
    expect(getAreaThemeHighlights(data, "47000")).toEqual([]);
  });
});
