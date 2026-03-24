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

export interface DefaultOgpMinimalProps {
    theme?: ThemeName;
    title?: string;
    description?: string;
    urlText?: string;
    showGuides?: boolean;
}

/**
 * デフォルト OGP (1200x630) - Minimal & Editorial 型
 * タイポグラフィと余白の美しさに特化。公的機関のような信頼感と洗練。
 */
export const DefaultOgpMinimal: React.FC<DefaultOgpMinimalProps> = ({
    theme = "light",
    title = "統計で見る都道府県",
    description = "年収、人口、教育から医療まで。1,800以上の統計データによる新しい日本地図。",
    urlText = "stats47.net",
    showGuides = false,
}) => {
    // このバリアントは明朝体やクリーンなゴシックを強調するため、独自スタイルを多く持ちます。
    const colors = COLOR_SCHEMES[theme];
    const isDark = theme === "dark";

    return (
        <OgpSafeZone showGuides={showGuides}>
            <AbsoluteFill
                style={{
                    backgroundColor: colors.background,
                    color: colors.foreground,
                    fontFamily: `${FONT.family}`, // 可能な場合は明朝体も良いが、統一感のためブランドフォントを使用
                    overflow: "hidden",
                }}
            >
                {/* 非常にミニマルな背景：上下に1本ずつライン */}
                <div style={{ position: "absolute", top: 80, left: 100, right: 100, height: 1, backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }} />
                <div style={{ position: "absolute", bottom: 80, left: 100, right: 100, height: 1, backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }} />

                {/* 左上のURL/カテゴリ表示 */}
                <div style={{ 
                    position: "absolute", 
                    top: 45, 
                    left: 100,
                    fontSize: 20,
                    fontWeight: FONT.weight.bold,
                    letterSpacing: "0.15em",
                    color: BRAND.primary,
                    textTransform: "uppercase"
                }}>
                    DATA PLATFORM
                </div>

                {/* 右上のURL等 */}
                <div style={{ 
                    position: "absolute", 
                    top: 45, 
                    right: 100,
                    fontSize: 20,
                    fontWeight: FONT.weight.medium,
                    letterSpacing: "0.05em",
                    color: colors.muted,
                }}>
                    {urlText}
                </div>

                {/* メインコンテンツ配置領域（中央寄せ） */}
                <div
                    style={{
                        position: "absolute",
                        inset: "100px 100px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "flex-start", // 左揃えで洗練さを強調
                    }}
                >
                    <div style={{ 
                        width: 60, height: 60, marginBottom: 32,
                        backgroundColor: isDark ? colors.foreground : BRAND.black,
                        display: 'flex', justifyContent: 'center', alignItems: 'center'
                    }}>
                        <LogoWatermark width={40} color={isDark ? colors.background : colors.background} accentColor={BRAND.primary} />
                    </div>

                    <h1
                        style={{
                            fontSize: 84, // 非常に大きく
                            fontWeight: FONT.weight.bold, // BlackよりBold程度で品を
                            color: colors.foreground,
                            lineHeight: 1.1,
                            margin: 0,
                            letterSpacing: "-0.03em",
                        }}
                    >
                        {title}
                    </h1>

                    <div
                        style={{
                            marginTop: 40,
                            fontSize: 32,
                            fontWeight: FONT.weight.medium,
                            color: colors.muted,
                            lineHeight: 1.5,
                            maxWidth: 800,
                            letterSpacing: "0.02em",
                        }}
                    >
                        {description}
                    </div>
                </div>
            </AbsoluteFill>
        </OgpSafeZone>
    );
};
