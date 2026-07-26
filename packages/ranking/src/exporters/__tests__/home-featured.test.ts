import { describe, expect, it } from "vitest";

import {
  bakeHomeFeaturedItem,
  deriveFeaturedTop,
  resolveHomeFeaturedItems,
  type HomeFeaturedValueRow,
} from "../home-featured";

import type { HomeFeaturedRankingDefinition } from "@stats47/data-configs";
import type { RankingItem } from "../../types/ranking-item";

function row(
  rank: number | null,
  areaName: string,
  value: number | null,
  areaCode = "01000",
): HomeFeaturedValueRow {
  return { areaCode, areaName, value, rank };
}

const DEFINITION: HomeFeaturedRankingDefinition = {
  rankingKey: "test-key",
  order: 1,
  hook: "テスト用のフックです？",
};

function itemFixture(overrides: Partial<RankingItem> = {}): RankingItem {
  return {
    rankingKey: "test-key",
    areaType: "prefecture",
    rankingName: "テスト指標",
    title: "テスト指標",
    unit: "件",
    isActive: true,
    isFeatured: false,
    featuredOrder: 0,
    dataSourceId: "estat",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("deriveFeaturedTop", () => {
  it("1回のvaluesから実rank付き1位をja-JP形式で返す", () => {
    expect(
      deriveFeaturedTop([
        row(2, "北海道", 1200000),
        row(1, "東京都", 3400000),
        row(3, "大阪府", 900000),
      ]),
    ).toEqual({ rank: 1, areaName: "東京都", value: "3,400,000" });
  });

  it("valueまたはrankがnullの行を除外する", () => {
    expect(
      deriveFeaturedTop([
        row(1, "調査対象外", null),
        row(null, "順位なし", 50),
        row(2, "大阪府", 80),
      ])?.areaName,
    ).toBe("大阪府");
  });

  it("有効な行がなければnullを返す", () => {
    expect(deriveFeaturedTop([row(1, "東京都", null)])).toBeNull();
  });
});

describe("bakeHomeFeaturedItem", () => {
  const values = [
    row(1, "東京都", 100, "13000"),
    row(2, "大阪府", 50, "27000"),
  ];

  it("1位・地図・hookだけを焼き込む", () => {
    const baked = bakeHomeFeaturedItem({
      item: itemFixture(),
      definition: DEFINITION,
      values,
      generateSvg: () => "<svg>ok</svg>",
    });
    expect(baked.featuredTop?.value).toBe("100");
    expect(baked.tileMapSvg).toBe("<svg>ok</svg>");
    expect(baked.homeFeatured).toEqual({
      order: 1,
      hook: DEFINITION.hook,
    });
    expect(baked).not.toHaveProperty("featuredBottom");
    expect(baked).not.toHaveProperty("featuredTopThree");
  });

  it("SVG生成にvalue=nullの行を渡さない", () => {
    let received: { areaCode: string; value: number }[] = [];
    bakeHomeFeaturedItem({
      item: itemFixture(),
      definition: DEFINITION,
      values: [...values, row(3, "調査対象外", null, "47000")],
      generateSvg: (rows) => {
        received = rows;
        return "<svg/>";
      },
    });
    expect(received).toHaveLength(2);
  });

  it("地図生成が失敗しても1位とhookを保持する", () => {
    const baked = bakeHomeFeaturedItem({
      item: itemFixture(),
      definition: DEFINITION,
      values,
      generateSvg: () => {
        throw new Error("svg failed");
      },
    });
    expect(baked.tileMapSvg).toBeNull();
    expect(baked.featuredTop?.areaName).toBe("東京都");
    expect(baked.homeFeatured?.hook).toBe(DEFINITION.hook);
  });
});

describe("resolveHomeFeaturedItems", () => {
  it("定義order順に解決し、非prefecture・inactive・不在をskipする", () => {
    const items: RankingItem[] = [
      itemFixture({ rankingKey: "b-key" }),
      itemFixture({ rankingKey: "a-key" }),
      itemFixture({ rankingKey: "inactive-key", isActive: false }),
      itemFixture({ rankingKey: "city-key", areaType: "city" }),
    ];
    const definitions: HomeFeaturedRankingDefinition[] = [
      { rankingKey: "a-key", order: 1, hook: "Aの有効なフックです？" },
      { rankingKey: "b-key", order: 2, hook: "Bの有効なフックです？" },
      { rankingKey: "inactive-key", order: 3, hook: "無効なフックです？" },
      { rankingKey: "city-key", order: 4, hook: "市の有効なフックです？" },
      { rankingKey: "missing-key", order: 5, hook: "不在のフックです？" },
    ];
    const { resolved, missingKeys } = resolveHomeFeaturedItems(items, definitions);
    expect(resolved.map((entry) => entry.item.rankingKey)).toEqual([
      "a-key",
      "b-key",
    ]);
    expect(missingKeys).toEqual([
      "inactive-key",
      "city-key",
      "missing-key",
    ]);
  });
});
