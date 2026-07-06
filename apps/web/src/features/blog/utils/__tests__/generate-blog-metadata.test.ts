import { describe, expect, it } from "vitest";

import { generateBlogMetadata } from "../generate-blog-metadata";

const input = {
  title: "年間快晴日数ランキング",
  description: "都道府県別の年間快晴日数を比較します。",
  slug: "annual-clear-days-ranking",
};

describe("generateBlogMetadata", () => {
  it("title / description / canonical が正しく設定されること", () => {
    const result = generateBlogMetadata(input);

    expect(result.title).toBe(input.title);
    expect(result.description).toBe(input.description);
    expect(result.alternates?.canonical).toBe(`/blog/${input.slug}`);
  });

  it("openGraph/twitter.images に事前生成した静的 OGP (R2) を設定すること", () => {
    const result = generateBlogMetadata(input);
    const expectedUrl = `https://storage.stats47.jp/app/blog/${input.slug}/ogp/ogp.png`;

    const ogImages = (result.openGraph as Record<string, unknown>)?.images as
      | Array<{ url: string }>
      | undefined;
    expect(ogImages?.[0]?.url).toBe(expectedUrl);
    expect((result.twitter as Record<string, unknown>)?.images).toEqual([expectedUrl]);
  });

  it("twitter card が summary_large_image であること", () => {
    const result = generateBlogMetadata(input);

    expect((result.twitter as Record<string, unknown>)?.card).toBe("summary_large_image");
  });
});
