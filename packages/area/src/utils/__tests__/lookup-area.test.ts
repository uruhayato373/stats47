import { describe, expect, it } from "vitest";
import { lookupArea } from "../lookup-area";

describe("lookupArea", () => {
    it("全国 (00000) を検索できること", () => {
        const result = lookupArea("00000");
        expect(result).toEqual({
            areaCode: "00000",
            areaName: "全国",
            areaType: "national",
        });
    });

    it("都道府県コード (5桁) を検索できること", () => {
        const result = lookupArea("13000"); // 東京都
        expect(result).toEqual({
            areaCode: "13000",
            areaName: "東京都",
            areaType: "prefecture",
        });
    });

    it("都道府県コード (2桁) は null を返すこと", () => {
        const result = lookupArea("13");
        expect(result).toBeNull();
    });

    it("市区町村コード (5桁) を検索できること", () => {
        const result = lookupArea("13201"); // 八王子市
        expect(result).toEqual({
            areaCode: "13201",
            areaName: "東京都 八王子市",
            areaType: "city",
            parentAreaCode: "13000",
        });
    });

    it("存在しないコードの場合は null を返すこと", () => {
        expect(lookupArea("99000")).toBeNull(); // 000で終わるが存在しない
        expect(lookupArea("99999")).toBeNull();
        expect(lookupArea("99")).toBeNull();
        expect(lookupArea("")).toBeNull();
    });

    it("3桁コードは null を返すこと", () => {
        expect(lookupArea("130")).toBeNull();
        expect(lookupArea("010")).toBeNull();
    });

    it("4桁コードは null を返すこと", () => {
        expect(lookupArea("1300")).toBeNull();
        expect(lookupArea("0100")).toBeNull();
    });

    it("市区町村の parentAreaCode が city.prefCode と一致すること", () => {
        const result = lookupArea("13201"); // 八王子市
        expect(result?.areaType).toBe("city");
        if (!result || result.areaType !== "city") throw new Error("Expected city");
        expect(result.parentAreaCode).toBe("13000");

        // 別の例も確認
        const result2 = lookupArea("27202"); // 岸和田市
        expect(result2?.areaType).toBe("city");
        if (!result2 || result2.areaType !== "city") throw new Error("Expected city");
        expect(result2.parentAreaCode).toBe("27000");
    });
});
