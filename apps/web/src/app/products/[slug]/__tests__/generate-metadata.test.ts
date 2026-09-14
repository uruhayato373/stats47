import { describe, expect, it } from "vitest";

import { generateMetadata } from "../page";

describe("product page generateMetadata", () => {
  it("kindle商品は事前生成した静的OGP (R2) のURLをopenGraph/twitterへ設定する", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "kindle-k-s1-02" }),
    });

    const openGraph = metadata.openGraph as Record<string, unknown> | undefined;
    const images = openGraph?.images as Array<{ url: string }> | undefined;
    const imageUrl = images?.[0]?.url;

    expect(imageUrl).toMatch(/\/app\/products\/kindle-k-s1-02\/ogp\/ogp\.png$/);
    expect((metadata.twitter as Record<string, unknown> | undefined)?.images).toEqual([
      imageUrl,
    ]);
    expect((metadata.twitter as Record<string, unknown> | undefined)?.card).toBe(
      "summary_large_image",
    );
    expect(metadata.alternates?.canonical).toBe("/products/kindle-k-s1-02");
  });

  it("未知slugはOGPを設定せず見つからない旨のtitleだけを返す", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "not-a-real-product" }),
    });

    expect(metadata.title).toBe("商品が見つかりません");
    expect(metadata.openGraph).toBeUndefined();
  });
});
