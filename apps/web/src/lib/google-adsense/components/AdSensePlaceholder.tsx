/**
 * Google AdSense広告のプレースホルダーコンポーネント
 *
 * 開発環境で広告の代わりに表示するプレースホルダーです。
 * 実際の広告と同じサイズで表示され、レイアウト確認に使用できます。
 */

import { AD_SIZES, AdFormat } from "../types";

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

  // インフィードと記事内広告はフレキシブルなので、固定サイズを使用
  const isFlexible = format === "infeed" || format === "article";
  const width = isFlexible ? 300 : size.desktop.width;
  const height = isFlexible ? 250 : size.desktop.height;

  return (
    <div
      className={`
        flex items-center justify-center bg-muted border-2 border-dashed border-muted-foreground/20 rounded-lg
        ${className}
        ${isFlexible ? "w-full" : ""}
        ${!isFlexible && format === "banner" ? "w-full max-w-[728px] h-[50px] md:h-[90px]" : ""}
        ${!isFlexible && format === "rectangle" ? "w-[300px] h-[250px] md:w-[336px] md:h-[280px]" : ""}
        ${!isFlexible && format === "skyscraper" ? "w-[160px] h-[600px]" : ""}
      `.trim().replace(/\s+/g, " ")}
      style={{
        maxWidth: "100%",
        ...(isFlexible ? { height: "250px" } : {}),
      }}
    >
      <div className="text-center p-4">
        <div className="text-sm font-medium text-muted-foreground">
          広告プレースホルダー
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {size.description}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {isFlexible
            ? "フレキシブルサイズ"
            : `${width}x${height} (デスクトップ)`}
        </div>
        {!isFlexible && (
          <div className="text-xs text-muted-foreground">
            {size.mobile.width}x{size.mobile.height} (モバイル)
          </div>
        )}
      </div>
    </div>
  );
}
