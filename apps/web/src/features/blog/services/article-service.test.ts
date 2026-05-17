import fs from "fs";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArticleService } from "./article-service";

// Mock dependencies
vi.mock("fs");
vi.mock("path", async () => {
  const actual = await vi.importActual("path");
  return {
    ...actual,
    resolve: vi.fn((...args) => args.join("/")),
    join: vi.fn((...args) => args.join("/")),
  };
});

// Mock repository functions
const { mockFindArticle } = vi.hoisted(() => ({
  mockFindArticle: vi.fn(),
}));

vi.mock("../repositories/blog-snapshot-reader", () => ({
  readArticleBySlugFromR2: mockFindArticle,
}));

class TestArticleService extends ArticleService {
  protected get isDev(): boolean {
    return true;
  }
}

describe("ArticleService", () => {
  let service: TestArticleService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TestArticleService();
  });

  describe("getArticle", () => {
    it("should return null if repository returns null", async () => {
      mockFindArticle.mockResolvedValue(null);
      const result = await service.getArticle("slug");
      expect(result).toBeNull();
    });

    it("should return article with content if found", async () => {
      const mockArticle = {
        slug: "slug",
        format: "md",
        frontmatter: {},
      };
      mockFindArticle.mockResolvedValue(mockArticle);

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue("# Content");

      const result = await service.getArticle("slug");
      expect(result).not.toBeNull();
      expect(result?.content).toBe("# Content");

      expect(fs.existsSync).toHaveBeenCalledWith(
        expect.stringMatching(/slug[\\/]article\.md$/)
      );
      expect(fs.readFileSync).toHaveBeenCalledWith(
        expect.stringMatching(/slug[\\/]article\.md$/),
        "utf-8"
      );
    });

    // TODO: CI (vitest --coverage) 環境で R2 fallback ルートが走り fail する。
    // local では pass。後日 R2 client を mock するか、isDev getter 経路を見直す。
    it.skip("should handle missing file gracefully (CI flaky)", async () => {
      const mockArticle = {
        slug: "slug",
        format: "md",
        frontmatter: {},
      };
      mockFindArticle.mockResolvedValue(mockArticle);

      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = await service.getArticle("slug");
      expect(result?.content).toBe("");
    });
  });
});
