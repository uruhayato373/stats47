import React from "react";
import { AbsoluteFill } from "remotion";
import {
  BRAND,
  COLOR_SCHEMES,
  FONT,
  RADIUS,
  SPACING,
  type ThemeName,
} from "@/shared/themes/brand";
import type { AreaProfileIndicator } from "@/shared";

interface AreaProfileDetailSlideProps {
  areaName: string;
  type: "strengths" | "weaknesses";
  items: AreaProfileIndicator[];
  theme?: ThemeName;
}

/**
 * 地域プロファイル 詳細スライド (1080x1350, 4:5)
 *
 * 強み TOP5 または 弱み TOP5 を縦に並べて表示。
 */
export const AreaProfileDetailSlide: React.FC<AreaProfileDetailSlideProps> = ({
  areaName,
  type,
  items,
  theme = "dark",
}) => {
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";
  const isStrength = type === "strengths";
  const accentColor = isStrength ? BRAND.success : BRAND.danger;
  const sectionTitle = isStrength ? "強み TOP5" : "弱み TOP5";

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        color: colors.foreground,
        fontFamily: FONT.family,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          borderTop: `4px solid ${accentColor}`,
          backgroundColor: colors.card,
          padding: `14px ${SPACING.lg}px 16px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <div
          style={{
            fontSize: 24,
            fontWeight: FONT.weight.bold,
            color: colors.muted,
            letterSpacing: 2,
          }}
        >
          {areaName}
        </div>
        <div
          style={{
            fontSize: 44,
            fontWeight: FONT.weight.black,
            color: accentColor,
            letterSpacing: 1,
          }}
        >
          {sectionTitle}
        </div>
      </div>

      {/* アイテム一覧 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: `${SPACING.md}px ${SPACING.lg}px`,
          gap: SPACING.sm,
        }}
      >
        {items.slice(0, 5).map((item, index) => (
          <div
            key={item.label}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              padding: `0 ${SPACING.md}px`,
              backgroundColor: colors.card,
              borderRadius: RADIUS.md,
              borderLeft: `6px solid ${accentColor}`,
              gap: SPACING.sm,
            }}
          >
            {/* 順位バッジ */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: RADIUS.sm,
                backgroundColor: accentColor,
                color: BRAND.white,
                fontSize: 28,
                fontWeight: FONT.weight.black,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {index + 1}
            </div>

            {/* 指標名 */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <div
                style={{
                  fontSize: 30,
                  fontWeight: FONT.weight.black,
                  color: colors.foreground,
                  lineHeight: 1.2,
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: FONT.weight.medium,
                  color: colors.muted,
                }}
              >
                全国 {item.rank}位
              </div>
            </div>

            {/* 値 */}
            <div
              style={{
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: 36,
                  fontWeight: FONT.weight.black,
                  color: BRAND.secondary,
                }}
              >
                {item.value.toLocaleString()}
              </span>
              <span
                style={{
                  fontSize: 20,
                  color: colors.muted,
                  marginLeft: 4,
                  fontWeight: FONT.weight.medium,
                }}
              >
                {item.unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* フッター */}
      <div
        style={{
          backgroundColor: isDark ? colors.card : "#F1F5F9",
          borderTop: `1px solid ${colors.border}`,
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: FONT.weight.black,
            color: BRAND.primary,
            letterSpacing: 1,
          }}
        >
          stats47.jp
        </div>
        <div style={{ width: 1, height: 16, backgroundColor: colors.border }} />
        <div
          style={{
            fontSize: 20,
            fontWeight: FONT.weight.medium,
            color: colors.muted,
            letterSpacing: 1,
          }}
        >
          統計で見る都道府県
        </div>
      </div>
    </AbsoluteFill>
  );
};
