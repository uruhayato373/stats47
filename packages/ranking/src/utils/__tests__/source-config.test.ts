import { buildRecipe } from "@stats47/data-configs";
import { describe, expect, it } from "vitest";

import { isDerivedSource, readRecipe, resolveEstatParams } from "../source-config";

const recipe = buildRecipe({
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
      estatParams: {
        statsDataId: "0003456573",
        cdCat01: "A",
        cdCat03: "02",
        cdCat05: "05",
        cdTab: "01",
      },
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

describe("resolveEstatParams — 旧 flat 形 (再生成前の item.json)", () => {
  it("クエリキーだけ拾い、非クエリキーは落とす", () => {
    const params = resolveEstatParams({
      statsDataId: "0003456573",
      cdCat01: "A",
      cdCat02: "B",
      // ↓ 旧形にはこれらが同じ階層に混ざっていた。spread すると e-Stat に渡ってしまう
      source: { name: "x", url: "y" },
      note: "メモ",
      itemCode: "IC",
      collection: { name: "社会・人口統計体系" },
    } as never);

    expect(params).toEqual({ statsDataId: "0003456573", cdCat01: "A", cdCat02: "B" });
  });

  it("★旧形は cdCat03 以降を持たないので、その分の欠落はここでは補えない", () => {
    // 是正済み config は cdCat03 を持つが、旧 item.json には焼かれていない。
    // これが「config を直しただけではオンデマンド経路に届かない」の正体で、
    // 解消には R2 の再生成が要る (Phase 6)。
    const params = resolveEstatParams({ statsDataId: "0003456573", cdCat01: "A" } as never);
    expect(params).toEqual({ statsDataId: "0003456573", cdCat01: "A" });
    expect((params as Record<string, unknown>).cdCat03).toBeUndefined();
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
