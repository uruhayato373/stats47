import { fetchPrefectures } from "@stats47/area";
import { describe, it, expect } from "vitest";


import { matchPrefectures, prefectureShortName } from "../match-prefectures";

const PREFS = fetchPrefectures();

describe("matchPrefectures", () => {
  it("空クエリで全47件を元の順序で返す", () => {
    const r = matchPrefectures("", PREFS);
    expect(r).toHaveLength(47);
    expect(r[0].prefCode).toBe(PREFS[0].prefCode);
  });

  it("空白のみのクエリも全件扱い", () => {
    expect(matchPrefectures("   ", PREFS)).toHaveLength(47);
  });

  it("『東京』が東京都に一致する (suffix 省略)", () => {
    const r = matchPrefectures("東京", PREFS);
    expect(r[0].prefName).toBe("東京都");
    expect(r[0].prefCode).toBe("13000");
  });

  it("『東京都』が東京都に一致する", () => {
    expect(matchPrefectures("東京都", PREFS)[0].prefName).toBe("東京都");
  });

  it("『大阪』が大阪府に一致する", () => {
    const r = matchPrefectures("大阪", PREFS);
    expect(r[0].prefName).toBe("大阪府");
    expect(r[0].prefCode).toBe("27000");
  });

  it("『北海道』が北海道に一致する", () => {
    expect(matchPrefectures("北海道", PREFS)[0].prefName).toBe("北海道");
  });

  it("存在しない語で0件", () => {
    expect(matchPrefectures("マサチューセッツ", PREFS)).toHaveLength(0);
    expect(matchPrefectures("xyz", PREFS)).toHaveLength(0);
  });

  it("完全一致を部分一致より上位に並べる (『京都』→ 京都府が先頭・東京都も含む)", () => {
    const r = matchPrefectures("京都", PREFS);
    expect(r[0].prefName).toBe("京都府");
    expect(r.some((p) => p.prefName === "東京都")).toBe(true);
  });
});

describe("prefectureShortName", () => {
  it("末尾接尾辞 (都/道/府/県) を1文字落とす", () => {
    expect(prefectureShortName("東京都")).toBe("東京");
    expect(prefectureShortName("大阪府")).toBe("大阪");
    expect(prefectureShortName("神奈川県")).toBe("神奈川");
    expect(prefectureShortName("北海道")).toBe("北海");
  });
});
