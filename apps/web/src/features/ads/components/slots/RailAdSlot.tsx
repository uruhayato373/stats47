import { adSlotBox } from "@/lib/ad-placements";
import {
  ADSENSE_DISPLAY_ENABLED,
  AdSenseAd,
  type AdSlotConfig,
} from "@/lib/google-adsense";

import { RAIL_AD_CELL_CLASS } from "../../constants/manual-ad-policy";

import { AdCell } from "./AdCell";

interface RailAdSlotProps {
  /** 表示するスロット定数（slotId が空文字なら描画しない） */
  slot: AdSlotConfig;
  /**
   * 右レールの最後に置き、300×600 をヘッダー (56px) の下に追従させる (2026-11-12 オーナー決定。右レールの中身が本文より短く、
   * PC で下が空いていた)。右レールは flex の列なので、追従は右レールの終わり = 本文の終わりで止まりフッターに重ならない。
   * Google の追従広告の条件 (幅 300px 以下・縦だけ・同時に見える追従広告は 1 つ・PC だけ) は台帳の adsense-rail-sticky。
   * 1 ページに 1 つだけ使う
   */
  sticky?: boolean;
}

/**
 * 右レール内の広告枠 (rectangle 想定)。
 *
 * 2026-10-31 (オーナー判断「広告や PR というカードで囲む必要はない」): 見出し「広告」のカード (RailCard) をやめ、
 * 本文と同じ広告のセルにした。左右の余白は 8px まで: 右レール 316px の中で
 * 300×250 の在庫が配信され得る幅 (300px 以上) を残すため (p-4 だと 284px になり 250 幅の枠へ落ちる)。
 * 2026-11-25 (オーナー決定): 「広告」の表記をやめ、上下も 8px の余白にして四辺をそろえた (RAIL_AD_CELL_CLASS)。
 * multiplex は入れない (全幅専用のため)。slot.slotId が空文字なら何も描画しない。
 */
export function RailAdSlot({ slot, sticky = false }: RailAdSlotProps) {
  if (!ADSENSE_DISPLAY_ENABLED || !slot.slotId) return null;
  return (
    <AdCell
      label="広告"
      // 追従する枠はヘッダー (56px) の線の直下で止める (2026-11-25。それまでは 80px で、線から 24px 浮いていた)
      className={`${RAIL_AD_CELL_CLASS}${sticky ? " sticky top-14" : ""}`}
    >
      <AdSenseAd
        format={slot.format}
        slotId={slot.slotId}
        showLabel={false}
        // 箱は広告の枠の台帳の「右レールの AdSense」(本番の実測)。追従する枠は 300×600 (adsense-rail-sticky)
        slotBox={adSlotBox(sticky ? "adsense-rail-sticky" : "adsense-rail-rect")}
      />
    </AdCell>
  );
}
