"use client";

import { AdSenseAd, type AdFormat } from "@/lib/google-adsense";

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
  return <AdSenseAd format={format} slotId={slotId} className={className} />;
}
