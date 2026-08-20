import { describe, expect, it } from "vitest";

import { axisParams } from "../generate-japan-series";

/**
 * e-Stat の分類軸を**取りこぼさない**ことを固定する。
 *
 * ★2026-08-20 の実測バグ: `fetchEstatRaw` が cdCat01 だけを送り、
 *   cdTab / cdCat02〜05 を落としていた。賃金構造基本統計 (0003445758) は
 *   同じ表に「年齢(歳)」「勤続年数」「給与(千円)」が並ぶため、全国行として
 *   **年齢の行**を拾い、`単位不一致: config.unit='千円' / e-Stat unit='歳'` で
 *   誤って unsupported 判定されていた (nurse-salary 等)。
 *
 * ★軸を落とすと「エラーにならず、別の系列を静かに取得する」ので気づきにくい。
 *   件数を数える検査ではなく、**各軸が実際に渡ること**を 1 つずつ固定する。
 */
describe("axisParams — e-Stat 分類軸の取りこぼし防止", () => {
  it("cdTab を落とさない (これを落とすと賃金構造で年齢行を拾う)", () => {
    const p = axisParams({
      source: { statsDataId: "0003445758", cdTab: "10", cdCat01: "01", cdCat02: "1133" },
    });
    expect(p.cdTab).toBe("10");
  });

  it("cdCat01〜05 をすべて渡す", () => {
    const p = axisParams({
      source: {
        cdCat01: "1", cdCat02: "2", cdCat03: "3", cdCat04: "4", cdCat05: "5",
      },
    });
    expect(p).toEqual({ cdCat01: "1", cdCat02: "2", cdCat03: "3", cdCat04: "4", cdCat05: "5" });
  });

  it("未指定の軸は送らない (空文字も送らない)", () => {
    const p = axisParams({ source: { cdCat01: "1", cdCat02: "", cdTab: undefined } });
    expect(p).toEqual({ cdCat01: "1" });
  });

  it("軸以外のフィールドを送らない (allowlist を緩めない)", () => {
    // ★WP6 で逆方向の事故があった: source の全 string field を filter として拾い、
    //   displayName/url まで送って official 候補が 114 → 1 件に激減した。
    const p = axisParams({
      source: {
        cdCat01: "1",
        statsDataId: "0003445758",
        displayName: "賃金構造基本統計調査",
        url: "https://example.com",
        kind: "estat",
      },
    });
    expect(p).toEqual({ cdCat01: "1" });
  });
});
