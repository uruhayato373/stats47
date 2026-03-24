import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
    orderBy: vi.fn(),
    offset: vi.fn(),
    innerJoin: vi.fn(),
    then: vi.fn(),
  },
}));

vi.mock("@stats47/database/server", () => ({
  getDrizzle: vi.fn(() => mockDb),
  articles: {
    slug: "slug",
    tags: "tags",
    published: "published",
    publishedAt: "published_at",
    createdAt: "created_at",
  },
  articleTags: {
    slug: "slug",
    tagKey: "tag_key",
  },
  tags: {
    tagKey: "tag_key",
    tagName: "tag_name",
  },
}));

// Import after mocks are set up
const { findArticleBySlug, listLatestArticles } =
  await import("./article-repository");

describe("article-repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.where.mockReturnThis();
    mockDb.limit.mockReturnThis();
    mockDb.orderBy.mockReturnThis();
    mockDb.offset.mockReturnThis();
    mockDb.innerJoin.mockReturnThis();
  });

  describe("findArticleBySlug", () => {
    it("should return null if article not found", async () => {
      mockDb.then.mockImplementation((resolve) => resolve([]));
      const result = await findArticleBySlug("slug");
      expect(result).toBeNull();
    });

    it("should return article if found", async () => {
      const mockRow = {
        slug: "slug",
        title: "Title",
        description: "Desc",
        tags: "tag1, tag2",
        filePath: "path/to/file",
        published: true,
        publishedAt: "2024-01-01T00:00:00Z",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      };
      mockDb.then.mockImplementation((resolve) => resolve([mockRow]));

      const result = await findArticleBySlug("slug");
      expect(result).not.toBeNull();
      expect(result?.title).toBe("Title");
      // tags は article_tags ジャンクションに一本化。frontmatter.tags は常に空配列
      expect(result?.frontmatter.tags).toEqual([]);
    });
  });

  describe("listLatestArticles", () => {
    it("should return published articles", async () => {
      const mockRows = [
        { title: "Latest", tags: "tag1", published: true, publishedAt: "2024-01-01" },
      ];
      mockDb.then.mockImplementation((resolve) => resolve(mockRows));

      const result = await listLatestArticles(10, 0);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Latest");
    });
  });
});
