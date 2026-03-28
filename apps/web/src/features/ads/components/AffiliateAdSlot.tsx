import { ExternalLink } from "lucide-react";

import {
  RANKING_PAGE_FOOTER,
  RANKING_PAGE_TABLE_SIDE,
} from "@/lib/google-adsense";

import {
  AFFILIATE_THEME,
  CATEGORY_AFFILIATE_MAP,
} from "../constants/affiliate-category";
import { resolveAffiliateAd } from "../services";

import { AdSenseAdWrapper } from "./AdSenseAdWrapper";
import { TrackedAffiliateLink } from "./tracked-affiliate-link";

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
 * 1. DB / 定数からアフィリエイト広告を解決
 * 2. なければ AdSense にフォールバック
 */
export async function AffiliateAdSlot({
  categoryKey,
  position = "sidebar",
}: AffiliateAdSlotProps) {
  const locationCode = mapPositionToLocation(position);
  const ad = await resolveAffiliateAd(categoryKey, locationCode);

  // アフィリエイト広告があればそれを表示
  if (ad) {
    const affiliateCategory = CATEGORY_AFFILIATE_MAP[categoryKey];
    const theme = affiliateCategory ? AFFILIATE_THEME[affiliateCategory] : null;

    return (
      <div
        className={`rounded-xl border ${theme?.border ?? "border-border"} ${theme?.bg ?? "bg-muted/50"} p-4`}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground/70">PR</span>
        </div>
        <TrackedAffiliateLink
          href={ad.href}
          category={affiliateCategory ?? "other"}
          label={ad.title}
          position={position}
          className="flex items-center justify-between gap-3 rounded-lg bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md"
        >
          <div>
            <p className="text-sm font-bold text-foreground">
              {theme?.emoji ? `${theme.emoji} ` : ""}
              {ad.title}
            </p>
          </div>
          <ExternalLink
            size={16}
            className={`shrink-0 ${theme?.icon ?? "text-muted-foreground/70"}`}
          />
        </TrackedAffiliateLink>
      </div>
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
