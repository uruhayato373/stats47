import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND, COLOR_SCHEMES, FONT, SPACING, type ThemeName } from "@/shared";

interface RankingTitleProps {
    titleMain: string;
    titleSub: string;
    catchphrase1: string;
    catchphrase2: string;
    theme?: ThemeName;
    /** AI 生成フックテキスト（15文字以内）。指定時は catchphrase1 を上書きする */
    hookText?: string;
}

/**
 * YouTube Shorts 用 冒頭シーン (1080x1920)
 * 巨大な文字と動きで視聴者の離脱を防ぐ「フック」としての役割を持つ。
 */
export const RankingTitle: React.FC<RankingTitleProps> = ({
    titleMain,
    titleSub,
    catchphrase1,
    catchphrase2,
    theme = "dark",
    hookText,
}) => {
    const phrase1 = hookText ?? catchphrase1;
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const colors = COLOR_SCHEMES[theme];
    const isDark = theme === "dark";

    const sprOptions = { fps, damping: 12, mass: 0.8 };
    const introSpring   = spring({ frame,           from: 0, to: 1, ...sprOptions });
    const catch1Spring  = spring({ frame: frame - 25, from: 0, to: 1, ...sprOptions });
    const catch2Spring  = spring({ frame: frame - 35, from: 0, to: 1, ...sprOptions });
    const brandingSpring = spring({ frame: frame - 3, from: 0, to: 1, ...sprOptions });

    return (
        <AbsoluteFill
            style={{
                backgroundColor: colors.background,
                color: colors.foreground,
                fontFamily: FONT.family,
                overflow: "hidden",
            }}
        >
            {/* 1. 背景装飾 */}
            <AbsoluteFill style={{ opacity: 0.15 }}>
                <div style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `linear-gradient(to right, ${colors.muted}44 1px, transparent 1px), linear-gradient(to bottom, ${colors.muted}44 1px, transparent 1px)`,
                    backgroundSize: "60px 60px",
                }} />
                <div style={{
                    position: "absolute",
                    top: "35%",
                    left: "50%",
                    width: 1000,
                    height: 1000,
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${BRAND.primaryLight}55 0%, transparent 70%)`,
                    transform: "translate(-50%, -50%)",
                    filter: "blur(100px)",
                }} />
            </AbsoluteFill>

            {/* 2. サイトブランディング — セーフゾーン直下 (top: 268px) */}
            <div style={{
                position: "absolute",
                top: 268,
                left: 0,
                right: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 20,
                zIndex: 10,
                opacity: brandingSpring,
                transform: `translateY(${interpolate(brandingSpring, [0, 1], [-16, 0])}px)`,
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
                    color: colors.muted,
                    letterSpacing: 2,
                }}>
                    統計で見る都道府県
                </div>
            </div>

            {/* 3. メインコンテンツ
                 上部ブランディング(top:268, 高さ~54px → 下端 322px) と
                 下部インジケーター(bottom:450 → top 1470px) の間に収める。
                 paddingTop: 360, paddingBottom: 480 で有効高 1080px に絞り、その中央に配置。 */}
            <div style={{
                position: "absolute",
                top: 360,
                bottom: 480,
                left: 0,
                right: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: `0 ${SPACING.xl}px`,
                gap: SPACING.lg,
                zIndex: 10,
            }}>
                {/* サブタイトル (バッジ) */}
                <div style={{
                    transform: `scale(${introSpring})`,
                    opacity: introSpring,
                }}>
                    <span style={{
                        display: "inline-block",
                        backgroundColor: isDark ? "rgba(30, 41, 59, 0.85)" : "rgba(255, 255, 255, 0.9)",
                        color: BRAND.secondary,
                        border: `3px solid ${BRAND.secondary}`,
                        borderRadius: 50,
                        padding: `${SPACING.sm}px ${SPACING.xl}px`,
                        fontSize: 50,
                        fontWeight: FONT.weight.bold,
                        letterSpacing: "0.15em",
                        boxShadow: `0 0 40px ${BRAND.secondary}44`,
                        backdropFilter: "blur(10px)",
                    }}>
                        {titleSub}
                    </span>
                </div>

                {/* メインタイトル */}
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                }}>
                    {titleMain.split(" ").map((line, idx) => {
                        const lineSpr = spring({ frame: frame - 12 - idx * 5, from: 0, to: 1, ...sprOptions });
                        const maxLineChars = Math.max(...titleMain.split(" ").map(s => s.length));
                        const titleFontSize = Math.min(150, Math.floor(940 / maxLineChars));
                        return (
                            <h1 key={idx} style={{
                                fontSize: titleFontSize,
                                fontWeight: FONT.weight.black,
                                color: colors.foreground,
                                margin: 0,
                                lineHeight: 1.1,
                                textAlign: "center",
                                transform: `translateY(${interpolate(lineSpr, [0, 1], [60, 0])}px) scale(${lineSpr})`,
                                opacity: lineSpr,
                                textShadow: isDark
                                    ? "0 10px 40px rgba(0,0,0,0.9)"
                                    : "0 6px 20px rgba(0,0,0,0.15)",
                            }}>
                                {line}
                            </h1>
                        );
                    })}
                </div>

                {/* 区切り線 — アンバーグロー */}
                <div style={{
                    width: 140,
                    height: 6,
                    backgroundColor: BRAND.secondary,
                    borderRadius: 3,
                    transform: `scaleX(${introSpring})`,
                    boxShadow: `0 0 24px ${BRAND.secondary}88`,
                }} />

                {/* キャッチフレーズ1 (赤い傾斜帯) — hookText が指定された場合はそちらを表示 */}
                <div style={{
                    width: "120%",
                    transform: `rotate(-3deg) scaleX(${catch1Spring})`,
                    backgroundColor: BRAND.danger,
                    borderTop: "4px solid #B91C1C",
                    borderBottom: "4px solid #B91C1C",
                    padding: `${SPACING.lg}px 0`,
                    display: "flex",
                    justifyContent: "center",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                    zIndex: 20,
                }}>
                    <h2 style={{
                        color: "white",
                        fontSize: 92,
                        fontWeight: FONT.weight.black,
                        margin: 0,
                        letterSpacing: "-0.02em",
                        transform: `scale(${catch1Spring})`,
                        textShadow: "0 4px 12px rgba(0,0,0,0.4)",
                    }}>
                        {phrase1}
                    </h2>
                </div>

                {/* キャッチフレーズ2 (グラスモーフィズムカード) */}
                <div style={{
                    width: "90%",
                    backgroundColor: isDark ? "rgba(30, 41, 59, 0.9)" : "rgba(255, 255, 255, 0.95)",
                    padding: `${SPACING.xl}px`,
                    borderRadius: 28,
                    border: `2px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)"}`,
                    boxShadow: isDark
                        ? "0 20px 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)"
                        : "0 20px 50px rgba(0,0,0,0.1)",
                    backdropFilter: "blur(16px)",
                    transform: `translateY(${interpolate(catch2Spring, [0, 1], [30, 0])}px) scale(${catch2Spring})`,
                    opacity: catch2Spring,
                }}>
                    <h2 style={{
                        color: isDark ? BRAND.primaryLight : BRAND.primary,
                        fontSize: 70,
                        fontWeight: FONT.weight.black,
                        margin: 0,
                        textAlign: "center",
                        letterSpacing: "-0.01em",
                        lineHeight: 1.3,
                    }}>
                        {catchphrase2}
                    </h2>
                </div>
            </div>

            {/* 4. 下部インジケーター — セーフゾーン内 (bottom: 450px) */}
            <div style={{
                position: "absolute",
                bottom: 450,
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
                opacity: interpolate(frame, [55, 72], [0, 1], { extrapolateLeft: "clamp" }),
                zIndex: 10,
            }}>
                <div style={{
                    fontSize: 38,
                    fontWeight: FONT.weight.bold,
                    color: colors.muted,
                    letterSpacing: "0.08em",
                }}>
                    ▶ 最後まで見てね
                </div>
            </div>
        </AbsoluteFill>
    );
};
