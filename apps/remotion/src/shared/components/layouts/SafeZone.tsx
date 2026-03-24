import React from "react";
import { AbsoluteFill } from "remotion";

interface SafeZoneProps {
  children: React.ReactNode;
  /** セーフゾーンのマージン（%）。デフォルト: 5 */
  margin?: number;
  /** セーフゾーンガイドの表示。デフォルト: false */
  showGuides?: boolean;
}

/**
 * SNS セーフゾーンレイアウト
 *
 * Instagram / TikTok 等の UI 要素（いいね、コメント、プロフィール等）が
 * 被らないよう、コンテンツを内側に配置するレイアウト。
 * `showGuides` を true にするとセーフゾーン境界を可視化できる。
 */
export const SafeZone: React.FC<SafeZoneProps> = ({
  children,
  margin = 5,
  showGuides = false,
}) => {
  return (
    <AbsoluteFill>
      {/* ガイド表示 */}
      {showGuides && (
        <AbsoluteFill
          style={{
            border: `2px dashed rgba(255, 0, 0, 0.5)`,
            top: `${margin}%`,
            left: `${margin}%`,
            right: `${margin}%`,
            bottom: `${margin}%`,
            width: "auto",
            height: "auto",
            pointerEvents: "none",
          }}
        />
      )}

      {/* コンテンツ領域 */}
      <AbsoluteFill
        style={{
          top: `${margin}%`,
          left: `${margin}%`,
          right: `${margin}%`,
          bottom: `${margin}%`,
          width: "auto",
          height: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
