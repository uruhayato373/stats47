import React from "react";
import { renderAll47TileSvg } from "../data-cards/all47-svg";
import { useBuzzMapFonts } from "../buzz-map/useBuzzMapFonts";
import type { MapCarouselData } from "./types";

/** 旧 topbottom スライド名を保ち、今後は全47地域を描く。公開済みの画像には触れない。 */
export const MapTopBottomSlide: React.FC<{ data: MapCarouselData }> = ({ data }) => {
  useBuzzMapFonts();
  const svg = renderAll47TileSvg(data.tiles.map(r => ({
    areaCode: `${r.prefCode2}000`, areaName: r.areaName, value: r.value,
  })), {
    title: data.label, year: `${data.year}年`, unit: data.unit, source: data.source,
    capitalCities: /県庁所在市/.test(data.scopeNote || data.subtitle || ""),
    note: [data.subtitle, data.scopeNote].filter(Boolean).join("／"),
  });
  return <div style={{ width: 1080, height: 1350 }} dangerouslySetInnerHTML={{ __html: svg }} />;
};
