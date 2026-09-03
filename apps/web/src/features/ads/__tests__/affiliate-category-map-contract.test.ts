import { MUNICIPALITY_THEME_CATALOGS } from "@stats47/data-configs/geo-scope";
import { describe, expect, it } from "vitest";

import {
  AFFILIATE_VERTICALS,
  MUNICIPALITY_THEME_AFFILIATE_MAP,
  TAG_AFFILIATE_MAP,
  THEME_AFFILIATE_MAP,
} from "../constants/affiliate-category";

/**
 * 意図ハブ (affiliate-category.ts) の契約テスト。
 *
 * 2026-09-02: 公開 523 記事のうち 212 記事 (ブログ imp の 56%) でタグが vertical に
 * 解決されず、本文 3・末尾 1・右レール 2・テキスト 4 の枠がすべて空だった。
 * 写像の追加で記事数 311→363 / imp 44%→89% に上げた。ここでは
 *   (1) 追加した写像が同じ主題の CATEGORY / THEME 写像と同じ vertical を指すこと
 *   (2) 汎用・無意図タグを写像していないこと (誤った軸へ流すより空の方が無害)
 *   (3) 市区町村テーマ slug が全件 vertical を持つこと (slug を足したら写像も足す)
 * を固定する。
 */
describe("TAG_AFFILIATE_MAP (2026-09-02 追加分)", () => {
  it("同じ主題の CATEGORY / THEME 写像と同じ vertical を指す", () => {
    // 気候 = landweather → housing / 製造業 = manufacturing テーマ → economy /
    // 農業 = agriculture → furusato / 在留外国人 = foreign-residents テーマ → population
    expect(TAG_AFFILIATE_MAP["気候"]).toBe("housing");
    expect(TAG_AFFILIATE_MAP["製造業"]).toBe(THEME_AFFILIATE_MAP["manufacturing"]);
    expect(TAG_AFFILIATE_MAP["農業"]).toBe("furusato");
    expect(TAG_AFFILIATE_MAP["在留外国人"]).toBe(THEME_AFFILIATE_MAP["foreign-residents"]);
    expect(TAG_AFFILIATE_MAP["地方債"]).toBe(THEME_AFFILIATE_MAP["local-finance"]);
    expect(TAG_AFFILIATE_MAP["身長"]).toBe("education");
    expect(TAG_AFFILIATE_MAP["太陽光発電"]).toBe("energy");
  });

  it("汎用・無意図タグは写像しない", () => {
    for (const tag of ["都道府県格差", "都道府県別", "地域差", "地域格差", "地名", "地形", "漢字", "公務員", "e-Stat"]) {
      expect(TAG_AFFILIATE_MAP[tag], tag).toBeUndefined();
    }
  });

  it("値は 10 vertical のいずれか", () => {
    const allowed = new Set<string>(AFFILIATE_VERTICALS);
    for (const [tag, vertical] of Object.entries(TAG_AFFILIATE_MAP)) {
      expect(allowed.has(vertical), `${tag} → ${vertical}`).toBe(true);
    }
  });
});

describe("MUNICIPALITY_THEME_AFFILIATE_MAP", () => {
  it("市区町村テーマ slug は全件 vertical を持つ", () => {
    const slugs = Object.keys(MUNICIPALITY_THEME_CATALOGS);
    expect(slugs.length).toBeGreaterThan(0);
    for (const slug of slugs) {
      expect(MUNICIPALITY_THEME_AFFILIATE_MAP[slug], slug).toBeDefined();
    }
  });

  it("実在しない slug を写像していない", () => {
    for (const slug of Object.keys(MUNICIPALITY_THEME_AFFILIATE_MAP)) {
      expect(MUNICIPALITY_THEME_CATALOGS[slug], slug).toBeDefined();
    }
  });
});
