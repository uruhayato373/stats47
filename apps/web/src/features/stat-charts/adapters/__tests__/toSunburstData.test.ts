import { describe, it, expect } from "vitest";

import { toSunburstData } from "../toSunburstData";

import type { StatsSchema } from "@stats47/types";

const baseRow: StatsSchema = {
  metricKey: "code-0",
  areaCode: "13000",
  areaName: "東京都",
  yearCode: "2022",
  yearName: "2022年",
  value: 1000,
  unit: "億円",
};

describe("toSunburstData", () => {
  it("空の場合は null を返す", () => {
    expect(toSunburstData([], { rootCode: "code-0", childCodes: [] })).toBeNull();
  });

  it("rootCode と childCodes で階層を構築する", () => {
    const rawData: StatsSchema[] = [
      { ...baseRow, metricKey: "code-0", value: 500 },
      { ...baseRow, metricKey: "code-1", value: 300 },
      { ...baseRow, metricKey: "code-2", value: 200 },
    ];
    const result = toSunburstData(rawData, {
      rootCode: "code-0",
      childCodes: ["code-1", "code-2"],
    });
    expect(result).not.toBeNull();
    expect(result!.name).toBe("code-0");
    expect(result!.children).toHaveLength(2);
    expect(result!.children![0].name).toBe("code-1");
    expect(result!.children![1].name).toBe("code-2");
  });
});
