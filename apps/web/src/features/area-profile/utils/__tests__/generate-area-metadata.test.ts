import { describe, expect, it } from "vitest";

import { generateAreaMetadata, generateAreaCategoryMetadata } from "../generate-area-metadata";

describe("generateAreaMetadata", () => {
  const input = {
    title: "東京都の統計データ｜47都道府県比較",
    description: "東京都の統計プロファイル。",
    areaCode: "13000",
  };

  it("title / description / canonical が正しく設定されること", () => {
    const result = generateAreaMetadata(input);

    expect(result.title).toBe(input.title);
    expect(result.description).toBe(input.description);
    expect(result.alternates?.canonical).toBe(`/areas/${input.areaCode}`);
  });

  it("openGraph.images を設定しない（opengraph-image.tsx に委ねる）", () => {
    const result = generateAreaMetadata(input);

    expect((result.openGraph as Record<string, unknown>)?.images).toBeUndefined();
    expect((result.twitter as Record<string, unknown>)?.images).toBeUndefined();
  });
});

describe("generateAreaCategoryMetadata", () => {
  const input = {
    title: "東京都の人口データ｜47都道府県ランキング比較",
    description: "東京都の人口分野の統計データ一覧。",
    areaCode: "13000",
    categoryKey: "population",
    indexable: true,
  };

  it("title / description / canonical が正しく設定されること", () => {
    const result = generateAreaCategoryMetadata(input);

    expect(result.title).toBe(input.title);
    expect(result.description).toBe(input.description);
    expect(result.alternates?.canonical).toBe(`/areas/${input.areaCode}/${input.categoryKey}`);
  });

  it("openGraph.images を設定しない（opengraph-image.tsx に委ねる）", () => {
    const result = generateAreaCategoryMetadata(input);

    expect((result.openGraph as Record<string, unknown>)?.images).toBeUndefined();
    expect((result.twitter as Record<string, unknown>)?.images).toBeUndefined();
  });

  it("indexable=true のとき robots が index, follow であること", () => {
    const result = generateAreaCategoryMetadata(input);
    expect(result.robots).toBe("index, follow");
  });

  it("indexable=false のとき robots が noindex, follow であること", () => {
    const result = generateAreaCategoryMetadata({ ...input, indexable: false });
    expect(result.robots).toBe("noindex, follow");
  });
});
