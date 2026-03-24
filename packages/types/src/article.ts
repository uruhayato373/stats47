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
}
