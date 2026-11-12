export type StorefrontChannel = "kindle" | "note";
export type ProductDetailPlacement = "product_detail_top" | "product_detail_bottom";

/** 公開販売面に出せる情報だけを持つ、商品ハブ用の派生型。 */
export interface StorefrontProduct {
  readonly id: string;
  readonly slug: string;
  readonly channel: StorefrontChannel;
  readonly channelLabel: string;
  readonly title: string;
  /** サイト内の短い商品名。販売先の正式な title はメタデータ・計測に保つ。 */
  readonly displayTitle?: string;
  readonly description: string;
  readonly priceYen: number;
  readonly externalUrl: string;
  /** note の販売記事の表紙画像。無い商品は文字だけのカードにする */
  readonly coverImageUrl?: string;
  readonly included: readonly string[];
  readonly audience: readonly string[];
  /** 商品のデータでできる具体的な作業。ある場合は職種の列挙に代えて表示する。 */
  readonly useCases?: readonly { readonly title: string; readonly description: string }[];
  /** 固定年・対象地域・ファイル形式など、購入判断に必要な商品の条件。 */
  readonly purchaseNotes?: readonly string[];
  /** KDP 書籍へ実際に収録した公開ブログ。文脈一致 CTA の決定にだけ使う。 */
  readonly sourceBlogSlugs: readonly string[];
  /** 商品のデータで作れる図の見本 (LP の節)。画像は公開 R2 の `app/products/<slug>/showcase/<file>` */
  readonly showcase?: readonly StorefrontShowcaseSection[];
  /** 見本の出典・作成方法。図の後にまとめて表示する。 */
  readonly showcaseNote?: string;
}

/** LP の 1 節。見出し・短い説明・図。図は型の台帳の型で商品の値から描いたもの (render-product-figures.ts) */
export interface StorefrontShowcaseSection {
  readonly kind: "chart" | "file";
  readonly heading: string;
  readonly lead: string;
  readonly figures: readonly { readonly file: string; readonly alt: string }[];
}
