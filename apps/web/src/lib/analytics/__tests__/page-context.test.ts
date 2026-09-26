import { describe, it, expect } from "vitest";

import { reachedSteps } from "../components/ReadProgressTracker";
import { CONTENT_GROUPS, resolvePageContext } from "../page-context";

describe("ページ文脈 (content_group とキー)", () => {
  it.each([
    ["/", { content_group: "home" }],
    ["/ranking", { content_group: "ranking_index" }],
    ["/ranking/births", { content_group: "ranking", ranking_key: "births" }],
    ["/ranking/births?year=2020", { content_group: "ranking", ranking_key: "births" }],
    ["/themes/aging", { content_group: "theme", theme_slug: "aging" }],
    ["/areas/13000", { content_group: "area", area_code: "13000" }],
    ["/areas/13000/aging", { content_group: "area_theme", area_code: "13000", theme_slug: "aging" }],
    ["/areas/13000/cities/13101", { content_group: "city", area_code: "13101" }],
    ["/municipalities/ranking/population", { content_group: "municipality_ranking", ranking_key: "population" }],
    ["/municipalities/themes/aging", { content_group: "municipality_theme", theme_slug: "aging" }],
    ["/blog/some-article", { content_group: "blog" }],
    ["/category/population", { content_group: "category", category_key: "population" }],
    ["/geo/station-access/13000/overlap", { content_group: "geo" }],
    ["/products/pack-1", { content_group: "product" }],
    ["/unknown/path", { content_group: "other" }],
  ])("%s", (path, expected) => {
    expect(resolvePageContext(path)).toEqual(expected);
  });

  it("content_group は固定語彙だけを返す (自由入力を GA4 に送らない)", () => {
    const paths = ["/", "/ranking/x", "/themes", "/areas", "/survey/x", "/survey", "/tag/x", "/japan/x", "/search", "/blog", "/zzz"];
    for (const p of paths) expect(CONTENT_GROUPS).toContain(resolvePageContext(p).content_group);
  });
});

describe("読了の段階", () => {
  it("到達した段階のうち未送信のものだけを返す", () => {
    expect(reachedSteps(10, new Set())).toEqual([]);
    expect(reachedSteps(60, new Set())).toEqual([25, 50]);
    expect(reachedSteps(80, new Set([25, 50]))).toEqual([75]);
    expect(reachedSteps(100, new Set([25, 50, 75]))).toEqual([100]);
  });
});
