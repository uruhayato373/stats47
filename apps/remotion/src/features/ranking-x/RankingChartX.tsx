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
import { formatValueWithPrecision } from "@stats47/utils";
import type { RankingEntry, RankingMeta } from "@/shared/types/ranking";

interface RankingChartXProps {
  meta: RankingMeta;
  topEntries: RankingEntry[];
  bottomEntries: RankingEntry[];
  theme?: ThemeName;
  precision?: number;
  /** 表示用タイトル。指定時は meta.title を上書きする */
  displayTitle?: string;
}

/**
 * X (Twitter) 用チャート画像 (1200x630)
 *
 * 上位5県・下位5県の横棒グラフを左右に配置。
 * 各行は「順位バッジ｜都道府県名｜バー｜値」の1段構成で行高を均等化。
 */
export const RankingChartX: React.FC<RankingChartXProps> = ({
  meta,
  topEntries,
  bottomEntries,
  theme = "light",
  precision = 0,
  displayTitle,
}) => {
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";

  const title = displayTitle || meta.title;

  // ヘッダーテキストの構成（RankingHighlights と同じ順序）
  const line1 = meta.yearName
    ? `${meta.yearName} 都道府県ランキング`
    : "都道府県ランキング";
  const attrParts: string[] = [];
  if (meta.subtitle) attrParts.push(meta.subtitle);
  if (meta.demographicAttr) attrParts.push(meta.demographicAttr);
  if (meta.normalizationBasis) attrParts.push(meta.normalizationBasis);
  const attrText = attrParts.join("・");

  // 左右共通の最大値スケール（格差を視覚的に伝える）
  const allEntries = [...topEntries.slice(0, 5), ...bottomEntries.slice(0, 5)];
  const maxValue = Math.max(...allEntries.map((e) => e.value), 1);

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
          {title}
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

      {/* チャートエリア */}
      <div
        style={{
          flex: 1,
          display: "flex",
          padding: `${SPACING.md}px ${SPACING.lg}px`,
          gap: SPACING.lg,
        }}
      >
        <BarGroup
          label="上位 5 県"
          entries={topEntries.slice(0, 5)}
          accentColor={BRAND.primary}
          maxValue={maxValue}
          unit={meta.unit}
          precision={precision}
          isDark={isDark}
          colors={colors}
        />
        <BarGroup
          label="下位 5 県"
          entries={bottomEntries.slice(0, 5)}
          accentColor={BRAND.danger}
          maxValue={maxValue}
          unit={meta.unit}
          precision={precision}
          isDark={isDark}
          colors={colors}
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

interface BarGroupProps {
  label: string;
  entries: RankingEntry[];
  accentColor: string;
  maxValue: number;
  unit: string;
  precision: number;
  isDark: boolean;
  colors: ColorScheme;
}

const BarGroup: React.FC<BarGroupProps> = ({
  label,
  entries,
  accentColor,
  maxValue,
  unit,
  precision,
  isDark,
  colors,
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
      <BarRow
        key={entry.areaCode}
        entry={entry}
        accentColor={accentColor}
        maxValue={maxValue}
        unit={unit}
        precision={precision}
        isDark={isDark}
        colors={colors}
        isLast={i === entries.length - 1}
      />
    ))}
  </div>
);

interface BarRowProps {
  entry: RankingEntry;
  accentColor: string;
  maxValue: number;
  unit: string;
  precision: number;
  isDark: boolean;
  colors: ColorScheme;
  isLast: boolean;
}

const BarRow: React.FC<BarRowProps> = ({
  entry,
  accentColor,
  maxValue,
  unit,
  precision,
  isDark,
  colors,
  isLast,
}) => {
  const barPct = (entry.value / maxValue) * 100;
  const dividerColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const trackColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 12,
        borderBottom: isLast ? "none" : `1px solid ${dividerColor}`,
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
          width: 96,
          fontSize: 22,
          fontWeight: FONT.weight.bold,
          color: colors.foreground,
          flexShrink: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {entry.areaName}
      </div>

      {/* バーエリア（flex: 1 で残りスペースを占有） */}
      <div
        style={{
          flex: 1,
          position: "relative",
          height: "100%",
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* トラック（薄い背景） */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: 10,
            backgroundColor: trackColor,
            borderRadius: RADIUS.full,
          }}
        />
        {/* バー本体 */}
        <div
          style={{
            position: "absolute",
            left: 0,
            height: 10,
            width: `${barPct}%`,
            backgroundColor: accentColor,
            borderRadius: RADIUS.full,
          }}
        />
      </div>

      {/* 値 */}
      <div
        style={{
          width: 120,
          fontSize: 22,
          fontWeight: FONT.weight.black,
          color: colors.foreground,
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        {formatValueWithPrecision(entry.value, precision)}
        <span
          style={{
            fontSize: 14,
            color: colors.muted,
            marginLeft: 3,
            fontWeight: FONT.weight.medium,
          }}
        >
          {unit}
        </span>
      </div>
    </div>
  );
};
