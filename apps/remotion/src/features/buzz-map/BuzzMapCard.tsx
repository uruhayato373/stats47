import React from "react";
import { AbsoluteFill } from "remotion";

import type { BuzzMapGeo } from "./geo";
import {
  BUZZ_MAP_COLORS,
  BUZZ_MAP_FONT,
  BUZZ_MAP_RAMP,
  type BuzzMapRatio,
} from "./tokens";
import type { BuzzMapSpec } from "./types";

export interface BuzzMapSummaryEntry {
  label: string;
  name: string;
  value: string;
}

interface BuzzMapCardProps {
  spec: BuzzMapSpec;
  geo: BuzzMapGeo;
  ratio: BuzzMapRatio;
  /** code → fill色。未定義コードは land */
  fillFor: (code: string) => string;
  /** 型B/D: 年カウンター表示（例 "1998年"） */
  yearLabel?: string;
  /** 型B: ラスト静止のサマリー行 */
  summary?: BuzzMapSummaryEntry[];
  /** 型D: この年以下の線のみ描画（未指定=全線）。静止画の年指定にも使う */
  year?: number;
}

const C = BUZZ_MAP_COLORS;

/**
 * バズ地図カードの共通レイアウト
 *
 * ①タイトル(左上) ②出典(右上極小) ③沖縄インセット ④凡例カード(右下・件数必須)
 * ⑤ブランド行(左下) ＋ 型Bのみ 年カウンター(右の海域)。
 * 仕様の正本: .claude/rules/buzz-map-standards.md
 */
export const BuzzMapCard: React.FC<BuzzMapCardProps> = ({
  spec,
  geo,
  ratio,
  fillFor,
  yearLabel,
  summary,
  year,
}) => {
  const { width: W, height: H } = geo;
  // 1080 基準のフォントスケール
  const s = Math.min(W, H) / 1080;
  const isMuni = spec.level.startsWith("muni");
  const strokeWidth = isMuni ? 0.4 * s : 1.1 * s;

  const titleLines = spec.titleLines?.length ? spec.titleLines : [spec.title];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.sea,
        color: C.ink,
        fontFamily: BUZZ_MAP_FONT.family,
      }}
    >
      {/* 地図 */}
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
      >
        {geo.mainland.map((p) => (
          <path
            key={`m-${p.code}`}
            d={p.d}
            fill={fillFor(p.code)}
            stroke={C.landLine}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        ))}
        {geo.prefBorders?.map((p) => (
          <path
            key={`b-${p.code}`}
            d={p.d}
            fill="none"
            stroke={C.landLine}
            strokeWidth={1.4 * s}
            strokeLinejoin="round"
          />
        ))}
        {geo.insetBox && (
          <>
            <rect
              x={geo.insetBox.x - 6 * s}
              y={geo.insetBox.y - 34 * s}
              width={geo.insetBox.width + 12 * s}
              height={geo.insetBox.height + 42 * s}
              rx={12 * s}
              fill="none"
              stroke={C.landLine}
              strokeWidth={1.5 * s}
            />
            <text
              x={geo.insetBox.x + 4 * s}
              y={geo.insetBox.y - 10 * s}
              fontSize={22 * s}
              fill={C.ink2}
            >
              沖縄・南西諸島
            </text>
          </>
        )}
        {geo.inset?.map((p) => (
          <path
            key={`i-${p.code}`}
            d={p.d}
            fill={fillFor(p.code)}
            stroke={C.landLine}
            strokeWidth={isMuni ? 0.4 * s : 0.9 * s}
            strokeLinejoin="round"
          />
        ))}
        {/* 型C: 点プロット（白地図の上に accent 色の点） */}
        {geo.points?.map((pt, i) => (
          <circle
            key={`p-${i}`}
            cx={pt.x}
            cy={pt.y}
            r={(spec.pointRadius ?? 4) * s}
            fill={resolveFill("accent", spec)}
            fillOpacity={0.82}
            stroke={C.sea}
            strokeWidth={0.6 * s}
          />
        ))}
        {/* 型D: 線ネットワーク（白地図の上に accent 色の線）。year 指定時はその年以下のみ */}
        {geo.lines
          ?.filter((ln) => year === undefined || ln.year === null || ln.year <= year)
          .map((ln, i) => (
            <path
              key={`l-${i}`}
              d={ln.d}
              fill="none"
              stroke={resolveFill("accent", spec)}
              strokeWidth={(spec.lineWidth ?? 2) * s}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
      </svg>

      {/* ① タイトルブロック（左上） */}
      <div
        style={{
          position: "absolute",
          top: 0.035 * H,
          left: 0.05 * W,
          width: ratio === "169" ? 0.52 * W : 0.64 * W,
        }}
      >
        <div
          style={{
            fontSize: 52 * s,
            fontWeight: 700,
            lineHeight: 1.28,
            letterSpacing: "0.01em",
          }}
        >
          {titleLines.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
        <div
          style={{
            marginTop: 8 * s,
            fontSize: 24 * s,
            color: C.ink2,
            lineHeight: 1.5,
          }}
        >
          {spec.subtitle}
        </div>
      </div>

      {/* ② 出典（右上・極小） */}
      <div
        style={{
          position: "absolute",
          top: 0.028 * H,
          right: 0.036 * W,
          maxWidth: 0.26 * W,
          textAlign: "right",
          fontSize: 19 * s,
          lineHeight: 1.55,
          color: C.ink2,
        }}
      >
        {spec.source.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>

      {/* 型B/D: 年カウンター（右の海域）。サマリー表示中は上へ避ける */}
      {(spec.type === "B" || spec.type === "D") && yearLabel && (
        <div
          style={{
            position: "absolute",
            right: 0.045 * W,
            bottom:
              (ratio === "916" ? 0.3 : 0.25) * H +
              (summary && summary.length > 0 ? 0.1 * H : 0),
            fontSize: 104 * s,
            fontWeight: 700,
            lineHeight: 1,
            color: C.ink,
            opacity: 0.88,
            fontFamily: BUZZ_MAP_FONT.familyNum,
            textShadow: `0 0 ${8 * s}px ${C.sea}, 0 0 ${18 * s}px ${C.sea}, 0 0 ${28 * s}px ${C.sea}`,
          }}
        >
          {yearLabel}
        </div>
      )}

      {/* 型B: ラスト静止サマリー */}
      {summary && summary.length > 0 && (
        <div
          style={{
            position: "absolute",
            right: 0.036 * W,
            bottom: 0.245 * H,
            backgroundColor: C.legendBg,
            border: `2px solid ${C.legendBorder}`,
            borderRadius: 16 * s,
            padding: `${14 * s}px ${22 * s}px`,
            display: "flex",
            flexDirection: "column",
            gap: 6 * s,
          }}
        >
          {summary.map((row) => (
            <div
              key={row.label}
              style={{ display: "flex", alignItems: "baseline", gap: 12 * s }}
            >
              <span style={{ fontSize: 20 * s, color: C.ink2 }}>{row.label}</span>
              <span style={{ fontSize: 26 * s, fontWeight: 700 }}>{row.name}</span>
              <span
                style={{
                  fontSize: 26 * s,
                  fontWeight: 700,
                  fontFamily: BUZZ_MAP_FONT.familyNum,
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ④ 凡例カード（右下） */}
      <div
        style={{
          position: "absolute",
          right: 0.036 * W,
          bottom: 0.032 * H,
          minWidth: 0.32 * W,
          backgroundColor: C.legendBg,
          border: `2px solid ${C.legendBorder}`,
          borderRadius: 16 * s,
          padding: `${16 * s}px ${24 * s}px`,
        }}
      >
        <div
          style={{
            fontSize: 20 * s,
            color: C.ink2,
            letterSpacing: "0.04em",
            borderBottom: `1px solid ${C.legendBorder}`,
            paddingBottom: 9 * s,
            marginBottom: 11 * s,
          }}
        >
          {spec.type === "B" && spec.ramp ? spec.ramp.legendTitle : spec.legend.title}
        </div>

        {(spec.type === "A" || spec.type === "C" || spec.type === "D") &&
          spec.legend.rows?.map((row) => (
            <div
              key={row.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14 * s,
                padding: `${4 * s}px 0`,
                fontSize: 24 * s,
              }}
            >
              <span
                style={{
                  width: 22 * s,
                  // 型C=点(円) / 型D=線(横バー) / 型A=区分(四角)
                  height: (spec.type === "D" ? 7 : 22) * s,
                  borderRadius: spec.type === "C" ? "50%" : (spec.type === "D" ? 3 : 6) * s,
                  flex: "none",
                  border: `1px solid rgba(13,54,107,.18)`,
                  backgroundColor: resolveFill(row.fill, spec),
                }}
              />
              <span>{row.label}</span>
              <span
                style={{
                  marginLeft: "auto",
                  paddingLeft: 24 * s,
                  fontWeight: 700,
                  fontFamily: BUZZ_MAP_FONT.familyNum,
                }}
              >
                {row.count}
              </span>
            </div>
          ))}

        {spec.type === "B" && spec.ramp && (
          <>
            <div
              style={{
                height: 18 * s,
                borderRadius: 9 * s,
                border: `1px solid rgba(13,54,107,.18)`,
                background: `linear-gradient(90deg, ${BUZZ_MAP_RAMP.join(",")})`,
                marginBottom: 6 * s,
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 19 * s,
                color: C.ink2,
                fontFamily: BUZZ_MAP_FONT.familyNum,
              }}
            >
              {spec.ramp.ticks.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ⑤ ブランド行（左下） */}
      <div
        style={{
          position: "absolute",
          left: 0.045 * W,
          bottom: 0.032 * H,
          fontSize: 24 * s,
          letterSpacing: "0.06em",
          color: C.ink2,
          display: "flex",
          alignItems: "baseline",
          gap: 12 * s,
        }}
      >
        <span style={{ fontWeight: 700, color: C.ink }}>stats47.jp</span>
        <span style={{ fontSize: 20 * s }}>統計で見る都道府県</span>
      </div>
    </AbsoluteFill>
  );
};

/** 凡例・データの fill トークン（accent / accent2 / land / 生hex）を解決する */
export function resolveFill(token: string, spec: BuzzMapSpec): string {
  if (token === "accent") {
    return spec.accent === "infra" ? C.accentInfra : C.accentSocial;
  }
  if (token === "accent2") {
    return spec.accent === "infra" ? C.accentSocial : C.accentInfra;
  }
  if (token === "land") return C.land;
  return token;
}
