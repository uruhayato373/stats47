import React from "react";
import { AbsoluteFill } from "remotion";

/**
 * SNS (TikTok, Reels, Shorts) のセーフティゾーンを可視化するオーバーレイ
 */
export const SafetyZoneOverlay: React.FC = () => {
    return (
        <AbsoluteFill style={{ zIndex: 999, pointerEvents: "none" }}>
            {/* 上部進入禁止エリア (250px) */}
            <div style={{
                position: "absolute",
                top: 0,
                width: "100%",
                height: 250,
                backgroundColor: "rgba(239, 68, 68, 0.2)",
                borderBottom: "2px dashed #ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ef4444",
                fontSize: 32,
                fontWeight: "bold",
            }}>
                TOP SAFE AREA (250px)
            </div>

            {/* 下部進入禁止エリア (400px) */}
            <div style={{
                position: "absolute",
                bottom: 0,
                width: "100%",
                height: 400,
                backgroundColor: "rgba(239, 68, 68, 0.2)",
                borderTop: "2px dashed #ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ef4444",
                fontSize: 32,
                fontWeight: "bold",
            }}>
                BOTTOM SAFE AREA (400px)
            </div>

            {/* 右側アクションボタンエリア (160px) */}
            <div style={{
                position: "absolute",
                right: 0,
                top: 250,
                bottom: 400,
                width: 160,
                backgroundColor: "rgba(234, 179, 8, 0.15)",
                borderLeft: "2px dashed #eab308",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                writingMode: "vertical-rl",
                color: "#eab308",
                fontSize: 24,
                fontWeight: "bold",
            }}>
                RIGHT UI AREA (160px)
            </div>

            {/* 中央のユニバーサル・セーフゾーン */}
            <div style={{
                position: "absolute",
                top: 250,
                bottom: 400,
                left: 60,
                right: 160,
                border: "2px solid #22c55e",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "flex-start",
                padding: 20,
                color: "#22c55e",
                fontSize: 24,
                fontWeight: "bold",
            }}>
                SAFE ZONE (Inner)
            </div>
        </AbsoluteFill>
    );
};
