import { Megaphone } from "lucide-react";

import { RailCard } from "@/components/surface";

import { adSlotBox } from "@/lib/ad-placements";
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
 * 右レール内の広告枠（RailCard title="広告"、rectangle 想定）。
 *
 * RightRailWidgets の AdSense 枠と同じ文法。multiplex は入れない（全幅専用のため）。
 * slot.slotId が空文字なら何も描画しない。
 *
 * 本体の横 padding は 7px 固定。右レール 316px からカードの線 (左右 1px) と左右 7px を引いた 300px が
 * 300×250 の在庫が配信され得る最小幅で、`p-4` にすると 282px となり 250 幅の枠へ落ちる。
 * (2026-10-28 3 巡目まで本文は .cn-card-content の px-4 に負けて 284px になっていた。本文を cn-card-content
 * なしで描くようにしたので、ここの値がそのまま効く。)
 * レール幅を変えるときはここも同時に見ること (`.claude/rules/ui-components.md` の寸法メモ)。
 *
 * AdSense が無効のとき (開発のプレースホルダー) も同じカードの中に文字だけを置き、別の面を作らない。
 */
export function RailAdSlot({ slot }: RailAdSlotProps) {
  if (!ADSENSE_DISPLAY_ENABLED || !slot.slotId) return null;
  return (
    <RailCard title="広告" icon={<Megaphone />} bodyClassName="flex justify-center overflow-hidden px-[7px] py-2">
      <AdSenseAd
        format={slot.format}
        slotId={slot.slotId}
        showLabel={false}
        // 箱は広告の枠の台帳の「右レールの AdSense」(本番の実測。縦長の枠は 2026-10-30 に外した)
        slotBox={adSlotBox("adsense-rail-rect")}
      />
    </RailCard>
  );
}
