import { describe, expect, it } from "vitest";
import { prepareHierarchicalRankings } from "../prepare-hierarchical-rankings";

describe("prepareHierarchicalRankings", () => {
  it("階層構造が正しく変換される", async () => {
    const parents = [
      { id: "p1", name: "Parent 1", children: [{ id: "c1" }, { id: "c2" }] },
      { id: "p2", name: "Parent 2", children: [{ id: "c3" }] },
    ];

    const getChildren = (p: typeof parents[0]) => p.children;
    const getRankingKey = async (childId: string) => {
      if (childId === "c1") return "rk1";
      if (childId === "c3") return "rk3";
      return null; // c2 はキーなし
    };

    const result = await prepareHierarchicalRankings(parents, getChildren, getRankingKey);

    expect(result).toHaveLength(2);
    expect(result[0].parent.id).toBe("p1");
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children[0].rankingKey).toBe("rk1");
    expect(result[1].parent.id).toBe("p2");
    expect(result[1].children).toHaveLength(1);
    expect(result[1].children[0].rankingKey).toBe("rk3");
  });

  it("子要素が空またはキーがない親は除外される", async () => {
    const parents = [
      { id: "p1", children: [{ id: "c1" }] },
      { id: "p2", children: [] },
    ];
    const getRankingKey = async () => null;

    const result = await prepareHierarchicalRankings(parents, (p) => p.children, getRankingKey);
    expect(result).toHaveLength(0);
  });
});
