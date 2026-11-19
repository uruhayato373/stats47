import { describe, expect, it } from "vitest";

import { PREFECTURE_AREA_CODES } from "../../constants";
import {
  NATIONAL_AREA_CODE,
  PREFECTURE_COUNT,
  isNationalAreaCode,
  prefCodeFromTopoProperties,
  prefectureAreaCodeOf,
} from "../area-code";

describe("area-code (地域コードの単一実装)", () => {
  it("県の数は台帳の件数と一致する", () => {
    expect(PREFECTURE_AREA_CODES).toHaveLength(PREFECTURE_COUNT);
  });

  it("全国の行を判定する", () => {
    expect(NATIONAL_AREA_CODE).toBe("00000");
    expect(isNationalAreaCode("00000")).toBe(true);
    expect(isNationalAreaCode("13000")).toBe(false);
  });

  it("市区町村コードから所属する県の 5 桁を返す", () => {
    expect(prefectureAreaCodeOf("13113")).toBe("13000");
    expect(prefectureAreaCodeOf("01100")).toBe("01000");
    expect(prefectureAreaCodeOf(1100)).toBe("01000");
  });

  it("地図の形データの属性から 2 桁の県コードを読む", () => {
    expect(prefCodeFromTopoProperties({ N03_007: "13" })).toBe("13");
    expect(prefCodeFromTopoProperties({ N03_007: "01100" })).toBe("01");
    expect(prefCodeFromTopoProperties({ N03_007: 1 })).toBe("01");
    expect(prefCodeFromTopoProperties({ prefCode: "47000" })).toBe("47");
    expect(prefCodeFromTopoProperties({ code: "08" })).toBe("08");
    expect(prefCodeFromTopoProperties({ N03_007: "" })).toBeNull();
    expect(prefCodeFromTopoProperties({ N03_007: "99" })).toBeNull();
    expect(prefCodeFromTopoProperties({ name: "東京都" })).toBeNull();
    expect(prefCodeFromTopoProperties(null)).toBeNull();
  });
});
