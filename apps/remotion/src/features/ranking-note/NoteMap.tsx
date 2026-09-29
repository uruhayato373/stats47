import React from "react";
import { AbsoluteFill } from "remotion";

import { BRAND, FONT } from "@/shared/themes/brand";
import { ChoroplethMapSvg } from "@/shared/components/maps/ChoroplethMapSvg";
import { NoteLegend, formatNoteValue, resolveNoteData, useNoteMapPaths, type NoteImageProps } from "./note-common";

const MAP_BOX = { width: 1000, height: 560 };

/**
 * 記事内コロプレス地図 (1080x1080)。
 * 旧デザインには凡例がなく、色が何の値に対応するか読み取れなかった。凡例 (最小・平均・最大) と上位/下位3県を併記する。
 */
export const NoteMap: React.FC<NoteImageProps> = (props) => {
  const { meta, entries, precision, mean, min, max } = resolveNoteData(props);
  const palette = props.colorScheme;
  const paths = useNoteMapPaths(entries, palette, { ...MAP_BOX, padding: 6 });
  const title = props.displayTitle ?? meta.title;

  const card = (label: string, rows: typeof entries, accent: string) => (
    <div style={{ flex: 1, backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ backgroundColor: accent, color: "#FFFFFF", textAlign: "center", fontSize: 22, fontWeight: FONT.weight.bold, padding: "6px 0" }}>{label}</div>
      {rows.map((e) => (
        <div key={e.areaCode} style={{ display: "flex", alignItems: "center", padding: "8px 18px", fontSize: 26 }}>
          <span style={{ width: 70, fontWeight: FONT.weight.black, color: accent }}>{e.rank}位</span>
          <span style={{ flex: 1, fontWeight: FONT.weight.bold }}>{e.areaName}</span>
          <span style={{ fontWeight: FONT.weight.black }}>{formatNoteValue(e.value, precision)}</span>
          {meta.unit && <span style={{ fontSize: 16, color: "#64748B", marginLeft: 4 }}>{meta.unit}</span>}
        </div>
      ))}
    </div>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#F8FAFC", fontFamily: FONT.family, color: "#0F172A" }}>
      <div style={{ borderTop: `6px solid ${BRAND.primary}`, backgroundColor: "#FFFFFF", padding: "22px 40px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 26, fontWeight: FONT.weight.bold, color: "#64748B", letterSpacing: 2 }}>
          {meta.yearName ? `${meta.yearName} 都道府県ランキング` : "都道府県ランキング"}
        </div>
        <div style={{ fontSize: 50, fontWeight: FONT.weight.black, lineHeight: 1.2, marginTop: 4 }}>{title}</div>
      </div>

      <div style={{ position: "absolute", left: 40, top: 160, width: MAP_BOX.width, height: MAP_BOX.height, backgroundColor: "#EEF2F7", borderRadius: 20 }}>
        {paths && <ChoroplethMapSvg paths={paths} width={MAP_BOX.width} height={MAP_BOX.height} strokeColor="#FFFFFF" strokeWidth={0.9} />}
      </div>

      <div style={{ position: "absolute", left: 140, top: 730 }}>
        <NoteLegend min={min} max={max} mean={mean} unit={meta.unit} precision={precision} palette={palette} width={800} fontSize={20} />
      </div>

      <div style={{ position: "absolute", left: 40, right: 40, top: 815, display: "flex", gap: 24 }}>
        {card("上位3県", entries.slice(0, 3), BRAND.primary)}
        {card("下位3県", entries.slice(-3), "#DC2626")}
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 56, backgroundColor: "#EEF2F7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#475569" }}>
        <span style={{ fontWeight: FONT.weight.black, color: BRAND.primary }}>stats47.jp</span>
        <span style={{ margin: "0 12px", opacity: 0.4 }}>|</span>
        <span>統計で見る都道府県</span>
      </div>
    </AbsoluteFill>
  );
};
