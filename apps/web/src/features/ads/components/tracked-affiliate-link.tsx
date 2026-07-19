"use client";

import { trackAffiliateClick } from "@/lib/analytics/events";

interface TrackedAffiliateLinkProps {
  href: string;
  category: string;
  label: string;
  position: string;
  /** 広告 1 件単位の識別子 (AffiliateAd.id)。案件別 CTR 計測用 */
  adId?: string;
  /** A/B テスト用 (AFF-05・任意) */
  experimentId?: string;
  variantId?: string;
  creativeSize?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * アフィリエイトリンクの `<a>` ラッパー。
 * クリック時に GA4 カスタムイベント `affiliate_click` を送信する。
 * サーバーコンポーネントから children として利用可能。
 */
export function TrackedAffiliateLink({
  href,
  category,
  label,
  position,
  adId,
  experimentId,
  variantId,
  creativeSize,
  className,
  children,
}: TrackedAffiliateLinkProps) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={className}
      onClick={() =>
        trackAffiliateClick({ category, label, position, adId, experimentId, variantId, creativeSize })
      }
    >
      {children}
    </a>
  );
}
