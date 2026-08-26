import { describe, expect, it } from "vitest";

import { buildStatsPayload, countByPrefecture } from "../ksj-stats-core";
import type { PrefectureLocator } from "../prefecture-assign";

const ADDRESS_SOURCE = { kind: "address", field: "addr" } as const;

const feature = (addr: string | null, coord: [number, number] | null = null) => ({
  properties: addr === null ? null : { addr },
  coord,
});

/** P03 相当: 施設名 + 住所で身元が決まり、号機ごとに 1 レコード */
const unit = (name: string, addr: string) => ({
  properties: { name, addr },
  coord: null,
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

describe("countByPrefecture / 重複排除 (号機 → 施設)", () => {
  const DEDUPE = ["name", "addr"] as const;

  it("同じ施設の号機は 1 か所に畳む", () => {
    const r = countByPrefecture(
      [
        unit("高浜原子力発電所", "福井県大飯郡高浜町田ノ浦1"),
        unit("高浜原子力発電所", "福井県大飯郡高浜町田ノ浦1"),
        unit("高浜原子力発電所", "福井県大飯郡高浜町田ノ浦1"),
        unit("高浜原子力発電所", "福井県大飯郡高浜町田ノ浦1"),
      ],
      { source: ADDRESS_SOURCE, dedupeBy: DEDUPE },
    );
    expect(r.countsByPref.get("18")).toBe(1);
    expect(r.deduped).toBe(3);
  });

  it("同名でも住所が違えば別施設として数える (青森の東通は 2 か所)", () => {
    const r = countByPrefecture(
      [
        unit("東通原子力発電所", "青森県下北郡東通村大字白糠字前坂下34-4"),
        unit("東通原子力発電所", "青森県下北郡東通村大字小田野沢"),
      ],
      { source: ADDRESS_SOURCE, dedupeBy: DEDUPE },
    );
    expect(r.countsByPref.get("02")).toBe(2);
    expect(r.deduped).toBe(0);
  });

  it("身元を決められない feature は畳まず 1 件として数える (過少計上を作らない)", () => {
    const r = countByPrefecture(
      [
        { properties: { name: "", addr: "福井県敦賀市神明町" }, coord: null },
        { properties: { name: "", addr: "福井県敦賀市神明町" }, coord: null },
      ],
      { source: ADDRESS_SOURCE, dedupeBy: DEDUPE },
    );
    expect(r.countsByPref.get("18")).toBe(2);
    expect(r.deduped).toBe(0);
  });

  it("dedupeBy 未指定なら feature 数をそのまま数える", () => {
    const r = countByPrefecture(
      [
        unit("高浜原子力発電所", "福井県大飯郡高浜町田ノ浦1"),
        unit("高浜原子力発電所", "福井県大飯郡高浜町田ノ浦1"),
      ],
      { source: ADDRESS_SOURCE },
    );
    expect(r.countsByPref.get("18")).toBe(2);
    expect(r.deduped).toBe(0);
  });

  it("同じ整理番号でも県が違えば別件として数える (P12 の ID は全国一意ではない)", () => {
    const source = { kind: "prefCode", field: "pref" } as const;
    const r = countByPrefecture(
      [
        { properties: { pref: "01", resourceId: 10001 }, coord: null },
        { properties: { pref: "02", resourceId: 10001 }, coord: null },
        // 同じ県・同じ整理番号の点/面は 1 件へ畳む。
        { properties: { pref: "01", resourceId: 10001 }, coord: null },
      ],
      { source, dedupeBy: ["resourceId"] },
    );
    expect(r.countsByPref.get("01")).toBe(1);
    expect(r.countsByPref.get("02")).toBe(1);
    expect(r.deduped).toBe(1);
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
