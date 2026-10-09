import { describe, expect, it } from "vitest";

import { pickCityLatestYear } from "../build-city-profile-rows";

describe("市区町村プロフィールの年", () => {
  const within = (from: number, to: number) => (yearCode: string) => Number(yearCode) >= from && Number(yearCode) <= to;

  it("県だけ新しい年がある指標でも、市区町村の値がある最新の年を使う (指標ごと落とさない)", () => {
    const rows = [
      { yearCode: "2020", value: 1 },
      { yearCode: "2021", value: 2 },
    ];
    // years は県の値で 2015〜2023 年まである
    expect(pickCityLatestYear(rows, within(2015, 2023))).toBe("2021");
  });

  it("値の無い行と years の外の年は選ばない", () => {
    const rows = [
      { yearCode: "2021", value: 1 },
      { yearCode: "2022", value: null },
      { yearCode: "2024", value: 3 },
    ];
    expect(pickCityLatestYear(rows, within(2015, 2023))).toBe("2021");
    expect(pickCityLatestYear([{ yearCode: "2010", value: 1 }], within(2015, 2023))).toBeNull();
  });
});
