import { SurfaceCard } from "@/components/surface";
import { AdSenseAd, type AdSlotConfig } from "@/lib/google-adsense";

interface RailAdSlotProps {
  /** 表示するスロット定数（slotId が空文字なら描画しない） */
  slot: AdSlotConfig;
}

/**
 * 右レール内の広告枠（SurfaceCard + "広告" ヘッダ、rectangle 想定）。
 *
 * RightRailWidgets の AdSense 枠と同じ文法。multiplex は入れない（全幅専用のため）。
 * slot.slotId が空文字なら何も描画しない。
 */
export function RailAdSlot({ slot }: RailAdSlotProps) {
  if (!slot.slotId) return null;
  return (
    <SurfaceCard className="p-0">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium text-muted-foreground">広告</h3>
      </div>
      <div className="flex justify-center overflow-hidden p-4">
        <AdSenseAd format={slot.format} slotId={slot.slotId} showLabel={false} />
      </div>
    </SurfaceCard>
  );
}
