import { describe, expect, it } from "vitest";

import { UrlPolicy } from "../../lib/url-policy";
import { GONE_BLOG_SLUGS } from "../gone-blog-slugs";
import { UNPUBLISHED_BLOG_SLUGS } from "../unpublished-blog-slugs";

/**
 * 未公開記事の `/blog/<slug>` は 404 ではなく **HTTP 200 +「記事が見つかりません」**
 * (soft 404) で固着していた。ページは notFound() を呼ぶが OpenNext がそれを prerender として
 * 焼き付けるため (`.claude/rules/nextjs-ssg-preservation.md`)。middleware で 410 に短絡して潰す。
 *
 * 2 つの集合は役割が違うので混ぜない:
 *   - UNPUBLISHED (自動生成): 一時的な状態。再公開すれば次回生成で消える
 *   - GONE (手編集): 恒久削除の決定
 */
describe("UNPUBLISHED_BLOG_SLUGS", () => {
  it("GONE と重複しない (恒久削除と一時未公開を混ぜない)", () => {
    const overlap = [...UNPUBLISHED_BLOG_SLUGS].filter((s) => GONE_BLOG_SLUGS.has(s));
    expect(overlap).toEqual([]);
  });

  it("全 slug が kebab-case (URL セグメントとして安全)", () => {
    const invalid = [...UNPUBLISHED_BLOG_SLUGS].filter(
      (s) => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s),
    );
    expect(invalid).toEqual([]);
  });

  it("UrlPolicy.blog.isUnpublished が集合を反映する", () => {
    for (const slug of UNPUBLISHED_BLOG_SLUGS) {
      expect(UrlPolicy.blog.isUnpublished(slug)).toBe(true);
    }
    expect(UrlPolicy.blog.isUnpublished("__no-such-slug__")).toBe(false);
  });

  it("isUnpublished と isGone は独立している", () => {
    for (const slug of GONE_BLOG_SLUGS) {
      expect(UrlPolicy.blog.isGone(slug)).toBe(true);
    }
    expect(UrlPolicy.blog.isGone("__no-such-slug__")).toBe(false);
  });
});
