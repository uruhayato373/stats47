import { beforeEach, describe, expect, it } from "vitest";

import {
  DEFAULT_THEME_PREFECTURE,
  THEME_PREFECTURE_COOKIE_NAME,
  THEME_PREFECTURE_SET_VALUE,
  resolveInitialThemePrefecture,
  resolveThemePrefectureCode,
  writeThemePrefecturePreference,
} from "../theme-prefecture-preference";

describe("resolveInitialThemePrefecture", () => {
  it("URLをCookieより優先する", () => {
    expect(
      resolveInitialThemePrefecture({
        urlPreference: "13000",
        cookiePreference: "27000",
      })
    ).toEqual({ areaCode: "13000", areaName: "東京都" });
  });

  it("URLが無ければCookieの都道府県を使う", () => {
    expect(resolveInitialThemePrefecture({ cookiePreference: "27000" })).toEqual({
      areaCode: "27000",
      areaName: "大阪府",
    });
  });

  it("初回訪問は兵庫県を使う", () => {
    expect(resolveInitialThemePrefecture({})).toEqual(DEFAULT_THEME_PREFECTURE);
  });

  it("47都道府県の明示選択を兵庫県へ戻さない", () => {
    expect(
      resolveInitialThemePrefecture({
        cookiePreference: THEME_PREFECTURE_SET_VALUE,
      })
    ).toBeNull();
  });

  it("市区町村コードや全国コードを都道府県として採用しない", () => {
    expect(resolveThemePrefectureCode("28100")).toBeNull();
    expect(resolveThemePrefectureCode("00000")).toBeNull();
  });
});

describe("writeThemePrefecturePreference", () => {
  beforeEach(() => {
    Object.defineProperty(document, "cookie", {
      configurable: true,
      writable: true,
      value: "",
    });
  });

  it("選択した都道府県を1年間保持する", () => {
    writeThemePrefecturePreference("28000");
    expect(document.cookie).toContain(`${THEME_PREFECTURE_COOKIE_NAME}=28000`);
    expect(document.cookie).toContain("max-age=31536000");
    expect(document.cookie).toContain("SameSite=Lax");
  });

  it("47都道府県の明示選択も保持する", () => {
    writeThemePrefecturePreference(null);
    expect(document.cookie).toContain(
      `${THEME_PREFECTURE_COOKIE_NAME}=${THEME_PREFECTURE_SET_VALUE}`
    );
  });
});
