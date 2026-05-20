"use client";

import "leaflet/dist/leaflet.css";

import { TILE_OPTIONS_LIGHT } from "@stats47/visualization/leaflet/constants/tile-providers";
import { ImageOverlay, MapContainer, TileLayer } from "react-leaflet";


import { SUNSHINE_MAP_RASTER_PATH, type SunshineMapMeta } from "../lib/types";

const R2_PUBLIC_URL =
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://storage.stats47.jp";

interface Props {
  meta: SunshineMapMeta;
}

/** 1km メッシュ年日照時間のラスターを ImageOverlay で表示する地図本体。 */
export function SunshineMapLeaflet({ meta }: Props) {
  const tile = TILE_OPTIONS_LIGHT[0];
  const rasterUrl = `${R2_PUBLIC_URL}/${SUNSHINE_MAP_RASTER_PATH}`;

  return (
    <MapContainer
      center={[37.5, 137.5]}
      zoom={5}
      minZoom={4}
      maxZoom={11}
      scrollWheelZoom
      className="h-[460px] lg:h-[600px] rounded-md overflow-hidden"
    >
      <TileLayer url={tile.url} attribution={tile.attribution} />
      <ImageOverlay url={rasterUrl} bounds={meta.bounds} opacity={1} />
    </MapContainer>
  );
}
