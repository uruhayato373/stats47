import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildSalesCatalog, CURRENT_SALES_REVISIONS, csvCell, escapeHtml, localPath, renderSalesCsv, renderSalesHtml, verifyManifest } from "../src/build/sales-catalog";

const roots: string[] = [];
function fixture() { const root = mkdtempSync(join(tmpdir(), "sales-catalog-test-")); roots.push(root); return root; }
function json(root: string, path: string, value: unknown) { const full = join(root, path); mkdirSync(join(full, ".."), { recursive: true }); writeFileSync(full, JSON.stringify(value)); }
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
describe("sales readiness does not conflate generation and publication", () => {
  it("keeps the entire authored population when all evidence is missing", () => {
    const c = buildSalesCatalog(fixture(), "2026-09-06");
    expect(c.offers).toHaveLength(62);
    expect(new Set(c.offers.map(o => o.id)).size).toBe(62);
    expect(c.summary.free).toBe(1);
    expect(c.offers.filter(o => o.kind === "book")).toHaveLength(32);
    expect(c.offers.every(o => o.buildStatus === "missing")).toBe(true);
    expect(c.warnings.length).toBeGreaterThan(0);
    expect(c.selectedRevisions).toEqual(CURRENT_SALES_REVISIONS);
  });
  it("does not select an unapproved local experiment as the current candidate", () => {
    const root = fixture();
    json(root, ".local/kindle-books/K-S1-01/zz-experiment/metadata.json", { freshRatioOk: true });
    writeFileSync(join(root, ".local/kindle-books/K-S1-01/zz-experiment/book.epub"), "experiment");
    const c = buildSalesCatalog(root, "2026-09-06");
    expect(c.offers.find(o => o.id === "K-S1-01")?.artifactDirectory).toContain(CURRENT_SALES_REVISIONS.kindle);
    expect(c.offers.find(o => o.id === "K-S1-01")?.buildStatus).toBe("missing");
  });
  it("shows historical live state independently of a missing working revision", () => {
    const root = fixture();
    json(root, ".claude/config/kdp-listings.json", { listings: { "K-S1-01": { kdpStatus: "live", kdpStatusCheckedAt: "2026-08-30", asin: "B0TEST" } } });
    json(root, ".local/kindle-books/K-S1-01/v1/metadata.json", { freshRatioOk: true });
    writeFileSync(join(root, ".local/kindle-books/K-S1-01/v1/book.epub"), "old");
    const o = buildSalesCatalog(root, "2026-09-06", "v2-test").offers.find(o => o.id === "K-S1-01")!;
    expect(o.channels[0].publicationStatus).toBe("live");
    expect(o.channels[0].checkedAt).toBe("2026-08-30");
    expect(o.buildStatus).toBe("missing");
    expect(o.ownerGates.length).toBeGreaterThan(0);
    expect(o.contentBlockers).toContain("改訂EPUB未生成（公開版archiveとは別管理）");
    expect(o.contentBlockers?.some(b => b.includes("R2保全"))).toBe(false);
  });
  it("validates every artifact and detects injected tampering and an empty manifest", () => {
    const root = fixture(), dir = "product/v2", body = Buffer.from("47 rows");
    json(root, `${dir}/manifest.json`, { files: [{ path: "data.csv", bytes: body.length, sha256: createHash("sha256").update(body).digest("hex") }] });
    writeFileSync(join(root, dir, "data.csv"), body);
    expect(verifyManifest(root, dir, "manifest.json").files).toBe(1);
    expect(() => verifyManifest(root, dir, "manifest.json", "wrong")).toThrow("pinned");
    writeFileSync(join(root, dir, "data.csv"), "tampered");
    expect(() => verifyManifest(root, dir, "manifest.json")).toThrow("mismatch");
    json(root, `${dir}/manifest.json`, { files: [] });
    expect(() => verifyManifest(root, dir, "manifest.json")).toThrow("no files");
  });
  it("rejects escaping paths and unsafe versions", () => {
    const root = fixture();
    for (const p of ["../secret", "/tmp/secret", "a/../../secret", ""]) expect(() => localPath(root, p)).toThrow();
    expect(() => buildSalesCatalog(root, "today", "../v1")).toThrow("invalid Kindle version");
  });
  it("escapes display content and spreadsheet formulas", () => {
    expect(escapeHtml('<script>"x"</script>')).not.toContain("<script>");
    expect(csvCell("=HYPERLINK(x)")).toBe('"\'=HYPERLINK(x)"');
    const c = buildSalesCatalog(fixture(), "today");
    c.offers[0].title = "<img src=x onerror=alert(1)>";
    expect(renderSalesHtml(c)).not.toContain("<img src=x");
    expect(renderSalesCsv(c).split("\r\n")).toHaveLength(78); // 62 offers + 14 note variants + header + terminator
  });
});
