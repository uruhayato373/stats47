import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchBlogArticle } from "../src/channels/kindle/fetch-content";
import { KINDLE_EDITORIAL_CORRECTIONS, correctBookArticle } from "../src/channels/kindle/editorial-corrections";

describe("Kindle source completeness", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("applies a declared arithmetic correction only to the exact reviewed source", async () => {
    const slug = "engel-coefficient-prefecture-ranking";
    const correction = KINDLE_EDITORIAL_CORRECTIONS[slug][0];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(`本文\n${correction.before}`)));
    const article = await fetchBlogArticle(slug);
    expect(article.body).toContain(correction.after);
    expect(article.body).not.toContain(correction.before);
    expect(() => correctBookArticle(slug, "a revised upstream article")).toThrow("source changed");
    expect(() => correctBookArticle(slug, correction.before.repeat(2))).toThrow("source changed");
    expect(correctBookArticle("unrelated", correction.before)).toBe(correction.before);
  });

  it("rejects a frontmatter-only source instead of publishing an empty chapter", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("---\ntitle: 空の章\n---\n\n")));
    await expect(fetchBlogArticle("empty")).rejects.toThrow("Empty blog body: empty");
  });

  it("rejects a missing illustration rather than silently deleting its reference", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response("本文\n![図](data/chart.svg)"))
        .mockResolvedValueOnce(new Response("missing", { status: 404 })),
    );
    await expect(fetchBlogArticle("missing-chart")).rejects.toThrow(
      "Blog image fetch failed (404): missing-chart/data/chart.svg",
    );
  });

  it("rejects an illustration that cannot be converted", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response("本文\n![図](data/chart.svg)"))
        .mockResolvedValueOnce(new Response("not an SVG")),
    );
    await expect(fetchBlogArticle("bad-chart")).rejects.toThrow(
      "Blog image conversion failed: bad-chart/data/chart.svg",
    );
  });

  it("keeps a successfully fetched illustration in the chapter", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response("本文\n![図](data/chart.svg)"))
        .mockResolvedValueOnce(
          new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="4" fill="white"/></svg>',
          ),
        ),
    );
    const result = await fetchBlogArticle("good-chart");
    expect(result.images).toHaveLength(1);
    expect(result.body).toContain("images/good-chart__chart.png");
    expect(result.images[0].png.byteLength).toBeGreaterThan(0);
  });
});
