import React from "react";
import { AbsoluteFill } from "remotion";

import { BRAND, FONT } from "@/shared/themes/brand";
import { formatNoteValue, rankColor, resolveNoteData, shortPrefName, type NoteImageProps } from "./note-common";

const W = 1200;
const H = 630;
const PLOT = { left: 64, right: 24, top: 150, bottom: 96 };

/**
 * 全47都道府県の順位バー (1200x630)。旧デザインは上位・下位5県だけだった。
 * 色は地図と同じスケール、点線は本文の全国平均、上位3・下位3の値を注記する。
 */
export const NoteBarChart: React.FC<NoteImageProps> = (props) => {
  const { meta, entries, precision, mean, min, max } = resolveNoteData(props);
  const title = props.displayTitle ?? meta.title;
  const plotW = W - PLOT.left - PLOT.right;
  const plotH = H - PLOT.top - PLOT.bottom;
  const slot = plotW / entries.length;
  const barW = slot * 0.72;
  const domainMin = Math.min(0, min);
  const y = (v: number) => PLOT.top + plotH - ((v - domainMin) / (max - domainMin || 1)) * plotH;
  // 値ラベルは 1 位と最下位だけ。隣り合う棒 (幅 24px) に 3 桁の数値を並べると重なって読めない
  const highlight = new Set([0, entries.length - 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#FFFFFF", fontFamily: FONT.family, color: "#0F172A" }}>
      <div style={{ borderTop: `4px solid ${BRAND.primary}`, backgroundColor: "#F8FAFC", height: 118, textAlign: "center", paddingTop: 10 }}>
        <div style={{ fontSize: 22, fontWeight: FONT.weight.bold, color: "#64748B", letterSpacing: 2 }}>
          {meta.yearName ? `${meta.yearName} 都道府県ランキング` : "都道府県ランキング"}
        </div>
        <div style={{ fontSize: 44, fontWeight: FONT.weight.black, lineHeight: 1.25 }}>{title}</div>
      </div>

      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
        <line x1={PLOT.left} x2={W - PLOT.right} y1={y(domainMin)} y2={y(domainMin)} stroke="#CBD5E1" />
        {entries.map((e, i) => {
          const x = PLOT.left + slot * i + (slot - barW) / 2;
          const top = y(e.value);
          return (
            <g key={e.areaCode}>
              <rect x={x} y={top} width={barW} height={Math.max(1, y(domainMin) - top)} fill={rankColor(e.rank, props.colorScheme)} rx={2} />
              {highlight.has(i) && (
                <text x={x + barW / 2} y={top - 8} textAnchor="middle" fontSize={17} fontWeight={800} fill="#0F172A">
                  {formatNoteValue(e.value, precision)}
                </text>
              )}
              <text
                x={x + barW / 2}
                y={y(domainMin) + 10}
                fontSize={15}
                fontWeight={600}
                fill="#334155"
                writingMode="vertical-rl"
                style={{ writingMode: "vertical-rl" }}
              >
                {shortPrefName(e.areaName)}
              </text>
            </g>
          );
        })}
        <line x1={PLOT.left} x2={W - PLOT.right} y1={y(mean)} y2={y(mean)} stroke="#0F172A" strokeWidth={1.5} strokeDasharray="6 5" />
        <text x={W - PLOT.right - 4} y={y(mean) - 8} textAnchor="end" fontSize={18} fontWeight={800} fill="#0F172A">
          平均 {formatNoteValue(mean, precision)}{meta.unit ? ` ${meta.unit}` : ""}
        </text>
      </svg>

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 10, textAlign: "center", fontSize: 18, color: "#64748B" }}>
        <span style={{ fontWeight: FONT.weight.black, color: BRAND.primary }}>stats47.jp</span>
        <span style={{ margin: "0 10px", opacity: 0.4 }}>|</span>
        <span>統計で見る都道府県 ・ 単位: {meta.unit || "—"} ・ 1位 → 47位</span>
      </div>
    </AbsoluteFill>
  );
};
