import {
  RANKING_PAGE_FOOTER,
  RANKING_PAGE_TABLE_SIDE,
} from "@/lib/google-adsense";

import { CATEGORY_AFFILIATE_MAP } from "../constants/affiliate-category";
import { resolveAffiliateTextAds } from "../services";

import { AdSenseAdWrapper } from "./AdSenseAdWrapper";
import { AffiliateTextAdList } from "./AffiliateTextAdList";

import type { AffiliateLocationCode } from "../types";

interface AffiliateAdSlotProps {
  categoryKey: string;
  position?: "sidebar" | "footer";
}

function mapPositionToLocation(position: "sidebar" | "footer"): AffiliateLocationCode {
  return position === "footer" ? "footer" : "sidebar-bottom";
}

/**
 * アフィリエイト広告スロット。
 *
 * 優先順位:
 * 1. テキスト広告 (最大 2 件) を解決して並べて表示
 * 2. なければ AdSense にフォールバック
 */
export async function AffiliateAdSlot({
  categoryKey,
  position = "sidebar",
}: AffiliateAdSlotProps) {
  const locationCode = mapPositionToLocation(position);
  const ads = await resolveAffiliateTextAds(categoryKey, locationCode, 2);

  // アフィリエイトテキスト広告があればそれを表示
  if (ads.length > 0) {
    const affiliateCategory = CATEGORY_AFFILIATE_MAP[categoryKey] ?? null;
    return (
      <AffiliateTextAdList ads={ads} affiliateCategory={affiliateCategory} position={position} />
    );
  }

  // AdSense フォールバック
  const adSlot =
    position === "footer" ? RANKING_PAGE_FOOTER : RANKING_PAGE_TABLE_SIDE;

  return (
    <AdSenseAdWrapper
      format={adSlot.format}
      slotId={adSlot.slotId}
    />
  );
}
