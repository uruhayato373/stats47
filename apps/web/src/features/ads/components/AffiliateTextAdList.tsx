import { ExternalLink } from "lucide-react";

import { getSurfaceCardClassName } from "@/components/surface";

import { AFFILIATE_THEME, type AffiliateCategory } from "../constants/affiliate-category";

import { AdImpressionTracker } from "./AdImpressionTracker";
import { TrackedAffiliateLink } from "./tracked-affiliate-link";

import type { ResolvedAffiliateAd } from "../types";

interface AffiliateTextAdListProps {
  ads: ResolvedAffiliateAd[];
  /** テーマカラー算出用。記事/ランキングの AffiliateCategory。 */
  affiliateCategory?: AffiliateCategory | null;
  position?: string;
  /** A/B テスト用 (GA4 experiment_id / variant_id)。本文フォーマット比較などに使う。 */
  experimentId?: string;
  variantId?: string;
}

/**
 * テキストリンク型アフィリエイトを複数並べて表示する presentational コンポーネント。
 * 本文・footer のテキスト広告表示に使う。desktop 右レールでは使用しない。
 * 各リンクは GA4 クリック計測 (TrackedAffiliateLink) + インプレッション計測 (AdImpressionTracker)
 * + rel="sponsored" + 1x1 計測ピクセルを保証する。
 */
export function AffiliateTextAdList({
  ads,
  affiliateCategory,
  position = "sidebar",
  experimentId,
  variantId,
}: AffiliateTextAdListProps) {
  if (ads.length === 0) return null;

  const theme = affiliateCategory ? AFFILIATE_THEME[affiliateCategory] : null;

  return (
    <div className="space-y-3">
      {ads.map((ad) => (
        <AdImpressionTracker
          key={ad.title}
          category={affiliateCategory ?? "other"}
          label={ad.title}
          position={position}
          adId={ad.id}
          experimentId={experimentId}
          variantId={variantId}
        >
          <div
            className={`relative rounded-none border ${theme?.border ?? "border-border"} ${theme?.bg ?? "bg-muted/50"} p-4`}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground/70">PR</span>
            </div>
            <TrackedAffiliateLink
              href={ad.href}
              category={affiliateCategory ?? "other"}
              label={ad.title}
              position={position}
              adId={ad.id}
              experimentId={experimentId}
              variantId={variantId}
              className={getSurfaceCardClassName({
                interactive: true,
                className: "flex items-center justify-between gap-3 px-4 py-3",
              })}
            >
              <p className="text-sm font-bold text-foreground">
                {theme?.emoji ? `${theme.emoji} ` : ""}
                {ad.title}
              </p>
              <ExternalLink
                size={16}
                className={`shrink-0 ${theme?.icon ?? "text-muted-foreground/70"}`}
              />
            </TrackedAffiliateLink>
            {ad.trackingPixelUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ad.trackingPixelUrl}
                width={1}
                height={1}
                alt=""
                className="absolute opacity-0 pointer-events-none"
              />
            )}
          </div>
        </AdImpressionTracker>
      ))}
    </div>
  );
}
