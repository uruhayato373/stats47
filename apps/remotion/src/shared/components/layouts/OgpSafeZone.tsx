import React from "react";
import { AbsoluteFill } from "remotion";

interface OgpSafeZoneProps {
    children: React.ReactNode;
    /** ガイドの表示 */
    showGuides?: boolean;
}

/**
 * OGP (1200x630) 用セーフティーゾーンガイド + セーフゾーン規約
 *
 * ## ガイド要素
 * 1. 外周セーフティー (5%)
 * 2. 中央正方形クロップ (1:1 / 630x630)
 *
 * ## なぜ必要か（正方形クロップ対策）
 * 外部プラットフォームが OGP 画像を正方形クロップして表示するケースがある。stats47 の OGP は
 * 1200x630 のため、正方形表示時に左右が大幅にカットされ情報が欠落する。
 *
 * | プラットフォーム | 表示形式 | クロップ |
 * |---|---|---|
 * | X (Twitter) `summary_large_image` | 横長 | 上下が少しカット |
 * | Facebook / LINE / Discord | 横長 | ほぼそのまま |
 * | note.com リンクカード | 正方形 | 左右が大幅カット（中央 630x630 のみ） |
 *
 * OGP 仕様にプラットフォーム別画像指定機能はないため、すべてのプラットフォームが同じ
 * og:image を取得する。User-Agent で出し分ける方法は技術的には可能だが、
 * クローラー識別が不安定で保守コストが高いため非推奨。
 *
 * ## セーフゾーン規約
 * 1. タイトル・キャッチコピー → 必ず中央 630x630 内に収める
 * 2. ロゴ・ウォーターマーク → セーフエリア内に配置（左端 x < 285 や右端 x > 915 は
 *    正方形クロップで消える）
 * 3. 上位ランキング等の重要データ → 中央寄せで配置
 * 4. 背景・装飾要素 → セーフエリア外にはみ出してもよい（カットされても情報損失がないため）
 *
 * ## 使い方
 * デザイン時は showGuides={true} で正方形クロップ境界を赤線で表示し、すべての重要要素が
 * 内側に収まっているか目視確認する。
 */
export const OgpSafeZone: React.FC<OgpSafeZoneProps> = ({
    children,
    showGuides = false,
}) => {
    const width = 1200;
    const height = 630;
    const squareSize = height; // 630
    const squareLeft = (width - squareSize) / 2; // 285

    return (
        <AbsoluteFill>
            {children}

            {showGuides && (
                <>
                    {/* 外周セーフティー (5%) */}
                    <AbsoluteFill
                        style={{
                            border: `2px dashed rgba(255, 0, 0, 0.3)`,
                            inset: "5%",
                            pointerEvents: "none",
                        }}
                    />

                    {/* 中央正方形クロップ (1:1) */}
                    <AbsoluteFill
                        style={{
                            borderLeft: `2px solid rgba(255, 0, 0, 0.5)`,
                            borderRight: `2px solid rgba(255, 0, 0, 0.5)`,
                            left: squareLeft,
                            width: squareSize,
                            pointerEvents: "none",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                top: 10,
                                left: 10,
                                backgroundColor: "rgba(255, 0, 0, 0.7)",
                                color: "white",
                                fontSize: 12,
                                padding: "2px 6px",
                                borderRadius: 4,
                            }}
                        >
                            1:1 Crop Area
                        </div>
                    </AbsoluteFill>

                    {/* 切り捨てられる領域の目隠し（ごく薄く） */}
                    <AbsoluteFill
                        style={{
                            backgroundColor: "rgba(0, 0, 0, 0.1)",
                            width: squareLeft,
                            pointerEvents: "none",
                        }}
                    />
                    <AbsoluteFill
                        style={{
                            backgroundColor: "rgba(0, 0, 0, 0.1)",
                            left: squareLeft + squareSize,
                            width: squareLeft,
                            pointerEvents: "none",
                        }}
                    />
                </>
            )}
        </AbsoluteFill>
    );
};
