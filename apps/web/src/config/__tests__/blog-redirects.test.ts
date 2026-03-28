import { describe, it, expect } from "vitest";

import { BLOG_SLUG_REDIRECTS } from "../blog-redirects";

describe("BLOG_SLUG_REDIRECTS", () => {
  it("リダイレクトマップが空でない", () => {
    expect(Object.keys(BLOG_SLUG_REDIRECTS).length).toBeGreaterThan(0);
  });

  it("旧 slug と新 slug が異なる", () => {
    for (const [oldSlug, newSlug] of Object.entries(BLOG_SLUG_REDIRECTS)) {
      expect(oldSlug).not.toBe(newSlug);
    }
  });

  it("新 slug が空文字でない", () => {
    for (const newSlug of Object.values(BLOG_SLUG_REDIRECTS)) {
      expect(newSlug.length).toBeGreaterThan(0);
    }
  });

  it("特定のリダイレクトが存在する", () => {
    expect(BLOG_SLUG_REDIRECTS["aging-society-ranking"]).toBe("aging-rate-akita-vs-okinawa");
    expect(BLOG_SLUG_REDIRECTS["vacant-house-rate-ranking"]).toBe("vacant-house-crisis");
  });
});
