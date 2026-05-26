import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
  COLOR_SCHEMES,
  FONT,
  SPACING,
  type ColorScheme,
  type ThemeName,
} from "@/shared/themes/brand";

interface IntroCardProps {
  theme?: ThemeName;
  format: "landscape" | "portrait";
  maxAbsPercent: number;
  yearStart: number;
  yearEnd: number;
}

const Row: React.FC<{
  index: number;
  total: number;
  frame: number;
  fps: number;
  colors: ColorScheme;
  label: string;
  value: string;
  scale: number;
}> = ({ index, total, frame, colors, label, value, scale }) => {
  const delay = 12 + index * 8;
  const opacity = interpolate(frame, [delay, delay + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translate = interpolate(frame, [delay, delay + 14], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        display: "flex",
        gap: SPACING.lg * scale,
        opacity,
        transform: `translateY(${translate}px)`,
        borderBottom:
          index < total - 1
            ? `1px solid ${colors.border}`
            : "none",
        padding: `${SPACING.md * scale}px 0`,
      }}
    >
      <div
        style={{
          width: 220 * scale,
          fontSize: 20 * scale,
          color: colors.muted,
          fontWeight: FONT.weight.medium,
          flexShrink: 0,
        }}
      >
        {label}
      </div>
      <div
        style={{
          flex: 1,
          fontSize: 22 * scale,
          color: colors.foreground,
          fontWeight: FONT.weight.bold,
          lineHeight: 1.5,
        }}
      >
        {value}
      </div>
    </div>
  );
};

export const IntroCard: React.FC<IntroCardProps> = ({
  theme = "dark",
  format,
  maxAbsPercent,
  yearStart,
  yearEnd,
}) => {
  const colors = COLOR_SCHEMES[theme];
  const frame = useCurrentFrame();
  const isPortrait = format === "portrait";
  const scale = isPortrait ? 1.1 : 1.0;

  const titleOpacity = interpolate(frame, [0, 14], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, 14], [20, 0], {
    extrapolateRight: "clamp",
  });

  const rows = [
    {
      label: "データ",
      value: `e-Stat 推計人口（毎年10月1日基準）${yearStart - 1}〜${yearEnd}年`,
    },
    {
      label: "前年度比",
      value: "各県 P(t) ÷ P(t−1) を年次で算出",
    },
    {
      label: "平滑化",
      value: "5年中央移動平均（端は窓を切詰め）",
    },
    {
      label: "配色",
      value: `増加=青 / 減少=赤、±${maxAbsPercent.toFixed(1)}%/年で clamp（超過分は最大彩度）`,
    },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        fontFamily: FONT.family,
        padding: isPortrait
          ? `${SPACING.xxl * 1.5}px ${SPACING.xl}px`
          : `${SPACING.xxl}px ${SPACING.xxl * 2}px`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: SPACING.xl,
      }}
    >
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div
          style={{
            fontSize: 22 * scale,
            color: colors.accent,
            fontWeight: FONT.weight.bold,
            letterSpacing: 2,
            marginBottom: SPACING.sm,
          }}
        >
          47 PREFECTURES · {yearStart}–{yearEnd}
        </div>
        <div
          style={{
            fontSize: (isPortrait ? 64 : 72) * 1,
            color: colors.foreground,
            fontWeight: FONT.weight.black,
            lineHeight: 1.15,
          }}
        >
          人口の前年度比
          <br />
          色で見る49年
        </div>
        <div
          style={{
            fontSize: 24 * scale,
            color: colors.muted,
            marginTop: SPACING.md,
            lineHeight: 1.5,
          }}
        >
          いつから東京一極集中が始まったのか、
          {isPortrait ? <br /> : null}
          47都道府県のコロプレスで可視化する。
        </div>
      </div>

      <div
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: `${SPACING.md * scale}px ${SPACING.lg * scale}px`,
          border: `1px solid ${colors.border}`,
        }}
      >
        <div
          style={{
            fontSize: 16 * scale,
            color: colors.muted,
            marginBottom: SPACING.sm,
            fontWeight: FONT.weight.bold,
            letterSpacing: 1,
          }}
        >
          計算方法
        </div>
        {rows.map((r, i) => (
          <Row
            key={r.label}
            index={i}
            total={rows.length}
            frame={frame}
            fps={30}
            colors={colors}
            label={r.label}
            value={r.value}
            scale={scale}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
