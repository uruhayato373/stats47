import { describe, expect, it } from "vitest";

import { BLOG_IN_BODY_BANNER_COUNT } from "../inline-affiliate-banner";

describe("BLOG_IN_BODY_BANNER_COUNT", () => {
  it("広告の段 4 段 (本文 3 段 + 記事の末尾 1 段) の PR の枠ぶんのバナーを解決する", () => {
    expect(BLOG_IN_BODY_BANNER_COUNT).toBe(4);
  });
});
