import { describe, expect, it } from "vitest";
import { PREFECTURE_CAPITAL_CITY_NAMES } from "../capital-cities";
import { fetchCities } from "../../repositories/fetch-cities";
import { fetchPrefectures } from "../../repositories/fetch-prefectures";

describe("PREFECTURE_CAPITAL_CITY_NAMES", () => {
  it("47 都道府県のすべてに県庁所在市を持つ", () => {
    const prefCodes = fetchPrefectures().map((p) => p.prefCode).sort();
    expect(Object.keys(PREFECTURE_CAPITAL_CITY_NAMES).sort()).toEqual(prefCodes);
  });

  it("東京都区部以外は、その県の市区町村マスタにある市の名前である", () => {
    const cityNames = new Set(fetchCities().map((c) => c.cityName));
    const prefNames = new Map(fetchPrefectures().map((p) => [p.prefCode, p.prefName]));
    const missing = Object.entries(PREFECTURE_CAPITAL_CITY_NAMES)
      .filter(([code]) => code !== "13000")
      .filter(([code, city]) => !cityNames.has(`${prefNames.get(code)} ${city}`));
    expect(missing).toEqual([]);
  });
});
