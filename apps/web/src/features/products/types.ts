export type StorefrontChannel = "kindle" | "note";

/** 公開販売面に出せる情報だけを持つ、商品ハブ用の派生型。 */
export interface StorefrontProduct {
  readonly id: string;
  readonly slug: string;
  readonly channel: StorefrontChannel;
  readonly channelLabel: string;
  readonly title: string;
  readonly description: string;
  readonly priceYen: number;
  readonly externalUrl: string;
  /** note の販売記事の表紙画像。無い商品は文字だけのカードにする */
  readonly coverImageUrl?: string;
  readonly included: readonly string[];
  readonly audience: readonly string[];
  /** KDP 書籍へ実際に収録した公開ブログ。文脈一致 CTA の決定にだけ使う。 */
  readonly sourceBlogSlugs: readonly string[];
}
