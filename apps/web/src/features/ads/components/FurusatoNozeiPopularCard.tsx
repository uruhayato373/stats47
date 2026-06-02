import { ExternalLink } from "lucide-react";

import { searchPopularFurusatoItems } from "../lib/rakuten-api";

import { TrackedAffiliateLink } from "./tracked-affiliate-link";

/**
 * 全国人気ふるさと納税カード (都道府県を問わない fallback)。
 *
 * 記事から都道府県を抽出できない・関連県を特定できない場合に使用する。
 * 楽天 API でレビュー数の多い人気返礼品 TOP 4 を表示。
 *
 * - RAKUTEN_APP_ID が未設定の場合は何も表示しない (null を返す)
 * - 楽天 API レスポンスは Server Component の ISR キャッシュ (24h) で再利用
 */
export async function FurusatoNozeiPopularCard() {
  const items = await searchPopularFurusatoItems(4);
  if (items.length === 0) return null;

  const affiliateId = process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID;
  const topUrl = affiliateId
    ? `https://hb.afl.rakuten.co.jp/hgc/${affiliateId}/?pc=https%3A%2F%2Fwww.rakuten.co.jp%2Fcategory%2Ffurusato%2F`
    : "https://www.rakuten.co.jp/category/furusato/";

  return (
    <div className="rounded-none border border-red-100 bg-red-50/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground/70">PR</span>
        <TrackedAffiliateLink
          href={topUrl}
          category="furusato"
          label="楽天ふるさと納税 (人気返礼品 一覧)"
          position="sidebar"
          className="text-[10px] text-red-500 hover:underline flex items-center gap-0.5"
        >
          もっと見る
          <ExternalLink size={10} />
        </TrackedAffiliateLink>
      </div>

      <p className="text-sm font-bold text-foreground mb-3">
        🎁 楽天ふるさと納税 人気返礼品
      </p>

      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => {
          const imageUrl =
            item.mediumImageUrls[0]?.imageUrl ??
            item.smallImageUrls[0]?.imageUrl;
          const linkUrl = item.affiliateUrl ?? item.itemUrl;

          return (
            <TrackedAffiliateLink
              key={item.itemUrl}
              href={linkUrl}
              category="furusato"
              label={item.itemName}
              position="sidebar-popular"
              className="flex flex-col rounded-lg bg-white border border-red-50 overflow-hidden shadow-sm transition-shadow hover:shadow-md"
            >
              {imageUrl && (
                <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt={item.itemName}
                    className="object-contain w-full h-full"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="p-2">
                <p className="text-[11px] leading-tight line-clamp-2 text-foreground">
                  {item.itemName}
                </p>
                <p className="text-xs font-bold text-red-600 mt-1">
                  {item.itemPrice.toLocaleString("ja-JP")}円
                </p>
                {item.reviewCount > 0 && (
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                    ★{item.reviewAverage} ({item.reviewCount})
                  </p>
                )}
              </div>
            </TrackedAffiliateLink>
          );
        })}
      </div>
    </div>
  );
}
