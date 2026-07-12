import { describe, expect, it } from "vitest";

import {
  isThumbnailValueTooLong,
  MAX_NUMBER_VARIANT_DIGITS,
  resolveRankingThumbnailVariant,
} from "../resolve-thumbnail-variant";

// 有効な数値型データの雛形 (欠損/長さ条件を個別に上書きする)
const validNumberData = { topAreaName: "秋田県", topValue: "51.8" };

describe("resolveRankingThumbnailVariant", () => {
  it("config の明示値 map を最優先する (locationDefault=number でも map)", () => {
    expect(
      resolveRankingThumbnailVariant({
        configVariant: "map",
        locationDefault: "number",
        ...validNumberData,
      }),
    ).toBe("map");
  });

  it("config の明示値 number を最優先する (locationDefault=map でも number)", () => {
    expect(
      resolveRankingThumbnailVariant({
        configVariant: "number",
        locationDefault: "map",
        ...validNumberData,
      }),
    ).toBe("number");
  });

  it("config 未設定なら呼び出し側 variant を使う", () => {
    expect(
      resolveRankingThumbnailVariant({
        callerVariant: "number",
        locationDefault: "map",
        ...validNumberData,
      }),
    ).toBe("number");
  });

  it("config・呼び出し側 未設定なら表示場所の既定値を使う", () => {
    expect(
      resolveRankingThumbnailVariant({
        locationDefault: "number",
        ...validNumberData,
      }),
    ).toBe("number");
    expect(
      resolveRankingThumbnailVariant({
        locationDefault: "map",
        ...validNumberData,
      }),
    ).toBe("map");
  });

  it("完全未設定は必ず map", () => {
    expect(resolveRankingThumbnailVariant({ ...validNumberData })).toBe("map");
    expect(resolveRankingThumbnailVariant({})).toBe("map");
  });

  it("number 解決でも topAreaName 欠損なら map へ戻す", () => {
    expect(
      resolveRankingThumbnailVariant({
        configVariant: "number",
        topAreaName: undefined,
        topValue: "51.8",
      }),
    ).toBe("map");
    expect(
      resolveRankingThumbnailVariant({
        configVariant: "number",
        topAreaName: "   ",
        topValue: "51.8",
      }),
    ).toBe("map");
  });

  it("number 解決でも topValue 欠損なら map へ戻す", () => {
    expect(
      resolveRankingThumbnailVariant({
        configVariant: "number",
        topAreaName: "秋田県",
        topValue: undefined,
      }),
    ).toBe("map");
  });

  it("値が 5 桁以上 (長すぎ) なら number でも map へ戻す", () => {
    // 総人口 "11,673,554" (8 桁) → map
    expect(
      resolveRankingThumbnailVariant({
        configVariant: "number",
        topAreaName: "東京都",
        topValue: "11,673,554",
      }),
    ).toBe("map");
    // 財政力指数 "1.15328" (6 桁) → map
    expect(
      resolveRankingThumbnailVariant({
        configVariant: "number",
        topAreaName: "東京都",
        topValue: "1.15328",
      }),
    ).toBe("map");
  });

  it("短い値 (小数・整数) は number を維持する", () => {
    // 未婚者割合 "51.8" (3 桁) / 年間日照 "2,309" (4 桁) → number
    for (const topValue of ["51.8", "2,309", "0", "9"]) {
      expect(
        resolveRankingThumbnailVariant({
          configVariant: "number",
          topAreaName: "高知県",
          topValue,
        }),
      ).toBe("number");
    }
  });

  it("負数・小数も桁数のみで判定する", () => {
    expect(
      resolveRankingThumbnailVariant({
        configVariant: "number",
        topAreaName: "北海道",
        topValue: "-3.2",
      }),
    ).toBe("number"); // 2 桁 → OK
  });
});

describe("isThumbnailValueTooLong", () => {
  it("桁数が上限以下なら false", () => {
    expect(isThumbnailValueTooLong("51.8")).toBe(false); // 3 桁
    expect(isThumbnailValueTooLong("2,309")).toBe(false); // 4 桁
  });

  it("桁数が上限超なら true", () => {
    expect(isThumbnailValueTooLong("11,673,554")).toBe(true); // 8 桁
    expect(isThumbnailValueTooLong("1.15328")).toBe(true); // 6 桁
  });

  it("空・未定義は true (数値型に使えない)", () => {
    expect(isThumbnailValueTooLong(undefined)).toBe(true);
    expect(isThumbnailValueTooLong(null)).toBe(true);
    expect(isThumbnailValueTooLong("")).toBe(true);
  });

  it("上限桁数の境界 (4桁 OK / 5桁 NG)", () => {
    expect(MAX_NUMBER_VARIANT_DIGITS).toBe(4);
    expect(isThumbnailValueTooLong("9999")).toBe(false); // 4 桁
    expect(isThumbnailValueTooLong("10000")).toBe(true); // 5 桁
  });
});
