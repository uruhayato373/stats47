import { describe, expect, it } from "vitest";
import { fetchPrefectures } from "../../repositories/fetch-prefectures";
import { INLAND_PREFECTURE_CODES } from "../../constants/inland";
import { prefectureNameOf, prefectureShortName } from "../prefecture-name";

describe("prefectureShortName", () => {
  it("都・府・県を落とし、北海道は落とさない (「北海」という地名は無い)", () => {
    expect(prefectureShortName("東京都")).toBe("東京");
    expect(prefectureShortName("京都府")).toBe("京都");
    expect(prefectureShortName("大阪府")).toBe("大阪");
    expect(prefectureShortName("神奈川県")).toBe("神奈川");
    expect(prefectureShortName("北海道")).toBe("北海道");
  });

  it("正式名称にだけ適用する: 短縮済みの「京都」を渡すと「京」になる (冪等ではないことを固定)", () => {
    expect(prefectureShortName("京都")).toBe("京");
  });

  it("47 県の短縮名がすべて異なる (照合キーとして衝突しない)", () => {
    const shorts = fetchPrefectures().map((p) => prefectureShortName(p.prefName));
    expect(new Set(shorts).size).toBe(47);
  });
});

describe("prefectureNameOf", () => {
  it("2 桁・5 桁・市区町村コードから正式名称を引く", () => {
    expect(prefectureNameOf("13")).toBe("東京都");
    expect(prefectureNameOf("13000")).toBe("東京都");
    expect(prefectureNameOf("13113")).toBe("東京都");
    expect(prefectureNameOf("01")).toBe("北海道");
  });

  it("未知のコードは null", () => {
    expect(prefectureNameOf("48")).toBeNull();
    expect(prefectureNameOf("00000")).toBeNull();
    expect(prefectureNameOf("")).toBeNull();
  });
});

describe("INLAND_PREFECTURE_CODES", () => {
  it("海のない 8 県が prefectures.json の実在コードで並ぶ", () => {
    const names = INLAND_PREFECTURE_CODES.map((c) => prefectureNameOf(c));
    expect(names).toEqual(["栃木県", "群馬県", "埼玉県", "山梨県", "長野県", "岐阜県", "滋賀県", "奈良県"]);
  });
});
