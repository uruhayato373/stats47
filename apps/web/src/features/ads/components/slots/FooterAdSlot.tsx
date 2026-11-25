import { cn } from "@stats47/components";

import { adSlotBox } from "@/lib/ad-placements";
import {
  ADSENSE_DISPLAY_ENABLED,
  AdSenseAd,
  CONTENT_FOOTER,
} from "@/lib/google-adsense";

import { AdCell } from "./AdCell";

interface FooterAdSlotProps {
  className?: string;
}

/**
 * コンテンツ末尾のフッター広告 (固定 300×250 の表示広告)。
 *
 * 一覧・ハブページのメインコンテンツ最下部専用。rail には置かない。
 * CONTENT_FOOTER（stats47-content-footer-rect）を共用する。関連コンテンツ型 (Multiplex) は 2026-10-31 にやめた
 * (固定の大きさにできないため。経緯は constants.ts の CONTENT_FOOTER)。
 *
 * 見た目は本文の広告のセル (AdCell。左上に「広告」・中身は中央。2026-10-30。旧: 見出し「広告」のカード)。
 * AdSense ポリシー (広告と非広告コンテンツの明確な区別) は「広告」のラベルが満たす。
 *
 * モバイルでも描画する (2026-11-03 オーナー決定)。自動広告は 2026-11-04 から管理画面でオン (収益化戦略 §3.1・constants.ts の冒頭)。
 * 旧: モバイルでは描画しなかった (2026-08-04。`../../constants/manual-ad-policy.ts`)。
 */
export function FooterAdSlot({
  className,
}: FooterAdSlotProps) {
  if (!ADSENSE_DISPLAY_ENABLED || !CONTENT_FOOTER.slotId) return null;
  return (
    <div className={cn(className)}>
      {/* 本文の広告のセル。箱は広告の枠の台帳の adsense-footer (固定 300×250) */}
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
