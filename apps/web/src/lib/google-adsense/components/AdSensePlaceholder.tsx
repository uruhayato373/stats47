/**
 * Google AdSense広告のプレースホルダーコンポーネント
 *
 * 開発環境で広告の代わりに表示するプレースホルダーです。
 * 外枠 class と予約高さは本番の `AdSenseAd` と共有（`ad-frame.ts`）しているため、
 * ローカルで見える枠は本番で確保される枠と同じ寸法になります。
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
      style={{ minHeight: `${reservedMinHeight}px` }}
    >
      <div
        className={`flex flex-1 items-center justify-center border-2 border-dashed border-muted-foreground/20 bg-muted ${
          isFlexible ? "w-full" : fixedSizeClass
        }`.trim()}
        style={{ maxWidth: "100%", minHeight: `${reservedMinHeight}px` }}
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
              ? `フレキシブル幅 ・ 予約高 ${reservedMinHeight}px`
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
