import { describe, expect, it } from "vitest";

import {
  buildFurusatoNozeiUrl,
  getFurusatoNozeiLink,
} from "../constants/furusato-nozei";

describe("getFurusatoNozeiLink", () => {
  it("全国コード 00000 は null を返す", () => {
    expect(getFurusatoNozeiLink("00000")).toBeNull();
  });

  it("都道府県コードから正しいリンク情報を返す", () => {
    const result = getFurusatoNozeiLink("13000");
    expect(result).toEqual({
      prefCode: "13000",
      prefName: "東京都",
      rakutenAreaSlug: "tokyo",
    });
  });

  it("市区町村コード（5桁）から先頭2桁で都道府県を特定する", () => {
    const result = getFurusatoNozeiLink("13101"); // 東京都千代田区
    expect(result).toEqual({
      prefCode: "13000",
      prefName: "東京都",
      rakutenAreaSlug: "tokyo",
    });
  });

  it("存在しない都道府県コードは null を返す", () => {
    expect(getFurusatoNozeiLink("99000")).toBeNull();
  });

  it("47都道府県すべてにマッピングがある", () => {
    for (let i = 1; i <= 47; i++) {
      const code = `${String(i).padStart(2, "0")}000`;
      const result = getFurusatoNozeiLink(code);
      expect(result, `都道府県コード ${code} にマッピングがない`).not.toBeNull();
    }
  });
});

describe("buildFurusatoNozeiUrl", () => {
  it("アフィリエイトID なしの場合、直接 URL を返す", () => {
    const url = buildFurusatoNozeiUrl("hokkaido");
    expect(url).toBe("https://event.rakuten.co.jp/furusato/area/hokkaido/");
  });

  it("アフィリエイトID ありの場合、アフィリエイトリンクを返す", () => {
    const url = buildFurusatoNozeiUrl("hokkaido", "test-affiliate-id");
    expect(url).toContain("hb.afl.rakuten.co.jp");
    expect(url).toContain("test-affiliate-id");
    expect(url).toContain(encodeURIComponent("https://event.rakuten.co.jp/furusato/area/hokkaido/"));
  });
});
