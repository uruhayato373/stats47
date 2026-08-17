import { describe, expect, it } from "vitest";

import { buildStatsPayload, countByPrefecture } from "../ksj-stats-core";
import type { PrefectureLocator } from "../prefecture-assign";

const ADDRESS_SOURCE = { kind: "address", field: "addr" } as const;

const feature = (addr: string | null, coord: [number, number] | null = null) => ({
  properties: addr === null ? null : { addr },
  coord,
});

describe("countByPrefecture", () => {
  it("47 県すべてを 0 で初期化してから数える", () => {
    const r = countByPrefecture([feature("福井県敦賀市神明町")], {
      source: ADDRESS_SOURCE,
    });
    expect(r.countsByPref.size).toBe(47);
    expect(r.countsByPref.get("18")).toBe(1);
    expect(r.countsByPref.get("26")).toBe(0);
    expect(r.resolvedByAttribute).toBe(1);
    expect(r.unresolved).toHaveLength(0);
  });

  it("県を決められない feature は unresolved に積む (どこかの県へ計上しない)", () => {
    const r = countByPrefecture(
      [feature("福井県敦賀市神明町"), feature("所在地不明"), feature(null)],
      { source: ADDRESS_SOURCE },
    );
    const total = [...r.countsByPref.values()].reduce((a, b) => a + b, 0);
    expect(total).toBe(1);
    expect(r.unresolved).toHaveLength(2);
  });

  it("属性で決まらなかったものだけ空間結合が拾う", () => {
    const locator: PrefectureLocator = {
      locate: (lon) => (lon === 135 ? "26" : null),
    };
    const r = countByPrefecture(
      [
        feature("福井県敦賀市神明町", [135, 35]),
        feature("所在地不明", [135, 35]),
        feature("所在地不明", [0, 0]),
      ],
      { source: ADDRESS_SOURCE, locator },
    );
    expect(r.countsByPref.get("18")).toBe(1);
    expect(r.countsByPref.get("26")).toBe(1);
    expect(r.resolvedByAttribute).toBe(1);
    expect(r.resolvedByPolygon).toBe(1);
    expect(r.unresolved).toHaveLength(1);
  });
});

describe("buildStatsPayload", () => {
  const counts = new Map<string, number>([
    ["18", 15],
    ["07", 13],
    ["15", 7],
    ["02", 7],
  ]);
  const payload = buildStatsPayload({
    metricKey: "nuclear-power-plant-count",
    unit: "か所",
    yearCode: "2013",
    countsByPref: counts,
    generatedAt: "2026-08-17T00:00:00.000Z",
  });

  it("47 行を書き、欠けた県は 0 で埋める", () => {
    expect(payload.rows).toHaveLength(47);
    expect(payload.meta.rowCount).toBe(47);
    expect(payload.meta.areaCount).toBe(47);
    expect(payload.meta.yearRange).toEqual(["2013", "2013"]);
    expect(payload.rows.find((r) => r.areaCode === "26000")?.value).toBe(0);
  });

  it("value 降順で rank を付け、同値は同順位 (page-data-batch と同一規則)", () => {
    const byArea = new Map(payload.rows.map((r) => [r.areaCode, r]));
    expect(byArea.get("18000")).toMatchObject({ value: 15, rank: 1 });
    expect(byArea.get("07000")).toMatchObject({ value: 13, rank: 2 });
    // 7 が 2 県 → どちらも 3 位
    expect(byArea.get("15000")?.rank).toBe(3);
    expect(byArea.get("02000")?.rank).toBe(3);
    // 0 の県は 5 位に並ぶ (4 位は欠番)
    expect(byArea.get("26000")?.rank).toBe(5);
  });

  it("areaCode は 5 桁、yearName は「YYYY年」", () => {
    const hokkaido = payload.rows.find((r) => r.areaCode === "01000");
    expect(hokkaido?.areaName).toBe("北海道");
    expect(hokkaido?.yearName).toBe("2013年");
    expect(hokkaido?.unit).toBe("か所");
  });
});
