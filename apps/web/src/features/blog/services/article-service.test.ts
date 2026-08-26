import fs from "fs";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArticleService } from "./article-service";

const { mockExistsSync, mockFindArticle, mockReadFileSync } = vi.hoisted(() => ({
  mockExistsSync: vi.fn(),
  mockFindArticle: vi.fn(),
  mockReadFileSync: vi.fn(),
}));

// Mock dependencies
vi.mock("fs", () => ({
  default: {
    existsSync: mockExistsSync,
    readFileSync: mockReadFileSync,
  },
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
}));
vi.mock("path", async () => {
  const actual = await vi.importActual("path");
  return {
    ...actual,
    resolve: vi.fn((...args) => args.join("/")),
    join: vi.fn((...args) => args.join("/")),
  };
});

// Mock repository functions
vi.mock("../repositories/blog-snapshot-reader", () => ({
  readArticleBySlugFromR2: mockFindArticle,
}));

class TestArticleService extends ArticleService {
  constructor() {
    // R2 fetcher に stub を注入し、dynamic import (@stats47/r2-storage/server) を
    // 一切実行しない決定的テストにする (coverage 環境の flaky 根治)
    super(async () => null);
  }

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

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue("# Content");

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

      mockExistsSync.mockReturnValue(false);

      const result = await service.getArticle("slug");
      expect(result?.content).toBe("");
    });
  });
});
