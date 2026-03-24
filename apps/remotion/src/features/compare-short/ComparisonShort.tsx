import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { ReelLastPage, SafetyZoneOverlay, type ThemeName } from "@/shared";
import type { ComparisonIndicator } from "@/shared";
import { ComparisonIntro } from "./ComparisonIntro";
import { ComparisonSlide } from "./ComparisonSlide";
import { ComparisonSummary } from "./ComparisonSummary";

export interface ComparisonShortProps {
  areaNameA: string;
  areaNameB: string;
  /** 地域A のコード (5桁, 例: "27000") */
  areaCodeA: string;
  /** 地域B のコード (5桁, 例: "23000") */
  areaCodeB: string;
  /** 比較指標 */
  indicators: ComparisonIndicator[];
  /** テーマ */
  theme?: ThemeName;
  /** フックテキスト */
  hookText?: string;
  /** SNS セーフエリア表示 */
  showSafeAreas?: boolean;
  /** BGM パス */
  musicPath?: string;
}

/** シーン持続時間 (フレーム数, fps=30) */
const DURATION = {
  intro: 150,     // 5秒
  indicator: 210, // 7秒（値の読み取り＋理解に十分な時間）
  summary: 180,   // 6秒
  cta: 150,       // 5秒
} as const;

/**
 * 比較ショート動画のタイムラインを計算
 */
export const getComparisonShortTimeline = (indicatorCount: number) => {
  const indicatorStart = DURATION.intro;
  const summaryStart = indicatorStart + indicatorCount * DURATION.indicator;
  const ctaStart = summaryStart + DURATION.summary;
  const totalDuration = ctaStart + DURATION.cta;

  return {
    indicatorStart,
    summaryStart,
    ctaStart,
    totalDuration,
  };
};

/**
 * 比較ショート動画 (1080x1920, 9:16)
 *
 * シーン構成:
 * 1. ComparisonIntro — VS イントロ（GES 上下分割）
 * 2. ComparisonSlide × N — 各指標の比較（GES 上下分割 + データ表示）
 * 3. ComparisonSummary — 勝敗まとめ
 * 4. ReelLastPage — CTA エンディング
 */
export const ComparisonShort: React.FC<ComparisonShortProps> = ({
  areaNameA,
  areaNameB,
  areaCodeA,
  areaCodeB,
  indicators,
  theme = "dark",
  hookText = "どっちが上？",
  showSafeAreas = false,
  musicPath,
}) => {
  const bgmPath = musicPath || staticFile("music/bgm.mp3");
  const timeline = getComparisonShortTimeline(indicators.length);

  return (
    <>
      <Audio src={bgmPath} />

      {/* 1. イントロ: VS 表示 */}
      <Sequence from={0} durationInFrames={DURATION.intro} name="Intro">
        <ComparisonIntro
          areaNameA={areaNameA}
          areaNameB={areaNameB}
          areaCodeA={areaCodeA}
          areaCodeB={areaCodeB}
          hookText={hookText}
          theme={theme}
        />
      </Sequence>

      {/* 2. 各指標の比較 */}
      {indicators.map((indicator, i) => (
        <Sequence
          key={indicator.label}
          from={timeline.indicatorStart + i * DURATION.indicator}
          durationInFrames={DURATION.indicator}
          name={`Indicator-${i + 1}`}
        >
          <ComparisonSlide
            areaNameA={areaNameA}
            areaNameB={areaNameB}
            areaCodeA={areaCodeA}
            areaCodeB={areaCodeB}
            indicator={indicator}
            indicatorIndex={i + 1}
            totalIndicators={indicators.length}
            theme={theme}
          />
        </Sequence>
      ))}

      {/* 3. サマリー */}
      <Sequence
        from={timeline.summaryStart}
        durationInFrames={DURATION.summary}
        name="Summary"
      >
        <ComparisonSummary
          areaNameA={areaNameA}
          areaNameB={areaNameB}
          areaCodeA={areaCodeA}
          areaCodeB={areaCodeB}
          indicators={indicators}
          theme={theme}
        />
      </Sequence>

      {/* 4. CTA */}
      <Sequence
        from={timeline.ctaStart}
        durationInFrames={DURATION.cta}
        name="CTA"
      >
        <ReelLastPage theme={theme} />
      </Sequence>

      {showSafeAreas && <SafetyZoneOverlay />}
    </>
  );
};
