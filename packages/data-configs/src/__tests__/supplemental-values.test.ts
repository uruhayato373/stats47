import { describe, expect, it } from "vitest";

import { buildRecipe, parseRecipe } from "../recipe";
import { mergeSupplementalValues } from "../supplemental-values";
import type { MetricConfig } from "../types";

const v = (area: string, year: string, value: string) => ({ "@area": area, "@time": `${year}000000`, $: value });

describe("mergeSupplementalValues", () => {
  it("主出典に無い年を補完表から足す (SSDS 2024 止まりに国勢調査 2025 を足す)", () => {
    const primary = [v("05000", "2020", "37.6"), v("05000", "2024", "39.5")];
    const census = [v("05000", "2025", "40.1"), v("05000", "2020", "37.6")];

    const merged = mergeSupplementalValues(primary, [{ years: [2025], values: census }]);

    expect(merged.values.map((x) => `${x["@time"].slice(0, 4)}:${x.$}`)).toEqual([
      "2020:37.6",
      "2024:39.5",
      "2025:40.1",
    ]);
    expect(merged.suppliedYears).toEqual(["2025"]);
    expect(merged.overlapYears).toEqual([]);
  });

  it("補完年は補完側を採り、主出典の同じ年は捨てて overlap として返す (推計値で国勢調査を上書きしない)", () => {
    const primary = [v("05000", "2025", "39.9")];
    const census = [v("05000", "2025", "40.1")];

    const merged = mergeSupplementalValues(primary, [{ years: [2025], values: census }]);

    expect(merged.values.map((x) => x.$)).toEqual(["40.1"]);
    expect(merged.overlapYears).toEqual(["2025"]);
  });

  it("補完表の指定外の年は採らない (同じ表の 2020 組替値などを混ぜない)", () => {
    const merged = mergeSupplementalValues([], [{ years: [2025], values: [v("13000", "2020", "1")] }]);

    expect(merged.values).toEqual([]);
    expect(merged.suppliedYears).toEqual([]);
  });

  it("補完が無ければ主出典をそのまま返す", () => {
    const primary = [v("01000", "2024", "1")];
    expect(mergeSupplementalValues(primary, []).values).toEqual(primary);
  });
});

describe("buildRecipe — supplementalSources", () => {
  const base: MetricConfig = {
    key: "ratio-65-plus",
    title: "65歳以上人口割合",
    unit: "％",
    category: "population",
    source: { kind: "estat", statsDataId: "0000010201", cdCat01: "#A03503" },
    entities: ["prefecture"],
    years: "all",
  };
  const withSupplement: MetricConfig = {
    ...base,
    supplementalSources: [
      {
        years: [2025],
        source: { kind: "estat", statsDataId: "0004065933", cdTab: "2025_42", cdCat01: "0", cdCat02: "0", cdCat03: "3" },
        reason: "SSDS に 2025 年国勢調査が未反映",
      },
    ],
  };

  it("補完があれば derived になり、オンデマンド経路が主出典だけを叩かない", () => {
    expect(buildRecipe(base).derived).toBe(false);
    expect(buildRecipe(withSupplement).derived).toBe(true);
  });

  it("補完の有無で configHash が変わる (再取り込みが要ると監査が検出できる)", () => {
    expect(buildRecipe(withSupplement).configHash).not.toBe(buildRecipe(base).configHash);
  });

  it("R2 に焼いたレシピを読み戻しても補完が残る", () => {
    const recipe = buildRecipe(withSupplement);
    const parsed = parseRecipe(JSON.parse(JSON.stringify(recipe)));

    expect(parsed?.ops?.supplements).toEqual([
      {
        years: [2025],
        estatParams: { statsDataId: "0004065933", cdTab: "2025_42", cdCat01: "0", cdCat02: "0", cdCat03: "3" },
      },
    ]);
  });
});
