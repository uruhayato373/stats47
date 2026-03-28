import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { formatValueWithPrecision } from "@stats47/utils";
import { NormalIntro } from "./NormalIntro";
import { NormalOutro } from "./NormalOutro";

import {
  BRAND,
  COLOR_SCHEMES,
  FONT,
  RANK_COLORS,
  type ColorScheme,
  type ThemeName,
  type RankingEntry,
  type RankingMeta,
} from "@/shared";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** 各都道府県の表示フレーム数（デフォルト 3秒） */
const DEFAULT_FRAMES_PER_PREF = 90; // 3s @ 30fps

/** 1画面に表示する行数 */
const VISIBLE_ROWS = 8;

/** 行の高さ */
const ROW_H = 100;

/** 左マージン（順位+都道府県名エリア） */
const LABEL_W = 380;

/** 右マージン（数値表示エリア） */
const VALUE_W = 200;

/** バーの最大幅 */
const BAR_MAX_W = 1920 - LABEL_W - VALUE_W - 120; // 左右パディング込み

/** ヘッダー高さ */
const HEADER_H = 140;

/** フッター高さ */
const FOOTER_H = 80;

/** イントロ・アウトロのフレーム数 */
const INTRO_FRAMES = 120;
const OUTRO_FRAMES = 120;

// ---------------------------------------------------------------------------
// BGM
// ---------------------------------------------------------------------------

const BGM_FILES = [
  "music/bgm.mp3",
  "music/Morning.mp3",
  "music/パステルハウス BGM.mp3",
  "music/野良猫は宇宙を目指した.mp3",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RankingHorizontalBarProps {
  meta: RankingMeta;
  entries: RankingEntry[];
  theme?: ThemeName;
  showSafeAreas?: boolean;
  framesPerPref?: number;
  precision?: number;
  musicPath?: string;
  hookText?: string;
  displayTitle?: string;
  colorScheme?: string;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** ヘッダー: タイトル + プログレス */
const Header: React.FC<{
  meta: RankingMeta;
  title: string;
  yearName?: string;
  unit: string;
  currentRank: number;
  totalEntries: number;
  colors: ColorScheme;
  isDark: boolean;
}> = ({ meta, title, yearName, unit, currentRank, totalEntries, colors, isDark }) => {
  const progress = (totalEntries - currentRank + 1) / totalEntries;

  return (
    <div
      style={{
        height: HEADER_H,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 60px",
        boxSizing: "border-box",
        borderBottom: `2px solid ${colors.border}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              backgroundColor: BRAND.primary,
              color: "#FFF",
              padding: "6px 18px",
              borderRadius: 6,
              fontSize: 20,
              fontWeight: FONT.weight.black,
            }}
          >
            stats47
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 42,
              fontWeight: FONT.weight.black,
              color: colors.foreground,
            }}
          >
            {title}
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {yearName && (
            <span
              style={{
                fontSize: 24,
                fontWeight: FONT.weight.bold,
                color: BRAND.secondary,
                border: `1px solid ${BRAND.secondary}`,
                borderRadius: 50,
                padding: "4px 16px",
              }}
            >
              {yearName}
            </span>
          )}
          <span style={{ fontSize: 22, color: colors.muted, fontWeight: FONT.weight.bold }}>
            {meta.normalizationBasis ? `${meta.normalizationBasis}（${unit}）` : `単位: ${unit}`}
          </span>
          <div
            style={{
              fontSize: 28,
              fontWeight: FONT.weight.bold,
              color: colors.muted,
            }}
          >
            <span style={{ color: BRAND.primaryLight, fontSize: 36 }}>
              {totalEntries - currentRank + 1}
            </span>{" "}
            / {totalEntries}
          </div>
        </div>
      </div>
      {/* プログレスバー */}
      <div
        style={{
          height: 8,
          width: "100%",
          backgroundColor: `${colors.muted}22`,
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress * 100}%`,
            backgroundColor: BRAND.primary,
            borderRadius: 4,
          }}
        />
      </div>
    </div>
  );
};

/** フッター */
const Footer: React.FC<{
  source?: string;
  colors: ColorScheme;
}> = ({ source, colors }) => (
  <div
    style={{
      height: FOOTER_H,
      width: "100%",
      display: "flex",
      alignItems: "center",
      padding: "0 60px",
      boxSizing: "border-box",
      borderTop: `1px solid ${colors.border}`,
      fontSize: 22,
      color: colors.muted,
    }}
  >
    [データ出典] {source || "e-Stat 政府統計の総合窓口"}
  </div>
);

/** 横棒グラフの1行 */
const BarRow: React.FC<{
  rank: number;
  areaName: string;
  value: number;
  maxValue: number;
  unit: string;
  precision: number;
  colors: ColorScheme;
  isCurrent: boolean;
  animProgress: number;
}> = ({ rank, areaName, value, maxValue, precision, colors, isCurrent, animProgress }) => {
  const isTop3 = rank <= 3;
  const rankColor = isTop3 ? RANK_COLORS[rank as 1 | 2 | 3] : null;

  const barWidth = (value / maxValue) * BAR_MAX_W * animProgress;
  const barColor = isTop3
    ? rankColor!.from
    : isCurrent
      ? BRAND.primaryLight
      : `${BRAND.primaryLight}88`;

  const rowOpacity = isCurrent ? 1 : 0.6;
  const rowScale = isCurrent ? 1.0 : 0.95;

  return (
    <div
      style={{
        height: ROW_H,
        width: "100%",
        display: "flex",
        alignItems: "center",
        padding: "0 60px",
        boxSizing: "border-box",
        opacity: rowOpacity,
        transform: `scale(${rowScale})`,
        transformOrigin: "left center",
      }}
    >
      {/* 順位 */}
      <div
        style={{
          width: 80,
          fontSize: isCurrent ? 48 : 36,
          fontWeight: FONT.weight.black,
          color: isTop3 ? rankColor!.from : isCurrent ? colors.foreground : colors.muted,
          textAlign: "right",
          marginRight: 20,
        }}
      >
        {rank}
      </div>

      {/* 都道府県名 */}
      <div
        style={{
          width: 260,
          fontSize: isCurrent ? 44 : 34,
          fontWeight: FONT.weight.black,
          color: isCurrent ? colors.foreground : colors.muted,
          letterSpacing: isCurrent ? 2 : 0,
        }}
      >
        {areaName}
      </div>

      {/* 横棒 */}
      <div
        style={{
          flex: 1,
          height: isCurrent ? 52 : 36,
          position: "relative",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            height: "100%",
            width: barWidth,
            borderRadius: 6,
            background: isTop3
              ? `linear-gradient(90deg, ${rankColor!.from}, ${rankColor!.to})`
              : barColor,
            boxShadow: isCurrent ? `0 4px 16px ${barColor}44` : "none",
          }}
        />
      </div>

      {/* 数値 */}
      <div
        style={{
          width: VALUE_W,
          textAlign: "right",
          fontSize: isCurrent ? 44 : 32,
          fontWeight: FONT.weight.black,
          color: isTop3 ? rankColor!.from : isCurrent ? BRAND.primaryLight : colors.muted,
        }}
      >
        {formatValueWithPrecision(value * animProgress, precision)}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Body
// ---------------------------------------------------------------------------

const HorizontalBarBody: React.FC<{
  meta: RankingMeta;
  entries: RankingEntry[];
  theme: ThemeName;
  fpPref: number;
  precision: number;
}> = ({ meta, entries, theme, fpPref, precision }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";

  // 47位→1位
  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.rank - a.rank),
    [entries]
  );

  const maxValue = useMemo(
    () => Math.max(...entries.map((e) => e.value)),
    [entries]
  );

  // 現在の表示インデックス
  const currentIndex = Math.min(
    Math.floor(frame / fpPref),
    sortedEntries.length - 1
  );
  const currentEntry = sortedEntries[currentIndex];
  const localFrame = frame - currentIndex * fpPref;

  // 現在のエントリーのバーアニメーション
  const barSpring = spring({
    frame: localFrame,
    from: 0,
    to: 1,
    fps,
    config: { damping: 15, mass: 0.8 },
  });

  // スクロールオフセット計算: 現在のエントリーを中央付近に表示
  const centerRow = Math.floor(VISIBLE_ROWS / 2);
  const scrollTarget = Math.max(0, currentIndex - centerRow);
  const smoothScroll = interpolate(
    frame,
    [currentIndex * fpPref, currentIndex * fpPref + 15],
    [Math.max(0, (currentIndex - 1 - centerRow)) * ROW_H, scrollTarget * ROW_H],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // 表示する行の範囲
  const contentH = 1080 - HEADER_H - FOOTER_H;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        fontFamily: FONT.family,
        overflow: "hidden",
      }}
    >
      {/* 背景グリッド */}
      <AbsoluteFill style={{ zIndex: 0 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(to right, ${colors.muted}08 1px, transparent 1px), linear-gradient(to bottom, ${colors.muted}08 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
            opacity: isDark ? 0.5 : 0.3,
          }}
        />
      </AbsoluteFill>

      <Header
        meta={meta}
        title={meta.title}
        yearName={meta.yearName}
        unit={meta.unit}
        currentRank={currentEntry.rank}
        totalEntries={entries.length}
        colors={colors}
        isDark={isDark}
      />

      {/* バーチャートエリア */}
      <div
        style={{
          position: "absolute",
          top: HEADER_H,
          left: 0,
          right: 0,
          height: contentH,
          overflow: "hidden",
          zIndex: 10,
        }}
      >
        <div
          style={{
            transform: `translateY(${-smoothScroll}px)`,
            width: "100%",
          }}
        >
          {sortedEntries.map((entry, index) => {
            const isRevealed = index <= currentIndex;
            const isCurrent = index === currentIndex;

            if (!isRevealed) return null;

            const entryAnimProgress = isCurrent ? barSpring : 1;

            return (
              <BarRow
                key={entry.areaCode}
                rank={entry.rank}
                areaName={entry.areaName}
                value={entry.value}
                maxValue={maxValue}
                unit={meta.unit}
                precision={precision}
                colors={colors}
                isCurrent={isCurrent}
                animProgress={entryAnimProgress}
              />
            );
          })}
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20 }}>
        <Footer source="e-Stat 政府統計の総合窓口" colors={colors} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const RankingHorizontalBar: React.FC<RankingHorizontalBarProps> = ({
  meta,
  entries,
  theme = "dark",
  showSafeAreas = false,
  framesPerPref,
  precision = 2,
  musicPath,
  hookText,
  displayTitle,
  colorScheme = "interpolateBlues",
}) => {
  const { fps } = useVideoConfig();
  const fpPref = framesPerPref ?? DEFAULT_FRAMES_PER_PREF;

  const bgmPath = useMemo(() => {
    if (musicPath) return musicPath;
    const title = meta.title;
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = ((hash << 5) - hash + title.charCodeAt(i)) | 0;
    }
    return staticFile(BGM_FILES[Math.abs(hash) % BGM_FILES.length]);
  }, [musicPath, meta.title]);

  const mainStart = INTRO_FRAMES;
  const mainDuration = fpPref * entries.length;
  const outroStart = mainStart + mainDuration;

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

      <Sequence from={mainStart} durationInFrames={mainDuration} name="Main">
        <HorizontalBarBody
          meta={meta}
          entries={entries}
          theme={theme}
          fpPref={fpPref}
          precision={precision}
        />
      </Sequence>

      <Sequence from={outroStart} durationInFrames={OUTRO_FRAMES} name="Outro">
        <NormalOutro theme={theme} />
      </Sequence>
    </>
  );
};
