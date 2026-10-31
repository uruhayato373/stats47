import { adSlotBox } from "@/lib/ad-placements";
import {
  ADSENSE_DISPLAY_ENABLED,
  AdSenseAd,
  type AdSlotConfig,
} from "@/lib/google-adsense";

import { AdCell } from "./AdCell";

interface RailAdSlotProps {
  /** 表示するスロット定数（slotId が空文字なら描画しない） */
  slot: AdSlotConfig;
}

/**
 * 右レール内の広告枠 (rectangle 想定)。
 *
 * 2026-10-31 (オーナー判断「広告や PR というカードで囲む必要はない」): 見出し「広告」のカード (RailCard) をやめ、
 * 本文と同じ広告のセル (左上に小さな「広告」・枠の線なし) にした。余白は 0 にする: 右レール 316px の中で
 * 300×250 の在庫が配信され得る幅 (300px 以上) を残すため (p-4 だと 284px になり 250 幅の枠へ落ちる)。
 * multiplex は入れない (全幅専用のため)。slot.slotId が空文字なら何も描画しない。
 */
export function RailAdSlot({ slot }: RailAdSlotProps) {
  if (!ADSENSE_DISPLAY_ENABLED || !slot.slotId) return null;
  return (
    <AdCell label="広告" className="overflow-hidden p-0">
      <AdSenseAd
        format={slot.format}
        slotId={slot.slotId}
        showLabel={false}
        // 箱は広告の枠の台帳の「右レールの AdSense」(本番の実測。縦長の枠は 2026-10-30 に外した)
        slotBox={adSlotBox("adsense-rail-rect")}
      />
    </AdCell>
  );
}
