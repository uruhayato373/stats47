"use client";

import {
  ADSENSE_DISPLAY_ENABLED,
  AdSenseAd,
  type AdFormat,
} from "@/lib/google-adsense";

interface AdSenseAdWrapperProps {
  format: AdFormat;
  slotId?: string;
  className?: string;
}

/**
 * AdSenseAd の軽量クライアントラッパー。
 * Server Component の AffiliateAdSlot から間接的にレンダリングするために使用。
 */
export function AdSenseAdWrapper({ format, slotId, className }: AdSenseAdWrapperProps) {
  if (!ADSENSE_DISPLAY_ENABLED) return null;
  return <AdSenseAd format={format} slotId={slotId} className={className} />;
}
