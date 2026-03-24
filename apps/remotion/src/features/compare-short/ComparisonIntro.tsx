import React from "react";
import { AbsoluteFill, OffthreadVideo, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND, COLOR_SCHEMES, FONT, SPACING, type ThemeName } from "@/shared";
import { getGesVideoPath } from "../ranking-youtube-ges/get-ges-video-path";

interface ComparisonIntroProps {
  areaNameA: string;
  areaNameB: string;
  areaCodeA: string;
  areaCodeB: string;
  /** フックテキスト（赤帯に表示） */
  hookText?: string;
  theme?: ThemeName;
}

/**
 * 比較ショート動画 イントロ (1080x1920, 9:16)
 *
 * 上下に GES 動画背景を表示し、VS レイアウトでフック。
 */
export const ComparisonIntro: React.FC<ComparisonIntroProps> = ({
  areaNameA,
  areaNameB,
  areaCodeA,
  areaCodeB,
  hookText = "どっちが上？",
  theme = "dark",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";

  const videoSrcA = getGesVideoPath(areaCodeA, "portrait");
  const videoSrcB = getGesVideoPath(areaCodeB, "portrait");

  const sprOptions = { fps, damping: 12, mass: 0.8 };
  const brandSpring = spring({ frame: frame - 3, from: 0, to: 1, ...sprOptions });
  const nameSpringA = spring({ frame: frame - 10, from: 0, to: 1, ...sprOptions });
  const vsSpring = spring({ frame: frame - 25, from: 0, to: 1, fps, config: { damping: 8, mass: 1.5, stiffness: 80 } });
  const nameSpringB = spring({ frame: frame - 20, from: 0, to: 1, ...sprOptions });
  const hookSpring = spring({ frame: frame - 35, from: 0, to: 1, ...sprOptions });
  const subtextSpring = spring({ frame: frame - 50, from: 0, to: 1, ...sprOptions });

  return (
    <AbsoluteFill style={{ fontFamily: FONT.family, overflow: "hidden" }}>
      {/* 上半分: 地域A GES */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", overflow: "hidden" }}>
        <OffthreadVideo
          src={videoSrcA}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          muted
        />
        <AbsoluteFill
          style={{
            background: isDark
              ? "linear-gradient(to bottom, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.7) 100%)"
              : "linear-gradient(to bottom, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.6) 100%)",
          }}
        />
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "160px 60px 60px",
        }}>
          <div style={{
            fontSize: 120,
            fontWeight: FONT.weight.black,
            color: BRAND.primaryLight,
            textShadow: "0 6px 24px rgba(0,0,0,0.7)",
            transform: `scale(${nameSpringA}) translateY(${interpolate(nameSpringA, [0, 1], [60, 0])}px)`,
            opacity: nameSpringA,
          }}>
            {areaNameA}
          </div>
        </div>
      </div>

      {/* 下半分: 地域B GES */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%", overflow: "hidden" }}>
        <OffthreadVideo
          src={videoSrcB}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          muted
        />
        <AbsoluteFill
          style={{
            background: isDark
              ? "linear-gradient(to top, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.7) 100%)"
              : "linear-gradient(to top, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.6) 100%)",
          }}
        />
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 60px 160px",
        }}>
          <div style={{
            fontSize: 120,
            fontWeight: FONT.weight.black,
            color: BRAND.danger,
            textShadow: "0 6px 24px rgba(0,0,0,0.7)",
            transform: `scale(${nameSpringB}) translateY(${interpolate(nameSpringB, [0, 1], [-60, 0])}px)`,
            opacity: nameSpringB,
          }}>
            {areaNameB}
          </div>
        </div>
      </div>

      {/* ブランディング */}
      <div style={{
        position: "absolute",
        top: 268,
        left: 0,
        right: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        zIndex: 20,
        opacity: brandSpring,
        transform: `translateY(${interpolate(brandSpring, [0, 1], [-16, 0])}px)`,
      }}>
        <div style={{
          backgroundColor: BRAND.primary,
          color: BRAND.white,
          padding: "8px 22px",
          borderRadius: 8,
          fontSize: 30,
          fontWeight: FONT.weight.black,
          letterSpacing: 1,
        }}>
          stats47
        </div>
        <div style={{
          fontSize: 32,
          fontWeight: FONT.weight.bold,
          color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.6)",
          letterSpacing: 2,
          textShadow: "0 2px 8px rgba(0,0,0,0.5)",
        }}>
          都道府県比較
        </div>
      </div>

      {/* 中央: VS バッジ */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: `translate(-50%, -50%) scale(${interpolate(vsSpring, [0, 0.7, 1], [0, 1.3, 1])})`,
        zIndex: 20,
        fontSize: 80,
        fontWeight: FONT.weight.black,
        color: BRAND.secondary,
        backgroundColor: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
        padding: "16px 56px",
        borderRadius: 32,
        border: `4px solid ${BRAND.secondary}`,
        boxShadow: `0 0 60px ${BRAND.secondary}66, 0 16px 48px rgba(0,0,0,0.5)`,
        letterSpacing: 8,
      }}>
        VS
      </div>

      {/* フックテキスト（VS バッジの下） */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: 0,
        right: 0,
        marginTop: 80,
        zIndex: 20,
        display: "flex",
        justifyContent: "center",
        opacity: hookSpring,
        transform: `translateY(${interpolate(hookSpring, [0, 1], [20, 0])}px)`,
      }}>
        <div style={{
          backgroundColor: isDark ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.9)",
          padding: "12px 48px",
          borderRadius: 20,
          border: `2px solid ${colors.border}`,
          backdropFilter: "blur(16px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>
          <span style={{
            color: colors.foreground,
            fontSize: 48,
            fontWeight: FONT.weight.black,
            letterSpacing: 2,
          }}>
            {hookText}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
