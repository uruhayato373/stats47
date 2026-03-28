import { describe, it, expect } from "vitest";

import { generateWebSiteStructuredDataScripts } from "../scripts";

describe("generateWebSiteStructuredDataScripts", () => {
  it("WebSite と Organization の script タグを生成する", () => {
    const result = generateWebSiteStructuredDataScripts("https://stats47.jp");

    expect(result).toContain('<script type="application/ld+json">');
    expect(result).toContain('"@type":"WebSite"');
    expect(result).toContain('"@type":"Organization"');
  });

  it("baseUrl がスキーマに含まれる", () => {
    const result = generateWebSiteStructuredDataScripts("https://test.example.com");

    expect(result).toContain("https://test.example.com");
  });

  it("SearchAction の urlTemplate が正しい形式", () => {
    const result = generateWebSiteStructuredDataScripts("https://stats47.jp");

    expect(result).toContain("https://stats47.jp/search?q={search_term_string}");
  });

  it("サイト名を含む", () => {
    const result = generateWebSiteStructuredDataScripts("https://stats47.jp");

    expect(result).toContain("統計で見る都道府県");
  });
});
