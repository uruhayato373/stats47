import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

import { BRAND, COLOR_SCHEMES, FONT, type ThemeName } from "@/shared";

interface NormalOutroProps {
  theme?: ThemeName;
}

/**
 * YouTube 通常動画 (16:9) 用アウトロ画面
 *
 * チャンネル登録CTA + stats47.jp 誘導。
 * 4秒（120フレーム）を想定。
 */
export const NormalOutro: React.FC<NormalOutroProps> = ({
  theme = "dark",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";

  const sprConfig = { fps, damping: 12, mass: 0.8 };
  const mainSpring = spring({ frame: frame - 5, from: 0, to: 1, ...sprConfig });
  const ctaSpring = spring({ frame: frame - 20, from: 0, to: 1, ...sprConfig });
  const urlSpring = spring({ frame: frame - 35, from: 0, to: 1, ...sprConfig });

  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT.family,
        color: colors.foreground,
        background: isDark
          ? "radial-gradient(circle at 50% 50%, #1E293B 0%, #0F172A 100%)"
          : "radial-gradient(circle at 50% 50%, #F8FAFC 0%, #E2E8F0 100%)",
        overflow: "hidden",
      }}
    >
      {/* 装飾円 */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 900,
        height: 900,
        borderRadius: "50%",
        border: `2px dashed ${isDark ? "#CBD5E0" : "#94A3B8"}`,
        opacity: 0.12,
      }} />
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 1300,
        height: 1300,
        borderRadius: "50%",
        border: `1px solid ${isDark ? "#CBD5E0" : "#94A3B8"}`,
        opacity: 0.06,
      }} />

      {/* コンテンツ */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 36,
          padding: "0 200px",
        }}
      >
        {/* ブランドバッジ */}
        <div style={{
          opacity: mainSpring,
          transform: `scale(${mainSpring})`,
        }}>
          <div style={{
            backgroundColor: BRAND.primary,
            color: BRAND.white,
            padding: "10px 32px",
            borderRadius: 12,
            fontSize: 36,
            fontWeight: FONT.weight.black,
          }}>
            stats47
          </div>
        </div>

        {/* メインメッセージ */}
        <div style={{
          fontSize: 56,
          fontWeight: FONT.weight.black,
          textAlign: "center",
          lineHeight: 1.4,
          letterSpacing: 2,
          opacity: mainSpring,
          transform: `translateY(${interpolate(mainSpring, [0, 1], [20, 0])}px)`,
        }}>
          ご視聴ありがとうございました
        </div>

        {/* CTA */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          opacity: ctaSpring,
          transform: `translateY(${interpolate(ctaSpring, [0, 1], [15, 0])}px)`,
        }}>
          <div style={{
            fontSize: 32,
            fontWeight: FONT.weight.bold,
            color: colors.muted,
            textAlign: "center",
            lineHeight: 1.6,
          }}>
            チャンネル登録・高評価お願いします
          </div>

          <div style={{
            fontSize: 28,
            fontWeight: FONT.weight.medium,
            color: colors.muted,
            textAlign: "center",
            lineHeight: 1.6,
          }}>
            47都道府県の統計データを{"\n"}わかりやすく比較・分析
          </div>
        </div>

        {/* サイトURL */}
        <div style={{
          opacity: urlSpring,
          transform: `scale(${urlSpring})`,
        }}>
          <div style={{
            padding: "12px 40px",
            border: `2px solid ${BRAND.primaryLight}`,
            borderRadius: 16,
            fontSize: 40,
            fontWeight: FONT.weight.black,
            color: BRAND.primaryLight,
            letterSpacing: 2,
          }}>
            stats47.jp
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
