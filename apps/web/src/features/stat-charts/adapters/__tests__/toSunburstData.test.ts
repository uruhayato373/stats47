import { describe, it, expect } from "vitest";

import { toSunburstData } from "../toSunburstData";

import type { StatsSchema } from "@stats47/types";

const baseRow: StatsSchema = {
  areaCode: "13000",
  areaName: "東京都",
  yearCode: "2022",
  yearName: "2022年",
  categoryCode: "0",
  categoryName: "総額",
  value: 1000,
  unit: "億円",
};

describe("toSunburstData", () => {
  it("空の場合は null を返す", () => {
    expect(toSunburstData([], { rootCode: "0", childCodes: [] })).toBeNull();
  });

  it("rootCode と childCodes で階層を構築する", () => {
    const rawData: StatsSchema[] = [
      { ...baseRow, categoryCode: "0", categoryName: "総額", value: 500 },
      { ...baseRow, categoryCode: "1", categoryName: "項目A", value: 300 },
      { ...baseRow, categoryCode: "2", categoryName: "項目B", value: 200 },
    ];
    const result = toSunburstData(rawData, {
      rootCode: "0",
      childCodes: ["1", "2"],
    });
    expect(result).not.toBeNull();
    expect(result!.name).toBe("総額");
    expect(result!.children).toHaveLength(2);
  });
});
