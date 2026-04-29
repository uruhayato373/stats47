import fs from "fs";
import path from "path";

import { readArticleBySlugFromR2 as findArticleBySlug } from "../repositories/blog-snapshot-reader";
import { type Article } from "../types";

const LOCAL_CONTENT_DIR = path.resolve(process.cwd(), "../../.local/r2/blog");

function resolveR2Key(slug: string, format: string): string {
  const filename = format === "mdx" ? "article.mdx" : "article.md";
  return `blog/${slug}/${filename}`;
}

export class ArticleService {
  protected get isDev(): boolean {
    return process.env.NODE_ENV === "development";
  }

  /**
   * slug で記事を取得する。
   */
  async getArticle(slug: string): Promise<Article | null> {
    // 1. Get metadata from DB
    const article = await findArticleBySlug(slug);
    if (!article) return null;

    // 2. Fetch content: ローカルファイルがあれば優先、なければ R2 フォールバック
    const format = article.format || "md";
    const local = this.isDev ? this.readFromLocal(slug, format) : "";
    const content = local || await this.readFromR2(slug, format);

    return {
      ...article,
      content,
    };
  }

  /** YAML フロントマター（--- ... ---）をコンテンツから除去する */
  private stripFrontmatter(content: string): string {
    return content.replace(/^---[\s\S]*?---\r?\n?/, "");
  }

  private readFromLocal(slug: string, format: string): string {
    try {
      const filename = format === "mdx" ? "article.mdx" : "article.md";
      const contentPath = path.join(LOCAL_CONTENT_DIR, slug, filename);

      if (fs.existsSync(contentPath)) {
        const raw = fs.readFileSync(contentPath, "utf-8");
        return this.stripFrontmatter(raw);
      }
      return "";
    } catch {
      return "";
    }
  }

  private async readFromR2(slug: string, format: string): Promise<string> {
    try {
      const { fetchFromR2AsString } = await import("@stats47/r2-storage/server");
      const key = resolveR2Key(slug, format);
      const content = await fetchFromR2AsString(key);
      if (!content) {
        return "";
      }
      return this.stripFrontmatter(content);
    } catch {
      return "";
    }
  }
}

export const articleService = new ArticleService();
