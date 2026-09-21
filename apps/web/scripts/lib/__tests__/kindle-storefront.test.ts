// @vitest-environment node
import { describe, expect, it } from "vitest";
import { selectLiveKindleEdition, type KindleStorefrontListing } from "../kindle-storefront";

const previous = {
  title: "販売中の旧版", priceYen: 500, status: "listed", kdpStatus: "live",
  asin: "B000000001", unpublishAfterReplacementLive: true,
};
const replacement: KindleStorefrontListing = {
  title: "審査中の新版", priceYen: 800, status: "listed", kdpStatus: "in_review",
  asin: null, replacesAsin: previous.asin, previousEditions: [previous],
};

describe("Kindle storefront edition selection", () => {
  it("新版審査中は明示的に維持された旧版の書名・価格・ASINを使う", () => {
    expect(selectLiveKindleEdition(replacement)).toEqual(previous);
  });

  it("新版が販売中になったら新版へ切り替える", () => {
    const live = { ...replacement, kdpStatus: "live", asin: "B000000002" };
    expect(selectLiveKindleEdition(live)).toBe(live);
  });

  it.each(["withdrawn", "blocked-design", "blocked-thin", "unexpected"])(
    "%sの商品では旧版の存在で公開停止を上書きしない", (status) => {
      expect(selectLiveKindleEdition({ ...replacement, status })).toBeNull();
    },
  );

  it.each([
    { ...previous, kdpStatus: "draft" },
    { ...previous, asin: "B000000003" },
    { ...previous, withdrawal: { unpublishedAt: "2026-09-21" } },
    { ...previous, unpublishAfterReplacementLive: false },
  ])("販売継続の証拠が欠けた旧版は掲載しない: %j", (edition) => {
    expect(selectLiveKindleEdition({ ...replacement, previousEditions: [edition] })).toBeNull();
  });

  it("取り下げ決定・旧版なし・旧版重複は掲載しない", () => {
    expect(selectLiveKindleEdition({ ...replacement, withdrawal: {} })).toBeNull();
    expect(selectLiveKindleEdition({ ...replacement, previousEditions: [] })).toBeNull();
    expect(selectLiveKindleEdition({ ...replacement, previousEditions: [previous, previous] })).toBeNull();
  });
});
