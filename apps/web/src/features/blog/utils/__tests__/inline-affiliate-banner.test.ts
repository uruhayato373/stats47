import { describe, expect, it } from "vitest";

import { BLOG_IN_BODY_BANNER_COUNT } from "../inline-affiliate-banner";

describe("BLOG_IN_BODY_BANNER_COUNT", () => {
  it("本文3枠と記事末尾1枠ぶんのバナーを解決する", () => {
    expect(BLOG_IN_BODY_BANNER_COUNT).toBe(4);
  });
});
