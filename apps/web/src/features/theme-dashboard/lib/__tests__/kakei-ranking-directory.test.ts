// @vitest-environment node
import { METRICS_REGISTRY } from "@stats47/data-configs/registry";
import { describe, expect, it } from "vitest";

import { KAKEI_RANKING_DIRECTORY } from "../kakei-ranking-directory.generated";

describe("KAKEI_RANKING_DIRECTORY", () => {
  it("有効な家計調査の指標をすべて 1 回ずつ載せる", () => {
    const expected = Object.values(METRICS_REGISTRY)
      .filter((metric) => metric.isActive !== false && metric.source.kind === "kakei-chousa")
      .map((metric) => metric.key)
      .sort();

    const listed = KAKEI_RANKING_DIRECTORY.flatMap((group) => group.links.map((link) => link.rankingKey)).sort();

    expect(listed).toEqual(expected);
  });
});
