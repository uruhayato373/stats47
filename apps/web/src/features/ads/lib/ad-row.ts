import { ADSENSE_DISPLAY_ENABLED, type AdSlotConfig } from "@/lib/google-adsense";

import type { AdRowCell } from "../components/slots/AdRow";
import type { ResolvedAffiliateBanner } from "../types";

/** 広告の段の並び。左から順の枠の種類 */
export type AdRowPattern = ReadonlyArray<"adsense" | "affiliate">;

/**
 * 段の並びに中身を割り当てる。AdSense は adsenseSlots を、PR は banners を上の段から順に 1 つずつ使う
 * (同じ AdSense ユニットを 1 ページで重ねない。ADSENSE-SLOT-DEDUPE-01)。中身が尽きた枠と、AdSense を止めているときの
 * AdSense の枠は落とす (空の枠を作らない)。
 */
export function composeAdRows(
  patterns: readonly AdRowPattern[],
  adsenseSlots: readonly AdSlotConfig[],
  banners: readonly ResolvedAffiliateBanner[],
): AdRowCell[][] {
  const slots = ADSENSE_DISPLAY_ENABLED ? adsenseSlots.filter((slot) => slot.slotId) : [];
  let nextSlot = 0;
  let nextBanner = 0;
  return patterns.map((pattern) =>
    pattern.flatMap((kind): AdRowCell[] => {
      if (kind === "adsense") {
        const slot = slots[nextSlot];
        if (!slot) return [];
        nextSlot += 1;
        return [{ kind, slot }];
      }
      const banner = banners[nextBanner];
      if (!banner) return [];
      nextBanner += 1;
      return [{ kind, banner }];
    }),
  );
}
