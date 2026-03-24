import React from "react";
import {
  AbsoluteFill,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  BRAND,
  COLOR_SCHEMES,
  FONT,
  SPACING,
  type ColorScheme,
  type ThemeName,
} from "@/shared/themes/brand";
import { DivergingColorLegend } from "./DivergingColorLegend";
import type { CityPathInfo } from "./types";

interface ChoroplethStaticReelProps {
  tokyoPaths: CityPathInfo[];
  osakaPaths: CityPathInfo[];
  maxAbs: number;
  theme?: ThemeName;
}

const FPS = 30;
const MAP_VIEW_SIZE = 800;
const HOOK_DURATION = 3 * FPS;        // 90f
const DETAIL_DURATION = 4 * FPS;      // 120f
const COMPARE_DURATION = 4 * FPS;     // 120f
const CTA_DURATION = 2 * FPS;         // 60f

function getTopBottom(paths: CityPathInfo[], n = 3) {
  const sorted = [...paths].sort((a, b) => b.ratio - a.ratio);
  return {
    top: sorted.slice(0, n),
    bottom: sorted.slice(-n).reverse(),
  };
}

const MapSvg: React.FC<{
  paths: CityPathInfo[];
  isDark: boolean;
  width?: number;
  height?: number;
}> = ({ paths, isDark, width, height }) => (
  <svg
    viewBox={`0 0 ${MAP_VIEW_SIZE} ${MAP_VIEW_SIZE}`}
    width={width ?? "100%"}
    height={height ?? "100%"}
    style={{ display: "block" }}
  >
    {paths.map((info) => (
      <path
        key={info.areaCode}
        d={info.path}
        fill={info.fill}
        stroke={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)"}
        strokeWidth={0.8}
        strokeLinejoin="round"
      />
    ))}
  </svg>
);

/** Hook scene: 横並びマップ + フックテキスト */
const HookScene: React.FC<{
  tokyoPaths: CityPathInfo[];
  osakaPaths: CityPathInfo[];
  isDark: boolean;
  colors: ColorScheme;
  maxAbs: number;
}> = ({ tokyoPaths, osakaPaths, isDark, colors, maxAbs }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 80 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        fontFamily: FONT.family,
        opacity: fadeIn,
      }}
    >
      {/* フックテキスト */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "inline-block",
            backgroundColor: BRAND.danger,
            color: BRAND.white,
            fontSize: 28,
            fontWeight: FONT.weight.black,
            padding: "8px 24px",
            borderRadius: 8,
          }}
        >
          20年後、あなたの街は…？
        </div>
      </div>

      {/* タイトル */}
      <div
        style={{
          position: "absolute",
          top: 160,
          left: 0,
          right: 0,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: FONT.weight.bold,
            color: colors.muted,
          }}
        >
          2025→2045 市区町村 人口増減率
        </div>
      </div>

      {/* 横並びマップ */}
      <div
        style={{
          position: "absolute",
          top: 240,
          left: 20,
          right: 20,
          bottom: 200,
          display: "flex",
          gap: 20,
        }}
      >
        <div style={{ flex: 1, textAlign: "center" }}>
          <MapSvg paths={tokyoPaths} isDark={isDark} />
          <div
            style={{
              fontSize: 24,
              fontWeight: FONT.weight.black,
              color: colors.foreground,
              marginTop: 8,
            }}
          >
            東京都
          </div>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <MapSvg paths={osakaPaths} isDark={isDark} />
          <div
            style={{
              fontSize: 24,
              fontWeight: FONT.weight.black,
              color: colors.foreground,
              marginTop: 8,
            }}
          >
            大阪府
          </div>
        </div>
      </div>

      {/* レジェンド */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 80,
          right: 80,
        }}
      >
        <DivergingColorLegend
          width={920}
          height={40}
          maxAbs={maxAbs}
          fontSize={14}
          textColor={colors.muted}
        />
      </div>
    </AbsoluteFill>
  );
};

/** Detail scene: 全画面マップ + Top/Bottom コールアウト */
const DetailScene: React.FC<{
  paths: CityPathInfo[];
  prefName: string;
  isDark: boolean;
  colors: ColorScheme;
}> = ({ paths, prefName, isDark, colors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { top, bottom } = getTopBottom(paths);

  const mapOpacity = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 80 },
  });

  const cardSlide = spring({
    frame: frame - 15,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        fontFamily: FONT.family,
      }}
    >
      {/* タイトル */}
      <div
        style={{
          position: "absolute",
          top: 50,
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: 40,
            fontWeight: FONT.weight.black,
            color: colors.foreground,
          }}
        >
          {prefName}
        </div>
        <div
          style={{
            fontSize: 18,
            color: colors.muted,
            marginTop: 4,
          }}
        >
          2025→2045 人口増減率
        </div>
      </div>

      {/* 全画面マップ */}
      <div
        style={{
          position: "absolute",
          top: 140,
          left: 30,
          right: 30,
          bottom: 480,
          opacity: mapOpacity,
        }}
      >
        <MapSvg paths={paths} isDark={isDark} />
      </div>

      {/* コールアウトカード */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 30,
          right: 30,
          display: "flex",
          gap: 16,
          opacity: cardSlide,
          transform: `translateY(${(1 - cardSlide) * 30}px)`,
        }}
      >
        {/* 増加 Top */}
        <div
          style={{
            flex: 1,
            backgroundColor: isDark
              ? "rgba(59, 130, 246, 0.1)"
              : "rgba(59, 130, 246, 0.05)",
            borderRadius: 16,
            padding: SPACING.md,
            border: `1px solid ${isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.15)"}`,
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: FONT.weight.black,
              color: "#3B82F6",
              marginBottom: 12,
            }}
          >
            増加 Top3
          </div>
          {top.map((item, i) => (
            <div
              key={item.areaCode}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  fontWeight: FONT.weight.bold,
                  color: colors.foreground,
                }}
              >
                {i + 1}. {item.areaName}
              </span>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: FONT.weight.black,
                  color: "#3B82F6",
                }}
              >
                +{((item.ratio - 1) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>

        {/* 減少 Bottom */}
        <div
          style={{
            flex: 1,
            backgroundColor: isDark
              ? "rgba(239, 68, 68, 0.1)"
              : "rgba(239, 68, 68, 0.05)",
            borderRadius: 16,
            padding: SPACING.md,
            border: `1px solid ${isDark ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.15)"}`,
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: FONT.weight.black,
              color: BRAND.danger,
              marginBottom: 12,
            }}
          >
            減少 Top3
          </div>
          {bottom.map((item, i) => (
            <div
              key={item.areaCode}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  fontWeight: FONT.weight.bold,
                  color: colors.foreground,
                }}
              >
                {i + 1}. {item.areaName}
              </span>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: FONT.weight.black,
                  color: BRAND.danger,
                }}
              >
                {((item.ratio - 1) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Compare scene: 横並び + 差異ハイライト */
const CompareScene: React.FC<{
  tokyoPaths: CityPathInfo[];
  osakaPaths: CityPathInfo[];
  isDark: boolean;
  colors: ColorScheme;
  maxAbs: number;
}> = ({ tokyoPaths, osakaPaths, isDark, colors, maxAbs }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 80 },
  });

  const tokyoAvg =
    tokyoPaths.reduce((sum, p) => sum + p.ratio, 0) / tokyoPaths.length;
  const osakaAvg =
    osakaPaths.reduce((sum, p) => sum + p.ratio, 0) / osakaPaths.length;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        fontFamily: FONT.family,
        opacity: fadeIn,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 0,
          right: 0,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 36,
            fontWeight: FONT.weight.black,
            color: colors.foreground,
          }}
        >
          東京 vs 大阪 比較
        </div>
      </div>

      {/* 横並びマップ */}
      <div
        style={{
          position: "absolute",
          top: 140,
          left: 20,
          right: 20,
          bottom: 400,
          display: "flex",
          gap: 20,
        }}
      >
        <div style={{ flex: 1 }}>
          <MapSvg paths={tokyoPaths} isDark={isDark} />
        </div>
        <div style={{ flex: 1 }}>
          <MapSvg paths={osakaPaths} isDark={isDark} />
        </div>
      </div>

      {/* 比較統計 */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: 40,
          right: 40,
          display: "flex",
          gap: 20,
        }}
      >
        {[
          { name: "東京都", avg: tokyoAvg, paths: tokyoPaths },
          { name: "大阪府", avg: osakaAvg, paths: osakaPaths },
        ].map(({ name, avg, paths: p }) => {
          const increaseCount = p.filter((x) => x.ratio >= 1).length;
          const decreaseCount = p.filter((x) => x.ratio < 1).length;
          return (
            <div
              key={name}
              style={{
                flex: 1,
                backgroundColor: isDark
                  ? "rgba(30, 41, 59, 0.9)"
                  : "rgba(248, 250, 252, 0.95)",
                borderRadius: 16,
                padding: SPACING.md,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"}`,
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: FONT.weight.black,
                  color: colors.foreground,
                  marginBottom: 12,
                }}
              >
                {name}
              </div>
              <div style={{ fontSize: 18, color: colors.muted, marginBottom: 8 }}>
                平均増減率:{" "}
                <span
                  style={{
                    fontWeight: FONT.weight.black,
                    color: avg >= 1 ? "#3B82F6" : BRAND.danger,
                  }}
                >
                  {avg >= 1 ? "+" : ""}
                  {((avg - 1) * 100).toFixed(1)}%
                </span>
              </div>
              <div style={{ fontSize: 16, color: colors.muted }}>
                <span style={{ color: "#3B82F6" }}>増加: {increaseCount}</span>
                {" / "}
                <span style={{ color: BRAND.danger }}>減少: {decreaseCount}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* レジェンド */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 80,
          right: 80,
        }}
      >
        <DivergingColorLegend
          width={920}
          height={36}
          maxAbs={maxAbs}
          fontSize={12}
          textColor={colors.muted}
        />
      </div>
    </AbsoluteFill>
  );
};

/**
 * Composition D: Static + テキストオーバーレイ リール (1080x1920, 30fps)
 */
export const ChoroplethStaticReel: React.FC<ChoroplethStaticReelProps> = ({
  tokyoPaths,
  osakaPaths,
  maxAbs,
  theme = "dark",
}) => {
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";

  const hookFrom = 0;
  const tokyoFrom = hookFrom + HOOK_DURATION;
  const osakaFrom = tokyoFrom + DETAIL_DURATION;
  const compareFrom = osakaFrom + DETAIL_DURATION;
  const ctaFrom = compareFrom + COMPARE_DURATION;

  return (
    <AbsoluteFill>
      {/* Hook */}
      <Sequence from={hookFrom} durationInFrames={HOOK_DURATION}>
        <HookScene
          tokyoPaths={tokyoPaths}
          osakaPaths={osakaPaths}
          isDark={isDark}
          colors={colors}
          maxAbs={maxAbs}
        />
      </Sequence>

      {/* 東京詳細 */}
      <Sequence from={tokyoFrom} durationInFrames={DETAIL_DURATION}>
        <DetailScene
          paths={tokyoPaths}
          prefName="東京都"
          isDark={isDark}
          colors={colors}
        />
      </Sequence>

      {/* 大阪詳細 */}
      <Sequence from={osakaFrom} durationInFrames={DETAIL_DURATION}>
        <DetailScene
          paths={osakaPaths}
          prefName="大阪府"
          isDark={isDark}
          colors={colors}
        />
      </Sequence>

      {/* 比較 */}
      <Sequence from={compareFrom} durationInFrames={COMPARE_DURATION}>
        <CompareScene
          tokyoPaths={tokyoPaths}
          osakaPaths={osakaPaths}
          isDark={isDark}
          colors={colors}
          maxAbs={maxAbs}
        />
      </Sequence>

      {/* CTA */}
      <Sequence from={ctaFrom} durationInFrames={CTA_DURATION}>
        <AbsoluteFill
          style={{
            backgroundColor: colors.background,
            fontFamily: FONT.family,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 24,
              color: colors.muted,
              marginBottom: 16,
            }}
          >
            詳しいデータはこちら
          </div>
          <div
            style={{
              fontSize: 42,
              fontWeight: FONT.weight.black,
              color: BRAND.primary,
            }}
          >
            stats47.jp
          </div>
          <div
            style={{
              fontSize: 18,
              color: colors.muted,
              marginTop: 8,
            }}
          >
            統計で見る都道府県
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

/** Static Reel の合計フレーム数 */
export const STATIC_REEL_DURATION =
  HOOK_DURATION + DETAIL_DURATION * 2 + COMPARE_DURATION + CTA_DURATION; // 510f = 17s
