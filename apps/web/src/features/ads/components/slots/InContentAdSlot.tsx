import { cn } from "@stats47/components";

import { adSlotBox } from "@/lib/ad-placements";
import {
  ADSENSE_DISPLAY_ENABLED,
  AdSenseAd,
  type AdSlotConfig,
} from "@/lib/google-adsense";


import { MANUAL_AD_DESKTOP_ONLY_CLASS } from "../../constants/manual-ad-policy";

import { AdCell } from "./AdCell";

interface InContentAdSlotProps {
  /** 表示するスロット定数（slotId が空文字なら描画しない） */
  slot: AdSlotConfig;
  className?: string;
}

/**
 * 本文導線中の記事内 AdSense 枠（エディトリアル罫線 + "広告" ラベル）。
 *
 * fluid / article フォーマット想定。予約の高さと開発中の代わりの表示は、広告の枠の台帳
 * (config/ads/placements.json の adsense-body) の箱を AdSenseAd へ渡して決める。
 * slot.slotId が空文字（未発行プレースホルダ）なら何も描画しない（graceful degradation）。
 *
 * 配置規約: ハブ / 一覧 / 記事面のセクション区切りに 1 枠まで（fluid はページ 1 枠）。
 * ファーストビュー内には置かない。
 *
 * **モバイルでは描画しない** (2026-08-04)。理由と実測は
 * `../../constants/manual-ad-policy.ts` を参照。
 */
export function InContentAdSlot({
  slot,
  className,
}: InContentAdSlotProps) {
  if (!ADSENSE_DISPLAY_ENABLED || !slot.slotId) return null;
  return (
    <div className={cn(MANUAL_AD_DESKTOP_ONLY_CLASS, className)}>
      {/* 本文の広告のセル (左上に「広告」・中身は中央)。箱は広告の枠の台帳の「本文の AdSense」(本番の実測 780×280 を上限に中央) */}
      <AdCell label="広告">
        <AdSenseAd
          slotId={slot.slotId}
          format={slot.format}
          showLabel={false}
          slotBox={adSlotBox("adsense-body")}
        />
      </AdCell>
    </div>
  );
}
