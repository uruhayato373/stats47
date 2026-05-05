import { describe, it, expect } from "vitest";

import { toBarChartRaceData } from "../toBarChartRaceData";

import type { StatsSchema } from "@stats47/types";

const baseRow: StatsSchema = {
  metricKey: "A1101",
  areaCode: "13000",
  areaName: "東京都",
  yearCode: "2020",
  yearName: "2020年",
  value: 100,
  unit: "人",
};

describe("toBarChartRaceData", () => {
  it("年度別にフレームを生成する", () => {
    const rawData: StatsSchema[] = [
      { ...baseRow, areaCode: "13000", areaName: "東京都", yearCode: "2020", yearName: "2020年", value: 100 },
      { ...baseRow, areaCode: "14000", areaName: "神奈川県", yearCode: "2020", yearName: "2020年", value: 200 },
      { ...baseRow, areaCode: "13000", areaName: "東京都", yearCode: "2021", yearName: "2021年", value: 150 },
      { ...baseRow, areaCode: "14000", areaName: "神奈川県", yearCode: "2021", yearName: "2021年", value: 250 },
    ];
    const result = toBarChartRaceData(rawData);
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe("2020年");
    expect(result[0].items).toHaveLength(2);
    expect(result[0].items[0].name).toBe("東京都");
    expect(result[1].date).toBe("2021年");
    expect(result[1].items).toHaveLength(2);
  });
});
