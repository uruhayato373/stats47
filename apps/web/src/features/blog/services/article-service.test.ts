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

vi.mock("../repositories/article-repository", () => ({
  findArticleBySlug: mockFindArticle,
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

    it("should handle missing file gracefully", async () => {
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
