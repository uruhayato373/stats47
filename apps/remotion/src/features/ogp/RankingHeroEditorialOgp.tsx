import React from "react";
import { AbsoluteFill } from "remotion";
import {
    BRAND,
    COLOR_SCHEMES,
    FONT,
    type ThemeName,
} from "@/shared/themes/brand";
import { formatValueWithPrecision } from "@stats47/utils";
import type { RankingEntry, RankingMeta } from "@/shared/types/ranking";
import type { ChoroplethPathInfo } from "@/shared/utils/choropleth";
import { OgpSafeZone } from "@/shared/components/layouts/OgpSafeZone";
import { ChoroplethMapSvg } from "@/shared/components/maps/ChoroplethMapSvg";
import { LogoWatermark } from "@/shared/components/brand/LogoWatermark";

interface RankingHeroEditorialOgpProps {
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
 * ランキング Editorial Clean OGP 画像 (1200x630)
 *
 * モックC「Editorial Clean」に基づく、大胆なタイポグラフィと余白を活かしたレイアウト。
 * アシンメトリーな配置で、右側にメイングラフィック（地図あるいは1位の都道府県）を配置。
 */
export const RankingHeroEditorialOgp: React.FC<RankingHeroEditorialOgpProps> = ({
    meta,
    topEntries,
    mapPaths,
    theme = "light",
    showGuides = false,
    precision = 1,
}) => {
    const isLight = theme === "light";
    
    // Editorialは白・ライトグレー基調が映えるが、ダークモードもサポート
    const bgColor1 = isLight ? "#FFFFFF" : "#0F172A";
    const bgColor2 = isLight ? "#F8FAFC" : "#1E293B";
    const bgColor3 = isLight ? "#E2E8F0" : "#0F172A";
    
    const darkBoxColor = isLight ? "#0F172A" : "#1E293B";
    const darkBoxGridStr = isLight ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)";
    
    const textBrandBlue = isLight ? "#2563EB" : "#3B82F6";
    const textSlateDark = isLight ? "#0F172A" : "#F8FAFC";
    const textSlateMedium = isLight ? "#475569" : "#94A3B8";
    const textSlateLight = isLight ? "#64748B" : "#64748B"; // Muted text stays similar

    const topEntry = topEntries && topEntries.length > 0 ? topEntries[0] : null;

    return (
        <OgpSafeZone showGuides={showGuides}>
            <AbsoluteFill
                style={{
                    background: `linear-gradient(to bottom right, ${bgColor1}, ${bgColor2} 50%, ${bgColor3})`,
                    color: textSlateDark,
                    fontFamily: "'Helvetica Neue', 'Inter', sans-serif",
                    overflow: "hidden",
                }}
            >
                
                {/* --- Left Column: Editorial Typography --- */}
                <div style={{ position: 'absolute', top: 100, left: 80, display: 'flex', flexDirection: 'column', width: 600 }}>
                    {/* Eyebrow */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 80 }}>
                        <span style={{ fontWeight: 700, fontSize: 18, color: textBrandBlue, letterSpacing: 4 }}>
                            STATS47 REPORT
                        </span>
                        <div style={{ width: 80, height: 3, backgroundColor: textBrandBlue }} />
                    </div>

                    {/* Metadata */}
                    <div style={{ fontFamily: "'Georgia', serif", fontStyle: "italic", fontSize: 32, color: textSlateLight, marginBottom: 10 }}>
                        {meta.yearName || "2024"}
                    </div>
                    
                    <div style={{ fontWeight: 300, fontSize: 32, color: textSlateDark, letterSpacing: 1, marginBottom: 50 }}>
                        都道府県ランキング
                    </div>

                    {/* Gigantic Title */}
                    <h1 style={{ fontWeight: 900, fontSize: 88, color: textSlateDark, letterSpacing: -2, margin: 0, lineHeight: 1.1, marginBottom: 40, wordBreak: 'keep-all' }}>
                        {meta.title}
                    </h1>

                    {/* Additional Details */}
                    <div style={{ fontWeight: 500, fontSize: 22, color: textSlateMedium, marginBottom: 10 }}>
                        {meta.demographicAttr}
                    </div>
                    <div style={{ fontWeight: 400, fontSize: 18, color: textSlateLight }}>
                        {meta.normalizationBasis}
                    </div>
                </div>


                {/* --- Right Column: Monolith / Map Area --- */}
                <div style={{ 
                    position: 'absolute', 
                    top: 40, 
                    right: 40, 
                    width: 460, 
                    height: 550, 
                    backgroundColor: darkBoxColor, 
                    borderRadius: 8,
                    boxShadow: '0 15px 40px rgba(15, 23, 42, 0.1)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    {/* Decorative Grid in the dark area */}
                    <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                        <path d="M 0 100 L 460 100 M 0 200 L 460 200 M 0 300 L 460 300 M 0 400 L 460 400 M 0 500 L 460 500" stroke={darkBoxGridStr} strokeWidth="1" />
                    </svg>

                    {/* Huge Number / Abstract Graphic in BG */}
                    <div style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        bottom: 0, 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        opacity: 0.8
                    }}>
                        {mapPaths && mapPaths.length > 0 ? (
                            <div style={{ transform: 'scale(1.2) translateY(-20px)', width: 400, height: 400 }}>
                                <ChoroplethMapSvg 
                                    paths={mapPaths} 
                                    width={400} 
                                    height={400} 
                                    strokeColor={isLight ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}
                                    strokeWidth={0.5}
                                />
                            </div>
                        ) : (
                            <span style={{ fontFamily: "'Georgia', serif", fontSize: 280, color: 'rgba(255,255,255,0.05)', lineHeight: 1 }}>
                                1
                            </span>
                        )}
                    </div>

                    {/* Top Prefecture Info Base */}
                    {topEntry && (
                        <div style={{ 
                            position: 'absolute', 
                            bottom: 40, 
                            left: 50, 
                            right: 50,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 5
                        }}>
                            <span style={{ fontWeight: 300, fontSize: 24, color: textSlateLight, letterSpacing: 2 }}>
                                TOP PREFECTURE
                            </span>
                            <span style={{ fontWeight: 700, fontSize: 48, color: '#FFFFFF' }}>
                                {topEntry.areaName}
                            </span>
                            
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
                                <span style={{ fontWeight: 900, fontSize: 36, color: '#38BDF8' }}>
                                    {formatValueWithPrecision(topEntry.value, precision)}
                                </span>
                                <span style={{ fontWeight: 400, fontSize: 18, color: textSlateLight }}>
                                    {meta.unit}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Minimal Watermark */}
                <div style={{ position: 'absolute', bottom: 40, left: 80, opacity: 0.7 }}>
                     <LogoWatermark width={160} color={textSlateLight} accentColor={textBrandBlue} />
                </div>
            </AbsoluteFill>
        </OgpSafeZone>
    );
};
