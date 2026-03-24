import { describe, expect, it } from "vitest";
import { fetchPrefectures } from "../fetch-prefectures";

describe("fetchPrefectures", () => {
    it("47都道府県すべてを取得できること", () => {
        const prefectures = fetchPrefectures();
        expect(prefectures.length).toBe(47);
        expect(prefectures.some(p => p.prefName === "東京都")).toBe(true);
        expect(prefectures.some(p => p.prefName === "沖縄県")).toBe(true);
    });

    it("取得した配列を変更しても元のデータに影響を与えないこと (不変性)", () => {
        const prefectures1 = fetchPrefectures();
        prefectures1.pop();
        
        const prefectures2 = fetchPrefectures();
        expect(prefectures2.length).toBe(47);
    });
});
