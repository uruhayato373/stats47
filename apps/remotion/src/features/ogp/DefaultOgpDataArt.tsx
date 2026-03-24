import React from "react";
import { AbsoluteFill } from "remotion";
import {
    BRAND,
    COLOR_SCHEMES,
    FONT,
    SPACING,
    type ThemeName,
} from "@/shared/themes/brand";
import { OgpSafeZone } from "@/shared/components/layouts/OgpSafeZone";
import { LogoWatermark } from "@/shared/components/brand/LogoWatermark";

export interface DefaultOgpDataArtProps {
    theme?: ThemeName;
    title?: string;
    subtitle?: string;
    showGuides?: boolean;
}

/**
 * デフォルト OGP (1200x630) - Data Art & Map 型
 * サイバー感、データプラットフォームとしての先進性を表現
 */
export const DefaultOgpDataArt: React.FC<DefaultOgpDataArtProps> = ({
    theme = "dark",
    title = "統計で見る都道府県",
    subtitle = "47都道府県の今がわかる1,800超のデータプラットフォーム",
    showGuides = false,
}) => {
    const colors = COLOR_SCHEMES[theme];
    const isDark = theme === "dark";

    return (
        <OgpSafeZone showGuides={showGuides}>
            <AbsoluteFill
                style={{
                    backgroundColor: colors.background,
                    color: colors.foreground,
                    fontFamily: FONT.family,
                    overflow: "hidden",
                }}
            >
                {/* 背景: 深いグラデーション */}
                <AbsoluteFill
                    style={{
                        background: `radial-gradient(circle at 70% 50%, ${isDark ? "rgba(15, 23, 42, 1)" : "rgba(248, 250, 252, 1)"} 0%, ${isDark ? "rgba(2, 6, 23, 1)" : "rgba(226, 232, 240, 1)"} 100%)`,
                    }}
                />

                {/* 背景: 網目状のグリッドライン（データを象徴） */}
                <div
                    style={{
                        position: "absolute",
                        inset: -100,
                        backgroundImage: `linear-gradient(${isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"} 1px, transparent 1px)`,
                        backgroundSize: "40px 40px",
                        transform: "perspective(500px) rotateX(60deg) translateY(-100px) scale(2)",
                        transformOrigin: "top center",
                    }}
                />

                {/* 背景: 抽象的な光のノード */}
                {[...Array(15)].map((_, i) => (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            left: `${(i * 17) % 100}%`,
                            top: `${(i * 23) % 100}%`,
                            width: i % 3 === 0 ? 8 : 4,
                            height: i % 3 === 0 ? 8 : 4,
                            backgroundColor: BRAND.primary,
                            borderRadius: "50%",
                            boxShadow: `0 0 ${i % 3 === 0 ? 20 : 10}px ${BRAND.primary}, 0 0 ${i % 3 === 0 ? 40 : 20}px ${BRAND.secondary}`,
                            opacity: 0.6 + (i % 4) * 0.1,
                        }}
                    />
                ))}

                {/* メインカード (グラスモーフィズム) */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div
                        style={{
                            backgroundColor: isDark ? "rgba(15, 23, 42, 0.7)" : "rgba(255, 255, 255, 0.8)",
                            backdropFilter: "blur(24px)",
                            padding: "60px 80px",
                            borderRadius: 32,
                            border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"}`,
                            boxShadow: isDark
                                ? "0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.1)"
                                : "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                            display: "flex",
                            flexDirection: "column",
                            gap: 24,
                            alignItems: "center",
                            textAlign: "center",
                            maxWidth: 900,
                        }}
                    >
                        {/* ロゴ / アイコン領域 */}
                        <div style={{
                            width: 80, height: 80,
                            borderRadius: 24,
                            background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})`,
                            display: "flex", justifyContent: "center", alignItems: "center",
                            boxShadow: `0 10px 30px rgba(0,0,0,0.2)`
                        }}>
                            <LogoWatermark width={50} color="#FFFFFF" accentColor="#FFFFFF" />
                        </div>

                        {/* タイトル */}
                        <h1
                            style={{
                                fontSize: 72,
                                fontWeight: FONT.weight.black,
                                color: colors.foreground,
                                lineHeight: 1.1,
                                margin: 0,
                                letterSpacing: "-0.02em",
                                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                            }}
                        >
                            {title}
                        </h1>

                        {/* サブタイトル */}
                        <div
                            style={{
                                fontSize: 28,
                                fontWeight: FONT.weight.bold,
                                color: BRAND.primary,
                                letterSpacing: "0.05em",
                                background: isDark ? `linear-gradient(90deg, ${colors.accent}, ${BRAND.primary})` : `linear-gradient(90deg, ${BRAND.primary}, ${BRAND.secondary})`,
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            {subtitle}
                        </div>
                    </div>
                </div>
            </AbsoluteFill>
        </OgpSafeZone>
    );
};
