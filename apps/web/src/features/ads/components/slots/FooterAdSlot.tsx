import { cn } from "@stats47/components";

import { adSlotBox } from "@/lib/ad-placements";
import {
  ADSENSE_DISPLAY_ENABLED,
  AdSenseAd,
  CONTENT_FOOTER,
} from "@/lib/google-adsense";

import { MANUAL_AD_DESKTOP_ONLY_CLASS } from "../../constants/manual-ad-policy";

import { AdCell } from "./AdCell";

interface FooterAdSlotProps {
  className?: string;
}

/**
 * コンテンツ末尾の全幅フッター広告（Multiplex / 関連コンテンツ型グリッド）。
 *
 * 一覧・ハブページのメインコンテンツ最下部専用。rail には置かない（multiplex は全幅のみ）。
 * CONTENT_FOOTER（stats47-content-footer-multiplex）を共用する。
 *
 * 見た目は本文の広告のセル (AdCell。左上に「広告」・中身は中央。2026-10-30。旧: 見出し「広告」のカード)。
 * AdSense ポリシー (広告と非広告コンテンツの明確な区別) は「広告」のラベルが満たす。
 *
 * **モバイルでは描画しない** (2026-08-04)。理由と実測は
 * `../../constants/manual-ad-policy.ts` を参照。
 */
export function FooterAdSlot({
  className,
}: FooterAdSlotProps) {
  if (!ADSENSE_DISPLAY_ENABLED || !CONTENT_FOOTER.slotId) return null;
  return (
    <div className={cn(MANUAL_AD_DESKTOP_ONLY_CLASS, className)}>
      {/* 本文の広告のセル。箱は広告の枠の台帳の「ページ末の関連コンテンツ型」(本番の実測 780×466 を上限に中央) */}
      <AdCell label="広告">
        <AdSenseAd
          slotId={CONTENT_FOOTER.slotId}
          format={CONTENT_FOOTER.format}
          showLabel={false}
          slotBox={adSlotBox("adsense-footer")}
        />
      </AdCell>
    </div>
  );
}
