import React from "react";
import { AbsoluteFill } from "remotion";

interface OgpSafeZoneProps {
    children: React.ReactNode;
    /** ガイドの表示 */
    showGuides?: boolean;
}

/**
 * OGP (1200x630) 用セーフティーゾーンガイド
 *
 * 1. 外周セーフティー (5%)
 * 2. 中央正方形クロップ (1:1 / 630x630)
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
