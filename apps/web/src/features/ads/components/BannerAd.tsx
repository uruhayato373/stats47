"use client";

import { AdImpressionTracker } from "./AdImpressionTracker";
import { TrackedAffiliateLink } from "./tracked-affiliate-link";

interface BannerAdProps {
  href: string;
  imageUrl: string;
  trackingPixelUrl?: string | null;
  width?: number | null;
  height?: number | null;
  category?: string;
  label?: string;
  position?: string;
  className?: string;
}

/**
 * バナー広告の統一表示コンポーネント。
 * TrackedAffiliateLink 経由で GA4 計測 + rel="sponsored" を保証する。
 */
export function BannerAd({
  href,
  imageUrl,
  trackingPixelUrl,
  width,
  height,
  category = "other",
  label = "",
  position = "banner",
  className,
}: BannerAdProps) {
  return (
    <AdImpressionTracker category={category} label={label} position={position}>
      <div className={`relative flex flex-col items-center gap-1 ${className ?? ""}`}>
        <span className="self-start rounded bg-slate-200 px-1.5 py-0.5 text-xs font-bold text-slate-500">
          PR
        </span>
        <TrackedAffiliateLink
          href={href}
          category={category}
          label={label}
          position={position}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            width={width ?? undefined}
            height={height ?? undefined}
            alt=""
            className="max-w-full h-auto"
          />
        </TrackedAffiliateLink>
        {trackingPixelUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={trackingPixelUrl}
            width={1}
            height={1}
            alt=""
            className="absolute opacity-0 pointer-events-none"
          />
        )}
      </div>
    </AdImpressionTracker>
  );
}
