import React from "react";
import { AbsoluteFill } from "remotion";

import {
  BRAND,
  COLOR_SCHEMES,
  FONT,
  RADIUS,
  SPACING,
  type ThemeName,
} from "../../themes/brand";
import { formatValueWithPrecision } from "@stats47/utils";
import type { RankingEntry, RankingMeta } from "../../types/ranking";
import type { ChoroplethPathInfo } from "../../utils/choropleth";
import { ChoroplethMapSvg } from "./ChoroplethMapSvg";

interface ChoroplethMapStillProps {
  meta: RankingMeta;
  topEntries?: RankingEntry[];
  bottomEntries?: RankingEntry[];
  mapPaths?: ChoroplethPathInfo[];
  theme?: ThemeName;
  precision?: number;
  /** 表示用タイトル。指定時は meta.title を上書きする */
  displayTitle?: string;
  /** サムネイル用フックテキスト（地図左上に表示） */
  hookText?: string;
}

/**
 * コロプレス地図静止画 (1080x1080)
 *
 * 正方形フォーマット。タイトル・年度、上位3県・下位3県を地図と共に表示。
 * セーフエリア: 正方形はX・Instagramともにクロップなし。外周 48px の余白を確保。
 */
export const ChoroplethMapStill: React.FC<ChoroplethMapStillProps> = ({
  meta,
  topEntries,
  bottomEntries,
  mapPaths,
  theme = "light",
  precision = 0,
  displayTitle,
  hookText,
}) => {
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";

  const titleText = displayTitle || meta.title.replace(/^都道府県別/, "").replace(/ランキング$/, "").trim();

  const attrParts: string[] = [];
  if (meta.subtitle) attrParts.push(meta.subtitle);
  if (meta.demographicAttr) attrParts.push(meta.demographicAttr);
  if (meta.normalizationBasis) attrParts.push(meta.normalizationBasis);
  const subtitleText = attrParts.join("・");

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        color: colors.foreground,
        fontFamily: FONT.family,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          borderTop: `4px solid ${BRAND.primary}`,
          backgroundColor: colors.card,
          padding: `${SPACING.md}px ${SPACING.lg}px ${SPACING.sm}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: FONT.weight.bold,
            color: colors.muted,
            letterSpacing: 2,
          }}
        >
          {meta.yearName ? `${meta.yearName} 都道府県ランキング` : "都道府県ランキング"}
        </div>
        <div
          style={{
            fontSize: 46,
            fontWeight: FONT.weight.black,
            color: colors.foreground,
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          {titleText}
        </div>
        {subtitleText && (
          <div
            style={{
              fontSize: 22,
              fontWeight: FONT.weight.medium,
              color: colors.muted,
              backgroundColor: isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.05)",
              padding: "3px 16px",
              borderRadius: RADIUS.full,
              letterSpacing: 1,
            }}
          >
            {subtitleText}
          </div>
        )}
      </div>

      {/* メインエリア（地図 + カードオーバーレイ） */}
      <div
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* コロプレス地図（背面） */}
        <div
          style={{
            position: "absolute",
            top: -260,
            left: "52%",
            transform: "translateX(-50%) rotate(20deg)",
            zIndex: 0,
            width: 1400,
            height: 1400,
          }}
        >
          {mapPaths && mapPaths.length > 0 && (
            <ChoroplethMapSvg
              paths={mapPaths}
              width={1310}
              height={1310}
              viewBoxSize={1000}
              strokeColor={isDark ? "rgba(255,255,255,0.3)" : "#D1D5DB"}
              strokeWidth={isDark ? 0.6 : 0.8}
            />
          )}
        </div>

        {/* フックテキスト（左上） */}
        {hookText && (
          <div
            style={{
              position: "absolute",
              top: 24,
              left: 48,
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                backgroundColor: BRAND.danger,
                padding: "8px 24px",
                borderRadius: RADIUS.md,
                boxShadow: `0 8px 32px ${BRAND.danger}44`,
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: FONT.weight.black,
                  color: "#FFFFFF",
                  letterSpacing: 1,
                  whiteSpace: "nowrap",
                }}
              >
                {hookText}
              </div>
            </div>
          </div>
        )}

        {/* 上位3県カード（左下） */}
        {topEntries && topEntries.length > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: 24,
              left: 48,
              width: 420,
              zIndex: 10,
              backgroundColor: isDark
                ? "rgba(15, 23, 42, 0.9)"
                : "rgba(255, 255, 255, 0.92)",
              backdropFilter: "blur(20px)",
              borderRadius: RADIUS.xl,
              border: `1px solid ${colors.border}`,
              boxShadow: isDark
                ? "0 25px 50px -12px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.06)"
                : "0 20px 25px -5px rgba(0,0,0,0.06), 0 10px 10px -5px rgba(0,0,0,0.03)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: `12px ${SPACING.md}px`,
                borderBottom: `1px solid ${colors.border}`,
                fontSize: 22,
                fontWeight: FONT.weight.bold,
                color: colors.muted,
                textAlign: "center",
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(0,0,0,0.03)",
              }}
            >
              上位3県
            </div>
            <div
              style={{
                padding: `${SPACING.sm}px ${SPACING.md}px`,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {topEntries.slice(0, 3).map((entry) => (
                <div
                  key={entry.areaCode}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span
                      style={{
                        fontSize: 22,
                        fontWeight: FONT.weight.black,
                        width: 50,
                        flexShrink: 0,
                        color:
                          entry.rank === 1
                            ? BRAND.secondary
                            : entry.rank === 2
                              ? colors.muted
                              : BRAND.primary,
                      }}
                    >
                      {entry.rank}位
                    </span>
                    <span
                      style={{
                        fontSize: 30,
                        fontWeight: FONT.weight.bold,
                        color: colors.foreground,
                      }}
                    >
                      {entry.areaName}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        fontSize: 28,
                        fontWeight: FONT.weight.black,
                        color: colors.foreground,
                      }}
                    >
                      {formatValueWithPrecision(entry.value, precision)}
                    </span>
                    <span
                      style={{
                        fontSize: 18,
                        color: colors.muted,
                        marginLeft: 4,
                        fontWeight: FONT.weight.medium,
                      }}
                    >
                      {meta.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 下位3県カード（右下） */}
        {bottomEntries && bottomEntries.length > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: 24,
              right: 48,
              width: 420,
              zIndex: 10,
              backgroundColor: isDark
                ? "rgba(15, 23, 42, 0.9)"
                : "rgba(255, 255, 255, 0.92)",
              backdropFilter: "blur(20px)",
              borderRadius: RADIUS.xl,
              border: `1px solid ${colors.border}`,
              boxShadow: isDark
                ? "0 25px 50px -12px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.06)"
                : "0 20px 25px -5px rgba(0,0,0,0.06), 0 10px 10px -5px rgba(0,0,0,0.03)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: `12px ${SPACING.md}px`,
                borderBottom: `1px solid ${colors.border}`,
                fontSize: 22,
                fontWeight: FONT.weight.bold,
                color: colors.muted,
                textAlign: "center",
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(0,0,0,0.03)",
              }}
            >
              下位3県
            </div>
            <div
              style={{
                padding: `${SPACING.sm}px ${SPACING.md}px`,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {bottomEntries.slice(0, 3).map((entry) => (
                <div
                  key={entry.areaCode}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span
                      style={{
                        fontSize: 22,
                        fontWeight: FONT.weight.black,
                        width: 50,
                        flexShrink: 0,
                        color: BRAND.danger,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {entry.rank}位
                    </span>
                    <span
                      style={{
                        fontSize: 30,
                        fontWeight: FONT.weight.bold,
                        color: colors.foreground,
                      }}
                    >
                      {entry.areaName}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        fontSize: 28,
                        fontWeight: FONT.weight.black,
                        color: colors.foreground,
                      }}
                    >
                      {formatValueWithPrecision(entry.value, precision)}
                    </span>
                    <span
                      style={{
                        fontSize: 18,
                        color: colors.muted,
                        marginLeft: 4,
                        fontWeight: FONT.weight.medium,
                      }}
                    >
                      {meta.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* フッター ブランドバー */}
      <div
        style={{
          backgroundColor: isDark ? colors.card : "#F1F5F9",
          borderTop: `1px solid ${colors.border}`,
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: FONT.weight.black,
            color: BRAND.primary,
            letterSpacing: 1,
          }}
        >
          stats47.jp
        </div>
        <div style={{ width: 1, height: 16, backgroundColor: colors.border }} />
        <div
          style={{
            fontSize: 20,
            fontWeight: FONT.weight.medium,
            color: colors.muted,
            letterSpacing: 1,
          }}
        >
          統計で見る都道府県
        </div>
      </div>
    </AbsoluteFill>
  );
};
