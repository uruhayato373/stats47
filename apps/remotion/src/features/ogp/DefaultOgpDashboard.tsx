import React from "react";
import { AbsoluteFill } from "remotion";
import {
    BRAND,
    COLOR_SCHEMES,
    FONT,
    type ThemeName,
} from "@/shared/themes/brand";
import { OgpSafeZone } from "@/shared/components/layouts/OgpSafeZone";
import { LogoWatermark } from "@/shared/components/brand/LogoWatermark";

export interface DefaultOgpDashboardProps {
    theme?: ThemeName;
    title?: string;
    subtitle?: string;
    showGuides?: boolean;
}

/**
 * デフォルト OGP (1200x630) - UI/Dashboard Showcase 型
 * プロダクトの使用感、ワクワク感を伝えるデザイン
 */
export const DefaultOgpDashboard: React.FC<DefaultOgpDashboardProps> = ({
    theme = "dark",
    title = "統計で見る\n都道府県",
    subtitle = "あなたの県は何位？\nデータを地図やグラフで可視化",
    showGuides = false,
}) => {
    const colors = COLOR_SCHEMES[theme];
    const isDark = theme === "dark";

    // ダミーのUIカードを描画するためのコンポーネント
    const MockCard = ({ title, width, height, value, rank }: { title: string, width: number, height: number, value: string, rank?: number }) => (
        <div style={{
            width, height,
            backgroundColor: isDark ? "rgba(30, 41, 59, 1)" : "rgba(255, 255, 255, 1)",
            borderRadius: 16,
            padding: 24,
            display: "flex", flexDirection: "column", gap: 12,
            boxShadow: isDark ? "0 20px 40px rgba(0,0,0,0.5)" : "0 20px 40px rgba(0,0,0,0.1)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}`,
        }}>
            <div style={{ fontSize: 18, fontWeight: FONT.weight.bold, color: colors.muted }}>{title}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                {rank && <span style={{ fontSize: 32, fontWeight: FONT.weight.black, color: rank === 1 ? '#FFD700' : BRAND.primary }}>{rank}位</span>}
                <span style={{ fontSize: rank ? 24 : 36, fontWeight: FONT.weight.black, color: colors.foreground }}>{value}</span>
            </div>
            {/* ダミーのバーグラフ */}
            <div style={{ display: 'flex', gap: 4, height: 40, alignItems: 'flex-end', marginTop: 'auto' }}>
                {[60, 40, 80, 50, 90, 30].map((h, i) => (
                    <div key={i} style={{ flex: 1, height: `${h}%`, backgroundColor: i === 2 ? BRAND.primary : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"), borderRadius: 4 }} />
                ))}
            </div>
        </div>
    );

    return (
        <OgpSafeZone showGuides={showGuides}>
            <AbsoluteFill
                style={{
                    backgroundColor: colors.background,
                    color: colors.foreground,
                    fontFamily: FONT.family,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "row",
                }}
            >
                {/* 背景: ブランドカラーの鮮やかなグラデーション */}
                <AbsoluteFill style={{
                    background: isDark 
                        ? `linear-gradient(135deg, ${BRAND.secondary} 0%, rgba(15, 23, 42, 1) 50%, rgba(2, 6, 23, 1) 100%)`
                        : `linear-gradient(135deg, ${BRAND.primary} 0%, rgba(248, 250, 252, 1) 60%)`,
                    opacity: isDark ? 0.3 : 0.1,
                }} />

                {/* 左側: テキスト情報 */}
                <div style={{
                    flex: "0 0 500px",
                    padding: "80px 60px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 32,
                    zIndex: 10,
                }}>
                    <LogoWatermark width={200} color={isDark ? "#ffffff" : BRAND.black} accentColor={BRAND.primary} />
                    
                    <h1 style={{
                        fontSize: 64,
                        fontWeight: FONT.weight.black,
                        lineHeight: 1.15,
                        margin: 0,
                        whiteSpace: "pre-wrap",
                        color: colors.foreground,
                        letterSpacing: "-0.02em",
                    }}>
                        {title}
                    </h1>

                    <div style={{
                        fontSize: 28,
                        fontWeight: FONT.weight.bold,
                        color: BRAND.primary,
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                    }}>
                        {subtitle}
                    </div>
                </div>

                {/* 右側: 3D UI ショーケース */}
                <div style={{
                    flex: 1,
                    position: "relative",
                    perspective: 1000,
                }}>
                    <div style={{
                        position: "absolute",
                        inset: 0,
                        transform: "rotateY(-15deg) rotateX(5deg) scale(1)",
                        transformStyle: "preserve-3d",
                    }}>
                        {/* メインカード */}
                        <div style={{ position: 'absolute', top: 120, left: 50, transform: 'translateZ(0px)' }}>
                            <MockCard title="年収ランキング" width={400} height={280} rank={1} value="東京都" />
                        </div>
                        
                        {/* サブカード1 */}
                        <div style={{ position: 'absolute', top: 60, left: 320, transform: 'translateZ(-50px)', opacity: 0.9 }}>
                            <MockCard title="人口密度" width={300} height={200} rank={2} value="大阪府" />
                        </div>

                        {/* サブカード2 */}
                        <div style={{ position: 'absolute', top: 380, left: -20, transform: 'translateZ(50px)' }}>
                            <div style={{
                                width: 350, height: 160,
                                backgroundColor: isDark ? "rgba(15, 23, 42, 0.85)" : "rgba(255,255,255,0.85)",
                                backdropFilter: "blur(12px)",
                                borderRadius: 16,
                                padding: 24,
                                border: `1px solid ${BRAND.primary}`,
                                boxShadow: `0 20px 40px rgba(0,0,0,0.3), 0 0 40px ${BRAND.primary}40`,
                                display: "flex", alignItems: "center", gap: 24
                            }}>
                                <div style={{ fontSize: 64 }}>🇯🇵</div>
                                <div>
                                    <div style={{ fontSize: 16, color: colors.muted, fontWeight: FONT.weight.bold }}>収録統計データ</div>
                                    <div style={{ fontSize: 40, fontWeight: FONT.weight.black, color: isDark ? "#ffffff" : BRAND.black }}>1,800<span style={{ fontSize: 24 }}>+</span></div>
                                </div>
                            </div>
                        </div>

                        {/* 丸い装飾エレメント */}
                        <div style={{
                            position: 'absolute', top: 100, right: 60, transform: 'translateZ(100px)',
                            width: 120, height: 120, borderRadius: '50%',
                            background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})`,
                            boxShadow: `0 20px 40px ${BRAND.primary}60`,
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            fontSize: 40, fontWeight: FONT.weight.bold, color: '#fff'
                        }}>
                            1st
                        </div>
                    </div>
                </div>
            </AbsoluteFill>
        </OgpSafeZone>
    );
};
