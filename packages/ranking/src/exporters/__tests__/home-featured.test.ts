import { describe, expect, it } from "vitest";

import {
  bakeHomeFeaturedItem,
  deriveHomeFeaturedValues,
  resolveHomeFeaturedItems,
  type HomeFeaturedValueRow,
} from "../home-featured";

import type { HomeFeaturedRankingDefinition } from "@stats47/data-configs";
import type { RankingItem } from "../../types/ranking-item";

/**
 * home/featured.json 派生の pure helper テスト (仕様 doc 28 §13.2)。
 * R2 を読まない・書かない fixture 検証 (export-master-snapshots.ts は実行しない)。
 */

function row(rank: number | null, areaName: string, value: number | null, areaCode = "01000"): HomeFeaturedValueRow {
  return { areaCode, areaName, value, rank };
}

const DEFINITION: HomeFeaturedRankingDefinition = {
  rankingKey: "test-key",
  order: 1,
  hook: "テスト用のフックです？",
  variant: "question",
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

describe("deriveHomeFeaturedValues", () => {
  it("1 回の values から top / bottom / top3 を生成する (ja-JP ロケール整形)", () => {
    const derived = deriveHomeFeaturedValues([
      row(2, "北海道", 1200000),
      row(1, "東京都", 3400000),
      row(3, "大阪府", 900000),
      row(47, "鳥取県", 1000),
    ]);
    expect(derived.featuredTop).toEqual({ rank: 1, areaName: "東京都", value: "3,400,000" });
    expect(derived.featuredBottom).toEqual({ rank: 47, areaName: "鳥取県", value: "1,000" });
    expect(derived.featuredTopThree.map((v) => v.areaName)).toEqual(["東京都", "北海道", "大阪府"]);
  });

  it("value / rank が null の行を除外する", () => {
    const derived = deriveHomeFeaturedValues([
      row(1, "東京都", 100),
      row(2, "調査対象外", null),
      row(null, "順位なし", 50),
      row(3, "大阪府", 80),
    ]);
    expect(derived.featuredTop?.areaName).toBe("東京都");
    expect(derived.featuredBottom?.areaName).toBe("大阪府");
    expect(derived.featuredTopThree).toHaveLength(2);
  });

  it("同順位 (tie) の実 rank を保持し 47 位と固定しない", () => {
    // 45 位タイが 2 県ある → 最下位の実 rank は 46
    const derived = deriveHomeFeaturedValues([
      row(1, "東京都", 100),
      row(45, "A県", 10),
      row(45, "B県", 10),
      row(46, "C県", 5),
    ]);
    expect(derived.featuredBottom).toEqual({ rank: 46, areaName: "C県", value: "5" });
  });

  it("3 件未満なら topThree は不足のまま返す (UI 側で control へフォールバック)", () => {
    const derived = deriveHomeFeaturedValues([row(1, "東京都", 100), row(2, "大阪府", 50)]);
    expect(derived.featuredTopThree).toHaveLength(2);
  });

  it("全行 null なら派生値なし", () => {
    const derived = deriveHomeFeaturedValues([row(1, "東京都", null)]);
    expect(derived).toEqual({ featuredTop: null, featuredBottom: null, featuredTopThree: [] });
  });
});

describe("bakeHomeFeaturedItem", () => {
  const values = [row(1, "東京都", 100, "13000"), row(2, "大阪府", 50, "27000"), row(3, "愛知県", 25, "23000")];

  it("派生値 + homeFeatured (hook/variant) + SVG を焼き込む", () => {
    const baked = bakeHomeFeaturedItem({
      item: itemFixture(),
      definition: DEFINITION,
      values,
      generateSvg: () => "<svg>ok</svg>",
    });
    expect(baked.featuredTop?.value).toBe("100");
    expect(baked.featuredBottom?.rank).toBe(3);
    expect(baked.featuredTopThree).toHaveLength(3);
    expect(baked.tileMapSvg).toBe("<svg>ok</svg>");
    expect(baked.homeFeatured).toEqual({ order: 1, hook: DEFINITION.hook, variant: "question" });
  });

  it("SVG 生成に value=null の行を渡さない", () => {
    let received: { areaCode: string; value: number }[] = [];
    bakeHomeFeaturedItem({
      item: itemFixture(),
      definition: DEFINITION,
      values: [...values, row(4, "調査対象外", null, "47000")],
      generateSvg: (rows) => {
        received = rows;
        return "<svg/>";
      },
    });
    expect(received).toHaveLength(3);
    expect(received.every((r) => r.value !== null)).toBe(true);
  });

  it("map 生成が throw しても他の派生値を保持する (tileMapSvg=null)", () => {
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
    expect(baked.featuredTopThree).toHaveLength(3);
    expect(baked.homeFeatured?.variant).toBe("question");
  });

  it("snapshot に画像 URL や credential らしきフィールドを追加しない", () => {
    const baked = bakeHomeFeaturedItem({
      item: itemFixture(),
      definition: DEFINITION,
      values,
      generateSvg: () => "<svg/>",
    });
    const json = JSON.stringify(baked);
    expect(json).not.toMatch(/https?:\/\/[^"]*\.(png|webp|jpe?g)/);
    expect(json).not.toMatch(/secret|access_key|token/i);
    // 追加されるのは派生フィールドのみ
    const addedKeys = Object.keys(baked).filter((k) => !(k in itemFixture()));
    expect(addedKeys.sort()).toEqual([
      "featuredBottom",
      "featuredTop",
      "featuredTopThree",
      "homeFeatured",
      "tileMapSvg",
    ]);
  });
});

describe("resolveHomeFeaturedItems (旧 snapshot 互換・再検証)", () => {
  it("定義 order 順に解決し、非 prefecture / inactive / 不在を skip する", () => {
    const items: RankingItem[] = [
      itemFixture({ rankingKey: "b-key" }),
      itemFixture({ rankingKey: "a-key" }),
      itemFixture({ rankingKey: "inactive-key", isActive: false }),
      itemFixture({ rankingKey: "city-key", areaType: "city" }),
    ];
    const definitions: HomeFeaturedRankingDefinition[] = [
      { rankingKey: "a-key", order: 1, hook: "A のフックです？", variant: "question" },
      { rankingKey: "b-key", order: 2, hook: "B のフックです？", variant: "comparison" },
      { rankingKey: "inactive-key", order: 3, hook: "無効のフックです？", variant: "question" },
      { rankingKey: "city-key", order: 4, hook: "市のフックです？", variant: "question" },
      { rankingKey: "missing-key", order: 5, hook: "不在のフックです？", variant: "question" },
    ];
    const { resolved, missingKeys } = resolveHomeFeaturedItems(items, definitions);
    expect(resolved.map((r) => r.item.rankingKey)).toEqual(["a-key", "b-key"]);
    expect(missingKeys).toEqual(["inactive-key", "city-key", "missing-key"]);
  });
});
