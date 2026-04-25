/**
 * stats47 サイト紹介動画 — 縦スクロール構成版
 *
 * 詳細ページのフルページスクショを縦に流し、各機能の「中身の濃さ」を見せる。
 * 個別ランキング → 地域ダッシュボード → 比較 → 相関 → テーマ → 個別ブログ。
 */
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND, FONT } from "@/shared/themes/brand";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScrollScene {
  /** スクショパス (public/ 相対) */
  image: string;
  /** スクショの native 高さ (px) — 2560 幅前提 */
  imageHeight: number;
  /** スクロール対象として使う最大高さ (native px)。これより下は見せない */
  maxScrollHeight?: number;
  title: string;
  subtitle?: string;
  durationInFrames: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CANVAS_W = 1920;
const CANVAS_H = 1080;
const IMG_W_NATIVE = 2560;

const TITLE_DURATION = 120; // 4s
const STATS_DURATION = 90; // 3s 数字モンタージュ
const CTA_DURATION = 120; // 4s

const SCROLL_SCENES: ScrollScene[] = [
  {
    image: "images/site-intro/scroll/ranking-detail.png",
    imageHeight: 5056,
    maxScrollHeight: 3500,
    title: "ランキング詳細",
    subtitle: "地図 → ランキング → 解説まで 1 画面に集約",
    durationInFrames: 180, // 6s
  },
  {
    image: "images/site-intro/scroll/area-dashboard.png",
    imageHeight: 25308,
    maxScrollHeight: 8000,
    title: "地域ダッシュボード",
    subtitle: "東京都の全カテゴリを 1 ページで俯瞰",
    durationInFrames: 240, // 8s
  },
  {
    image: "images/site-intro/scroll/compare.png",
    imageHeight: 5914,
    title: "地域間比較",
    subtitle: "2 県を選んで全カテゴリを並列で比較",
    durationInFrames: 180,
  },
  {
    image: "images/site-intro/scroll/correlation.png",
    imageHeight: 3230,
    title: "相関分析",
    subtitle: "1,477,364 ペアから意外な関係を発見",
    durationInFrames: 150, // 5s
  },
  {
    image: "images/site-intro/scroll/theme-detail.png",
    imageHeight: 3230,
    title: "テーマダッシュボード",
    subtitle: "16 のテーマで複数指標を横断分析",
    durationInFrames: 150,
  },
  {
    image: "images/site-intro/scroll/blog-article.png",
    imageHeight: 10332,
    title: "統計ブログ",
    subtitle: "「最低賃金、全県 1000 円突破の衝撃」",
    durationInFrames: 210, // 7s
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ---------------------------------------------------------------------------
// Vertical scroll scene
// ---------------------------------------------------------------------------

const VerticalScrollSlide: React.FC<{ scene: ScrollScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 画像を canvas 幅にフィットさせるスケール
  const imgScale = CANVAS_W / IMG_W_NATIVE;
  // 表示対象の高さ (maxScrollHeight があれば clip)
  const visibleNativeH = Math.min(
    scene.imageHeight,
    scene.maxScrollHeight ?? scene.imageHeight
  );
  const renderedH = scene.imageHeight * imgScale; // 画像全体のレンダ高さ
  const visibleH = visibleNativeH * imgScale; // スクロール対象のレンダ高さ
  const scrollDistance = Math.max(0, visibleH - CANVAS_H);

  // 進行: 0-0.05 はトップ静止、0.05-0.85 でスクロール、0.85-1 はボトム静止
  const t = frame / scene.durationInFrames;
  let progress: number;
  if (t < 0.05) progress = 0;
  else if (t > 0.85) progress = 1;
  else progress = (t - 0.05) / 0.8;
  progress = easeInOutCubic(progress);
  const translateY = -scrollDistance * progress;

  // フェード
  const fadeIn = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(
    frame,
    [scene.durationInFrames - 15, scene.durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const opacity = Math.min(fadeIn, fadeOut);

  // タイトルチップは bottom-left に表示
  const chipSpring = spring({
    frame: frame - 8,
    fps,
    config: { damping: 16, stiffness: 80 },
  });
  const chipY = interpolate(chipSpring, [0, 1], [40, 0]);
  const chipOpacity = interpolate(chipSpring, [0, 1], [0, 1]);
  // シーン終盤は薄くする
  const chipFadeOutEnd = interpolate(
    frame,
    [scene.durationInFrames - 30, scene.durationInFrames - 10],
    [1, 0.35],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // 進行バー
  const barProgress = progress;

  return (
    <AbsoluteFill style={{ opacity, backgroundColor: "#FFFFFF" }}>
      {/* スクロールする画像 */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <Img
          src={staticFile(scene.image)}
          style={{
            position: "absolute",
            top: translateY,
            left: 0,
            width: CANVAS_W,
            height: renderedH,
          }}
        />
      </div>

      {/* 進行バー (canvas 上端) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: "rgba(15,23,42,0.08)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${barProgress * 100}%`,
            background: BRAND.primary,
            transition: "width 0.1s linear",
          }}
        />
      </div>

      {/* 下のグラデーションでチップを読みやすく */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 220,
          background:
            "linear-gradient(to top, rgba(15,23,42,0.55) 0%, rgba(15,23,42,0) 100%)",
          opacity: chipOpacity * chipFadeOutEnd,
        }}
      />

      {/* タイトルチップ (bottom-left) */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 60,
          transform: `translateY(${chipY}px)`,
          opacity: chipOpacity * chipFadeOutEnd,
          background: "rgba(255,255,255,0.97)",
          padding: "20px 32px",
          borderRadius: 14,
          boxShadow: "0 14px 32px rgba(15,23,42,0.4)",
          maxWidth: 900,
        }}
      >
        <div
          style={{
            fontFamily: FONT.family,
            fontWeight: FONT.weight.black,
            fontSize: 44,
            color: BRAND.primary,
            lineHeight: 1.15,
            letterSpacing: "0.01em",
          }}
        >
          {scene.title}
        </div>
        {scene.subtitle && (
          <div
            style={{
              fontFamily: FONT.family,
              fontWeight: FONT.weight.medium,
              fontSize: 24,
              color: "#475569",
              marginTop: 10,
              lineHeight: 1.4,
            }}
          >
            {scene.subtitle}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Title scene
// ---------------------------------------------------------------------------

const TitleScene: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
  });
  const subtitleSpring = spring({
    frame: frame - 18,
    fps,
    config: { damping: 15, stiffness: 60 },
  });

  const fadeOut = interpolate(frame, [duration - 25, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${BRAND.primary} 0%, #1E3A8A 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          fontFamily: FONT.family,
          fontWeight: FONT.weight.black,
          fontSize: 88,
          color: "#FFFFFF",
          transform: `scale(${interpolate(logoSpring, [0, 1], [0.85, 1])})`,
          opacity: logoSpring,
          letterSpacing: "0.02em",
        }}
      >
        stats47
      </div>
      <div
        style={{
          fontFamily: FONT.family,
          fontWeight: FONT.weight.medium,
          fontSize: 36,
          color: "rgba(255,255,255,0.85)",
          marginTop: 18,
          opacity: subtitleSpring,
          transform: `translateY(${interpolate(subtitleSpring, [0, 1], [20, 0])}px)`,
        }}
      >
        統計で見る都道府県
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Stats montage (規模感)
// ---------------------------------------------------------------------------

const STATS_ITEMS = [
  { value: "1,800+", label: "ランキング" },
  { value: "119+", label: "データ解説記事" },
  { value: "16", label: "テーマダッシュボード" },
];

const StatsMontage: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [duration - 15, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${BRAND.primary} 0%, #1E3A8A 100%)`,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 100,
        opacity,
      }}
    >
      {STATS_ITEMS.map((item, i) => {
        const sp = spring({
          frame: frame - i * 8,
          fps,
          config: { damping: 14, stiffness: 90 },
        });
        const itemOpacity = interpolate(sp, [0, 1], [0, 1]);
        const itemY = interpolate(sp, [0, 1], [30, 0]);
        return (
          <div
            key={item.label}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              opacity: itemOpacity,
              transform: `translateY(${itemY}px)`,
            }}
          >
            <div
              style={{
                fontFamily: FONT.family,
                fontWeight: FONT.weight.black,
                fontSize: 120,
                color: "#FFFFFF",
                lineHeight: 1,
                letterSpacing: "0.01em",
              }}
            >
              {item.value}
            </div>
            <div
              style={{
                fontFamily: FONT.family,
                fontWeight: FONT.weight.medium,
                fontSize: 26,
                color: "rgba(255,255,255,0.85)",
                marginTop: 12,
              }}
            >
              {item.label}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// CTA scene
// ---------------------------------------------------------------------------

const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const urlSpring = spring({
    frame: frame - 15,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${BRAND.primary} 0%, #1E3A8A 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: fadeIn,
        gap: 28,
      }}
    >
      <div
        style={{
          fontFamily: FONT.family,
          fontWeight: FONT.weight.bold,
          fontSize: 40,
          color: "rgba(255,255,255,0.85)",
        }}
      >
        データで地域の違いを探索しよう
      </div>
      <div
        style={{
          fontFamily: FONT.family,
          fontWeight: FONT.weight.black,
          fontSize: 80,
          color: "#FFFFFF",
          opacity: urlSpring,
          transform: `scale(${interpolate(urlSpring, [0, 1], [0.9, 1])})`,
          letterSpacing: "0.02em",
        }}
      >
        stats47.jp
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------

export interface SiteIntroProps {
  bgmPath?: string;
}

export const SiteIntro: React.FC<SiteIntroProps> = ({ bgmPath }) => {
  let cursor = TITLE_DURATION;
  const sceneStarts = SCROLL_SCENES.map((scene) => {
    const start = cursor;
    cursor += scene.durationInFrames;
    return start;
  });
  const statsStart = cursor;
  cursor += STATS_DURATION;
  const ctaStart = cursor;

  return (
    <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
      <Audio src={staticFile(bgmPath || "music/Morning.mp3")} volume={0.3} />

      <Sequence from={0} durationInFrames={TITLE_DURATION} name="Title">
        <TitleScene duration={TITLE_DURATION} />
      </Sequence>

      {SCROLL_SCENES.map((scene, i) => (
        <Sequence
          key={scene.image}
          from={sceneStarts[i]}
          durationInFrames={scene.durationInFrames}
          name={scene.title}
        >
          <VerticalScrollSlide scene={scene} />
        </Sequence>
      ))}

      <Sequence from={statsStart} durationInFrames={STATS_DURATION} name="Stats">
        <StatsMontage duration={STATS_DURATION} />
      </Sequence>

      <Sequence from={ctaStart} durationInFrames={CTA_DURATION} name="CTA">
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};

/** SiteIntro 全体の総フレーム数 */
export const SITE_INTRO_TOTAL_FRAMES =
  TITLE_DURATION +
  SCROLL_SCENES.reduce((sum, s) => sum + s.durationInFrames, 0) +
  STATS_DURATION +
  CTA_DURATION;
