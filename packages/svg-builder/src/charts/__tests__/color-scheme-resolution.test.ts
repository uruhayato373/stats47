/**
 * カタログ 46 件が **実際に d3 から解決できる**ことを固定する (2026-07-31)。
 *
 * 語彙 SSOT (`@stats47/types`) は d3 を持たない設計なので、「カタログに載っているが
 * d3 に存在しない」名前が混入しても語彙側のテストでは気づけない。ここで実解決して塞ぐ。
 *
 * これが無いと、カタログに typo を入れても描画側が黙って既定色に落ちるだけで
 * 誰も気づかない — 今回直したのと同じ失敗の再来になる。
 */

import * as d3chromatic from "d3-scale-chromatic";
import { COLOR_SCHEME_CATALOG, d3KeyOfColorScheme, toShortColorScheme } from "@stats47/types";
import { describe, expect, it } from "vitest";

/** カタログの d3Key で引く (消費者が override マップを持たなくて済む形)。 */
const resolveByD3Key = (canonicalOrShort: string): unknown => {
  const key = d3KeyOfColorScheme(canonicalOrShort);
  return key ? (d3chromatic as unknown as Record<string, unknown>)[key] : undefined;
};

/** 短縮名から素朴に組み立てる旧式の解決 (非対称の実証用)。 */
const resolveNaive = (short: string): unknown =>
  (d3chromatic as unknown as Record<string, unknown>)[`interpolate${short}`];

describe("カタログ → d3 の到達率", () => {
  const sequentialAndDiverging = COLOR_SCHEME_CATALOG.filter((e) => e.type !== "categorical");

  it("★連続・発散の全件 (36 件) が d3 の関数として解決できる", () => {
    const unresolved = sequentialAndDiverging.filter(
      (e) => typeof resolveByD3Key(e.canonical) !== "function",
    );
    expect(unresolved.map((e) => e.short)).toEqual([]);
    expect(sequentialAndDiverging).toHaveLength(36);
  });

  it("categorical は配列として解決できる (interpolate ではなく scheme 接頭辞)", () => {
    const categorical = COLOR_SCHEME_CATALOG.filter((e) => e.type === "categorical");
    const unresolved = categorical.filter((e) => resolveByD3Key(e.canonical) === undefined);
    expect(unresolved.map((e) => e.short)).toEqual([]);
  });

  it("★Cubehelix は canonical と d3 の実名が違う (カタログが吸収する)", () => {
    // config には interpolateCubehelix と書かれているが d3 には存在しない
    expect(resolveNaive("Cubehelix")).toBeUndefined();
    // カタログの d3Key を通せば解決する
    expect(typeof resolveByD3Key("interpolateCubehelix")).toBe("function");
  });

  it("★正式名を短縮名に直してから引けば解決できる (非対称の実証)", () => {
    // 修正前: 正式名をそのまま渡すと二重接頭辞で null
    expect(resolveNaive("interpolateBlues")).toBeUndefined();
    // 修正後: toShortColorScheme を通せば解決する
    expect(typeof resolveNaive(toShortColorScheme("interpolateBlues")!)).toBe("function");
  });

  it("カタログ外の名前は解決できない (フォールバック検出の前提)", () => {
    expect(resolveByD3Key("Nope")).toBeUndefined();
    expect(resolveNaive("Nope")).toBeUndefined();
  });
});
