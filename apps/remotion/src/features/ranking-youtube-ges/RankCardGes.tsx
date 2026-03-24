import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Video } from "remotion";

import { BRAND, COLOR_SCHEMES, FONT, SafetyZoneOverlay, type ThemeName } from "@/shared";
import { getGesVideoPath } from "./get-ges-video-path";

interface RankCardGesProps {
    /** 都道府県コード (JIS 5桁, 例: "01000") */
    areaCode: string;
    /** 動画全体のタイトル */
    title: string;
    /** 順位 */
    rank: number;
    /** 都道府県名 */
    areaName: string;
    /** 数値 */
    value: number;
    /** 単位 */
    unit: string;
    /** ランキング総数 */
    totalCount?: number;
    /** テーマ */
    theme?: ThemeName;
    /** SNS セーフエリアを表示するか */
    showSafeAreas?: boolean;
}

/**
 * Google Earth Studio 背景動画対応版 ランキング発表シーン (1080x1920)
 * 既存の固有背景装飾を GES 動画に置き換えたリッチバージョン。
 */
export const RankCardGes: React.FC<RankCardGesProps> = ({
    areaCode,
    title,
    rank,
    areaName,
    value,
    unit,
    totalCount = 47,
    theme = "dark",
    showSafeAreas = false,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const colors = COLOR_SCHEMES[theme];
    const isDark = theme === "dark";
    const isTop3 = rank <= 3;

    // 動的な動画パスの解決 (縦型固定)
    const videoSrc = getGesVideoPath(areaCode, "portrait");

    // アニメーション設定
    const cardSpring = spring({
        frame,
        from: 0,
        to: 1,
        fps,
        config: { damping: 12, mass: 1.2, stiffness: 100 }
    });
    const rankSpring = spring({ frame: frame - 15, from: 0, to: 1, fps, config: { damping: 10, mass: 0.8 } });
    const areaSpring = spring({ frame: frame - 25, from: 0, to: 1, fps, config: { damping: 10, mass: 1 } });
    const valueSpring = spring({ frame: frame - 35, from: 0, to: 1, fps, config: { damping: 12, mass: 0.5 } });
    const displayValue = Math.floor(interpolate(valueSpring, [0, 1], [0, value]));

    const progress = ((totalCount - rank + 1) / totalCount) * 100;

    return (
        <AbsoluteFill
            style={{
                backgroundColor: colors.background,
                color: colors.foreground,
                fontFamily: FONT.family,
                overflow: "hidden",
            }}
        >
            {/* 1. Google Earth Studio 背景動画 */}
            <AbsoluteFill style={{ zIndex: 0 }}>
                <Video
                    src={videoSrc}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                    muted
                    loop
                    onError={() => console.warn(`Video not found or format error: ${videoSrc}`)}
                />

                {/* 文字視認性向上のためのオーバーレイ */}
                <AbsoluteFill
                    style={{
                        background: isDark
                            ? "linear-gradient(to bottom, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.2) 25%, rgba(15, 23, 42, 0.2) 75%, rgba(15, 23, 42, 0.6) 100%)"
                            : "linear-gradient(to bottom, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.1) 75%, rgba(255, 255, 255, 0.4) 100%)",
                    }}
                />

                {/* 画面中央付近の視認性を高めるためのビネット効果 */}
                <AbsoluteFill
                    style={{
                        background: isDark
                            ? "radial-gradient(circle at center, transparent 30%, rgba(15, 23, 42, 0.5) 100%)"
                            : "radial-gradient(circle at center, transparent 30%, rgba(255, 255, 255, 0.3) 100%)",
                    }}
                />
            </AbsoluteFill>

            {/* 2. メインコンテンツ (既存の RankCard のロジックを継承) */}
            <div style={{
                position: "relative",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "180px 160px 420px 80px",
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
                        backgroundColor: isDark ? "rgba(30, 41, 59, 0.75)" : "rgba(255, 255, 255, 0.85)",
                        borderRadius: 50,
                        fontSize: 32,
                        fontWeight: FONT.weight.bold,
                        letterSpacing: "0.1em",
                        marginBottom: 24,
                        border: `1px solid ${colors.border}`,
                        color: colors.muted,
                        boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
                        backdropFilter: "blur(8px)",
                    }}>
                        {title}
                    </div>

                    <div style={{
                        width: "100%",
                        height: 12,
                        backgroundColor: `${colors.muted}44`,
                        borderRadius: 6,
                        overflow: "hidden",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}>
                        <div style={{
                            height: "100%",
                            width: `${progress}%`,
                            backgroundColor: isTop3 ? BRAND.secondary : BRAND.primary,
                            borderRadius: 6,
                            boxShadow: `0 0 10px ${isTop3 ? BRAND.secondary : BRAND.primary}88`,
                        }} />
                    </div>
                </div>

                {/* メイン: 順位発表カード (グラスモーフィズム強化) */}
                <div style={{
                    width: "100%",
                    position: "relative",
                    backgroundColor: isDark ? "rgba(15, 23, 42, 0.75)" : "rgba(255, 255, 255, 0.8)",
                    borderRadius: 48,
                    border: `2px solid ${isTop3 ? BRAND.secondary : colors.border}`,
                    padding: 64,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    boxShadow: "0 32px 64px rgba(0,0,0,0.4)",
                    backdropFilter: "blur(24px)",
                    transform: `translateY(${interpolate(cardSpring, [0, 1], [800, 0])}px) scale(${interpolate(cardSpring, [0, 1], [0.8, 1])})`,
                }}>
                    {rank === 1 && (
                        <div style={{ position: "absolute", top: -84, fontSize: 160, filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.3))" }}>👑</div>
                    )}

                    <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16 }}>
                        <span style={{ fontSize: 64, fontWeight: FONT.weight.bold, color: colors.muted }}>第</span>
                        <span style={{
                            fontSize: 200,
                            fontWeight: FONT.weight.black,
                            lineHeight: 0.9,
                            transform: `scale(${rankSpring})`,
                            background: isTop3 ? `linear-gradient(to bottom, ${BRAND.secondary}, #F97316)` : colors.foreground,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: isTop3 ? "transparent" : colors.foreground,
                            color: isTop3 ? "transparent" : colors.foreground,
                        }}>
                            {rank}
                        </span>
                        <span style={{ fontSize: 64, fontWeight: FONT.weight.bold, color: colors.muted }}>位</span>
                    </div>

                    <div style={{
                        fontSize: 140,
                        fontWeight: FONT.weight.black,
                        letterSpacing: "-0.02em",
                        marginBottom: 32,
                        textAlign: "center",
                        transform: `translateY(${interpolate(areaSpring, [0, 1], [40, 0])}px)`,
                        opacity: areaSpring,
                    }}>
                        {areaName}
                    </div>

                    <div style={{ width: "60%", height: 4, backgroundColor: colors.border, marginBottom: 48, borderRadius: 2 }} />

                    <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
                        <span style={{
                            fontSize: 110,
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: FONT.weight.black,
                            color: isTop3 ? BRAND.primaryLight : BRAND.primary,
                            textShadow: `0 0 20px ${isTop3 ? BRAND.primaryLight : BRAND.primary}44`,
                            transform: `scale(${interpolate(valueSpring, [0, 0.9, 1], [1, 1.1, 1])})`,
                        }}>
                            {displayValue.toLocaleString()}
                        </span>
                        <span style={{ fontSize: 56, fontWeight: FONT.weight.bold, color: colors.muted }}>{unit}</span>
                    </div>
                </div>

                {/* フッター: CTA */}
                <div style={{
                    width: "100%",
                    padding: "32px 48px",
                    backgroundColor: isDark ? "rgba(30, 41, 59, 0.5)" : "rgba(241, 245, 249, 0.7)",
                    borderRadius: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 24,
                    border: `1px solid ${colors.border}`,
                    marginTop: 48,
                    opacity: areaSpring,
                    backdropFilter: "blur(12px)",
                    transform: `translateY(${interpolate(areaSpring, [0, 1], [50, 0])}px)`
                }}>
                    <div style={{ fontSize: 36, fontWeight: FONT.weight.bold, lineHeight: 1.4, textAlign: "center" }}>
                        あなたの県は何位？<br />コメントで教えて！
                    </div>
                    <div style={{ fontSize: 72 }}>👉</div>
                </div>
            </div>

            {showSafeAreas && <SafetyZoneOverlay />}
        </AbsoluteFill>
    );
};
