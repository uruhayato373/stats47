import { describe, expect, it } from "vitest";

import {
  getFeaturedRankingCardDefinition,
  needsHomeFeaturedValuesFetch,
  resolveFeaturedRankingCardModel,
} from "../resolve-featured-ranking-card";

const TOP = { rank: 1, areaName: "東京都", value: "1,064" };
const GEOGRAPHIC_SVG =
  '<svg data-map-rotation="clockwise-32" data-okinawa="excluded"/>';

describe("resolveFeaturedRankingCardModel", () => {
  it("rankingKeyの共通hookを返す", () => {
    expect(getFeaturedRankingCardDefinition("annual-sunshine-duration")).toEqual({
      hook: "日照時間が最も長い県は？",
    });
    expect(getFeaturedRankingCardDefinition("unknown")).toBeNull();
  });

  it("1位と地理地図から唯一のmodelを返す", () => {
    expect(
      resolveFeaturedRankingCardModel(
        {
          definition: { hook: "人口が最も多い県は？" },
          featuredTop: TOP,
          tileMapSvg: GEOGRAPHIC_SVG,
        },
        "総人口",
      ),
    ).toEqual({
      hook: "人口が最も多い県は？",
      top: TOP,
      mapSvg: GEOGRAPHIC_SVG,
    });
  });

  it("未登録rankingは正式titleをhookに使う", () => {
    expect(
      resolveFeaturedRankingCardModel(
        { featuredTop: TOP, tileMapSvg: GEOGRAPHIC_SVG },
        "年間日照時間",
      )?.hook,
    ).toBe("年間日照時間");
  });

  it("1位または地図がなければ別variantへfallbackせずnullを返す", () => {
    expect(
      resolveFeaturedRankingCardModel(
        { featuredTop: null, tileMapSvg: GEOGRAPHIC_SVG },
        "人口",
      ),
    ).toBeNull();
    expect(
      resolveFeaturedRankingCardModel(
        { featuredTop: TOP, tileMapSvg: null },
        "人口",
      ),
    ).toBeNull();
  });
});

describe("needsHomeFeaturedValuesFetch", () => {
  it("新しい地理地図と1位が揃えば追加fetchしない", () => {
    const fields = {
      homeFeatured: { order: 1, hook: "テスト用のフックです？" },
      featuredTop: TOP,
      tileMapSvg: GEOGRAPHIC_SVG,
    };
    expect(needsHomeFeaturedValuesFetch(fields)).toBe(false);
  });

  it("旧タイル地図は地理地図へ移行するため追加fetchする", () => {
    expect(
      needsHomeFeaturedValuesFetch(
        { featuredTop: TOP, tileMapSvg: "<svg/>" },
      ),
    ).toBe(true);
  });

  it("1位欠損も補完する", () => {
    expect(
      needsHomeFeaturedValuesFetch(
        { featuredTop: null, tileMapSvg: GEOGRAPHIC_SVG },
      ),
    ).toBe(true);
  });
});
