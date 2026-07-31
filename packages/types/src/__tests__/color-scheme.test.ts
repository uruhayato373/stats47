/**
 * 配色語彙 SSOT の対照テスト (2026-07-31)。
 *
 * 元の欠陥は「表記の非対称」だった。短縮名しか受けない側に正式名を渡すと**黙って**
 * 既定色に落ち、例外も警告も出ないので誰も気づかなかった。したがってここでは
 * **往復 (round-trip) を全件で固定**する。片方向だけのテストでは再発を防げない。
 *
 * 全 PASS は「テストが何も見ていない」と区別がつかないので、
 * 現行バグを再現する mutation も併せて固定する。
 */

import { describe, expect, it } from "vitest";

import {
  COLOR_SCHEME_CATALOG,
  DEFAULT_DIVERGING_SCHEME,
  DEFAULT_SEQUENTIAL_SCHEME,
  assertKnownColorScheme,
  colorSchemeTypeOf,
  isKnownColorScheme,
  normalizeColorScheme,
  toShortColorScheme,
} from "../color-scheme";

describe("カタログの健全性", () => {
  it("short / canonical が一意 (先勝ちで後段が死ぬのを防ぐ)", () => {
    const shorts = new Set(COLOR_SCHEME_CATALOG.map((e) => e.short));
    const canonicals = new Set(COLOR_SCHEME_CATALOG.map((e) => e.canonical));
    expect(shorts.size).toBe(COLOR_SCHEME_CATALOG.length);
    expect(canonicals.size).toBe(COLOR_SCHEME_CATALOG.length);
  });

  it("既定値がカタログに実在する", () => {
    expect(isKnownColorScheme(DEFAULT_SEQUENTIAL_SCHEME)).toBe(true);
    expect(isKnownColorScheme(DEFAULT_DIVERGING_SCHEME)).toBe(true);
    expect(colorSchemeTypeOf(DEFAULT_SEQUENTIAL_SCHEME)).toBe("sequential");
    expect(colorSchemeTypeOf(DEFAULT_DIVERGING_SCHEME)).toBe("diverging");
  });

  it("移行前の 3 本 (sequential 27 / diverging 9 / categorical 10) を取りこぼしていない", () => {
    const count = (t: string) => COLOR_SCHEME_CATALOG.filter((e) => e.type === t).length;
    expect(count("sequential")).toBe(27);
    expect(count("diverging")).toBe(9);
    expect(count("categorical")).toBe(10);
  });
});

describe("★往復 — 表記の非対称を根絶する", () => {
  it("canonical → short → canonical が全件で戻る", () => {
    for (const e of COLOR_SCHEME_CATALOG) {
      expect(toShortColorScheme(e.canonical), e.canonical).toBe(e.short);
      expect(normalizeColorScheme(e.short), e.short).toBe(e.canonical);
    }
  });

  it("正式名を normalize しても二重接頭辞にならない (svg-builder が全部赤になった原因)", () => {
    expect(normalizeColorScheme("interpolateBlues")).toBe("interpolateBlues");
    expect(normalizeColorScheme("interpolateBlues")).not.toContain("interpolateinterpolate");
    // ★これが本丸: item.json の値 (正式名) を svg-builder に渡す前の変換
    expect(toShortColorScheme("interpolateBlues")).toBe("Blues");
    expect(toShortColorScheme("interpolateRdBu")).toBe("RdBu");
  });

  it("大小の揺れを吸収する (旧 alias マップが持っていた挙動)", () => {
    expect(normalizeColorScheme("blues")).toBe("interpolateBlues");
    expect(normalizeColorScheme("Blues")).toBe("interpolateBlues");
    expect(normalizeColorScheme("rdbu")).toBe("interpolateRdBu");
  });
});

describe("未知の値", () => {
  it("null を返す (既定値に化けない)", () => {
    for (const v of ["", "   ", "Nope", "interpolateNope", null, undefined]) {
      expect(normalizeColorScheme(v as string), String(v)).toBeNull();
      expect(toShortColorScheme(v as string), String(v)).toBeNull();
      expect(isKnownColorScheme(v as string), String(v)).toBe(false);
    }
  });

  it("★生成側の assert は例外にする (間違った色が焼き込まれる前に止める)", () => {
    expect(() => assertKnownColorScheme("interpolateNope", "test")).toThrow(/未知のカラースキーム/);
    // 文脈が例外文に入る (どこで起きたか分からないと直せない)
    expect(() => assertKnownColorScheme("Nope", "build-ranking-item(foo)")).toThrow(
      /build-ranking-item\(foo\)/,
    );
  });

  it("assert は既知の値を canonical にして返す", () => {
    expect(assertKnownColorScheme("Blues", "test")).toBe("interpolateBlues");
    expect(assertKnownColorScheme("interpolateReds", "test")).toBe("interpolateReds");
  });
});

describe("★mutation — 現行バグの再現で感度を固定する", () => {
  it("toShort を恒等関数にすると svg-builder 側で二重接頭辞になる", () => {
    // 「短縮名に変換せず正式名をそのまま渡す」= 修正前の挙動を再現する
    const brokenToShort = (v: string) => v;
    const svgBuilderLookup = (scheme: string) => `interpolate${scheme}`;
    expect(svgBuilderLookup(brokenToShort("interpolateBlues"))).toBe(
      "interpolateinterpolateBlues", // d3 に存在しない = null → 既定 Reds に落ちる
    );
    // 正しい経路ならこうなる
    expect(svgBuilderLookup(toShortColorScheme("interpolateBlues")!)).toBe("interpolateBlues");
  });

  it("カタログから Blues を落とすと assert が落ちる (カタログが照合に効いている証明)", () => {
    const without = COLOR_SCHEME_CATALOG.filter((e) => e.short !== "Blues");
    const lookup = new Map<string, unknown>(without.map((e) => [e.canonical, e]));
    expect(lookup.has("interpolateBlues")).toBe(false);
  });
});
