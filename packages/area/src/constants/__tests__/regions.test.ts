import { describe, expect, it } from "vitest";
import { PREFECTURE_SHORT_TO_REGION_MAP, PREFECTURE_TO_REGION_MAP, REGIONS } from "../regions";
import { fetchPrefectures } from "../../repositories/fetch-prefectures";

describe("REGIONS", () => {
    it("地方数が7であること", () => {
        expect(REGIONS.length).toBe(7);
    });

    it("全47都道府県がちょうど1回ずつ含まれること", () => {
        const allPrefCodes = REGIONS.flatMap((region) => region.prefectures);

        expect(allPrefCodes.length).toBe(47);
        expect(new Set(allPrefCodes).size).toBe(47);

        const actualPrefCodes = fetchPrefectures().map((p) => p.prefCode);
        const sortedActual = [...actualPrefCodes].sort();
        const sortedRegions = [...allPrefCodes].sort();
        expect(sortedRegions).toEqual(sortedActual);
    });

    it("各地方に少なくとも1つの都道府県が含まれること", () => {
        REGIONS.forEach((region) => {
            expect(region.prefectures.length).toBeGreaterThan(0);
        });
    });

    it("各地方に regionCode・regionName・color があること", () => {
        REGIONS.forEach((region) => {
            expect(region.regionCode).toBeTruthy();
            expect(region.regionName).toBeTruthy();
            expect(region.color).toBeTruthy();
            expect(typeof region.regionCode).toBe("string");
            expect(typeof region.regionName).toBe("string");
            expect(typeof region.color).toBe("string");
            expect(region.color).toMatch(/^#[0-9a-fA-F]{6}$/);
        });
    });

    it("北海道・東北が統合されていること", () => {
        const hk = REGIONS.find((r) => r.regionCode === "hokkaido_tohoku");
        expect(hk).toBeDefined();
        expect(hk?.prefectures).toContain("01000"); // 北海道
        expect(hk?.prefectures).toContain("02000"); // 青森
        expect(hk?.prefectures).toContain("07000"); // 福島
        expect(hk?.prefectures.length).toBe(7);
    });

    it("regionName に '地方' 接尾辞が含まれないこと", () => {
        REGIONS.forEach((region) => {
            expect(region.regionName).not.toMatch(/地方$/);
        });
    });
});

describe("PREFECTURE_TO_REGION_MAP", () => {
    it("5桁キーで正しい regionCode を返すこと", () => {
        expect(PREFECTURE_TO_REGION_MAP["01000"]).toBe("hokkaido_tohoku");
        expect(PREFECTURE_TO_REGION_MAP["07000"]).toBe("hokkaido_tohoku");
        expect(PREFECTURE_TO_REGION_MAP["13000"]).toBe("kanto");
        expect(PREFECTURE_TO_REGION_MAP["27000"]).toBe("kinki");
        expect(PREFECTURE_TO_REGION_MAP["47000"]).toBe("kyushu");
    });

    it("全47都道府県の5桁キーが登録されていること", () => {
        const prefCodes = fetchPrefectures().map((p) => p.prefCode);
        prefCodes.forEach((prefCode) => {
            expect(PREFECTURE_TO_REGION_MAP[prefCode]).toBeTruthy();
        });
    });

    it("2桁キーが登録されていないこと（5桁統一の原則）", () => {
        expect(PREFECTURE_TO_REGION_MAP["01"]).toBeUndefined();
        expect(PREFECTURE_TO_REGION_MAP["13"]).toBeUndefined();
        expect(PREFECTURE_TO_REGION_MAP["27"]).toBeUndefined();
        expect(PREFECTURE_TO_REGION_MAP["47"]).toBeUndefined();
    });

    it("マップのキー数が47であること", () => {
        const keys = Object.keys(PREFECTURE_TO_REGION_MAP);
        expect(keys.length).toBe(47);
    });
});

describe("PREFECTURE_SHORT_TO_REGION_MAP", () => {
    it("2桁キーで正しい regionCode を返すこと", () => {
        expect(PREFECTURE_SHORT_TO_REGION_MAP["01"]).toBe("hokkaido_tohoku");
        expect(PREFECTURE_SHORT_TO_REGION_MAP["07"]).toBe("hokkaido_tohoku");
        expect(PREFECTURE_SHORT_TO_REGION_MAP["13"]).toBe("kanto");
        expect(PREFECTURE_SHORT_TO_REGION_MAP["27"]).toBe("kinki");
        expect(PREFECTURE_SHORT_TO_REGION_MAP["47"]).toBe("kyushu");
    });

    it("全47都道府県の2桁キーが登録されていること", () => {
        const prefCodes = fetchPrefectures().map((p) => p.prefCode.substring(0, 2));
        prefCodes.forEach((shortCode) => {
            expect(PREFECTURE_SHORT_TO_REGION_MAP[shortCode]).toBeTruthy();
        });
    });

    it("マップのキー数が47であること", () => {
        const keys = Object.keys(PREFECTURE_SHORT_TO_REGION_MAP);
        expect(keys.length).toBe(47);
    });
});
