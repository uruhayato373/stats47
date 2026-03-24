import React from "react";
import {
  FullScreen,
  SafeZone,
  BRAND,
  FONT,
  SPACING,
  type ThemeName,
} from "@/shared";

interface PortraitPreviewProps {
  theme?: ThemeName;
  showGuides?: boolean;
}

/**
 * 縦型レイアウトのプレビュー用コンポジション
 *
 * FullScreen + SafeZone の動作確認に使用。
 * Remotion Studio で theme / showGuides を切り替えて確認できる。
 */
export const PortraitPreview: React.FC<PortraitPreviewProps> = ({
  theme = "dark",
  showGuides = true,
}) => {
  return (
    <FullScreen theme={theme}>
      <SafeZone showGuides={showGuides}>
        {/* ヘッダー */}
        <div
          style={{
            textAlign: "center",
            marginBottom: SPACING.xl,
          }}
        >
          <div
            style={{
              display: "inline-block",
              backgroundColor: BRAND.primary,
              color: BRAND.white,
              padding: `${SPACING.xs}px ${SPACING.md}px`,
              borderRadius: 8,
              fontSize: 24,
              fontWeight: FONT.weight.bold,
              marginBottom: SPACING.sm,
            }}
          >
            stats47
          </div>
          <h1
            style={{
              fontSize: 48,
              fontWeight: FONT.weight.black,
              lineHeight: 1.2,
              margin: `${SPACING.md}px 0`,
            }}
          >
            縦型レイアウト
          </h1>
          <p
            style={{
              fontSize: 24,
              opacity: 0.6,
            }}
          >
            1080 x 1920 (9:16)
          </p>
        </div>

        {/* コンテンツ領域 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "80%",
              padding: SPACING.lg,
              backgroundColor: theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
              borderRadius: 16,
              border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 28, fontWeight: FONT.weight.medium }}>
              ここにコンテンツが入ります
            </p>
            <p style={{ fontSize: 20, opacity: 0.5, marginTop: SPACING.sm }}>
              Theme: {theme}
            </p>
          </div>
        </div>

        {/* フッター */}
        <div
          style={{
            textAlign: "center",
            fontSize: 18,
            opacity: 0.4,
          }}
        >
          SafeZone: {showGuides ? "ON" : "OFF"}
        </div>
      </SafeZone>
    </FullScreen>
  );
};
