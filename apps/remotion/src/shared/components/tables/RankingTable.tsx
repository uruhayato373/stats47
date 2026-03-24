import React from "react";
import { AbsoluteFill } from "remotion";

import { formatValueWithPrecision, getMaxDecimalPlaces } from "@stats47/utils";

import { BRAND, COLOR_SCHEMES, FONT, RADIUS, SPACING, type ThemeName } from "../../themes/brand";
import type { RankingEntry, RankingMeta } from "../../types/ranking";
import { SafetyZoneOverlay } from "../utils/SafetyZoneOverlay";

/** テーブルの表示スタイル */
type TableStyle = "standard" | "neon";

interface RankingTableProps {
  meta: RankingMeta;
  /** 47都道府県のランキングデータ（rank 順にソート済み） */
  entries: RankingEntry[];
  /** 表示スタイル */
  tableStyle?: TableStyle;
  theme?: ThemeName;
  /** SNS セーフエリアを表示するか */
  showSafeAreas?: boolean;
  /** 表示用タイトル。指定時は meta.title を上書きする */
  displayTitle?: string;
}

/**
 * ランキングテーブル (1080x1920, 9:16) - リッチなカードリスト版
 */
export const RankingTable: React.FC<RankingTableProps> = ({
  meta,
  entries,
  tableStyle = "neon",
  theme = "dark",
  showSafeAreas = false,
  displayTitle,
}) => {
  const colors = COLOR_SCHEMES[theme];
  const isNeon = tableStyle === "neon";
  const isDark = theme === "dark";

  const rowsPerColumn = 24;
  const leftEntries = entries.slice(0, rowsPerColumn);
  const rightEntries = entries.slice(rowsPerColumn, rowsPerColumn * 2);

  const precision = getMaxDecimalPlaces(entries.map((e) => e.value));

  // ヘッダーテキストの構成
  const line1 = meta.yearName
    ? `${meta.yearName} 都道府県ランキング`
    : "都道府県ランキング";
  const line2 = displayTitle || meta.title;
  const attrParts: string[] = [];
  if (meta.subtitle) attrParts.push(meta.subtitle);
  if (meta.demographicAttr) attrParts.push(meta.demographicAttr);
  if (meta.normalizationBasis) attrParts.push(meta.normalizationBasis);
  const attrText = attrParts.join("・");

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
      {/* ネオンモード時の背景装飾 */}
      {isNeon && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 50% 30%, #1e293b 0%, #000000 100%)",
          opacity: isDark ? 1 : 0.8,
        }} />
      )}

      {/* ヘッダー - セーフエリア内（テキストを上寄せ） */}
      <div
        style={{
          paddingTop: 200,
          paddingLeft: SPACING.xl,
          paddingRight: SPACING.xl,
          paddingBottom: SPACING.xs,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: FONT.weight.bold,
            letterSpacing: 4,
            color: colors.muted,
          }}
        >
          {line1}
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: FONT.weight.black,
            letterSpacing: 2,
            lineHeight: 1.2,
            color: colors.foreground,
            textShadow: isNeon ? "0 0 20px rgba(255,255,255,0.3)" : "none",
          }}
        >
          {line2}
        </div>
        {attrText && (
          <div
            style={{
              fontSize: 22,
              fontWeight: FONT.weight.medium,
              color: isNeon ? "#94A3B8" : colors.muted,
              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
              padding: "4px 16px",
              borderRadius: RADIUS.full,
              alignSelf: "center",
            }}
          >
            {attrText}
          </div>
        )}
      </div>

      {/* テーブル (カードリスト形式) — 下部セーフエリアにはみ出して表示領域を最大化 */}
      <div
        style={{
          padding: "0 120px 50px 64px", // 下部 50px マージンのみ（セーフエリア外まで使用）
          display: "flex",
          gap: 20,
          flex: 1,
          zIndex: 10,
        }}
      >
        {/* 左列 1-24 */}
        <Column
          entries={leftEntries}
          unit={meta.unit}
          precision={precision}
          isNeon={isNeon}
          isDark={isDark}
          themeColors={colors}
        />
        {/* 右列 25-47 + ウォーターマーク行（24枠目）で左列と行高を統一 */}
        <Column
          entries={rightEntries}
          unit={meta.unit}
          precision={precision}
          isNeon={isNeon}
          isDark={isDark}
          themeColors={colors}
          footer={<WatermarkRow isNeon={isNeon} isDark={isDark} themeColors={colors} />}
        />
      </div>

      {/* セーフエリア表示 (開発用) */}
      {showSafeAreas && <SafetyZoneOverlay />}
    </AbsoluteFill>
  );
};

// ------------------------------------------
// 内部コンポーネント
// ------------------------------------------

interface ColumnProps {
  entries: RankingEntry[];
  unit: string;
  precision: number;
  isNeon: boolean;
  isDark: boolean;
  themeColors: (typeof COLOR_SCHEMES)[ThemeName];
  /** 列末尾に追加する要素（行高を左列と揃えるために使用） */
  footer?: React.ReactNode;
}

const Column: React.FC<ColumnProps> = ({
  entries,
  unit,
  precision,
  isNeon,
  isDark,
  themeColors,
  footer,
}) => (
  <div
    style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 5,
    }}
  >
    {entries.map((entry) => (
      <CardRow
        key={entry.areaCode}
        entry={entry}
        unit={unit}
        precision={precision}
        isNeon={isNeon}
        isDark={isDark}
        themeColors={themeColors}
      />
    ))}
    {footer}
  </div>
);

interface WatermarkRowProps {
  isNeon: boolean;
  isDark: boolean;
  themeColors: (typeof COLOR_SCHEMES)[ThemeName];
}

const WatermarkRow: React.FC<WatermarkRowProps> = ({ isNeon, isDark, themeColors }) => {
  const cardBg = isNeon
    ? isDark ? "rgba(30, 41, 59, 0.4)" : "rgba(255, 255, 255, 0.6)"
    : themeColors.card;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: cardBg,
        borderRadius: 8,
        border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)"}`,
      }}
    >
      <span style={{
        fontSize: 22,
        fontWeight: FONT.weight.bold,
        color: isDark ? "rgba(71, 85, 105, 0.7)" : "rgba(148, 163, 184, 0.8)",
        letterSpacing: 2,
      }}>
        stats47.jp
      </span>
    </div>
  );
};

interface CardRowProps {
  entry: RankingEntry;
  unit: string;
  precision: number;
  isNeon: boolean;
  isDark: boolean;
  themeColors: (typeof COLOR_SCHEMES)[ThemeName];
}

const CardRow: React.FC<CardRowProps> = ({
  entry,
  unit,
  precision,
  isNeon,
  isDark,
  themeColors,
}) => {
  const isTop3 = entry.rank <= 3;

  const cardBg = isNeon
    ? isDark ? "rgba(30, 41, 59, 0.7)" : "rgba(255, 255, 255, 0.9)"
    : themeColors.card;

  const borderColor = isTop3
    ? BRAND.secondary
    : isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)";

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        backgroundColor: cardBg,
        borderRadius: 8,
        border: `1px solid ${borderColor}`,
        boxShadow: isDark
          ? "0 4px 6px -1px rgba(0, 0, 0, 0.2)"
          : "0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 上位3位のアクセント */}
      {isTop3 && (
        <div style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          backgroundColor: BRAND.secondary,
        }} />
      )}

      {/* 順位 */}
      <div
        style={{
          width: 48,
          fontSize: 26,
          fontWeight: FONT.weight.black,
          textAlign: "center",
          color: isTop3
            ? BRAND.secondary
            : themeColors.muted,
        }}
      >
        {entry.rank}
      </div>

      {/* 都道府県名 */}
      <div
        style={{
          flex: 1,
          fontSize: 26,
          fontWeight: FONT.weight.bold,
          color: themeColors.foreground,
          marginLeft: 8,
        }}
      >
        {entry.areaName}
      </div>

      {/* 値 */}
      <div
        style={{
          fontSize: 24,
          fontWeight: FONT.weight.black,
          color: isTop3 && !isNeon ? BRAND.secondary : themeColors.foreground,
        }}
      >
        {formatValueWithPrecision(entry.value, precision)}
        <span
          style={{
            fontSize: 18,
            color: themeColors.muted,
            marginLeft: 2,
            fontWeight: FONT.weight.medium,
          }}
        >
          {unit}
        </span>
      </div>
    </div>
  );
};
