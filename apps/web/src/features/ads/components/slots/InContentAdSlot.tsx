import { cn } from "@stats47/components";

import { AdSenseAd, type AdSlotConfig } from "@/lib/google-adsense";

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
 */
export function InContentAdSlot({
  slot,
  hideLabel = false,
  className,
}: InContentAdSlotProps) {
  if (!slot.slotId) return null;
  return (
    <div className={cn("my-8", className)}>
      {!hideLabel && <AdSlotLabel />}
      <AdSenseAd slotId={slot.slotId} format={slot.format} showLabel={false} />
    </div>
  );
}
