import { describe, expect, it } from "vitest";

import { AREA_DATABOOK_SCHEMA_VERSION, parseAreaDatabookSnapshot } from "../databook-snapshot";

const base = {
  areaCode: "09000",
  areaName: "栃木県",
  generatedAt: "2026-11-02T00:00:00.000Z",
  metrics: {},
  agriTop10: [],
};

describe("parseAreaDatabookSnapshot の kakeiTopItems", () => {
  it("上位品目の欄が無い旧版 (schemaVersion 2) もそのまま読める", () => {
    const parsed = parseAreaDatabookSnapshot({ ...base, schemaVersion: 2 });
    expect(parsed.kakeiTopItems).toBeUndefined();
    expect(parsed.schemaVersion).toBeLessThan(AREA_DATABOOK_SCHEMA_VERSION);
  });

  it("上位品目を読む", () => {
    const item = { rankingKey: "gyoza", label: "ぎょうざ消費支出額", value: 3500, unit: "円", year: "2025年", rank: 1 };
    expect(parseAreaDatabookSnapshot({ ...base, kakeiTopItems: [item] }).kakeiTopItems).toEqual([item]);
  });

  it("形の崩れた品目は拒否する", () => {
    expect(() => parseAreaDatabookSnapshot({ ...base, kakeiTopItems: [{ rankingKey: "x" }] })).toThrow(/kakeiTopItems/);
    expect(() => parseAreaDatabookSnapshot({ ...base, kakeiTopItems: "x" })).toThrow(/kakeiTopItems/);
  });
});
