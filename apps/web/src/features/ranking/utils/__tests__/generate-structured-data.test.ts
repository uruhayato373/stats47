import { describe, expect, it, vi } from "vitest";

import { generateRankingPageStructuredData, generateRankingTopPageStructuredData } from "../generate-structured-data";

import type { RankingItem, RankingValue } from "@stats47/ranking";

vi.mock("@/lib/env", () => ({
    getRequiredBaseUrl: () => "https://test.stats47.jp",
}));

/** JSON-LD 構造化データのプロパティアクセス用 */
type JsonLd = Record<string, unknown>;

const mockItem: Partial<RankingItem> = {
    rankingKey: "annual-sales-amount-per-employee",
    title: "商業年間商品販売額",
    unit: "万円",
    latestYear: { yearCode: "2021", yearName: "2021年度" },
    availableYears: [{ yearCode: "2021", yearName: "2021年度" }],
    source: { name: "社会・人口統計体系", url: "https://www.stat.go.jp/data/ssds/index.htm" },
};

const mockValues: Partial<RankingValue>[] = [
    { rank: 1, areaCode: "13000", areaName: "東京都", yearCode: "2021100000", value: 11829.8 },
    { rank: 2, areaCode: "27000", areaName: "大阪府", yearCode: "2021100000", value: 8500.0 },
    { rank: 3, areaCode: "23000", areaName: "愛知県", yearCode: "2021100000", value: 7200.0 },
    { rank: 4, areaCode: "14000", areaName: "神奈川県", yearCode: "2021100000", value: 6800.0 },
];

describe("generateRankingPageStructuredData", () => {
    it("Dataset形式の構造化データを生成すること", () => {
        const result = generateRankingPageStructuredData({
            rankingItem: mockItem as RankingItem,
            rankingValues: mockValues as RankingValue[],
            selectedYear: "2021",
        }) as JsonLd;

        expect(result["@context"]).toBe("https://schema.org");
        expect(result["@type"]).toBe("Dataset");
        expect(result.name).toBe("商業年間商品販売額 2021年度");
        expect(result.url).toBe("https://test.stats47.jp/ranking/annual-sales-amount-per-employee");
    });

    it("説明文（buildDescription）が期待通りに生成されること", () => {
        const result = generateRankingPageStructuredData({
            rankingItem: mockItem as RankingItem,
            rankingValues: mockValues as RankingValue[],
            selectedYear: "2021",
        }) as JsonLd;

        const desc = result.description as string;
        expect(desc).toContain("商業年間商品販売額の2021年度の都道府県別ランキング");
        expect(desc).toContain("1位は東京都（11829.8万円）");
        expect(desc).toContain("上位3位は東京都、大阪府、愛知県です");
    });

    it("データが空の場合の説明文が正しく生成されること", () => {
        const result = generateRankingPageStructuredData({
            rankingItem: mockItem as RankingItem,
            rankingValues: [],
            selectedYear: "2021",
        }) as JsonLd;

        const desc = result.description as string;
        expect(desc).toContain("日本の都道府県別商業年間商品販売額のランキングデータ");
        expect(desc).toContain("社会・人口統計体系から取得した政府統計データを基に");
        expect(desc).toContain("2021年度のデータを使用しています");
    });

    it("単位やソース情報が含まれていること", () => {
        const result = generateRankingPageStructuredData({
            rankingItem: mockItem as RankingItem,
            rankingValues: mockValues as RankingValue[],
            selectedYear: "2015",
        }) as JsonLd;

        expect((result.variableMeasured as JsonLd).unitText).toBe("万円");
        expect((result.isBasedOn as JsonLd).name).toBe("社会・人口統計体系");
    });

    it("年度が指定されていない場合、タイトルとURLが適切に設定されること", () => {
        const result = generateRankingPageStructuredData({
            rankingItem: mockItem as RankingItem,
            rankingValues: mockValues as RankingValue[],
            selectedYear: undefined,
        }) as JsonLd;

        expect(result.name).toBe("商業年間商品販売額");
        expect(result.url).toBe("https://test.stats47.jp/ranking/annual-sales-amount-per-employee");
        expect(result.description).toContain("商業年間商品販売額の都道府県別ランキング");
    });
});

describe("generateRankingTopPageStructuredData", () => {
    const featuredItems = [
        { rankingKey: "total-population", title: "総人口" },
        { rankingKey: "gdp", title: "県内総生産" },
        { rankingKey: "crime-rate", title: "犯罪発生率" },
    ];

    it("ItemList形式の構造化データを生成すること", () => {
        const result = generateRankingTopPageStructuredData({ featuredItems }) as JsonLd;

        expect(result["@context"]).toBe("https://schema.org");
        expect(result["@type"]).toBe("ItemList");
        expect(result.name).toBe("注目・おすすめのランキング一覧");
        expect(result.url).toBe("https://test.stats47.jp/ranking");
    });

    it("itemListElementが正しい順序とURLで生成されること", () => {
        const result = generateRankingTopPageStructuredData({ featuredItems }) as JsonLd;
        const items = result.itemListElement as JsonLd[];

        expect(items).toHaveLength(3);
        expect(items[0]).toEqual({
            "@type": "ListItem",
            position: 1,
            name: "総人口",
            url: "https://test.stats47.jp/ranking/total-population",
        });
        expect(items[1].position).toBe(2);
        expect(items[2].position).toBe(3);
        expect(items[2].name).toBe("犯罪発生率");
    });

    it("空配列の場合、itemListElementも空であること", () => {
        const result = generateRankingTopPageStructuredData({ featuredItems: [] }) as JsonLd;

        expect(result["@type"]).toBe("ItemList");
        expect(result.itemListElement as JsonLd[]).toHaveLength(0);
    });
});
