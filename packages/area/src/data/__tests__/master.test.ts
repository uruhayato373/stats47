import { describe, expect, it } from "vitest";

import ports from "../../../../../data/areas/master/ports.json";
import { CITIES, PREFECTURES } from "..";

describe("areas.prefectures / areas.cities / areas.ports (data/areas/master)", () => {
  it("都道府県は JIS 順の 47 件で、コードが 01000〜47000 に並ぶ", () => {
    expect(PREFECTURES).toHaveLength(47);
    expect(PREFECTURES.map((p) => p.prefCode)).toEqual(
      Array.from({ length: 47 }, (_, i) => `${String(i + 1).padStart(2, "0")}000`),
    );
  });

  it("市区町村は 1,913 件でコードが重複せず、親は都道府県 (level 2) か政令指定都市 (level 3)", () => {
    expect(CITIES).toHaveLength(1913);
    const codes = new Set(CITIES.map((c) => c.cityCode));
    expect(codes.size).toBe(CITIES.length);
    const prefCodes = new Set(PREFECTURES.map((p) => p.prefCode));
    for (const c of CITIES) {
      if (c.level === "2") expect(prefCodes.has(c.prefCode)).toBe(true);
      else expect(codes.has(c.prefCode)).toBe(true);
    }
  });

  it("港湾は 699 件でコードが重複せず、所在の県名が都道府県のマスタと一致する", () => {
    expect(ports).toHaveLength(699);
    expect(new Set(ports.map((p) => p.portCode)).size).toBe(ports.length);
    const nameByCode = new Map(PREFECTURES.map((p) => [p.prefCode.slice(0, 2), p.prefName]));
    for (const p of ports) expect(nameByCode.get(p.prefectureCode)).toBe(p.prefectureName);
  });
});
