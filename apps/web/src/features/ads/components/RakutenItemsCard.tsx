import { ExternalLink } from "lucide-react";

import { getSurfaceCardClassName } from "@/components/surface";

import { detectProductKeyword } from "../constants/product-keywords";
import { searchRakutenItems } from "../lib/rakuten-api";

import { TrackedAffiliateLink } from "./tracked-affiliate-link";

interface RakutenItemsCardProps {
  /** 品目を探すテキスト (記事タイトル / ランキング名)。 */
  sourceText: string;
  /** 計測用の配置ラベル。 */
  position?: string;
}

/**
 * 記事・ランキングの主題が「楽天市場で売っている品目」のとき、その商品カードを出す。
 *
 * furusato と同じく楽天は提携審査が不要なので、A8 在庫が無い文脈にも供給できる。
 * 品目を検出できないページ・API が 0 件を返したページでは **何も描画しない** —
 * 無差別に出すと記事と無関係な商品が並び読者価値を損なうため
 * (`.claude/rules/blog-quality-standards.md` のリンク配置規律と同じ考え方)。
 */
export async function RakutenItemsCard({
  sourceText,
  position = "sidebar",
}: RakutenItemsCardProps) {
  const keyword = detectProductKeyword(sourceText);
  if (!keyword) return null;

  const items = await searchRakutenItems({
    keyword: keyword.searchTerm,
    hits: 4,
    sort: "-reviewCount",
  });
  if (items.length === 0) return null;

  // 品目別 CTR を ad_id custom dimension で追えるようにする。
  const adId = `rakuten-item-${keyword.term}`;
  const searchUrl = `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(keyword.searchTerm)}/`;

  return (
    <div className="rounded-none border border-green-100 bg-green-50/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground/70">PR</span>
        <TrackedAffiliateLink
          href={searchUrl}
          category="economy"
          adId={adId}
          label={`${keyword.term}を楽天市場で探す`}
          position={position}
          className="flex items-center gap-0.5 text-[10px] text-green-600 hover:underline"
        >
          もっと見る
          <ExternalLink size={10} />
        </TrackedAffiliateLink>
      </div>

      <p className="mb-3 text-sm font-bold text-foreground">
        {keyword.term}の人気商品
      </p>

      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => {
          const imageUrl =
            item.mediumImageUrls[0]?.imageUrl ?? item.smallImageUrls[0]?.imageUrl;
          const linkUrl = item.affiliateUrl ?? item.itemUrl;

          return (
            <TrackedAffiliateLink
              key={item.itemUrl}
              href={linkUrl}
              category="economy"
              adId={adId}
              label={item.itemName}
              position={`${position}-item`}
              className={getSurfaceCardClassName({
                interactive: true,
                className: "flex flex-col overflow-hidden p-0",
              })}
            >
              {imageUrl && (
                <div className="flex aspect-square items-center justify-center overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt={item.itemName}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="p-2">
                <p className="line-clamp-2 text-[11px] leading-tight text-foreground">
                  {item.itemName}
                </p>
                <p className="mt-1 text-[11px] font-bold text-green-600">
                  {item.itemPrice.toLocaleString()}円
                </p>
              </div>
            </TrackedAffiliateLink>
          );
        })}
      </div>
    </div>
  );
}
