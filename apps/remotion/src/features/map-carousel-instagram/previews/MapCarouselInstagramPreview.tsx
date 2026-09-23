import React from "react";

import { useIgSeriesFonts } from "@/features/ig-series";
import mapSample from "@/fixtures/map-carousel-sample.json";

import { MapChoroplethSlide } from "../MapChoroplethSlide";
import { MapCoverSlide } from "../MapCoverSlide";
import { MapOutroSlide } from "../MapOutroSlide";
import { MapTopBottomSlide } from "../MapTopBottomSlide";
import { MapCarouselDataSchema, type MapCarouselData, type MapCarouselSlide } from "../types";

interface MapCarouselInstagramPreviewProps {
  slide?: MapCarouselSlide;
  data?: MapCarouselData;
}

/**
 * 地図カルーセル (4:5・4枚)
 *
 * `slide` で 表紙 → タイル地図 → 上位/下位5 → 締め を切り替える。
 * props (`data`) を省略すると build-ig-map-props.ts で実生成したサンプルで描画する。
 */
export const MapCarouselInstagramPreview: React.FC<MapCarouselInstagramPreviewProps> = ({
  slide = "cover",
  data,
}) => {
  useIgSeriesFonts();
  const resolved = MapCarouselDataSchema.parse(data ?? mapSample);

  switch (slide) {
    case "cover":
      return <MapCoverSlide data={resolved} />;
    case "choropleth":
      return <MapChoroplethSlide data={resolved} />;
    case "topbottom":
      return <MapTopBottomSlide data={resolved} />;
    case "outro":
      return <MapOutroSlide data={resolved} />;
  }
};
