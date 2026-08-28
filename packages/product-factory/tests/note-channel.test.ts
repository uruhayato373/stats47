import { describe, it, expect } from "vitest";
import { mkdtempSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ALL_PRODUCTS } from "../src/catalog/products";
import { buildCanonicalArticles, CANONICAL_ARTICLES } from "../src/channels/note/article-plan";
import {
  NOTE_PRODUCT_MAPPINGS,
  buildNoteMappings,
  dispositionFor,
} from "../src/channels/note/product-note-mapping";
import { validateNoteChannel } from "../src/channels/note/validators";
import { scanText } from "../src/channels/note/validators/claims";
import { isPriceInTier, isValidPaidPrice } from "../src/channels/note/pricing";
import { renderDraft } from "../src/channels/note/generators/draft";
import { buildNoteArticle } from "../src/channels/note/build/build-note";

describe("note channel — mapping & coverage", () => {
  it("covers all 14 packs exactly once (disposition 100%)", () => {
    expect(ALL_PRODUCTS).toHaveLength(14);
    expect(CANONICAL_ARTICLES).toHaveLength(14);
    expect(NOTE_PRODUCT_MAPPINGS.length).toBe(ALL_PRODUCTS.length);
    const counts = new Map<string, number>();
    for (const a of CANONICAL_ARTICLES) {
      for (const pid of a.memberProductIds) counts.set(pid, (counts.get(pid) ?? 0) + 1);
    }
    for (const p of ALL_PRODUCTS) {
      expect(counts.get(p.id), `${p.id} unassigned/dup`).toBe(1);
    }
  });

  it("validateNoteChannel is green (errors 0, coverage 14/14)", () => {
    const v = validateNoteChannel();
    expect(v.errors).toEqual([]);
    expect(v.ok).toBe(true);
    expect(v.coverage.assigned).toBe(14);
    expect(v.coverage.total).toBe(14);
    expect(v.articleCount).toBe(CANONICAL_ARTICLES.length);
  });

  it("canonical slugs are unique", () => {
    const slugs = CANONICAL_ARTICLES.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("derives disposition deterministically from pack + article", () => {
    const byDisp: Record<string, number> = {};
    for (const m of NOTE_PRODUCT_MAPPINGS) byDisp[m.disposition] = (byDisp[m.disposition] ?? 0) + 1;
    expect(byDisp["catalog-only"] ?? 0).toBe(0);
    expect(byDisp["free-lead"]).toBe(1);
    // 単独 member の有料記事 → standalone-paid
    const single = CANONICAL_ARTICLES.find((a) => a.access === "paid" && a.memberProductIds.length === 1);
    if (!single) throw new Error("no single-member paid article");
    const p = ALL_PRODUCTS.find((x) => x.id === single.memberProductIds[0])!;
    expect(dispositionFor(p, single)).toBe("standalone-paid");
  });

  it("rebuild is stable (same catalog + article-plan → same mappings)", () => {
    expect(buildNoteMappings()).toEqual(NOTE_PRODUCT_MAPPINGS);
    expect(buildCanonicalArticles()).toEqual(CANONICAL_ARTICLES);
  });

  it("derives one canonical article from every pack without legacy product IDs", () => {
    expect(CANONICAL_ARTICLES.map((a) => a.memberProductIds)).toEqual(
      ALL_PRODUCTS.map((p) => [p.id]),
    );
    expect(CANONICAL_ARTICLES.flatMap((a) => a.memberProductIds)).toEqual(
      ALL_PRODUCTS.map((p) => p.id),
    );
  });
});

describe("note channel — paid boundary & pricing", () => {
  it("free articles have price 0 and no attachments; paid articles are in a valid tier", () => {
    for (const a of CANONICAL_ARTICLES) {
      if (a.access === "free") {
        expect(a.priceJpy, `${a.slug} free must be 0`).toBe(0);
      } else {
        expect(isValidPaidPrice(a.priceJpy), `${a.slug} price ${a.priceJpy}`).toBe(true);
      }
    }
  });

  it("price tier boundaries", () => {
    expect(isPriceInTier(0, "free")).toBe(true);
    expect(isPriceInTier(500, "free")).toBe(false);
    expect(isPriceInTier(1980, "lite")).toBe(true);
    expect(isPriceInTier(9800, "magazine")).toBe(true);
    expect(isValidPaidPrice(999999)).toBe(false);
  });
});

describe("note channel — claims scanner", () => {
  it("flags banned phrases and markdown tables", () => {
    expect(scanText("この商品なら売上が上がります", "x").some((i) => i.code === "banned-phrase")).toBe(true);
    expect(scanText("e-Stat公認のデータです", "x").some((i) => i.code === "banned-phrase")).toBe(true);
    expect(scanText("| 県 | 値 |\n|---|---|\n| 東京 | 1 |", "x").some((i) => i.code === "markdown-table")).toBe(true);
  });

  it("passes clean editorial text", () => {
    expect(scanText("都道府県のデータを地図にまとめられます。", "x")).toEqual([]);
  });

  it("all 14 article plans pass claims", () => {
    const v = validateNoteChannel();
    expect(v.errors.filter((e) => e.code === "banned-phrase" || e.code === "markdown-table")).toEqual([]);
  });
});

describe("note channel — draft generation", () => {
  it("paid draft has paid boundary; free draft does not; no markdown tables", () => {
    const paid = CANONICAL_ARTICLES.find((a) => a.access === "paid")!;
    const free = CANONICAL_ARTICLES.find((a) => a.access === "free")!;
    const paidMd = renderDraft(paid, ALL_PRODUCTS, [], []);
    const freeMd = renderDraft(free, ALL_PRODUCTS, [], []);
    expect(paidMd).toContain("<!-- paid:start -->");
    expect(freeMd).not.toContain("<!-- paid:start -->");
    // markdown 表の区切り行を含まない
    expect(/\|\s*-{3,}/.test(paidMd)).toBe(false);
    expect(/\|\s*-{3,}/.test(freeMd)).toBe(false);
    // 禁止表現を含まない
    expect(scanText(paidMd, paid.slug)).toEqual([]);
    expect(scanText(freeMd, free.slug)).toEqual([]);
  });

  it("builds a single article to a temp dir with all 7 files", () => {
    const outRoot = mkdtempSync(join(tmpdir(), "note-"));
    const article = CANONICAL_ARTICLES.find((a) => a.access === "paid")!;
    const res = buildNoteArticle(article, ALL_PRODUCTS, { outRoot });
    for (const f of ["draft.md", "hashtags.txt", "attachments.json", "source-manifest.json", "product-links.json", "images-plan.json", "REVIEW.md"]) {
      expect(existsSync(join(res.outDir, f)), `missing ${f}`).toBe(true);
    }
    expect(readFileSync(join(res.outDir, "draft.md"), "utf8")).toContain("<!-- paid:start -->");
    // free article generates no paid attachments (attachments.json は空配列)
    const freeArticle = CANONICAL_ARTICLES.find((a) => a.access === "free")!;
    const freeRes = buildNoteArticle(freeArticle, ALL_PRODUCTS, { outRoot });
    const att = JSON.parse(readFileSync(join(freeRes.outDir, "attachments.json"), "utf8"));
    expect(att.attachments).toEqual([]);
  });
});
