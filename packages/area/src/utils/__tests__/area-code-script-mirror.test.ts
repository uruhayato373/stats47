import { createRequire } from "node:module";

import { describe, expect, it } from "vitest";

import * as areaCode from "../area-code";

// Node のスクリプトは TS を読めないので、同じ変換を .claude/scripts/lib/prefectures.cjs に鏡として持つ。
// 片方だけ直すと、スクリプトとアプリで同じコードの読み方が食い違う。同じ入力で結果が一致することを固定する。
const mirror = createRequire(import.meta.url)("../../../../../.claude/scripts/lib/prefectures.cjs") as {
  NATIONAL_AREA_CODE: string;
  PREFECTURE_COUNT: number;
  to2DigitPrefCode(code: string | number): string;
  to5DigitPrefCode(code: string | number): string;
  prefectureAreaCodeOf(code: string | number): string;
  isNationalAreaCode(code: string | number): boolean;
  isOkinawaAreaCode(code: string | number): boolean;
};

const INPUTS: Array<string | number> = ["13", "13000", "13113", "01", "1", 1, 1000, "1000", "01100", "47201", 47, "00000", " 08000 "];

describe("スクリプト用の鏡 (prefectures.cjs) は area-code.ts と同じ結果を返す", () => {
  it("定数が一致する", () => {
    expect(mirror.NATIONAL_AREA_CODE).toBe(areaCode.NATIONAL_AREA_CODE);
    expect(mirror.PREFECTURE_COUNT).toBe(areaCode.PREFECTURE_COUNT);
  });

  it.each(INPUTS)("%s の変換と判定が一致する", (input) => {
    expect(mirror.to2DigitPrefCode(input)).toBe(areaCode.to2DigitPrefCode(input));
    expect(mirror.to5DigitPrefCode(input)).toBe(areaCode.to5DigitPrefCode(input));
    expect(mirror.prefectureAreaCodeOf(input)).toBe(areaCode.prefectureAreaCodeOf(input));
    expect(mirror.isNationalAreaCode(input)).toBe(areaCode.isNationalAreaCode(input));
    expect(mirror.isOkinawaAreaCode(input)).toBe(areaCode.isOkinawaAreaCode(input));
  });
});
