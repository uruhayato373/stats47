import { describe, expect, it } from "vitest";
import { extractPrefectureCode } from "../extract-prefecture-code";

describe("extractPrefectureCode", () => {
    it("5桁の地域コードから先頭2桁を抽出できること", () => {
        expect(extractPrefectureCode("13000")).toBe("13");
        expect(extractPrefectureCode("01100")).toBe("01");
        expect(extractPrefectureCode("47201")).toBe("47");
    });

    it("2桁の都道府県コードからもそのまま抽出できること", () => {
        expect(extractPrefectureCode("13")).toBe("13");
        expect(extractPrefectureCode("01")).toBe("01");
    });

    it("3桁や4桁の場合も先頭2桁を抽出すること", () => {
        expect(extractPrefectureCode("130")).toBe("13");
        expect(extractPrefectureCode("1300")).toBe("13");
    });

    it("地域コードが2桁未満の場合はnullを返すこと", () => {
        expect(extractPrefectureCode("1")).toBeNull();
        expect(extractPrefectureCode("")).toBeNull();
    });
});
