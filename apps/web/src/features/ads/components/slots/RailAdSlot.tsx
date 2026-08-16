import { SurfaceCard } from "@/components/surface";

import {
  ADSENSE_DISPLAY_ENABLED,
  AdSenseAd,
  type AdSlotConfig,
} from "@/lib/google-adsense";

interface RailAdSlotProps {
  /** 表示するスロット定数（slotId が空文字なら描画しない） */
  slot: AdSlotConfig;
}

/**
 * 右レール内の広告枠（SurfaceCard + "広告" ヘッダ、rectangle 想定）。
 *
 * RightRailWidgets の AdSense 枠と同じ文法。multiplex は入れない（全幅専用のため）。
 * slot.slotId が空文字なら何も描画しない。
 *
 * 本体の padding は `p-2` 固定。右レール 316px から左右 8px を引いた 300px が
 * 300×250 の在庫が配信され得る最小幅で、`p-4` にすると 284px となり
 * 250 幅の枠へ落ちる。レール幅を変えるときはここも同時に見ること
 * (`.claude/rules/ui-components.md` の寸法メモ)。
 */
export function RailAdSlot({ slot }: RailAdSlotProps) {
  if (!ADSENSE_DISPLAY_ENABLED || !slot.slotId) return null;
  return (
    <SurfaceCard className="p-0">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium text-muted-foreground">広告</h3>
      </div>
      <div className="flex justify-center overflow-hidden p-2">
        <AdSenseAd format={slot.format} slotId={slot.slotId} showLabel={false} />
      </div>
    </SurfaceCard>
  );
}
