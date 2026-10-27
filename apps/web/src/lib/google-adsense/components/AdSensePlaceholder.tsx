/**
 * Google AdSense広告のプレースホルダーコンポーネント
 *
 * 開発環境で広告の代わりに表示するプレースホルダーです。
 * 外枠 class は本番の `AdSenseAd` と共有（`ad-frame.ts`）しています。
 *
 * 枠と地は広告スロット側のカード (RailAdSlot / FooterAdSlot の見出し「広告」付き Card) が持つので、
 * ここでは枠も地の色も描かず、カードの地の上に文字だけを置く (カードの中に別の面を作らない。
 * 2026-10-28 3 巡目。muted の地がカードの中のもう 1 枚の面に見えていた)。
 * 高さは本番の予約高と同じだが、フレキシブル枠 (Multiplex 300px など) は本文を占めないよう
 * PLACEHOLDER_MAX_HEIGHT までに抑え、本番の予約高を文字で示す。
 */

import { AD_SIZES, AdFormat } from "../types";

import {
  AD_CONTAINER_CLASS,
  getAdReservedMinHeight,
  isFlexibleAdFormat,
} from "./ad-frame";

interface AdSensePlaceholderProps {
  /**
   * 広告フォーマット
   */
  format: AdFormat;

  /**
   * カスタムクラス名
   */
  className?: string;
}

/** フレキシブル枠のプレースホルダーの高さの上限 (px)。固定サイズの枠 (300×250 等) には効かせない */
const PLACEHOLDER_MAX_HEIGHT = 160;

/**
 * 開発環境用の広告プレースホルダー
 */
export function AdSensePlaceholder({
  format,
  className = "",
}: AdSensePlaceholderProps) {
  const size = AD_SIZES[format];
  const isFlexible = isFlexibleAdFormat(format);
  // 本番と同じ予約高を使う。旧実装はフレキシブル枠を一律 250px の固定 height で描いており、
  // 記事内 120px / Multiplex 300px という実際の予約高と食い違っていた。
  const reservedMinHeight = getAdReservedMinHeight(format);
  const placeholderHeight = isFlexible
    ? Math.min(reservedMinHeight, PLACEHOLDER_MAX_HEIGHT)
    : reservedMinHeight;

  const fixedSizeClass = isFlexible
    ? ""
    : format === "banner"
      ? "w-full max-w-[728px]"
      : format === "rectangle"
        ? "w-[300px] md:w-[336px]"
        : format === "skyscraper"
          ? "w-[160px]"
          : "";

  return (
    <div
      className={`${AD_CONTAINER_CLASS} ${className}`.trim()}
      style={{ minHeight: `${placeholderHeight}px` }}
    >
      <div
        className={`flex flex-1 items-center justify-center ${
          isFlexible ? "w-full" : fixedSizeClass
        }`.trim()}
        style={{ maxWidth: "100%", minHeight: `${placeholderHeight}px` }}
      >
        <div className="p-4 text-center">
          <div className="text-sm font-medium text-muted-foreground">
            広告プレースホルダー
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {size.description}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {isFlexible
              ? `フレキシブル幅 ・ 本番の予約高 ${reservedMinHeight}px`
              : `${size.desktop.width}x${size.desktop.height} (デスクトップ)`}
          </div>
          {!isFlexible && (
            <div className="text-xs text-muted-foreground">
              {size.mobile.width}x{size.mobile.height} (モバイル)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
