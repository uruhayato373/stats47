import React from "react";
import { AbsoluteFill } from "remotion";

import { formatValueWithPrecision, getMaxDecimalPlaces } from "@stats47/utils";

import {
  BRAND,
  COLOR_SCHEMES,
  FONT,
  RANK_COLORS,
  SPACING,
  type ThemeName,
} from "../../shared/themes/brand";
import type { RankingEntry, RankingMeta } from "../../shared/types/ranking";
import { SafetyZoneOverlay } from "../../shared/components/utils/SafetyZoneOverlay";

const MEDAL_EMOJI: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
const TOP_N = 15;

interface StaticRankingProps {
  meta: RankingMeta;
  entries: RankingEntry[];
  theme?: ThemeName;
  showSafeAreas?: boolean;
  displayTitle?: string;
}

/**
 * 6秒静止画ランキング TOP15 (1080x1920, 9:16)
 *
 * 競合「ランクの森」フォーマットを参考にした1列リスト表示。
 * YouTube Shorts に 180 フレーム (6秒 @ 30fps) で登録する。
 */
export const StaticRanking: React.FC<StaticRankingProps> = ({
  meta,
  entries,
  theme = "dark",
  showSafeAreas = false,
  displayTitle,
}) => {
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";
  const top15 = entries.slice(0, TOP_N);
  const precision = getMaxDecimalPlaces(top15.map((e) => e.value));

  const title = displayTitle || meta.title;

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
      {/* 背景装飾 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 20%, rgba(30, 64, 175, 0.15) 0%, transparent 60%), " +
            "radial-gradient(circle at 80% 80%, rgba(245, 158, 11, 0.08) 0%, transparent 50%)",
        }}
      />

      {/* ヘッダー — 競合「ランクの森」参考: タイトルを大きく、2行構成 */}
      <div
        style={{
          paddingTop: 200,
          paddingLeft: SPACING.lg,
          paddingRight: SPACING.lg,
          paddingBottom: SPACING.sm,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          zIndex: 10,
        }}
      >
        {/* 1行目: メインタイトル（指標名を含む） */}
        <div
          style={{
            fontSize: 72,
            fontWeight: FONT.weight.black,
            lineHeight: 1.15,
            color: colors.foreground,
            textShadow: isDark
              ? "0 2px 20px rgba(0,0,0,0.5), 0 0 40px rgba(255,255,255,0.15)"
              : "none",
          }}
        >
          {title}
        </div>
        {/* 年度ラベル */}
        {meta.yearName && (
          <div
            style={{
              fontSize: 44,
              fontWeight: FONT.weight.black,
              color: BRAND.secondary,
              letterSpacing: 3,
              marginTop: 4,
            }}
          >
            {meta.yearName}
          </div>
        )}
      </div>

      {/* ランキングリスト */}
      <div
        style={{
          flex: 1,
          padding: "0 80px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          zIndex: 10,
        }}
      >
        {top15.map((entry) => (
          <RankRow
            key={entry.areaCode}
            entry={entry}
            unit={meta.unit}
            precision={precision}
            isDark={isDark}
            colors={colors}
          />
        ))}
      </div>

      {/* ウォーターマーク */}
      <div
        style={{
          paddingBottom: 180,
          textAlign: "center",
          zIndex: 10,
        }}
      >
        <span
          style={{
            fontSize: 24,
            fontWeight: FONT.weight.bold,
            color: isDark
              ? "rgba(71, 85, 105, 0.6)"
              : "rgba(148, 163, 184, 0.7)",
            letterSpacing: 2,
          }}
        >
          stats47.jp
        </span>
      </div>

      {showSafeAreas && <SafetyZoneOverlay />}
    </AbsoluteFill>
  );
};

// ------------------------------------------
// 内部コンポーネント
// ------------------------------------------

interface RankRowProps {
  entry: RankingEntry;
  unit: string;
  precision: number;
  isDark: boolean;
  colors: (typeof COLOR_SCHEMES)[ThemeName];
}

const RankRow: React.FC<RankRowProps> = ({
  entry,
  unit,
  precision,
  isDark,
  colors,
}) => {
  const isTop3 = entry.rank <= 3;
  const medal = MEDAL_EMOJI[entry.rank];
  const rankColor =
    isTop3 && entry.rank in RANK_COLORS
      ? RANK_COLORS[entry.rank as 1 | 2 | 3]
      : null;

  const cardBg = isTop3
    ? isDark
      ? "rgba(30, 41, 59, 0.8)"
      : "rgba(255, 255, 255, 0.95)"
    : isDark
      ? "rgba(30, 41, 59, 0.5)"
      : "rgba(255, 255, 255, 0.8)";

  const borderColor = isTop3
    ? BRAND.secondary
    : isDark
      ? "rgba(255, 255, 255, 0.08)"
      : "rgba(0, 0, 0, 0.05)";

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        backgroundColor: cardBg,
        borderRadius: 12,
        border: `1px solid ${borderColor}`,
        boxShadow: isTop3
          ? "0 4px 12px -2px rgba(245, 158, 11, 0.15)"
          : "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top3 の左辺アクセント */}
      {isTop3 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 5,
            background: rankColor
              ? `linear-gradient(to bottom, ${rankColor.from}, ${rankColor.to})`
              : BRAND.secondary,
          }}
        />
      )}

      {/* メダル or 順位番号 */}
      <div
        style={{
          width: 64,
          fontSize: medal ? 36 : 30,
          fontWeight: FONT.weight.black,
          textAlign: "center",
          color: rankColor ? rankColor.from : colors.muted,
        }}
      >
        {medal ?? entry.rank}
      </div>

      {/* 都道府県名 */}
      <div
        style={{
          flex: 1,
          fontSize: 32,
          fontWeight: FONT.weight.bold,
          color: colors.foreground,
          marginLeft: 4,
        }}
      >
        {entry.areaName}
      </div>

      {/* 値 + 単位 */}
      <div
        style={{
          fontSize: 30,
          fontWeight: FONT.weight.black,
          color: isTop3 ? BRAND.secondary : colors.foreground,
        }}
      >
        {formatValueWithPrecision(entry.value, precision)}
        <span
          style={{
            fontSize: 20,
            color: colors.muted,
            marginLeft: 4,
            fontWeight: FONT.weight.medium,
          }}
        >
          {unit}
        </span>
      </div>
    </div>
  );
};
