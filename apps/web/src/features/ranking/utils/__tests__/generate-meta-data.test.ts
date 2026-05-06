import { describe, expect, it } from "vitest";

import { generateRankingPageMetaData } from "../generate-meta-data";

import type { RankingItem } from "@stats47/ranking";

const mockItem: Partial<RankingItem> = {
    rankingKey: "annual-sales-amount-per-employee",
    title: "商業年間商品販売額",
    seoTitle: "商業年間商品販売額ランキング",
    seoDescription: "都道府県別ランキング（商業年間商品販売額）",
    unit: "万円",
    latestYear: { yearCode: "2021", yearName: "2021年度" },
    availableYears: [{ yearCode: "2021", yearName: "2021年度" }],
};

describe("generateRankingPageMetaData", () => {
    it("rankingItemがnullの場合、エラー用のメタデータを返すこと", () => {
        const result = generateRankingPageMetaData({
            rankingItem: null as unknown as RankingItem,
            areaType: "prefecture",
        });
        expect(result.title).toBe("ランキングが見つかりません");
        expect(result.description).toBe("指定されたランキングは存在しません");
    });

    it("年度がある場合、タイトルは年度プレフィックスなしで設定されること", () => {
        const result = generateRankingPageMetaData({
            rankingItem: mockItem as RankingItem,
            areaType: "prefecture",
        });

        expect(result.title).toContain("ランキング");
        expect(result.title).not.toMatch(/\d{4}年度/);
        expect(result.description).toContain("都道府県別ランキング");
    });

    it("OGPタグが正しく設定されていること", () => {
        const result = generateRankingPageMetaData({
            rankingItem: mockItem as RankingItem,
            areaType: "prefecture",
        });

        expect(result.openGraph?.title).toBe(result.title);
        expect((result.openGraph as Record<string, unknown>)?.type).toBe("article");
        expect((result.twitter as Record<string, unknown>)?.card).toBe("summary_large_image");
    });

    it("canonical URLが正しく設定されていること", () => {
        const result = generateRankingPageMetaData({
            rankingItem: mockItem as RankingItem,
            areaType: "prefecture",
        });

        expect(result.alternates?.canonical).toBe("/ranking/annual-sales-amount-per-employee");
    });
});
