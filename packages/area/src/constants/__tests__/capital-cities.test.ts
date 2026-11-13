import { describe, expect, it } from "vitest";
import { PREFECTURE_CAPITAL_CITY_NAMES, PREFECTURE_CAPITAL_CITIES } from "../capital-cities";
import { fetchCities } from "../../repositories/fetch-cities";
import { fetchPrefectures } from "../../repositories/fetch-prefectures";

describe("PREFECTURE_CAPITAL_CITY_NAMES", () => {
  it("原地域コードが一意で、福岡市を北九州市と取り違えない", () => {
    expect(new Set(PREFECTURE_CAPITAL_CITIES.map(area => area.estatAreaCode)).size).toBe(47);
    expect(PREFECTURE_CAPITAL_CITIES.find(area => area.prefectureCode === '40000')).toMatchObject({ name: '福岡市', estatAreaCode: '40004' });
    expect(PREFECTURE_CAPITAL_CITIES.some(area => area.estatAreaCode === '40003')).toBe(false);
  });
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
