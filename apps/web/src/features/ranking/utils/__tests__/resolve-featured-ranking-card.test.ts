import { HOME_FEATURED_PROMINENCE } from "@stats47/data-configs/ranking-prominence";
import { describe, expect, it } from "vitest";


import {
  getFeaturedRankingCardDefinition,
  isCurrentHomeFeaturedMapSvg,
  needsHomeFeaturedValuesFetch,
  resolveFeaturedRankingCardModel,
} from "../resolve-featured-ranking-card";

const TOP = { rank: 1, areaName: "東京都", value: "1,064" };
const GEOGRAPHIC_SVG =
  '<svg data-map-rotation="clockwise-32" data-okinawa="excluded" data-map-format="compact-v1"/>';
/** compact 化前の世代: 回転済みだが path が未簡略化で 1 枚 1.7MB あった。 */
const LEGACY_UNCOMPACTED_SVG =
  '<svg data-map-rotation="clockwise-32" data-okinawa="excluded"/>';
/** marker はあるが実サイズが予算超過 (将来の退行検知用)。 */
const OVERSIZED_SVG =
  '<svg data-map-rotation="clockwise-32" data-okinawa="excluded" data-map-format="compact-v1">' +
  'x'.repeat(100_001) +
  '</svg>';

describe("resolveFeaturedRankingCardModel", () => {
  it("rankingKeyの共通hookを返す", () => {
    // 掲載対象は掲載価値スコアの生成物が決めるので、特定 key を固定で期待しない
    // (再生成で入れ替わる)。先頭の掲載キーが自分の hook を返すことだけを保証する。
    const first = HOME_FEATURED_PROMINENCE[0];
    expect(getFeaturedRankingCardDefinition(first.rankingKey)).toEqual({
      hook: first.hook,
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

  it("compact化前の巨大SVGは追加fetchして再生成する", () => {
    expect(
      needsHomeFeaturedValuesFetch({
        featuredTop: TOP,
        tileMapSvg: LEGACY_UNCOMPACTED_SVG,
      }),
    ).toBe(true);
  });

  it("marker付きでも予算超過なら追加fetchする", () => {
    expect(
      needsHomeFeaturedValuesFetch({
        featuredTop: TOP,
        tileMapSvg: OVERSIZED_SVG,
      }),
    ).toBe(true);
  });
});

describe("isCurrentHomeFeaturedMapSvg", () => {
  it("fetch判定と破棄判定が同じ述語を共有する", () => {
    // ずれると「stale と判定しつつ旧SVGを表示し続ける」状態になる。
    const cases = [
      GEOGRAPHIC_SVG,
      LEGACY_UNCOMPACTED_SVG,
      OVERSIZED_SVG,
      "<svg/>",
      null,
    ];
    for (const svg of cases) {
      expect(needsHomeFeaturedValuesFetch({ featuredTop: TOP, tileMapSvg: svg })).toBe(
        !isCurrentHomeFeaturedMapSvg(svg),
      );
    }
  });

  it("現行世代だけを保持する", () => {
    expect(isCurrentHomeFeaturedMapSvg(GEOGRAPHIC_SVG)).toBe(true);
    expect(isCurrentHomeFeaturedMapSvg(LEGACY_UNCOMPACTED_SVG)).toBe(false);
    expect(isCurrentHomeFeaturedMapSvg(OVERSIZED_SVG)).toBe(false);
    expect(isCurrentHomeFeaturedMapSvg(null)).toBe(false);
    expect(isCurrentHomeFeaturedMapSvg(undefined)).toBe(false);
  });

  it("実際に生成されるSVGを現行世代と認める", async () => {
    const { generateRankingThumbnailMapSvg } = await import(
      "@stats47/visualization/server"
    );
    const svg = generateRankingThumbnailMapSvg(
      Array.from({ length: 47 }, (_, index) => ({
        areaCode: `${String(index + 1).padStart(2, "0")}000`,
        value: 47 - index,
        rank: index + 1,
      })),
      { idSuffix: "guard" },
    );

    expect(isCurrentHomeFeaturedMapSvg(svg)).toBe(true);
  });
});
