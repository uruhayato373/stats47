import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { authoredBookSha256, semanticReviewErrors, xhtmlChapterEvidence, chapterEvidence } from "../src/channels/kindle/revision-evidence";
import type { KindleBook } from "../src/channels/kindle/types";

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
const expected = { bookId: "K-S2-01", version: "v3", epubSha256: "epub", authoredSha256: "input", chapters: [{ fileName: "a.xhtml", sha256: "a" }, { fileName: "b.xhtml", sha256: "b" }], authorIds: ["author"] };
const receipt = () => ({ ...expected, schemaVersion: 1, verdict: "PASS", scope: "all-chapters", reviewer: "critic", authorIds: ["author"], reviewedAt: "2026-09-06T00:00:00Z", unresolvedFindings: [] });
describe("edition-bound independent reviews", () => {
  it("accepts only a complete, distinct reviewer with no unresolved findings", () => {
    expect(semanticReviewErrors(receipt(), expected)).toEqual([]);
    for (const mutation of [null, {}, { ...receipt(), reviewer: "author" }, { ...receipt(), reviewer: "author " }, { ...receipt(), reviewer: "AUTHOR" }, { ...receipt(), reviewer: 3 },
      { ...receipt(), authorIds: ["someone-else"] },
      { ...receipt(), authorIds: [] }, { ...receipt(), verdict: "FAIL" }, { ...receipt(), unresolvedFindings: ["wrong denominator"] },
      { ...receipt(), epubSha256: "old" }, { ...receipt(), authoredSha256: "old" }, { ...receipt(), scope: "fresh-only" },
      { ...receipt(), chapters: expected.chapters.slice(0, 1) }, { ...receipt(), chapters: [expected.chapters[0], expected.chapters[0]] },
      { ...receipt(), reviewedAt: "pending" }]) expect(semanticReviewErrors(mutation, expected).length).toBeGreaterThan(0);
  });
  it("derives every actual chapter from XHTML rather than trusting declared coverage", () => {
    const chapters = [{ fileName: "a.xhtml", bodyXhtml: "<h1>A</h1>" }, { fileName: "b.xhtml", bodyXhtml: "<p>B &amp; C</p>" }];
    const actual = xhtmlChapterEvidence([...chapters.map(c => ({ fileName: c.fileName, xhtml: `<body>\n${c.bodyXhtml}\n</body>` })), { fileName: "nav.xhtml", xhtml: "navigation" }]);
    expect(actual).toEqual(chapterEvidence(chapters));
    expect(semanticReviewErrors({ ...receipt(), chapters: actual.slice(0, 1) }, { ...expected, chapters: actual })).toContain("review chapter coverage mismatch");
    expect(() => xhtmlChapterEvidence([{ fileName: "a.xhtml", xhtml: "broken" }])).toThrow("missing EPUB body");
  });
  it("invalidates an authored fingerprint after manuscript or catalog changes", () => {
    const root = mkdtempSync(join(tmpdir(), "kindle-input-proof-")); roots.push(root);
    const book: KindleBook = { id: "K-S2-01", series: "S2-theme-databook", title: "人口", concept: "定義を読む", author: "stats47",
      priceYen: 500, keywords: ["統計"], newContentNote: "書き下ろし", status: "manuscript", chapters: [{ source: "fresh", title: "導入", freshFile: "intro.md" }] };
    writeFileSync(join(root, "intro.md"), "旧本文");
    const old = authoredBookSha256(book, root);
    writeFileSync(join(root, "intro.md"), "新本文");
    expect(authoredBookSha256(book, root)).not.toBe(old);
    expect(authoredBookSha256({ ...book, title: "世帯" }, root)).not.toBe(authoredBookSha256(book, root));
    expect(() => authoredBookSha256({ ...book, chapters: [{ source: "fresh", title: "escape", freshFile: "../secret.md" }] }, root)).toThrow("unsafe");
  });
});
