import { buildRecipe } from "@stats47/data-configs";
import { describe, expect, it } from "vitest";

import { isDerivedSource, readRecipe, resolveEstatParams } from "../source-config";

const recipe = buildRecipe({
    visualization: { domain: { mode: 'extent' }, colorScheme: 'interpolateBlues', colorSchemeType: 'sequential',  classification: { method: 'equal-interval', classes: 5 }, trendDomain: { mode: 'extent', padding: 0.08 }, comparisonDomain: { mode: 'extent', padding: 0.05 } },
  key: "k",
  title: "t",
  unit: "人",
  category: "population",
  source: {
    kind: "estat",
    statsDataId: "0003456573",
    cdCat01: "A",
    cdCat03: "02",
    cdCat05: "05",
    cdTab: "01",
  },
  entities: ["prefecture"],
  years: "all",
});

const derivedRecipe = buildRecipe({
    visualization: { domain: { mode: 'extent' }, colorScheme: 'interpolateBlues', colorSchemeType: 'sequential',  classification: { method: 'equal-interval', classes: 5 }, trendDomain: { mode: 'extent', padding: 0.08 }, comparisonDomain: { mode: 'extent', padding: 0.05 } },
  key: "k2",
  title: "t2",
  unit: "千円",
  category: "laborwage",
  source: {
    kind: "estat",
    statsDataId: "0003426933",
    tabCombination: [
      { cdTab: "08", factor: 12 },
      { cdTab: "12", factor: 1 },
    ],
  },
  entities: ["prefecture"],
  years: "all",
});

describe("resolveEstatParams — 新形", () => {
  it("estatParams だけを返す (recipe / source は混ぜない)", () => {
    const params = resolveEstatParams({
      recipe,
      source: { name: "社会生活基本調査", url: "https://example.invalid" },
    } as never);

    expect(params).toEqual({
      statsDataId: "0003456573",
      cdCat01: "A",
      cdCat03: "02",
      cdCat05: "05",
      cdTab: "01",
    });
  });
});

describe("raw query aliases are rejected", () => {
 it("does not accept flat or duplicate query metadata", () => {
  expect(resolveEstatParams({statsDataId:"0003456573",cdCat01:"A"} as never)).toBeNull();
  expect(resolveEstatParams({estatParams:{statsDataId:"0003456573"}} as never)).toBeNull();
 });
});

describe("resolveEstatParams — 取得不能", () => {
  it.each([
    ["null", null],
    ["undefined", undefined],
    ["空オブジェクト", {}],
    ["statsDataId が空文字", { statsDataId: "" }],
    ["estatParams はあるが statsDataId が無い", { estatParams: { cdCat01: "A" } }],
  ])("%s は null", (_label, input) => {
    expect(resolveEstatParams(input as never)).toBeNull();
  });
});

describe("isDerivedSource", () => {
  it("宣言演算があれば true (e-Stat を叩いてはいけない)", () => {
    expect(isDerivedSource({ recipe: derivedRecipe } as never)).toBe(true);
  });

  it("軸 pin だけなら false (単発クエリで再現できる)", () => {
    expect(isDerivedSource({ recipe } as never)).toBe(false);
  });

  it("★レシピ未焼き込みの旧形は false (従来の挙動を維持する)", () => {
    expect(isDerivedSource({ statsDataId: "0003456573" } as never)).toBe(false);
    expect(isDerivedSource(null as never)).toBe(false);
  });
});

describe("readRecipe", () => {
  it("JSON を通してもレシピが読める", () => {
    const item = JSON.parse(JSON.stringify({ recipe }));
    expect(readRecipe(item)?.configHash).toBe(recipe.configHash);
  });

  it("旧形は null", () => {
    expect(readRecipe({ statsDataId: "x" } as never)).toBeNull();
  });
});
