import { cn } from "@stats47/components";

import {
  ADSENSE_DISPLAY_ENABLED,
  AdSenseAd,
  CONTENT_FOOTER,
} from "@/lib/google-adsense";

import { MANUAL_AD_DESKTOP_ONLY_CLASS } from "../../constants/manual-ad-policy";

import { AdSlotLabel } from "./AdSlotLabel";

interface FooterAdSlotProps {
  /** "広告" ラベルを隠す */
  hideLabel?: boolean;
  className?: string;
}

/**
 * コンテンツ末尾の全幅フッター広告（Multiplex / 関連コンテンツ型グリッド）。
 *
 * 一覧・ハブページのメインコンテンツ最下部専用。rail には置かない（multiplex は全幅のみ）。
 * CONTENT_FOOTER（stats47-content-footer-multiplex）を共用する。
 *
 * **モバイルでは描画しない** (2026-08-04)。理由と実測は
 * `../../constants/manual-ad-policy.ts` を参照。
 */
export function FooterAdSlot({
  hideLabel = false,
  className,
}: FooterAdSlotProps) {
  if (!ADSENSE_DISPLAY_ENABLED || !CONTENT_FOOTER.slotId) return null;
  return (
    <div className={cn(MANUAL_AD_DESKTOP_ONLY_CLASS, "mt-12", className)}>
      {!hideLabel && <AdSlotLabel />}
      <AdSenseAd
        slotId={CONTENT_FOOTER.slotId}
        format={CONTENT_FOOTER.format}
        showLabel={false}
      />
    </div>
  );
}
