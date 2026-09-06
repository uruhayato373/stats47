import { describe, it, expect, vi, beforeEach } from "vitest";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import JSZip from "jszip";
import type { KindleBook } from "../src/channels/kindle/types";

const mocked = vi.hoisted(() => ({ sections: vi.fn(), blog: vi.fn() }));
vi.mock("../src/channels/kindle/ranking-databook", () => ({
  buildRankingSections: mocked.sections,
}));
vi.mock("../src/channels/kindle/fetch-content", () => ({
  fetchBlogArticle: mocked.blog,
}));
import { buildBook, assertBookVersion } from "../src/channels/kindle/build-book";

const book: KindleBook = {
  id: "K-S2-01",
  series: "S2-theme-databook",
  title: "検証本",
  concept: "検証",
  author: "stats47",
  priceYen: 500,
  keywords: ["統計"],
  newContentNote: "内部制作メモ P-01へ誘導するファネル 30%比率",
  status: "manuscript",
  chapters: [{ source: "fresh", title: "導入", freshText: "本文です。" }],
};

describe("immutable Kindle revisions", () => {
  beforeEach(() => vi.clearAllMocks());
  it("rejects traversal and unsafe versions", () => {
    for (const version of ["", "..", "../v1", "/tmp/x", "v1/x", "v1\\x", "x".repeat(65)]) {
      expect(() => assertBookVersion(version)).toThrow();
    }
    expect(() => assertBookVersion("v2-20260906-r1")).not.toThrow();
  });

  it("never overwrites an existing version, including the default v1", async () => {
    const outRoot = mkdtempSync(join(tmpdir(), "kindle-revision-"));
    const first = await buildBook(book, { outRoot, skipCover: true });
    const bytes = readFileSync(first.epubPath);
    const zip = await JSZip.loadAsync(bytes);
    for (const name of Object.keys(zip.files).filter(name => name.endsWith(".xhtml"))) {
      expect(await zip.file(name)!.async("string")).not.toContain(book.newContentNote);
    }
    await expect(buildBook(book, { outRoot, skipCover: true })).rejects.toThrow();
    expect(readFileSync(first.epubPath).equals(bytes)).toBe(true);
    const second = await buildBook(book, {
      outRoot,
      skipCover: true,
      version: "v2",
    });
    expect(second.outDir).not.toBe(first.outDir);
    expect(existsSync(first.epubPath)).toBe(true);
  });

  it("tracks every requested ranking and persists source provenance in metadata and EPUB", async () => {
    const keys = Array.from({ length: 30 }, (_, i) => `metric-${i}`);
    const source = {
      rankingKey: keys[0],
      title: "人数（人口千人当たり）",
      year: "2024",
      unit: "人",
      rawUrl: "https://example.test/values.json",
      canonicalUrl: "https://example.test/ranking/test",
      source: { statsDataId: "123" },
      observedAreas: 47,
      missingAreas: 0,
    };
    mocked.sections.mockImplementation(async (_keys, limit, options) => {
      expect(limit).toBe(30);
      for (const key of keys.slice(1)) options.onMissing(key, "unavailable");
      return [
        {
          rankingKey: keys[0],
          title: source.title,
          bodyMd: "分析本文",
          source,
        },
      ];
    });
    const result = await buildBook(
      {
        ...book,
        chapters: [...book.chapters, { source: "ranking", title: "指標", rankingKeys: keys }],
      },
      {
        outRoot: mkdtempSync(join(tmpdir(), "kindle-lineage-")),
        version: "v2",
        skipCover: true,
      },
    );
    expect(result.coverage).toMatchObject({
      rankingRequested: 30,
      rankingIncluded: 1,
      complete: false,
    });
    expect(result.coverage.missing).toHaveLength(29);
    const metadata = JSON.parse(readFileSync(join(result.outDir, "metadata.json"), "utf8"));
    expect(metadata).toMatchObject({
      schemaVersion: 2,
      version: "v2",
      status: "generated-review-required",
      machineQualityOk: false,
      reviewRequired: true,
      previewerRequired: true,
    });
    expect(metadata.rankingSources).toEqual([source]);
    expect(metadata.authoredSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(metadata.reviewChapters).toHaveLength(metadata.chapterCount);
    expect(typeof metadata.totalChars).toBe("number");
    expect(typeof metadata.volumeOk).toBe("boolean");
    const zip = await JSZip.loadAsync(readFileSync(result.epubPath));
    expect(await zip.file("OEBPS/ranking-sources.xhtml")!.async("string")).toContain(source.rawUrl);
    expect(readFileSync(join(result.outDir, "READINESS.md"), "utf8")).toContain("Amazonの公式数値基準");
  });

  it("does not treat missing fresh files and failed blog fetches as complete", async () => {
    mocked.blog.mockRejectedValue(new Error("offline"));
    const result = await buildBook(
      {
        ...book,
        chapters: [
          { source: "fresh", title: "fresh", freshFile: "missing-chapter.md" },
          { source: "blog", title: "blog", blogSlug: "missing-blog" },
        ],
      },
      {
        outRoot: mkdtempSync(join(tmpdir(), "kindle-missing-")),
        skipCover: true,
      },
    );
    expect(result.coverage.complete).toBe(false);
    expect(result.coverage.missing).toHaveLength(2);
  });
});
