import { describe, expect, it } from "vitest";
import { fetchCities } from "../fetch-cities";
import { CITIES } from "../../data";

describe("fetchCities", () => {
    it("市区町村一覧を取得できること", () => {
        const cities = fetchCities();
        expect(cities.length).toBe(CITIES.length);
        expect(cities[0]).toHaveProperty("cityCode");
        expect(cities[0]).toHaveProperty("cityName");
    });

    it("取得した配列を変更しても元のデータに影響を与えないこと (不変性)", () => {
        const cities1 = fetchCities();
        const originalLength = cities1.length;
        cities1.pop();
        
        const cities2 = fetchCities();
        expect(cities2.length).toBe(originalLength);
    });
});
