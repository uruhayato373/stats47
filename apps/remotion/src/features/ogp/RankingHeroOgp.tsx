import React from "react";
import { AbsoluteFill } from "remotion";
import {
    BRAND,
    COLOR_SCHEMES,
    FONT,
    SPACING,
    type ThemeName,
} from "@/shared/themes/brand";
import { formatValueWithPrecision } from "@stats47/utils";
import type { RankingEntry, RankingMeta } from "@/shared/types/ranking";
import type { ChoroplethPathInfo } from "@/shared/utils/choropleth";
import { OgpSafeZone } from "@/shared/components/layouts/OgpSafeZone";
import { ChoroplethMapSvg } from "@/shared/components/maps/ChoroplethMapSvg";
import { LogoWatermark } from "@/shared/components/brand/LogoWatermark";

interface RankingHeroOgpProps {
    meta: RankingMeta;
    /** 上位3件を表示 */
    topEntries?: RankingEntry[];
    /** コロプレス地図の SVG パス（事前計算済み） */
    mapPaths?: ChoroplethPathInfo[];
    theme?: ThemeName;
    /** ガイドを表示するか */
    showGuides?: boolean;
    precision?: number;
}

/**
 * ランキング Hero OGP 画像 (1200x630)
 *
 * 地図を中央に巨大に配置し、その上にタイトルを重ねる
 * インパクト重視のレイアウト。SNSでの1:1クロップにも対応。
 */
export const RankingHeroOgp: React.FC<RankingHeroOgpProps> = ({
    meta,
    topEntries,
    mapPaths,
    theme = "dark",
    showGuides = false,
    precision = 0,
}) => {
    const colors = COLOR_SCHEMES[theme];
    const isDark = theme === "dark";

    // 年度・カテゴリのテキスト
    const categoryLabel = meta.yearName
        ? `${meta.yearName} 都道府県ランキング`
        : "都道府県ランキング";

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
                {/* 背景の装飾的な要素 */}
                <AbsoluteFill style={{ opacity: 0.1 }}>
                    <div style={{ position: "absolute", top: -100, left: -100, width: 400, height: 400, borderRadius: "50%", border: `2px solid ${BRAND.primary}` }} />
                    <div style={{ position: "absolute", bottom: -150, right: -50, width: 600, height: 600, borderRadius: "50%", border: `1px solid ${BRAND.secondary}` }} />
                </AbsoluteFill>

                {/* 1. アンビエント・マップ (ぼかした背景の光) */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        filter: "blur(60px)",
                        opacity: isDark ? 0.15 : 0.2, // ダークモードでは少し抑えて可読性を優先
                        transform: "scale(2.5)",
                    }}
                >
                    {mapPaths && mapPaths.length > 0 && (
                        <ChoroplethMapSvg
                            paths={mapPaths}
                            width={700}
                            height={700}
                            strokeColor="transparent"
                            strokeWidth={0}
                        />
                    )}
                </div>

                {/* 2. ビネット効果 (周辺を暗くして中央を強調) */}
                <AbsoluteFill
                    style={{
                        background: isDark
                            ? "radial-gradient(circle, transparent 20%, rgba(15, 23, 42, 0.6) 100%)"
                            : "radial-gradient(circle, transparent 20%, rgba(255, 255, 255, 0.3) 100%)",
                    }}
                />

                {/* 3. フォーカス・マップ (中央のシャープな地図) */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    {mapPaths && mapPaths.length > 0 && (
                        <div style={{
                            width: 700,
                            height: 700,
                            opacity: 1,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.15))",
                        }}>
                            <ChoroplethMapSvg
                                paths={mapPaths}
                                width={700}
                                height={700}
                                strokeColor={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.1)"}
                                strokeWidth={1.5}
                            />
                        </div>
                    )}
                </div>

                {/* 4. グラスモーフィズムなタイトルオーバーレイ */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            backgroundColor: isDark ? "rgba(15, 23, 42, 0.85)" : "rgba(255, 255, 255, 0.8)",
                            backdropFilter: "blur(20px)",
                            padding: `${SPACING.lg}px ${SPACING.xl * 1.5}px`,
                            borderRadius: 24,
                            border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"}`,
                            boxShadow: isDark
                                ? "0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.1)"
                                : "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
                            textAlign: "center",
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            maxWidth: 800,
                        }}
                    >
                        <div
                            style={{
                                fontSize: 24,
                                fontWeight: FONT.weight.bold,
                                color: isDark ? colors.accent : BRAND.primary,
                                letterSpacing: "0.1em",
                            }}
                        >
                            {categoryLabel}
                        </div>
                        <h1
                            style={{
                                fontSize: 64,
                                fontWeight: FONT.weight.black,
                                color: colors.foreground,
                                lineHeight: 1.1,
                                margin: 0,
                                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                            }}
                        >
                            {meta.title}
                        </h1>
                        <div
                            style={{
                                fontSize: 24,
                                fontWeight: FONT.weight.bold,
                                color: colors.muted,
                                marginTop: 4,
                            }}
                        >
                            {meta.demographicAttr}
                            {meta.normalizationBasis && ` (${meta.normalizationBasis})`}
                        </div>
                    </div>
                </div>

                {/* 3. 上位3県 (下部に並べる - 1:1クロップ時も見えるように) */}
                <div
                    style={{
                        position: "absolute",
                        bottom: 60,
                        left: 0,
                        right: 0,
                        display: "flex",
                        justifyContent: "center",
                        gap: SPACING.md,
                        padding: `0 ${SPACING.lg}px`,
                    }}
                >
                    {topEntries?.slice(0, 3).map((entry) => (
                        <div
                            key={entry.areaCode}
                            style={{
                                backgroundColor: isDark ? "rgba(30, 41, 59, 0.85)" : "rgba(255, 255, 255, 0.95)",
                                padding: `${SPACING.sm}px ${SPACING.md}px`,
                                borderRadius: 16,
                                border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"}`,
                                display: "flex",
                                flexDirection: "column",
                                gap: 4,
                                minWidth: 180,
                                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                            }}
                        >
                            {/* 1行目: 順位と都道府県 */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{
                                    fontSize: 28,
                                    fontWeight: FONT.weight.black,
                                    color: entry.rank === 1 ? "#FFD700" : entry.rank === 2 ? "#C0C0C0" : "#CD7F32",
                                    lineHeight: 1,
                                }}>
                                    {entry.rank}
                                </span>
                                <span style={{
                                    fontSize: 18,
                                    fontWeight: FONT.weight.bold,
                                    color: isDark ? colors.foreground : BRAND.black,
                                }}>
                                    {entry.areaName}
                                </span>
                            </div>

                            {/* 2行目: 値と単位 */}
                            <div style={{
                                display: "flex",
                                alignItems: "baseline",
                                gap: 2,
                                justifyContent: "flex-end", // 右寄せで数値を目立たせる
                            }}>
                                <span style={{
                                    fontSize: 22,
                                    fontWeight: FONT.weight.black,
                                    color: BRAND.secondary,
                                }}>
                                    {formatValueWithPrecision(entry.value, precision)}
                                </span>
                                {meta.unit && (
                                    <span style={{
                                        fontSize: 14,
                                        fontWeight: FONT.weight.bold,
                                        color: isDark ? colors.muted : "#64748B",
                                    }}>
                                        {meta.unit}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ウォーターマーク */}
                <div
                    style={{
                        position: "absolute",
                        top: 40,
                        left: 40,
                        opacity: 0.8,
                    }}
                >
                    <LogoWatermark width={180} color={isDark ? "rgba(255,255,255,0.8)" : BRAND.primary} accentColor={isDark ? BRAND.secondary : BRAND.primary} />
                </div>
            </AbsoluteFill>
        </OgpSafeZone>
    );
};
