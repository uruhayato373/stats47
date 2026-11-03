import { describe, expect, it } from "vitest";

import { kindleInboundUrl, noteInboundUrl } from "../../../config/inbound-utm.mjs";

// PRODUCT-REFERRAL-MEASURE-01: 商品 (Kindle・note) からサイトへ戻るリンクの UTM 規約
describe("inbound-utm", () => {
  it("Kindle は書籍 ID を campaign に、置き場所を content に入れる (ASIN は EPUB を作る時点で無い)", () => {
    expect(kindleInboundUrl("https://stats47.jp/blog/household-solo-vs-dualincome", "K-S1-02", "sources")).toBe(
      "https://stats47.jp/blog/household-solo-vs-dualincome?utm_source=kindle&utm_medium=ebook&utm_campaign=k-s1-02&utm_content=sources",
    );
    expect(kindleInboundUrl("https://stats47.jp", "K-S1-02", "latest")).toBe(
      "https://stats47.jp/?utm_source=kindle&utm_medium=ebook&utm_campaign=k-s1-02&utm_content=latest",
    );
  });

  it("既にある utm_* は置き換え、ほかの query は残す", () => {
    expect(noteInboundUrl("https://stats47.jp/ranking/x?year=2020&utm_source=x", "nabc123")).toBe(
      "https://stats47.jp/ranking/x?year=2020&utm_source=note&utm_medium=referral&utm_campaign=note_article&utm_content=nabc123",
    );
  });

  it("サイト以外の URL・形の違う ID・未知の置き場所は拒否する", () => {
    expect(() => kindleInboundUrl("https://note.com/stats47", "K-S1-02", "sources")).toThrow(/stats47\.jp 以外/);
    expect(() => kindleInboundUrl("https://stats47.jp", "B0HF1XFXBY", "sources")).toThrow(/書籍 ID/);
    expect(() => kindleInboundUrl("https://stats47.jp", "K-S1-02", "body" as "sources")).toThrow(/置き場所/);
    expect(() => noteInboundUrl("https://stats47.jp", "h-howto-csv")).toThrow(/記事キー/);
  });
});
