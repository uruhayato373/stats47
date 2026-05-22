import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLOR_SCHEMES, FONT, type ThemeName } from "@stats47/migration-flow";

const OUT_HEX = "#DC2626"; // 転出超過
const IN_HEX = "#0D9488"; // 転入超過

/** 区切りテロップの尺（4秒 @30fps） */
export const MIGRATION_TELOP_DURATION = 120;

interface Props {
  /** カウントダウン上の位置（1-47） */
  position?: number;
  prefName?: string;
  /** 純移動数（負 = 転出超過） */
  net?: number;
  theme?: ThemeName;
}

/**
 * 各県クリップの前に挟む区切りテロップ。
 * 位置（N/47）・県名・純移動バッジを表示する。
 */
export const MigrationSegmentTelop: React.FC<Props> = ({
  position = 1,
  prefName = "広島県",
  net = -9921,
  theme = "light",
}) => {
  const colors = COLOR_SCHEMES[theme];
  const frame = useCurrentFrame();
  const isOut = net < 0;
  const accent = isOut ? OUT_HEX : IN_HEX;

  const clamp = {
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  };
  const op = interpolate(frame, [0, 12], [0, 1], clamp);
  const scale = interpolate(frame, [0, 14], [0.92, 1], clamp);
  const barW = interpolate(frame, [6, 30], [0, 320], clamp);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        fontFamily: FONT.family,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          opacity: op,
          transform: `scale(${scale})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* 位置（N / 47） */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            color: colors.muted,
            fontWeight: FONT.weight.bold,
          }}
        >
          <span
            style={{
              fontSize: 42,
              color: accent,
              fontWeight: FONT.weight.black,
            }}
          >
            {position}
          </span>
          <span style={{ fontSize: 24 }}>/ 47</span>
        </div>

        {/* アクセントバー */}
        <div
          style={{
            width: barW,
            height: 6,
            backgroundColor: accent,
            borderRadius: 3,
            margin: "18px 0 26px",
          }}
        />

        {/* 県名 */}
        <div
          style={{
            fontSize: 130,
            fontWeight: FONT.weight.black,
            color: colors.foreground,
            lineHeight: 1,
          }}
        >
          {prefName}
        </div>

        {/* 純移動バッジ */}
        <div
          style={{
            marginTop: 34,
            display: "flex",
            alignItems: "center",
            gap: 14,
            backgroundColor: accent,
            color: "#FFFFFF",
            padding: "14px 32px",
            borderRadius: 999,
            fontWeight: FONT.weight.black,
          }}
        >
          <span style={{ fontSize: 30 }}>
            {isOut ? "転出超過" : "転入超過"}
          </span>
          <span style={{ fontSize: 38 }}>
            {Math.abs(net).toLocaleString("ja-JP")}人
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
