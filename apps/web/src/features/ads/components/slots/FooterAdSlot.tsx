import { cn } from "@stats47/components";

import { AdSenseAd, CONTENT_FOOTER } from "@/lib/google-adsense";

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
 */
export function FooterAdSlot({
  hideLabel = false,
  className,
}: FooterAdSlotProps) {
  if (!CONTENT_FOOTER.slotId) return null;
  return (
    <div className={cn("mt-12", className)}>
      {!hideLabel && <AdSlotLabel />}
      <AdSenseAd
        slotId={CONTENT_FOOTER.slotId}
        format={CONTENT_FOOTER.format}
        showLabel={false}
      />
    </div>
  );
}
