import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PDFDocument, PDFRawStream, decodePDFRawStream } from "pdf-lib";
import { buildDatabook, resolveDatabook } from "../src/build/build-databook";
import { reserveProductVersion } from "../src/build/build-product";
import { recordFreeSampleDelivery } from "../src/build/free-sample-delivery";
import { ALL_PRODUCTS } from "../src/catalog/products";
import { notoSansJpBytes } from "../src/generators/jp-font";
import { CANONICAL_ARTICLES } from "../src/channels/note/article-plan";
import { buildNoteRevision, validateNoteRevision } from "../src/channels/note/build/build-revision";

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
describe("free sample is real, pinned, and not an editable Office promise", () => {
  it("generates a complete-font PDF and connects only free files to note", async () => {
    const root = mkdtempSync(join(tmpdir(), "free-sample-")); roots.push(root);
    const product = ALL_PRODUCTS.find(p => p.id === "P-13")!;
    const res = await buildDatabook(product, resolveDatabook(product)!, { outRoot: join(root, ".local/coconala-products"), version: "test-r1" });
    const bytes = readFileSync(join(res.outDir, "databook.pdf"));
    const doc = await PDFDocument.load(bytes);
    const originalFont = Buffer.from(notoSansJpBytes());
    expect(doc.context.enumerateIndirectObjects().some(([, object]) => object instanceof PDFRawStream &&
      Buffer.from(decodePDFRawStream(object).decode()).equals(originalFont))).toBe(true);
    expect(readFileSync(join(res.outDir, "listing/listing.md"), "utf8")).toContain("PNGは固定画像");
    expect(readFileSync(join(res.outDir, "READINESS.md"), "utf8")).not.toContain("[x] Excel");
    await expect(buildDatabook(product, resolveDatabook(product)!, { outRoot: join(root, ".local/coconala-products"), version: "test-r1" })).rejects.toThrow();
    expect(readFileSync(join(res.outDir, "databook.pdf")).equals(bytes)).toBe(true);
    recordFreeSampleDelivery(root, res.outDir);
    mkdirSync(join(root, ".claude/config"), { recursive: true });
    writeFileSync(join(root, ".claude/config/coconala-listings.json"), JSON.stringify({ listings: {} }));
    const article = CANONICAL_ARTICLES.find(a => a.memberProductIds[0] === "P-13")!;
    const report = await buildNoteRevision({ root, revision: "test-r1", articles: [article] });
    expect(report.items[0].missingProducts).toEqual([]);
    expect(report.items[0].attachments.length).toBeGreaterThan(0);
    expect(report.items[0].blockers).not.toContain("office-real-device-validation-pending");
    expect(report.readyToPublish).toBe(false);
    expect(await validateNoteRevision("test-r1", root)).toEqual([]);
    const draft = readFileSync(join(root, report.items[0].outDir, "draft.md"), "utf8");
    expect(draft).toContain("PowerPointは非同梱");
    expect(draft).not.toContain("<!-- paid:start -->");
  });
  it("rejects unsafe product edition paths before creating output", () => {
    for (const v of ["../v1", "..", "/tmp/x", "v1/x", ""]) expect(() => reserveProductVersion("/tmp", "P-13", v)).toThrow("unsafe");
  });
});
