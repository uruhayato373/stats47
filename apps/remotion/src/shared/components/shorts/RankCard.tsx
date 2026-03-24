import React from "react";
import { AbsoluteFill, OffthreadVideo, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { formatValueWithPrecision } from "@stats47/utils";

import { BRAND, COLOR_SCHEMES, FONT, RANK_COLORS, SafetyZoneOverlay, type PrefectureSilhouette, type ThemeName } from "@/shared";
import { getGesVideoPath } from "@/features/ranking-youtube-ges/get-ges-video-path";


interface RankCardProps {
  /** 動画全体のタイトル（例：都道府県別 年収ランキング） */
  title: string;
  /** 順位 */
  rank: number;
  /** 都道府県名 */
  areaName: string;
  /** 数値（数値型で受け取る） */
  value: number;
  /** 単位 */
  unit: string;
  /** 小数点以下の桁数 */
  precision?: number;
  /** ランキング総数 */
  totalCount?: number;
  /** テーマ */
  theme?: ThemeName;
  /** SNS セーフエリアを表示するか */
  showSafeAreas?: boolean;
  /** false のとき値のカウントアップをスキップして最終値を即表示 */
  animated?: boolean;
  /** 都道府県シルエット（TopoJSON 由来） */
  prefSilhouette?: PrefectureSilhouette;
  /** 都道府県コード（GES背景使用時に必要） */
  areaCode?: string;
  /** GES背景動画を使用するか */
  gesBackground?: boolean;
}

/**
 * YouTube Shorts 用 ランキング発表シーン (1080x1920)
 * リッチな背景装飾、プログレスバー、巨大な順位表示、グラスモーフィズムを採用。
 */
export const RankCard: React.FC<RankCardProps> = ({
  title,
  rank,
  areaName,
  value,
  unit,
  precision = 0,
  totalCount = 47,
  theme = "dark",
  showSafeAreas = false,
  animated = true,
  prefSilhouette,
  areaCode,
  gesBackground = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";
  const isTop3 = rank <= 3;
  const gesShadow = gesBackground ? "0 2px 8px rgba(0,0,0,0.7)" : undefined;

  // 順位別アクセントカラー（1位: 金, 2位: 銀, 3位: 銅, 4位以下: ブランド青）
  // GES 背景時、4位以下の青が航空映像と溶けるため白に切り替え
  const rankColor = isTop3 ? RANK_COLORS[rank as 1 | 2 | 3] : null;
  const rankAccent = rankColor?.from ?? (gesBackground ? "#FFFFFF" : BRAND.primary);
  const rankAccentEnd = rankColor?.to ?? (gesBackground ? "#FFFFFF" : BRAND.primary);

  // animated=false のときはモーションを完全スキップ（youtube-short の高速表示用）
  const skipMotion = !animated;

  // アニメーション設定
  // 1. カード全体のスライドイン (ドスン！と現れるバウンス感)
  const cardSpring = skipMotion ? 1 : spring({
    frame,
    from: 0,
    to: 1,
    fps,
    config: { damping: 12, mass: 1.2, stiffness: 100 }
  });

  // 2. 順位/名前のポップアップ
  const rankSpring = skipMotion ? 1 : spring({ frame: frame - 15, from: 0, to: 1, fps, config: { damping: 10, mass: 0.8 } });
  const areaSpring = skipMotion ? 1 : spring({ frame: frame - 25, from: 0, to: 1, fps, config: { damping: 10, mass: 1 } });

  // 3. 数値のカウントアップ（animated=false のときは最終値を即表示）
  const valueSpring = skipMotion ? 1 : spring({ frame: frame - 35, from: 0, to: 1, fps, config: { damping: 12, mass: 0.5 } });
  const rawValue = skipMotion
    ? value
    : animated
      ? interpolate(valueSpring, [0, 1], [0, value])
      : value;
  const displayText = formatValueWithPrecision(rawValue, precision);

  // 進捗率
  const progress = ((totalCount - rank + 1) / totalCount) * 100;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        color: colors.foreground,
        fontFamily: FONT.family,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 1. 背景装飾 */}
      <AbsoluteFill style={{ zIndex: 0 }}>
        {gesBackground && areaCode ? (
          <>
            <OffthreadVideo
              src={getGesVideoPath(areaCode, "portrait")}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              muted
            />
            {/* 視認性向上オーバーレイ */}
            <AbsoluteFill
              style={{
                background: isDark
                  ? "linear-gradient(to bottom, rgba(15,23,42,0.5) 0%, rgba(15,23,42,0.25) 30%, rgba(15,23,42,0.25) 70%, rgba(15,23,42,0.6) 100%)"
                  : "linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0.15) 70%, rgba(255,255,255,0.5) 100%)",
              }}
            />
            <AbsoluteFill
              style={{
                background: isDark
                  ? "radial-gradient(circle at center, transparent 30%, rgba(15,23,42,0.5) 100%)"
                  : "radial-gradient(circle at center, transparent 30%, rgba(255,255,255,0.3) 100%)",
              }}
            />
          </>
        ) : (
          <>
            {/* グリッド */}
            <div style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `linear-gradient(to right, ${colors.muted}22 2px, transparent 2px), linear-gradient(to bottom, ${colors.muted}22 2px, transparent 2px)`,
              backgroundSize: "48px 48px",
              opacity: isDark ? 0.3 : 0.6,
            }} />
            {/* 光のエフェクト */}
            <div style={{
              position: "absolute",
              top: "25%",
              left: "50%",
              width: 800,
              height: 800,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${rankAccent}44 0%, transparent 70%)`,
              transform: "translateX(-50%)",
              filter: "blur(120px)",
              opacity: 0.4,
            }} />
          </>
        )}
      </AbsoluteFill>

      {/* 2. メインコンテンツ */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "180px 160px 420px 80px", // SNS セーフエリア対応 (Top: 180, Bottom: 420, Right: 160)
        zIndex: 10,
      }}>

        {/* ヘッダー: タイトル & プログレスバー */}
        <div style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: 48,
          opacity: cardSpring,
          transform: `translateY(${interpolate(cardSpring, [0, 1], [-50, 0])}px)`
        }}>
          <div style={{
            padding: "8px 24px",
            backgroundColor: gesBackground
              ? (isDark ? "rgba(30, 41, 59, 0.45)" : "rgba(255, 255, 255, 0.5)")
              : (isDark ? "rgba(30, 41, 59, 0.8)" : "rgba(255, 255, 255, 0.9)"),
            borderRadius: 50,
            fontSize: 44,
            fontWeight: FONT.weight.bold,
            letterSpacing: "0.1em",
            marginBottom: 24,
            border: `1px solid ${colors.border}`,
            color: colors.muted,
            boxShadow: gesBackground ? "none" : "0 4px 12px rgba(0,0,0,0.1)",
          }}>
            {title}
          </div>

          {/* プログレスバー */}
          <div style={{
            width: "100%",
            height: 12,
            backgroundColor: `${colors.muted}33`,
            borderRadius: 6,
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${progress}%`,
              backgroundColor: rankAccent,
              borderRadius: 6,
              transition: "width 0.5s ease-out",
            }} />
          </div>
        </div>

        {/* メイン: 順位発表カード */}
        <div style={{
          width: "100%",
          position: "relative",
          marginTop: 120,
          backgroundColor: gesBackground
            ? (isDark ? "rgba(15, 23, 42, 0.45)" : "rgba(255, 255, 255, 0.5)")
            : (isDark ? "rgba(15, 23, 42, 0.85)" : "rgba(255, 255, 255, 0.9)"),
          borderRadius: 48,
          border: `2px solid ${isTop3 ? rankAccent : colors.border}`,
          padding: 64,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          boxShadow: gesBackground
            ? (isDark ? "0 32px 64px rgba(0,0,0,0.3)" : "0 32px 64px rgba(0,0,0,0.06)")
            : (isDark ? "0 32px 64px rgba(0,0,0,0.6)" : "0 32px 64px rgba(0,0,0,0.1)"),
          backdropFilter: gesBackground ? "none" : "blur(20px)",
          // 下からスライドイン & スケール
          transform: `translateY(${interpolate(cardSpring, [0, 1], [800, 0])}px) scale(${interpolate(cardSpring, [0, 1], [0.8, 1])})`,
        }}>

          {/* 王冠 (第1位のみ) */}
          {rank === 1 && (
            <div style={{
              position: "absolute",
              top: -96,
              fontSize: 120,
              filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.3))",
            }}>
              👑
            </div>
          )}

          {/* 順位表示 */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 64, fontWeight: FONT.weight.bold, color: colors.muted, textShadow: gesShadow }}>第</span>
            <span style={{
              fontSize: 200,
              fontWeight: FONT.weight.black,
              lineHeight: 0.9,
              transform: `scale(${rankSpring})`,
              background: isTop3
                ? `linear-gradient(to bottom, ${rankAccent}, ${rankAccentEnd})`
                : colors.foreground,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: isTop3 ? "transparent" : colors.foreground,
              color: isTop3 ? "transparent" : colors.foreground,
              filter: gesBackground && isTop3
                ? "drop-shadow(0 0 12px rgba(0,0,0,0.9)) drop-shadow(0 4px 8px rgba(0,0,0,0.7))"
                : undefined,
              textShadow: !isTop3 ? gesShadow : undefined,
            }}>
              {rank}
            </span>
            <span style={{ fontSize: 64, fontWeight: FONT.weight.bold, color: colors.muted, textShadow: gesShadow }}>位</span>
          </div>

          {/* エリア名 */}
          <div style={{
            fontSize: 140,
            fontWeight: FONT.weight.black,
            letterSpacing: "-0.02em",
            marginBottom: 32,
            textAlign: "center",
            transform: `translateY(${interpolate(areaSpring, [0, 1], [40, 0])}px)`,
            opacity: areaSpring,
            textShadow: gesShadow,
          }}>
            {areaName}
          </div>

          {/* セパレーター */}
          <div style={{
            width: "60%",
            height: 4,
            backgroundColor: colors.border,
            marginBottom: 48,
            borderRadius: 2,
          }} />

          {/* 数値表示 */}
          <div style={{
            display: "flex",
            alignItems: "baseline",
            gap: 16,
          }}>
            <span style={{
              fontSize: 110,
              fontFamily: "'Inter', sans-serif",
              fontWeight: FONT.weight.black,
              color: rankAccent,
              // カウントアップ中は少しスケールさせて動的な感じを出す
              transform: `scale(${interpolate(valueSpring, [0, 0.9, 1], [1, 1.1, 1])})`,
              textShadow: gesBackground
                ? "0 0 20px rgba(0,0,0,0.9), 0 2px 10px rgba(0,0,0,0.8), 0 0 40px rgba(0,0,0,0.4)"
                : undefined,
            }}>
              {displayText}
            </span>
            <span style={{ fontSize: 56, fontWeight: FONT.weight.bold, color: colors.muted, textShadow: gesShadow }}>
              {unit}
            </span>
          </div>
        </div>

        {/* フッター: 都道府県シルエット or CTA フォールバック */}
        {prefSilhouette ? (
          <div style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 48,
            opacity: interpolate(areaSpring, [0, 1], [0, 1]),
          }}>
            <svg
              viewBox={`${prefSilhouette.viewBox.x} ${prefSilhouette.viewBox.y} ${prefSilhouette.viewBox.width} ${prefSilhouette.viewBox.height}`}
              style={{ width: 500, height: 500 }}
            >
              <defs>
                <linearGradient id={`silhouette-gradient-${rank}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={rankColor ? rankAccent : colors.foreground} />
                  <stop offset="100%" stopColor={rankColor ? rankAccentEnd : colors.foreground} />
                </linearGradient>
                <filter id={`silhouette-glow-${rank}`}>
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path
                d={prefSilhouette.path}
                fill="none"
                stroke={`url(#silhouette-gradient-${rank})`}
                strokeWidth={3}
                strokeLinejoin="round"
                filter={`url(#silhouette-glow-${rank})`}
                opacity={0.7}
              />
            </svg>
          </div>
        ) : (
          <div style={{
            width: "100%",
            padding: 32,
            backgroundColor: isDark ? "rgba(30, 41, 59, 0.6)" : "rgba(241, 245, 249, 0.9)",
            borderRadius: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            border: `1px solid ${colors.border}`,
            marginTop: 48,
            opacity: areaSpring,
            transform: `translateY(${interpolate(areaSpring, [0, 1], [50, 0])}px)`
          }}>
            <div style={{
              fontSize: 36,
              fontWeight: FONT.weight.bold,
              lineHeight: 1.4,
              textAlign: "center",
            }}>
              あなたの県は何位？<br />コメントで教えて！
            </div>
            <div style={{ fontSize: 72 }}>👉</div>
          </div>
        )}

      </div>

      {/* セーフエリア表示 (開発用) */}
      {showSafeAreas && <SafetyZoneOverlay />}
    </AbsoluteFill>
  );
};
