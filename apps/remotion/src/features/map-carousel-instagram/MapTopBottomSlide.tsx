import React from "react";
import { renderAll47TileSvg } from "../data-cards/all47-svg";
import { resolveTileScale } from "../data-cards/tile-scale";
import { useBuzzMapFonts } from "../buzz-map/useBuzzMapFonts";
import type { MapCarouselData } from "./types";

/** 旧 topbottom スライド名を保ち、今後は全47地域を描く。公開済みの画像には触れない。 */
export const MapTopBottomSlide: React.FC<{ data: MapCarouselData }> = ({ data }) => {
  useBuzzMapFonts();
  const entries = data.tiles.map(r => ({
    areaCode: `${r.prefCode2}000`, areaName: r.areaName, value: r.value,
  }));
  // Same colours as the ranking page when props carry the item's encoding; otherwise brand blue.
  const scale = data.visualization
    ? resolveTileScale(data.visualization as Parameters<typeof resolveTileScale>[0], entries.map(e => e.value), data.valueDisplay)
    : undefined;
  const svg = renderAll47TileSvg(entries, {
    scale,
    title: data.label, year: `${data.year}年`, unit: data.unit, source: data.source,
    capitalCities: /県庁所在市/.test(data.scopeNote || data.subtitle || ""),
    // State the capital-city scope once: skip the scope note when the subtitle already says it.
    note: [data.subtitle, data.subtitle?.includes("県庁所在市") ? undefined : data.scopeNote].filter(Boolean).join("／"),
  });
  return <div style={{ width: 1080, height: 1350 }} dangerouslySetInnerHTML={{ __html: svg }} />;
};
