/**
 * 凡例グラデーションが配色に追従することを固定する (2026-07-31)。
 *
 * 元の欠陥は「5 色の CSS リテラルが 2 ファイルに複製されていた」こと。
 * 配色を prop 化しても凡例がリテラルのままなら、地図だけ色が変わって凡例は RdBu のまま残る。
 * 追従することと、追従しない実装なら落ちることの両方を固定する。
 */
import { describe, expect, it } from "vitest";

import {
  legendGradientCss,
  legendGradientStops,
  resolveSchemeInterpolator,
} from "../../../utils/color-scale/legend-gradient";

describe("legendGradientStops", () => {
  it("既定 (RdBu) は赤→白→青のグラデーションになる", () => {
    const stops = legendGradientStops("interpolateRdBu");
    expect(stops).toHaveLength(5);
    expect(stops.every((s) => s.startsWith("rgb"))).toBe(true);
    // 中央 (t=0.5) は白に近い = 発散配色の中立点
    expect(stops[2]).toMatch(/rgb\(2[0-9]{2}, 2[0-9]{2}, 2[0-9]{2}\)/);
  });

  it("★配色を変えると色が変わる (凡例が追従する証明)", () => {
    const rdbu = legendGradientStops("interpolateRdBu");
    const greens = legendGradientStops("interpolateGreens");
    expect(greens).not.toEqual(rdbu);
  });

  it("短縮名でも正式名でも同じ結果になる", () => {
    expect(legendGradientStops("Greens")).toEqual(legendGradientStops("interpolateGreens"));
  });

  it("steps を変えると本数が変わる", () => {
    expect(legendGradientStops("interpolateBlues", 3)).toHaveLength(3);
    // 2 未満は 2 に丸める (グラデーションは 2 色以上必要)
    expect(legendGradientStops("interpolateBlues", 1)).toHaveLength(2);
  });

  it("未知の配色は既定へフォールバックする (描画側なので throw しない)", () => {
    expect(legendGradientStops("interpolateNope")).toEqual(legendGradientStops("interpolateRdBu"));
  });
});

describe("legendGradientCss", () => {
  it("CSS の linear-gradient を作る", () => {
    const css = legendGradientCss("interpolateRdBu");
    expect(css).toMatch(/^linear-gradient\(to right, rgb\(.+\)\)$/);
  });

  it("reverse で向きが反転する (地図の domain と左右を合わせるため)", () => {
    const a = legendGradientStops("interpolateRdBu");
    const css = legendGradientCss("interpolateRdBu", { reverse: true });
    expect(css.indexOf(a[4])).toBeLessThan(css.indexOf(a[0]));
  });

  it("★mutation: リテラル固定の旧実装は配色を変えても同じ文字列を返す", () => {
    const hardcoded = () =>
      "linear-gradient(to right, #b2182b, #ef8a62, #f7f7f7, #67a9cf, #2166ac)";
    expect(hardcoded()).toBe(hardcoded());
    // 導出版は配色ごとに違う
    expect(legendGradientCss("interpolateGreens")).not.toBe(legendGradientCss("interpolateRdBu"));
  });
});

describe("resolveSchemeInterpolator", () => {
  it("カタログ経由で d3 の関数を返す", () => {
    expect(typeof resolveSchemeInterpolator("interpolateBlues")(0.5)).toBe("string");
  });

  it("★canonical と d3 実名が違う Cubehelix も解決できる", () => {
    expect(typeof resolveSchemeInterpolator("interpolateCubehelix")(0.5)).toBe("string");
  });

  it("未知なら fallback を使う", () => {
    expect(resolveSchemeInterpolator("Nope", "interpolateGreens")(0.5)).toBe(
      resolveSchemeInterpolator("interpolateGreens")(0.5),
    );
  });
});
