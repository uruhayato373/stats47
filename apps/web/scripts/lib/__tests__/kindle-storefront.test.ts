// @vitest-environment node
import { describe, expect, it } from "vitest";
import { buildKindleStorefrontContent, selectLiveKindleEdition, type KindleStorefrontListing } from "../kindle-storefront";

const listingDescription = [
  "未婚率や一人暮らしの高齢者の割合は、県でどう違うのだろう。",
  "",
  "人口減少の話を、県ごとの数字で確かめたい方のための本です。",
  "",
  "【この本で分かること】",
  "・30代前半男性の未婚率を県ごとに比べられる",
  "・単身高齢世帯の県別の割合が分かる",
  "",
  "【こんな方に】",
  "・人口や世帯の変化を県ごとに数字で知りたい方",
  "",
  "【収録内容】",
  "図 18 点、47 都道府県の全県表 8 表を収録しています。",
  "",
  "【データについて】",
  "e-Stat などの公的統計をもとに編集しています。",
].join("\n");
const book = { concept: "未婚・単身・東京集中を束ねて読む本。", chapters: [{ title: "はじめに" }, { title: "第1章 未婚率" }] };

describe("Kindle storefront content", () => {
  it("販売中の版の紹介文から、収録内容・分かること・読者・データの注意を本ごとに取り出す", () => {
    const listing = { ...previous, description: listingDescription };
    expect(buildKindleStorefrontContent("K-TEST", listing, listing, book)).toEqual({
      description: book.concept,
      included: [
        "図 18 点、47 都道府県の全県表 8 表を収録しています。",
        "30代前半男性の未婚率を県ごとに比べられる",
        "単身高齢世帯の県別の割合が分かる",
      ],
      audience: ["人口や世帯の変化を県ごとに数字で知りたい方"],
      purchaseNotes: ["e-Stat などの公的統計をもとに編集しています。"],
      tableOfContents: ["はじめに", "第1章 未婚率"],
    });
  });

  it("旧版を販売中の間は旧版自身の紹介文を使い、新版の目次を載せない", () => {
    const old = { ...previous, description: listingDescription };
    const content = buildKindleStorefrontContent("K-TEST", { ...replacement, description: "新版" }, old, book);
    expect(content.description).toBe("未婚率や一人暮らしの高齢者の割合は、県でどう違うのだろう。人口減少の話を、県ごとの数字で確かめたい方のための本です。");
    expect(content.description).not.toMatch(/販売中の旧版です/);
    expect(content.tableOfContents).toBeUndefined();
    expect(content.purchaseNotes?.[0]).toMatch(/旧版/);
  });

  it.each(["この本で分かること", "こんな方に", "収録内容", "データについて"])(
    "紹介文に【%s】が無い本は定型文で埋めず生成を止める", (section) => {
      const description = listingDescription.replace(`【${section}】`, "【その他】");
      const listing = { ...previous, description };
      expect(() => buildKindleStorefrontContent("K-TEST", listing, listing, book)).toThrow(section);
    },
  );
});

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
