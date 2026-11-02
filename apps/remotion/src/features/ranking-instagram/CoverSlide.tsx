import { resolveColorEncoding } from '@stats47/types';
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import * as chromatic from "d3-scale-chromatic";

import {
  BRAND,
  COLOR_SCHEMES,
  FONT,
  RADIUS,
  SPACING,
  type ThemeName,
} from "@/shared/themes/brand";
import type { RankingEntry, RankingMeta } from "@/shared/types/ranking";
import { SITE } from "@stats47/types";
import { to2DigitPrefCode } from "@stats47/area";
import { prefectureShortName } from "@stats47/area/short-name";
import { prefectureEntries, renderTileMapBody } from "../data-cards/all47-svg";
import { IMAGE_TILE_LAYOUT } from "../data-cards/tile-layout";

/** D3 の interpolator 関数名から関数を取得 */
function getInterpolator(name: string): (t: number) => string {
  const fn = (chromatic as Record<string, unknown>)[name];
  if (typeof fn === "function") return fn as (t: number) => string;
  return chromatic.interpolateBlues;
}

const SHORT_NAMES = new Map(prefectureEntries().map((e) => [e.areaCode, prefectureShortName(e.areaName)]));

interface CoverSlideProps {
  meta: RankingMeta;
  /** 全47都道府県のランキングデータ（タイル色分け用） */
  allEntries?: RankingEntry[];
  theme?: ThemeName;
  /** AI 生成フックテキスト（15文字以内） */
  hookText?: string;
  /** 表示用タイトル。指定時は meta.title を上書きする */
  displayTitle?: string;
  /** D3 カラースキーム名 */
  colorScheme?: string;
  /** カラースキームの種類 */
  colorSchemeType?: "sequential" | "diverging";
  /** diverging スケールの中間値 */
  divergingMidpointValue?: number;
}

// ---------------------------------------------------------------------------
// タイルマップシルエット用定数
// ---------------------------------------------------------------------------

const TILE_CELL = 56;
const tileSvgW = IMAGE_TILE_LAYOUT.cols * TILE_CELL;
const tileSvgH = IMAGE_TILE_LAYOUT.rows * TILE_CELL;

/** 都道府県コードを2桁に正規化 */
/** `@stats47/area` の単一実装 ("01000" / "13" / 1 → "01" / "13" / "01") */
const normalizePrefId = to2DigitPrefCode;

/**
 * カルーセル表紙スライド (1080x1350, 4:5)
 *
 * Instagram カルーセルの1枚目。
 * タイルマップシルエット + フックテキストで2枚目へのスワイプを誘導する。
 */
export const CoverSlide: React.FC<CoverSlideProps> = ({
  meta,
  allEntries,
  theme = "dark",
  hookText,
  displayTitle,
  colorScheme = "interpolateBlues",
  colorSchemeType,
  divergingMidpointValue,
}) => {
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";

  const title = displayTitle || meta.title;
  const line1 = meta.yearName
    ? `${meta.yearName} 都道府県ランキング`
    : "都道府県ランキング";
  const attrParts: string[] = [];
  if (meta.demographicAttr) attrParts.push(meta.demographicAttr);
  if (meta.normalizationBasis) attrParts.push(meta.normalizationBasis);
  const attrText = attrParts.join("・");

  const fallbackColor = isDark ? "#334155" : "#CBD5E1";

  // エントリデータがあれば d3 カラースケールで色分け
  const entryMap = useMemo(() => {
    if (!allEntries) return null;
    const map = new Map<string, RankingEntry>();
    for (const e of allEntries) {
      map.set(normalizePrefId(e.areaCode), e);
    }
    return map;
  }, [allEntries]);

  const getColor = useMemo(() => {
    if (!allEntries || allEntries.length === 0) return null;
    const values = allEntries.map((e) => e.value);
    const config = meta.presentation ?? {colorSchemeType, divergingMidpoint: divergingMidpointValue ?? 'zero'};
    return resolveColorEncoding(config, values, getInterpolator(meta.presentation?.colorScheme ?? colorScheme), '#e0e0e0').colorAtValue;
  }, [allEntries, colorScheme, colorSchemeType, divergingMidpointValue, meta.presentation]);

  // 共通のタイル地図 (data-cards/all47-svg.ts) に名前だけを載せる
  const tileSvg = useMemo(() => {
    const entries = prefectureEntries();
    const colorAt = (areaCode: string) => {
      const entry = entryMap?.get(normalizePrefId(areaCode));
      return entry && getColor ? getColor(entry.value) : fallbackColor;
    };
    return renderTileMapBody(entries, {
      width: tileSvgW,
      height: tileSvgH,
      showValues: false,
      tileOverride: (areaCode) => ({ fill: colorAt(areaCode), lines: [SHORT_NAMES.get(areaCode) ?? ""] }),
    }).svg;
  }, [entryMap, getColor, fallbackColor]);

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
      {/* 背景グロー */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${BRAND.primary}33 0%, transparent 70%)`,
          transform: "translate(-50%, -50%)",
          filter: "blur(120px)",
        }}
      />

      {/* ヘッダー */}
      <div
        style={{
          borderTop: `4px solid ${BRAND.primary}`,
          backgroundColor: colors.card,
          padding: `12px ${SPACING.lg}px 14px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          zIndex: 10,
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
          {line1}
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: FONT.weight.black,
            color: colors.foreground,
            letterSpacing: 1,
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
        {attrText && (
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
            {attrText}
          </div>
        )}
      </div>

      {/* メインコンテンツ */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: `${SPACING.md}px ${SPACING.lg}px`,
          zIndex: 10,
        }}
      >

        {/* タイルマップ（色分け + 都道府県名） */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flex: 1,
          }}
        >
          <svg
            viewBox={`0 0 ${tileSvgW} ${tileSvgH}`}
            width={tileSvgW * 1.0}
            height={tileSvgH * 1.0}
            dangerouslySetInnerHTML={{ __html: tileSvg }}
          />
        </div>

        {/* 下部テキスト */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            marginTop: "auto",
            paddingBottom: SPACING.sm,
          }}
        >
          {/* hookText（赤帯） */}
          {hookText && (
            <div
              style={{
                backgroundColor: BRAND.danger,
                padding: "14px 48px",
                borderRadius: RADIUS.md,
                boxShadow: `0 8px 32px ${BRAND.danger}44`,
              }}
            >
              <div
                style={{
                  fontSize: 44,
                  fontWeight: FONT.weight.black,
                  color: "#FFFFFF",
                  letterSpacing: 1,
                  textAlign: "center",
                }}
              >
                {hookText}
              </div>
            </div>
          )}

          {/* スワイプ誘導 */}
          <div
            style={{
              fontSize: 40,
              fontWeight: FONT.weight.bold,
              color: colors.muted,
              textAlign: "center",
            }}
          >
            あなたの県は何位？
          </div>
        </div>
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
          zIndex: 10,
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
          {SITE.domain}
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
          {meta.sourceLabel ? `出典：${meta.sourceLabel}` : SITE.name}
        </div>
      </div>
    </AbsoluteFill>
  );
};
