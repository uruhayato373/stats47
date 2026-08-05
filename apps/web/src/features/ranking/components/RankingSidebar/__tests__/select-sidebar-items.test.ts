import { describe, expect, it } from "vitest";

import {
  MAX_SIDEBAR_ITEMS,
  selectSidebarItems,
  type SidebarRankingItem,
} from "../select-sidebar-items";

/**
 * 2026-08-05 まで、このテストは selectSidebarItems のロジックをテスト内へ複製していた。
 * 複製版は group 代表選別と normalizationBasis 除外を持たず、実装と乖離したまま
 * 常に緑になっていた。ここでは実関数だけを検証する。
 */

const makeItem = (
  key: string,
  overrides: Partial<SidebarRankingItem> = {},
): SidebarRankingItem => ({
  rankingKey: key,
  areaType: "prefecture",
  title: "テスト",
  ...overrides,
});

describe("selectSidebarItems", () => {
  it("現在のランキングを除外する", () => {
    const items = [makeItem("a"), makeItem("b"), makeItem("c")];
    const result = selectSidebarItems(items, "b", "prefecture", 10);
    expect(result.map((i) => i.rankingKey)).not.toContain("b");
  });

  it("max 件数で切り詰める", () => {
    const items = Array.from({ length: 20 }, (_, i) => makeItem(`item-${i}`));
    const result = selectSidebarItems(items, "item-0", "prefecture", 7);
    expect(result).toHaveLength(7);
  });

  it("既定の上限は Client の展開表示件数と同じ 20 件", () => {
    const items = Array.from({ length: 137 }, (_, i) => makeItem(`item-${i}`));
    const result = selectSidebarItems(items, "item-0", "prefecture");
    expect(MAX_SIDEBAR_ITEMS).toBe(20);
    expect(result).toHaveLength(MAX_SIDEBAR_ITEMS);
  });

  it("同じ入力で同じ順序を返す（安定ソート）", () => {
    const items = [makeItem("x"), makeItem("y"), makeItem("z"), makeItem("w")];
    const result1 = selectSidebarItems(items, "x", "prefecture", 10);
    const result2 = selectSidebarItems(items, "x", "prefecture", 10);
    expect(result1.map((i) => i.rankingKey)).toEqual(
      result2.map((i) => i.rankingKey),
    );
  });

  it("同タイトルのアイテムを優先する", () => {
    const items = [
      makeItem("current", { title: "人口" }),
      makeItem("same-title", { title: "人口" }),
      makeItem("other", { title: "経済" }),
    ];
    const result = selectSidebarItems(items, "current", "prefecture", 10);
    expect(result[0].rankingKey).toBe("same-title");
  });

  it("空配列でも安全に動作する", () => {
    expect(selectSidebarItems([], "any", "prefecture", 10)).toEqual([]);
  });

  // ここから下は複製版テストに存在せず、実装だけが持っていた挙動

  it("現在ページと同じ group のアイテムを除外する（RelatedGroupCard と重複させない）", () => {
    const items = [
      makeItem("pop-total", { groupKey: "pop-total" }),
      makeItem("pop-total-male", { groupKey: "pop-total" }),
      makeItem("other", { groupKey: null }),
    ];
    const result = selectSidebarItems(items, "pop-total", "prefecture", 10);
    expect(result.map((i) => i.rankingKey)).toEqual(["other"]);
  });

  it("group からは代表 (rankingKey === groupKey) を 1 件だけ残す", () => {
    const items = [
      makeItem("current"),
      makeItem("income-per-capita", {
        groupKey: "income",
        normalizationBasis: "per_capita",
      }),
      makeItem("income", { groupKey: "income" }),
    ];
    const result = selectSidebarItems(items, "current", "prefecture", 10);
    expect(result.map((i) => i.rankingKey)).toEqual(["income"]);
  });

  it("代表が居ない group は丸ごと落とす（総数は別カテゴリにある）", () => {
    const items = [
      makeItem("current"),
      makeItem("income-per-capita", {
        groupKey: "income",
        normalizationBasis: "per_capita",
      }),
    ];
    const result = selectSidebarItems(items, "current", "prefecture", 10);
    expect(result).toEqual([]);
  });
});
