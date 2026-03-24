import React from "react";
import { AbsoluteFill } from "remotion";
import { FONT } from "@/shared/themes/brand";
import { SERIES_ACCENT, type SeriesName } from "./kazu-theme";

interface KazuNoteCoverProps {
  /** シリーズ名（例: "ソバーキュリアス"） */
  series: SeriesName;
  /** 日数（例: 15） */
  day: number;
  /** サブタイトル（タイトルの ｜ 以降） */
  subtitle: string;
}

/**
 * kazu-note カバー画像 (1280x670)
 *
 * 白背景 + カラーボーダーのシンプルなレイアウト。
 * 上段: シリーズ名 + 日数
 * 下段: サブタイトル
 */
export const KazuNoteCover: React.FC<KazuNoteCoverProps> = ({
  series,
  day,
  subtitle,
}) => {
  const accent = SERIES_ACCENT[series] ?? SERIES_ACCENT["ソバーキュリアス"];

  // サブタイトルの文字数に応じてフォントサイズを調整
  const subtitleFontSize = subtitle.length > 30 ? 32 : subtitle.length > 20 ? 36 : 40;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: accent,
        fontFamily: FONT.family,
        overflow: "hidden",
      }}
    >
      {/* 白い内側エリア（ボーダー表現） */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          right: 24,
          bottom: 24,
          backgroundColor: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 48,
        }}
      >
        {/* 上段: シリーズ名 + 日数 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: FONT.weight.black,
              color: "#1A1A1A",
              letterSpacing: "0.1em",
            }}
          >
            {series}
          </div>
          <div
            style={{
              fontSize: 80,
              fontWeight: FONT.weight.black,
              color: "#1A1A1A",
              lineHeight: 1,
            }}
          >
            {day}日目
          </div>
        </div>

        {/* 区切り線 */}
        <div
          style={{
            width: 80,
            height: 2,
            backgroundColor: accent,
          }}
        />

        {/* 下段: サブタイトル */}
        <div
          style={{
            fontSize: subtitleFontSize,
            fontWeight: FONT.weight.bold,
            color: "#333333",
            lineHeight: 1.6,
            textAlign: "center",
            maxWidth: 900,
            padding: "0 40px",
          }}
        >
          {subtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
};
