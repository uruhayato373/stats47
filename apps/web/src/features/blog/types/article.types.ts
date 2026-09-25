import { type DataSourceEntry } from "@stats47/data-configs";
import { type AffiliateProduct, type ArticleFrontmatter } from "@stats47/types";

/**
 * 記事行の型。完全DBレス Phase F で D1 `articles` schema ($inferSelect) から relocate。
 * SSOT は article.md frontmatter (export-blog-snapshot が all.json を生成)。
 */
export interface ArticleRow {
  slug: string;
  title: string;
  seoTitle: string | null;
  description: string | null;
  filePath: string;
  format: string | null;
  hasCharts: boolean | null;
  published: boolean | null;
  publishedAt: string | null;
  ogImageType: string | null;
  proofreadAt: string | null;
  tags: string;
  createdAt: string | null;
  updatedAt: string | null;
  /** chart source lineage から派生した survey master id。独立 SSOT ではない。 */
  surveyIds?: string[];
  /** 記事末尾「データ出典」の行。chart source lineage から exporter が派生する。独立 SSOT ではない。 */
  sources?: DataSourceEntry[];
}

export interface Article extends ArticleRow {
  frontmatter: ArticleFrontmatter;
  content: string;
  readingTime?: number;
}

export type { AffiliateProduct, ArticleFrontmatter };
