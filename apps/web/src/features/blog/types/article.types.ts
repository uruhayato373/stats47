import { type ArticleRow } from "@stats47/database/schema";
import { type AffiliateProduct, type ArticleFrontmatter } from "@stats47/types";

export interface Article extends ArticleRow {
  frontmatter: ArticleFrontmatter;
  content: string;
  readingTime?: number;
}

export type { AffiliateProduct, ArticleFrontmatter };
