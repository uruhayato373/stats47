import React from "react";
import {
  Landscape,
  SafeZone,
  BRAND,
  FONT,
  SPACING,
  type ThemeName,
} from "@/shared";

interface LandscapePreviewProps {
  theme?: ThemeName;
  showGuides?: boolean;
}

/**
 * 横型レイアウトのプレビュー用コンポジション
 *
 * Landscape + SafeZone の動作確認に使用。
 * OGP 画像 (1200x630) や YouTube サムネイル (1280x720) のプレビュー。
 */
export const LandscapePreview: React.FC<LandscapePreviewProps> = ({
  theme = "light",
  showGuides = true,
}) => {
  return (
    <Landscape theme={theme}>
      <SafeZone showGuides={showGuides} margin={3}>
        <div
          style={{
            display: "flex",
            height: "100%",
            gap: SPACING.lg,
          }}
        >
          {/* 左カラム */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "inline-block",
                backgroundColor: BRAND.primary,
                color: BRAND.white,
                padding: `${SPACING.xs}px ${SPACING.sm}px`,
                borderRadius: 6,
                fontSize: 14,
                fontWeight: FONT.weight.bold,
                marginBottom: SPACING.sm,
                alignSelf: "flex-start",
              }}
            >
              stats47
            </div>
            <h1
              style={{
                fontSize: 36,
                fontWeight: FONT.weight.black,
                lineHeight: 1.2,
                margin: `${SPACING.sm}px 0`,
              }}
            >
              横型レイアウト
            </h1>
            <p
              style={{
                fontSize: 16,
                opacity: 0.6,
              }}
            >
              OGP: 1200x630 / YouTube: 1280x720
            </p>
          </div>

          {/* 右カラム */}
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
                width: "90%",
                padding: SPACING.md,
                backgroundColor: theme === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.05)",
                borderRadius: 12,
                border: `1px solid ${theme === "light" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"}`,
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: 20, fontWeight: FONT.weight.medium }}>
                コンテンツ領域
              </p>
              <p style={{ fontSize: 14, opacity: 0.5, marginTop: SPACING.xs }}>
                Theme: {theme}
              </p>
            </div>
          </div>
        </div>
      </SafeZone>
    </Landscape>
  );
};
