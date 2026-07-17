import { describe, expect, it } from "vitest";

import {
  needsHomeFeaturedValuesFetch,
  resolveHomeFeaturedEditorial,
  type HomeFeaturedSnapshotFields,
} from "../resolve-home-featured-card";

/** editorial 解決 / fallback / 追加 fetch 0 保証の unit test (仕様 doc 28 §5.4 / §13.3) */

const TOP = { rank: 1, areaName: "東京都", value: "1,064" };
const BOTTOM = { rank: 47, areaName: "鳥取県", value: "173" };
const TOP3 = [TOP, { rank: 2, areaName: "大阪府", value: "900" }, { rank: 3, areaName: "愛知県", value: "800" }];

function fields(overrides: Partial<HomeFeaturedSnapshotFields> = {}): HomeFeaturedSnapshotFields {
  return {
    homeFeatured: { order: 1, hook: "テストのフックです？", variant: "question" },
    featuredTop: TOP,
    featuredBottom: BOTTOM,
    featuredTopThree: TOP3,
    tileMapSvg: "<svg/>",
    ...overrides,
  };
}

describe("resolveHomeFeaturedEditorial", () => {
  it("homeFeatured 欠損 (旧 snapshot) は null = control", () => {
    expect(resolveHomeFeaturedEditorial(fields({ homeFeatured: null }))).toBeNull();
  });

  it("question は featuredTop があれば解決する", () => {
    const model = resolveHomeFeaturedEditorial(
      fields({ featuredBottom: null, featuredTopThree: [], tileMapSvg: null }),
    );
    expect(model?.variant).toBe("question");
    expect(model?.hook).toBe("テストのフックです？");
    expect(model?.top).toEqual(TOP);
  });

  it("question は featuredTop 欠損で control へ", () => {
    expect(resolveHomeFeaturedEditorial(fields({ featuredTop: null }))).toBeNull();
    expect(
      resolveHomeFeaturedEditorial(fields({ featuredTop: { rank: 1, areaName: "東京都", value: null } })),
    ).toBeNull();
  });

  it("territory は tileMapSvg + featuredTop が必須", () => {
    const territory = fields({ homeFeatured: { order: 1, hook: "境界はどこ？", variant: "territory" } });
    expect(resolveHomeFeaturedEditorial(territory)?.variant).toBe("territory");
    expect(resolveHomeFeaturedEditorial({ ...territory, tileMapSvg: null })).toBeNull();
    expect(resolveHomeFeaturedEditorial({ ...territory, featuredTop: null })).toBeNull();
  });

  it("comparison は featuredTop + featuredBottom が必須", () => {
    const comparison = fields({ homeFeatured: { order: 1, hook: "高い県と低い県", variant: "comparison" } });
    expect(resolveHomeFeaturedEditorial(comparison)?.variant).toBe("comparison");
    expect(resolveHomeFeaturedEditorial({ ...comparison, featuredBottom: null })).toBeNull();
  });

  it("top-three は 3 件未満で control へ", () => {
    const topThree = fields({ homeFeatured: { order: 1, hook: "上位3県は？", variant: "top-three" } });
    expect(resolveHomeFeaturedEditorial(topThree)?.topThree).toHaveLength(3);
    expect(
      resolveHomeFeaturedEditorial({ ...topThree, featuredTopThree: TOP3.slice(0, 2) }),
    ).toBeNull();
  });
});

describe("needsHomeFeaturedValuesFetch (追加 fetch 0 の保証)", () => {
  it("新 snapshot (焼き込み済み) は production / development とも false", () => {
    expect(needsHomeFeaturedValuesFetch(fields(), { isDevelopment: false })).toBe(false);
    expect(needsHomeFeaturedValuesFetch(fields(), { isDevelopment: true })).toBe(false);
  });

  it("tileMapSvg 未焼き込み (旧 snapshot) は control 用に fetch する (現行互換)", () => {
    expect(needsHomeFeaturedValuesFetch(fields({ tileMapSvg: null }), { isDevelopment: false })).toBe(true);
  });

  it("production では editorial payload 不足でも補完 fetch しない (control へフォールバック)", () => {
    const insufficient = fields({ featuredTop: null }); // tileMapSvg はあるが question payload 不足
    expect(needsHomeFeaturedValuesFetch(insufficient, { isDevelopment: false })).toBe(false);
  });

  it("development のみ editorial payload 不足を補完 fetch する", () => {
    const insufficient = fields({ featuredTop: null });
    expect(needsHomeFeaturedValuesFetch(insufficient, { isDevelopment: true })).toBe(true);
  });

  it("homeFeatured 自体が無い item は dev でも fetch しない (control のみ)", () => {
    const noConfig = fields({ homeFeatured: null });
    expect(needsHomeFeaturedValuesFetch(noConfig, { isDevelopment: true })).toBe(false);
  });
});
