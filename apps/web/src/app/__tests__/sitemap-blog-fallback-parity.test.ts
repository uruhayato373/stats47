/**
 * ブログ sitemap の 3 経路 (R2 の記事・R2 が空のときの git 定数・例外時のフォールバック) が
 * 同じ除外条件 (301 の転送元と 410) を使うことを固定する。
 * 2026-10-26 まで、例外時のフォールバックだけが 301 の転送元を除いていなかった。
 */
import { describe, expect, it, vi } from "vitest";

import { SITEMAP_BLOG_ENTRIES } from "@/config/sitemap-blog-entries";
import { SITEMAP_SEGMENTS } from "@/config/sitemap-segments";

import sitemap from "../sitemap";

// git 定数の先頭記事を「301 で転送済み」に見せる
vi.mock("@/config/blog-redirects", async () => {
  const { SITEMAP_BLOG_ENTRIES: entries } = await vi.importActual<typeof import("@/config/sitemap-blog-entries")>(
    "@/config/sitemap-blog-entries",
  );
  return { BLOG_SLUG_REDIRECTS: { [entries[0]!.slug]: "redirect-destination" } };
});

const listLatestArticles = vi.fn();
vi.mock("@/features/blog/server", () => ({
  listLatestArticles: (...args: unknown[]) => listLatestArticles(...args),
  listAllTagsWithCount: vi.fn(async () => []),
}));

const BLOG_ID = SITEMAP_SEGMENTS.indexOf("blog");
const redirectedSlug = SITEMAP_BLOG_ENTRIES[0]!.slug;
const hasRedirected = (urls: string[]) => urls.some((url) => url.endsWith(`/blog/${redirectedSlug}`));

describe("ブログ sitemap の除外条件 (3 経路で共通)", () => {
  it("R2 が空のとき git 定数から 301 の転送元を除く", async () => {
    listLatestArticles.mockResolvedValueOnce([]);
    const entries = await sitemap({ id: BLOG_ID });
    expect(entries.length).toBeGreaterThan(1);
    expect(hasRedirected(entries.map((e) => e.url))).toBe(false);
  });

  it("生成が例外で落ちたときのフォールバックでも 301 の転送元を除き、R2 が空の場合と同じ集合になる", async () => {
    listLatestArticles.mockResolvedValueOnce([]);
    const emptyR2 = (await sitemap({ id: BLOG_ID })).map((e) => e.url);
    // null を返すと getBlogPages 内の rows.filter が例外になり、sitemap() の catch 側へ落ちる
    listLatestArticles.mockResolvedValueOnce(null);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fallback = (await sitemap({ id: BLOG_ID })).map((e) => e.url);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
    expect(hasRedirected(fallback)).toBe(false);
    expect(fallback).toEqual(emptyR2);
  });

  it("R2 の記事でも 301 の転送元を除く", async () => {
    listLatestArticles.mockResolvedValueOnce([
      { slug: redirectedSlug, publishedAt: "2026-01-01" },
      { slug: "live-article", publishedAt: "2026-01-02" },
    ]);
    const urls = (await sitemap({ id: BLOG_ID })).map((e) => e.url);
    expect(hasRedirected(urls)).toBe(false);
    expect(urls.some((url) => url.endsWith("/blog/live-article"))).toBe(true);
  });
});
