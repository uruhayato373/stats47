import { adSlotBox } from "@/lib/ad-placements";
import {
  ADSENSE_DISPLAY_ENABLED,
  AdSenseAd,
  type AdSlotConfig,
} from "@/lib/google-adsense";

interface InFeedAdSlotProps {
  /** インフィード広告のスロット定数 (layoutKey が要る。slotId か layoutKey が空なら描画しない) */
  slot: AdSlotConfig;
}

/**
 * 記事の一覧の中に 1 件だけ入れるインフィード広告 (2026-11-12 オーナー決定)。一覧の行と同じ幅で、上に小さな「広告」を出す。
 * Google の規約で広告は「広告」か「スポンサーリンク」と表記し、広告と分からないように見せない
 * (support.google.com/adsense/answer/1346295・2026-11-12 確認)。一覧の部品 (RailLinksCard) の insertAfter に渡す。
 * 広告と広告の間にはコンテンツを 3 件以上挟む (Google の推奨。support.google.com/adsense/answer/9189037)。
 */
export function InFeedAdSlot({ slot }: InFeedAdSlotProps) {
  if (!ADSENSE_DISPLAY_ENABLED || !slot.slotId || !slot.layoutKey) return null;
  return (
    <AdSenseAd
      format={slot.format}
      slotId={slot.slotId}
      layoutKey={slot.layoutKey}
      slotBox={adSlotBox("adsense-infeed")}
    />
  );
}
