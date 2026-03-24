/**
 * stats47 サイト紹介動画
 *
 * スクリーンショット画像を Ken Burns エフェクト + テキストオーバーレイで
 * アニメーションする 16:9 動画コンポジション。
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
import { BRAND, COLOR_SCHEMES, FONT, SPACING } from "@/shared/themes/brand";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Scene {
  /** スクリーンショット画像のパス (public/ 相対) */
  image: string;
  /** メインタイトル */
  title: string;
  /** サブテキスト */
  subtitle?: string;
  /** Ken Burns: zoom 方向 */
  zoom?: "in" | "out";
  /** Ken Burns: pan 方向 */
  pan?: "left" | "right" | "up" | "down" | "none";
  /** シーンの長さ (フレーム数) */
  durationInFrames: number;
}

export interface SiteIntroProps {
  scenes?: Scene[];
  bgmPath?: string;
}

// ---------------------------------------------------------------------------
// Default scenes
// ---------------------------------------------------------------------------

const DEFAULT_SCENES: Scene[] = [
  {
    image: "images/site-intro/01-top.png",
    title: "統計で見る都道府県",
    subtitle: "800+の統計指標で47都道府県を可視化",
    zoom: "in",
    pan: "none",
    durationInFrames: 150, // 5s
  },
  {
    image: "images/site-intro/02-ranking-list.png",
    title: "ランキング",
    subtitle: "あらゆる統計を都道府県別に比較",
    zoom: "out",
    pan: "down",
    durationInFrames: 120, // 4s
  },
  {
    image: "images/site-intro/03-ranking-detail.png",
    title: "詳細データ",
    subtitle: "地図・グラフ・テーブルで多角的に分析",
    zoom: "in",
    pan: "left",
    durationInFrames: 120,
  },
  {
    image: "images/site-intro/04-ranking-map.png",
    title: "コロプレスマップ",
    subtitle: "地域差がひと目でわかる",
    zoom: "in",
    pan: "right",
    durationInFrames: 120,
  },
  {
    image: "images/site-intro/05-area-profile.png",
    title: "地域プロファイル",
    subtitle: "あなたの県の全体像を把握",
    zoom: "out",
    pan: "none",
    durationInFrames: 120,
  },
  {
    image: "images/site-intro/07-correlation.png",
    title: "相関分析",
    subtitle: "指標同士の意外な関係を発見",
    zoom: "in",
    pan: "left",
    durationInFrames: 120,
  },
  {
    image: "images/site-intro/09-blog.png",
    title: "ブログ",
    subtitle: "データの裏側を読み解く記事",
    zoom: "out",
    pan: "down",
    durationInFrames: 120,
  },
];

// ---------------------------------------------------------------------------
// Scene Component
// ---------------------------------------------------------------------------

const SceneSlide: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // --- Fade in/out ---
  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [scene.durationInFrames - 15, scene.durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const opacity = Math.min(fadeIn, fadeOut);

  // --- Ken Burns ---
  const progress = frame / scene.durationInFrames;
  const baseScale = scene.zoom === "in" ? 1.0 : 1.15;
  const endScale = scene.zoom === "in" ? 1.15 : 1.0;
  const scale = interpolate(progress, [0, 1], [baseScale, endScale]);

  let translateX = 0;
  let translateY = 0;
  const panAmount = 30; // px
  if (scene.pan === "left") translateX = interpolate(progress, [0, 1], [0, -panAmount]);
  if (scene.pan === "right") translateX = interpolate(progress, [0, 1], [0, panAmount]);
  if (scene.pan === "up") translateY = interpolate(progress, [0, 1], [0, -panAmount]);
  if (scene.pan === "down") translateY = interpolate(progress, [0, 1], [0, panAmount]);

  // --- Text spring ---
  const textSpring = spring({
    frame: frame - 10,
    fps,
    config: { damping: 15, stiffness: 80 },
  });
  const textY = interpolate(textSpring, [0, 1], [40, 0]);
  const textOpacity = interpolate(textSpring, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ opacity }}>
      {/* Background image with Ken Burns */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
        }}
      >
        <Img
          src={staticFile(scene.image)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
          }}
        />
      </div>

      {/* Dark gradient overlay at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "45%",
          background:
            "linear-gradient(to top, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.6) 50%, transparent 100%)",
        }}
      />

      {/* Text overlay */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 80,
          right: 80,
          transform: `translateY(${textY}px)`,
          opacity: textOpacity,
        }}
      >
        <div
          style={{
            fontFamily: FONT.family,
            fontWeight: FONT.weight.black,
            fontSize: 56,
            color: "#FFFFFF",
            lineHeight: 1.2,
            textShadow: "0 2px 8px rgba(0,0,0,0.5)",
          }}
        >
          {scene.title}
        </div>
        {scene.subtitle && (
          <div
            style={{
              fontFamily: FONT.family,
              fontWeight: FONT.weight.medium,
              fontSize: 28,
              color: "rgba(255,255,255,0.85)",
              marginTop: 12,
              textShadow: "0 1px 4px rgba(0,0,0,0.5)",
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
// Title Scene
// ---------------------------------------------------------------------------

const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
  });
  const subtitleSpring = spring({
    frame: frame - 20,
    fps,
    config: { damping: 15, stiffness: 60 },
  });

  const fadeOut = interpolate(frame, [120, 150], [1, 0], {
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
          fontSize: 72,
          color: "#FFFFFF",
          transform: `scale(${interpolate(logoSpring, [0, 1], [0.8, 1])})`,
          opacity: logoSpring,
        }}
      >
        stats47
      </div>
      <div
        style={{
          fontFamily: FONT.family,
          fontWeight: FONT.weight.medium,
          fontSize: 32,
          color: "rgba(255,255,255,0.8)",
          marginTop: 16,
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
// CTA Scene (ending)
// ---------------------------------------------------------------------------

const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
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
        gap: 24,
      }}
    >
      <div
        style={{
          fontFamily: FONT.family,
          fontWeight: FONT.weight.bold,
          fontSize: 36,
          color: "rgba(255,255,255,0.8)",
        }}
      >
        データで地域の違いを探索しよう
      </div>
      <div
        style={{
          fontFamily: FONT.family,
          fontWeight: FONT.weight.black,
          fontSize: 64,
          color: "#FFFFFF",
          opacity: urlSpring,
          transform: `scale(${interpolate(urlSpring, [0, 1], [0.9, 1])})`,
        }}
      >
        stats47.jp
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Main Composition
// ---------------------------------------------------------------------------

export const SiteIntro: React.FC<SiteIntroProps> = ({
  scenes = DEFAULT_SCENES,
  bgmPath,
}) => {
  const TITLE_DURATION = 150; // 5s
  const CTA_DURATION = 150; // 5s

  // Calculate start frames for each scene
  let currentFrame = TITLE_DURATION;
  const sceneStarts = scenes.map((scene) => {
    const start = currentFrame;
    currentFrame += scene.durationInFrames;
    return start;
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0F172A" }}>
      {/* BGM */}
      <Audio
        src={staticFile(bgmPath || "music/Morning.mp3")}
        volume={0.3}
      />

      {/* Title */}
      <Sequence from={0} durationInFrames={TITLE_DURATION} name="Title">
        <TitleScene />
      </Sequence>

      {/* Feature scenes */}
      {scenes.map((scene, i) => (
        <Sequence
          key={scene.image}
          from={sceneStarts[i]}
          durationInFrames={scene.durationInFrames}
          name={scene.title}
        >
          <SceneSlide scene={scene} />
        </Sequence>
      ))}

      {/* CTA */}
      <Sequence
        from={currentFrame}
        durationInFrames={CTA_DURATION}
        name="CTA"
      >
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};
