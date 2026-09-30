import React from "react";
import { AbsoluteFill, Img } from "remotion";

import { BRAND, FONT } from "@/shared/themes/brand";
import { ChoroplethMapSvg } from "@/shared/components/maps/ChoroplethMapSvg";
import { NoteLegend, formatNoteValue, resolveNoteData, useNoteMapPaths, type NoteImageProps } from "./note-common";

const MAP_BOX = { width: 700, height: 630 };
const RANK_COLOR: Record<number, string> = { 1: "#D99A00", 2: "#8A94A6", 3: "#B4692B" };

/** 左カラム幅 490px (地図の枠は x=560 から) に 1 行で収まる大きさ (10 字まで)。それより長い題は 48px で 2 行に折り返す */
function titleFontSize(title: string): number {
  const len = [...title].length;
  return len <= 10 ? Math.min(78, Math.floor(480 / len)) : 48;
}

/**
 * note カバー画像 (1280x670)
 *
 * 左に見出し・問い・上位3県・凡例、右に地図を隠さず全面表示する。
 * 旧デザインは地図の上にタイトルカードを重ねていたため、地図の大半が見えなかった。
 */
export const NoteCover: React.FC<NoteImageProps> = (props) => {
  const { meta, entries, precision, mean, min, max } = resolveNoteData(props);
  const palette = props.colorScheme;
  const paths = useNoteMapPaths(entries, palette, { ...MAP_BOX, padding: 6 });
  const title = props.displayTitle ?? meta.title;
  const yearLabel = meta.yearName ? `${meta.yearName} 都道府県ランキング` : "都道府県ランキング";

  return (
    <AbsoluteFill style={{ backgroundColor: "#F8FAFC", fontFamily: FONT.family, color: "#0F172A", overflow: "hidden" }}>
      {/* 生成 AI の背景 (任意)。文字は載せない前提の絵を、左の文字列が読めるよう白で覆う */}
      {props.backgroundImage && (
        <>
          <Img src={props.backgroundImage} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(248,250,252,0.94) 0%, rgba(248,250,252,0.9) 42%, rgba(248,250,252,0.35) 100%)" }} />
        </>
      )}
      <div style={{ position: "absolute", left: 56, top: 40, fontSize: 28, fontWeight: FONT.weight.black, color: BRAND.primary }}>stats47</div>

      <div style={{ position: "absolute", left: 56, top: 96, width: 490 }}>
        <div style={{ fontSize: 26, fontWeight: FONT.weight.bold, color: BRAND.primary, letterSpacing: "0.08em" }}>{yearLabel}</div>
        <div style={{ fontSize: titleFontSize(title), fontWeight: FONT.weight.black, lineHeight: 1.12, marginTop: 10 }}>{title}</div>
        {props.hookText && (
          <div style={{ fontSize: 28, fontWeight: FONT.weight.bold, color: "#334155", marginTop: 18, lineHeight: 1.35 }}>{props.hookText}</div>
        )}
      </div>

      <div style={{ position: "absolute", left: 56, top: 372, width: 500, display: "flex", flexDirection: "column", gap: 10 }}>
        {entries.slice(0, 3).map((e) => (
          <div
            key={e.areaCode}
            style={{ display: "flex", alignItems: "center", backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 14, padding: "8px 18px", boxShadow: "0 2px 6px rgba(15,23,42,0.06)" }}
          >
            <span style={{ width: 44, fontSize: 32, fontWeight: FONT.weight.black, color: RANK_COLOR[e.rank] }}>{e.rank}</span>
            <span style={{ flex: 1, fontSize: 26, fontWeight: FONT.weight.bold }}>{e.areaName}</span>
            <span style={{ fontSize: 28, fontWeight: FONT.weight.black, color: BRAND.primary }}>{formatNoteValue(e.value, precision)}</span>
            {meta.unit && <span style={{ fontSize: 16, fontWeight: FONT.weight.bold, color: "#64748B", marginLeft: 4 }}>{meta.unit}</span>}
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", left: 56, top: 574 }}>
        <NoteLegend min={min} max={max} mean={mean} unit={meta.unit} precision={precision} palette={palette} width={500} fontSize={15} />
      </div>

      <div style={{ position: "absolute", left: 560, top: 20, width: MAP_BOX.width, height: MAP_BOX.height, borderRadius: 24, backgroundColor: props.backgroundImage ? "rgba(238,242,247,0.9)" : "#EEF2F7", border: "1px solid #E2E8F0" }}>
        {paths && <ChoroplethMapSvg paths={paths} width={MAP_BOX.width} height={MAP_BOX.height} strokeColor="#FFFFFF" strokeWidth={0.8} />}
      </div>
    </AbsoluteFill>
  );
};
