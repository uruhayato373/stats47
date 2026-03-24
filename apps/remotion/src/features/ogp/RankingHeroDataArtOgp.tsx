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
import { LogoWatermark } from "@/shared/components/brand/LogoWatermark";

interface RankingHeroDataArtOgpProps {
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
 * ランキング Data Art OGP 画像 (1200x630)
 *
 * モックB「Data Art」に基づく、ドットグリッドとサイバー/Bento UI風レイアウト。
 */
export const RankingHeroDataArtOgp: React.FC<RankingHeroDataArtOgpProps> = ({
    meta,
    topEntries,
    theme = "dark",
    showGuides = false,
    precision = 1,
}) => {
    const isDark = theme === "dark";
    const colors = COLOR_SCHEMES[theme];
    // 強制的にダークモードのような色合いをベースにする（Data Artテーマのため）
    const bgColor = "#09090B";
    const textColor = "#FAFAFA";
    const mutedColor = "#A1A1AA";
    const accentColor = "#22D3EE";
    const cardBgColor = "rgba(24, 24, 27, 0.8)";
    const borderColor = "#27272A";

    return (
        <OgpSafeZone showGuides={showGuides}>
            <AbsoluteFill
                style={{
                    backgroundColor: bgColor,
                    color: textColor,
                    fontFamily: FONT.family,
                    overflow: "hidden",
                }}
            >
                {/* SVG 定義・背景 */}
                <svg width="100%" height="100%" style={{ position: "absolute", zIndex: 0 }}>
                    <defs>
                        <pattern id="dot-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                            <circle cx="10" cy="10" r="1" fill="#334155" fillOpacity="0.5" />
                        </pattern>
                        <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur1" />
                            <feGaussianBlur stdDeviation="8" result="blur2" />
                            <feMerge>
                                <feMergeNode in="blur2" />
                                <feMergeNode in="blur1" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    <rect width="1200" height="630" fill="url(#dot-grid)" />
                    
                    {/* Abstract Radar/Chart Lines */}
                    <path d="M -100 400 Q 200 600, 600 400 T 1300 300" fill="none" stroke={accentColor} strokeWidth="1.5" strokeOpacity="0.3" filter="url(#neon-glow)"/>
                    <path d="M -100 450 Q 200 500, 600 550 T 1300 400" fill="none" stroke="#818CF8" strokeWidth="1" strokeOpacity="0.2" />
                    
                    <g transform="translate(600, 315) rotate(-15)">
                        <circle cx="0" cy="0" r="300" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 8"/>
                        <circle cx="0" cy="0" r="200" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 8"/>
                        <circle cx="0" cy="0" r="100" fill="none" stroke={accentColor} strokeWidth="1" strokeOpacity="0.5"/>
                    </g>
                </svg>

                {/* メインタイトルカード */}
                <div style={{ position: 'absolute', top: 100, left: 100, width: 650, height: 430, backgroundColor: cardBgColor, border: `1.5px solid ${borderColor}`, borderRadius: 16, display: 'flex', flexDirection: 'column', padding: '40px', boxSizing: 'border-box', zIndex: 10 }}>
                    <div style={{ fontFamily: "'Fira Code', 'Courier New', monospace", fontSize: 14, color: accentColor, letterSpacing: 1, marginBottom: 'auto' }}>
                        RANKING {meta.yearName || "2024"}
                    </div>
                    
                    <div style={{ marginTop: 'auto', marginBottom: 20 }}>
                        <h1 style={{ fontSize: 72, fontWeight: 900, color: textColor, lineHeight: 1.1, margin: 0, wordBreak: 'keep-all' }}>
                            {meta.title}
                        </h1>
                        <h2 style={{ fontSize: 32, fontWeight: 700, color: mutedColor, margin: '10px 0 0 0' }}>
                            都道府県ランキング
                        </h2>
                    </div>

                    <div style={{ backgroundColor: borderColor, padding: '10px 20px', borderRadius: 8, display: 'inline-block', alignSelf: 'flex-start' }}>
                        <span style={{ fontSize: 18, fontWeight: 600, color: '#E4E4E7' }}>
                            {meta.demographicAttr}
                            {meta.normalizationBasis && ` (${meta.normalizationBasis})`}
                        </span>
                    </div>
                </div>

                {/* ランキング Bento カード */}
                {topEntries && topEntries.length > 0 && (
                    <div style={{ position: 'absolute', top: 100, left: 780, display: 'flex', flexDirection: 'column', gap: 20, zIndex: 10 }}>
                        {topEntries.slice(0, 3).map((entry, index) => {
                            const isFirst = index === 0;
                            const height = isFirst ? 200 : 90;
                            const rankColor = isFirst ? "#FBBF24" : "#E4E4E7";
                            const valueColor = isFirst ? accentColor : accentColor;
                            
                            return (
                                <div key={entry.areaCode} style={{ width: 320, height, backgroundColor: cardBgColor, border: `1.5px solid ${isFirst ? rankColor : borderColor}`, borderRadius: 16, display: 'flex', flexDirection: 'column', padding: '20px 30px', boxSizing: 'border-box', position: 'relative', boxShadow: isFirst ? `0 0 15px rgba(251, 191, 36, 0.3)` : 'none' }}>
                                    {isFirst ? (
                                        <>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                                <span style={{ fontSize: 48, fontWeight: 900, color: rankColor, lineHeight: 1 }}>{entry.rank}位</span>
                                                <span style={{ fontSize: 36, fontWeight: 800, color: textColor, lineHeight: 1 }}>{entry.areaName}</span>
                                            </div>
                                            <div style={{ marginTop: 'auto', textAlign: 'left' }}>
                                                <span style={{ fontSize: 52, fontWeight: 900, color: valueColor, lineHeight: 1 }}>{formatValueWithPrecision(entry.value, precision)}</span>
                                                <span style={{ fontSize: 24, color: mutedColor, marginLeft: 8 }}>{meta.unit}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                                <span style={{ fontSize: 28, fontWeight: 800, color: rankColor, width: 20 }}>{entry.rank}</span>
                                                <span style={{ fontSize: 24, fontWeight: 700, color: textColor }}>{entry.areaName}</span>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ fontSize: 28, fontWeight: 800, color: valueColor }}>{formatValueWithPrecision(entry.value, precision)}</span>
                                                <span style={{ fontSize: 16, color: mutedColor, marginLeft: 4 }}>{meta.unit}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Watermark Element */}
                <div style={{ position: 'absolute', bottom: 40, left: 60, opacity: 0.8 }}>
                    <LogoWatermark width={160} color="#71717A" accentColor={accentColor} />
                </div>
            </AbsoluteFill>
        </OgpSafeZone>
    );
};
