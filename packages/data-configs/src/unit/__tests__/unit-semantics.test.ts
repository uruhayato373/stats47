/**
 * 単位セマンティクス正典の対照テスト。
 *
 * ★このモジュールの価値は「解釈できないときに黙って 1 倍にしない」ことにある。
 * 換算できる組と**できない組**を同じ強さで固定する。1 倍フォールバックが入ると
 * 桁違いの値が「一致」と判定され、監査が全 PASS になって意味を失う
 * (2026-08-12 に書籍監査・ブログ factual-check の両方で実際に起きた)。
 */
import { describe, expect, it } from "vitest";
import {
  KNOWN_UNIT_SAMPLES,
  conversionFactor,
  isScalePrefixPartOfUnit,
  parseUnit,
  sameDimension,
  scalePrefixMultiplier,
  unitScaleMultiplier,
} from "../unit-semantics";

describe("parseUnit — 金額族", () => {
  it("スケール接頭辞を指数にする", () => {
    expect(parseUnit("円")).toMatchObject({ dimension: "currency", scaleExponent: 0 });
    expect(parseUnit("千円")).toMatchObject({ dimension: "currency", scaleExponent: 3 });
    expect(parseUnit("万円")).toMatchObject({ dimension: "currency", scaleExponent: 4 });
    expect(parseUnit("十万円")).toMatchObject({ dimension: "currency", scaleExponent: 5 });
    expect(parseUnit("百万円")).toMatchObject({ dimension: "currency", scaleExponent: 6 });
    expect(parseUnit("億円")).toMatchObject({ dimension: "currency", scaleExponent: 8 });
    expect(parseUnit("兆円")).toMatchObject({ dimension: "currency", scaleExponent: 12 });
  });

  it("長い接頭辞を先に見る (百万円 が 万円 にならない)", () => {
    expect(parseUnit("百万円").scaleExponent).toBe(6);
    expect(parseUnit("十万円").scaleExponent).toBe(5);
  });
});

describe("parseUnit — その他の次元", () => {
  it("人・世帯・件などの個数系", () => {
    expect(parseUnit("人").dimension).toBe("people");
    expect(parseUnit("千人")).toMatchObject({ dimension: "people", scaleExponent: 3 });
    expect(parseUnit("世帯").dimension).toBe("household");
    expect(parseUnit("件").dimension).toBe("count");
  });

  it("割合は次元を分ける (‰ と ％ を換算しない)", () => {
    expect(parseUnit("％").dimension).toBe("percent");
    expect(parseUnit("%").dimension).toBe("percent");
    expect(parseUnit("‰").dimension).toBe("permille");
  });

  it("全半角ゆれを畳む", () => {
    expect(parseUnit("ｈａ").dimension).toBe("area");
    expect(parseUnit("ｋｇ").dimension).toBe("mass");
  });

  it("指数・全国=100 は無次元", () => {
    expect(parseUnit("指数").dimension).toBe("index");
    expect(parseUnit("（全国=100）").dimension).toBe("index");
  });

  it("★解釈できない単位は dimension: null (1 倍にしない)", () => {
    expect(parseUnit("学級･講座").dimension).toBeNull();
    expect(parseUnit("").dimension).toBeNull();
    expect(parseUnit(null).dimension).toBeNull();
    expect(parseUnit(undefined).dimension).toBeNull();
  });
});

describe("parseUnit — 分母つき単位", () => {
  it("分母つきを識別する", () => {
    expect(parseUnit("人（人口10万対）")).toMatchObject({ dimension: "people", hasDenominator: true });
    expect(parseUnit("人口千対").hasDenominator).toBe(true);
    expect(parseUnit("人口10万対").hasDenominator).toBe(true);
  });

  it("素の単位は分母つきではない", () => {
    expect(parseUnit("人").hasDenominator).toBe(false);
  });
});

describe("conversionFactor — 換算", () => {
  it("★千円で持つ値を円で表す倍率 (今回の事故の本体)", () => {
    expect(conversionFactor("千円", "円")).toBe(1000);
    expect(conversionFactor("円", "千円")).toBe(0.001);
  });

  it("金額族の他の組", () => {
    expect(conversionFactor("百万円", "円")).toBe(1_000_000);
    expect(conversionFactor("億円", "万円")).toBe(10_000);
    expect(conversionFactor("兆円", "億円")).toBe(10_000);
  });

  it("同一単位は 1", () => {
    expect(conversionFactor("円", "円")).toBe(1);
    expect(conversionFactor("人", "人")).toBe(1);
  });

  it("人のスケールも換算する", () => {
    expect(conversionFactor("万人", "人")).toBe(10_000);
  });

  it("★次元が違えば null (人 と 円 を換算しない)", () => {
    expect(conversionFactor("人", "円")).toBeNull();
    expect(conversionFactor("％", "円")).toBeNull();
    expect(conversionFactor("kg", "km")).toBeNull();
  });

  it("★‰ と ％ は換算しない (10 倍違うが混同事故を避け別次元)", () => {
    expect(conversionFactor("‰", "％")).toBeNull();
  });

  it("★分母の有無が違えば null (人 と 人口10万対の人)", () => {
    expect(conversionFactor("人（人口10万対）", "人")).toBeNull();
    expect(conversionFactor("人", "人口千対")).toBeNull();
  });

  it("★解釈できない単位は null (黙って 1 倍にしない)", () => {
    expect(conversionFactor("学級･講座", "円")).toBeNull();
    expect(conversionFactor("円", "謎の単位")).toBeNull();
    expect(conversionFactor(null, "円")).toBeNull();
    expect(conversionFactor("", "")).toBeNull();
  });

  it("指数同士は 1、指数と他は null", () => {
    expect(conversionFactor("指数", "指数")).toBe(1);
    expect(conversionFactor("指数", "円")).toBeNull();
  });
});

describe("sameDimension", () => {
  it("換算できる組だけ true", () => {
    expect(sameDimension("千円", "円")).toBe(true);
    expect(sameDimension("人", "円")).toBe(false);
    expect(sameDimension("謎", "円")).toBe(false);
  });
});

describe("語彙カバレッジ", () => {
  it("実測した主要語彙をすべて解釈できる", () => {
    const unresolved = KNOWN_UNIT_SAMPLES.filter((u) => parseUnit(u).dimension === null);
    expect(unresolved).toEqual([]);
  });
});

describe("scalePrefixMultiplier — 本文表記の接頭辞", () => {
  it("接頭辞 1 語を倍率にする", () => {
    expect(scalePrefixMultiplier("千")).toBe(1000);
    expect(scalePrefixMultiplier("万")).toBe(10_000);
    expect(scalePrefixMultiplier("億")).toBe(1e8);
    expect(scalePrefixMultiplier("兆")).toBe(1e12);
    expect(scalePrefixMultiplier("百万")).toBe(1e6);
  });

  it("接頭辞でなければ null", () => {
    expect(scalePrefixMultiplier("円")).toBeNull();
    expect(scalePrefixMultiplier("")).toBeNull();
    expect(scalePrefixMultiplier(null)).toBeNull();
  });
});

describe("isScalePrefixPartOfUnit — 桁ずれ事故の判定", () => {
  it("★unit=千円 の「千」は単位の一部 (倍率 1)", () => {
    expect(isScalePrefixPartOfUnit("千", "千円")).toBe(true);
  });

  it("★unit=人 の「万」はスケール (倍率 1e4)", () => {
    expect(isScalePrefixPartOfUnit("万", "人")).toBe(false);
  });

  it("百万円 の「百万」も単位の一部", () => {
    expect(isScalePrefixPartOfUnit("百万", "百万円")).toBe(true);
  });

  it("単位が無ければ false", () => {
    expect(isScalePrefixPartOfUnit("千", null)).toBe(false);
  });
});

describe("unitScaleMultiplier", () => {
  it("単位に埋まった倍率を返す", () => {
    expect(unitScaleMultiplier("千円")).toBe(1000);
    expect(unitScaleMultiplier("百万円")).toBe(1e6);
    expect(unitScaleMultiplier("円")).toBe(1);
  });

  it("解釈できなければ null (1 にフォールバックしない)", () => {
    expect(unitScaleMultiplier("学級･講座")).toBeNull();
  });
});
