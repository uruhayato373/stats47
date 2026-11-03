"use client";

import { ImageOverlay } from "react-leaflet";

import { LeafletMapFrame } from "@/components/charts/LeafletMapFrame";

import { R2_PUBLIC_BASE_URL } from "@/config/site";

import { SUNSHINE_MAP_RASTER_PATH, type SunshineMapMeta } from "../lib/types";

const R2_PUBLIC_URL =
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL || R2_PUBLIC_BASE_URL;

interface Props {
  meta: SunshineMapMeta;
}

/** 1km メッシュ年日照時間のラスターを ImageOverlay で表示する地図本体。 */
export function SunshineMapLeaflet({ meta }: Props) {
  const rasterUrl = `${R2_PUBLIC_URL}/${SUNSHINE_MAP_RASTER_PATH}`;

  return (
    <LeafletMapFrame ariaLabel="1kmメッシュの年間日照時間の地図" bounds={meta.bounds}>
      <ImageOverlay url={rasterUrl} bounds={meta.bounds} opacity={1} />
    </LeafletMapFrame>
  );
}
