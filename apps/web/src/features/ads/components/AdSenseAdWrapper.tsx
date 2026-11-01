"use client";

import {
  ADSENSE_DISPLAY_ENABLED,
  AdSenseAd,
  type AdFormat,
  type AdSlotProps,
} from "@/lib/google-adsense";

interface AdSenseAdWrapperProps {
  format: AdFormat;
  slotId?: string;
  className?: string;
  /** 広告の枠の台帳の箱 (本番の実測。予約の高さになる) */
  slotBox: NonNullable<AdSlotProps["slotBox"]>;
}

/**
 * AdSenseAd の軽量クライアントラッパー。
 * Server Component の AffiliateAdSlot から間接的にレンダリングするために使用。
 */
export function AdSenseAdWrapper({ format, slotId, className, slotBox }: AdSenseAdWrapperProps) {
  if (!ADSENSE_DISPLAY_ENABLED) return null;
  return <AdSenseAd format={format} slotId={slotId} className={className} slotBox={slotBox} />;
}
