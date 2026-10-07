import { ExternalLink } from "lucide-react";

import { SurfaceSection } from "@/components/surface";

import { buildAmazonUrl, CATEGORY_BOOKS } from "../constants/related-books";

import { AdImpressionTracker } from "./AdImpressionTracker";
import { TrackedAffiliateLink } from "./tracked-affiliate-link";

import type { AffiliateVertical } from "../constants/affiliate-category";

const POSITION = "related-books";

/** Amazon 商品 URL の ASIN。ad_id を案件単位で安定させるために使う。 */
function asinOf(dp: string): string {
  return dp.match(/\/dp\/([A-Z0-9]{10})/)?.[1] ?? dp;
}

/**
 * ブログ記事末の関連書籍 (Amazon アソシエイト)。記事の vertical に対応する書籍が無ければ描画しない。
 * 自社 Kindle 本がある記事では呼び出し元が出さない (同じ位置で 2 冊を競合させない)。
 */
export function RelatedAmazonBook({ vertical }: { readonly vertical: AffiliateVertical | null }) {
  const book = vertical ? CATEGORY_BOOKS[vertical] : undefined;
  if (!vertical || !book) return null;

  const adId = `amazon-${asinOf(book.amazonDp)}`;
  return (
    <SurfaceSection className="mt-8 p-5">
      <AdImpressionTracker category={vertical} label={book.title} position={POSITION} adId={adId}>
        <p className="text-xs font-medium text-muted-foreground">PR・関連書籍</p>
        <TrackedAffiliateLink
          href={buildAmazonUrl(book.amazonDp)}
          category={vertical}
          label={book.title}
          position={POSITION}
          adId={adId}
          className="mt-2 flex items-start justify-between gap-3 text-foreground hover:text-primary"
        >
          <span className="min-w-0">
            <span className="block text-base font-bold">{book.title}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{book.author}</span>
            <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">
              {book.description}
            </span>
          </span>
          <ExternalLink className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
        </TrackedAffiliateLink>
      </AdImpressionTracker>
    </SurfaceSection>
  );
}
