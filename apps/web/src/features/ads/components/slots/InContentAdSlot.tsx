import { cn } from "@stats47/components";

import {
  ADSENSE_DISPLAY_ENABLED,
  AdSenseAd,
  type AdSlotConfig,
} from "@/lib/google-adsense";

import { MANUAL_AD_DESKTOP_ONLY_CLASS } from "../../constants/manual-ad-policy";

import { AdSlotLabel } from "./AdSlotLabel";

interface InContentAdSlotProps {
  /** 表示するスロット定数（slotId が空文字なら描画しない） */
  slot: AdSlotConfig;
  /** "広告" ラベルを隠す */
  hideLabel?: boolean;
  className?: string;
}

/**
 * 本文導線中の記事内 AdSense 枠（エディトリアル罫線 + "広告" ラベル）。
 *
 * fluid / article フォーマット想定。CLS 対策の min-height 予約は AdSenseAd 側が持つ。
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
  hideLabel = false,
  className,
}: InContentAdSlotProps) {
  if (!ADSENSE_DISPLAY_ENABLED || !slot.slotId) return null;
  return (
    <div className={cn(MANUAL_AD_DESKTOP_ONLY_CLASS, "my-8", className)}>
      {!hideLabel && <AdSlotLabel />}
      <AdSenseAd slotId={slot.slotId} format={slot.format} showLabel={false} />
    </div>
  );
}
