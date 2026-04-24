export interface AffiliateProduct {
  name: string;
  url: string;
  imageUrl?: string;
  price?: string;
  description?: string;
  buttonText?: string;
}

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
}
