export interface AffiliateProduct {
  name: string;
  url: string;
  imageUrl?: string;
  price?: string;
  description?: string;
  buttonText?: string;
}

/**
 * ブログ OGP 背景 (AI 生成) のビジュアル系統。6 値固定。
 * 正典: .claude/rules/ogp-image-standards.md §5 / apps/web/scripts/data/blog-ogp-visual-catalog.ts
 */
export type OgpVisualType =
  | "map"
  | "people"
  | "economy"
  | "industry"
  | "timeline"
  | "comparison";

export interface ArticleFrontmatter {
  title: string;
  seoTitle?: string;
  subtitle?: string;
  description?: string;
  tags?: string[];
  publishedAt?: string;
  updatedAt?: string;
  published?: boolean;
  rankingKey?: string;
  affiliate?: AffiliateProduct;
  /** 執筆者。Article JSON-LD の author Person.name に使われる。未指定時は運営者 (KAZU) */
  author?: string;
  /** 校閲者。Article JSON-LD の reviewedBy Person.name に使われる（任意） */
  reviewedBy?: string;
  /**
   * OGP AI 背景のビジュアル系統 (任意)。6 値のみ。未指定時は category/archetype/tags から決定的に導出。
   * 正典: .claude/rules/ogp-image-standards.md §5
   */
  ogpVisualType?: OgpVisualType;
  /** OGP AI 背景の motif (任意)。カタログ登録済み識別子のみ許可。自由プロンプトは不可。 */
  ogpMotif?: string;
}
