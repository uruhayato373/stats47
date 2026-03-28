import { describe, it, expect } from "vitest";

import { preprocessCallouts } from "../md-preprocessor";

describe("preprocessCallouts", () => {
  it("NOTE callout を HTML div に変換する", () => {
    const source = `> [!NOTE]
> これは注記です。
> 2行目です。`;

    const result = preprocessCallouts(source);

    expect(result).toContain('class="-mt-1 mb-4 border-l-4');
    expect(result).toContain("NOTE");
    expect(result).toContain("これは注記です。");
    expect(result).toContain("2行目です。");
  });

  it("TIP callout を変換する", () => {
    const source = `> [!TIP]
> ヒントです。`;

    const result = preprocessCallouts(source);

    expect(result).toContain("TIP");
    expect(result).toContain("border-green-400");
  });

  it("WARNING callout を変換する", () => {
    const source = `> [!WARNING]
> 警告です。`;

    const result = preprocessCallouts(source);

    expect(result).toContain("WARNING");
    expect(result).toContain("border-amber-400");
  });

  it("IMPORTANT callout を変換する", () => {
    const source = `> [!IMPORTANT]
> 重要です。`;

    const result = preprocessCallouts(source);

    expect(result).toContain("IMPORTANT");
    expect(result).toContain("border-purple-400");
  });

  it("CAUTION callout を変換する", () => {
    const source = `> [!CAUTION]
> 注意です。`;

    const result = preprocessCallouts(source);

    expect(result).toContain("CAUTION");
    expect(result).toContain("border-red-400");
  });

  it("callout でない通常行はそのまま保持する", () => {
    const source = `通常のテキスト
2行目`;

    const result = preprocessCallouts(source);

    expect(result).toBe(source);
  });

  it("関連記事セクションを related-articles 要素に変換する", () => {
    const source = `### 関連記事

- [記事1](/blog/article-1)
- [記事2](/blog/article-2)`;

    const result = preprocessCallouts(source);

    expect(result).toContain("<related-articles>");
    expect(result).toContain('href="/blog/article-1"');
    expect(result).toContain("</related-articles>");
  });

  it("relatedArticleTitles がある場合にタイトルを置換する", () => {
    const source = `### 関連記事

- [リンクテキスト](/blog/my-article)`;

    const result = preprocessCallouts(source, { "my-article": "実際のタイトル" });

    expect(result).toContain("実際のタイトル");
  });

  it("callout と通常テキストの混在", () => {
    const source = `前のテキスト

> [!NOTE]
> 注記

後のテキスト`;

    const result = preprocessCallouts(source);

    expect(result).toContain("前のテキスト");
    expect(result).toContain("NOTE");
    expect(result).toContain("後のテキスト");
  });
});
