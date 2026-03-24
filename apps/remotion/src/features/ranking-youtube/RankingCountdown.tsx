import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Sequence,
  Video,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { formatValueWithPrecision } from "@stats47/utils";
import { getGesVideoPath } from "@/features/ranking-youtube-ges/get-ges-video-path";
import { SimpleLineChart } from "@/shared/components/charts/SimpleLineChart";

import {
  BRAND,
  COLOR_SCHEMES,
  FONT,
  RANK_COLORS,
  SafetyZoneOverlay,
  type ColorScheme,
  type ThemeName,
  type RankingEntry,
  type RankingMeta,
} from "@/shared";

// ---------------------------------------------------------------------------
// Constants & Types
// ---------------------------------------------------------------------------

/** 余白設定 */
const PADDING = 60;
/** ヘッダー高さ */
const HEADER_H = 140;
/** フッター高さ (データ出典用) */
const FOOTER_H = 80;
/** コンテンツ領域の高さ */
const CONTENT_H = 1080 - HEADER_H - FOOTER_H;
/** 左ペイン幅 (40%) */
const LEFT_W = 1920 * 0.4;
/** 右ペイン幅 (60%) */
const RIGHT_W = 1920 * 0.6;

interface RankingCountdownProps {
  meta: RankingMeta;
  entries: RankingEntry[];
  theme?: ThemeName;
  showSafeAreas?: boolean;
  precision?: number;
}

/** 
 * 順位に応じた表示時間を計算する 
 * 47-11位: 4秒
 * 10-4位: 10秒
 * 3-1位: 15秒
 */
export const getDurationForRank = (rank: number, fps: number): number => {
  if (rank <= 3) return fps * 15;
  if (rank <= 10) return fps * 10;
  return fps * 4;
};

/** 全体の合計フレーム数を計算 */
export const getTotalFrames = (entries: RankingEntry[], fps: number): number => {
  return entries.reduce((sum, entry) => sum + getDurationForRank(entry.rank, fps), 0);
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** ヘッダーコンポーネント: タイトル + プログレスバー */
const HeaderWithProgress: React.FC<{
  title: string;
  progress: number; // 0 to 1
  currentRank: number;
  isDark: boolean;
  colors: ColorScheme;
}> = ({ title, progress, currentRank, isDark, colors }) => {
  return (
    <div style={{
      height: HEADER_H,
      width: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      padding: `0 ${PADDING}px`,
      boxSizing: "border-box",
      borderBottom: `2px solid ${colors.border}`,
      backgroundColor: colors.background,
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 10,
      }}>
        <h1 style={{
          margin: 0,
          fontSize: 48,
          fontWeight: FONT.weight.black,
          color: colors.foreground,
        }}>
          {title}
        </h1>
        <div style={{
          fontSize: 32,
          fontWeight: FONT.weight.bold,
          color: colors.muted,
        }}>
          <span style={{ color: BRAND.primary, fontSize: 40 }}>{47 - currentRank + 1}</span> / 47
        </div>
      </div>
      {/* プログレスバー */}
      <div style={{
        height: 12,
        width: "100%",
        backgroundColor: `${colors.muted}33`,
        borderRadius: 6,
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${progress * 100}%`,
          backgroundColor: BRAND.primary,
          transition: "width 0.3s ease-out",
        }} />
      </div>
    </div>
  );
};

/** フッターコンポーネント: データ出典 */
const Footer: React.FC<{
  source?: string;
  colors: ColorScheme;
}> = ({ source, colors }) => {
  return (
    <div style={{
      height: FOOTER_H,
      width: "100%",
      display: "flex",
      alignItems: "center",
      padding: `0 ${PADDING}px`,
      boxSizing: "border-box",
      borderTop: `1px solid ${colors.border}`,
      backgroundColor: colors.background,
      fontSize: 24,
      color: colors.muted,
    }}>
      [データ出典] {source || "e-Stat 政府統計の総合窓口"}
    </div>
  );
};

/** 順位カード (Countdown版) */
const CountdownRankCard: React.FC<{
  rank: number;
  areaName: string;
  value: number;
  unit: string;
  precision: number;
  colors: ColorScheme;
}> = ({ rank, areaName, value, unit, precision, colors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isTop3 = rank <= 3;
  const rankColor = isTop3 ? RANK_COLORS[rank as 1 | 2 | 3] : null;

  const springConfig = { damping: 12, mass: 0.8 };
  const entrySpring = spring({ frame, from: 0, to: 1, fps, config: springConfig });
  
  const displayValue = interpolate(
    spring({ frame: frame - 15, from: 0, to: 1, fps }),
    [0, 1],
    [0, value]
  );

  return (
    <div style={{
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: 20,
      opacity: entrySpring,
      transform: `translateY(${interpolate(entrySpring, [0, 1], [40, 0])}px)`,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span style={{ fontSize: 40, color: colors.muted }}>第</span>
        <span style={{
          fontSize: isTop3 ? 180 : 140,
          fontWeight: FONT.weight.black,
          color: isTop3 ? rankColor!.from : colors.foreground,
          lineHeight: 1,
        }}>
          {rank}
        </span>
        <span style={{ fontSize: 40, color: colors.muted }}>位</span>
      </div>
      
      <div style={{
        fontSize: 100,
        fontWeight: FONT.weight.black,
        color: colors.foreground,
      }}>
        {areaName}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <span style={{
          fontSize: 72,
          fontWeight: FONT.weight.bold,
          color: BRAND.primary,
        }}>
          {formatValueWithPrecision(displayValue, precision)}
        </span>
        <span style={{ fontSize: 36, color: colors.muted }}>{unit}</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const RankingCountdown: React.FC<RankingCountdownProps> = ({
  meta,
  entries,
  theme = "dark",
  showSafeAreas = false,
  precision = 0,
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";

  // 47位から1位の降順
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => b.rank - a.rank);
  }, [entries]);

  // 各セグメントの開始フレームと持続時間を計算
  const segments = useMemo(() => {
    let currentFrame = 0;
    return sortedEntries.map((entry) => {
      const duration = getDurationForRank(entry.rank, fps);
      const start = currentFrame;
      currentFrame += duration;
      return { entry, start, duration };
    });
  }, [sortedEntries, fps]);

  const totalFrames = segments[segments.length - 1].start + segments[segments.length - 1].duration;
  
  // 現在のセグメントを特定
  const currentSegmentIndex = segments.findIndex(s => frame >= s.start && frame < s.start + s.duration);
  const activeSegment = currentSegmentIndex === -1 
    ? segments[segments.length - 1] 
    : segments[currentSegmentIndex];
  
  const progress = frame / totalFrames;

  // モック時系列データの生成 (本来は D1 から取得)
  const mockHistoryData = useMemo(() => {
    const baseValue = activeSegment.entry.value;
    return Array.from({ length: 11 }, (_, i) => ({
      year: 2014 + i,
      value: baseValue * (0.8 + Math.random() * 0.4),
    }));
  }, [activeSegment.entry.areaCode]);

  return (
    <AbsoluteFill style={{
      backgroundColor: colors.background,
      color: colors.foreground,
      fontFamily: FONT.family,
    }}>
      <HeaderWithProgress 
        title={meta.title}
        progress={progress}
        currentRank={activeSegment.entry.rank}
        isDark={isDark}
        colors={colors}
      />

      <div style={{
        display: "flex",
        height: CONTENT_H,
        width: "100%",
      }}>
        {/* 左ペイン: 順位カード */}
        <div style={{
          width: LEFT_W,
          height: "100%",
          padding: PADDING,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          borderRight: `1px solid ${colors.border}`,
        }}>
          {segments.map((seg, i) => (
            <Sequence
              key={seg.entry.areaCode}
              from={seg.start}
              durationInFrames={seg.duration}
              layout="none"
            >
              <CountdownRankCard 
                rank={seg.entry.rank}
                areaName={seg.entry.areaName}
                value={seg.entry.value}
                unit={meta.unit}
                precision={precision}
                colors={colors}
              />
            </Sequence>
          ))}
        </div>

        {/* 右ペイン: チャート + 背景動画 */}
        <div style={{
          width: RIGHT_W,
          height: "100%",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* 背景 GES 動画 */}
          <AbsoluteFill>
            {segments.map((seg) => (
              <Sequence
                key={`bg-${seg.entry.areaCode}`}
                from={seg.start}
                durationInFrames={seg.duration}
                layout="none"
              >
                <Video 
                  src={getGesVideoPath(seg.entry.areaCode, "landscape")}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  muted
                />
              </Sequence>
            ))}
            <AbsoluteFill style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1 }} />
          </AbsoluteFill>

          {/* 前景: チャート */}
          <div style={{
            position: "relative",
            zIndex: 10,
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: PADDING,
            boxSizing: "border-box",
          }}>
            {activeSegment.entry.rank <= 10 && (
              <div style={{
                width: "100%",
                padding: "40px",
                backgroundColor: "rgba(0,0,0,0.6)",
                borderRadius: 24,
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(20px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}>
                <h2 style={{ 
                  color: "white", 
                  fontSize: 36, 
                  marginBottom: 20,
                  fontWeight: FONT.weight.bold,
                }}>
                  過去10年間の推移 ({meta.unit})
                </h2>
                <div style={{ width: "100%", height: 360 }}>
                  <SimpleLineChart 
                    data={mockHistoryData}
                    width={RIGHT_W - PADDING * 4}
                    height={360}
                    colors={colors}
                    unit={meta.unit}
                  />
                </div>
              </div>
            )}
            
            {/* 解説テロップ領域 */}
            {activeSegment.entry.rank <= 3 && (
              <div style={{
                marginTop: 40,
                padding: "30px 50px",
                backgroundColor: BRAND.primary,
                borderRadius: 20,
                color: "white",
                fontSize: 32,
                fontWeight: FONT.weight.bold,
                textAlign: "center",
                maxWidth: "90%",
                boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
              }}>
                ここに都道府県別の解説テキスト（AI提示のインサイトなど）が表示されます。
                順位に合わせて自動で切り替わります。
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer source={meta.normalizationBasis} colors={colors} />

      {showSafeAreas && <SafetyZoneOverlay />}
    </AbsoluteFill>
  );
};
