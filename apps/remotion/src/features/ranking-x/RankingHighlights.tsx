import React from "react";
import { AbsoluteFill } from "remotion";

import {
  BRAND,
  COLOR_SCHEMES,
  FONT,
  RADIUS,
  SPACING,
  type ColorScheme,
  type ThemeName,
} from "@/shared/themes/brand";
import type { RankingEntry, RankingMeta } from "@/shared/types/ranking";
import type { ChoroplethPathInfo } from "@/shared/utils/choropleth";
import { ChoroplethMapSvg } from "@/shared/components/maps/ChoroplethMapSvg";

interface RankingHighlightsProps {
  meta: RankingMeta;
  topEntries: RankingEntry[];
  bottomEntries: RankingEntry[];
  mapPaths?: ChoroplethPathInfo[];
  theme?: ThemeName;
}

/**
 * ランキングハイライト画像 (1200x630)
 *
 * 上位5県・下位5県を左右に配置し、中央にコロプレス地図を表示。
 * OGP / ブログ記事内の図表として使用。
 */
export const RankingHighlights: React.FC<RankingHighlightsProps> = ({
  meta,
  topEntries,
  bottomEntries,
  mapPaths,
  theme = "light",
}) => {
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";

  // ヘッダーテキストの構成（RankingTable と同じ順序）
  const line1 = meta.yearName
    ? `${meta.yearName} 都道府県ランキング`
    : "都道府県ランキング";
  const attrParts: string[] = [];
  if (meta.demographicAttr) attrParts.push(meta.demographicAttr);
  if (meta.normalizationBasis) attrParts.push(meta.normalizationBasis);
  const attrText = attrParts.join("・");

  const rowDividerColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        fontFamily: FONT.family,
        color: colors.foreground,
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
        {/* yearName ラベル */}
        <div
          style={{
            fontSize: 22,
            fontWeight: FONT.weight.bold,
            color: colors.muted,
            letterSpacing: 2,
          }}
        >
          {line1}
        </div>

        {/* タイトル */}
        <div
          style={{
            fontSize: 44,
            fontWeight: FONT.weight.black,
            color: colors.foreground,
            letterSpacing: 1,
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          {meta.title}
        </div>

        {/* 属性バッジ */}
        {attrText && (
          <div
            style={{
              fontSize: 18,
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

      {/* メインコンテンツ */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          padding: `${SPACING.xs}px ${SPACING.sm}px`,
          gap: SPACING.xs,
        }}
      >
        {/* 上位5県 */}
        <RankList
          label="上位 5 県"
          entries={topEntries.slice(0, 5)}
          unit={meta.unit}
          accentColor={BRAND.primary}
          isDark={isDark}
          colors={colors}
          rowDividerColor={rowDividerColor}
        />

        {/* 中央: 地図 */}
        {mapPaths && mapPaths.length > 0 && (
          <div
            style={{
              width: 260,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChoroplethMapSvg
              paths={mapPaths}
              width={240}
              height={300}
              strokeColor={isDark ? "rgba(255,255,255,0.3)" : "#cbd5e1"}
              strokeWidth={0.5}
            />
          </div>
        )}

        {/* 下位5県 */}
        <RankList
          label="下位 5 県"
          entries={bottomEntries.slice(0, 5)}
          unit={meta.unit}
          accentColor={BRAND.danger}
          isDark={isDark}
          colors={colors}
          rowDividerColor={rowDividerColor}
        />
      </div>

      {/* フッター ブランドバー */}
      <div
        style={{
          backgroundColor: isDark ? colors.card : "#F1F5F9",
          borderTop: `1px solid ${colors.border}`,
          padding: "8px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: FONT.weight.black,
            color: BRAND.primary,
            letterSpacing: 1,
          }}
        >
          stats47.jp
        </div>
        <div style={{ width: 1, height: 14, backgroundColor: colors.border }} />
        <div
          style={{
            fontSize: 16,
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

// ------------------------------------------
// 内部コンポーネント
// ------------------------------------------

interface RankListProps {
  label: string;
  entries: RankingEntry[];
  unit: string;
  accentColor: string;
  isDark: boolean;
  colors: ColorScheme;
  rowDividerColor: string;
}

const RankList: React.FC<RankListProps> = ({
  label,
  entries,
  unit,
  accentColor,
  isDark,
  colors,
  rowDividerColor,
}) => (
  <div
    style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      backgroundColor: colors.card,
      borderRadius: RADIUS.md,
      overflow: "hidden",
      boxShadow: isDark
        ? "0 4px 12px rgba(0,0,0,0.4)"
        : "0 2px 8px rgba(0,0,0,0.08)",
    }}
  >
    {/* 列ヘッダー */}
    <div
      style={{
        backgroundColor: accentColor,
        color: BRAND.white,
        fontSize: 22,
        fontWeight: FONT.weight.bold,
        textAlign: "center",
        padding: "8px 0",
        letterSpacing: 2,
      }}
    >
      {label}
    </div>

    {/* 各行（flex: 1 で均等分割） */}
    {entries.map((entry, i) => (
      <div
        key={entry.areaCode}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          borderBottom:
            i < entries.length - 1 ? `1px solid ${rowDividerColor}` : "none",
        }}
      >
        {/* 順位バッジ */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: RADIUS.sm,
            backgroundColor: accentColor,
            color: BRAND.white,
            fontSize: 20,
            fontWeight: FONT.weight.black,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {entry.rank}
        </div>

        {/* 都道府県名 */}
        <div
          style={{
            flex: 1,
            fontSize: 24,
            fontWeight: FONT.weight.bold,
            color: colors.foreground,
            marginLeft: 10,
          }}
        >
          {entry.areaName}
        </div>

        {/* 値 */}
        <div
          style={{
            fontSize: 22,
            fontWeight: FONT.weight.black,
            color: colors.foreground,
            textAlign: "right",
          }}
        >
          {entry.value.toLocaleString()}
          <span
            style={{
              fontSize: 15,
              color: colors.muted,
              marginLeft: 3,
              fontWeight: FONT.weight.medium,
            }}
          >
            {unit}
          </span>
        </div>
      </div>
    ))}
  </div>
);
