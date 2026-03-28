import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  getRequiredBaseUrl: vi.fn(() => "https://stats47.jp"),
}));

import {
  generateAreaProfileBreadcrumbStructuredData,
  generateAreaProfileStructuredData,
} from "../generate-structured-data";

import type { AreaProfileData } from "@stats47/area-profile";

const mockProfile: AreaProfileData = {
  areaCode: "13000",
  areaName: "東京都",
  strengths: [
    { indicator: "総人口", value: 14000000, unit: "人", rank: 1, rankingKey: "total-population", year: "2023" },
    { indicator: "県内総生産", value: 1000000, unit: "億円", rank: 1, rankingKey: "gdp", year: "2022" },
  ],
  weaknesses: [
    { indicator: "森林面積割合", value: 36, unit: "%", rank: 45, rankingKey: "forest-area-ratio", year: "2023" },
  ],
};

describe("generateAreaProfileBreadcrumbStructuredData", () => {
  it("BreadcrumbList 形式の構造化データを生成する", () => {
    const result = generateAreaProfileBreadcrumbStructuredData({ profile: mockProfile });

    expect(result).toMatchObject({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
    });
    const items = (result as { itemListElement: unknown[] }).itemListElement;
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({ position: 1, name: "ホーム", item: "https://stats47.jp" });
    expect(items[1]).toMatchObject({ position: 2, name: "都道府県一覧" });
    expect(items[2]).toMatchObject({ position: 3, name: "東京都の特徴" });
  });
});

describe("generateAreaProfileStructuredData", () => {
  it("AdministrativeArea 形式の構造化データを生成する", () => {
    const result = generateAreaProfileStructuredData({ profile: mockProfile }) as Record<string, unknown>;

    expect(result["@type"]).toBe("AdministrativeArea");
    expect(result.name).toBe("東京都");
    expect(result.url).toBe("https://stats47.jp/areas/13000");
    expect(result).toHaveProperty("additionalProperty");
  });

  it("additionalProperty に strengths と weaknesses を含む", () => {
    const result = generateAreaProfileStructuredData({ profile: mockProfile }) as Record<string, unknown>;
    const props = result.additionalProperty as Array<Record<string, unknown>>;

    expect(props).toHaveLength(3);
    expect(props[0]).toMatchObject({ "@type": "PropertyValue", name: "総人口" });
    expect(props[2]).toMatchObject({ "@type": "PropertyValue", name: "森林面積割合" });
  });

  it("strengths と weaknesses が空の場合に additionalProperty を含まない", () => {
    const emptyProfile = { ...mockProfile, strengths: [], weaknesses: [] };
    const result = generateAreaProfileStructuredData({ profile: emptyProfile }) as Record<string, unknown>;

    expect(result).not.toHaveProperty("additionalProperty");
  });
});
