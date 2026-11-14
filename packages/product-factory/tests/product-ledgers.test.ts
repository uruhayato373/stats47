/**
 * 商品の台帳 (data/products/{packs,kindle}/・data/note/series.json) とその読み込み口の結合の整合を固定する。
 * 記録そのものの値は固定しない (台帳は判断して増える)。固定するのは、件数が決まっているもの・ID の並び・
 * 読み込み口が結合する値 (rankingKeys・表紙・地域コード・シリーズごとのテーマ) が台帳の外の正本と食い違わないこと。
 */
import { describe, expect, it } from "vitest";
import { PREFECTURE_AREA_CODES } from "@stats47/area";
import { PACK_RANKING_KEYS } from "../src/catalog/pack-rankingkeys.generated";
import { EXPECTED_PACK_IDS, EXPECTED_TOTAL, PACK_META, PACK_THEMES, THEME_BY_ID } from "../src/catalog/packs";
import { LICENSE_IDS, LICENSE_REGISTRY } from "../src/catalog/licenses";
import { ALL_PRODUCTS, PACKS } from "../src/catalog/products";
import { BOOK_BY_ID, EXPECTED_SERIES, KINDLE_BOOKS, S3_REGION_CODES } from "../src/channels/kindle/book-catalog";
import { BOOK_RANKING_KEYS, JAPAN_ZUE_KINDLE_COVERAGE } from "../src/channels/kindle/book-ranking-keys";
import { KINDLE_EDITORIAL_CORRECTIONS } from "../src/channels/kindle/editorial-corrections";
import { KINDLE_FIGURE_CORRECTIONS } from "../src/channels/kindle/figure-corrections";
import { NOTE_SERIES_KEYS, NOTE_SERIES_REGISTRY, SERIES_BY_THEME } from "../src/channels/note/series";

const range = (prefix: string, from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => `${prefix}${String(from + i).padStart(2, "0")}`);

describe("パック (products.packs)", () => {
  it("パック ID は P-01〜P-14 の 14 件で、台帳の並びのまま ALL_PRODUCTS になる", () => {
    expect(EXPECTED_PACK_IDS).toEqual(range("P-", 1, 14));
    expect(EXPECTED_TOTAL).toBe(14);
    expect(ALL_PRODUCTS.map((p) => p.id)).toEqual(EXPECTED_PACK_IDS);
  });

  it("THEME_BY_ID は台帳の theme と 1:1 で、PACK_META (テーマ → ID) の逆引きと一致する", () => {
    expect(Object.keys(THEME_BY_ID)).toEqual(EXPECTED_PACK_IDS);
    expect(new Set(Object.values(THEME_BY_ID)).size).toBe(EXPECTED_TOTAL);
    expect(PACKS.map((p) => p.theme)).toEqual(EXPECTED_PACK_IDS.map((id) => THEME_BY_ID[id]));
    for (const [theme, meta] of Object.entries(PACK_META)) expect(THEME_BY_ID[meta.id], theme).toBe(theme);
    expect([...PACK_THEMES].sort()).toEqual(Object.values(THEME_BY_ID).sort());
  });

  it("rankingKeys は台帳に書かず、生成物から id 単位で注入する", () => {
    for (const p of PACKS) expect(p.rankingKeys, p.id).toBe(PACK_RANKING_KEYS[p.id] ?? []);
  });

  it("licenseId はライセンスの台帳にある", () => {
    for (const p of PACKS) expect(LICENSE_IDS, p.id).toContain(p.licenseId);
  });
});

describe("ライセンス (products.licenses)", () => {
  it("8 件で、id はキーと一致し、どれも再販売不可", () => {
    expect(LICENSE_IDS).toHaveLength(8);
    for (const [id, license] of Object.entries(LICENSE_REGISTRY)) {
      expect(license.id).toBe(id);
      expect(license.resale).toBe(false);
    }
  });
});

describe("Kindle 書籍 (products.kindle-books)", () => {
  it("S1 16 冊・S2 12 冊・S3 8 冊・S4 2 冊の 38 冊 (構想中の候補を含む) で、台帳の並びが KINDLE_BOOKS の並び", () => {
    const expected = [...range("K-S1-", 1, 16), ...range("K-S2-", 1, 12), ...range("K-S3-", 1, 8), ...range("K-S4-", 1, 2)];
    expect(KINDLE_BOOKS.map((b) => b.id)).toEqual(expected);
    expect([...BOOK_BY_ID.keys()]).toEqual(expected);
    expect(new Set(KINDLE_BOOKS.map((b) => b.series))).toEqual(EXPECTED_SERIES);
  });

  it("表紙設計は書籍 ID で結合され、台帳には書かない", () => {
    for (const b of KINDLE_BOOKS) expect(b.coverDesign, b.id).toBeDefined();
  });

  it("ranking の章のキーは書籍ごとの採否から結合し、無い書籍は章ごと空にしない", () => {
    for (const b of KINDLE_BOOKS) {
      for (const ch of b.chapters.filter((c) => c.source === "ranking")) {
        expect(ch.rankingKeys, b.id).toEqual(BOOK_RANKING_KEYS[b.id]);
        expect(ch.rankingKeys!.length, b.id).toBeGreaterThan(0);
      }
    }
    // S2・S3・S4 の各冊が、それぞれ ranking の章を 1 つ持つ
    const rankingBooks = KINDLE_BOOKS.filter((b) => b.chapters.some((c) => c.source === "ranking")).map((b) => b.id);
    expect(rankingBooks).toEqual(Object.keys(BOOK_RANKING_KEYS));
  });

  it("S3 の地域コードは 8 ブロックで 47 都道府県を 1 回ずつ覆い、章の highlightCodes に結合される", () => {
    expect(Object.keys(S3_REGION_CODES)).toEqual(range("", 1, 8));
    expect(Object.values(S3_REGION_CODES).flat().sort()).toEqual([...PREFECTURE_AREA_CODES].sort());
    for (const [suffix, codes] of Object.entries(S3_REGION_CODES)) {
      const ch = BOOK_BY_ID.get(`K-S3-${suffix}`)!.chapters.find((c) => c.source === "ranking")!;
      expect(ch.highlightCodes).toEqual(codes);
      expect(ch.highlightRegionLabel).toBeTruthy();
      expect(ch.regionBlockLabel).toBeTruthy();
    }
  });

  it("日本国勢図会の採択は台帳にある書籍だけを指す", () => {
    for (const bookId of Object.keys(JAPAN_ZUE_KINDLE_COVERAGE.included)) expect(BOOK_BY_ID.has(bookId), bookId).toBe(true);
  });
});

describe("Kindle の校訂 (products.kindle-editorial-corrections・products.kindle-figure-corrections)", () => {
  it("どの校訂も before が空でなく、理由を持つ", () => {
    const all = [...Object.values(KINDLE_EDITORIAL_CORRECTIONS), ...Object.values(KINDLE_FIGURE_CORRECTIONS)].flat();
    expect(all.length).toBeGreaterThan(0);
    for (const c of all) {
      expect(c.before.length).toBeGreaterThan(0);
      expect(c.reason.length).toBeGreaterThan(0);
    }
  });

  it("図の校訂のキーは <記事 slug>/<図の名前>", () => {
    for (const key of Object.keys(KINDLE_FIGURE_CORRECTIONS)) expect(key).toMatch(/^[a-z0-9-]+\/[a-z0-9-]+$/);
  });
});

describe("note のシリーズ (note.series)", () => {
  it("10 シリーズで、全パックのテーマがちょうど 1 つのシリーズに属する", () => {
    expect(NOTE_SERIES_KEYS).toHaveLength(10);
    expect(Object.keys(SERIES_BY_THEME).sort()).toEqual([...PACK_THEMES].sort());
    const themes = NOTE_SERIES_KEYS.flatMap((key) => NOTE_SERIES_REGISTRY[key].themes);
    expect(themes.sort()).toEqual([...PACK_THEMES].sort());
    for (const key of NOTE_SERIES_KEYS) expect(NOTE_SERIES_REGISTRY[key].key).toBe(key);
  });
});
