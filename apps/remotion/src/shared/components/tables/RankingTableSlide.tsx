import React from "react";
import { AbsoluteFill } from "remotion";

import { formatValueWithPrecision } from "@stats47/utils";
import { BRAND, COLOR_SCHEMES, FONT, RADIUS, SPACING, type ThemeName } from "../../themes/brand";
import type { RankingEntry, RankingMeta } from "../../types/ranking";

interface RankingTableSlideProps {
  meta: RankingMeta;
  entries: RankingEntry[];
  theme?: ThemeName;
  precision?: number;
  /** 表示用タイトル。指定時は meta.title を上書きする */
  displayTitle?: string;
}

/**
 * ランキングテーブルスライド (1080x1350, 4:5)
 *
 * Instagram カルーセルの全47都道府県テーブルスライド。
 * CoverSlide の次に配置し、全体像を提示する。
 * 47都道府県を3列で表示する。
 */
export const RankingTableSlide: React.FC<RankingTableSlideProps> = ({
  meta,
  entries,
  theme = "light",
  precision = 0,
  displayTitle,
}) => {
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";

  const sorted = [...entries].sort((a, b) => a.rank - b.rank);
  const itemsPerCol = Math.ceil(sorted.length / 3);

  const columns = [
    sorted.slice(0, itemsPerCol),
    sorted.slice(itemsPerCol, itemsPerCol * 2),
    sorted.slice(itemsPerCol * 2),
  ];

  const line1 = meta.yearName
    ? `${meta.yearName} 都道府県ランキング`
    : "都道府県ランキング";
  const attrParts: string[] = [];
  if (meta.demographicAttr) attrParts.push(meta.demographicAttr);
  if (meta.normalizationBasis) attrParts.push(meta.normalizationBasis);
  const attrText = attrParts.join("・");

  const rowBgEven = isDark ? "#1E293B" : colors.card;
  const rowBgOdd = isDark ? "#0F172A" : colors.background;
  const rankColor = isDark ? "#818CF8" : BRAND.primary;

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
          borderTop: `4px solid ${BRAND.primary}`,
          backgroundColor: colors.card,
          padding: `12px ${SPACING.lg}px 14px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: FONT.weight.bold,
            color: colors.muted,
            letterSpacing: 2,
          }}
        >
          {line1}
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: FONT.weight.black,
            color: colors.foreground,
            letterSpacing: 1,
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          {displayTitle || meta.title}
        </div>
        {attrText && (
          <div
            style={{
              fontSize: 22,
              fontWeight: FONT.weight.medium,
              color: colors.muted,
              backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              padding: "3px 16px",
              borderRadius: RADIUS.full,
              letterSpacing: 1,
            }}
          >
            {attrText}
          </div>
        )}
      </div>

      {/* テーブル */}
      <div
        style={{
          flex: 1,
          display: "flex",
          padding: `${SPACING.sm}px ${SPACING.lg}px`,
          gap: SPACING.sm,
        }}
      >
        {columns.map((col, colIdx) => (
          <div
            key={colIdx}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {col.map((entry, rowIdx) => (
              <div
                key={entry.areaCode}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "4px 8px",
                  backgroundColor: rowIdx % 2 === 0 ? rowBgEven : rowBgOdd,
                  borderRadius: 4,
                  flex: 1,
                }}
              >
                <div
                  style={{
                    width: 40,
                    fontSize: 22,
                    fontWeight: FONT.weight.bold,
                    color: rankColor,
                    textAlign: "center",
                  }}
                >
                  {entry.rank}
                </div>
                <div
                  style={{
                    flex: 1,
                    fontSize: 22,
                    fontWeight: FONT.weight.bold,
                  }}
                >
                  {entry.areaName}
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: FONT.weight.bold,
                    textAlign: "right",
                  }}
                >
                  {formatValueWithPrecision(entry.value, precision)}
                  <span
                    style={{
                      fontSize: 14,
                      color: colors.muted,
                      marginLeft: 4,
                    }}
                  >
                    {meta.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* フッター ブランドバー */}
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
