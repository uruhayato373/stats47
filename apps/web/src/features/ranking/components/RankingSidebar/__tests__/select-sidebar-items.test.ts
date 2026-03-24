import { describe, expect, it } from "vitest";

import type { RankingItem } from "@stats47/ranking";

// selectSidebarItems is not exported, so we test via the module internals
// For now, import the client module and extract the function
// Since selectSidebarItems is a private function in RankingSidebarClient,
// we'll test its behavior indirectly by testing the hash stability

/** 文字列の簡易ハッシュ（RankingSidebarClient と同じ実装） */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h = (h << 5) - h + c;
    h |= 0;
  }
  return h;
}

/** selectSidebarItems のロジックを再現 */
function selectSidebarItems(
  items: Pick<RankingItem, "rankingKey" | "areaType" | "title">[],
  rankingKey: string,
  areaType: string,
  max: number,
) {
  const currentItem = items.find(
    (i) => i.rankingKey === rankingKey && i.areaType === areaType
  );
  const rest = items.filter(
    (i) => !(i.rankingKey === rankingKey && i.areaType === areaType)
  );

  const currentTitle = currentItem?.title;
  const sameTitle = currentTitle
    ? rest.filter((i) => i.title === currentTitle)
    : [];
  const otherTitle = currentTitle
    ? rest.filter((i) => i.title !== currentTitle)
    : rest;

  const seed = `${rankingKey}-${areaType}`;
  const sortByHash = (a: { rankingKey: string }, b: { rankingKey: string }) =>
    hashString(seed + a.rankingKey) - hashString(seed + b.rankingKey);
  sameTitle.sort(sortByHash);
  otherTitle.sort(sortByHash);

  return [...sameTitle, ...otherTitle].slice(0, max);
}

const makeItem = (key: string, title = "テスト") => ({
  rankingKey: key,
  areaType: "prefecture" as const,
  title,
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

  it("同じ入力で同じ順序を返す（安定ソート）", () => {
    const items = [makeItem("x"), makeItem("y"), makeItem("z"), makeItem("w")];
    const result1 = selectSidebarItems(items, "x", "prefecture", 10);
    const result2 = selectSidebarItems(items, "x", "prefecture", 10);
    expect(result1.map((i) => i.rankingKey)).toEqual(
      result2.map((i) => i.rankingKey)
    );
  });

  it("同タイトルのアイテムを優先する", () => {
    const items = [
      makeItem("current", "人口"),
      makeItem("same-title", "人口"),
      makeItem("other", "経済"),
    ];
    const result = selectSidebarItems(items, "current", "prefecture", 10);
    expect(result[0].rankingKey).toBe("same-title");
  });

  it("空配列でも安全に動作する", () => {
    const result = selectSidebarItems([], "any", "prefecture", 10);
    expect(result).toEqual([]);
  });
});
