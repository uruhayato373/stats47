import { cn } from "@stats47/components";
import { Megaphone } from "lucide-react";

import { SectionCard } from "@/components/surface";

import {
  ADSENSE_DISPLAY_ENABLED,
  AdSenseAd,
  CONTENT_FOOTER,
} from "@/lib/google-adsense";

import { MANUAL_AD_DESKTOP_ONLY_CLASS } from "../../constants/manual-ad-policy";

interface FooterAdSlotProps {
  /** "広告" の見出しを隠す (見出しなしのカードにする) */
  hideLabel?: boolean;
  className?: string;
}

/**
 * コンテンツ末尾の全幅フッター広告（Multiplex / 関連コンテンツ型グリッド）。
 *
 * 一覧・ハブページのメインコンテンツ最下部専用。rail には置かない（multiplex は全幅のみ）。
 * CONTENT_FOOTER（stats47-content-footer-multiplex）を共用する。
 *
 * 見た目は home の右レールの広告 (RailAdSlot) と同じ見出し付きカード (見出し「広告」) にする。
 * AdSense ポリシー (広告と非広告コンテンツの明確な区別) は見出しが満たす。
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
    <div className={cn(MANUAL_AD_DESKTOP_ONLY_CLASS, className)}>
      <SectionCard
        title={hideLabel ? undefined : "広告"}
        icon={hideLabel ? undefined : <Megaphone />}
        aria-label="広告"
      >
        <AdSenseAd
          slotId={CONTENT_FOOTER.slotId}
          format={CONTENT_FOOTER.format}
          showLabel={false}
        />
      </SectionCard>
    </div>
  );
}
