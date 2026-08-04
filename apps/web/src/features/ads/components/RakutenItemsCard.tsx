import { ExternalLink } from "lucide-react";

import { getSurfaceCardClassName } from "@/components/surface";

import { detectProductKeyword } from "../constants/product-keywords";
import { readRakutenItemsFromR2 } from "../repositories/rakuten-snapshot";

import { AdImpressionTracker } from "./AdImpressionTracker";
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

  // ★ R2 snapshot を読む (実行時に楽天 API を叩かない)。日次 cron が焼く。
  //   理由: 楽天の Expected QPS=1 に対し、deploy 後の warm-cache が sitemap 全 URL を
  //   叩くため 646 ページ分がバーストしていた。正典: repositories/rakuten-snapshot.ts
  const items = await readRakutenItemsFromR2(keyword.searchTerm);
  if (items.length === 0) return null;

  // 品目別 CTR を ad_id custom dimension で追えるようにする。
  const adId = `rakuten-item-${keyword.term}`;
  const searchUrl = `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(keyword.searchTerm)}/`;

  // ★ 2026-08-04: impression 計装を追加 (それまでクリックのみ送信していた)。
  //    カード内の全アイテムが 1 つの adId を共有するので **カード単位で 1 impression**
  //    とする (アイテム単位にすると同一 adId が 4 重に計上され CTR が 1/4 に歪む)。
  return (
    <AdImpressionTracker
      category="economy"
      label={`${keyword.term}の人気商品`}
      position={position}
      adId={adId}
    >
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
        {items.map((item) => (
          <TrackedAffiliateLink
            key={item.url}
            href={item.url}
            category="economy"
            adId={adId}
            label={item.name}
            position={`${position}-item`}
            className={getSurfaceCardClassName({
              interactive: true,
              className: "flex flex-col overflow-hidden p-0",
            })}
          >
            {item.image && (
              <div className="flex aspect-square items-center justify-center overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
            <div className="p-2">
              <p className="line-clamp-2 text-[11px] leading-tight text-foreground">
                {item.name}
              </p>
              <p className="mt-1 text-[11px] font-bold text-green-600">
                {item.price.toLocaleString()}円
              </p>
            </div>
          </TrackedAffiliateLink>
        ))}
      </div>
    </div>
    </AdImpressionTracker>
  );
}
