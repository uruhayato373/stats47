import { describe, it, expect } from "vitest";

import { generateOGMetadata } from "../og-generator";

describe("generateOGMetadata", () => {
  it("openGraph と twitter の基本メタデータを生成する", () => {
    const result = generateOGMetadata({
      title: "テストページ",
      description: "テスト説明",
      imageUrl: "/og-image.png",
    });

    expect(result.openGraph).toMatchObject({
      title: "テストページ",
      description: "テスト説明",
      type: "website",
    });
    expect(result.twitter).toMatchObject({
      card: "summary_large_image",
      title: "テストページ",
      description: "テスト説明",
    });
  });

  it("画像情報を正しく設定する", () => {
    const result = generateOGMetadata({
      title: "テスト",
      description: "説明",
      imageUrl: "/test.png",
      width: 800,
      height: 400,
      alt: "代替テキスト",
    });

    const images = result.openGraph?.images as Array<Record<string, unknown>>;
    expect(images[0]).toMatchObject({
      url: "/test.png",
      width: 800,
      height: 400,
      alt: "代替テキスト",
    });
  });

  it("alt が省略された場合に title を使用する", () => {
    const result = generateOGMetadata({
      title: "タイトル",
      description: "説明",
      imageUrl: "/img.png",
    });

    const images = result.openGraph?.images as Array<Record<string, unknown>>;
    expect(images[0].alt).toBe("タイトル");
  });

  it("デフォルト画像サイズは 1200x630", () => {
    const result = generateOGMetadata({
      title: "テスト",
      description: "説明",
      imageUrl: "/img.png",
    });

    const images = result.openGraph?.images as Array<Record<string, unknown>>;
    expect(images[0].width).toBe(1200);
    expect(images[0].height).toBe(630);
  });

  it("type を article に設定できる", () => {
    const result = generateOGMetadata({
      title: "記事",
      description: "説明",
      imageUrl: "/img.png",
      type: "article",
    });

    expect((result.openGraph as Record<string, unknown>)?.type).toBe("article");
  });

  it("url が指定された場合に og:url を含む", () => {
    const result = generateOGMetadata({
      title: "テスト",
      description: "説明",
      imageUrl: "/img.png",
      url: "https://stats47.jp/test",
    });

    expect((result.openGraph as Record<string, unknown>).url).toBe("https://stats47.jp/test");
  });

  it("url が省略された場合に og:url を含まない", () => {
    const result = generateOGMetadata({
      title: "テスト",
      description: "説明",
      imageUrl: "/img.png",
    });

    expect((result.openGraph as Record<string, unknown>).url).toBeUndefined();
  });
});
