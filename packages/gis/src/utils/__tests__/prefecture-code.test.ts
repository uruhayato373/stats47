/**
 * GIS のパス / URL に埋める都道府県コードの書式検証。
 *
 * ここが緩むと `buildMlitR2Path` / `buildGeoshapePathSegment` の両方が同時に緩むので、
 * 検証器そのものを独立に固定する。
 */

import { describe, expect, it } from "vitest";

import { assertPrefectureCode, isValidPrefectureCode } from "../prefecture-code";

describe("isValidPrefectureCode", () => {
  it.each(["01", "13", "47", "00", "99"])("2 桁の数字 %j を通す", (v) => {
    expect(isValidPrefectureCode(v)).toBe(true);
  });

  it.each([
    "1",
    "133",
    "13101",
    "..",
    "../..",
    "ab",
    "1a",
    " 13",
    "13 ",
    "",
    "13\n",
  ])("不正な値 %j を弾く", (v) => {
    expect(isValidPrefectureCode(v)).toBe(false);
  });

  it.each([null, undefined, 13, {}, [], ["13"]])(
    "文字列でない %j を弾く",
    (v) => {
      expect(isValidPrefectureCode(v)).toBe(false);
    },
  );

  // 「01〜47 の範囲」は見ない。存在しない県コードは 404 になるだけで、
  // パストラバーサルや SSRF の経路にはならないため (検証を過剰にすると
  // 将来コード体系が変わったときに正当な呼び出しを壊す)。
  it("範囲は見ない (00 / 99 も書式としては通す)", () => {
    expect(isValidPrefectureCode("00")).toBe(true);
    expect(isValidPrefectureCode("99")).toBe(true);
  });
});

describe("assertPrefectureCode", () => {
  it("正常値はそのまま返す", () => {
    expect(assertPrefectureCode("13", "test")).toBe("13");
  });

  it("context をエラーメッセージに含める (どの呼び出しが落ちたか分かるように)", () => {
    expect(() => assertPrefectureCode("..", "buildMlitR2Path")).toThrow(
      /buildMlitR2Path/,
    );
  });

  it("受け取った値をエラーメッセージに含める", () => {
    expect(() => assertPrefectureCode("../etc", "test")).toThrow(/\.\.\/etc/);
  });
});
