import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  Video,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { formatValueWithPrecision } from "@stats47/utils";
import { getGesVideoPath } from "@/features/ranking-youtube-ges/get-ges-video-path";
import { NormalIntro } from "./NormalIntro";
import { NormalOutro } from "./NormalOutro";

import {
  BRAND,
  COLOR_SCHEMES,
  FONT,
  RANK_COLORS,
  type ThemeName,
  type RankingEntry,
  type RankingMeta,
} from "@/shared";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** 下位（47-11位）の表示フレーム数: 3秒 */
const FRAMES_LOWER = 90;
/** 上位（10-4位）の表示フレーム数: 4秒 */
const FRAMES_UPPER = 120;
/** TOP3 の表示フレーム数: 6秒 */
const FRAMES_TOP3 = 180;

/** イントロ・アウトロのフレーム数 */
const INTRO_FRAMES = 120;
const OUTRO_FRAMES = 120;

/** カードの幅 */
const CARD_W = 640;
/** カードの高さ */
const CARD_H = 700;
/** 過去カードの縮小幅 */
const PAST_CARD_W = 100;

/** BGM */
const BGM_FILES = [
  "music/bgm.mp3",
  "music/Morning.mp3",
  "music/パステルハウス BGM.mp3",
  "music/野良猫は宇宙を目指した.mp3",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RankingScrollGesProps {
  meta: RankingMeta;
  entries: RankingEntry[];
  theme?: ThemeName;
  precision?: number;
  hookText?: string;
  displayTitle?: string;
  colorScheme?: string;
  musicPath?: string;
}

interface Segment {
  entry: RankingEntry;
  start: number;
  duration: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getFramesForRank = (rank: number): number => {
  if (rank <= 3) return FRAMES_TOP3;
  if (rank <= 10) return FRAMES_UPPER;
  return FRAMES_LOWER;
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** ヘッダーオーバーレイ */
const HeaderOverlay: React.FC<{
  title: string;
  yearName?: string;
  normalizationBasis?: string;
  unit: string;
  currentRank: number;
  total: number;
}> = ({ title, yearName, normalizationBasis, unit, currentRank, total }) => {
  const progress = (total - currentRank + 1) / total;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        padding: "24px 48px",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              backgroundColor: BRAND.primary,
              color: "#FFF",
              padding: "4px 14px",
              borderRadius: 6,
              fontSize: 18,
              fontWeight: FONT.weight.black,
            }}
          >
            stats47
          </div>
          <h1 style={{ margin: 0, fontSize: 52, fontWeight: FONT.weight.black, color: "#FFF" }}>
            {title}
          </h1>
          {yearName && (
            <span
              style={{
                fontSize: 20,
                color: BRAND.secondary,
                fontWeight: FONT.weight.bold,
                border: `1px solid ${BRAND.secondary}`,
                borderRadius: 50,
                padding: "2px 12px",
              }}
            >
              {yearName}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28, fontWeight: FONT.weight.bold, color: "#FFF" }}>
            <span style={{ color: BRAND.secondary, fontSize: 36 }}>{total - currentRank + 1}</span> / {total}
          </span>
        </div>
      </div>
      {/* プログレスバー */}
      <div style={{ height: 6, width: "100%", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress * 100}%`, backgroundColor: BRAND.secondary, borderRadius: 3 }} />
      </div>
    </div>
  );
};

/** フッターオーバーレイ */
const FooterOverlay: React.FC = () => (
  <div
    style={{
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 30,
      padding: "24px 48px",
      background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)",
      fontSize: 20,
      color: "rgba(255,255,255,0.6)",
    }}
  >
    [データ出典] e-Stat 政府統計の総合窓口
  </div>
);

/** ランキングカード（右からスライドイン） */
const ScrollCard: React.FC<{
  rank: number;
  areaName: string;
  value: number;
  unit: string;
  precision: number;
  normalizationBasis?: string;
  isCurrent: boolean;
  offsetX: number;
  scale: number;
  opacity: number;
}> = ({ rank, areaName, value, unit, precision, normalizationBasis, isCurrent, offsetX, scale, opacity }) => {
  const isTop3 = rank <= 3;
  const rankColor = isTop3 ? RANK_COLORS[rank as 1 | 2 | 3] : null;

  const cardBg = isCurrent
    ? "rgba(15, 23, 42, 0.85)"
    : "rgba(15, 23, 42, 0.6)";
  const borderColor = isTop3
    ? rankColor!.from
    : isCurrent
      ? BRAND.primaryLight
      : "rgba(255,255,255,0.15)";

  return (
    <div
      style={{
        position: "absolute",
        left: offsetX,
        top: "50%",
        transform: `translateY(-50%) scale(${scale})`,
        width: isCurrent ? CARD_W : PAST_CARD_W,
        height: isCurrent ? CARD_H : CARD_H * 0.7,
        backgroundColor: cardBg,
        borderRadius: isCurrent ? 32 : 16,
        border: `2px solid ${borderColor}`,
        backdropFilter: "blur(20px)",
        boxShadow: isCurrent ? "0 20px 60px rgba(0,0,0,0.5)" : "0 4px 16px rgba(0,0,0,0.3)",
        opacity,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: isCurrent ? 32 : 8,
        overflow: "hidden",
        transition: "width 0.3s",
      }}
    >
      {isCurrent ? (
        <>
          {/* 順位 */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 12 }}>
            <span style={{ fontSize: 36, color: "rgba(255,255,255,0.5)" }}>第</span>
            <span
              style={{
                fontSize: isTop3 ? 160 : 130,
                fontWeight: FONT.weight.black,
                lineHeight: 1,
                color: isTop3 ? rankColor!.from : "#FFF",
              }}
            >
              {rank}
            </span>
            <span style={{ fontSize: 36, color: "rgba(255,255,255,0.5)" }}>位</span>
          </div>

          {/* 区切り線 */}
          <div style={{ width: "60%", height: 3, backgroundColor: borderColor, marginBottom: 20 }} />

          {/* 都道府県名 */}
          <div
            style={{
              fontSize: 100,
              fontWeight: FONT.weight.black,
              color: "#FFF",
              marginBottom: 20,
            }}
          >
            {areaName}
          </div>

          {/* 数値 */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span
                style={{
                  fontSize: 76,
                  fontWeight: FONT.weight.black,
                  color: isTop3 ? rankColor!.from : BRAND.primaryLight,
                }}
              >
                {formatValueWithPrecision(value, precision)}
              </span>
              <span style={{ fontSize: 30, color: "rgba(255,255,255,0.5)" }}>{unit}</span>
            </div>
            {normalizationBasis && (
              <span style={{ fontSize: 20, color: "rgba(255,255,255,0.4)" }}>
                {normalizationBasis}
              </span>
            )}
          </div>
        </>
      ) : (
        <>
          {/* 縮小版: 順位と県名のみ */}
          <span
            style={{
              fontSize: 28,
              fontWeight: FONT.weight.black,
              color: isTop3 ? rankColor!.from : "rgba(255,255,255,0.8)",
              lineHeight: 1,
              marginBottom: 4,
            }}
          >
            {rank}
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: FONT.weight.bold,
              color: "rgba(255,255,255,0.5)",
              writingMode: "vertical-rl",
              textOrientation: "upright",
              letterSpacing: 2,
            }}
          >
            {areaName.replace(/[県府都道]$/, "")}
          </span>
        </>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Body
// ---------------------------------------------------------------------------

const ScrollGesBody: React.FC<{
  meta: RankingMeta;
  entries: RankingEntry[];
  segments: Segment[];
  precision: number;
}> = ({ meta, entries, segments, precision }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 現在のセグメントを特定
  const currentSegmentIndex = useMemo(() => {
    const idx = segments.findIndex((s) => frame >= s.start && frame < s.start + s.duration);
    return idx === -1 ? segments.length - 1 : idx;
  }, [frame, segments]);

  const activeSegment = segments[currentSegmentIndex];
  const localFrame = frame - activeSegment.start;

  // カードのスライドインアニメーション
  const slideIn = spring({
    frame: localFrame,
    from: 0,
    to: 1,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  // 現在のカードの位置: 右端からスライドして画面中央に配置
  const currentCardX = interpolate(slideIn, [0, 1], [1920 + 100, (1920 - CARD_W) / 2 + 200]);

  // 過去カードの配置: 左側に積み重ね
  const visiblePastCount = Math.min(currentSegmentIndex, 6);

  return (
    <AbsoluteFill style={{ fontFamily: FONT.family, overflow: "hidden" }}>
      {/* GES 背景動画 */}
      {segments.map((seg) => (
        <Sequence
          key={`bg-${seg.entry.areaCode}`}
          from={seg.start}
          durationInFrames={seg.duration}
          layout="none"
        >
          <AbsoluteFill style={{ zIndex: 0 }}>
            <Video
              src={getGesVideoPath(seg.entry.areaCode, "landscape")}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              muted
            />
            {/* 暗めのオーバーレイ */}
            <AbsoluteFill
              style={{
                background: "linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.4) 100%)",
              }}
            />
          </AbsoluteFill>
        </Sequence>
      ))}

      {/* ヘッダー */}
      <HeaderOverlay
        title={meta.title}
        yearName={meta.yearName}
        normalizationBasis={meta.normalizationBasis}
        unit={meta.unit}
        currentRank={activeSegment.entry.rank}
        total={entries.length}
      />

      {/* カード群 */}
      <div style={{ position: "absolute", inset: 0, zIndex: 20 }}>
        {/* 過去のカード（左に積み重ね） */}
        {Array.from({ length: visiblePastCount }, (_, i) => {
          const pastIdx = currentSegmentIndex - visiblePastCount + i;
          if (pastIdx < 0) return null;
          const pastSeg = segments[pastIdx];
          const stackX = 60 + i * (PAST_CARD_W + 8);
          const stackOpacity = 0.3 + (i / visiblePastCount) * 0.5;

          return (
            <ScrollCard
              key={pastSeg.entry.areaCode}
              rank={pastSeg.entry.rank}
              areaName={pastSeg.entry.areaName}
              value={pastSeg.entry.value}
              unit={meta.unit}
              precision={precision}
              isCurrent={false}
              offsetX={stackX}
              scale={1}
              opacity={stackOpacity}
            />
          );
        })}

        {/* 現在のカード */}
        <ScrollCard
          rank={activeSegment.entry.rank}
          areaName={activeSegment.entry.areaName}
          value={activeSegment.entry.value}
          unit={meta.unit}
          precision={precision}
          normalizationBasis={meta.normalizationBasis}
          isCurrent={true}
          offsetX={currentCardX}
          scale={1}
          opacity={1}
        />
      </div>

      {/* フッター */}
      <FooterOverlay />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const RankingScrollGes: React.FC<RankingScrollGesProps> = ({
  meta,
  entries,
  theme = "dark",
  precision = 2,
  hookText,
  displayTitle,
  colorScheme = "interpolateBlues",
  musicPath,
}) => {
  const { fps } = useVideoConfig();

  // 47位→1位の降順
  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.rank - a.rank),
    [entries]
  );

  // セグメント計算
  const segments: Segment[] = useMemo(() => {
    let currentFrame = 0;
    return sortedEntries.map((entry) => {
      const duration = getFramesForRank(entry.rank);
      const start = currentFrame;
      currentFrame += duration;
      return { entry, start, duration };
    });
  }, [sortedEntries]);

  const mainDuration = segments.reduce((sum, s) => sum + s.duration, 0);
  const outroStart = INTRO_FRAMES + mainDuration;

  const bgmPath = useMemo(() => {
    if (musicPath) return musicPath;
    let hash = 0;
    for (let i = 0; i < meta.title.length; i++) {
      hash = ((hash << 5) - hash + meta.title.charCodeAt(i)) | 0;
    }
    return staticFile(BGM_FILES[Math.abs(hash) % BGM_FILES.length]);
  }, [musicPath, meta.title]);

  return (
    <>
      <Audio src={bgmPath} loop />

      <Sequence from={0} durationInFrames={INTRO_FRAMES} name="Intro">
        <NormalIntro
          title={meta.title}
          yearName={meta.yearName}
          subtitle={meta.subtitle}
          theme={theme}
          entries={entries}
          colorScheme={colorScheme}
          hookText={hookText}
          displayTitle={displayTitle}
        />
      </Sequence>

      <Sequence from={INTRO_FRAMES} durationInFrames={mainDuration} name="Main">
        <ScrollGesBody
          meta={meta}
          entries={entries}
          segments={segments}
          precision={precision}
        />
      </Sequence>

      <Sequence from={outroStart} durationInFrames={OUTRO_FRAMES} name="Outro">
        <NormalOutro theme={theme} />
      </Sequence>
    </>
  );
};
